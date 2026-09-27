import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json());

// API endpoints
const PRE_BAKED_DEEPFAKES: Record<string, any> = {
  'ceo_keynote_urgent_wire.mp4': {
    facialIrregularities: [
      'Anomalous double-eyelash blinking frequency detected in temporal frames 120-180.',
      'Micro-glare asymmetry on pupil surfaces; light source reflections fail to match environment angles.',
      'Subtle boundary blending artifacts around the neck and jawline during rapid head rotations.'
    ],
    audioAnomalies: [
      'Absence of biological breathing sounds (inhales/exhales) during extended 45-second speech segment.',
      'Metallic sibilants and robotic phoneme transitions, particularly on high-frequency "s" and "t" sounds.',
      'Unnatural flat pitch contour with complete lack of organic emotional prosody or background noise variance.'
    ],
    simulatedClassification: 'synthesis-high',
    markers: [
      {
        name: 'Pupil Micro-Glare Discrepancy',
        description: 'Synthesized reflection layers on eye pupils fail to calculate ambient lighting vectors from the ESTiG presentation hall.',
        confidence: 94,
        category: 'physical'
      },
      {
        name: 'Temporal Blinking Discontinuity',
        description: 'Eyelid closure durations are mathematically uniform, bypassing human cognitive eye reflex variations.',
        confidence: 88,
        category: 'temporal'
      },
      {
        name: 'Acoustic Sibilant Friction',
        description: 'Vocal synthesis engine introduces high-frequency metallic artifacts during stop-consonant phonemes.',
        confidence: 91,
        category: 'acoustic'
      }
    ],
    actionableDefences: [
      'Establish mandatory cryptographic signature verification (such as C2PA metadata tags) for all executive video briefings.',
      'Implement secondary verification channels (e.g., direct secure voice/text check) before executing urgent financial wire transfers.',
      'Deploy real-time active acoustic analysis filters to isolate frequency anomalies in incoming video stream audio.'
    ]
  },
  'financial_analyst_voicemail.wav': {
    facialIrregularities: [],
    audioAnomalies: [
      'Vocal waveform exhibits high sibilant distortion with mechanical speech synthesis pauses.',
      'Abrupt noise floor transitions; background static drops completely to zero between words.',
      'Total absence of physiological breathing cues and standard throat-clearing micro-pauses.'
    ],
    simulatedClassification: 'suspicious-medium',
    markers: [
      {
        name: 'Robotic Phoneme Synthesis',
        description: 'Voicemail audio shows synthesized phoneme transitions that do not match organic glottal pulse shapes.',
        confidence: 82,
        category: 'acoustic'
      },
      {
        name: 'Noise Floor Discontinuity',
        description: 'The background ambient hiss drops out instantly between sentences, suggesting spliced or generative voice segments.',
        confidence: 79,
        category: 'digital'
      }
    ],
    actionableDefences: [
      'Implement multi-factor out-of-band callback confirmations for all verbal financial ledger inquiries.',
      'Train security teams to detect lack of conversational timing and mechanical sentence rhythm.',
      'Deploy synthetic voice classifiers on standard corporate virtual phone lines.'
    ]
  },
  'id_verification_passport.png': {
    facialIrregularities: [
      'Asymmetric eye pupil shapes with mismatched light reflections.',
      'Double-edge boundaries around the photo frame indicating digital copy-paste manipulation.',
      'Synthesized skin texture with lack of organic pores or high-frequency noise.'
    ],
    audioAnomalies: [],
    simulatedClassification: 'synthesis-high',
    markers: [
      {
        name: 'Digital Border Compression',
        description: 'Double-compressed boundary lines detected around the ID photo indicating a digital overlay.',
        confidence: 95,
        category: 'digital'
      },
      {
        name: 'Micro-glare Asymmetry',
        description: 'The light reflections in the left and right eyes do not share a common light source position.',
        confidence: 89,
        category: 'physical'
      }
    ],
    actionableDefences: [
      'Utilize official document validation APIs that cross-reference passport MRZ (Machine Readable Zone) check-digits.',
      'Require real-time liveness checks (such as randomized head movements) during verification sessions.',
      'Analyze photo EXIF metadata for double-compression signatures and editing software identifiers.'
    ]
  }
};

