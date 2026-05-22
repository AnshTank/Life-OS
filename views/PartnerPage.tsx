"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Send, Target, CheckSquare, Link2, 
  Mail, CheckCircle2, Gift, Calendar, MessageCircle,
  Zap, Trophy, Bell, Star, Plus, Users, Search,
  ExternalLink, MoreVertical, Trash2, Edit2, Globe, Tags
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { PartnerDetailModal } from '@/components/partners/PartnerDetailModal';
import type { PartnerStatus, PartnerPriority } from '@/types';

export function PartnerPage() {
  const { partners, addPartner, updatePartner, deletePartner, goals, tasks, projects } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  // New Partner Form State
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    company: '',
    role: '',
    address: '',
    description: '',
    partnerType: 'strategic',
    status: 'active' as PartnerStatus,
    priority: 'medium' as PartnerPriority,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPartner = async () => {
    if (!newPartner.name) {
      toast.error('Partner name is required');
      return;
    }
    await addPartner(newPartner);
    setIsAddModalOpen(false);
    setNewPartner({
      name: '',
      email: '',
      phone: '',
      website: '',
      company: '',
      role: '',
      address: '',
      description: '',
      partnerType: 'strategic',
      status: 'active',
      priority: 'medium',
      tags: []
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !newPartner.tags.includes(tagInput.trim())) {
      setNewPartner({ ...newPartner, tags: [...newPartner.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewPartner({ ...newPartner, tags: newPartner.tags.filter(t => t !== tag) });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-caveat text-[#2d2d2d]">
            Partner Ecosystem
          </h1>
          <p className="text-slate-500 font-kalam text-lg mt-1">
            Manage your collaborations, strategic partners, and shared growth
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 journal-input"
            />
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="journal-btn-primary gap-2 h-11 px-6">
                <Plus className="w-5 h-5" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] journal-modal">
              <DialogHeader>
                <DialogTitle className="font-caveat text-3xl">New Partner Profile</DialogTitle>
                <DialogDescription className="font-kalam">
                  Create a new partner entry to track shared projects and goals.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium font-kalam">Name</label>
                  <Input 
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    className="journal-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Email</label>
                    <Input 
                      value={newPartner.email}
                      onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                      placeholder="contact@email.com"
                      className="journal-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Phone</label>
                    <Input 
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                      placeholder="+1..."
                      className="journal-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Company</label>
                    <Input 
                      value={newPartner.company}
                      onChange={(e) => setNewPartner({...newPartner, company: e.target.value})}
                      placeholder="Acme Corp"
                      className="journal-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Role</label>
                    <Input 
                      value={newPartner.role}
                      onChange={(e) => setNewPartner({...newPartner, role: e.target.value})}
                      placeholder="CEO"
                      className="journal-input"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium font-kalam">Website</label>
                  <Input 
                    value={newPartner.website}
                    onChange={(e) => setNewPartner({...newPartner, website: e.target.value})}
                    placeholder="https://..."
                    className="journal-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Priority</label>
                    <Select 
                      value={newPartner.priority} 
                      onValueChange={(v) => setNewPartner({...newPartner, priority: v as PartnerPriority})}
                    >
                      <SelectTrigger className="journal-input bg-white text-left font-kalam">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium font-kalam">Partner Type</label>
                    <Select 
                      value={newPartner.partnerType} 
                      onValueChange={(v) => setNewPartner({...newPartner, partnerType: v})}
                    >
                      <SelectTrigger className="journal-input bg-white text-left font-kalam">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                        <SelectItem value="strategic">Strategic Partner</SelectItem>
                        <SelectItem value="vendor">Vendor / Supplier</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="personal">Personal Sync</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium font-kalam">Description</label>
                  <textarea 
                    value={newPartner.description}
                    onChange={(e) => setNewPartner({...newPartner, description: e.target.value})}
                    placeholder="Brief overview of the partnership..."
                    className="journal-input min-h-[80px] p-3"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium font-kalam">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPartner.tags.map(tag => (
                      <Badge key={tag} className="bg-purple-100 text-purple-700 hover:bg-purple-200 gap-1 pr-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-rose-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      className="journal-input h-9"
                    />
                    <Button onClick={addTag} variant="outline" className="h-9">Add</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPartner} className="journal-btn-primary w-full h-12">
                  Create Partner Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPartners.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-2xl font-bold font-caveat text-slate-600">No partners found</h3>
              <p className="text-slate-400 font-kalam">Add your first partner to start collaborating</p>
            </div>
          ) : (
            filteredPartners.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="journal-card group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className={`h-1.5 w-full ${
                    p.partnerType === 'strategic' ? 'bg-purple-500' :
                    p.partnerType === 'vendor' ? 'bg-orange-500' :
                    p.partnerType === 'client' ? 'bg-blue-500' :
                    'bg-rose-400'
                  }`} />
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold">
                          {p.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="font-caveat text-2xl group-hover:text-purple-600 transition-colors">
                          {p.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-kalam uppercase tracking-wider">
                          {p.partnerType || 'Partner'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="journal-card">
                        <DropdownMenuItem className="gap-2 font-kalam cursor-pointer">
                          <Edit2 className="w-4 h-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 font-kalam text-rose-600 cursor-pointer"
                          onClick={() => deletePartner(p.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 font-kalam line-clamp-2 min-h-[40px]">
                      {p.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 font-kalam text-[10px] py-0 px-2">
                          #{tag}
                        </Badge>
                      ))}
                      {p.tags.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-kalam text-[10px] py-0 px-2">
                          +{p.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div className="text-center">
                        <p className="text-lg font-bold font-caveat">{p._count?.projects || 0}</p>
                        <p className="text-[10px] text-slate-400 font-kalam">Projects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold font-caveat">{p._count?.goals || 0}</p>
                        <p className="text-[10px] text-slate-400 font-kalam">Goals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold font-caveat">{p._count?.tasks || 0}</p>
                        <p className="text-[10px] text-slate-400 font-kalam">Tasks</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="p-2 bg-slate-50 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors">
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-kalam text-xs gap-1 group/btn"
                        onClick={() => setSelectedPartnerId(p.id)}
                      >
                        View Details 
                        <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Featured Insight Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="journal-card bg-[#fef9e6] rounded-3xl p-8 border-2 border-[#e8dac0] relative overflow-hidden"
      >
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="bg-[#e8f0e9] text-[#5a9468] border-[#8ab896] mb-4 px-3 py-1">
              Ecosystem Insight
            </Badge>
            <h2 className="text-4xl font-bold font-caveat mb-4 text-[#2d2d2d]">Unlocking Network Effects</h2>
            <p className="text-[#5a5a5a] font-kalam text-lg leading-relaxed">
              Your partner network has grown by <span className="text-[#5a9468] font-bold">24%</span> this month. 
              Top collaborators are driving <span className="text-[#8b5cf6] font-bold">40%</span> of your project milestones. 
              Consider scheduling a strategic sync with your top-tier partners.
            </p>
            <div className="flex gap-4 mt-8">
              <Button className="journal-btn-primary font-kalam h-12 px-8 rounded-xl">
                Generate Network Report
              </Button>
              <Button variant="outline" className="journal-btn font-kalam h-12 px-8 rounded-xl">
                View Collaboration Map
              </Button>
            </div>
          </div>
          <div className="hidden md:flex justify-end">
            <div className="w-64 h-64 relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-slate-600 rounded-full"
              />
              <div className="absolute inset-4 border border-[#e8dac0] rounded-full flex items-center justify-center">
                <Users className="w-24 h-24 text-[#8b5cf6]/50" />
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 right-0 p-3 bg-[#e8f0e9] rounded-2xl border-2 border-[#8ab896]"
              >
                <Heart className="w-6 h-6 text-[#5a9468]" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute bottom-4 left-0 p-3 bg-blue-50 rounded-2xl border-2 border-blue-200"
              >
                <Zap className="w-6 h-6 text-blue-500" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      <PartnerDetailModal 
        partnerId={selectedPartnerId} 
        onClose={() => setSelectedPartnerId(null)} 
      />
    </div>
  );
}
