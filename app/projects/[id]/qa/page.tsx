"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, AlertCircle, Play, 
  Bot, Send, Image as ImageIcon, CheckSquare, 
  HelpCircle, RefreshCw, GitBranch, ShieldAlert,
  ArrowRight, Activity, Plus, Trash2, Check, X,
  Split, Sliders, CornerDownRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: string; // pending, pass, fail
  testType: string;
}

export default function FullProjectQAPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { projects } = useApp();

  const [activeTab, setActiveTab] = useState('refiner');
  const [laymanInput, setLaymanInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [specs, setSpecs] = useState<any>(null);

  // Testing Studio states
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testFilter, setTestFilter] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your AI QA assistant. Describe your project flow or prompt me to write test cases, e.g., "Write test cases for user profile uploads."' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flow Builder states
  const [flowData, setFlowData] = useState<any>(null);

  // Visual Diff states
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [diffResults, setDiffResults] = useState<any>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Deployment Guardian states
  const [guardianChecklist, setGuardianChecklist] = useState({
    apiTested: false,
    dbVerified: false,
    edgeCasesCovered: false,
    rollbackPresent: false,
    monitoringActive: false
  });
  const [aiGuardianRisk, setAiGuardianRisk] = useState<string | null>(null);

  // Manual test creation states
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [newTestSteps, setNewTestSteps] = useState('');
  const [newTestExpected, setNewTestExpected] = useState('');
  const [newTestType, setNewTestType] = useState('functional');

  const project = useMemo(() => {
    return projects.find(p => p.id === projectId || p.slug === projectId) || null;
  }, [projects, projectId]);

  // Fetch test cases
  const loadTestCases = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/tests?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setTestCases(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim() || !project) return;

    try {
      const stepsArray = newTestSteps
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle.trim(),
          description: newTestDescription.trim(),
          steps: stepsArray,
          expectedResult: newTestExpected.trim(),
          testType: newTestType,
          status: 'pending',
          projectId: project.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestCases(prev => [data, ...prev]);
        toast.success('Test case added! 🧪');
        // Reset form
        setNewTestTitle('');
        setNewTestDescription('');
        setNewTestSteps('');
        setNewTestExpected('');
        setNewTestType('functional');
        setIsAddTestOpen(false);
      } else {
        toast.error('Failed to create test case');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating test case');
    }
  };

  const handleDeleteTestCase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test case?')) return;
    try {
      const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTestCases(prev => prev.filter(tc => tc.id !== id));
        toast.success('Test case deleted 🗑️');
      } else {
        toast.error('Failed to delete test case');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting test case');
    }
  };

  useEffect(() => {
    if (project) {
      loadTestCases();
    }
  }, [project]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const filteredTestCases = useMemo(() => {
    return testCases.filter(t => {
      if (testFilter === 'all') return true;
      return t.status === testFilter;
    });
  }, [testCases, testFilter]);

  // Layman Refiner action
  const handleRefine = async () => {
    if (!laymanInput.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine-requirements',
          laymanText: laymanInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSpecs(data);
        toast.success('Layman text successfully refined! 🚀');
        generateFlow(data);
      } else {
        toast.error('AI translation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to refine requirement');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate Flow Diagram
  const generateFlow = async (specData: any) => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-flow-diagram',
          functionalReqs: specData.functionalReqs
        })
      });
      if (res.ok) {
        const flow = await res.json();
        setFlowData(flow);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Test Cases from Spec
  const generateTestCasesFromSpec = async () => {
    if (!specs || !project) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-test-cases',
          functionalReqs: specs.functionalReqs,
          edgeCases: specs.edgeCases
        })
      });
      if (res.ok) {
        const generated = await res.json();
        // Save generated test cases to database
        const saveRes = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generated.map((c: any) => ({
            ...c,
            projectId: project.id,
            status: 'pending'
          })))
        });
        if (saveRes.ok) {
          const savedList = await saveRes.json();
          setTestCases(prev => [...savedList, ...prev]);
          setActiveTab('testing');
          toast.success('AI Test Cases generated and added! 🧪');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate test cases');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Chat Assistant for tests
  const handleChatSend = async () => {
    if (!chatInput.trim() || !project) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const prompt = `
        We have a list of test cases: ${JSON.stringify(testCases)}.
        The user wants to modify or add cases: "${userMsg}".
        
        Respond strictly in valid JSON format. Do not use markdown backticks.
        If the user requested changes, return the updated or new test case entries in the format:
        {
          "message": "Friendly response summary",
          "newTestCases": [
            {
              "title": "Clear concise test title",
              "description": "What this case tests",
              "testType": "functional" | "api" | "performance" | "security" | "edge-case",
              "steps": ["Step 1...", "Step 2...", "Step 3..."],
              "expectedResult": "Exactly what success looks like"
            }
          ]
        }
      `;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-test-cases',
          functionalReqs: [prompt]
        })
      });

      if (res.ok) {
        const aiResponse = await res.json();
        const newCases = aiResponse.newTestCases || aiResponse;
        
        if (Array.isArray(newCases)) {
          const saveRes = await fetch('/api/tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCases.map((c: any) => ({
              ...c,
              projectId: project.id,
              status: 'pending'
            })))
          });
          if (saveRes.ok) {
            const savedList = await saveRes.json();
            setTestCases(prev => [...savedList, ...prev]);
          }
        }
        
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: aiResponse.message || 'I have generated those test cases for you and added them to your checklist!' 
        }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue updating the test cases.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Change Test Case status
  const updateTestCaseStatus = async (id: string, newStatus: string) => {
    try {
      setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status: newStatus } : tc));
      await fetch(`/api/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Updated test status! 🚀`);
    } catch (err) {
      console.error(err);
    }
  };

  // Image Upload helpers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'before') setBeforeImage(reader.result as string);
      else setAfterImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Visual Diff AI compare
  const compareVisualScreenshots = async () => {
    if (!beforeImage || !afterImage) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-visual-diff',
          beforeImage,
          afterImage
        })
      });
      if (res.ok) {
        const result = await res.json();
        setDiffResults(result);
        toast.success('AI comparison complete! 🎨');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI screenshot comparison failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Canvas Drag/Slider logic
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Deployment Readiness score
  const readinessScore = useMemo(() => {
    let score = 0;
    const items = Object.values(guardianChecklist);
    const checked = items.filter(v => v).length;
    score += checked * 12;

    if (testCases.length > 0) {
      const passed = testCases.filter(t => t.status === 'pass').length;
      score += Math.round((passed / testCases.length) * 40);
    }
    return score;
  }, [guardianChecklist, testCases]);

  // Deployment self-audit
  const runSelfAudit = async () => {
    setIsAiLoading(true);
    try {
      const auditPrompt = `
        Perform a deployment risk analysis for a project with these details:
        Readiness Score: ${readinessScore}%
        Checklist State: ${JSON.stringify(guardianChecklist)}
        Test Cases: ${JSON.stringify(testCases.map(t => ({ title: t.title, status: t.status })))}
        
        Write a concise risk summary, highlighting any missing checks or failing tests. Suggest mitigation strategies. Keep it under 4 paragraphs.
      `;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine-requirements',
          laymanText: auditPrompt
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiGuardianRisk(data.functionalReqs?.join('\n') || 'Audit completed safely with zero critical alarms.');
        toast.success('Deployment Guardian audit finished! 🛡️');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-[#fefdfb] flex flex-col items-center justify-center p-8">
        <h2 className="font-caveat text-3xl font-bold text-[#2d2d2d] mb-4">Project Not Found</h2>
        <Button onClick={() => router.push('/projects')} className="journal-btn-primary">Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefdfb] p-4 md:p-6 pt-20 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
        
        {/* Header Block */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-kalam text-slate-500 hover:text-[#2d2d2d]" asChild>
              <Link href={`/projects/${project.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
              </Link>
            </Button>
            <h1 className="font-caveat text-3xl font-bold text-[#2d2d2d]">
              {project.title} / <span className="text-blue-700">QA & Testing Studio</span>
            </h1>
          </div>
          <Badge className="font-kalam bg-blue-50 text-blue-800 border-2 border-blue-500/20 px-3 py-1 rounded-full text-xs">
            Interactive Test Laboratory
          </Badge>
        </div>

        {/* Dynamic Studio Wrapper */}
        <div className="bg-white border-2 border-[#2d2d2d] rounded-3xl p-6 shadow-[6px_6px_0px_rgba(45,45,45,1)] min-h-[550px] flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="bg-[#f5f0e6] p-1 border border-[#e0e0e0] rounded-xl flex gap-1 mb-6 max-w-2xl no-scrollbar overflow-x-auto">
              <TabsTrigger value="refiner" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Requirement Refiner</TabsTrigger>
              <TabsTrigger value="testing" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">QA Testing Studio</TabsTrigger>
              <TabsTrigger value="flow" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Visual Flows</TabsTrigger>
              <TabsTrigger value="diff" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Visual Diff Analyzer</TabsTrigger>
              <TabsTrigger value="guardian" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Deploy Guardian</TabsTrigger>
            </TabsList>

            {/* TAB 1: Requirement Refiner & Technical Translator */}
            <TabsContent value="refiner" className="space-y-4 focus-visible:outline-none flex-1 flex flex-col justify-start">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Input plain requirements */}
                <div className="lg:col-span-5 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col justify-between min-h-[400px]">
                  <div className="space-y-3">
                    <h3 className="font-caveat text-2xl font-bold mb-1 flex items-center gap-1.5">
                      <Bot className="w-5 h-5 text-amber-500" /> Refine Layman Idea
                    </h3>
                    <p className="font-kalam text-xs text-slate-500 leading-tight">Write down the user requirement or feature in plain, everyday language.</p>
                    
                    <Textarea 
                      value={laymanInput}
                      onChange={e => setLaymanInput(e.target.value)}
                      placeholder="Example: 'Students should see their payment EMI history, approve commissions, and generate referral links which default to prefilled values...'" 
                      className="journal-input min-h-[220px] text-sm leading-relaxed"
                    />
                  </div>

                  <Button 
                    onClick={handleRefine}
                    disabled={isAiLoading || !laymanInput.trim()}
                    className="w-full journal-btn-primary flex items-center justify-center gap-2 mt-4"
                  >
                    {isAiLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Refine & Translate <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>

                {/* AI Refined Specs Output */}
                <div className="lg:col-span-7 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col min-h-[400px]">
                  {specs ? (
                    <div className="space-y-4 h-[420px] overflow-y-auto pr-2 custom-pencil-scrollbar flex-1">
                      <div className="flex justify-between items-center border-b border-[#2d2d2d]/10 pb-2">
                        <h3 className="font-caveat text-2xl font-bold text-amber-800">Refined Technical Specification</h3>
                        <Button onClick={generateTestCasesFromSpec} size="sm" className="h-8 font-kalam text-xs bg-amber-500 text-white hover:bg-amber-600">
                          Generate QA Checklist
                        </Button>
                      </div>

                      {/* Functional Reqs */}
                      <div className="space-y-1">
                        <h4 className="font-kalam text-sm font-bold text-slate-700">Functional Requirements</h4>
                        <ul className="list-disc pl-5 font-kalam text-xs text-slate-600 space-y-1">
                          {specs.functionalReqs?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>

                      {/* Technical Specifications */}
                      <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <h4 className="font-kalam text-xs font-bold text-slate-700">Database & Endpoint Suggestions</h4>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-kalam text-slate-600">
                          <div>
                            <span className="font-bold block text-slate-800">APIs</span>
                            {specs.technicalSpecs?.apis?.map((api: string, i: number) => <div key={i} className="font-mono text-[9px] bg-slate-100 p-0.5 mt-0.5 rounded">{api}</div>)}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-800">Collections/Tables</span>
                            {specs.technicalSpecs?.database?.map((db: string, i: number) => <div key={i} className="font-mono text-[9px] bg-slate-100 p-0.5 mt-0.5 rounded">{db}</div>)}
                          </div>
                        </div>
                      </div>

                      {/* User Stories */}
                      <div className="space-y-1">
                        <h4 className="font-kalam text-sm font-bold text-slate-700">User Stories</h4>
                        <div className="space-y-1">
                          {specs.userStories?.map((story: string, i: number) => (
                            <p key={i} className="font-kalam text-xs text-slate-500 italic p-1.5 border-l-2 border-amber-300 bg-amber-50/20">{story}</p>
                          ))}
                        </div>
                      </div>

                      {/* Edge Cases */}
                      <div className="space-y-1">
                        <h4 className="font-kalam text-sm font-bold text-slate-700">Identified Edge Cases</h4>
                        <ul className="list-disc pl-5 font-kalam text-xs text-red-700/80 space-y-1">
                          {specs.edgeCases?.map((e: string, i: number) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200">
                      <Bot className="w-16 h-16 text-slate-300 mb-2" />
                      <p className="font-kalam text-sm text-slate-400">Awaiting technical translation. Enter layman ideas on the left and submit.</p>
                    </div>
                  )}
                </div>

              </div>
            </TabsContent>

            {/* TAB 2: Testing Studio Checklist & Conversational Chat */}
            <TabsContent value="testing" className="space-y-4 focus-visible:outline-none flex-1 flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                
                {/* Interactive Test Checklist */}
                <div className="lg:col-span-8 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col h-[520px]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-caveat text-2xl font-bold text-[#2d2d2d]">QA Test Checklist</h3>
                      <Button 
                        onClick={() => setIsAddTestOpen(!isAddTestOpen)} 
                        variant="ghost" 
                        size="icon" 
                        className={`h-7 w-7 border-2 border-[#2d2d2d] rounded-lg bg-white shadow-[2px_2px_0px_rgba(45,45,45,1)] hover:translate-y-[1px] hover:shadow-none transition-all ${isAddTestOpen ? 'bg-amber-50' : ''}`}
                        title="Add Test Case Manually"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#2d2d2d]" />
                      </Button>
                    </div>
                    
                    {/* Status filters */}
                    <div className="flex gap-1.5 bg-[#f5f0e6] p-0.5 rounded-lg border">
                      {['all', 'pending', 'pass', 'fail'].map(status => (
                        <button
                          key={status}
                          onClick={() => setTestFilter(status)}
                          className={`px-2 py-0.5 rounded text-[10px] font-kalam font-bold capitalize transition-all ${
                            testFilter === status 
                              ? 'bg-[#2d2d2d] text-white shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {status} ({status === 'all' ? testCases.length : testCases.filter(t => t.status === status).length})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slide-down Manual Add Form */}
                  <AnimatePresence>
                    {isAddTestOpen && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        onSubmit={handleCreateTestCase}
                        className="bg-amber-50/40 border-2 border-dashed border-amber-200 rounded-xl p-3 mb-3 space-y-2.5 overflow-hidden shrink-0"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Input 
                              value={newTestTitle}
                              onChange={e => setNewTestTitle(e.target.value)}
                              placeholder="Test Title (e.g. Verify stripe webhook)" 
                              className="h-8 text-xs font-kalam border-slate-300"
                              required
                            />
                          </div>
                          <div>
                            <Select value={newTestType} onValueChange={setNewTestType}>
                              <SelectTrigger className="h-8 text-xs font-kalam border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                                <SelectItem value="functional">Functional</SelectItem>
                                <SelectItem value="api">API Endpoint</SelectItem>
                                <SelectItem value="edge-case">Edge Case</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Textarea 
                            value={newTestDescription}
                            onChange={e => setNewTestDescription(e.target.value)}
                            placeholder="Description of target functionality..."
                            className="h-16 text-xs font-kalam border-slate-300 resize-none"
                          />
                          <Textarea 
                            value={newTestSteps}
                            onChange={e => setNewTestSteps(e.target.value)}
                            placeholder="Steps to reproduce (one per line)..."
                            className="h-16 text-xs font-kalam border-slate-300 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 items-center">
                          <Input 
                            value={newTestExpected}
                            onChange={e => setNewTestExpected(e.target.value)}
                            placeholder="Expected outcome (e.g. returns 200 OK)" 
                            className="h-8 text-xs font-kalam border-slate-300 flex-1"
                            required
                          />
                          <Button type="submit" size="sm" className="h-8 font-kalam text-xs bg-[#2d2d2d] text-white hover:bg-slate-800">
                            Save Test
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddTestOpen(false)} className="h-8 font-kalam text-xs">
                            Cancel
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-pencil-scrollbar">
                    {filteredTestCases.map((tc) => (
                      <div key={tc.id} className="p-3 bg-[#fdfbf7]/40 border-2 border-[#2d2d2d]/10 rounded-xl relative hover:border-[#2d2d2d]/30 transition-all flex flex-col sm:flex-row justify-between items-start gap-4 group">
                        {/* Delete test case */}
                        <button 
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          title="Delete test case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="font-kalam text-[9px] uppercase tracking-wider">{tc.testType}</Badge>
                            <h4 className="font-caveat text-xl font-bold text-[#2d2d2d] leading-none">{tc.title}</h4>
                          </div>
                          <p className="font-kalam text-xs text-slate-500 leading-tight">{tc.description}</p>
                          
                          <div className="text-[11px] font-kalam text-slate-600 space-y-1">
                            <span className="font-bold block">Steps:</span>
                            {tc.steps?.map((step, idx) => (
                              <div key={idx} className="flex gap-1.5 items-start pl-2">
                                <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] font-kalam text-slate-600"><span className="font-bold">Expected:</span> {tc.expectedResult}</p>
                        </div>

                        {/* Status buttons */}
                        <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                          <button 
                            onClick={() => updateTestCaseStatus(tc.id, 'pass')}
                            className={`p-1.5 rounded-lg border-2 flex items-center justify-center gap-1 text-[10px] font-bold font-kalam w-16 ${tc.status === 'pass' ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-[#2d2d2d]/20 text-slate-400 hover:bg-slate-50'}`}
                          >
                            <Check className="w-3 h-3" /> Pass
                          </button>
                          <button 
                            onClick={() => updateTestCaseStatus(tc.id, 'fail')}
                            className={`p-1.5 rounded-lg border-2 flex items-center justify-center gap-1 text-[10px] font-bold font-kalam w-16 ${tc.status === 'fail' ? 'bg-red-100 border-red-600 text-red-700' : 'bg-white border-[#2d2d2d]/20 text-slate-400 hover:bg-slate-50'}`}
                          >
                            <X className="w-3 h-3" /> Fail
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredTestCases.length === 0 && (
                      <p className="font-kalam text-xs text-slate-400 italic text-center py-16">No matching test cases found.</p>
                    )}
                  </div>
                </div>

                {/* Chat Assistant Sidebar */}
                <div className="lg:col-span-4 bg-white border-2 border-[#2d2d2d] rounded-2xl shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col overflow-hidden h-[520px]">
                  <div className="p-4 border-b border-[#2d2d2d]/10 bg-[#f5f0e6]/20 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-caveat text-lg font-bold">QA AI Companion</h4>
                      <p className="text-[10px] font-kalam text-slate-500">Edit or append test cases dynamically</p>
                    </div>
                  </div>

                  {/* Chat log */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#fdfbf7]/20 custom-pencil-scrollbar">
                    <AnimatePresence initial={false}>
                      {chatMessages.map((msg, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`p-2.5 rounded-xl font-kalam text-xs leading-relaxed max-w-[85%] ${
                            msg.role === 'user' 
                              ? 'bg-[#2d2d2d] text-white rounded-tr-none shadow-md' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-[#e8e8e8] shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {isAiLoading && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="p-2.5 rounded-xl font-kalam text-xs bg-slate-50 text-slate-400 border border-dashed border-slate-200 animate-pulse shadow-sm">
                            Generating cases...
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-[#2d2d2d]/10 bg-white">
                    <div className="flex gap-1.5">
                      <Input 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleChatSend(); }}
                        placeholder="Ask AI to modify test cases..."
                        className="journal-input text-xs h-9" 
                      />
                      <Button onClick={handleChatSend} size="icon" className="h-9 w-9 bg-[#2d2d2d] text-white hover:bg-slate-800 shrink-0">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* TAB 3: Visual Flow Builder */}
            <TabsContent value="flow" className="focus-visible:outline-none flex-1 flex flex-col justify-start">
              <div className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] min-h-[460px] flex flex-col justify-between">
                <div className="border-b border-[#2d2d2d]/10 pb-2 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-caveat text-2xl font-bold">Visual Flow Builder</h3>
                    <p className="font-kalam text-xs text-slate-500">Auto-generated nodes map user, system, and data flow sequences</p>
                  </div>
                  <Button onClick={() => specs && generateFlow(specs)} variant="ghost" size="sm" className="border border-[#2d2d2d]/30 font-kalam text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Redraw Flow
                  </Button>
                </div>

                {flowData ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-stretch">
                    
                    {/* User Flow (Sequence) */}
                    <div className="p-4 bg-[#fdfbf7]/40 border-2 border-dashed border-[#e8dac0] rounded-2xl flex flex-col">
                      <h4 className="font-caveat text-xl font-bold text-slate-700 mb-3 border-b pb-1">User Flow Sequence</h4>
                      <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
                        {flowData.userFlow?.nodes?.map((node: any, idx: number) => (
                          <React.Fragment key={node.id}>
                            <div className="px-4 py-2.5 border-2 border-[#2d2d2d] bg-[#fffacd] rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-40">
                              {node.label}
                            </div>
                            {idx < flowData.userFlow.nodes.length - 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-kalam text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-[#2d2d2d]/10">
                                  {flowData.userFlow.edges[idx]?.label || 'clicks'}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 mt-1" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* System API Flow */}
                    <div className="p-4 bg-[#fdfbf7]/40 border-2 border-dashed border-[#e8dac0] rounded-2xl flex flex-col">
                      <h4 className="font-caveat text-xl font-bold text-slate-700 mb-3 border-b pb-1">System & API Flow</h4>
                      <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
                        {flowData.systemFlow?.nodes?.map((node: any, idx: number) => (
                          <React.Fragment key={node.id}>
                            <div className="px-4 py-2.5 border-2 border-[#2d2d2d] bg-blue-50 text-blue-800 rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-40">
                              {node.label}
                            </div>
                            {idx < flowData.systemFlow.nodes.length - 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-kalam text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-[#2d2d2d]/10">
                                  {flowData.systemFlow.edges[idx]?.label || 'requests'}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 mt-1" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Data Model Flow */}
                    <div className="p-4 bg-[#fdfbf7]/40 border-2 border-dashed border-[#e8dac0] rounded-2xl flex flex-col">
                      <h4 className="font-caveat text-xl font-bold text-slate-700 mb-3 border-b pb-1">Database & Data Flow</h4>
                      <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
                        {flowData.dataFlow?.nodes?.map((node: any, idx: number) => (
                          <React.Fragment key={node.id}>
                            <div className="px-4 py-2.5 border-2 border-[#2d2d2d] bg-green-50 text-green-800 rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-40">
                              {node.label}
                            </div>
                            {idx < flowData.dataFlow.nodes.length - 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-kalam text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-[#2d2d2d]/10">
                                  {flowData.dataFlow.edges[idx]?.label || 'validates'}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 mt-1" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200 min-h-[300px]">
                    <GitBranch className="w-16 h-16 text-slate-300 mb-2" />
                    <p className="font-kalam text-sm text-slate-400">Flow diagrams will build automatically once you refine a requirement.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: Visual Difference Analyzer */}
            <TabsContent value="diff" className="focus-visible:outline-none flex-1 flex flex-col justify-start">
              <div className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] min-h-[460px]">
                <div className="border-b border-[#2d2d2d]/10 pb-2 mb-4">
                  <h3 className="font-caveat text-2xl font-bold">Visual Difference Analyzer</h3>
                  <p className="font-kalam text-xs text-slate-500">Upload before/after screenshots and drag the comparison slider to find layout diffs</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Controls and Uploads */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="font-kalam text-xs font-bold text-slate-700 uppercase tracking-wide">Screenshot Upload</h4>
                      <div>
                        <label className="font-kalam text-[11px] text-slate-500 mb-1 block">Before (Reference)</label>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'before')} className="w-full text-xs font-kalam" />
                      </div>
                      <div>
                        <label className="font-kalam text-[11px] text-slate-500 mb-1 block">After (Current)</label>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'after')} className="w-full text-xs font-kalam" />
                      </div>
                    </div>

                    {beforeImage && afterImage && (
                      <Button 
                        onClick={compareVisualScreenshots}
                        disabled={isAiLoading}
                        className="w-full journal-btn-primary"
                      >
                        {isAiLoading ? 'Comparing...' : 'Compare screenshots with AI'}
                      </Button>
                    )}

                    {diffResults && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-kalam">
                        <h4 className="font-bold text-slate-700 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-amber-600" /> Detected Layout Diff
                        </h4>
                        <div>
                          <span className="font-bold text-green-700 block">Added Elements:</span>
                          <ul className="list-disc pl-4 text-slate-600">
                            {diffResults.addedElements?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            {(!diffResults.addedElements || diffResults.addedElements.length === 0) && <li>None</li>}
                          </ul>
                        </div>
                        <div>
                          <span className="font-bold text-red-700 block">Removed Elements:</span>
                          <ul className="list-disc pl-4 text-slate-600">
                            {diffResults.removedElements?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            {(!diffResults.removedElements || diffResults.removedElements.length === 0) && <li>None</li>}
                          </ul>
                        </div>
                        <div>
                          <span className="font-bold text-amber-700 block">Modified Elements:</span>
                          <ul className="list-disc pl-4 text-slate-600">
                            {diffResults.changedElements?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            {(!diffResults.changedElements || diffResults.changedElements.length === 0) && <li>None</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slider Visualizer */}
                  <div className="lg:col-span-8 flex flex-col items-center">
                    {beforeImage && afterImage ? (
                      <div className="space-y-2 w-full">
                        <div 
                          ref={sliderContainerRef}
                          onMouseMove={e => handleSliderMove(e.clientX)}
                          onTouchMove={e => { if (e.touches[0]) handleSliderMove(e.touches[0].clientX); }}
                          className="relative w-full h-[360px] border-2 border-[#2d2d2d] rounded-2xl overflow-hidden cursor-ew-resize bg-slate-100 select-none shadow-md"
                        >
                          {/* After Image (Full width background) */}
                          <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

                          {/* Before Image (Clipping width based on slider position) */}
                          <div 
                            className="absolute inset-0 overflow-hidden pointer-events-none"
                            style={{ width: `${sliderPosition}%` }}
                          >
                            <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-contain" style={{ width: '100%', maxWidth: 'none' }} />
                          </div>

                          {/* Split Line divider */}
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-[#2d2d2d] cursor-ew-resize flex items-center justify-center"
                            style={{ left: `${sliderPosition}%` }}
                          >
                            <div className="w-8 h-8 rounded-full border-2 border-[#2d2d2d] bg-white flex items-center justify-center shadow-lg pointer-events-none">
                              <Sliders className="w-4 h-4 text-[#2d2d2d]" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center font-kalam text-xs text-slate-500 font-bold">
                          ← Before (Reference) | After (Current) →
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[360px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200">
                        <ImageIcon className="w-16 h-16 text-slate-300 mb-2" />
                        <p className="font-kalam text-sm text-slate-400 max-w-xs">Upload reference (before) and current (after) screenshots on the left to verify pixel changes.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </TabsContent>

            {/* TAB 5: Deployment Guardian */}
            <TabsContent value="guardian" className="focus-visible:outline-none flex-1 flex flex-col justify-start">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Guardian checklist */}
                <div className="md:col-span-5 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)]">
                  <h3 className="font-caveat text-2xl font-bold mb-4 flex items-center gap-1.5">
                    <CheckSquare className="w-5 h-5 text-green-600" /> Security & Guardian Review
                  </h3>

                  <div className="space-y-3 font-kalam text-sm text-[#2d2d2d] mb-5">
                    {[
                      { key: 'apiTested', label: 'API endpoints fully tested' },
                      { key: 'dbVerified', label: 'Database migrations verified' },
                      { key: 'edgeCasesCovered', label: 'Edge Case tests completed' },
                      { key: 'rollbackPresent', label: 'Rollback protocol documented' },
                      { key: 'monitoringActive', label: 'Logs & Alarm monitoring enabled' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-3 p-2 bg-[#fdfbf7]/40 border rounded-lg">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={(guardianChecklist as any)[item.key]}
                          onChange={(e) => setGuardianChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-4 h-4 accent-[#2d2d2d]"
                        />
                        <label htmlFor={item.key} className="font-bold cursor-pointer">{item.label}</label>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={runSelfAudit}
                    disabled={isAiLoading}
                    className="w-full journal-btn-primary flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Run Deployment Audit Report <ShieldAlert className="w-4 h-4" /></>}
                  </Button>
                </div>

                {/* Audit gauge & report output */}
                <div className="md:col-span-7 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col justify-between min-h-[400px]">
                  
                  {/* Gauge indicator */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-4 mb-4">
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessScore >= 80 ? '#22c55e' : readinessScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="4" strokeDasharray={`${readinessScore}, 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-caveat text-3xl font-bold">{readinessScore}%</span>
                        <span className="text-[9px] font-kalam text-slate-400 font-bold uppercase">Ready</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-caveat text-2xl font-bold text-slate-800">Deployment Readiness Rating</h4>
                      <p className="font-kalam text-xs text-slate-500 mt-1">Checklist checks count for 60% of readiness. Active QA testing checklists cover the remaining 40%.</p>
                      <Badge className="font-kalam mt-2" variant={readinessScore >= 80 ? 'default' : readinessScore >= 50 ? 'secondary' : 'destructive'}>
                        {readinessScore >= 80 ? 'Production Ready 🚀' : readinessScore >= 50 ? 'Warning: Incomplete Checks ⚠️' : 'Critical: Needs Testing 🚨'}
                      </Badge>
                    </div>
                  </div>

                  {/* Audit Logs summary */}
                  <div className="flex-1 bg-[#fdfbf7]/40 border-2 border-dashed border-[#e8dac0] rounded-xl p-4 overflow-y-auto max-h-[220px]">
                    <h5 className="font-caveat text-xl font-bold text-amber-800 mb-2 border-b pb-0.5">Guardian AI Log Audit</h5>
                    {aiGuardianRisk ? (
                      <p className="font-kalam text-xs text-slate-700 leading-relaxed whitespace-pre-line">{aiGuardianRisk}</p>
                    ) : (
                      <p className="font-kalam text-xs text-slate-400 italic text-center py-8">No audit report generated. Click "Run Deployment Audit Report" below to audit with Guardian AI.</p>
                    )}
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
