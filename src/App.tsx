import React, { useState } from 'react';
import { ShieldCheck, Mail, Video, Flame, LayoutDashboard, Brain, BookOpen, AlertCircle, Database, ShieldAlert, Cpu } from 'lucide-react';
import UnifiedAnalysisDashboard from './components/UnifiedAnalysisDashboard';
import PhishingForensicsLab from './components/PhishingForensicsLab';
import DeepfakeMediaStudio from './components/DeepfakeMediaStudio';
import AdversarialAttackSimulator from './components/AdversarialAttackSimulator';
import { generate90Samples, AnalyzedSample } from './academicDataset';
export default function App() {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'phishing' | 'deepfake' | 'adversarial'>('dashboard');
  const [lastPhishingAnalysis, setLastPhishingAnalysis] = useState<any | null>(null);
  // Initialize with the 3 core seed samples, mapped to analyzed formats
  const [phishingHistory, setPhishingHistory] = useState<AnalyzedSample[]>(() => 
    generate90Samples().slice(0, 3)
  );

  const handleLoad90Samples = () => {
    setPhishingHistory(generate90Samples());
  };

  const handleClearHistory = () => {
    setPhishingHistory([]);
  };

  const handlePhishingAnalysisComplete = (analysis: any, emailData?: any) => {
    setLastPhishingAnalysis(analysis);
    
    // Transform custom analysis outcome to fully valid record
    const newSample: AnalyzedSample = {
      id: `custom-${Date.now()}`,
      sender: emailData?.sender || 'manual-analyst@ipb.pt',
      recipient: emailData?.recipient || 'student_test@ipb.pt',
      subject: emailData?.subject || 'Dynamic Submission',
      body: emailData?.body || 'Content entered by user.',
      category: emailData?.category || 'ai_phishing',
      tag: 'Forensic Lab Entry',
      realismScore: analysis.realismScore || 85,
      detectabilityScore: analysis.detectabilityScore || 60,
      languagePolish: analysis.languagePolish || 90,
      urgencyLevel: (analysis.urgencyLevel?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
      detectionDifficulty: (analysis.detectionDifficulty || 'Moderate') as any,
      indicators: analysis.indicators || ['Manual forensic flags applied'],
      mitigationRules: analysis.mitigationRules || ['Deploy standard context sanity checks'],
      detailedAnalysis: analysis.detailedAnalysis || 'Evaluated via dynamic LLM agent interface.'
    };

    setPhishingHistory(prev => [newSample, ...prev]);
    setActiveScreen('dashboard'); // Redirect to dashboard to review updated insights
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden select-none antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            IF
          </div>
          <span className="font-semibold tracking-tight text-lg text-white font-display">
            InsightFlow <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Main View
          </div>
          <button
            onClick={() => setActiveScreen('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left text-sm font-medium border-r-2 ${
              activeScreen === 'dashboard'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-105'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <div className="px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Academic Labs
          </div>

          <button
            onClick={() => setActiveScreen('phishing')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left text-sm font-medium border-r-2 ${
              activeScreen === 'phishing'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-105'
            }`}
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>AI Phishing Lab</span>
          </button>

          <button
            onClick={() => setActiveScreen('deepfake')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left text-sm font-medium border-r-2 ${
              activeScreen === 'deepfake'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-105'
            }`}
          >
            <Video className="w-4 h-4 text-purple-400" />
            <span>Deepfake Media Lab</span>
          </button>

          <button
            onClick={() => setActiveScreen('adversarial')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left text-sm font-medium border-r-2 ${
              activeScreen === 'adversarial'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-105'
            }`}
          >
            <Flame className="w-4 h-4 text-red-400" />
            <span>AI Model Attacks</span>
          </button>


        </nav>

        {/* User Session status matching template metadata */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Access</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 border border-indigo-500/30 flex items-center justify-center font-bold text-white text-[10px] shadow-sm">
                RB
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-medium text-white truncate">rinorbasholli@gmail.com</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[9px] font-mono leading-none bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 rounded">Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Screen Layout Container */}
      <main className="flex-grow flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Upper Header strip */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-white font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              AI Security Analysis Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Academic Session</p>
              <p className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10">Student: Rinor Basholli, Mentor: Tiago Pedrosa</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Analysis status</p>
              <p className="text-xs font-mono text-slate-300">Continuous Sync</p>
            </div>
          </div>
        </header>

        {/* Core dynamic content template window */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {activeScreen === 'dashboard' && (
            <UnifiedAnalysisDashboard 
              lastPhishingAnalysis={lastPhishingAnalysis}
              phishingHistory={phishingHistory}
              onLoad90Samples={handleLoad90Samples}
              onClearHistory={handleClearHistory}
            />
          )}
          {activeScreen === 'phishing' && (
            <PhishingForensicsLab onAnalyzeComplete={handlePhishingAnalysisComplete} />
          )}
          {activeScreen === 'deepfake' && (
            <DeepfakeMediaStudio />
          )}
          {activeScreen === 'adversarial' && (
            <AdversarialAttackSimulator />
          )}

        </div>

        {/* Sleek bottom status footer */}
        <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> DB ACTIVE & UNIMPEDED
            </span>
            <span>CPU: 42%</span>
            <span>MEM: 12.4GB / 32GB</span>
          </div>
          <div className="hidden md:block">ENCRYPTED SSL SESSION // UID: 98-4421-X</div>
        </footer>
      </main>
    </div>
  );
}

