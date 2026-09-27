import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  RefreshCcw, 
  Check, 
  Copy, 
  Image as ImageIcon, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';

const PRESET_IMAGES: Record<string, string> = {
  'Airplane': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80',
  'Banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
  'Panda': 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=400&q=80',
  'Sports Car': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
  'Credit Card': 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=400&q=80'
};

const getPresetImage = (label: string): string => {
  const match = Object.keys(PRESET_IMAGES).find(k => label.toLowerCase().includes(k.toLowerCase()));
  return match ? PRESET_IMAGES[match] : 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80';
};

// Canvas-based dynamic high-frequency noise generator
function NoiseCanvas({ noiseLevel }: { noiseLevel: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 120;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Generate adversarial-like chromatic perturbations (FGSM sign-pattern simulation)
    for (let i = 0; i < data.length; i += 4) {
      // Simulate high frequency sign direction coordinates
      const r = Math.floor(Math.sin(i * 0.15) * 127 + 128);
      const g = Math.floor(Math.cos(i * 0.25) * 127 + 128);
      const b = Math.floor(Math.sin(i * 0.35) * 127 + 128);
      
      data[i] = r;     // R
      data[i + 1] = g; // G
      data[i + 2] = b; // B
      data[i + 3] = Math.floor(noiseLevel * 255); // Alpha scales directly with epsilon
    }

    ctx.putImageData(imageData, 0, 0);
  }, [noiseLevel]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-cover" 
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function AdversarialAttackSimulator() {
  const [architecture, setArchitecture] = useState<'ResNet-50' | 'VisionTransformer' | 'MobileNetV3'>('ResNet-50');
  const [originalClass, setOriginalClass] = useState('Airplane');
  const [targetClass, setTargetClass] = useState('Bird');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.05);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  // Common quick pairs
  const suggestions = [
    { orig: 'Airplane', target: 'Bird', noise: 0.05 },
    { orig: 'Banana', target: 'Toaster', noise: 0.08 },
    { orig: 'Panda', target: 'Gibbon', noise: 0.03 },
    { orig: 'Sports Car', target: 'Lawn Mower', noise: 0.12 }
  ];

  // Resolve active testing visual image asset
  const activeImage = getPresetImage(originalClass);

  const runSimulation = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const resp = await fetch('/api/adversarial-perturb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalClass,
          targetClass,
          noiseLevel,
          architecture
        })
      });
      const data = await resp.json();
      if (data.success) {
        setResult(data.perturbation);
      } else {
        setErrorStatus(data.error || 'Failed to simulate');
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (orig: string, target: string, noise: number) => {
    setOriginalClass(orig);
    setTargetClass(target);
    setNoiseLevel(noise);
    setResult(null); // Reset live results to allow fresh calculation triggers
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-slate-200 shadow-xl">
      <div className="p-6 bg-gradient-to-r from-indigo-950/20 via-slate-900/60 to-transparent border-b border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">AI Model Attack Simulator</h2>
              <p className="text-xs text-slate-400">Test how easily image-recognition AI models can be tricked by adding tiny amounts of noise (FGSM &amp; PGD methods).</p>
            </div>
          </div>
          <span className="text-[10px] font-mono leading-none bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold px-2.5 py-1.5 rounded uppercase">
            {architecture} Target
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Left column: Configuration Panel */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Select AI Model to Test
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ResNet-50', 'VisionTransformer', 'MobileNetV3'] as const).map((arch) => (
                <button
                  key={arch}
                  onClick={() => {
                    setArchitecture(arch);
                    setResult(null); // clear to force re-run
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer ${
                    architecture === arch
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-705'
                  }`}
                >
                  {arch === 'VisionTransformer' ? 'ViT-Base' : arch}
                </button>
              ))}
            </div>
          </div>

          {/* Label Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Original Image Label
              </label>
              <input
                type="text"
                value={originalClass}
                onChange={(e) => {
                  setOriginalClass(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g. Banana"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Target Label (What to trick it into)
              </label>
              <input
                type="text"
                value={targetClass}
                onChange={(e) => {
                  setTargetClass(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g. Toaster"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 font-sans"
              />
            </div>
          </div>

          {/* Epsilon Budget Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Noise Level (Epsilon ε)
              </label>
              <span className="font-mono text-xs text-indigo-400 bg-indigo-950/45 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">
                {noiseLevel.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.250"
              step="0.005"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-950 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>ε = 0.005 (Subtle Noise)</span>
              <span>ε = 0.250 (Heavy Distortion)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Sample Presets
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    applyPreset(item.orig, item.target, item.noise);
                  }}
                  className="p-2.5 transition text-left text-xs bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-700 border border-slate-800 rounded-lg space-y-0.5 cursor-pointer"
                >
                  <p className="font-bold text-slate-305 flex justify-between">
                    <span>{item.orig}</span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className="text-indigo-400 truncate max-w-[50px]">{item.target.split(' ')[0]}</span>
                  </p>
                  <p className="text-[10px] text-teal-400 font-mono font-bold">Noise Budget: {item.noise}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Trigger button */}
          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full p-3 font-semibold text-xs rounded-lg uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-550 text-white font-display transition duration-200 shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin text-indigo-300" />
                Creating Image Noise...
              </>
            ) : (
              'Simulate Attack on Model'
            )}
          </button>

          {errorStatus && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-lg text-xs text-red-400">
              {errorStatus} - Please verify target API and try again.
            </div>
          )}
        </div>

        {/* Right column: Dynamic Live Three-Panel Visualizer Dashboard */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          <div className="bg-slate-950/50 p-5 border border-slate-800 rounded-xl space-y-5 shadow">
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Attack Visualizer
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Live Parameter Modeling
              </span>
            </div>

            {/* Three-Panel Specimen Flow Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Tile 1: Original Clean Image */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold border-b border-slate-900 pb-1.5">
                  <span>1. Original Image</span>
                  <span className="text-slate-500 leading-none">Standard Input</span>
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/60 bg-slate-900">
                  <img 
                    src={activeImage} 
                    alt="Original Clean Specimen" 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-2 text-center">
                    <span className="text-[9px] font-mono font-bold text-indigo-400">Normal Prediction</span>
                  </div>
                </div>

                <div className="bg-indigo-950/20 p-2.5 rounded border border-indigo-500/10 text-center space-y-0.5">
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Original Label</p>
                  <p className="text-xs font-bold text-indigo-300 truncate">{originalClass}</p>
                  <p className="text-xs font-mono font-bold text-white">
                    Conf: {result ? `${result.originalConfidence}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Tile 2: Dynamic Extracted Noise Vector */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between font-mono">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-teal-400 font-bold border-b border-slate-900 pb-1.5">
                  <span>2. Added Noise (dx)</span>
                  <span className="text-teal-500 animate-pulse font-bold leading-none">
                    &epsilon; = {noiseLevel.toFixed(3)}
                  </span>
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <NoiseCanvas noiseLevel={Math.min(0.01 + noiseLevel * 3.8, 1.0)} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-2 text-center pointer-events-none">
                    <span className="text-[9px] font-bold text-teal-300">
                      Sign( &nabla;x J(&theta;, x, y) )
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850 text-center space-y-0.5 flex flex-col justify-center h-[54px]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Noise Budget</p>
                  <p className="text-xs font-bold text-teal-400">
                    &epsilon; Budget: {noiseLevel.toFixed(3)}
                  </p>
                  <p className="text-[9px] text-slate-500">Calculated Pixel Changes</p>
                </div>
              </div>

              {/* Tile 3: Resulting Adversarial Image */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold border-b border-slate-900 pb-1.5">
                  <span>3. Tricked Image (x*)</span>
                  {result ? <span className="text-rose-500 leading-none font-bold animate-pulse">ATTACK SUCCESS</span> : <span className="text-slate-500 leading-none font-bold">WAITING</span>}
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-rose-500/20 bg-slate-900">
                  {/* Base Original Image */}
                  <img 
                    src={activeImage} 
                    alt="Adversarial Specimen" 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Blended Absolute Noise Overlay */}
                  <div className="absolute inset-0 block pointer-events-none" style={{ opacity: Math.min(0.01 + noiseLevel * 2.8, 0.95) }}>
                    <NoiseCanvas noiseLevel={1.0} />
                  </div>
                  
                  <div className="absolute top-2 right-2 bg-red-650/95 border border-red-500/30 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shadow-md animate-pulse">
                    Fake Image
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-2 text-center">
                    <span className="text-[9px] font-mono font-bold text-rose-400">Tricked Result</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded border text-center space-y-0.5 transition-colors duration-200 ${
                  result 
                    ? 'bg-rose-950/20 border-rose-500/10' 
                    : 'bg-slate-900 border-slate-850'
                }`}>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tricked Label</p>
                  <p className="text-xs font-bold text-rose-400 truncate">
                    {result ? result.targetClass : targetClass}
                  </p>
                  <p className="text-xs font-mono font-bold text-white">
                    {result ? `Conf: ${result.targetConfidence}%` : 'Waiting for calculation...'}
                  </p>
                </div>
              </div>

            </div>

            {/* Neural Tricking Narrative Alert block */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <span className="font-mono font-bold uppercase tracking-wider text-amber-400 block font-sans">
                  How the AI Model was Tricked:
                </span>
                <p className="text-slate-300 leading-snug">
                  By adding tiny, invisible mathematical changes to the image pixels, the AI is completely tricked from the real label <strong className="text-indigo-400">&ldquo;{originalClass}&rdquo;</strong> into thinking the image is a <strong className="text-rose-400">&ldquo;{result ? result.targetClass : targetClass}&rdquo;</strong>.
                </p>
              </div>
            </div>

            {/* Mathematical Equation Context Formula */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Mathematical Equation (FGSM)
              </p>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                {result?.mathematicalLogs ? (
                  result.mathematicalLogs.split('\n').map((line: string, i: number) => (
                    <div key={i}>{line}</div>
                  ))
                ) : (
                  <div>
                    x_adv = x + &epsilon; &middot; sign( &nabla;_x J(&theta;, x, y_true) )<br />
                    // Adjust parameters on the left and click Simulate to see the steps.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Academic Evaluation Outcome Metrics */}
          {result && (
            <div className="bg-slate-950/40 p-5 border border-slate-800 rounded-xl space-y-4 shadow animate-fadeIn">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-xs font-bold font-display text-white">
                  Model Defense Analysis
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                  Displayed ASR (UI threshold, not measured): {result.targetConfidence > 80 ? '98.5%' : '84.2%'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">
                    Normal Prediction
                  </span>
                  <p className="text-sm font-bold text-indigo-300 mt-0.5">{result.originalClass}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-bold font-mono text-white">
                      {result.originalConfidence}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Confidence</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">
                    Tricked Result
                  </span>
                  <p className="text-sm font-bold text-rose-400 mt-0.5">{result.targetClass}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-bold font-mono text-white">
                      {result.targetConfidence}%
                    </span>
                    <span className="text-[10px] text-rose-450 font-bold font-sans">Tricked successfully!</span>
                  </div>
                </div>
              </div>

              {/* Defenses */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold tracking-wider">
                  How to defend the AI model:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {result.robustDefenseSteps?.map((step: string, index: number) => (
                    <div
                      key={index}
                      className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded text-[11px] flex items-start gap-1.5 leading-snug"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 mt-0.5" />
                      <span>{step}</span>
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
