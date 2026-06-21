"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  TrendingUp, Plus, Calculator, Star,
  Building2, Target, LineChart, Sparkles,
  Wallet, PieChart as PieChartIcon, ArrowRight,
  ArrowUpRight, ArrowDownRight, Shield, Zap,
  Flame, Banknote, CreditCard, Landmark,
  TrendingDown, DollarSign, Percent, Clock,
  ChevronRight, AlertTriangle, CheckCircle2, Info,
  PiggyBank, BarChart3, CircleDollarSign, Receipt,
  Trash2, Eye, EyeOff, CalendarClock, Gift,
  Repeat, BookOpen, Home, Car, ShoppingBag,
  BadgeIndianRupee, Lightbulb, Award, Trophy,
  Layers, Settings2, Copy, X, ChevronDown
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { Investment, InvestmentType, Transaction, SavingsGoal, Subscription, PurchaseLog } from '@/types';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Area, AreaChart, RadialBarChart, RadialBar, ComposedChart } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInMonths, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency, getCurrencySymbol, getCurrencyIcon, SUPPORTED_CURRENCIES, fetchExchangeRate } from '@/utils/currency';

// ═════════════════════════════════════════
// CONSTANTS & CONFIG
// ═════════════════════════════════════════
const investmentColors: Record<InvestmentType, string> = {
  stock: '#7a9eb8', mutual_fund: '#8ab896', etf: '#a99bc4', crypto: '#d9b896', bond: '#7db8a8', fd: '#8a8a8a', sip: '#d9a8c4',
};
const investmentTypeLabels: Record<InvestmentType, string> = {
  stock: 'Stock', mutual_fund: 'Mutual Fund', etf: 'ETF', crypto: 'Crypto', bond: 'Bond', fd: 'Fixed Deposit', sip: 'SIP',
};
const investmentIcons: Record<InvestmentType, typeof Wallet> = {
  stock: TrendingUp, mutual_fund: BarChart3, etf: LineChart, crypto: Zap, bond: Shield, fd: Landmark, sip: PiggyBank,
};
const tooltipStyle = { borderRadius: '8px', border: '2px solid #2d2d2d', boxShadow: '3px 3px 0px #2d2d2d', fontFamily: 'Kalam', backgroundColor: '#fefcf8', fontSize: '13px' };
const needsCategories = ['housing', 'utilities', 'groceries', 'insurance', 'healthcare', 'transport', 'bills', 'rent', 'electricity', 'food'];
const wantsCategories = ['dining', 'entertainment', 'shopping', 'hobbies', 'travel', 'subscriptions', 'clothing', 'restaurant'];

// ═════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════
function fmt(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  }
  return `₹${n.toLocaleString('en-IN')}`;
}

