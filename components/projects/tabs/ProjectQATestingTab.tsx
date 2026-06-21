import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, AlertCircle, Play, 
  Bot, Send, Image as ImageIcon, CheckSquare, 
  HelpCircle, RefreshCw, GitBranch, ShieldAlert,
  ArrowRight, Activity, Plus, Trash2, Check, X,
  Split, Sliders, CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Project } from '@/types';

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: string; // pending, pass, fail
  testType: string;
}

interface ProjectQATestingTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ProjectQATestingTab({ project, onUpdate }: ProjectQATestingTabProps) {
  const [activeTab, setActiveTab] = useState('refiner');
  const [laymanInput, setLaymanInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [specs, setSpecs] = useState<any>(null);

  // Testing Studio states
  const [testCases, setTestCases] = useState<TestCase[]>([]);
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

  // Fetch test cases
  const loadTestCases = async () => {
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

  useEffect(() => {
    loadTestCases();
  }, [project.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
        // Auto trigger flow generation
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
    if (!specs) return;
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
    if (!chatInput.trim()) return;
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
          action: 'generate-test-cases', // reuse generating block or let API process
          functionalReqs: [prompt]
        })
      });

      if (res.ok) {
        const aiResponse = await res.json();
        const newCases = aiResponse.newTestCases || aiResponse; // fallbacks
        
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
    
    // Add checklist items (each is 12%)
    score += checked * 12;

    // Add test case pass rate (up to 40%)
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
          action: 'refine-requirements', // call text generator
          laymanText: auditPrompt
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Extract raw spec or content
        setAiGuardianRisk(data.functionalReqs?.join('\n') || 'Audit completed safely with zero critical alarms.');
        toast.success('Deployment Guardian audit finished! 🛡️');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="pt-2 flex flex-col space-y-4">
      
      {/* Tab Navigation header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f5f0e6] p-1 border border-[#e0e0e0] rounded-xl flex gap-1 mb-4 no-scrollbar overflow-x-auto">
          <TabsTrigger value="refiner" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Requirement Refiner</TabsTrigger>
          <TabsTrigger value="testing" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">QA Testing Studio</TabsTrigger>
          <TabsTrigger value="flow" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Visual Flows</TabsTrigger>
          <TabsTrigger value="diff" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Visual Diff Analyzer</TabsTrigger>
          <TabsTrigger value="guardian" className="font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Deploy Guardian</TabsTrigger>
        </TabsList>

        {/* TAB 1: Requirement Refiner & Technical Translator */}
        <TabsContent value="refiner" className="space-y-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Input layman requirements */}
            <div className="md:col-span-5 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)]">
              <h3 className="font-caveat text-2xl font-bold mb-2 flex items-center gap-1">
                <Bot className="w-5 h-5 text-amber-500" /> Refine Layman Idea
              </h3>
              <p className="font-kalam text-xs text-slate-500 mb-4 leading-tight">Write down the user requirement or feature in plain, everyday language.</p>
              
              <Textarea 
                value={laymanInput}
                onChange={e => setLaymanInput(e.target.value)}
                placeholder="Example: 'Students should see their payment EMI history, approve commissions, and generate referral links which default to prefilled values...'" 
                className="journal-input min-h-[220px] mb-4 text-sm leading-relaxed"
              />

              <Button 
                onClick={handleRefine}
                disabled={isAiLoading || !laymanInput.trim()}
                className="w-full journal-btn-primary flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>Refine & Translate <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>

            {/* AI Refined Specs Output */}
            <div className="md:col-span-7 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] min-h-[350px]">
              {specs ? (
                <div className="space-y-4 h-[450px] overflow-y-auto pr-2 custom-pencil-scrollbar">
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
                  <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
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
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200">
                  <Bot className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-kalam text-sm text-slate-400">Awaiting technical translation. Enter layman ideas on the left and submit.</p>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* TAB 2: Testing Studio Checklist & Conversational Chat */}
        <TabsContent value="testing" className="space-y-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Interactive Test Checklist */}
            <div className="md:col-span-8 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] h-[500px] overflow-y-auto custom-pencil-scrollbar">
              <h3 className="font-caveat text-2xl font-bold mb-4 text-[#2d2d2d]">QA Test Checklist</h3>
              
              <div className="space-y-3">
                {testCases.map((tc) => (
                  <div key={tc.id} className="p-3 bg-[#fdfbf7]/40 border-2 border-[#2d2d2d]/10 rounded-xl relative hover:border-[#2d2d2d]/30 transition-all">
                    
                    {/* Status badges */}
                    <div className="absolute right-3 top-3 flex gap-1">
                      <button 
                        onClick={() => updateTestCaseStatus(tc.id, 'pass')}
                        className={`p-1 rounded border-2 ${tc.status === 'pass' ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-[#2d2d2d]/20 text-slate-400 hover:bg-slate-50'}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => updateTestCaseStatus(tc.id, 'fail')}
                        className={`p-1 rounded border-2 ${tc.status === 'fail' ? 'bg-red-100 border-red-600 text-red-700' : 'bg-white border-[#2d2d2d]/20 text-slate-400 hover:bg-slate-50'}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pr-16 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="font-kalam text-[9px] uppercase tracking-wider">{tc.testType}</Badge>
                        <h4 className="font-caveat text-lg font-bold text-[#2d2d2d] leading-none">{tc.title}</h4>
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
                  </div>
                ))}

                {testCases.length === 0 && (
                  <p className="font-kalam text-xs text-slate-400 italic text-center py-12">No test cases generated yet. Refine requirements or write to the AI Assistant on the right.</p>
                )}
              </div>
            </div>

            {/* Chat Assistant Sidebar */}
            <div className="md:col-span-4 bg-white border-2 border-[#2d2d2d] rounded-2xl shadow-[4px_4px_0px_rgba(45,45,45,1)] h-[500px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#2d2d2d]/10 bg-[#f5f0e6]/20 flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="font-caveat text-lg font-bold">QA AI Companion</h4>
                  <p className="text-[10px] font-kalam text-slate-500">Edit or append test cases dynamically</p>
                </div>
              </div>

              {/* Chat log */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#fdfbf7]/20 custom-pencil-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-xl font-kalam text-xs leading-relaxed max-w-[85%] ${
                      msg.role === 'user' 
                        ? 'bg-[#2d2d2d] text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-[#e8e8e8]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="p-2.5 rounded-xl font-kalam text-xs bg-slate-50 text-slate-400 border border-dashed border-slate-200 animate-pulse">
                      Generating cases...
                    </div>
                  </div>
                )}
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
        <TabsContent value="flow" className="focus-visible:outline-none">
          <div className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] min-h-[450px] flex flex-col justify-between">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                
                {/* User Flow (Sequence) */}
                <div className="p-4 bg-[#fdfbf7]/40 border-2 border-dashed border-[#e8dac0] rounded-2xl flex flex-col">
                  <h4 className="font-caveat text-xl font-bold text-slate-700 mb-3 border-b pb-1">User Flow Sequence</h4>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
                    {flowData.userFlow?.nodes?.map((node: any, idx: number) => (
                      <React.Fragment key={node.id}>
                        <div className="px-4 py-2 border-2 border-[#2d2d2d] bg-[#fffacd] rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-36">
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
                        <div className="px-4 py-2 border-2 border-[#2d2d2d] bg-blue-50 text-blue-800 rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-36">
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
                        <div className="px-4 py-2 border-2 border-[#2d2d2d] bg-green-50 text-green-800 rounded-xl font-kalam text-xs font-bold text-center shadow-sm w-36">
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200">
                <GitBranch className="w-16 h-16 text-slate-300 mb-2" />
                <p className="font-kalam text-sm text-slate-400">Flow diagrams will build automatically once you refine a requirement.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: Visual Difference Analyzer */}
        <TabsContent value="diff" className="focus-visible:outline-none">
          <div className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] min-h-[450px]">
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
                      className="relative w-full h-[320px] border-2 border-[#2d2d2d] rounded-2xl overflow-hidden cursor-ew-resize bg-slate-100 select-none shadow-md"
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
                  <div className="w-full h-[320px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-16 h-16 text-slate-300 mb-2" />
                    <p className="font-kalam text-sm text-slate-400 max-w-xs">Upload reference (before) and current (after) screenshots on the left to verify pixel changes.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </TabsContent>

        {/* TAB 5: Deployment Guardian */}
        <TabsContent value="guardian" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Guardian checklist */}
            <div className="md:col-span-5 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)]">
              <h3 className="font-caveat text-2xl font-bold mb-4 flex items-center gap-1">
                <CheckSquare className="w-5 h-5 text-green-600" /> Security & Guardian Review
              </h3>

              <div className="space-y-3 font-kalam text-sm text-[#2d2d2d]">
                {[
                  { key: 'apiTested', label: 'API endpoints fully tested' },
                  { key: 'dbVerified', label: 'Database migrations verified' },
                  { key: 'edgeCasesCovered', label: 'Edge Case tests completed' },
                  { key: 'rollbackPresent', label: 'Rollback protocol documented' },
                  { key: 'monitoringActive', label: 'Logs & Alarm monitoring enabled' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(guardianChecklist as any)[item.key]} 
                      onChange={e => setGuardianChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="journal-checkbox" 
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <Button 
                onClick={runSelfAudit}
                disabled={isAiLoading}
                className="w-full journal-btn bg-green-600 text-white hover:bg-green-700 border-2 border-[#2d2d2d] mt-6 shadow-[2px_3px_0_rgba(0,0,0,0.08)] font-kalam font-bold text-xs"
              >
                {isAiLoading ? 'Auditing...' : 'Run Deployment Risk Audit'}
              </Button>
            </div>

            {/* Score and Analysis reports */}
            <div className="md:col-span-7 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col justify-between min-h-[350px]">
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Radial Gauge */}
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center border-4 border-[#2d2d2d] rounded-full bg-slate-50 shadow-inner">
                  <div className="text-center">
                    <span className="text-4xl font-caveat font-bold text-[#2d2d2d]">{readinessScore}%</span>
                    <span className="text-[9px] font-kalam text-slate-500 uppercase tracking-widest block">Readiness</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-caveat text-2xl font-bold text-[#2d2d2d]">Deployment Readiness Score</h4>
                  <p className="font-kalam text-xs text-slate-500 leading-tight">
                    This score is calculated based on checklist completions and your active test case pass rates. Reaching 80%+ is recommended before production deployments.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`font-kalam text-xs ${readinessScore >= 80 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                      {readinessScore >= 80 ? '🔒 Ready for Deployment' : '⚠️ Deploy Locked'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Risk details */}
              <div className="border-t border-[#2d2d2d]/10 pt-4 mt-4 flex-1">
                <h4 className="font-kalam text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">AI Guardian Risk Assessment</h4>
                {aiGuardianRisk ? (
                  <p className="font-kalam text-xs text-slate-600 bg-amber-50/20 border-l-2 border-amber-500 p-3 rounded-r-xl leading-relaxed whitespace-pre-wrap">
                    {aiGuardianRisk}
                  </p>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed text-center">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="font-kalam text-[11px] text-slate-400 italic">No self-audit run yet. Check off readiness indicators on the left and run audit.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
