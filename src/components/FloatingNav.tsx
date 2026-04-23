"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
}

interface FloatingNavProps {
  /** Navigation links */
  items?: NavItem[];
  /** Position of the bubble trigger */
  position?: "top-left" | "top-center" | "top-right";
  /** Logo src – falls back to monogram if omitted */
  logoSrc?: string;
  /** Site name shown inside expanded menu */
  siteName?: string;
}

// ─── Default nav items (replace with your own) ───────────────────────────────
const DEFAULT_ITEMS: NavItem[] = [
  { label: "Home",      href: "/" },
  { label: "About",     href: "/about" },
  { label: "Work",      href: "/work" },
  { label: "Journal",   href: "/journal" },
  { label: "Contact",   href: "/contact" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function FloatingNav({
  items = DEFAULT_ITEMS,
  position = "top-right",
  logoSrc,
  siteName = "Studio",
}: FloatingNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const positionClass = {
    "top-left":   "fn-pos-tl",
    "top-center": "fn-pos-tc",
    "top-right":  "fn-pos-tr",
  }[position];

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        /* ── Tokens ─────────────────────────────────────────────────────── */
        :root {
          --fn-parchment:   #F5F0E8;
          --fn-parchment-d: #EDE6D6;
          --fn-ink:         #2C2416;
          --fn-ink-soft:    #6B5D45;
          --fn-sepia:       #C4A882;
          --fn-sepia-light: #E8D9C0;
          --fn-sepia-dark:  #8B6E4E;
          --fn-gold:        #B8935A;
          --fn-gold-dark:   #8B6D3F;
          --fn-shadow:      rgba(44,36,22,0.18);
          --fn-trigger-size: 54px;
          --fn-ease:        cubic-bezier(0.34, 1.56, 0.64, 1);
          --fn-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Wrapper ─────────────────────────────────────────────────────── */
        .fn-wrapper {
          position: fixed;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .fn-pos-tl { top: 28px; left: 28px; align-items: flex-start; }
        .fn-pos-tc { top: 28px; left: 50%; transform: translateX(-50%); align-items: center; }
        .fn-pos-tr { top: 28px; right: 28px; align-items: flex-end; }

        /* ── Trigger bubble ──────────────────────────────────────────────── */
        .fn-trigger {
          width: var(--fn-trigger-size);
          height: var(--fn-trigger-size);
          border-radius: 50%;
          background: var(--fn-parchment);
          border: 1.5px solid var(--fn-sepia);
          box-shadow:
            0 2px 8px var(--fn-shadow),
            inset 0 1px 0 rgba(255,255,255,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            transform 320ms var(--fn-ease),
            box-shadow 200ms ease,
            background 200ms ease;
          position: relative;
          flex-shrink: 0;
          /* Subtle texture */
          background-image:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(180,148,100,0.1) 0%, transparent 50%);
        }
        .fn-trigger:hover {
          transform: scale(1.08);
          box-shadow:
            0 4px 16px var(--fn-shadow),
            inset 0 1px 0 rgba(255,255,255,0.7);
          background-color: var(--fn-parchment-d);
        }
        .fn-trigger:active { transform: scale(0.97); }
        .fn-trigger[aria-expanded="true"] {
          background: var(--fn-ink);
          border-color: var(--fn-gold);
          transform: scale(1.05) rotate(45deg);
        }
        .fn-trigger[aria-expanded="true"] .fn-logo-mono { color: var(--fn-gold); }
        .fn-trigger[aria-expanded="true"] .fn-close-icon { opacity: 1; }
        .fn-trigger[aria-expanded="true"] .fn-logo-inner { opacity: 0; }

        /* Close X inside trigger */
        .fn-logo-inner, .fn-close-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 200ms ease;
        }
        .fn-close-icon {
          opacity: 0;
          color: var(--fn-gold);
          font-size: 20px;
          font-family: serif;
          letter-spacing: -1px;
          transform: rotate(-45deg); /* counter the parent rotate */
        }
        .fn-logo-mono {
          font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--fn-ink);
          letter-spacing: 0.05em;
          user-select: none;
          line-height: 1;
        }
        .fn-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 50%;
        }

        /* ── Connector thread ─────────────────────────────────────────────── */
        .fn-thread {
          width: 1px;
          background: linear-gradient(to bottom, var(--fn-sepia), transparent);
          transform-origin: top center;
          transition: height 380ms var(--fn-ease-out), opacity 300ms ease;
          opacity: 0;
          height: 0;
        }
        .fn-thread.fn-open {
          height: 16px;
          opacity: 0.5;
        }

        /* ── Menu panel ──────────────────────────────────────────────────── */
        .fn-panel {
          background: var(--fn-parchment);
          border: 1px solid var(--fn-sepia-light);
          border-radius: 16px;
          box-shadow:
            0 8px 40px rgba(44,36,22,0.22),
            0 2px 8px rgba(44,36,22,0.12),
            inset 0 1px 0 rgba(255,255,255,0.7);
          overflow: hidden;
          pointer-events: none;
          opacity: 0;
          transform: scale(0.88) translateY(-8px);
          transform-origin: top center;
          transition:
            opacity 320ms var(--fn-ease-out),
            transform 380ms var(--fn-ease);
          min-width: 240px;
          /* Parchment texture */
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
            radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.5) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 100%, rgba(180,148,100,0.12) 0%, transparent 60%);
        }
        .fn-pos-tl .fn-panel { transform-origin: top left; border-radius: 4px 16px 16px 16px; }
        .fn-pos-tr .fn-panel { transform-origin: top right; border-radius: 16px 4px 16px 16px; }

        .fn-panel.fn-open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        /* ── Panel inner ─────────────────────────────────────────────────── */
        .fn-panel-header {
          padding: 20px 24px 14px;
          border-bottom: 1px solid var(--fn-sepia-light);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fn-site-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
          border-radius: 50%;
        }
        .fn-site-name {
          font-family: "Palatino Linotype", Palatino, Georgia, serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--fn-ink);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .fn-site-rule {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, var(--fn-sepia-light), transparent);
        }

        .fn-nav-list {
          list-style: none;
          padding: 10px 0 14px;
          margin: 0;
        }

        .fn-nav-item {
          opacity: 0;
          transform: translateX(-6px);
          transition:
            opacity 260ms ease,
            transform 320ms var(--fn-ease);
        }
        .fn-panel.fn-open .fn-nav-item { opacity: 1; transform: translateX(0); }
        /* stagger */
        .fn-panel.fn-open .fn-nav-item:nth-child(1) { transition-delay: 60ms; }
        .fn-panel.fn-open .fn-nav-item:nth-child(2) { transition-delay: 100ms; }
        .fn-panel.fn-open .fn-nav-item:nth-child(3) { transition-delay: 140ms; }
        .fn-panel.fn-open .fn-nav-item:nth-child(4) { transition-delay: 180ms; }
        .fn-panel.fn-open .fn-nav-item:nth-child(5) { transition-delay: 220ms; }
        .fn-panel.fn-open .fn-nav-item:nth-child(6) { transition-delay: 260ms; }

        .fn-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 24px;
          text-decoration: none;
          font-family: "Palatino Linotype", Palatino, Georgia, serif;
          font-size: 16px;
          color: var(--fn-ink-soft);
          letter-spacing: 0.04em;
          transition: color 160ms ease, padding-left 200ms var(--fn-ease);
          position: relative;
        }
        .fn-nav-link::before {
          content: "§";
          font-size: 11px;
          color: var(--fn-gold);
          opacity: 0;
          transition: opacity 160ms ease;
          flex-shrink: 0;
          margin-right: -4px;
        }
        .fn-nav-link:hover {
          color: var(--fn-ink);
          padding-left: 28px;
        }
        .fn-nav-link:hover::before { opacity: 1; }

        /* ── Panel footer ────────────────────────────────────────────────── */
        .fn-panel-footer {
          border-top: 1px solid var(--fn-sepia-light);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fn-footer-ornament {
          font-family: serif;
          font-size: 18px;
          color: var(--fn-sepia);
          letter-spacing: 4px;
        }
        .fn-footer-year {
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          color: var(--fn-sepia-dark);
          letter-spacing: 0.1em;
        }

        /* ── Overlay backdrop ────────────────────────────────────────────── */
        .fn-overlay {
          position: fixed;
          inset: 0;
          background: rgba(44,36,22,0.15);
          backdrop-filter: blur(2px);
          z-index: 9998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 300ms ease;
        }
        .fn-overlay.fn-open { opacity: 1; pointer-events: auto; }

        /* ── Ripple ring ─────────────────────────────────────────────────── */
        @keyframes fn-ripple {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .fn-ripple {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--fn-gold);
          animation: fn-ripple 1.8s ease-out infinite;
          pointer-events: none;
        }
        .fn-trigger[aria-expanded="true"] .fn-ripple { display: none; }

        /* ── Mobile tweaks ───────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .fn-pos-tl { top: 16px; left: 16px; }
          .fn-pos-tc { top: 16px; }
          .fn-pos-tr { top: 16px; right: 16px; }
          .fn-panel { min-width: min(88vw, 260px); }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className={`fn-overlay${open ? " fn-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* ── Floating group ── */}
      <div ref={menuRef} className={`fn-wrapper ${positionClass}`}>

        {/* Trigger */}
        <button
          className="fn-trigger"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((v) => !v)}
        >
          {/* Ripple pulse (idle) */}
          <span className="fn-ripple" aria-hidden="true" />

          {/* Logo / monogram */}
          <span className="fn-logo-inner">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt={siteName} className="fn-logo-img" />
            ) : (
              <span className="fn-logo-mono">
                {siteName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>

          {/* Close icon */}
          <span className="fn-close-icon" aria-hidden="true">✕</span>
        </button>

        {/* Connector thread */}
        <div className={`fn-thread${open ? " fn-open" : ""}`} aria-hidden="true" />

        {/* Panel */}
        <nav
          className={`fn-panel${open ? " fn-open" : ""}`}
          aria-label="Site navigation"
          aria-hidden={!open}
          inert={!open ? ("" as unknown as boolean) : undefined}
        >
          {/* Header */}
          <div className="fn-panel-header">
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt={siteName} className="fn-site-logo" />
            )}
            <span className="fn-site-name">{siteName}</span>
            <span className="fn-site-rule" aria-hidden="true" />
          </div>

          {/* Nav links */}
          <ul className="fn-nav-list" role="list">
            {items.map((item) => (
              <li key={item.href} className="fn-nav-item">
                <Link
                  href={item.href}
                  className="fn-nav-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer ornament */}
          <div className="fn-panel-footer" aria-hidden="true">
            <span className="fn-footer-ornament">— ✦ —</span>
            <span className="fn-footer-year">
              {new Date().getFullYear()}
            </span>
          </div>
        </nav>
      </div>
    </>
  );
}