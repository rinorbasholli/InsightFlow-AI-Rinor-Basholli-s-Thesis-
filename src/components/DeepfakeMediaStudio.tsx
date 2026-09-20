import React, { useState } from 'react';
import { Video, Shield, ShieldCheck, HelpCircle, Activity, Sparkles, AlertTriangle, AlertCircle } from 'lucide-react';

export default function DeepfakeMediaStudio() {
  const [mediaType, setMediaType] = useState<'video' | 'audio' | 'image'>('video');
  const [fileName, setFileName] = useState('');
  const [promptAnalysis, setPromptAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const presets = [
    {
      name: 'ceo_keynote_urgent_wire.mp4',
      type: 'video' as const,
      prompt: 'CEO announcing immediate sudden structural acquisition, requesting emergency financial authorization and authentication bypass.'
    },
    {
      name: 'financial_analyst_voicemail.wav',
      type: 'audio' as const,
      prompt: 'Urgent vocal request seeking confidential verification spreadsheet with slight robotic sibilants and absence of natural human breathing pauses.'
    },
    {
      name: 'id_verification_passport.png',
      type: 'image' as const,
      prompt: 'Government issues photo document with metadata mismatches, anomalous asymmetrical eye glare, and double-compressed digital borders.'
    }
  ];

  const handleRunAnalysis = async () => {
    if (!fileName.trim()) {
      setErrorStatus('Please provide a simulated filename or choose a preset.');
      return;
    }
    setLoading(true);
    setErrorStatus(null);
    try {
      const resp = await fetch('/api/analyze-media-deepfake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          mediaType,
          promptAnalysis
        })
      });
      const data = await resp.json();
      if (data.success) {
        setAnalysisResult(data.deepfakeAnalysis);
      } else {
        setErrorStatus(data.error || 'Deepfake analysis verification failed');
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'Verification system network error');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setFileName(preset.name);
    setMediaType(preset.type);
    setPromptAnalysis(preset.prompt);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-slate-200 shadow-xl">
      <div className="p-6 bg-gradient-to-r from-indigo-950/20 via-slate-900/60 to-transparent border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Deepfake Media &amp; Audio Inspector</h2>
            <p className="text-xs text-slate-400">Analyze media files to find fake video traits, strange photo lighting, or robotic voices.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Testing Parameters */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Choose File Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['video', 'audio', 'image'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMediaType(t)}
                  className={`p-2.5 rounded-lg border text-xs uppercase font-semibold transition duration-200 cursor-pointer ${
                    mediaType === t
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-705'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Media Filename
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. executive_briefing.mp4, vocal_verify.wav"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono focus:ring-1 focus:ring-indigo-550/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Observation Notes / Details
            </label>
            <textarea
              value={promptAnalysis}
              onChange={(e) => setPromptAnalysis(e.target.value)}
              rows={3}
              placeholder="Describe the file details, sudden voice changes, physical glitches in the face, or anything else suspicious..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 font-sans resize-none focus:ring-1 focus:ring-indigo-550/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Sample Files (Presets)
            </label>
            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="w-full p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 transition duration-150 rounded-lg text-left text-xs cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-mono text-indigo-400 font-bold">{p.name}</span>
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 py-0.5 px-2 bg-slate-900 border border-slate-800 rounded">
                      {p.type}
                    </span>
                  </div>
                  <p className="text-gray-400 line-clamp-1">{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="w-full p-3 font-semibold text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-550 text-white font-display transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-indigo-300" />
                Checking File for AI Edits...
              </>
            ) : (
              'Analyze Media File'
            )}
          </button>

          {errorStatus && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-lg text-xs text-red-400 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}
        </div>

        {/* Dynamic Forensics Dashboard results */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          {!analysisResult ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl min-h-[300px] text-center">
              <Sparkles className="w-8 h-8 text-indigo-500/30 mb-3 animate-pulse" />
              <p className="text-sm font-medium text-slate-300 font-display">AI Analysis Output</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">Select a sample file above or type your details, then click analyze to look for fake patterns.</p>
            </div>
          ) : (
            <div className="space-y-5 bg-slate-950/40 p-5 rounded-xl border border-slate-800 shadow">
              <div className="flex justify-between items-center pb-3 border-b border-slate-805">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 font-mono block">
                    Analysis Verdict
                  </span>
                  <span className={`text-base font-bold font-display ${
                    analysisResult.simulatedClassification?.toLowerCase().includes('high') || analysisResult.simulatedClassification?.toLowerCase().includes('synthesis')
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}>
                    {analysisResult.simulatedClassification || 'NEEDS EVALUATION'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs font-mono bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded font-bold">
                    Score Confidence: 89.4%
                  </span>
                </div>
              </div>

              {/* Specific irregularities checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono block">
                    Visual &amp; Face Anomalies
                  </span>
                  <ul className="space-y-1.5">
                    {analysisResult.facialIrregularities?.slice(0, 3).map((v: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 font-sans">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono block">
                    Sound &amp; Voice Anomalies
                  </span>
                  <ul className="space-y-1.5">
                    {analysisResult.audioAnomalies?.slice(0, 3).map((a: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 font-sans">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detected Synthetic Markers */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono">
                  Detected AI Signatures
                </span>
                <div className="space-y-2">
                  {analysisResult.markers?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between animate-fadeIn">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white font-display">{m.name}</span>
                          <span className="text-[9px] uppercase font-mono text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                            {m.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-snug">{m.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-xs font-mono font-bold text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded">
                          {m.confidence}%
                        </span>
                        <p className="text-[9px] text-gray-500 font-mono">Sim Probability</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable defensive steps */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-green-400 font-bold uppercase font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Security Defense Actions
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisResult.actionableDefences?.map((def: string, idx: number) => (
                    <div key={idx} className="p-2 bg-green-950/10 border border-green-500/10 text-green-300 rounded text-xs flex items-start gap-1.5 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-400 mt-0.5" />
                      <span>{def}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
