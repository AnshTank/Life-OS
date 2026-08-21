"use client";

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

/**
 * RichTextEditor
 * ---------------
 * A contentEditable-based editor with macOS Notes–style list behavior:
 *  - Typing "- ", "* ", "1. ", or "[] " / "[ ] " at the start of a line
 *    auto-converts that line into a bullet / numbered / checkbox list item.
 *  - Enter inside a list continues the list with a new item of the same kind.
 *  - Enter on an EMPTY list item exits the list (same as Notes).
 *  - Tab / Shift+Tab indent / outdent the current list item (nested lists).
 *  - Clicking a checkbox toggles its checked state (strikethrough + dim).
 *  - Cmd/Ctrl+B / I toggle bold / italic via the browser's native selection
 *    formatting (execCommand — still the most reliable cross-browser way
 *    to do inline formatting in a contentEditable region).
 *
 * Content is stored & passed around as an HTML string (this.innerHTML),
 * not markdown. Use the htmlToMarkdown / markdownToHtml helpers exported
 * below to interop with anything that still expects plain markdown
 * (e.g. file export, or older notes saved before this editor existed).
 */

const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number, callback: (compressedDataUrl: string) => void) => {
  const img = new Image();
  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressed);
    } else {
      callback(dataUrl);
    }
  };
  img.onerror = () => {
    callback(dataUrl);
  };
  img.src = dataUrl;
};

/**
 * Style tokens for content this editor *generates*.
 *
 * These strings land inside `style="…"` attributes on nodes that get persisted
 * into `Note.content`, so they must survive a round-trip through the database.
 * `var()` resolves fine inside an inline style attribute, which lets saved HTML
 * pick up whatever the token layer currently says — retune the look in
 * `globals.css` under `.notes-suite` and old notes follow along. The second
 * argument is the fallback for the (unlikely) case this editor is mounted
 * outside that scope.
 */
const TOK = {
  line: 'var(--rte-divider, #d6d3d1)',
  accent: 'var(--rte-divider-accent, #e9a23b)',
  grad1: 'var(--rte-grad-1, #f59e0b)',
  grad2: 'var(--rte-grad-2, #ec4899)',
  grad3: 'var(--rte-grad-3, #3b82f6)',
  grad4: 'var(--rte-grad-4, #10b981)',
  imgBorder: 'var(--rte-border, #e8e8e5)',
  imgShadow: 'var(--rte-shadow, 0 1px 3px rgba(15, 23, 42, 0.06))',
  imgSurface: 'var(--rte-surface, #ffffff)',
  ink: 'var(--rte-ink, #1c1c1a)',
  danger: 'var(--rte-danger, #ef4444)',
} as const;

/** Pill tones, picked by hashing the pill's text. */
const PILL_TONES = [
  { bg: 'var(--rte-pill-1-bg, #ffedd5)', fg: 'var(--rte-pill-1-fg, #9a3412)' },
  { bg: 'var(--rte-pill-2-bg, #dbeafe)', fg: 'var(--rte-pill-2-fg, #1d4ed8)' },
  { bg: 'var(--rte-pill-3-bg, #d1fae5)', fg: 'var(--rte-pill-3-fg, #047857)' },
  { bg: 'var(--rte-pill-4-bg, #f3e8ff)', fg: 'var(--rte-pill-4-fg, #6b21a8)' },
] as const;

export interface RichTextEditorHandle {
  focus: () => void;
  exec: (command: string, value?: string) => void;
  insertHighlight: (colorClass: string) => void;
  insertTable: () => void;
  insertPill: (text: string) => void;
  insertSectionDivider: (style?: string) => void;
  getEl: () => HTMLDivElement | null;
  tableAddRow: (before: boolean) => void;
  tableAddColumn: (before: boolean) => void;
  tableDeleteRow: () => void;
  tableDeleteColumn: () => void;
  tableHighlightCell: (color: string) => void;
  tableDelete: () => void;
}

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  fontClass?: string;
  fontSize?: number;
  onImagePreview?: (data: { src: string; caption: string; cardId: string }) => void;
  onSelectionFormatsChange?: (formats: {
    bold: boolean;
    italic: boolean;
    ul: boolean;
    ol: boolean;
    inTable: boolean;
  }) => void;
}