function getDynamicFallbackDeepfake(fileName: string, mediaType: string, promptAnalysis: string) {
  const normFile = (fileName || '').toLowerCase();
  const isVideo = mediaType === 'video' || normFile.endsWith('.mp4') || normFile.endsWith('.mov');
  const isAudio = mediaType === 'audio' || normFile.endsWith('.wav') || normFile.endsWith('.mp3');
  const isImage = mediaType === 'image' || normFile.endsWith('.png') || normFile.endsWith('.jpg') || normFile.endsWith('.jpeg');

  const classification = (promptAnalysis || '').toLowerCase().includes('urgent') || (promptAnalysis || '').toLowerCase().includes('emergency') || normFile.includes('urgent')
    ? 'synthesis-high' 
    : 'suspicious-medium';

  const facialIrregularities: string[] = [];
  const audioAnomalies: string[] = [];
  const markers: any[] = [];

  if (isVideo || isImage) {
    facialIrregularities.push('Asymmetrical illumination levels on left vs. right iris planes.');
    facialIrregularities.push('Soft border artifacts along the chin-neck boundary during keyframe intervals.');
    markers.push({
      name: 'Geometric Light Projection Gap',
      description: 'Generative render engines failed to match physical reflection models with background environment light sources.',
      confidence: 85,
      category: 'physical'
    });
  }

  if (isVideo || isAudio) {
    audioAnomalies.push('Speech synthesis vocoder footprint identified in the 4kHz - 8kHz frequency band.');
    audioAnomalies.push('Perfect mechanical pacing; absence of standard human inhalation gaps and speech disfluencies.');
    markers.push({
      name: 'Vocoder Harmonic Trace',
      description: 'Isolates synthetic high-frequency mechanical friction in stop consonants and sibilants.',
      confidence: 87,
      category: 'acoustic'
    });
  }

  if (markers.length === 0) {
    markers.push({
      name: 'Unusual Metadata Signatures',
      description: 'Media container holds suspicious or stripped compression tags indicating post-generation editing.',
      confidence: 76,
      category: 'digital'
    });
  }

  const actionableDefences = [
    'Enforce out-of-band verification protocol for high-privilege activities.',
    'Enable continuous digital signature audits with content provenance tracking.'
  ];

  return {
    facialIrregularities,
    audioAnomalies,
    simulatedClassification: classification,
    markers,
    actionableDefences
  };
}

function getPhishingFallback(scenario: string, promptText: string, complexity: string) {
  return {
    subject: `🚨 CRITICAL SECURITY ALIGNMENT: ${scenario || 'Account System Overdue Notice'}`,
    body: `Dear ESTiG Member,

This is an automated notification regarding: ${promptText || 'Your password recovery status'}.
Our research database records indicate a temporary mismatch in security keys. 

Please perform a manual credential validation through our secure portal within 6 hours.
Failure to authenticate immediately will restrict all remote desktop and intranet access keys.

Respectfully,
System Administration Forensics Lab
IPB SEC LAB ESTiG`,
    realismScore: complexity === 'expert' ? 91 : complexity === 'sophisticated' ? 86 : 74,
    spoofingIndicators: [
      "Lacks the unique personal name token of the target (addressed generically as 'Dear ESTiG Member').",
      "Artificial temporal urgency constraint (6 hours deadline) designed to prompt fast credential entries.",
      "The signature refers to 'System Administration Forensics Lab', which is not a standard school department."
    ],
    mitigationRules: [
      "Block emails demanding high-priority credential action within tight hourly constraints.",
      "Integrate DMARC and SPF verification headers to prevent spoofing of the school domain."
    ]
  };
}

function normalizeEmailCategory(value: unknown): 'legitimate' | 'conventional_phishing' | 'ai_phishing' | null {
  const s = String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (s.includes('legit')) return 'legitimate';
  if (s.includes('conventional') || s === 'phishing' || s.includes('bec')) return 'conventional_phishing';
  if (s.includes('ai_phish') || s.includes('spear') || s.includes('ai-phish')) return 'ai_phishing';
  return null;
}

