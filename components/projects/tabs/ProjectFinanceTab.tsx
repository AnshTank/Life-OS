import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { encodeInvoice } from '@/utils/projectParsers';

interface ProjectFinanceTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  invoices: { id: string; amount: number; issueDate: string; dueDate: string; status: string; clientName: string }[];
}

export function ProjectFinanceTab({ project, onUpdate, invoices }: ProjectFinanceTabProps) {
  const [invAmount, setInvAmount] = useState('');
  const [invClient, setInvClient] = useState('');
  const [invDue, setInvDue] = useState('');

  const addInvoice = () => {
    const amount = parseFloat(invAmount);
    if (!amount || amount <= 0 || !invClient.trim()) { toast.error('Enter amount and client name'); return; }
    const entry = encodeInvoice(`inv-${Date.now()}`, amount, format(new Date(), 'yyyy-MM-dd'), invDue || format(new Date(), 'yyyy-MM-dd'), 'draft', invClient.trim());
    onUpdate({ notes: [...project.notes, entry] });
    setInvAmount(''); toast.success('Invoice drafted! 🧾');
  };

  const updateInvoiceStatus = (invId: string, newStatus: string) => {
    const updatedNotes = project.notes.map(n => {
      if (!n.startsWith('🧾|')) return n;
      const [, id, amount, issueDate, dueDate, status, clientName] = n.split('|');
      if (id !== invId) return n;
      return encodeInvoice(id, parseFloat(amount), issueDate, dueDate, newStatus, clientName);
    });
    // Optional: if marked paid, add to earnings
    const inv = invoices.find(i => i.id === invId);
    let extraOps = {};
    if (inv && newStatus === 'paid' && inv.status !== 'paid') {
      extraOps = { earnings: project.earnings ? project.earnings + inv.amount : inv.amount };
    } else if (inv && newStatus !== 'paid' && inv.status === 'paid') {
      extraOps = { earnings: project.earnings ? project.earnings - inv.amount : 0 };
    }
    onUpdate({ notes: updatedNotes, ...extraOps });
    toast.success(`Invoice marked as ${newStatus}`);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-3 mb-2">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-green-700">₹{project.earnings?.toLocaleString() || 0}</p>
          <p className="font-kalam text-[11px] text-green-700">Total Revenue</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-blue-700">{project.hoursSpent.toFixed(1)}h</p>
          <p className="font-kalam text-[11px] text-blue-700">Billable Hours</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-amber-700">
            {project.hoursSpent > 0 ? `₹${(Math.round((project.earnings || 0) / project.hoursSpent)).toLocaleString()}` : '—'}
          </p>
          <p className="font-kalam text-[11px] text-amber-700">Effective Rate/hr</p>
        </div>
      </div>

      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4 mb-4">
        <h4 className="font-caveat text-lg font-bold flex items-center gap-2 mb-3">🧾 Create Invoice</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <Input type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} placeholder="Amount (₹)" className="journal-input text-sm" />
          <Input value={invClient} onChange={e => setInvClient(e.target.value)} placeholder="Client Name" className="journal-input text-sm" />
          <Input type="date" value={invDue} onChange={e => setInvDue(e.target.value)} className="journal-input text-sm" />
          <Button onClick={addInvoice} className="journal-btn-primary h-full">Create</Button>
        </div>
        <p className="font-kalam text-[10px] text-slate-500">Invoices will automatically update Total Revenue when marked as Paid.</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-caveat text-lg font-bold flex items-center gap-2 mb-2">Invoice History</h4>
        {invoices.length === 0 ? <p className="text-center text-slate-400 py-4 font-kalam text-sm">No invoices generated yet.</p> : (
          [...invoices].reverse().map(inv => (
            <div key={inv.id} className="flex justify-between items-center p-3 bg-[#f9f7f4] border border-[#e8dac0] rounded-lg">
              <div>
                <p className="font-caveat text-xl font-bold text-[#2d2d2d]">₹{inv.amount.toLocaleString()}</p>
                <p className="font-kalam text-[11px] text-slate-500">To {inv.clientName} • Due {inv.dueDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`font-kalam text-[10px] uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : inv.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                  {inv.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-2 border-[#2d2d2d]">
                    <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'draft')}>Mark Draft</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'sent')}>Mark Sent</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'paid')} className="text-green-600 font-bold">Mark Paid</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'overdue')} className="text-red-600">Mark Overdue</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
