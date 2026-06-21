"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Search, ZoomIn, ZoomOut, Maximize2,
  BookOpen, Edit3, Trash2, Tag, Calendar, Folder, Link2, X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Define structures for our physics simulation
interface Node {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  backlinks: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
}

export default function LearningPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolder, setEditFolder] = useState('');
  const [editTags, setEditTags] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const draggedNodeRef = useRef<Node | null>(null);

  // Fetch all notes on mount
  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(data);
      initializeSimulation(data);
    } catch (e) {
      console.error(e);
      toast.error('Could not fetch notes graph.');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Map folders to glowing holographic colors
  const getFolderColor = (folder: string) => {
    switch (folder.toLowerCase()) {
      case 'learned': return '#a78bfa'; // Purple
      case 'meetings': return '#f472b6'; // Pink
      case 'work': return '#60a5fa'; // Blue
      case 'personal': return '#34d399'; // Green
      default: return '#fbbf24'; // Yellow
    }
  };

  // Convert raw notes to simulation nodes and edges
  const initializeSimulation = (rawNotes: any[]) => {
    const nodes: Node[] = rawNotes.map((n, idx) => {
      // Keep position stable if node already exists
      const existing = simulationRef.current.nodes.find(old => old.id === n.id);
      
      const angle = (idx / rawNotes.length) * Math.PI * 2;
      const radius = 250;
      
      return {
        id: n.id,
        title: n.title,
        content: n.content || '',
        folder: n.folder || 'All',
        tags: n.tags || [],
        backlinks: n.backlinks || [],
        x: existing?.x ?? (400 + Math.cos(angle) * radius),
        y: existing?.y ?? (300 + Math.sin(angle) * radius),
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        radius: n.folder?.toLowerCase() === 'learned' ? 24 : 20,
        color: getFolderColor(n.folder)
      };
    });

    const edges: Edge[] = [];
    nodes.forEach(node => {
      node.backlinks.forEach(link => {
        // Link can be either note ID or note title
        const targetNode = nodes.find(n => n.id === link || n.title.toLowerCase() === link.toLowerCase());
        if (targetNode && !edges.some(e => (e.source === node.id && e.target === targetNode.id) || (e.source === targetNode.id && e.target === node.id))) {
          edges.push({ source: node.id, target: targetNode.id });
        }
      });
    });

    simulationRef.current = { nodes, edges };
  };

  // Run physics ticks and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    
    const tick = () => {
      const { nodes, edges } = simulationRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply Force-directed graph physics
      // 1. Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 400) {
            const force = (1600 / (dist * dist)); // Coulomb force
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attraction along edges
      edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.source);
        const n2 = nodes.find(n => n.id === edge.target);
        if (n1 && n2) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const restLength = 120;
          const springK = 0.04;
          const force = (dist - restLength) * springK;
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        }
      });

      // 3. Gravity pulling toward center & Update velocities
      nodes.forEach(node => {
        if (node === draggedNodeRef.current) return;
        
        node.vx += (centerX - node.x) * 0.003; // pull to center
        node.vy += (centerY - node.y) * 0.003;
        
        // Friction / Damping
        node.vx *= 0.85;
        node.vy *= 0.85;
        
        node.x += node.vx;
        node.y += node.vy;
      });

      // DRAW PHASE
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply Zoom & Pan
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw Grid lines behind
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      const startX = -pan.x / zoom;
      const startY = -pan.y / zoom;
      const endX = (canvas.width - pan.x) / zoom;
      const endY = (canvas.height - pan.y) / zoom;

      for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Draw edges (Lines)
      edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.source);
        const n2 = nodes.find(n => n.id === edge.target);
        if (n1 && n2) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw nodes (Circles)
      nodes.forEach(node => {
        const matchesSearch = search.trim() === '' || 
          node.title.toLowerCase().includes(search.toLowerCase()) ||
          node.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        // Node fill
        ctx.fillStyle = node.color;
        ctx.globalAlpha = matchesSearch ? 1 : 0.2;
        ctx.fill();

        // Neon Glow border for matched search / selected node
        const isSelected = selectedNode?.id === node.id;
        ctx.strokeStyle = isSelected ? '#1e293b' : '#ffffff';
        ctx.lineWidth = isSelected ? 4 : 2;
        
        if (isSelected) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset
        ctx.globalAlpha = 1;

        // Label Text
        ctx.fillStyle = matchesSearch ? '#1e293b' : '#94a3b8';
        ctx.font = 'bold 12px "Kalam", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Cut title if too long
        const displayName = node.title.length > 15 ? node.title.slice(0, 13) + '..' : node.title;
        ctx.fillText(displayName, node.x, node.y + node.radius + 6);
      });

      ctx.restore();
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [zoom, pan, selectedNode, search]);

  // Click & Drag event handlers on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Convert click position to canvas coords factoring in zoom & pan
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const clickX = (clientX - pan.x) / zoom;
    const clickY = (clientY - pan.y) / zoom;

    // Check if clicked a node
    const clickedNode = simulationRef.current.nodes.find(node => {
      const dx = node.x - clickX;
      const dy = node.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
      setEditTitle(clickedNode.title);
      setEditContent(clickedNode.content);
      setEditFolder(clickedNode.folder);
      setEditTags(clickedNode.tags.join(', '));
      setIsEditing(false);
    } else {
      // Pan canvas
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      
      draggedNodeRef.current.x = (clientX - pan.x) / zoom;
      draggedNodeRef.current.y = (clientY - pan.y) / zoom;
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    setIsDraggingCanvas(false);
  };

  // Node editing handlers
  const handleSaveNode = async () => {
    if (!selectedNode) return;
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t !== '');
      const res = await fetch(`/api/notes/${selectedNode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          folder: editFolder,
          tags: tagsArray
        })
      });

      if (!res.ok) throw new Error('Update failed');
      const updatedNote = await res.json();
      
      // Update local state arrays
      setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
      
      // Update running simulation node
      const simNode = simulationRef.current.nodes.find(n => n.id === selectedNode.id);
      if (simNode) {
        simNode.title = updatedNote.title;
        simNode.content = updatedNote.content;
        simNode.folder = updatedNote.folder;
        simNode.tags = updatedNote.tags;
        simNode.color = getFolderColor(updatedNote.folder);
      }
      
      setSelectedNode(simNode || null);
      setIsEditing(false);
      toast.success('Note updated!');
    } catch (e) {
      toast.error('Failed to update note.');
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const res = await fetch(`/api/notes/${selectedNode.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      
      setNotes(prev => prev.filter(n => n.id !== selectedNode.id));
      simulationRef.current.nodes = simulationRef.current.nodes.filter(n => n.id !== selectedNode.id);
      simulationRef.current.edges = simulationRef.current.edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
      
      setSelectedNode(null);
      toast.success('Note deleted.');
    } catch (e) {
      toast.error('Failed to delete note.');
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#f8fafc] border border-slate-200 rounded-2xl shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <Network className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="font-caveat text-3xl font-bold leading-none">Mind Connections Graph</h1>
            <p className="font-kalam text-xs text-[#64748b] mt-0.5">Explore how your ideas, mistakes, and learned notes relate.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts or tags..."
              className="pl-9 h-10 rounded-xl bg-white focus-visible:ring-purple-400"
            />
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Zoom controls */}
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="h-10 w-10 rounded-xl bg-white"><ZoomOut className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="h-10 w-10 rounded-xl bg-white"><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="h-10 w-10 rounded-xl bg-white" title="Reset Zoom"><Maximize2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Main Graph Content Panel */}
      <div className="flex-1 flex border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-md relative min-h-0">
        
        {/* Canvas graph renderer */}
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 cursor-grab active:cursor-grabbing w-full h-full bg-white"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg flex flex-col gap-2 font-kalam text-xs text-slate-600 z-10 select-none">
          <p className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase tracking-wider text-[10px]">Folder Legend</p>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#a78bfa]" /> Learned URLs (RAG)</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#f472b6]" /> Meetings</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#60a5fa]" /> Work Notes</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#34d399]" /> Personal</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#fbbf24]" /> Default/Other</div>
        </div>

        {/* Side Details Drawer Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-30 font-kalam select-text"
            >
              {/* Drawer Header */}
              <div className="p-4 bg-[#f8fafc] border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-600">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Concept Inspector</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {isEditing ? (
                  // Edit form
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-bold">Note Title</label>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-kalam rounded-xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-bold">Category Folder</label>
                      <Input value={editFolder} onChange={(e) => setEditFolder(e.target.value)} className="font-kalam rounded-xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-bold">Tags (Comma-separated)</label>
                      <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="font-kalam rounded-xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-bold">Main Content</label>
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="font-kalam min-h-[220px] rounded-xl border-2 leading-relaxed" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveNode} className="flex-1 bg-purple-600 text-white rounded-xl hover:bg-purple-700">Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-caveat text-4xl font-bold text-slate-800 leading-tight">{selectedNode.title}</h2>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-slate-700 bg-slate-100 border">
                          <Folder className="w-3 h-3 text-slate-500" />
                          {selectedNode.folder}
                        </span>
                        {selectedNode.tags.map((t, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full text-purple-700 bg-purple-50 border border-purple-100 font-bold">
                            <Tag className="w-2.5 h-2.5" />
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-4">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Note Body</p>
                      <div className="p-4 bg-slate-50 border rounded-2xl max-h-[300px] overflow-y-auto no-scrollbar shadow-inner">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNode.content || "Empty content."}</p>
                      </div>
                    </div>

                    {selectedNode.backlinks.length > 0 && (
                      <div className="border-t border-dashed border-slate-200 pt-4">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Connected Concept Links</p>
                        <div className="flex flex-col gap-1.5">
                          {selectedNode.backlinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-purple-600 font-bold hover:underline cursor-pointer bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50">
                              <Link2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>{link}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-dashed border-slate-200">
                      <Button onClick={() => setIsEditing(true)} className="flex-1 bg-slate-100 text-slate-700 border hover:bg-slate-200 rounded-xl">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Details
                      </Button>
                      <Button onClick={handleDeleteNode} variant="ghost" className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