function getEmailAnalysisFallback(subject: string, body: string, sender?: string) {
  const normSubject = (subject || '').toLowerCase();
  const normBody = (body || '').toLowerCase();
  const normSender = (sender || '').toLowerCase();
  const blob = `${normSender} ${normSubject} ${normBody}`;
  const domain = (normSender.split('@')[1] || '').trim();
  const officialDomain = domain === 'ipb.pt' || domain.endsWith('.ipb.pt');
  const lookalike = /ipb-portal|ipb-support|ipb-finance|estig-recovery|secure-estig|micros0ft|ctt-entrega/.test(blob);
  const obviousPhish = /urgent|password|reset|wire|sepa|credential|suspended|overdue|click here|gift card|delivery fee/.test(blob);
  const isUrgent = normSubject.includes('urgent') || normSubject.includes('immediate') || normBody.includes('6 hours') || normBody.includes('overdue');

  let predictedCategory: 'legitimate' | 'conventional_phishing' | 'ai_phishing';
  if (officialDomain && !obviousPhish && !lookalike) predictedCategory = 'legitimate';
  else if (lookalike && !/!!!|password reset|delivery fee/.test(blob)) predictedCategory = 'ai_phishing';
  else if (obviousPhish || lookalike) predictedCategory = 'conventional_phishing';
  else predictedCategory = officialDomain ? 'legitimate' : 'conventional_phishing';

  return {
    realismScore: predictedCategory === 'legitimate' ? 92 : (normSubject.includes('critical') || normSubject.includes('overdue') ? 88 : 78),
    detectabilityScore: predictedCategory === 'legitimate' ? 22 : (isUrgent ? 65 : 45),
    languagePolish: predictedCategory === 'conventional_phishing' ? 55 : 85,
    urgencyLevel: isUrgent ? 'high' : (predictedCategory === 'legitimate' ? 'low' : 'medium'),
    detectionDifficulty: predictedCategory === 'legitimate' ? 'Moderate' : (isUrgent ? 'Moderate' : 'Difficult'),
    predictedCategory,
    categoryRationale: predictedCategory === 'legitimate'
      ? 'Offline fallback: official-looking institutional domain without payment or credential bait.'
      : predictedCategory === 'ai_phishing'
        ? 'Offline fallback: lookalike domain with relatively polished language (not a trained classifier).'
        : 'Offline fallback: urgency, payment, or credential-harvest cues (keyword heuristic, not a spam filter).',
    indicators: predictedCategory === 'legitimate'
      ? [
          'Sender domain matches an official IPB-style hostname.',
          'No payment, credential-reset, or short-deadline bait detected by the keyword fallback.'
        ]
      : [
          sender ? `Sender inspected: ${sender}` : 'Sender was empty; domain spoofing could not be checked.',
          isUrgent ? 'Subject or body uses artificial urgency.' : 'Suspicious call-to-action or lookalike domain cues.',
          'This fallback does not query a real mail filter.'
        ],
    mitigationRules: [
      'Check SPF/DKIM/DMARC and the visible From domain before acting.',
      'Do not treat this fallback score as a Gmail or SpamAssassin verdict.'
    ],
    detailedAnalysis: `Offline keyword fallback (Gemini unavailable). Predicted class: ${predictedCategory}. Sender="${sender || '(none)'}". This is a heuristic, not a measured detector.`
  };
}

function getAdversarialFallback(originalClass: string, targetClass: string, noiseLevel: any, architecture: string) {
  const eps = parseFloat(String(noiseLevel)) || 0.05;
  const originalConf = 98.4;
  const targetConf = 86.2;
  const noiseStr = Number((eps * 0.1).toFixed(4));
  
  return {
    originalClass: originalClass || 'Airplane',
    originalConfidence: originalConf,
    targetClass: targetClass || 'Bird',
    targetConfidence: targetConf,
    noiseStrength: noiseStr,
    mathematicalLogs: `Loss calculation: J(theta, x, y)\nGradient calculation: sign(grad_x(J))\nAdversarial pertub: x_adv = x + ${eps} * sign(grad_x(J))`,
    robustDefenseSteps: [
      "Adversarial Training: include FGSM and PGD perturbed images directly in the model's training loop.",
      "Spatial Smoothing & Gaussian Filtering: apply image preprocessing steps to reduce high-frequency adversarial noise before model inference.",
      "Defensive Distillation: train a secondary smoother network using soft probability logits to decrease overall gradient sensitivity."
    ]
  };
}

