import React, { useState } from 'react';
import { Mail, Check, AlertTriangle, ShieldCheck, Cpu, RefreshCw, Layers, ListFilter } from 'lucide-react';
import { ACADEMIC_DATASET, PUBLIC_PATTERN_SAMPLES, parseEmailFile } from '../academicDataset';

interface PhishingTesterProps {
  onAnalyzeComplete: (
    analysis: any, 
    emailData?: { subject: string; body: string; sender?: string; category?: string }
  ) => void;
}

export default function PhishingForensicsLab({ onAnalyzeComplete }: PhishingTesterProps) {
  const [activeTab, setActiveTab] = useState<'dataset' | 'generator' | 'classifier'>('dataset');

  // Generator states
  const [scenario, setScenario] = useState('University tuition fee overdue notification');
  const [promptText, setPromptText] = useState('Require student payment confirmation via custom portal within 6 hours due to system upgrade.');
  const [customPrompt, setCustomPrompt] = useState('');
  const [complexity, setComplexity] = useState<'standard' | 'sophisticated' | 'expert'>('sophisticated');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  // Manual Classifier states
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [classifyLoading, setClassifyLoading] = useState(false);

  const [copiedText, setCopiedText] = useState(false);

  const handleGeneratePhishing = async () => {
    setGenerateLoading(true);
    try {
      const resp = await fetch('/api/generate-phishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          promptText,
          customPrompt,
          complexity
        })
      });
      const data = await resp.json();
      if (data.success) {
        setGeneratedResult(data.email);
        // Automatically set classifier content to let the user analyze it easily
        setSubjectInput(data.email.subject);
        setBodyInput(data.email.body);
      }
    } catch (err) {
      console.error('Failed generation:', err);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleAnalyzeEmail = async (subject: string, body: string) => {
    setClassifyLoading(true);
    try {
      const resp = await fetch('/api/analyze-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, sender: 'forensic-analyst@estig.ipb.pt' })
      });
      const data = await resp.json();
      if (data.success) {
        // Enforce robust historical inclusion
        const llmCategory = data.analysis?.predictedCategory as string | undefined;
        const category = llmCategory || 'conventional_phishing';
        onAnalyzeComplete(data.analysis, {
          subject,
          body,
          sender: 'forensic-analyst@estig.ipb.pt',
          category
        });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setClassifyLoading(false);
    }
  };

  const loadPresetIntoClassifier = (subject: string, body: string) => {
    setSubjectInput(subject);
    setBodyInput(body);
    setActiveTab('classifier');
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-slate-200 shadow-xl">
      <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/20 via-transparent to-transparent">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">AI Phishing Lab</h2>
              <p className="text-xs text-slate-400">Create, compare, and check standard emails against simple scam emails and AI-written phishing.</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex px-6 border-t border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('dataset')}
            className={`py-3.5 px-4 text-xs font-semibold tracking-wide uppercase transition duration-150 border-b-2 flex items-center gap-2 ${
              activeTab === 'dataset'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Sample Emails (3 Cases)
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`py-3.5 px-4 text-xs font-semibold tracking-wide uppercase transition duration-150 border-b-2 flex items-center gap-2 ${
              activeTab === 'generator'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            AI Email Creator
          </button>
          <button
            onClick={() => setActiveTab('classifier')}
            className={`py-3.5 px-4 text-xs font-semibold tracking-wide uppercase transition duration-150 border-b-2 flex items-center gap-2 ${
              activeTab === 'classifier'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Email Security Check
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'dataset' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs leading-relaxed">
              <strong>Project Recommendation:</strong> Our thesis compares normal emails, simple scam emails, and highly realistic AI-written emails. Look at the 3 sample templates below. Click &ldquo;Send to Inspector&rdquo; to check their security details.
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {ACADEMIC_DATASET.map((example) => (
                <div
                  key={example.id}
                  className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between hover:border-slate-705 transition duration-150"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded leading-none ${
                        example.category === 'legitimate'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : example.category === 'conventional_phishing'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {example.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium font-mono">{example.tag}</span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded bg-slate-950/80 border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-gray-500 font-mono">From: </span>
                        <span className="text-gray-300 font-mono">{example.sender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-mono">Subject: </span>
                        <span className="text-white font-medium">{example.subject}</span>
                      </div>
                    </div>

                    <pre className="p-3 rounded bg-slate-950 text-[10px] text-slate-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-slate-800/60">
                      {example.body}
                    </pre>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[10px] leading-snug">
                      <span className="text-gray-400 font-semibold block uppercase text-[8px] tracking-wide mb-1">
                        Reviewer Analysis
                      </span>
                      <p className="text-gray-300">{example.explanation}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => loadPresetIntoClassifier(example.subject, example.body)}
                    className="mt-4 w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer"
                  >
                    Send to Inspector &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Generator UI */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400 font-mono">
                AI Generation Settings
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Choose a Scam Theme
                  </label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="University tuition fee overdue notification">University Tuition Scheme Notice</option>
                    <option value="Executive authority bank wire transfer trigger">Executive/CEO urgent funding request</option>
                    <option value="Institutional platform MFA bypass credential validation">System SSO Credential Migration</option>
                    <option value="Joint Research paper proposal critical modifications required">Research Appraisal sheet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Topic Keywords / Focus
                  </label>
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Add Extra Details (Optional)
                    </label>
                    <span className="text-[9px] text-gray-500 font-semibold">Great for testing targeted scams</span>
                  </div>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add specific names, manager details, or company codes to see how realistic the AI can make the email..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-sans resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Writing Quality Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['standard', 'sophisticated', 'expert'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setComplexity(lvl as any)}
                        className={`p-2 rounded-lg border text-xs capitalize transition duration-150 ${
                          complexity === lvl
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-705'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGeneratePhishing}
                  disabled={generateLoading}
                  className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-550 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {generateLoading ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" />
                      Creating Realistic Email with AI...
                    </>
                  ) : (
                    'Generate AI Phishing Email'
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {!generatedResult ? (
                <div className="h-full min-h-[300px] border border-slate-800 border-dashed rounded-xl bg-slate-950/40 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Cpu className="w-8 h-8 text-indigo-500/20 mb-2 animate-pulse" />
                  <p className="text-sm font-semibold font-display text-slate-400">AI Phishing Generation Space</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">Fill in the details on the left to generate realistic emails and see how modern AI easily gets past simple spam filters.</p>
                </div>
              ) : (
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono text-indigo-400 font-bold">GENERATED EMAIL</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${generatedResult.subject}\n\n${generatedResult.body}`);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition"
                    >
                      {copiedText ? 'Copied' : 'Copy Email'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">Subject: </span>
                        <span className="text-white font-medium">{generatedResult.subject}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded text-xs font-mono text-slate-300 leading-relaxed max-h-60 overflow-y-auto border border-slate-800 whitespace-pre-wrap">
                      {generatedResult.body}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-slate-900 rounded border border-slate-800">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
                          Realism Index
                        </span>
                        <p className="text-lg font-bold text-white mt-1">
                          {generatedResult.realismScore}%
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-950/35 rounded border border-indigo-500/20">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300">
                          Filter Failure Chance
                        </span>
                        <p className="text-lg font-bold text-indigo-400 mt-1">
                          {Math.floor(generatedResult.realismScore * 0.9 + 5)}%
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSubjectInput(generatedResult.subject);
                        setBodyInput(generatedResult.body);
                        setActiveTab('classifier');
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition cursor-pointer"
                    >
                      Send to Email Check &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forensic Classifier/Auditor Tab */}
        {activeTab === 'classifier' && (
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-400 font-mono block">
              Email Analysis &amp; Security Check
            </span>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="Copy/paste a suspicious subject line..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono focus:ring-1 focus:ring-indigo-550/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Email Body Content
                  </label>
                  <textarea
                    rows={10}
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    placeholder="Paste the email body text here to check if it looks suspicious or realistic..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono resize-none leading-relaxed focus:ring-1 focus:ring-indigo-550/30"
                  />
                </div>

                <button
                  onClick={() => handleAnalyzeEmail(subjectInput, bodyInput)}
                  disabled={classifyLoading || !subjectInput.trim() || !bodyInput.trim()}
                  className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-550 text-xs font-semibold uppercase tracking-wide text-white rounded-lg transition duration-200 cursor-pointer"
                >
                  {classifyLoading ? (
                    'Analyzing Email Security and Style...'
                  ) : (
                    'Analyze This Email'
                  )}
                </button>
              </div>

              <div className="p-5 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center text-center text-slate-500">
                <ShieldCheck className="w-10 h-10 text-indigo-500/20 mb-3 animate-pulse" />
                <p className="text-sm font-semibold font-display text-slate-400 text-center">Security Analysis Result</p>
                <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed font-sans">
                  The system checks for urgent language, spelling, grammar quality, and potential scam tactics. It then creates custom defense rules. The result will show up on your &ldquo;Cybersecurity Research Dashboard&rdquo;.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