// ═════════════════════════════════════════
// REUSABLE: JARVIS Note
// ═════════════════════════════════════════
function JarvisNote({ title, children, rotate = -0.5 }: { title: string; children: React.ReactNode; rotate?: number }) {
  return (
    <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative bg-[#fef9e6] border-2 border-[#e8dac0] rounded-xl p-4 flex gap-3 hover:shadow-md transition-all"
      style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#e2e8f0] opacity-70 rounded-sm" />
      <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-kalam text-xs font-bold text-amber-700 uppercase tracking-wide mb-0.5">{title}</p>
        <p className="font-kalam text-sm text-[#2d2d2d] leading-relaxed">{children}</p>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════
// REUSABLE: Stat Card
// ═════════════════════════════════════════
function StatCard({ label, value, sub, color = '#2d2d2d', icon: Icon }: { label: string; value: string; sub?: string; color?: string; icon?: typeof Wallet }) {
  return (
    <div className="bg-white border border-[#e8dac0] rounded-xl p-4 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-1">
        <p className="font-kalam text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />}
      </div>
      <p className="font-caveat text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="font-kalam text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ═════════════════════════════════════════
// REUSABLE: Section Header
// ═════════════════════════════════════════
function SectionTitle({ icon: Icon, title, action }: { icon: typeof Wallet; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-caveat text-xl font-bold text-[#2d2d2d] flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#d4a574]" /> {title}
      </h3>
      {action}
    </div>
  );
}

// ═════════════════════════════════════════
// FINANCIAL HEALTH SCORE
// ═════════════════════════════════════════
function FinancialHealthScore({ income, expenses, savings, investments }: { income: number; expenses: number; savings: number; investments: Investment[] }) {
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const investmentDiversity = new Set(investments.map(i => i.type)).size;
  const hasEmergencyFund = savings > expenses * 3;
  let score = 0;
  score += Math.min(30, savingsRate * 1.5);
  score += Math.min(20, investmentDiversity * 5);
  score += hasEmergencyFund ? 20 : Math.min(20, (savings / (expenses * 3 || 1)) * 20);
  score += investments.length > 0 ? 15 : 0;
  score += income > expenses ? 15 : 0;
  score = Math.min(100, Math.round(score));

  const getLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
  const getColor = (s: number) => s >= 80 ? '#22c55e' : s >= 60 ? '#3b82f6' : s >= 40 ? '#f59e0b' : '#ef4444';
  const radialData = [{ name: 'Score', value: score, fill: getColor(score) }];

  return (
    <div className="flex items-center gap-8">
      <div className="w-36 h-36 flex-shrink-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={14} data={radialData} startAngle={90} endAngle={-270}>
            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
          <p className="font-caveat text-4xl font-bold leading-none" style={{ color: getColor(score) }}>{score}</p>
          <p className="font-kalam text-xs text-slate-500 mt-1.5 leading-none">{getLabel(score)}</p>
        </div>
      </div>
      <div className="space-y-3 flex-1 min-w-0">
        <ScoreRow label="Savings Rate" ok={savingsRate >= 20} detail={`${savingsRate.toFixed(0)}% of income`} />
        <ScoreRow label="Portfolio Diversity" ok={investmentDiversity >= 3} detail={`${investmentDiversity} asset types`} />
        <ScoreRow label="Emergency Fund" ok={hasEmergencyFund} detail={hasEmergencyFund ? '3+ months covered' : 'Below 3 months'} />
        <ScoreRow label="Cash Flow" ok={income > expenses} detail={income > expenses ? 'Positive' : 'Negative'} />
      </div>
    </div>
  );
}
function ScoreRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      {ok ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      <span className="font-kalam text-sm text-[#2d2d2d] font-bold">{label}</span>
      <span className="font-kalam text-xs text-slate-400 ml-auto">{detail}</span>
    </div>
  );
}

// ═════════════════════════════════════════
// INVESTMENT FORM
// ═════════════════════════════════════════
function InvestmentForm({ onSubmit, onCancel }: { onSubmit: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void; onCancel: () => void }) {
  const { user, currencyPreference } = useApp();
  const [name, setName] = useState(''); const [type, setType] = useState<InvestmentType>('stock');
  const [amount, setAmount] = useState(''); const [quantity, setQuantity] = useState(''); const [currentValue, setCurrentValue] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!name || !amount) { toast.error('Fill required fields'); return; }
    const inv = parseFloat(amount); const cv = currentValue ? parseFloat(currentValue) : inv; const qty = quantity ? parseFloat(quantity) : 1;
    onSubmit({ userId: user?.id || 'user-1', name, type, quantity: qty, investedAmount: inv, currentValue: cv, averagePrice: inv / qty, currentPrice: cv / qty, pnl: cv - inv, pnlPercent: ((cv - inv) / inv) * 100, symbol: '', sector: '', notes: '' });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="font-kalam text-sm font-bold mb-1 block">Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Reliance, Nifty 50..." className="journal-input bg-white" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-kalam text-sm font-bold mb-1 block">Type</label>
          <Select value={type} onValueChange={v => setType(v as InvestmentType)}><SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{Object.entries(investmentTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="font-kalam text-sm font-bold mb-1 block">Qty</label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" className="journal-input bg-white" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-kalam text-sm font-bold mb-1 block">Invested ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-sm font-bold mb-1 block">Current Value ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className="journal-input bg-white" /></div>
      </div>
      <div className="flex gap-2 pt-2"><Button type="submit" className="flex-1 journal-btn-primary">Add</Button><Button type="button" onClick={onCancel} variant="outline" className="journal-btn">Cancel</Button></div>
    </form>
  );
}

// ═════════════════════════════════════════
// TRANSACTION FORM
// ═════════════════════════════════════════
function TransactionForm({ onSubmit, onCancel }: { onSubmit: (t: Omit<Transaction, 'id' | 'createdAt'>) => void; onCancel: () => void }) {
  const { user, currencyPreference } = useApp();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState(''); const [desc, setDesc] = useState(''); const [category, setCategory] = useState('');
  const [txCurrency, setTxCurrency] = useState(currencyPreference || 'INR');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (currencyPreference) {
      setTxCurrency(currencyPreference);
    }
  }, [currencyPreference]);

  const cats = type === 'expense' ? ['Housing', 'Groceries', 'Transport', 'Dining', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Subscriptions', 'Other'] : ['Salary', 'Freelance', 'Investment', 'Cashback', 'Gift', 'Other'];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!amount || !desc || !category) { toast.error('Fill all fields'); return; }
    
    setIsConverting(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        toast.error('Invalid amount');
        return;
      }
      
      let finalAmount = parsedAmount;
      let extraNote = "";
      
      if (txCurrency !== currencyPreference) {
        const rate = await fetchExchangeRate(txCurrency, currencyPreference);
        finalAmount = parsedAmount * rate;
        extraNote = ` [Converted from ${getCurrencySymbol(txCurrency)}${parsedAmount.toFixed(2)} at rate of ${rate.toFixed(4)}]`;
      }
      
      onSubmit({ 
        userId: user?.id || 'user-1', 
        type, 
        amount: finalAmount, 
        description: desc + extraNote, 
        category, 
        date: new Date(), 
        tags: txCurrency !== currencyPreference ? ['converted', txCurrency] : [] 
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to convert currency');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" onClick={() => setType('expense')} className={`flex-1 font-kalam ${type === 'expense' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-slate-600 border-slate-200'} border-2`} disabled={isConverting}><ArrowDownRight className="w-4 h-4 mr-1" /> Expense</Button>
        <Button type="button" onClick={() => setType('income')} className={`flex-1 font-kalam ${type === 'income' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-slate-600 border-slate-200'} border-2`} disabled={isConverting}><ArrowUpRight className="w-4 h-4 mr-1" /> Income</Button>
      </div>
      <div>
        <label className="font-kalam text-sm font-bold mb-1 block">Amount</label>
        <div className="flex gap-2">
          <Select value={txCurrency} onValueChange={setTxCurrency} disabled={isConverting}>
            <SelectTrigger className="journal-input w-28 shrink-0 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              {SUPPORTED_CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            type="number" 
            step="any"
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="journal-input text-xl font-caveat flex-1 bg-white" 
            disabled={isConverting}
            placeholder="0.00"
          />
        </div>
        {txCurrency !== currencyPreference && (
          <p className="text-xs font-kalam text-slate-500 mt-1 italic animate-pulse">
            Will be logged in {currencyPreference} using live rates.
          </p>
        )}
      </div>
      <div><label className="font-kalam text-sm font-bold mb-1 block">Description</label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for?" className="journal-input bg-white" disabled={isConverting} /></div>
      <div><label className="font-kalam text-sm font-bold mb-1 block">Category</label>
        <div className="flex flex-wrap gap-2">{cats.map(c => <button key={c} type="button" onClick={() => setCategory(c)} disabled={isConverting} className={`px-3 py-1.5 rounded-lg text-xs font-kalam font-bold border-2 transition-all ${category === c ? 'bg-[#2d2d2d] text-white border-[#2d2d2d]' : 'bg-white text-slate-600 border-[#e8dac0] hover:border-slate-400'}`}>{c}</button>)}</div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 journal-btn-primary" disabled={isConverting}>
          {isConverting ? "Converting..." : "Log Transaction"}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" className="journal-btn" disabled={isConverting}>Cancel</Button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1: DASHBOARD — Financial Command Center
// ══════════════════════════════════════════════════════════════
function FinancialDashboard() {
  const { investments, transactions, emis, sips, stats, subscriptions, savingsGoals, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  
  const income = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const savings = Math.max(0, income - expenses);
  const totalDebt = emis.filter(e => e.status === 'active').reduce((s, e) => s + (e.emiAmount * e.remainingMonths), 0);
  const netWorth = stats.portfolioValue + savings - totalDebt;
  const subTotal = subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + (s.frequency === 'yearly' ? s.amount / 12 : s.amount), 0);
  const burnRate = income > 0 ? ((expenses / income) * 100) : 0;

  // Monthly trend for chart
  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d); const end = endOfMonth(d);
      const mIncome = transactions.filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end })).reduce((s, t) => s + t.amount, 0);
      const mExp = transactions.filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })).reduce((s, t) => s + t.amount, 0);
      data.push({ month: format(d, 'MMM'), income: mIncome, expense: mExp, net: mIncome - mExp });
    }
    return data;
  }, [transactions]);

  // Upcoming EMIs
  const upcomingEMIs = emis.filter(e => e.status === 'active').slice(0, 3);

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Financial Pulse" rotate={0.3}>
        {burnRate < 60 ? `Excellent discipline! You're saving ${(100 - burnRate).toFixed(0)}% of your income. Your net worth is ${fmt(netWorth, true)}.`
          : burnRate < 80 ? `You're spending ${burnRate.toFixed(0)}% of your income. Try trimming subscriptions (${fmt(Math.round(subTotal))}/mo) to boost savings.`
          : `Warning: You're spending ${burnRate.toFixed(0)}% of income. Consider the 50/30/20 rule in the Budget tab.`}
      </JarvisNote>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard label="Net Worth" value={fmt(netWorth, true)} icon={getCurrencyIcon(currencyPreference)} color="#2d2d2d" />
        <StatCard label="Portfolio" value={fmt(stats.portfolioValue, true)} icon={BarChart3} color={stats.totalPnl >= 0 ? '#22c55e' : '#ef4444'} sub={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalInvested > 0 ? ((stats.totalPnl / stats.totalInvested) * 100).toFixed(1) : '0'}%`} />
        <StatCard label="Income" value={fmt(income, true)} color="#22c55e" icon={ArrowUpRight} />
        <StatCard label="Expenses" value={fmt(expenses, true)} color="#ef4444" icon={ArrowDownRight} />
        <StatCard label="Savings" value={fmt(savings, true)} color="#3b82f6" icon={PiggyBank} sub={income > 0 ? `${((savings / income) * 100).toFixed(0)}% rate` : ''} />
        <StatCard label="Total Debt" value={fmt(totalDebt, true)} color={totalDebt > 0 ? '#f59e0b' : '#22c55e'} icon={CreditCard} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cash Flow Trend */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={LineChart} title="Cash Flow Trend" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8dac0" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="income" name="Income" fill="#86efac" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="net" name="Net" stroke="#2d2d2d" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={Shield} title="Financial Health" />
          <FinancialHealthScore income={income} expenses={expenses} savings={savings} investments={investments} />
        </div>
      </div>

      {/* Quick Info Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active EMIs */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <SectionTitle icon={CreditCard} title="Active EMIs" />
          {upcomingEMIs.length > 0 ? upcomingEMIs.map(emi => (
            <div key={emi.id} className="flex items-center justify-between py-2 border-b border-[#f0ece4] last:border-0">
              <div><p className="font-kalam text-sm font-bold text-[#2d2d2d]">{emi.name}</p><p className="font-kalam text-[11px] text-slate-500">{emi.remainingMonths} months left</p></div>
              <p className="font-caveat text-lg font-bold text-[#2d2d2d]">{fmt(emi.emiAmount)}/mo</p>
            </div>
          )) : <p className="font-kalam text-sm text-slate-400 italic py-4 text-center">No active EMIs 🎉</p>}
        </div>

        {/* Subscriptions Summary */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <SectionTitle icon={Repeat} title="Subscriptions" action={<Badge variant="outline" className="font-kalam text-xs">{fmt(subTotal)}/mo</Badge>} />
          {subscriptions.filter(s => s.isActive).slice(0, 4).map(sub => (
            <div key={sub.id} className="flex items-center justify-between py-2 border-b border-[#f0ece4] last:border-0">
              <p className="font-kalam text-sm font-bold text-[#2d2d2d]">{sub.name}</p>
              <p className="font-kalam text-sm text-slate-600">{fmt(sub.amount)}/{sub.frequency === 'yearly' ? 'yr' : 'mo'}</p>
            </div>
          ))}
          {subscriptions.filter(s => s.isActive).length > 4 && <p className="font-kalam text-xs text-slate-400 pt-1 text-center">+{subscriptions.filter(s => s.isActive).length - 4} more</p>}
        </div>

        {/* Savings Goals Progress */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <SectionTitle icon={Target} title="Savings Goals" />
          {savingsGoals.slice(0, 3).map(goal => {
            const pct = Math.min(100, (goal.currentSaved / goal.targetAmount) * 100);
            return (
              <div key={goal.id} className="py-2 border-b border-[#f0ece4] last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-kalam text-sm font-bold text-[#2d2d2d]">{goal.icon} {goal.name}</p>
                  <p className="font-kalam text-[11px] text-slate-500">{pct.toFixed(0)}%</p>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2: PORTFOLIO — Investment Management
// ══════════════════════════════════════════════════════════════
function PortfolioOverview() {
  const { investments, stats, transactions, deleteInvestment, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const income = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const savings = Math.max(0, income - expenses);
  const isProfit = stats.totalPnl >= 0;

  const portfolioByType = useMemo(() => {
    const g: Record<string, number> = {};
    investments.forEach(inv => { g[inv.type] = (g[inv.type] || 0) + inv.currentValue; });
    return Object.entries(g).map(([type, value]) => ({ name: investmentTypeLabels[type as InvestmentType], value, color: investmentColors[type as InvestmentType] }));
  }, [investments]);

  const portfolioBySector = useMemo(() => {
    const g: Record<string, number> = {};
    investments.forEach(inv => { const s = inv.sector || 'Other'; g[s] = (g[s] || 0) + inv.currentValue; });
    return Object.entries(g).map(([name, value], i) => ({ name, value, color: ['#7a9eb8', '#8ab896', '#a99bc4', '#d9b896', '#7db8a8', '#d9a8c4'][i % 6] }));
  }, [investments]);

  // Performance heatmap
  const heatmapData = investments.map(inv => ({
    name: inv.name.length > 12 ? inv.name.slice(0, 12) + '…' : inv.name,
    pnl: inv.pnlPercent,
    value: inv.currentValue,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Portfolio" value={fmt(stats.portfolioValue, true)} icon={BarChart3} />
        <StatCard label="Invested" value={fmt(stats.totalInvested, true)} icon={Banknote} />
        <StatCard label="P&L" value={`${isProfit ? '+' : ''}${fmt(stats.totalPnl, true)}`} color={isProfit ? '#22c55e' : '#ef4444'} icon={isProfit ? TrendingUp : TrendingDown} sub={`${isProfit ? '+' : ''}${stats.totalInvested > 0 ? ((stats.totalPnl / stats.totalInvested) * 100).toFixed(1) : '0.0'}%`} />
        <StatCard label="Assets" value={String(investments.length)} icon={Layers} />
        <StatCard label="Best Performer" value={investments.length > 0 ? investments.reduce((a, b) => a.pnlPercent > b.pnlPercent ? a : b).name.slice(0, 15) : '—'} color="#22c55e" icon={Trophy} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Type Allocation */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={PieChartIcon} title="Asset Allocation" />
          {portfolioByType.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart><Pie data={portfolioByType} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="#fff" strokeWidth={2}>{portfolioByType.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} /><Legend wrapperStyle={{ fontFamily: 'Kalam', fontSize: 11 }} /></RePieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-52 flex items-center justify-center font-kalam text-slate-400 italic">Add investments to see allocation</div>}
        </div>

        {/* Performance Heatmap */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={BarChart3} title="Performance Heatmap" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {heatmapData.map((h, i) => (
              <div key={i} className="rounded-lg p-3 text-center border border-[#e8dac0]" style={{ backgroundColor: h.pnl >= 10 ? '#dcfce7' : h.pnl >= 0 ? '#f0fdf4' : h.pnl >= -10 ? '#fef2f2' : '#fecaca' }}>
                <p className="font-kalam text-[11px] text-[#2d2d2d] font-bold truncate">{h.name}</p>
                <p className={`font-caveat text-lg font-bold ${h.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>{h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(1)}%</p>
              </div>
            ))}
            {heatmapData.length === 0 && <div className="col-span-3 py-8 text-center font-kalam text-slate-400 italic text-sm">No investments yet</div>}
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white border border-[#e8dac0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8dac0] flex items-center justify-between">
          <h3 className="font-caveat text-xl font-bold text-[#2d2d2d]">Holdings</h3>
          <span className="font-kalam text-xs text-slate-500">{investments.length} assets</span>
        </div>
        <div className="divide-y divide-[#f0ece4]">
          {investments.map(inv => {
            const Icon = investmentIcons[inv.type] || Wallet;
            return (
              <div key={inv.id} className="flex items-center px-5 py-3 hover:bg-[#fefcf8] transition-colors group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: `${investmentColors[inv.type]}20` }}>
                  <Icon className="w-4 h-4" style={{ color: investmentColors[inv.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-kalam text-sm font-bold text-[#2d2d2d] truncate">{inv.name}</p>
                  <p className="font-kalam text-[11px] text-slate-500">{investmentTypeLabels[inv.type]} · Qty {inv.quantity}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="font-caveat text-lg font-bold text-[#2d2d2d]">{fmt(inv.currentValue, true)}</p>
                  <p className={`font-kalam text-[11px] font-bold ${inv.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>{inv.pnl >= 0 ? '+' : ''}{inv.pnlPercent.toFixed(1)}%</p>
                </div>
                <button onClick={() => deleteInvestment(inv.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            );
          })}
          {investments.length === 0 && <div className="text-center py-8 font-kalam text-slate-400 italic text-sm">No investments yet</div>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3: BUDGET — Enhanced Expense Intelligence
// ══════════════════════════════════════════════════════════════
function BudgetLedger() {
  const { transactions, addTransaction, deleteTransaction, subscriptions, deleteSubscription, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 1;
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  const needsSpend = transactions.filter(t => t.type === 'expense' && needsCategories.includes(t.category.toLowerCase())).reduce((s, t) => s + t.amount, 0);
  const wantsSpend = transactions.filter(t => t.type === 'expense' && wantsCategories.includes(t.category.toLowerCase())).reduce((s, t) => s + t.amount, 0);
  const savingsActual = Math.max(0, net);
  const needsR = (needsSpend / income) * 100; const wantsR = (wantsSpend / income) * 100; const savingsR = (savingsActual / income) * 100;

  // Expense velocity
  const today = new Date();
  const dayOfMonth = today.getDate();
  const dailyBurn = dayOfMonth > 0 ? expenses / dayOfMonth : 0;
  const projectedMonthly = dailyBurn * 30;

  const categoryData = useMemo(() => {
    const g: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => { g[t.category] = (g[t.category] || 0) + t.amount; });
    return Object.entries(g).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i); const start = startOfMonth(d); const end = endOfMonth(d);
      const mi = transactions.filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end })).reduce((s, t) => s + t.amount, 0);
      const me = transactions.filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })).reduce((s, t) => s + t.amount, 0);
      months.push({ month: format(d, 'MMM'), income: mi, expense: me });
    }
    return months;
  }, [transactions]);

  const subTotal = subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + (s.frequency === 'yearly' ? s.amount / 12 : s.amount), 0);

  let insight = "Your spending is balanced!";
  if (needsR > 55) insight = "Essentials are high. Review fixed costs like rent or utilities.";
  else if (wantsR > 35) insight = "Lifestyle spending elevated. Small cuts in dining can compound.";
  else if (savingsR >= 25) insight = "Exceptional savings rate! Consider investing the surplus.";

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Budget Analysis" rotate={-0.3}>{insight}</JarvisNote>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Income" value={fmt(income === 1 ? 0 : income, true)} color="#22c55e" icon={ArrowUpRight} />
        <StatCard label="Expenses" value={fmt(expenses, true)} color="#ef4444" icon={ArrowDownRight} />
        <StatCard label="Net" value={fmt(net, true)} color={net >= 0 ? '#3b82f6' : '#ef4444'} icon={getCurrencyIcon(currencyPreference)} />
        <StatCard label="Daily Burn" value={fmt(Math.round(dailyBurn))} color="#f59e0b" icon={Flame} sub={`~${fmt(Math.round(projectedMonthly), true)}/mo projected`} />
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4 flex items-center justify-center">
          <Button onClick={() => setIsAddOpen(true)} className="journal-btn-primary w-full"><Plus className="w-4 h-4 mr-1" /> Log Transaction</Button>
        </div>
      </div>

      {/* 50/30/20 */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <SectionTitle icon={PieChartIcon} title="50 / 30 / 20 Budget Rule" />
        <div className="grid grid-cols-3 gap-4">
          <BudgetBar label="Needs" target={50} actual={needsR} amount={needsSpend} color="#a78bfa" />
          <BudgetBar label="Wants" target={30} actual={wantsR} amount={wantsSpend} color="#fbbf24" />
          <BudgetBar label="Savings" target={20} actual={savingsR} amount={savingsActual} color="#34d399" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Expense Breakdown */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={BarChart3} title="Expense Breakdown" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e8dac0" />
                <XAxis type="number" tickFormatter={v => fmt(v, true)} tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#5a5a5a' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} /><Bar dataKey="value" fill="#d4a574" radius={[0, 4, 4, 0]} stroke="#2d2d2d" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={Repeat} title="Subscriptions" action={<Badge variant="outline" className="font-kalam text-xs font-bold">{fmt(Math.round(subTotal))}/mo</Badge>} />
          <div className="space-y-2">
            {subscriptions.filter(s => s.isActive).map(sub => (
              <div key={sub.id} className="flex items-center justify-between py-2 px-3 bg-[#fefcf8] rounded-lg border border-[#f0ece4] group">
                <div><p className="font-kalam text-sm font-bold text-[#2d2d2d]">{sub.name}</p><p className="font-kalam text-[11px] text-slate-500">{sub.category}</p></div>
                <div className="flex items-center gap-2">
                  <p className="font-caveat text-lg font-bold text-[#2d2d2d]">{fmt(sub.amount)}<span className="text-xs text-slate-400 font-kalam">/{sub.frequency === 'yearly' ? 'yr' : 'mo'}</span></p>
                  <button onClick={() => deleteSubscription(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3 h-3 text-red-400" /></button>
                </div>
              </div>
            ))}
            <p className="font-kalam text-xs text-slate-500 text-center pt-1">Annual cost: {fmt(Math.round(subTotal * 12))}</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-[#e8dac0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8dac0] flex items-center justify-between">
          <h3 className="font-caveat text-xl font-bold text-[#2d2d2d]">Recent Transactions</h3>
          <span className="font-kalam text-xs text-slate-500">{transactions.length} total</span>
        </div>
        <div className="divide-y divide-[#f0ece4] max-h-72 overflow-y-auto no-scrollbar">
          {transactions.slice(0, 15).map(t => (
            <div key={t.id} className="flex items-center px-5 py-2.5 hover:bg-[#fefcf8] transition-colors group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${t.type === 'income' ? 'bg-green-100' : 'bg-red-50'}`}>
                {t.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0"><p className="font-kalam text-sm font-bold text-[#2d2d2d] truncate">{t.description}</p><p className="font-kalam text-[11px] text-slate-500">{t.category} · {format(new Date(t.date), 'MMM d')}</p></div>
              <p className={`font-caveat text-lg font-bold mr-2 ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
              <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3 h-3 text-red-400" /></button>
            </div>
          ))}
          {transactions.length === 0 && <div className="text-center py-8 font-kalam text-slate-400 italic text-sm">No transactions yet</div>}
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="journal-modal max-w-md"><DialogHeader><DialogTitle className="font-caveat text-2xl">Log Transaction</DialogTitle></DialogHeader>
          <TransactionForm onSubmit={t => { addTransaction(t); setIsAddOpen(false); toast.success('Logged!'); }} onCancel={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetBar({ label, target, actual, amount, color }: { label: string; target: number; actual: number; amount: number; color: string }) {
  const over = actual > target;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-kalam text-sm font-bold text-[#2d2d2d]">{label}</span>
        <Badge variant="outline" className={`text-[10px] font-kalam font-bold ${over ? 'border-red-300 text-red-500' : 'border-green-300 text-green-600'}`}>{actual.toFixed(0)}% / {target}%</Badge>
      </div>
      <p className="font-caveat text-xl font-bold mb-1.5" style={{ color }}>{fmt(amount, true)}</p>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (actual / target) * 100)}%`, backgroundColor: color }} /></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4: SAVINGS GOALS
// ══════════════════════════════════════════════════════════════
function SavingsGoalsTab() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, user, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', monthly: '', icon: '🎯', color: '#7a9eb8', priority: 'medium' as const });

  const handleAdd = () => {
    if (!newGoal.name || !newGoal.target) { toast.error('Fill required fields'); return; }
    addSavingsGoal({ userId: user?.id || 'user-1', name: newGoal.name, targetAmount: parseFloat(newGoal.target), currentSaved: 0, priority: newGoal.priority, color: newGoal.color, icon: newGoal.icon, monthlySavingTarget: parseFloat(newGoal.monthly) || 5000 });
    setIsAddOpen(false); setNewGoal({ name: '', target: '', monthly: '', icon: '🎯', color: '#7a9eb8', priority: 'medium' });
  };

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentSaved, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Goal Coach" rotate={0.3}>
        {overallPct >= 50 ? `You're ${overallPct.toFixed(0)}% there across all goals! Keep the momentum going.`
          : `You've saved ${fmt(totalSaved, true)} of ${fmt(totalTarget, true)} total. Focus on one goal at a time for faster results.`}
      </JarvisNote>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Target" value={fmt(totalTarget, true)} icon={Target} />
        <StatCard label="Total Saved" value={fmt(totalSaved, true)} color="#22c55e" icon={PiggyBank} />
        <StatCard label="Remaining" value={fmt(totalTarget - totalSaved, true)} color="#f59e0b" icon={Clock} />
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {savingsGoals.map(goal => {
          const pct = Math.min(100, (goal.currentSaved / goal.targetAmount) * 100);
          const remaining = goal.targetAmount - goal.currentSaved;
          const monthsLeft = goal.monthlySavingTarget > 0 ? Math.ceil(remaining / goal.monthlySavingTarget) : 999;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-[#e8dac0] rounded-xl p-5 hover:shadow-md transition-all relative group">
              <button onClick={() => deleteSavingsGoal(goal.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full relative flex items-center justify-center flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={goal.color} strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-2xl">{goal.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-kalam text-base font-bold text-[#2d2d2d] truncate">{goal.name}</p>
                  <p className="font-caveat text-2xl font-bold" style={{ color: goal.color }}>{fmt(goal.currentSaved, true)}<span className="text-sm text-slate-400 font-kalam"> / {fmt(goal.targetAmount, true)}</span></p>
                  <div className="flex gap-3 mt-2">
                    <Badge variant="outline" className="font-kalam text-[10px]">{pct.toFixed(0)}% done</Badge>
                    <Badge variant="outline" className="font-kalam text-[10px]">{monthsLeft < 999 ? `${monthsLeft} mo left` : 'No deadline'}</Badge>
                  </div>
                </div>
              </div>

              {/* Quick add savings */}
              <div className="flex gap-2 mt-4">
                {[1000, 5000, 10000].map(amt => (
                  <button key={amt} onClick={() => updateSavingsGoal(goal.id, { currentSaved: Math.min(goal.targetAmount, goal.currentSaved + amt) })}
                    className="flex-1 py-1.5 rounded-lg text-xs font-kalam font-bold border border-[#e8dac0] hover:bg-[#fefcf8] transition-all">+{fmt(amt, true)}</button>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Add Goal Card */}
        <button onClick={() => setIsAddOpen(true)} className="bg-white border-2 border-dashed border-[#e8dac0] rounded-xl p-5 hover:border-[#d4a574] transition-all flex flex-col items-center justify-center min-h-[180px] group">
          <Plus className="w-8 h-8 text-slate-300 group-hover:text-[#d4a574] transition-colors mb-2" />
          <p className="font-kalam text-sm font-bold text-slate-400 group-hover:text-[#d4a574]">New Savings Goal</p>
        </button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="journal-modal max-w-md"><DialogHeader><DialogTitle className="font-caveat text-2xl">Create Savings Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1"><label className="font-kalam text-sm font-bold mb-1 block">Goal Name</label><Input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} placeholder="e.g., MacBook Pro" className="journal-input bg-white" /></div>
              <div className="w-20"><label className="font-kalam text-sm font-bold mb-1 block">Icon</label>
                <Select value={newGoal.icon} onValueChange={v => setNewGoal(p => ({ ...p, icon: v }))}><SelectTrigger className="journal-input text-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{['🎯', '💻', '✈️', '🏠', '🚗', '🛡️', '📱', '🎓', '💍', '🏋️'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-kalam text-sm font-bold mb-1 block">Target ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))} className="journal-input bg-white" /></div>
              <div><label className="font-kalam text-sm font-bold mb-1 block">Monthly Save ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={newGoal.monthly} onChange={e => setNewGoal(p => ({ ...p, monthly: e.target.value }))} className="journal-input bg-white" /></div>
            </div>
            <Button onClick={handleAdd} className="w-full journal-btn-primary">Create Goal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 5: SIP PLANNER (Enhanced)
// ══════════════════════════════════════════════════════════════
function SIPCalculator() {
  const { currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [mode, setMode] = useState<'sip' | 'lumpsum' | 'goalbased'>('sip');
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [stepUp, setStepUp] = useState(0);
  const [inflationRate, setInflationRate] = useState(6);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  // Lump sum
  const [lumpsum, setLumpsum] = useState(100000);
  // Goal-based
  const [goalAmount, setGoalAmount] = useState(10000000);
  const [goalYears, setGoalYears] = useState(15);
  const [goalReturn, setGoalReturn] = useState(12);

  const sipCalc = useMemo(() => {
    let cm = monthlyInvestment; let tv = 0; let ti = 0; const mr = expectedReturn / 100 / 12; const data = [];
    for (let i = 1; i <= years * 12; i++) {
      if (i > 1 && (i - 1) % 12 === 0) cm *= (1 + stepUp / 100);
      ti += cm; tv = (tv + cm) * (1 + mr);
      if (i % 12 === 0) {
        const yr = i / 12; const inf = Math.pow(1 + inflationRate / 100, yr);
        data.push({ year: `Y${yr}`, value: adjustForInflation ? Math.round(tv / inf) : Math.round(tv), invested: Math.round(ti) });
      }
    }
    const fv = data[data.length - 1]?.value || 0;
    return { futureValue: fv, totalInvested: Math.round(ti), wealth: Math.round(fv - ti), chartData: data };
  }, [monthlyInvestment, expectedReturn, years, stepUp, inflationRate, adjustForInflation]);

  const lumpsumCalc = useMemo(() => {
    const fv = lumpsum * Math.pow(1 + expectedReturn / 100, years);
    const data = Array.from({ length: years }, (_, i) => ({
      year: `Y${i + 1}`, value: Math.round(lumpsum * Math.pow(1 + expectedReturn / 100, i + 1)), invested: lumpsum
    }));
    return { futureValue: Math.round(fv), wealth: Math.round(fv - lumpsum), chartData: data };
  }, [lumpsum, expectedReturn, years]);

  const goalBasedCalc = useMemo(() => {
    const mr = goalReturn / 100 / 12; const months = goalYears * 12;
    const monthlyNeeded = goalAmount * mr / (Math.pow(1 + mr, months) - 1);
    return { monthlyNeeded: Math.round(monthlyNeeded), totalInvested: Math.round(monthlyNeeded * months), growth: Math.round(goalAmount - monthlyNeeded * months) };
  }, [goalAmount, goalYears, goalReturn]);

  // Power of compounding comparison
  const compoundingComparison = useMemo(() => {
    const earlyStart = 25; const lateStart = 35; const retireAge = 60;
    const mr = 12 / 100 / 12;
    const calc = (startAge: number) => {
      let total = 0;
      for (let i = 0; i < (retireAge - startAge) * 12; i++) total = (total + 5000) * (1 + mr);
      return Math.round(total);
    };
    return { early: calc(earlyStart), late: calc(lateStart), diff: calc(earlyStart) - calc(lateStart) };
  }, []);

  return (
    <div className="space-y-5">
      {/* Mode Selector */}
      <div className="flex gap-2">
        {[{ id: 'sip', label: 'SIP Calculator', icon: TrendingUp }, { id: 'lumpsum', label: 'Lump Sum', icon: Banknote }, { id: 'goalbased', label: 'Goal-Based', icon: Target }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-kalam font-bold border-2 transition-all ${mode === m.id ? 'bg-[#2d2d2d] text-white border-[#2d2d2d]' : 'bg-white text-slate-600 border-[#e8dac0] hover:border-slate-400'}`}>
            <m.icon className="w-4 h-4" />{m.label}
          </button>
        ))}
      </div>

      {mode === 'sip' && (
        <>
          <JarvisNote title="JARVIS Future Planner" rotate={0.3}>
            {adjustForInflation ? `At ${inflationRate}% inflation, your ${fmt(sipCalc.futureValue, true)} reflects real purchasing power.`
              : `${fmt(monthlyInvestment)}/mo at ${expectedReturn}% for ${years} years → ${fmt(sipCalc.futureValue, true)}.`}
          </JarvisNote>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Monthly ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={monthlyInvestment} onChange={e => setMonthlyInvestment(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Return (%)</label><Input type="number" value={expectedReturn} onChange={e => setExpectedReturn(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Years</label><Input type="number" value={years} onChange={e => setYears(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Step-up (%/yr)</label><Input type="number" value={stepUp} onChange={e => setStepUp(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Inflation (%)</label><Input type="number" value={inflationRate} onChange={e => setInflationRate(+e.target.value)} className="journal-input bg-white" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg w-fit">
            <input type="checkbox" checked={adjustForInflation} onChange={e => setAdjustForInflation(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="font-kalam text-sm font-bold text-amber-800">Inflation-adjusted</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Invested" value={fmt(sipCalc.totalInvested, true)} icon={Banknote} />
            <StatCard label="Returns" value={fmt(sipCalc.wealth, true)} color="#22c55e" icon={TrendingUp} />
            <StatCard label={adjustForInflation ? 'Real Value' : 'Future Value'} value={fmt(sipCalc.futureValue, true)} color="#a855f7" icon={Target} />
          </div>
          <div className="h-56 bg-white border border-[#e8dac0] rounded-xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sipCalc.chartData}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8dac0" />
                <XAxis dataKey="year" tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                <Area type="monotone" dataKey="value" name="Projected" stroke="#a855f7" fill="#a855f720" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {mode === 'lumpsum' && (
        <>
          <JarvisNote title="JARVIS Lump Sum" rotate={-0.3}>One-time {fmt(lumpsum)} at {expectedReturn}% for {years} years → {fmt(lumpsumCalc.futureValue, true)}.</JarvisNote>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Amount ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={lumpsum} onChange={e => setLumpsum(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Return (%)</label><Input type="number" value={expectedReturn} onChange={e => setExpectedReturn(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Years</label><Input type="number" value={years} onChange={e => setYears(+e.target.value)} className="journal-input bg-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Invested" value={fmt(lumpsum, true)} icon={Banknote} />
            <StatCard label="Returns" value={fmt(lumpsumCalc.wealth, true)} color="#22c55e" icon={TrendingUp} />
            <StatCard label="Future Value" value={fmt(lumpsumCalc.futureValue, true)} color="#a855f7" icon={Target} />
          </div>
          <div className="h-56 bg-white border border-[#e8dac0] rounded-xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lumpsumCalc.chartData}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8dac0" />
                <XAxis dataKey="year" tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                <Area type="monotone" dataKey="value" name="Growth" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {mode === 'goalbased' && (
        <>
          <JarvisNote title="JARVIS Goal-Based SIP" rotate={0.3}>To reach {fmt(goalAmount, true)} in {goalYears} years at {goalReturn}% returns, you need {fmt(goalBasedCalc.monthlyNeeded)}/month.</JarvisNote>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Goal ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={goalAmount} onChange={e => setGoalAmount(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Years</label><Input type="number" value={goalYears} onChange={e => setGoalYears(+e.target.value)} className="journal-input bg-white" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Return (%)</label><Input type="number" value={goalReturn} onChange={e => setGoalReturn(+e.target.value)} className="journal-input bg-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Monthly SIP" value={fmt(goalBasedCalc.monthlyNeeded)} color="#a855f7" icon={Banknote} />
            <StatCard label="Total Invested" value={fmt(goalBasedCalc.totalInvested, true)} icon={PiggyBank} />
            <StatCard label="Growth" value={fmt(goalBasedCalc.growth, true)} color="#22c55e" icon={TrendingUp} />
          </div>
        </>
      )}

      {/* Compounding Comparison */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <SectionTitle icon={Zap} title="Power of Starting Early" />
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="font-kalam text-xs font-bold text-green-700 mb-1">Start at 25</p>
            <p className="font-caveat text-2xl font-bold text-green-600">{fmt(compoundingComparison.early, true)}</p>
            <p className="font-kalam text-[11px] text-green-600">{fmt(5000, true)}/mo × 35 yrs</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="font-kalam text-xs font-bold text-amber-700 mb-1">Start at 35</p>
            <p className="font-caveat text-2xl font-bold text-amber-600">{fmt(compoundingComparison.late, true)}</p>
            <p className="font-kalam text-[11px] text-amber-600">{fmt(5000, true)}/mo × 25 yrs</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="font-kalam text-xs font-bold text-purple-700 mb-1">Difference</p>
            <p className="font-caveat text-2xl font-bold text-purple-600">{fmt(compoundingComparison.diff, true)}</p>
            <p className="font-kalam text-[11px] text-purple-600">10 years make this gap</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 6: EMI & DEBT
// ══════════════════════════════════════════════════════════════
function EMIDebtTab() {
  const { emis, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [principal, setPrincipal] = useState(500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(5);
  const [prepayment, setPrepayment] = useState(0);
  const [showAmortization, setShowAmortization] = useState(false);
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('avalanche');

  const calc = useMemo(() => {
    const mr = interestRate / 100 / 12; const months = tenure * 12;
    const emi = principal * mr * Math.pow(1 + mr, months) / (Math.pow(1 + mr, months) - 1);
    let balance = principal; let totalInterest = 0; let actualMonths = 0;
    const schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[] = [];
    while (balance > 0 && actualMonths < months * 2) {
      const interest = balance * mr; const pmtPrincipal = emi + prepayment - interest;
      totalInterest += interest; balance = Math.max(0, balance - pmtPrincipal); actualMonths++;
      schedule.push({ month: actualMonths, emi: Math.round(emi), principal: Math.round(pmtPrincipal), interest: Math.round(interest), balance: Math.round(balance) });
    }
    const savedInterest = (emi * months - principal) - totalInterest;
    return { emi: Math.round(emi), totalAmount: Math.round(principal + totalInterest), totalInterest: Math.round(totalInterest), actualMonths, savedInterest: Math.round(Math.max(0, savedInterest)), schedule };
  }, [principal, interestRate, tenure, prepayment]);

  const pieData = [{ name: 'Principal', value: principal, color: '#a78bfa' }, { name: 'Interest', value: calc.totalInterest, color: '#fbbf24' }];

  // Active EMIs summary
  const activeEmis = emis.filter(e => e.status === 'active');
  const totalDebt = activeEmis.reduce((s, e) => s + (e.emiAmount * e.remainingMonths), 0);
  const totalMonthlyEMI = activeEmis.reduce((s, e) => s + e.emiAmount, 0);
  const dti = 50000; // Assumed income for ratio
  const dtiRatio = (totalMonthlyEMI / dti) * 100;

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Debt Advisor" rotate={-0.3}>
        {prepayment > 0 ? `Extra ${fmt(prepayment)}/mo saves ${fmt(calc.savedInterest)} in interest and cuts ${Math.max(0, tenure * 12 - calc.actualMonths)} months!`
          : `Your EMI is ${fmt(calc.emi)}/mo. Try adding extra monthly payment to see interest savings.`}
      </JarvisNote>

      {/* Active EMIs Overview */}
      {activeEmis.length > 0 && (
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={CreditCard} title="Active Loans" action={<Badge className="bg-amber-100 text-amber-700 font-kalam text-xs">DTI Ratio: {dtiRatio.toFixed(0)}%</Badge>} />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="Total Debt" value={fmt(totalDebt, true)} color="#ef4444" icon={CreditCard} />
            <StatCard label="Monthly Outflow" value={fmt(totalMonthlyEMI)} color="#f59e0b" icon={ArrowDownRight} />
            <StatCard label="Active Loans" value={String(activeEmis.length)} icon={Layers} />
          </div>
          <div className="space-y-2">
            {activeEmis.map(emi => {
              const progress = ((emi.paidMonths) / (emi.paidMonths + emi.remainingMonths)) * 100;
              return (
                <div key={emi.id} className="flex items-center gap-4 p-3 bg-[#fefcf8] rounded-lg border border-[#f0ece4]">
                  <div className="flex-1">
                    <p className="font-kalam text-sm font-bold text-[#2d2d2d]">{emi.name}</p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="text-right">
                    <p className="font-caveat text-lg font-bold">{fmt(emi.emiAmount)}/mo</p>
                    <p className="font-kalam text-[11px] text-slate-500">{emi.remainingMonths} months left</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMI Calculator */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <SectionTitle icon={Calculator} title="EMI Calculator" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Loan ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={principal} onChange={e => setPrincipal(+e.target.value)} className="journal-input bg-white" /></div>
          <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Rate (%)</label><Input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(+e.target.value)} className="journal-input bg-white" /></div>
          <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Years</label><Input type="number" value={tenure} onChange={e => setTenure(+e.target.value)} className="journal-input bg-white" /></div>
          <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Extra/mo ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={prepayment} onChange={e => setPrepayment(+e.target.value)} className="journal-input bg-white" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <StatCard label="Monthly EMI" value={fmt(calc.emi)} icon={CreditCard} />
          <StatCard label="Total Interest" value={fmt(calc.totalInterest, true)} color="#f59e0b" icon={Percent} />
          <StatCard label="Total Payable" value={fmt(calc.totalAmount, true)} icon={Banknote} />
          <StatCard label="Interest Saved" value={prepayment > 0 ? fmt(calc.savedInterest, true) : '—'} color={prepayment > 0 ? '#22c55e' : '#8a8a8a'} icon={PiggyBank} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={PieChartIcon} title="Principal vs Interest" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="#2d2d2d" strokeWidth={1.5}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} /><Legend wrapperStyle={{ fontFamily: 'Kalam', fontSize: 12 }} verticalAlign="bottom" /></RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Amortization Preview */}
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={BookOpen} title="Amortization Schedule" action={<button onClick={() => setShowAmortization(!showAmortization)} className="font-kalam text-xs text-blue-500 hover:underline">{showAmortization ? 'Hide' : 'Show All'}</button>} />
          <div className="max-h-52 overflow-y-auto no-scrollbar">
            <table className="w-full text-xs font-kalam">
              <thead><tr className="border-b border-[#e8dac0]"><th className="py-2 text-left text-slate-500">#</th><th className="py-2 text-right text-slate-500">Principal</th><th className="py-2 text-right text-slate-500">Interest</th><th className="py-2 text-right text-slate-500">Balance</th></tr></thead>
              <tbody>{calc.schedule.slice(0, showAmortization ? undefined : 12).map(row => (
                <tr key={row.month} className="border-b border-[#f0ece4]"><td className="py-1.5">{row.month}</td><td className="py-1.5 text-right">{fmt(row.principal)}</td><td className="py-1.5 text-right text-amber-600">{fmt(row.interest)}</td><td className="py-1.5 text-right font-bold">{fmt(row.balance)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 7: FIRE CALCULATOR
// ══════════════════════════════════════════════════════════════
function FIRECalculator() {
  const { currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [annualExpenses, setAnnualExpenses] = useState(600000);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [monthlySavings, setMonthlySavings] = useState(30000);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [currentAge, setCurrentAge] = useState(25);

  const fireNumber = annualExpenses / (withdrawalRate / 100);
  const progress = (currentSavings / fireNumber) * 100;

  // FIRE date calculation
  const fireCalc = useMemo(() => {
    const mr = expectedReturn / 100 / 12; let balance = currentSavings; let months = 0;
    const data = [{ year: 0, value: balance, target: fireNumber }];
    while (balance < fireNumber && months < 600) {
      balance = (balance + monthlySavings) * (1 + mr); months++;
      if (months % 12 === 0) data.push({ year: months / 12, value: Math.round(balance), target: fireNumber });
    }
    return { months, years: Math.ceil(months / 12), fireAge: currentAge + Math.ceil(months / 12), chartData: data };
  }, [currentSavings, monthlySavings, expectedReturn, fireNumber, currentAge]);

  // FIRE variants
  const leanFire = annualExpenses * 0.6 / (withdrawalRate / 100);
  const fatFire = annualExpenses * 1.5 / (withdrawalRate / 100);
  const coastAge = useMemo(() => {
    const annualReturn = expectedReturn / 100; let balance = currentSavings; let yrs = 0;
    const coastTarget = fireNumber / Math.pow(1 + annualReturn, 35 - currentAge);
    while (balance < coastTarget && yrs < 50) { balance = (balance + monthlySavings * 12) * (1 + annualReturn); yrs++; }
    return currentAge + yrs;
  }, [currentSavings, monthlySavings, expectedReturn, fireNumber, currentAge]);

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS FIRE Advisor" rotate={0.3}>
        {progress >= 100 ? `🎉 Congratulations! You've reached your FIRE number! You can withdraw ${fmt(annualExpenses)}/yr sustainably.`
          : `You're ${progress.toFixed(0)}% toward FIRE. At current rate, you'll reach financial independence at age ${fireCalc.fireAge}.`}
      </JarvisNote>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Annual Expenses ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={annualExpenses} onChange={e => setAnnualExpenses(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Current Savings ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={currentSavings} onChange={e => setCurrentSavings(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Monthly Save ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={monthlySavings} onChange={e => setMonthlySavings(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Return (%)</label><Input type="number" value={expectedReturn} onChange={e => setExpectedReturn(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Withdrawal (%)</label><Input type="number" step="0.5" value={withdrawalRate} onChange={e => setWithdrawalRate(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Current Age</label><Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} className="journal-input bg-white" /></div>
      </div>

      {/* FIRE Progress */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-kalam text-xs font-bold text-slate-500 uppercase">Your FIRE Number</p>
            <p className="font-caveat text-4xl font-bold text-[#2d2d2d]">{fmt(fireNumber, true)}</p>
          </div>
          <div className="text-right">
            <p className="font-kalam text-xs font-bold text-slate-500 uppercase">FIRE Age</p>
            <p className="font-caveat text-4xl font-bold text-green-600">{fireCalc.fireAge}</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <p className="font-kalam text-sm text-slate-600 text-center">{fmt(currentSavings, true)} / {fmt(fireNumber, true)} — <span className="font-bold">{progress.toFixed(1)}%</span> achieved · {fireCalc.years} years to go</p>
      </div>

      {/* Wealth Growth Chart */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <SectionTitle icon={TrendingUp} title="Wealth Growth Projection" />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fireCalc.chartData}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8dac0" />
              <XAxis dataKey="year" tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} label={{ value: 'Years', fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} />
              <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontFamily: 'Kalam', fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="value" name="Your Wealth" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={2} />
              <Line type="monotone" dataKey="target" name="FIRE Target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FIRE Variants */}
      <div className="grid lg:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="font-kalam text-xs font-bold text-green-700 uppercase mb-1">Lean FIRE</p>
          <p className="font-caveat text-2xl font-bold text-green-600">{fmt(leanFire, true)}</p>
          <p className="font-kalam text-[11px] text-green-600">60% of expenses</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="font-kalam text-xs font-bold text-orange-700 uppercase mb-1">Regular FIRE</p>
          <p className="font-caveat text-2xl font-bold text-orange-600">{fmt(fireNumber, true)}</p>
          <p className="font-kalam text-[11px] text-orange-600">100% of expenses</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="font-kalam text-xs font-bold text-purple-700 uppercase mb-1">Fat FIRE</p>
          <p className="font-caveat text-2xl font-bold text-purple-600">{fmt(fatFire, true)}</p>
          <p className="font-kalam text-[11px] text-purple-600">150% of expenses</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="font-kalam text-xs font-bold text-blue-700 uppercase mb-1">Coast FIRE Age</p>
          <p className="font-caveat text-2xl font-bold text-blue-600">{coastAge}</p>
          <p className="font-kalam text-[11px] text-blue-600">Stop saving after this</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 8: TAX PLANNER (Indian)
// ══════════════════════════════════════════════════════════════
function TaxPlanner() {
  const { currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [sec80c, setSec80c] = useState(50000);
  const [sec80d, setSec80d] = useState(10000);
  const [hra, setHra] = useState(0);
  const [nps, setNps] = useState(0);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);

  // Old Regime
  const oldRegimeTax = useMemo(() => {
    const deductions = Math.min(sec80c, 150000) + Math.min(sec80d, 25000) + hra + Math.min(nps, 50000) + Math.min(homeLoanInterest, 200000) + 50000; // 50K standard
    const taxable = Math.max(0, annualIncome - deductions);
    let tax = 0;
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.3;
    if (taxable > 500000) tax += Math.min(taxable - 500000, 500000) * 0.2;
    if (taxable > 250000) tax += Math.min(taxable - 250000, 250000) * 0.05;
    const cess = tax * 0.04;
    return { taxable, deductions, tax: Math.round(tax), cess: Math.round(cess), total: Math.round(tax + cess) };
  }, [annualIncome, sec80c, sec80d, hra, nps, homeLoanInterest]);

  // New Regime (2024-25 slabs)
  const newRegimeTax = useMemo(() => {
    const taxable = Math.max(0, annualIncome - 75000); // Standard deduction
    let tax = 0;
    const slabs = [[300000, 0], [400000, 0.05], [500000, 0.1], [600000, 0.15], [700000, 0.2], [Infinity, 0.3]];
    let remaining = taxable; let prev = 0;
    for (const [limit, rate] of slabs) {
      const slabAmount = Math.min(remaining, (limit as number) - prev);
      if (slabAmount > 0) tax += slabAmount * (rate as number);
      remaining -= slabAmount; prev = limit as number;
      if (remaining <= 0) break;
    }
    if (taxable <= 700000) tax = 0; // Rebate u/s 87A
    const cess = tax * 0.04;
    return { taxable, tax: Math.round(tax), cess: Math.round(cess), total: Math.round(tax + cess) };
  }, [annualIncome]);

  const savings = newRegimeTax.total - oldRegimeTax.total;
  const betterRegime = savings > 0 ? 'old' : 'new';
  const sec80cUsed = (Math.min(sec80c, 150000) / 150000) * 100;
  const sec80dUsed = (Math.min(sec80d, 25000) / 25000) * 100;

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Tax Advisor" rotate={-0.3}>
        {betterRegime === 'old'
          ? `Old regime saves you ${fmt(Math.abs(savings))} with your current deductions. Max your 80C to save even more!`
          : `New regime is better by ${fmt(Math.abs(savings))}. Current deductions aren't enough to benefit from old regime.`}
      </JarvisNote>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Annual Income ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">80C (ELSS/PPF/LIC) ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={sec80c} onChange={e => setSec80c(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">80D (Health Insurance) ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={sec80d} onChange={e => setSec80d(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">HRA Exemption ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={hra} onChange={e => setHra(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">NPS (80CCD) ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={nps} onChange={e => setNps(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Home Loan Interest ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={homeLoanInterest} onChange={e => setHomeLoanInterest(+e.target.value)} className="journal-input bg-white" /></div>
      </div>

      {/* Regime Comparison */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`border-2 rounded-xl p-5 ${betterRegime === 'old' ? 'border-green-400 bg-green-50' : 'border-[#e8dac0] bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-caveat text-xl font-bold text-[#2d2d2d]">Old Regime</h3>
            {betterRegime === 'old' && <Badge className="bg-green-500 text-white font-kalam text-xs">Recommended</Badge>}
          </div>
          <div className="space-y-2 font-kalam text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Gross Income</span><span className="font-bold">{fmt(annualIncome)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Deductions</span><span className="font-bold text-green-600">-{fmt(oldRegimeTax.deductions)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Taxable</span><span className="font-bold">{fmt(oldRegimeTax.taxable)}</span></div>
            <div className="border-t border-[#e8dac0] pt-2 flex justify-between"><span className="font-bold">Tax + Cess</span><span className="font-bold text-red-500">{fmt(oldRegimeTax.total)}</span></div>
          </div>
        </div>
        <div className={`border-2 rounded-xl p-5 ${betterRegime === 'new' ? 'border-green-400 bg-green-50' : 'border-[#e8dac0] bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-caveat text-xl font-bold text-[#2d2d2d]">New Regime</h3>
            {betterRegime === 'new' && <Badge className="bg-green-500 text-white font-kalam text-xs">Recommended</Badge>}
          </div>
          <div className="space-y-2 font-kalam text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Gross Income</span><span className="font-bold">{fmt(annualIncome)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Standard Deduction</span><span className="font-bold text-green-600">-{fmt(75000)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Taxable</span><span className="font-bold">{fmt(newRegimeTax.taxable)}</span></div>
            <div className="border-t border-[#e8dac0] pt-2 flex justify-between"><span className="font-bold">Tax + Cess</span><span className="font-bold text-red-500">{fmt(newRegimeTax.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Deduction Usage */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
        <SectionTitle icon={Shield} title="Deduction Limits Used" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1"><span className="font-kalam text-sm font-bold">Section 80C</span><span className="font-kalam text-xs text-slate-500">{fmt(Math.min(sec80c, 150000))} / {fmt(150000)}</span></div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${sec80cUsed}%` }} /></div>
            <p className="font-kalam text-[11px] text-slate-500 mt-1">Remaining: {fmt(Math.max(0, 150000 - sec80c))}</p>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span className="font-kalam text-sm font-bold">Section 80D</span><span className="font-kalam text-xs text-slate-500">{fmt(Math.min(sec80d, 25000))} / {fmt(25000)}</span></div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{ width: `${sec80dUsed}%` }} /></div>
            <p className="font-kalam text-[11px] text-slate-500 mt-1">Remaining: {fmt(Math.max(0, 25000 - sec80d))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 9: CAN I BUY? (Enhanced)
// ══════════════════════════════════════════════════════════════
function AffordabilityCalculator() {
  const { purchaseLogs, addPurchaseLog, deletePurchaseLog, currencyPreference } = useApp();
  const fmt = useCallback((n: number, compact = false) => formatCurrency(n, currencyPreference, compact), [currencyPreference]);
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(25000);
  const [itemCost, setItemCost] = useState(50000);
  const [savingsAllocation, setSavingsAllocation] = useState(50);
  const [showEMI, setShowEMI] = useState(false);
  const [emiRate, setEmiRate] = useState(12);
  const [emiTenure, setEmiTenure] = useState(12);

  const savings = monthlyIncome - monthlyExpenses;
  const allocated = savings * (savingsAllocation / 100);
  const monthsToSave = allocated > 0 ? Math.ceil(itemCost / allocated) : 999;
  const canAfford = savings > 0 && monthsToSave <= 6;

  // EMI option
  const emiCalc = useMemo(() => {
    const mr = emiRate / 100 / 12;
    const emi = itemCost * mr * Math.pow(1 + mr, emiTenure) / (Math.pow(1 + mr, emiTenure) - 1);
    return { emi: Math.round(emi), total: Math.round(emi * emiTenure), interest: Math.round(emi * emiTenure - itemCost) };
  }, [itemCost, emiRate, emiTenure]);

  // Opportunity cost
  const opportunityCost = useMemo(() => {
    const mr = 12 / 100 / 12; let v = itemCost;
    for (let i = 0; i < 60; i++) v *= (1 + mr);
    return Math.round(v);
  }, [itemCost]);

  return (
    <div className="space-y-5">
      <JarvisNote title="JARVIS Purchase Advisor" rotate={0.3}>
        {canAfford ? `At ${savingsAllocation}% allocation, you'll have this in ${monthsToSave} months. The opportunity cost of investing instead: ${fmt(opportunityCost, true)} in 5 years.`
          : `This would take ${monthsToSave} months. Consider the EMI option below or boost savings.`}
      </JarvisNote>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Income/mo ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Expenses/mo ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(+e.target.value)} className="journal-input bg-white" /></div>
        <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Item Cost ({getCurrencySymbol(currencyPreference)})</label><Input type="number" value={itemCost} onChange={e => setItemCost(+e.target.value)} className="journal-input bg-white" /></div>
        <div className="flex items-end"><Button onClick={() => setShowEMI(!showEMI)} variant="outline" className="w-full journal-btn font-kalam bg-white hover:bg-slate-50">{showEMI ? 'Hide' : 'Show'} EMI Option</Button></div>
      </div>

      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <label className="font-kalam text-sm font-bold text-[#2d2d2d]">Savings Allocation</label>
          <span className="font-caveat text-lg font-bold text-[#2d2d2d]">{savingsAllocation}% → {fmt(allocated)}/mo</span>
        </div>
        <Slider value={[savingsAllocation]} onValueChange={v => setSavingsAllocation(v[0])} max={100} step={5} />
      </div>

      <div className={`p-5 border-2 rounded-xl flex items-center gap-4 transition-colors ${canAfford ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${canAfford ? 'bg-green-500' : 'bg-amber-500'}`}>
          {canAfford ? <CheckCircle2 className="w-7 h-7 text-white" /> : <Clock className="w-7 h-7 text-white" />}
        </div>
        <div>
          <p className="font-caveat text-2xl font-bold text-[#2d2d2d]">{canAfford ? 'You can afford this!' : 'Save a bit longer'}</p>
          <p className="font-kalam text-sm text-slate-600">Timeline: <span className="font-bold">{monthsToSave} month{monthsToSave !== 1 ? 's' : ''}</span> at {fmt(allocated)}/mo</p>
        </div>
      </div>

      {/* EMI vs Save Comparison */}
      {showEMI && (
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={CreditCard} title="EMI vs Save & Buy" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">EMI Rate (%)</label><Input type="number" value={emiRate} onChange={e => setEmiRate(+e.target.value)} className="journal-input" /></div>
            <div><label className="font-kalam text-xs font-bold mb-1 block text-slate-600">Tenure (months)</label><Input type="number" value={emiTenure} onChange={e => setEmiTenure(+e.target.value)} className="journal-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
              <p className="font-kalam text-xs font-bold text-red-700 uppercase mb-1">Buy with EMI</p>
              <p className="font-caveat text-2xl font-bold text-red-600">{fmt(emiCalc.total, true)}</p>
              <p className="font-kalam text-[11px] text-red-500">{fmt(emiCalc.emi)}/mo × {emiTenure} months</p>
              <p className="font-kalam text-[11px] text-red-500">Interest: {fmt(emiCalc.interest)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
              <p className="font-kalam text-xs font-bold text-green-700 uppercase mb-1">Save & Buy</p>
              <p className="font-caveat text-2xl font-bold text-green-600">{fmt(itemCost, true)}</p>
              <p className="font-kalam text-[11px] text-green-500">{fmt(allocated)}/mo × {monthsToSave} months</p>
              <p className="font-kalam text-[11px] text-green-500">You save: {fmt(emiCalc.interest)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Cost */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-4">
        <Lightbulb className="w-8 h-8 text-purple-500 flex-shrink-0" />
        <div>
          <p className="font-kalam text-sm font-bold text-purple-800">Opportunity Cost</p>
          <p className="font-kalam text-sm text-purple-700">If you invested {fmt(itemCost, true)} instead at 12% p.a., it would be worth <span className="font-bold">{fmt(opportunityCost, true)}</span> in 5 years.</p>
        </div>
      </div>

      {/* Purchase History */}
      {purchaseLogs.length > 0 && (
        <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
          <SectionTitle icon={ShoppingBag} title="Purchase History" />
          <div className="space-y-2">
            {purchaseLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-[#fefcf8] rounded-lg border border-[#f0ece4] group">
                <div>
                  <p className="font-kalam text-sm font-bold text-[#2d2d2d]">{log.name}</p>
                  <p className="font-kalam text-[11px] text-slate-500">{format(new Date(log.date), 'MMM d, yyyy')} · {'⭐'.repeat(log.satisfactionRating)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-caveat text-lg font-bold text-[#2d2d2d]">{fmt(log.amount, true)}</p>
                  <button onClick={() => deletePurchaseLog(log.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3 h-3 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE EXPORT
// ══════════════════════════════════════════════════════════════
export function MoneyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { addInvestment } = useApp();

  const handleAddInvestment = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    addInvestment(data); setIsAddDialogOpen(false); toast.success('Investment added!');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio', icon: Layers },
    { id: 'budget', label: 'Budget', icon: Receipt },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'sip', label: 'SIP', icon: TrendingUp },
    { id: 'emi', label: 'EMI & Debt', icon: CreditCard },
    { id: 'fire', label: 'FIRE', icon: Flame },
    { id: 'tax', label: 'Tax', icon: BadgeIndianRupee },
    { id: 'afford', label: 'Can I Buy?', icon: ShoppingBag },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-caveat text-[#2d2d2d] flex items-center gap-2"><Wallet className="w-7 h-7 text-[#d4a574]" /> Money & Wealth</h1>
          <p className="text-slate-500 font-kalam text-sm mt-0.5">Track, plan, and grow your finances</p>
        </div>
        <Button className="journal-btn-primary" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Add Investment</Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="journal-modal max-w-lg"><DialogHeader><DialogTitle className="font-caveat text-2xl">Add Investment</DialogTitle></DialogHeader>
          <InvestmentForm onSubmit={handleAddInvestment} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="w-full bg-white p-1 border border-[#e8dac0] rounded-xl flex gap-0.5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id}
                className="flex-1 font-kalam text-xs gap-1 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-white rounded-lg py-2 transition-all min-w-0 px-1.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <AnimatePresence mode="wait">
          {['dashboard', 'portfolio', 'budget', 'goals', 'sip', 'emi', 'fire', 'tax', 'afford'].map(tabId => (
            <TabsContent key={tabId} value={tabId} className="mt-0">
              <motion.div key={`${tabId}-motion`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tabId === 'dashboard' && <FinancialDashboard />}
                {tabId === 'portfolio' && <PortfolioOverview />}
                {tabId === 'budget' && <BudgetLedger />}
                {tabId === 'goals' && <SavingsGoalsTab />}
                {tabId === 'sip' && <SIPCalculator />}
                {tabId === 'emi' && <EMIDebtTab />}
                {tabId === 'fire' && <FIRECalculator />}
                {tabId === 'tax' && <TaxPlanner />}
                {tabId === 'afford' && <AffordabilityCalculator />}
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
