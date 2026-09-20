import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  Server, 
  ShieldPlus, 
  Search, 
  Filter, 
  Trash2, 
  FolderOpen, 
  Layers, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Mail,
  HelpCircle,
  FileDown,
  Loader2
} from 'lucide-react';
import { AnalyzedSample } from '../academicDataset';
import { downloadReportDocx } from '../utils/exportDocx';

interface UnifiedDashboardProps {
  lastPhishingAnalysis: any | null;
  phishingHistory: AnalyzedSample[];
  onLoad90Samples: () => void;
  onClearHistory: () => void;
}

export default function UnifiedAnalysisDashboard({ 
  lastPhishingAnalysis, 
  phishingHistory, 
  onLoad90Samples, 
  onClearHistory 
}: UnifiedDashboardProps) {

  // Dynamic state for specimen exploration
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'legitimate' | 'conventional_phishing' | 'ai_phishing'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Math aggregates based on active workspace state
  const metrics = useMemo(() => {
    const total = phishingHistory.length;
    if (total === 0) {
      return {
        total,
        legitimateCount: 0,
        conventionalCount: 0,
        aiCount: 0,
        avgRealism: 0,
        avgDetectability: 0,
        avgPolish: 0,
        aiBypassChance: 0
      };
    }

    const legitimate = phishingHistory.filter(s => s.category === 'legitimate');
    const conventional = phishingHistory.filter(s => s.category === 'conventional_phishing');
    const ai = phishingHistory.filter(s => s.category === 'ai_phishing');

    const sumRealism = phishingHistory.reduce((acc, s) => acc + s.realismScore, 0);
    const sumDetectability = phishingHistory.reduce((acc, s) => acc + s.detectabilityScore, 0);
    const sumPolish = phishingHistory.reduce((acc, s) => acc + s.languagePolish, 0);

    // AI Phishing specific bypass rate
    // (Bypass = Inverse of spot/detectability probability)
    const aiDetectabilitySum = ai.reduce((acc, s) => acc + s.detectabilityScore, 0);
    const aiBypass = ai.length > 0 
      ? Math.round(100 - (aiDetectabilitySum / ai.length))
      : 82; // standard benchmark fallbacks

    return {
      total,
      legitimateCount: legitimate.length,
      conventionalCount: conventional.length,
      aiCount: ai.length,
      avgRealism: Math.round(sumRealism / total),
      avgDetectability: Math.round(sumDetectability / total),
      avgPolish: Math.round(sumPolish / total),
      aiBypassChance: aiBypass
    };
  }, [phishingHistory]);

  // Handle active selected specimen to view
  const activeSpecimen = useMemo(() => {
    if (selectedSampleId) {
      const match = phishingHistory.find(s => s.id === selectedSampleId);
      if (match) return match;
    }
    // Default fallback to last live analysis or first historical sample
    if (lastPhishingAnalysis) {
      // Find or build temporary fallback matching the last analysis attributes
      const match = phishingHistory.find(s => s.subject === lastPhishingAnalysis.subject);
      if (match) return match;
    }
    return phishingHistory[0] || null;
  }, [selectedSampleId, phishingHistory, lastPhishingAnalysis]);

  // Filter and search logic for specimen list
  const filteredSamples = useMemo(() => {
    return phishingHistory.filter(sample => {
      const categoryMatch = categoryFilter === 'all' || sample.category === categoryFilter;
      const textMatch = 
        sample.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sample.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sample.body.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && textMatch;
    });
  }, [phishingHistory, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header & Academic Status */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 bg-gradient-to-r from-slate-900/95 via-indigo-950/20 to-slate-900/30">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-600/10 border border-indigo-500/35 px-2.5 py-1 rounded">
                Interactive Study Session
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-1 rounded">
                {metrics.total} Samples Loaded
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-white mt-2">Cybersecurity Research Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing email writing patterns, how often spam filters fail, and simple defense rules to stop deepfakes and AI phishing.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => downloadReportDocx((loading) => setIsExporting(loading))}
              disabled={isExporting}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-xs font-semibold text-white rounded-lg transition duration-150 shadow-md flex items-center gap-2 cursor-pointer border border-emerald-400/30"
              title="Download complete academic research report as a Microsoft Word document (.docx)"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Docx...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export Word Doc (.docx)</span>
                </>
              )}
            </button>
            <button
              onClick={onLoad90Samples}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition duration-150 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              Reset & Load Study Dataset (90 Samples)
            </button>
            <button
              onClick={onClearHistory}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-red-400 border border-slate-750 text-xs font-semibold text-slate-300 rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer"
              title="Clear active workspace"
            >
              <Trash2 className="w-4 h-4" />
              Clear Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Analytical Bento KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Statistical Dataset Size */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-semibold text-slate-400">
            <span>Total Emails in Database</span>
            <span className="text-indigo-400 font-mono">Sample Size</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">{metrics.total}</span>
            <span className="text-xs text-slate-400 font-medium font-sans">Research cases</span>
          </div>
          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${(metrics.legitimateCount / (metrics.total || 1)) * 100}%` }} 
              className="h-full bg-green-500" 
              title={`Legitimate: ${metrics.legitimateCount}`}
            />
            <div 
              style={{ width: `${(metrics.conventionalCount / (metrics.total || 1)) * 100}%` }} 
              className="h-full bg-orange-500" 
              title={`Conventional: ${metrics.conventionalCount}`}
            />
            <div 
              style={{ width: `${(metrics.aiCount / (metrics.total || 1)) * 100}%` }} 
              className="h-full bg-purple-500" 
              title={`AI Phishing: ${metrics.aiCount}`}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-500 pt-0.5">
            <span>LEG: {metrics.legitimateCount}</span>
            <span>CONV: {metrics.conventionalCount}</span>
            <span>AI: {metrics.aiCount}</span>
          </div>
        </div>

        {/* Metric 2: Average Realism */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-semibold text-slate-400">
            <span>Email Realism Score</span>
            <span className="text-purple-400">Dynamic Avg</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-white">{metrics.avgRealism}%</span>
            <span className="text-xs text-indigo-400 font-medium font-sans">Score index</span>
          </div>
          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div style={{ width: `${metrics.avgRealism}%` }} className="h-full bg-purple-500 transition-all duration-300" />
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Shows how convincing the email looks based on writing style and emotional tone.
          </p>
        </div>

        {/* Metric 3: AI Phishing Bypass Rate */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-semibold text-slate-400">
            <span>Filter Failure Rate</span>
            <span className="text-red-400">Critical Threat</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-red-400">{metrics.aiBypassChance}%</span>
            <span className="text-xs text-red-500 font-medium font-sans">Filter failure</span>
          </div>
          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div style={{ width: `${metrics.aiBypassChance}%` }} className="h-full bg-red-500 transition-all duration-300" />
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            How often AI-written emails successfully trick standard spam filters.
          </p>
        </div>

        {/* Metric 4: Average Detection Rate / Spot factor */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-semibold text-slate-400">
            <span>Vigilance & Detection Score</span>
            <span className="text-emerald-400">Security Index</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-emerald-400">{metrics.avgDetectability}%</span>
            <span className="text-xs text-slate-400 font-sans">Avg visibility</span>
          </div>
          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div style={{ width: `${metrics.avgDetectability}%` }} className="h-full bg-emerald-500 transition-all duration-300" />
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            How likely a security system or trained user will catch this email.
          </p>
        </div>
      </div>

      {/* Main Dynamic Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Section: Browse 90 samples database */}
        <div className="lg:col-span-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden max-h-[620px]">
          
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                List of Email Samples ({filteredSamples.length})
              </h3>
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                IPB SEC LAB
              </span>
            </div>

            {/* Micro search bar */}
            <div className="relative">
              <Search className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search subjects, senders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Category selection filters */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {[
                { label: 'All', value: 'all' },
                { label: 'Legit', value: 'legitimate' },
                { label: 'Conv.', value: 'conventional_phishing' },
                { label: 'AI Phish', value: 'ai_phishing' }
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setCategoryFilter(btn.value as any)}
                  className={`text-[9px] font-mono tracking-wider font-bold uppercase py-1 border rounded ${
                    categoryFilter === btn.value
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-705'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list of items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/20">
            {filteredSamples.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No matching emails found. Try changing your filters or click the button to load 90 samples.
              </div>
            ) : (
              filteredSamples.map((sample) => {
                const isSelected = activeSpecimen?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => setSelectedSampleId(sample.id)}
                    className={`w-full text-left p-3.5 transition duration-150 flex flex-col gap-1.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800/50 border-l-4 border-l-indigo-500' 
                        : 'border-l-4 border-l-transparent hover:bg-slate-850/30'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded leading-none ${
                        sample.category === 'legitimate'
                          ? 'bg-green-500/10 text-green-400'
                          : sample.category === 'conventional_phishing'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {sample.category.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">ID: {sample.id}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 truncate w-full group-hover:text-white">
                      {sample.subject}
                    </p>

                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1">
                      <span className="truncate max-w-[140px] text-slate-500">{sample.sender}</span>
                      <span className="text-indigo-400 font-bold">Realism: {sample.realismScore}%</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Specimen Forensic Investigator Card */}
        <div className="lg:col-span-8 space-y-4">
          
          {!activeSpecimen ? (
            <div className="h-full min-h-[500px] border border-slate-800 border-dashed rounded-xl bg-slate-950/20 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <ShieldAlert className="w-12 h-12 text-indigo-500/20 mb-3" />
              <p className="text-sm font-semibold font-display text-slate-300">No Email Selected</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Please load the 90 samples above, or create a custom email in the &rdquo;Semantic AI Phishing&rdquo; tab to inspect it here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between">
              
              {/* Header Specimen Bar */}
              <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-slate-950/50 to-transparent flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">DETAILED EMAIL AUDIT:</span>
                    <h3 className="text-sm font-bold text-white leading-tight font-display">{activeSpecimen.subject}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                    activeSpecimen.category === 'legitimate'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : activeSpecimen.category === 'conventional_phishing'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {activeSpecimen.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {activeSpecimen.tag}
                  </span>
                </div>
              </div>

              {/* Forensic Metric Gauges */}
              <div className="p-5 bg-slate-950/30 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-center space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Writing Realism</span>
                  <p className="text-2xl font-mono font-bold text-white">{activeSpecimen.realismScore}%</p>
                  <p className="text-[9px] text-slate-400 font-mono">Trickiness rating</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-center space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Detection Score</span>
                  <p className="text-2xl font-mono font-bold text-indigo-400">{activeSpecimen.detectabilityScore}%</p>
                  <p className="text-[9px] text-slate-400 font-mono">Ease of catching</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-center space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Grammar &amp; Style</span>
                  <p className="text-2xl font-mono font-bold text-purple-400">{activeSpecimen.languagePolish}%</p>
                  <p className="text-[9px] text-slate-400 font-mono">Writing quality</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-center space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">How Hard to Spot</span>
                  <p className={`text-xs font-mono font-bold uppercase mt-2.5 ${
                    activeSpecimen.detectionDifficulty === 'Expert' || activeSpecimen.detectionDifficulty === 'Difficult'
                      ? 'text-red-400'
                      : activeSpecimen.detectionDifficulty === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {activeSpecimen.detectionDifficulty}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono font-semibold">For detectors</p>
                </div>
              </div>

              {/* Email View Frame */}
              <div className="p-5 space-y-3.5">
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5 text-slate-400">
                  <div className="flex border-b border-slate-850 pb-1.5">
                    <span className="w-12 text-slate-600">From: </span>
                    <span className="text-slate-300">{activeSpecimen.sender}</span>
                  </div>
                  <div className="flex border-b border-slate-850 py-1.5">
                    <span className="w-12 text-slate-600">To: </span>
                    <span className="text-slate-300">{activeSpecimen.recipient}</span>
                  </div>
                  <div className="flex pt-1.5">
                    <span className="w-12 text-slate-600">Subject: </span>
                    <span className="text-white font-medium">{activeSpecimen.subject}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed rounded-lg">
                  {activeSpecimen.body}
                </div>

                {/* Audit Checklist & Indicators / Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Clues of Scam / Attack
                    </h4>
                    <div className="space-y-1.5">
                      {activeSpecimen.indicators?.map((ind, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-amber-950/25 border border-amber-500/20 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500 font-semibold">•</span>
                          <span>{ind}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldPlus className="w-3.5 h-3.5" />
                      Defense Recommendations
                    </h4>
                    <div className="space-y-1.5">
                      {activeSpecimen.mitigationRules?.map((rule, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-emerald-950/25 border border-emerald-500/20 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-400 font-semibold">&#10003;</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Research Note Narrative */}
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-gray-500 block">
                    Research Notes &amp; Explanations
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeSpecimen.detailedAnalysis}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Guide Note */}
      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10 flex items-start gap-3 text-xs leading-relaxed text-indigo-300">
        <HelpCircle className="w-5 h-5 flex-shrink-0 text-indigo-400" />
        <div>
          <strong>Why this matters for our thesis:</strong> Starting with 90 samples gives us enough data to run realistic stats. We can easily compare simple scam emails with advanced AI-generated emails without hitting API speed limits.
        </div>
      </div>

    </div>
  );
}
