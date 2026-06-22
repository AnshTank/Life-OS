import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Partner } from '@/types';
import { Loader2, TrendingUp, ShieldAlert, CheckSquare, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

interface EcosystemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
}

interface ReportData {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  actionItems: string[];
}

export function EcosystemReportModal({ isOpen, onClose, partners }: EcosystemReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = partners.map(p => ({
        name: p.name,
        partnerType: p.partnerType || 'strategic',
        projectsCount: p._count?.projects || 0,
        goalsCount: p._count?.goals || 0,
        tasksCount: p._count?.tasks || 0
      }));

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-ecosystem-report',
          partners: stats
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      toast.error('Could not generate collaboration report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-[#fefdfb] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] rounded-3xl p-6 relative">
        <DialogHeader className="border-b-2 border-dashed border-[#2d2d2d]/30 pb-4">
          <DialogTitle className="font-caveat text-4xl text-[#2d2d2d] flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            Ecosystem Collaboration Report
          </DialogTitle>
          <DialogDescription className="font-kalam text-slate-500 text-base">
            AI-powered strategic analysis of your partner network and shared milestones.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin" />
            <p className="font-kalam text-lg text-slate-600 animate-pulse">
              Analyzing network effects and mapping synergies...
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex p-3 bg-red-50 rounded-2xl border-2 border-red-200 text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="font-kalam text-lg text-red-600">Failed to analyze ecosystem: {error}</p>
            <Button onClick={generateReport} className="journal-btn font-kalam">
              Try Again
            </Button>
          </div>
        ) : report ? (
          <div className="py-4 space-y-6">
            {/* Summary */}
            <div className="bg-[#fef9e6] border-2 border-[#e8dac0] rounded-2xl p-4 shadow-[2px_2px_0px_0px_#e8dac0]">
              <p className="font-kalam text-slate-700 italic text-base leading-relaxed">
                "{report.summary}"
              </p>
            </div>

            {/* Strengths */}
            <div className="space-y-3">
              <h3 className="font-caveat text-2xl text-[#2d2d2d] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Network Strengths
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start font-kalam text-sm text-slate-600 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="space-y-3">
              <h3 className="font-caveat text-2xl text-[#2d2d2d] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Collaboration Gaps
              </h3>
              <ul className="space-y-2">
                {report.growthAreas.map((grow, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start font-kalam text-sm text-slate-600 bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                    <span className="text-amber-500 font-bold mt-0.5">!</span>
                    <span>{grow}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="space-y-3">
              <h3 className="font-caveat text-2xl text-[#2d2d2d] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                Recommended Strategic Actions
              </h3>
              <ul className="space-y-3">
                {report.actionItems.map((act, idx) => (
                  <li key={idx} className="flex gap-3 items-center font-kalam text-sm text-slate-700 bg-purple-50/30 border border-purple-100/60 p-3 rounded-xl">
                    <div className="w-5 h-5 rounded-full border-2 border-[#2d2d2d] flex items-center justify-center flex-shrink-0 bg-white">
                      <span className="text-[10px] text-[#2d2d2d] font-bold">{idx + 1}</span>
                    </div>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center font-kalam text-slate-500">
            No report available.
          </div>
        )}

        <DialogFooter className="border-t-2 border-dashed border-[#2d2d2d]/30 pt-4 mt-4">
          <Button onClick={onClose} className="journal-btn-primary w-full h-11">
            Close Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