const LIST_ITEM_TAG = 'LI';

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ html, onChange, placeholder, fontClass, fontSize = 16, onImagePreview, onSelectionFormatsChange }, ref) => {
    const elRef = useRef<HTMLDivElement>(null);
    const lastExternalHtml = useRef<string | null>(null);
    const isComposing = useRef(false);

    const getActiveTableCell = (): HTMLTableCellElement | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== elRef.current) {
        if (node.nodeType === 1 && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
          return node as HTMLTableCellElement;
        }
        node = node.parentNode;
      }
      return null;
    };

    useImperativeHandle(ref, () => ({
      focus: () => elRef.current?.focus(),
      exec: (command: string, value?: string) => {
        elRef.current?.focus();
        document.execCommand(command, false, value);
        emitChange();
      },
      insertHighlight: (bgStyle: string) => {
        elRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        document.execCommand('hiliteColor', false, bgStyle);
        emitChange();
      },
      insertTable: () => {
        elRef.current?.focus();
        // No inline styling: the `.rte-root table/td` rules in the <style> block
        // below own the look, so a table restyles with the token layer.
        const cell = '<td>&nbsp;</td>';
        const row = `<tr>${cell}${cell}</tr>`;
        document.execCommand('insertHTML', false, `<table><tbody>${row}${row}</tbody></table>`);
        emitChange();
      },
      insertPill: (text: string) => {
        elRef.current?.focus();
        const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const tone = PILL_TONES[hash % PILL_TONES.length];

        const pillHtml = `<span class="rte-pill" style="background-color: ${tone.bg}; color: ${tone.fg}; padding: 2px 8px; border-radius: 9999px; font-size: 0.8em; font-weight: 600; margin-left: 6px; display: inline-block;" contenteditable="false">${text}</span>&nbsp;`;
        document.execCommand('insertHTML', false, pillHtml);
        emitChange();
      },
      insertSectionDivider: (styleType = 'wavy') => {
        elRef.current?.focus();
        // `.rte-v2` marks this as token-driven markup so the legacy-divider
        // override in the <style> block below skips it.
        const open = '<div class="rte-divider-container rte-v2" contenteditable="false" style="margin: 20px 0; text-align: center;">';
        let rule = '';
        if (styleType === 'wavy') {
          rule = `<hr style="border: none; height: 10px; background: repeating-linear-gradient(45deg, ${TOK.line}, ${TOK.line} 4px, transparent 4px, transparent 8px); opacity: 0.55; border-radius: 4px;" />`;
        } else if (styleType === 'gradient') {
          rule = `<hr style="border: none; height: 4px; background: linear-gradient(90deg, ${TOK.grad1}, ${TOK.grad2}, ${TOK.grad3}, ${TOK.grad4}); border-radius: 4px;" />`;
        } else if (styleType === 'vintage') {
          rule = `<hr style="border: none; border-top: 2px double ${TOK.line}; border-bottom: 1px solid ${TOK.line}; height: 5px;" />`;
        } else if (styleType === 'stitched') {
          rule = `<hr style="border: none; border-top: 3px dotted ${TOK.accent};" />`;
        } else {
          rule = `<hr style="border: none; border-top: 3px dashed ${TOK.line};" />`;
        }
        document.execCommand('insertHTML', false, `${open}${rule}</div>`);
        emitChange();
      },
      getEl: () => elRef.current,
      tableAddRow: (before: boolean) => {
        const cell = getActiveTableCell();
        if (!cell) return;
        const tr = cell.closest('tr');
        if (!tr) return;
        const tbody = tr.parentNode;
        if (!tbody) return;

        const numCols = tr.cells.length;
        const newTr = document.createElement('tr');
        for (let i = 0; i < numCols; i++) {
          const newTd = document.createElement('td');
          // Unstyled on purpose — `.rte-root td` in the <style> block owns the look.
          newTd.innerHTML = "&nbsp;";
          newTr.appendChild(newTd);
        }

        if (before) {
          tbody.insertBefore(newTr, tr);
        } else {
          tbody.insertBefore(newTr, tr.nextSibling);
        }

        setTimeout(() => {
          const firstCell = newTr.cells[0];
          if (firstCell) placeCaretAtStart(firstCell);
          emitChange();
          updateSelectionFormats();
        }, 0);
      },
      tableAddColumn: (before: boolean) => {
        const cell = getActiveTableCell();
        if (!cell) return;
        const tr = cell.closest('tr');
        if (!tr) return;
        const table = tr.closest('table');
        if (!table) return;

        const cellIndex = Array.from(tr.cells).indexOf(cell);
        let activeNewCell: HTMLTableCellElement | null = null;

        const rows = Array.from(table.rows);
        rows.forEach(r => {
          const newTd = document.createElement('td');
          // Unstyled on purpose — `.rte-root td` in the <style> block owns the look.
          newTd.innerHTML = "&nbsp;";
          
          const targetCell = r.cells[cellIndex];
          if (before) {
            r.insertBefore(newTd, targetCell);
          } else {
            r.insertBefore(newTd, targetCell.nextSibling);
          }

          if (r === tr) {
            activeNewCell = newTd;
          }
        });

        setTimeout(() => {
          if (activeNewCell) placeCaretAtStart(activeNewCell);
          emitChange();
          updateSelectionFormats();
        }, 0);
      },
      tableDeleteRow: () => {
        const cell = getActiveTableCell();
        if (!cell) return;
        const tr = cell.closest('tr');
        if (!tr) return;
        const table = tr.closest('table');
        if (!table) return;

        if (table.rows.length <= 1) {
          table.remove();
        } else {
          const nextTr = tr.nextSibling as HTMLTableRowElement | null;
          const prevTr = tr.previousSibling as HTMLTableRowElement | null;
          const cellIndex = Array.from(tr.cells).indexOf(cell);

          tr.remove();

          const focusTr = nextTr || prevTr;
          if (focusTr) {
            const focusCell = focusTr.cells[Math.min(cellIndex, focusTr.cells.length - 1)];
            if (focusCell) placeCaretAtStart(focusCell);
          }
        }
        emitChange();
        updateSelectionFormats();
      },
      tableDeleteColumn: () => {
        const cell = getActiveTableCell();
        if (!cell) return;
        const tr = cell.closest('tr');
        if (!tr) return;
        const table = tr.closest('table');
        if (!table) return;

        const cellIndex = Array.from(tr.cells).indexOf(cell);

        if (tr.cells.length <= 1) {
          table.remove();
        } else {
          const rows = Array.from(table.rows);
          rows.forEach(r => {
            if (r.cells[cellIndex]) {
              r.cells[cellIndex].remove();
            }
          });

          const newCellIndex = Math.min(cellIndex, tr.cells.length - 1);
          const focusCell = tr.cells[newCellIndex];
          if (focusCell) placeCaretAtStart(focusCell);
        }
        emitChange();
        updateSelectionFormats();
      },
      tableHighlightCell: (color: string) => {
        const cell = getActiveTableCell();
        if (!cell) return;
        if (color === 'clear') {
          cell.style.backgroundColor = '';
        } else {
          cell.style.backgroundColor = color;
        }
        emitChange();
      },
      tableDelete: () => {
        const cell = getActiveTableCell();
        if (!cell) return;
        const table = cell.closest('table');
        if (table) {
          table.remove();
          emitChange();
          updateSelectionFormats();
        }
      },
    }));

    const emitChange = useCallback(() => {
      if (!elRef.current) return;
      const newHtml = elRef.current.innerHTML;
      lastExternalHtml.current = newHtml;
      onChange(newHtml);
    }, [onChange]);

    // Sync external html prop -> DOM only when it actually differs
    // (e.g. switching notes), never on every keystroke (that would
    // fight the cursor position).
    useEffect(() => {
      if (elRef.current && html !== lastExternalHtml.current) {
        elRef.current.innerHTML = html || '';
        lastExternalHtml.current = html || '';
      }
    }, [html]);

    // ---- List helpers --------------------------------------------------

    const getCurrentBlock = (): HTMLElement | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== elRef.current) {
        if (node.nodeType === 1) {
          const tag = (node as HTMLElement).tagName;
          if (['DIV', 'P', 'LI', 'H1', 'H2', 'H3'].includes(tag)) return node as HTMLElement;
        }
        node = node.parentNode;
      }
      return null;
    };

    const getCurrentListItem = (): HTMLLIElement | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== elRef.current) {
        if (node.nodeType === 1 && (node as HTMLElement).tagName === LIST_ITEM_TAG) {
          return node as HTMLLIElement;
        }
        node = node.parentNode;
      }
      return null;
    };

    const placeCaretAtStart = (el: Node) => {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    const placeCaretAtEnd = (el: Node) => {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    // Convert the current block's leading text (e.g. "- ", "1. ", "[] ")
    // into a real list, mirroring the matched text. Returns true if a
    // conversion happened.
    const tryAutoConvertToList = (): boolean => {
      const block = getCurrentBlock();
      if (!block || block.tagName === 'LI') return false;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;

      const text = block.textContent || '';
      const range = sel.getRangeAt(0);
      // Guard: only auto-convert when the caret sits in the block's first
      // text node (i.e. truly at the start of the line with no nested
      // formatting before it) — otherwise offsets would be relative to a
      // nested span instead of the whole block, giving false matches.
      if (range.startContainer !== block && range.startContainer !== block.firstChild) {
        return false;
      }
      const caretOffset = range.startOffset;
      const textBeforeCaret = text.slice(0, caretOffset);

      const bulletMatch = /^([-*])\s$/.exec(textBeforeCaret);
      const numberMatch = /^1\.\s$/.exec(textBeforeCaret);
      const checkMatch = /^\[\s?\]\s$/.exec(textBeforeCaret);

      if (!bulletMatch && !numberMatch && !checkMatch) return false;

      const matchedLen = textBeforeCaret.length;
      const remainder = text.slice(matchedLen);

      const listTag = numberMatch ? 'ol' : 'ul';
      const list = document.createElement(listTag);
      const li = document.createElement('li');
      if (checkMatch) {
        li.setAttribute('data-checked', 'false');
        li.classList.add('rte-checkbox-item');
      }
      li.textContent = remainder || '\u200B'; // zero-width space keeps li focusable when empty
      list.appendChild(li);

      block.replaceWith(list);
      placeCaretAtStart(li.firstChild || li);
      emitChange();
      return true;
    };

    const toggleChecklistItem = (li: HTMLLIElement) => {
      const checked = li.getAttribute('data-checked') === 'true';
      li.setAttribute('data-checked', checked ? 'false' : 'true');
      emitChange();
    };

    // ---- Keyboard handling ---------------------------------------------

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold');
        emitChange();
        return;
      }
      if (isMod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic');
        emitChange();
        return;
      }

      if (e.key === ' ') {
        // Defer so the space character is actually in the DOM when we inspect text
        setTimeout(() => { tryAutoConvertToList(); }, 0);
        return;
      }

      if (e.key === 'Tab') {
        const li = getCurrentListItem();
        if (li) {
          e.preventDefault();
          if (e.shiftKey) {
            document.execCommand('outdent');
          } else {
            document.execCommand('indent');
          }
          emitChange();
        }
        return;
      }

      if (e.key === 'Enter') {
        const li = getCurrentListItem();
        if (li) {
          const textOnly = (li.textContent || '').replace(/\u200B/g, '').trim();
          const isOnlyBreak = li.innerHTML.trim() === '<br>' || li.innerHTML.trim() === '';
          const isEmpty = textOnly === '' || isOnlyBreak;
          if (isEmpty) {
            // Exit the list, same UX as macOS Notes: empty item + Enter -> plain paragraph
            e.preventDefault();
            const list = li.parentElement;
            const p = document.createElement('div');
            p.innerHTML = '<br>';
            list?.parentElement?.insertBefore(p, list.nextSibling);
            li.remove();
            if (list && list.children.length === 0) list.remove();
            placeCaretAtStart(p);
            emitChange();
            return;
          }
          // Otherwise let the browser continue the list naturally, but if it's
          // a checkbox item, make sure the new li also gets the checkbox class.
          if (li.classList.contains('rte-checkbox-item')) {
            setTimeout(() => {
              const newLi = getCurrentListItem();
              if (newLi && newLi !== li) {
                newLi.classList.add('rte-checkbox-item');
                newLi.setAttribute('data-checked', 'false');
                emitChange();
              }
            }, 0);
          }
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
              const rawSrc = event.target?.result as string;
              if (rawSrc) {
                compressImage(rawSrc, 800, 800, (compressedSrc) => {
                  const cardId = 'img-card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                  const imageCardHtml = `
                    <div id="${cardId}" class="rte-image-card" contenteditable="false" draggable="true" style="display: inline-block; vertical-align: top; margin: 10px; border: 1px solid ${TOK.imgBorder}; box-shadow: ${TOK.imgShadow}; border-radius: 12px; background: ${TOK.imgSurface}; width: 260px; max-width: 100%; padding: 6px; box-sizing: border-box; position: relative;">
                      <div class="rte-image-wrapper" style="position: relative; width: 100%; height: auto; overflow: hidden; border: 1px solid ${TOK.imgBorder}; border-radius: 8px; display: block; background: ${TOK.imgSurface}; cursor: pointer;">
                        <img src="${compressedSrc}" class="rte-image-img" style="width: 100%; height: auto; max-height: 380px; object-fit: contain; display: block; border-radius: 8px;" title="Click to view & edit notes" />
                        <div class="rte-image-preview-badge" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 999px; backdrop-filter: blur(2px); pointer-events: none; display: flex; align-items: center; gap: 4px;">Preview</div>
                        <div class="rte-resize-handle" style="position: absolute; bottom: 3px; right: 3px; width: 10px; height: 10px; cursor: se-resize; background: ${TOK.ink}; border: 1px solid #fff; border-radius: 2px; z-index: 20;"></div>
                      </div>
                      <button class="rte-image-delete" style="position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: ${TOK.danger}; color: #fff; border: none; font-size: 11px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 20; box-shadow: ${TOK.imgShadow};">×</button>
                      <div class="rte-image-caption" contenteditable="true" style="margin-top: 6px; font-size: 12px; color: ${TOK.ink}; min-height: 20px; outline: none; padding: 2px 4px; border-radius: 4px;" placeholder="Write about this image..."></div>
                    </div>&nbsp;
                  `;
                  elRef.current?.focus();
                  document.execCommand('insertHTML', false, imageCardHtml);
                  emitChange();
                });
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('rte-resize-handle')) {
        e.preventDefault();
        e.stopPropagation();

        const wrapper = target.closest('.rte-image-wrapper') as HTMLElement;
        const card = target.closest('.rte-image-card') as HTMLElement;
        if (!wrapper || !card) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = wrapper.offsetWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const newWidth = Math.max(120, Math.min(800, startWidth + deltaX));
          wrapper.style.width = newWidth + 'px';
          card.style.width = newWidth + 'px';
        };

        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          emitChange();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('rte-image-delete')) {
        e.preventDefault();
        e.stopPropagation();
        const card = target.closest('.rte-image-card');
        if (card) {
          card.remove();
          emitChange();
        }
        return;
      }
      if (target.tagName === 'IMG' || target.classList.contains('rte-image-img') || target.classList.contains('rte-image-preview-badge') || (target.classList.contains('rte-image-wrapper') && !target.classList.contains('rte-resize-handle'))) {
        const card = target.closest('.rte-image-card');
        if (card && onImagePreview) {
          const img = card.querySelector('img');
          const caption = card.querySelector('.rte-image-caption');
          if (img) {
            onImagePreview({
              src: img.src,
              caption: caption?.textContent || '',
              cardId: card.id
            });
          }
        }
      }
      if (target.tagName === 'LI' && target.classList.contains('rte-checkbox-item')) {
        // Only toggle when clicking in the checkbox "gutter" (first ~22px),
        // so clicking into the text to edit it still places the caret normally.
        const rect = target.getBoundingClientRect();
        if (e.clientX - rect.left < 26) {
          e.preventDefault();
          toggleChecklistItem(target as HTMLLIElement);
        }
      }
      updateSelectionFormats();
    };

    const updateSelectionFormats = useCallback(() => {
      if (!onSelectionFormatsChange) return;
      const li = getCurrentListItem();
      let listType: 'ul' | 'ol' | null = null;
      if (li) {
        const parentTag = li.parentElement?.tagName.toLowerCase();
        listType = parentTag === 'ol' ? 'ol' : 'ul';
      }
      onSelectionFormatsChange({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        ul: listType === 'ul',
        ol: listType === 'ol',
        inTable: !!getActiveTableCell(),
      });
    }, [onSelectionFormatsChange]);

    return (
      <>
        <style jsx global>{`
          .rte-root:empty:before {
            content: attr(data-placeholder);
            color: var(--rte-ink-muted, #a3a29e);
            pointer-events: none;
          }
          /* Headings inherit the body font by default so the editor follows
             whichever face Style Lab picked; --rte-heading-font can override. */
          .rte-root h1 {
            font-family: var(--rte-heading-font, inherit);
            font-size: 1.6em;
            font-weight: 700;
            color: var(--rte-h1-ink, #1c1c1a);
            margin: 0.7em 0 0.3em;
          }
          .rte-root h2 {
            font-family: var(--rte-heading-font, inherit);
            font-size: 1.35em;
            font-weight: 700;
            color: var(--rte-h2-ink, #292524);
            margin: 0.6em 0 0.25em;
            border-bottom: 1px solid var(--rte-border, #e8e8e5);
            padding-bottom: 0.15em;
          }
          .rte-root h3 {
            font-family: var(--rte-heading-font, inherit);
            font-size: 1.15em;
            font-weight: 700;
            color: var(--rte-h2-ink, #292524);
            margin: 0.5em 0 0.2em;
          }
          .rte-root ul,
          .rte-root ol {
            margin: 0.25em 0 0.25em 1.4em;
            padding: 0;
          }
          .rte-root ul {
            list-style: disc;
          }
          .rte-root ol {
            list-style: decimal;
          }
          .rte-root li {
            margin: 0.15em 0;
            padding-left: 0.15em;
          }
          .rte-root li::marker {
            color: var(--rte-marker, #a3a29e);
          }
          .rte-root mark {
            padding: 1px 5px;
            border-radius: 4px;
          }
          /* Checklist items render as real checkboxes via ::before,
             matching macOS Notes — checked items get a strike + dim. */
          .rte-root li.rte-checkbox-item {
            list-style: none;
            margin-left: -1.4em;
            padding-left: 1.6em;
            position: relative;
            cursor: default;
          }
          .rte-root li.rte-checkbox-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.2em;
            width: 15px;
            height: 15px;
            border: 1.5px solid var(--rte-hairline-strong, #dedcd8);
            border-radius: 4px;
            background: var(--rte-surface, #ffffff);
            cursor: pointer;
            transition: background 0.12s, border-color 0.12s;
          }
          .rte-root li.rte-checkbox-item[data-checked='true']::before {
            background: var(--rte-ink, #1c1c1a);
            border-color: var(--rte-ink, #1c1c1a);
          }
          .rte-root li.rte-checkbox-item[data-checked='true']::after {
            content: '';
            position: absolute;
            left: 5px;
            top: 0.45em;
            width: 5px;
            height: 9px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
            pointer-events: none;
          }
          .rte-root li.rte-checkbox-item[data-checked='true'] {
            color: var(--rte-ink-muted, #a3a29e);
            text-decoration: line-through;
            text-decoration-color: var(--rte-hairline-strong, #dedcd8);
          }
          .rte-root span.rte-pill {
            box-shadow: var(--rte-pill-shadow, none);
            user-select: none;
            /* Pills saved before the redesign carry an inline pastel border. */
            border: none !important;
          }
          .rte-root table {
            border-collapse: collapse;
            border: 1px solid var(--rte-border, #e8e8e5);
            margin: 10px 0;
            width: 100%;
          }
          .rte-root th,
          .rte-root td {
            border: 1px solid var(--rte-border, #e8e8e5);
            padding: 8px;
            min-width: 40px;
          }
          .rte-root th {
            background-color: var(--rte-table-head, #fafaf9);
            font-weight: 600;
          }
          /* Legacy tables carry border-[#2d2d2d] utility classes rather than
             inline styles, so the rules above already win on specificity — no
             !important needed, which keeps inline cell fills working. */

          /* Dividers written before the redesign hard-coded #2d2d2d inline.
             New ones are tagged .rte-v2 so this only rewrites the old ones and
             leaves the stitched variant's accent colour alone. */
          .rte-root .rte-divider-container:not(.rte-v2) hr {
            border-color: var(--rte-divider, #d6d3d1) !important;
          }
          .rte-root .rte-image-card {
            user-select: none;
            width: 280px !important;
            max-width: 100% !important;
            height: auto !important;
            /* !important so image cards persisted with the old hard border and
               offset shadow follow the token layer too. */
            border: 1px solid var(--rte-border, #e8e8e5) !important;
            border-radius: 12px !important;
            background: var(--rte-surface, #ffffff) !important;
            box-shadow: var(--rte-shadow, 0 1px 3px rgba(15, 23, 42, 0.06)) !important;
          }
          .rte-root .rte-image-wrapper {
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: 1px solid var(--rte-border, #e8e8e5) !important;
            border-radius: 8px !important;
            background: var(--rte-surface, #ffffff) !important;
          }
          .rte-root .rte-resize-handle {
            background: var(--rte-ink, #1c1c1a) !important;
          }
          /* Same story for the two chrome bits on legacy image cards. */
          .rte-root .rte-image-delete {
            border: none !important;
            background: var(--rte-danger, #ef4444) !important;
            box-shadow: var(--rte-shadow, 0 1px 3px rgba(15, 23, 42, 0.06)) !important;
            font-weight: 500 !important;
          }
          .rte-root .rte-image-preview-badge {
            background: rgba(0, 0, 0, 0.5) !important;
            border-radius: 999px !important;
            font-weight: 500 !important;
          }
          .rte-root .rte-image-img,
          .rte-root img {
            width: 100% !important;
            height: auto !important;
            max-height: 420px !important;
            object-fit: contain !important;
            aspect-ratio: auto !important;
            border-radius: 8px !important;
          }
          .rte-root .rte-image-caption {
            min-height: 20px;
            /* Legacy captions pinned themselves to Kalam and a slate grey;
               inherit instead so they follow the editor's font choice. */
            font-family: inherit !important;
            color: var(--rte-ink, #1c1c1a) !important;
            border: none !important;
          }
          .rte-root .rte-image-caption:empty:before {
            content: attr(placeholder);
            color: var(--rte-ink-muted, #a3a29e);
            pointer-events: none;
            display: block;
          }
        `}</style>
        <div
          ref={elRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emitChange}
          onKeyDown={handleKeyDown}
          onKeyUp={updateSelectionFormats}
          onMouseUp={updateSelectionFormats}
          onClick={handleClick}
          onPaste={handlePaste}
          onMouseDown={handleMouseDown}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; emitChange(); }}
          className={`rte-root w-full h-full overflow-y-auto outline-none p-3 leading-relaxed ${fontClass || ''}`}
          style={{ fontSize: `${fontSize}px` }}
        />
      </>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

// ---------------------------------------------------------------------
// Plain-text helpers (for AI Copilot payloads, word count, etc.)
// ---------------------------------------------------------------------
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  // Render block-level elements and list items onto their own line.
  div.querySelectorAll('div, p, li, h1, h2, h3, br').forEach(elNode => {
    elNode.insertAdjacentText('afterend', '\n');
  });
  div.querySelectorAll('li.rte-checkbox-item').forEach(li => {
    const checked = li.getAttribute('data-checked') === 'true';
    li.insertAdjacentText('afterbegin', checked ? '[x] ' : '[ ] ');
  });
  div.querySelectorAll('ul > li:not(.rte-checkbox-item)').forEach(li => {
    li.insertAdjacentText('afterbegin', '- ');
  });
  div.querySelectorAll('ol > li').forEach((li, i) => {
    li.insertAdjacentText('afterbegin', `${i + 1}. `);
  });
  const text = (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

// ---------------------------------------------------------------------
// Convert stored HTML to clean Markdown (for .md download / .zip export)
// ---------------------------------------------------------------------
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;

  const walk = (node: Node): string => {
    if (node.nodeType === 3) return node.textContent || '';
    if (node.nodeType !== 1) return '';
    const el = node as HTMLElement;
    const children = Array.from(el.childNodes).map(walk).join('');
    switch (el.tagName) {
      case 'STRONG':
      case 'B':
        return `**${children}**`;
      case 'EM':
      case 'I':
        return `*${children}*`;
      case 'H1':
        return `\n# ${children}\n`;
      case 'H2':
        return `\n## ${children}\n`;
      case 'H3':
        return `\n### ${children}\n`;
      case 'MARK':
        return `==${children}==`;
      case 'BR':
        return '\n';
      case 'LI': {
        if (el.classList.contains('rte-checkbox-item')) {
          const checked = el.getAttribute('data-checked') === 'true';
          return `${checked ? '- [x]' : '- [ ]'} ${children}\n`;
        }
        const parentTag = el.parentElement?.tagName;
        if (parentTag === 'OL') {
          const index = Array.from(el.parentElement!.children).indexOf(el) + 1;
          return `${index}. ${children}\n`;
        }
        return `- ${children}\n`;
      }
      case 'UL':
      case 'OL':
        return `${children}\n`;
      case 'DIV':
      case 'P':
        return `${children}\n`;
      default:
        return children;
    }
  };

  return walk(div).replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------------
// Sanitize legacy image styles from older notes so images render in
// their natural aspect ratio instead of legacy fixed 160px squares.
// ---------------------------------------------------------------------
export function sanitizeOldNoteImageStyles(html: string): string {
  if (!html) return '';
  return html.replace(/style="([^"]*)"/gi, (match, styleContent) => {
    const cleanedStyles = styleContent
      .replace(/height\s*:\s*160px\s*;?/gi, 'height: auto;')
      .replace(/height\s*:\s*180px\s*;?/gi, 'height: auto;')
      .replace(/object-fit\s*:\s*cover\s*;?/gi, 'object-fit: contain;')
      .replace(/max-height\s*:\s*160px\s*;?/gi, 'max-height: 420px;');
    return `style="${cleanedStyles}"`;
  });
}

// ---------------------------------------------------------------------
// One-time migration: convert legacy markdown-text notes (saved before
// this editor existed) into HTML so they don't show literal "**bold**"
// or "- item" text. Detected heuristically — if the content looks like
// it's already HTML (has tags), it's left untouched.
// ---------------------------------------------------------------------
export function migrateMarkdownToHtml(content: string): string {
  if (!content) return '';
  const sanitized = sanitizeOldNoteImageStyles(content);
  const looksLikeHtml = /<\/?(div|p|li|ul|ol|strong|em|mark|h[1-3]|br)\b/i.test(sanitized);
  if (looksLikeHtml) return sanitized;

  const lines = content.split('\n');
  const out: string[] = [];
  let listBuffer: { type: 'ul' | 'ol' | 'check'; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const tag = listBuffer.type === 'ol' ? 'ol' : 'ul';
    const itemsHtml = listBuffer.items
      .map(item => {
        if (listBuffer!.type === 'check') {
          const checked = /^\[x\]\s*/i.test(item);
          const text = item.replace(/^\[[ xX]?\]\s*/, '');
          return `<li class="rte-checkbox-item" data-checked="${checked}">${inlineFormat(text)}</li>`;
        }
        return `<li>${inlineFormat(item)}</li>`;
      })
      .join('');
    out.push(`<${tag}>${itemsHtml}</${tag}>`);
    listBuffer = null;
  };

  const inlineFormat = (s: string) =>
    s
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/==([gbpo]):(.*?)==/g, '<mark>$2</mark>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>');

  for (const raw of lines) {
    const line = raw;
    const checkMatch = /^[-*]\s\[[ xX]?\]\s(.*)$/.exec(line);
    const bulletMatch = /^[-*]\s(.*)$/.exec(line);
    const numberMatch = /^\d+\.\s(.*)$/.exec(line);
    const h1 = /^#\s(.*)$/.exec(line);
    const h2 = /^##\s(.*)$/.exec(line);
    const h3 = /^###\s(.*)$/.exec(line);

    if (checkMatch) {
      if (!listBuffer || listBuffer.type !== 'check') { flushList(); listBuffer = { type: 'check', items: [] }; }
      listBuffer.items.push(checkMatch[1]);
      continue;
    }
    if (bulletMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') { flushList(); listBuffer = { type: 'ul', items: [] }; }
      listBuffer.items.push(bulletMatch[1]);
      continue;
    }
    if (numberMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') { flushList(); listBuffer = { type: 'ol', items: [] }; }
      listBuffer.items.push(numberMatch[1]);
      continue;
    }
    flushList();
    if (h1) out.push(`<h1>${inlineFormat(h1[1])}</h1>`);
    else if (h2) out.push(`<h2>${inlineFormat(h2[1])}</h2>`);
    else if (h3) out.push(`<h3>${inlineFormat(h3[1])}</h3>`);
    else if (line.trim() === '') out.push('<div><br></div>');
    else out.push(`<div>${inlineFormat(line)}</div>`);
  }
  flushList();
  return out.join('');
}