// 1. Generate Phishing email using Gemini
app.post('/api/generate-phishing', async (req, res) => {
  const { scenario, promptText, customPrompt, complexity } = req.body;

  let finalPrompt = `
Generate an email message for academic analysis as part of our Practical Study of Cybersecurity Risks.
We need to compare this mock sample against conventional phishing and legitimate emails.

Create an email representing the scenario: "${scenario}".
Scenario details / core topic: ${promptText}.
${customPrompt ? `Additional custom instructions: ${customPrompt}` : ''}
Email style & quality target: Sophisticated AI-generated message with ${complexity || 'high'} linguistic accuracy.

Please output a JSON response containing:
- subject: Subject line of the email.
- body: Body content of the email (clean, realistic email format).
- realismScore: estimated realism score from 0 to 100 based on grammatical correctness, contextual reasoning, and overall visual format.
- spoofingIndicators: direct list of 3-4 subtle cues/indicators that make this potentially recognizable by a vigilant expert (e.g. slight domain mismatches, emotional buttons, sophisticated phishing indicators).
- mitigationRules: 2-3 specific rules or steps for a defensive email filter system or user awareness program to stop or report this specific threat.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['subject', 'body', 'realismScore', 'spoofingIndicators', 'mitigationRules'],
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            realismScore: { type: Type.NUMBER },
            spoofingIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mitigationRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, source: 'gemini', email: data });
  } catch (error: any) {
    console.error('Error generating AI phishing:', error);
    // Graceful fallback
    const fallbackData = getPhishingFallback(scenario, promptText, complexity);
    res.json({ success: true, source: 'fallback', email: fallbackData });
  }
});

// 2. Classify / Analyze any email based on student laboratory requirements
app.post('/api/analyze-email', async (req, res) => {
  const { subject, body, sender } = req.body;

  const analysisPrompt = `
Analyze the following email as part of a cybersecurity academic study.
This is an LLM judgement of the text, not a spam-filter measurement.

From: ${sender || '(not provided)'}
Subject: ${subject}
Body: ${body}

Determine:
1. Realism Score (0-100) - how convincing is this to an average employee or user.
2. Detectability Score (0-100) - how easy is it to spot as phishing (if it is phishing) or classify.
3. Language Polish Score (0-100) - grammar, punctuation, context coherence.
4. Urgency Level - low, medium, or high.
5. Detection Difficulty - Very Easy, Easy, Moderate, Difficult, Expert.
6. Technical/indicators points - inspect the From address/domain when provided (lookalike hosts, non-institutional domains, missing sender). Also note suspicious links, credential bait, and urgency.
7. Defensive mitigation rules - actionable guidelines for protecting a network against such emails.
8. Detailed Analysis - write a precise 1-2 paragraph description in markdown explaining why.
9. predictedCategory - exactly one of: legitimate, conventional_phishing, ai_phishing.
   Use legitimate for calm official-looking institutional mail without payment/credential bait.
   Use conventional_phishing for obvious lures (urgency, grammar issues, parcel fees, password reset, BEC wire).
   Use ai_phishing for highly polished spear-phish with lookalike domains and contextual academic/business tailoring.
10. categoryRationale - one sentence on why that class was chosen. Do not claim this is ground truth.

Generate the response in JSON format.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: analysisPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'realismScore',
            'detectabilityScore',
            'languagePolish',
            'urgencyLevel',
            'detectionDifficulty',
            'indicators',
            'mitigationRules',
            'detailedAnalysis',
            'predictedCategory',
            'categoryRationale',
          ],
          properties: {
            realismScore: { type: Type.NUMBER },
            detectabilityScore: { type: Type.NUMBER },
            languagePolish: { type: Type.NUMBER },
            urgencyLevel: { type: Type.STRING },
            detectionDifficulty: { type: Type.STRING },
            indicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mitigationRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            detailedAnalysis: { type: Type.STRING },
            predictedCategory: { type: Type.STRING },
            categoryRationale: { type: Type.STRING },
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const predicted = normalizeEmailCategory(data.predictedCategory);
    if (predicted) data.predictedCategory = predicted;
    res.json({ success: true, source: 'gemini', analysis: data });
  } catch (error: any) {
    console.error('Error analyzing email:', error);
    const fallbackData = getEmailAnalysisFallback(subject, body, sender);
    res.json({ success: true, source: 'fallback', analysis: fallbackData });
  }
});

