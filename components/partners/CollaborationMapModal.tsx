import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Partner, Project, Goal, Task } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, ArrowRight, Target, Briefcase, CheckSquare, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CollaborationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  projects: Project[];
  goals: Goal[];
  tasks: Task[];
}

export function CollaborationMapModal({
  isOpen,
  onClose,
  partners,
  projects,
  goals,
  tasks
}: CollaborationMapModalProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);

  // SVG Center & Radius
  const cx = 200;
  const cy = 200;
  const R = 120;

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  // Filter shared items for selected partner
  const sharedProjects = selectedPartnerId 
    ? projects.filter(p => p.partnerId === selectedPartnerId) 
    : [];
  const sharedGoals = selectedPartnerId 
    ? goals.filter(g => g.partnerId === selectedPartnerId) 
    : [];
  const sharedTasks = selectedPartnerId 
    ? tasks.filter(t => t.partnerId === selectedPartnerId) 
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] bg-[#fefdfb] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] rounded-3xl p-6">
        <DialogHeader className="border-b-2 border-dashed border-[#2d2d2d]/30 pb-4 mb-4">
          <DialogTitle className="font-caveat text-4xl text-[#2d2d2d] flex items-center gap-2">
            <Users className="w-8 h-8 text-[#8b5cf6]" />
            Collaboration Network Map
          </DialogTitle>
          <DialogDescription className="font-kalam text-slate-500 text-base">
            Click on a partner node to view shared projects, goals, and milestones in real-time.
          </DialogDescription>
        </DialogHeader>

        {partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <Users className="w-16 h-16 text-slate-300 animate-bounce" />
            <h4 className="font-caveat text-2xl text-slate-600 font-bold">No Partners to Map</h4>
            <p className="font-kalam text-slate-400 max-w-sm">
              Add strategic partners, clients, or spouses first to visualize your collaboration ecosystem.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-6 items-stretch">
            {/* SVG Visual Map Panel */}
            <div className="md:col-span-3 flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-2xl p-4 overflow-hidden min-h-[350px] relative">
              <svg 
                viewBox="0 0 400 400" 
                className="w-full max-w-[340px] h-auto drop-shadow-sm"
              >
                {/* Relationship Lines (Edges) */}
                {partners.map((p, i) => {
                  const angle = (i * 2 * Math.PI) / partners.length;
                  const x = cx + R * Math.cos(angle);
                  const y = cy + R * Math.sin(angle);
                  const isHighlighted = selectedPartnerId === p.id || hoveredPartnerId === p.id;

                  return (
                    <g key={`edge-${p.id}`}>
                      <motion.line
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke={isHighlighted ? "#8b5cf6" : "#2d2d2d"}
                        strokeWidth={isHighlighted ? 3 : 1.5}
                        strokeDasharray={isHighlighted ? "none" : "5,5"}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                      {isHighlighted && (
                        <circle cx={x} cy={y} r={32} fill="none" stroke="#8b5cf6" strokeWidth={1} className="animate-ping opacity-25" />
                      )}
                    </g>
                  );
                })}

                {/* Central "Me" Node */}
                <g className="cursor-pointer">
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={32} 
                    fill="#fef9e6" 
                    stroke="#2d2d2d" 
                    strokeWidth={2} 
                  />
                  <foreignObject x={cx - 24} y={cy - 24} width={48} height={48} className="rounded-full overflow-hidden">
                    <div className="w-full h-full bg-[#f3f4f6] flex items-center justify-center text-[#2d2d2d] font-bold font-caveat text-xl">
                      ME
                    </div>
                  </foreignObject>
                </g>

                {/* Orbiting Partner Nodes */}
                {partners.map((p, i) => {
                  const angle = (i * 2 * Math.PI) / partners.length;
                  const x = cx + R * Math.cos(angle);
                  const y = cy + R * Math.sin(angle);
                  
                  // Color based on type
                  const fillColor = 
                    p.partnerType === 'strategic' ? '#f3e8ff' : // Purple
                    p.partnerType === 'vendor' ? '#ffedd5' : // Orange
                    p.partnerType === 'client' ? '#dbeafe' : // Blue
                    p.partnerType === 'life-partner' ? '#ffe4e6' : // Rose
                    '#f1f5f9'; // Slate

                  const isSelected = selectedPartnerId === p.id;

                  return (
                    <g 
                      key={`node-${p.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedPartnerId(isSelected ? null : p.id)}
                      onMouseEnter={() => setHoveredPartnerId(p.id)}
                      onMouseLeave={() => setHoveredPartnerId(null)}
                    >
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={24} 
                        fill={fillColor} 
                        stroke={isSelected ? "#8b5cf6" : "#2d2d2d"} 
                        strokeWidth={isSelected ? 3 : 2} 
                      />
                      <text 
                        x={x} 
                        y={y + 5} 
                        textAnchor="middle" 
                        className="font-caveat font-bold text-sm select-none"
                        fill="#2d2d2d"
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </text>
                      
                      {/* Name Label underneath */}
                      <rect
                        x={x - 35}
                        y={y + 28}
                        width={70}
                        height={16}
                        rx={4}
                        fill="#fefdfb"
                        stroke="#2d2d2d"
                        strokeWidth={1}
                        opacity={0.9}
                      />
                      <text
                        x={x}
                        y={y + 39}
                        textAnchor="middle"
                        className="font-kalam text-[8px] truncate"
                        fill="#5a5a5a"
                      >
                        {p.name.length > 12 ? p.name.slice(0, 10) + '..' : p.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar Details Panel */}
            <div className="md:col-span-2 flex flex-col border-2 border-[#2d2d2d] rounded-2xl overflow-hidden bg-white shadow-[2px_2px_0px_0px_#2d2d2d] min-h-[350px]">
              <AnimatePresence mode="wait">
                {selectedPartner ? (
                  <motion.div 
                    key={selectedPartner.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col p-4 space-y-4 h-full overflow-y-auto"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-caveat text-2xl font-bold text-[#2d2d2d] leading-none">
                          {selectedPartner.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-kalam capitalize mt-1.5">
                          {selectedPartner.partnerType || 'Partner'}
                        </Badge>
                      </div>
                      <button 
                        onClick={() => setSelectedPartnerId(null)}
                        className="p-1 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                      {/* Shared Projects */}
                      <div className="space-y-2">
                        <h5 className="font-caveat text-lg font-bold text-slate-700 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          Shared Projects ({sharedProjects.length})
                        </h5>
                        {sharedProjects.length === 0 ? (
                          <p className="text-[11px] font-kalam text-slate-400 italic pl-1">No shared projects</p>
                        ) : (
                          <div className="space-y-2">
                            {sharedProjects.map(proj => (
                              <div key={proj.id} className="border border-slate-100 p-2 rounded-xl bg-slate-50/50 space-y-1">
                                <p className="font-kalam text-xs text-slate-700 font-medium truncate">{proj.title}</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={proj.progress || 0} className="h-1.5 flex-1" />
                                  <span className="text-[10px] font-kalam text-slate-500">{proj.progress}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Shared Goals */}
                      <div className="space-y-2">
                        <h5 className="font-caveat text-lg font-bold text-slate-700 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-rose-500" />
                          Shared Goals ({sharedGoals.length})
                        </h5>
                        {sharedGoals.length === 0 ? (
                          <p className="text-[11px] font-kalam text-slate-400 italic pl-1">No shared goals</p>
                        ) : (
                          <div className="space-y-2">
                            {sharedGoals.map(goal => (
                              <div key={goal.id} className="border border-slate-100 p-2 rounded-xl bg-slate-50/50 space-y-1">
                                <p className="font-kalam text-xs text-slate-700 font-medium truncate">{goal.title}</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={goal.progress || 0} className="h-1.5 flex-1" />
                                  <span className="text-[10px] font-kalam text-slate-500">{goal.progress}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Shared Tasks */}
                      <div className="space-y-2">
                        <h5 className="font-caveat text-lg font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-purple-500" />
                          Shared Tasks ({sharedTasks.length})
                        </h5>
                        {sharedTasks.length === 0 ? (
                          <p className="text-[11px] font-kalam text-slate-400 italic pl-1">No shared tasks</p>
                        ) : (
                          <div className="space-y-1.5">
                            {sharedTasks.map(t => (
                              <div key={t.id} className="flex items-center justify-between border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                                <p className="font-kalam text-xs text-slate-700 font-medium truncate max-w-[120px]">{t.title}</p>
                                <Badge className={`text-[8px] px-1.5 py-0 font-kalam ${
                                  t.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                  t.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {t.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3"
                  >
                    <Info className="w-10 h-10 text-slate-300" />
                    <h5 className="font-caveat text-2xl font-bold text-[#2d2d2d]">No Selection</h5>
                    <p className="font-kalam text-sm text-slate-400 leading-normal">
                      Hover over any partner to view connections, or click their node to load their full collaboration portfolio.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
