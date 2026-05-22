import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Partner, PartnerNote, Project, Goal, Task } from '@/types';
import { format } from 'date-fns';
import { 
  Building, Phone, Mail, Globe, MapPin, Briefcase, Tag, 
  StickyNote, Plus, Trash2, Calendar, Target, CheckSquare,
  Clock, Activity, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface PartnerDetailModalProps {
  partnerId: string | null;
  onClose: () => void;
}

export function PartnerDetailModal({ partnerId, onClose }: PartnerDetailModalProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'projects' | 'goals' | 'tasks'>('overview');
  
  // Note state
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');

  useEffect(() => {
    if (partnerId) {
      fetchPartnerDetails();
    }
  }, [partnerId]);

  const fetchPartnerDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPartner(data);
      setNotes(data.notes || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load partner details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    try {
      const res = await fetch(`/api/partners/${partnerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent,
          noteType: newNoteType
        })
      });
      
      if (!res.ok) throw new Error('Failed to add note');
      const newNote = await res.json();
      
      setNotes([newNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteType('general');
      toast.success('Note added!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/partners/${partnerId}/notes?noteId=${noteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete note');
      
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete note');
    }
  };

  if (!partnerId) return null;

  return (
    <Dialog open={!!partnerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden journal-modal">
        {loading || !partner ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 p-6 border-b border-slate-200">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="font-caveat text-4xl text-slate-800">
                      {partner.name}
                    </DialogTitle>
                    <DialogDescription className="font-kalam text-lg mt-1 text-slate-500 flex items-center gap-2">
                      {partner.role && <span>{partner.role}</span>}
                      {partner.role && partner.company && <span>@</span>}
                      {partner.company && <span className="font-bold">{partner.company}</span>}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={partner.status === 'active' ? 'default' : 'secondary'} className="font-kalam">
                      {partner.status.toUpperCase()}
                    </Badge>
                    <Badge variant={partner.priority === 'high' ? 'destructive' : partner.priority === 'medium' ? 'default' : 'secondary'} className="font-kalam">
                      {partner.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'notes', label: 'Notes & Logs', icon: StickyNote },
                { id: 'projects', label: 'Projects', icon: Briefcase },
                { id: 'goals', label: 'Goals', icon: Target },
                { id: 'tasks', label: 'Tasks', icon: CheckSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-kalam text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-purple-500 text-purple-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'notes' && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">{notes.length}</span>}
                  {tab.id === 'projects' && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">{partner.projects?.length || 0}</span>}
                  {tab.id === 'goals' && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">{partner.goals?.length || 0}</span>}
                  {tab.id === 'tasks' && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">{partner.tasks?.length || 0}</span>}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="font-caveat text-xl font-bold text-slate-700 border-b pb-2">Contact Info</h3>
                      {partner.email && (
                        <div className="flex items-center gap-3 text-sm font-kalam text-slate-600">
                          <Mail className="w-4 h-4 text-purple-400" />
                          <a href={`mailto:${partner.email}`} className="hover:text-purple-600 hover:underline">{partner.email}</a>
                        </div>
                      )}
                      {partner.phone && (
                        <div className="flex items-center gap-3 text-sm font-kalam text-slate-600">
                          <Phone className="w-4 h-4 text-green-500" />
                          <a href={`tel:${partner.phone}`} className="hover:text-green-600 hover:underline">{partner.phone}</a>
                        </div>
                      )}
                      {partner.website && (
                        <div className="flex items-center gap-3 text-sm font-kalam text-slate-600">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <a href={partner.website} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">{partner.website}</a>
                        </div>
                      )}
                      {partner.address && (
                        <div className="flex items-start gap-3 text-sm font-kalam text-slate-600">
                          <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{partner.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="font-caveat text-xl font-bold text-slate-700 border-b pb-2">Details</h3>
                      <div className="flex items-center gap-3 text-sm font-kalam text-slate-600">
                        <Tag className="w-4 h-4 text-orange-400" />
                        <span className="capitalize">{partner.partnerType}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-kalam text-slate-600">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>Added {format(new Date(partner.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {partner.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-purple-50 text-purple-700 font-kalam">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {partner.description && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-caveat text-xl font-bold text-slate-700 mb-2">Description</h3>
                      <p className="font-kalam text-slate-600 whitespace-pre-wrap">{partner.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Add Note Form */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-caveat text-xl font-bold text-slate-700 mb-3">Add Interaction Log</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Log title..." 
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          className="journal-input flex-1"
                        />
                        <select 
                          className="journal-input bg-white h-10 px-3 rounded-md border border-slate-200"
                          value={newNoteType}
                          onChange={(e) => setNewNoteType(e.target.value)}
                        >
                          <option value="general">General Note</option>
                          <option value="meeting">Meeting</option>
                          <option value="call">Phone Call</option>
                          <option value="email">Email</option>
                          <option value="follow-up">Follow Up</option>
                        </select>
                      </div>
                      <textarea
                        placeholder="Details..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="journal-input w-full min-h-[80px] p-3"
                      />
                      <Button onClick={handleAddNote} className="journal-btn-primary gap-2 w-full sm:w-auto">
                        <Plus className="w-4 h-4" /> Save Note
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.map(note => (
                      <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-kalam capitalize text-[10px] bg-slate-50">
                              {note.noteType}
                            </Badge>
                            <h4 className="font-bold font-kalam text-slate-800">{note.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-kalam flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                            </span>
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="font-kalam text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="text-center py-8 text-slate-400 font-kalam border-2 border-dashed border-slate-200 rounded-xl">
                        No notes or logs yet. Keep track of your meetings here!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SHARED ENTITIES TABS */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  {partner.projects?.map(project => (
                    <div key={project.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold font-kalam text-lg">{project.title}</h4>
                        <p className="text-sm text-slate-500 font-kalam">{project.description}</p>
                      </div>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                  ))}
                  {!partner.projects?.length && <p className="text-slate-400 font-kalam text-center py-8">No shared projects.</p>}
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-3">
                  {partner.goals?.map(goal => (
                    <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold font-kalam text-lg">{goal.title}</h4>
                        <p className="text-sm text-slate-500 font-kalam">{goal.description}</p>
                      </div>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{goal.status}</Badge>
                    </div>
                  ))}
                  {!partner.goals?.length && <p className="text-slate-400 font-kalam text-center py-8">No shared goals.</p>}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {partner.tasks?.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className={`font-bold font-kalam text-lg ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                      <Badge className={task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                  {!partner.tasks?.length && <p className="text-slate-400 font-kalam text-center py-8">No shared tasks.</p>}
                </div>
              )}

            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