// 3. Deepfake Signature Verification & Simulated Analysis
app.post('/api/analyze-media-deepfake', async (req, res) => {
  const { fileName, mediaType, promptAnalysis } = req.body;

  // Direct fast matching for exact presets (guarantees instantaneous and offline-safe presentation)
  const cleanName = (fileName || '').trim().toLowerCase();
  for (const presetName of Object.keys(PRE_BAKED_DEEPFAKES)) {
    if (cleanName === presetName.toLowerCase()) {
      return res.json({ success: true, source: 'preset', deepfakeAnalysis: PRE_BAKED_DEEPFAKES[presetName] });
    }
  }

  const deepfakePrompt = `
Analyze a virtual simulated media file for Deepfake indicators. 
File name: ${fileName}
Media type: ${mediaType}
Context / Custom input: ${promptAnalysis || 'N/A'}

Provide a structured metadata assessment of deepfake signs:
- facialIrregularities: list specific visual cues of artifacts (e.g. asymmetrical glares, blending anomalies, frequency inconsistency).
- audioAnomalies: voice signature mismatches (e.g. metallic sibilants, lack of biological inhales, robotic phonemes).
- simulatedClassification: legitimate, warning-low, suspicious-medium, synthesis-high.
- markers: array of object indicators with keys:
    * name: marker or visual flaw name
    * description: description of that specific error
    * confidence: numeric percentage chance (0 to 100)
    * category: physical, temporal, acoustic or digital
- actionableDefences: 2-3 actionable, modern defensive practices to mitigate deepfake-assisted social engineering.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: deepfakePrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'facialIrregularities',
            'audioAnomalies',
            'simulatedClassification',
            'markers',
            'actionableDefences',
          ],
          properties: {
            facialIrregularities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            audioAnomalies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            simulatedClassification: { type: Type.STRING },
            markers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['name', 'description', 'confidence', 'category'],
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
              },
            },
            actionableDefences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, source: 'gemini', deepfakeAnalysis: data });
  } catch (error: any) {
    console.error('Error analyzing media deepfake:', error);
    // Graceful fallback to guarantee smooth presentation even if API is 503 / UNAVAILABLE
    const fallbackData = getDynamicFallbackDeepfake(fileName, mediaType, promptAnalysis);
    res.json({ success: true, source: 'fallback', deepfakeAnalysis: fallbackData });
  }
});

// 4. Adversarial Attack Simulation & Robustness Perturbation Calculator
app.post('/api/adversarial-perturb', async (req, res) => {
  const { originalClass, targetClass, noiseLevel, architecture } = req.body;

  const adversarialPrompt = `
Generate a simulated result for a Fast Gradient Sign Method (FGSM) or Projected Gradient Descent (PGD) adversarial perturbation attack study.
Target model architecture: ${architecture}
Original predicted class: ${originalClass}
Desired adversarial target class: ${targetClass}
Perturbation epsilon budget: ${noiseLevel}

Output JSON structured simulation parameters:
- originalClass: original prediction label
- originalConfidence: 0-100 initial prediction accuracy (must be high, e.g. 94-99)
- targetClass: adversarial classification outcome
- targetConfidence: final classification confidence under noise (e.g. 75-98)
- noiseStrength: final realized noise ratio
- mathematicalLogs: string with 3 lines of pseudo-code / formal gradient equations showing high precision (e.g., x_adv = x + eps * sign(grad_x(J(theta, x, y))))
- robustDefenseSteps: array of 3 actionable modern neural network mitigations to defend against this specific perturbation (such as Adversarial Training, Defensive Distillation, Feature Squeezing, Input Transformation).
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: adversarialPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'originalClass',
            'originalConfidence',
            'targetClass',
            'targetConfidence',
            'noiseStrength',
            'mathematicalLogs',
            'robustDefenseSteps',
          ],
          properties: {
            originalClass: { type: Type.STRING },
            originalConfidence: { type: Type.NUMBER },
            targetClass: { type: Type.STRING },
            targetConfidence: { type: Type.NUMBER },
            noiseStrength: { type: Type.NUMBER },
            mathematicalLogs: { type: Type.STRING },
            robustDefenseSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, source: 'gemini', perturbation: data });
  } catch (error: any) {
    console.error('Error calculating adversarial stats:', error);
    // Graceful fallback
    const fallbackData = getAdversarialFallback(originalClass, targetClass, noiseLevel, architecture);
    res.json({ success: true, source: 'fallback', perturbation: fallbackData });
  }
});


// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
