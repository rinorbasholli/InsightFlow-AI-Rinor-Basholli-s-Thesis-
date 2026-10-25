import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Video, Flame, LayoutDashboard } from 'lucide-react';
import UnifiedAnalysisDashboard from './components/UnifiedAnalysisDashboard';
import PhishingForensicsLab from './components/PhishingForensicsLab';
import DeepfakeMediaStudio from './components/DeepfakeMediaStudio';
import AdversarialAttackSimulator from './components/AdversarialAttackSimulator';
import LoginScreen from './LoginScreen';
import { generate90Samples, AnalyzedSample } from './academicDataset';

type Screen = 'dashboard' | 'phishing' | 'deepfake' | 'adversarial';

function navClass(active: boolean) {
  return `w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium border-r-2 ${
    active
      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
      : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100'
  }`;
}

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [lastPhishingAnalysis, setLastPhishingAnalysis] = useState<any | null>(null);
  const [phishingHistory, setPhishingHistory] = useState<AnalyzedSample[]>(() =>
    generate90Samples().slice(0, 3)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/whoami', { credentials: 'include' });
        if (!cancelled) setSignedIn(resp.ok);
      } catch {
        if (!cancelled) setSignedIn(false);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoad90Samples = () => {
    setPhishingHistory(generate90Samples());
  };

  const handleClearHistory = () => {
    setPhishingHistory([]);
  };

  const handlePhishingAnalysisComplete = (analysis: any, emailData?: any) => {
    setLastPhishingAnalysis(analysis);

    const newSample: AnalyzedSample = {
      id: `custom-${Date.now()}`,
      sender: emailData?.sender || 'manual-analyst@ipb.pt',
      recipient: emailData?.recipient || 'student_test@ipb.pt',
      subject: emailData?.subject || 'Dynamic Submission',
      body: emailData?.body || 'Content entered by user.',
      category: emailData?.category || analysis.predictedCategory || 'conventional_phishing',
      tag: emailData?.labelOrigin === 'known-sample' ? 'Known sample (teaching scores)' : 'Live text check',
      realismScore: analysis.realismScore || 85,
      detectabilityScore: analysis.detectabilityScore || 60,
      languagePolish: analysis.languagePolish || 90,
      urgencyLevel: (analysis.urgencyLevel?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
      detectionDifficulty: (analysis.detectionDifficulty || 'Moderate') as any,
      indicators: analysis.indicators || ['Manual forensic flags applied'],
      mitigationRules: analysis.mitigationRules || ['Deploy standard context sanity checks'],
      detailedAnalysis: [
        analysis.detailedAnalysis || 'Evaluated from the email text.',
        analysis.categoryRationale ? `Class rationale: ${analysis.categoryRationale}` : '',
      ]
        .filter(Boolean)
        .join(' '),
      analysisSource: emailData?.analysisSource || 'gemini',
      labelOrigin: emailData?.labelOrigin || 'llm',
    };

    setPhishingHistory((prev) => [newSample, ...prev]);
    setActiveScreen('dashboard');
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // stay on the login screen either way
    }
    setSignedIn(false);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm">
        Opening laboratory…
      </div>
    );
  }

  if (!signedIn) {
    return <LoginScreen onLoggedIn={() => setSignedIn(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden antialiased">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            IF
          </div>
          <span className="font-semibold tracking-tight text-lg text-white font-display">
            InsightFlow <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Main view
          </div>
          <button onClick={() => setActiveScreen('dashboard')} className={navClass(activeScreen === 'dashboard')}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <div className="px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Academic labs
          </div>

          <button onClick={() => setActiveScreen('phishing')} className={navClass(activeScreen === 'phishing')}>
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>AI Phishing Lab</span>
          </button>

          <button onClick={() => setActiveScreen('deepfake')} className={navClass(activeScreen === 'deepfake')}>
            <Video className="w-4 h-4 text-purple-400" />
            <span>Deepfake Media Lab</span>
          </button>

          <button onClick={() => setActiveScreen('adversarial')} className={navClass(activeScreen === 'adversarial')}>
            <Flame className="w-4 h-4 text-red-400" />
            <span>AI Model Attacks</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project access</p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-800 border border-indigo-500/30 flex items-center justify-center font-bold text-white text-[10px]">
              RB
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-medium text-white truncate">Rinor Basholli</p>
              <p className="text-[10px] text-slate-500 truncate">69492 · IPB / ESTiG</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-[11px] text-slate-400 border border-slate-700 rounded-md py-1.5 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col h-full overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-white font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              AI Cybersecurity Risk Lab
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Academic session</p>
            <p className="text-xs font-mono text-indigo-300">Student: Rinor Basholli</p>
          </div>
        </header>

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
          {activeScreen === 'deepfake' && <DeepfakeMediaStudio />}
          {activeScreen === 'adversarial' && <AdversarialAttackSimulator />}
        </div>

        <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <div className="flex gap-4 items-center">
            <span>source: gemini | fallback | preset | computed</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
