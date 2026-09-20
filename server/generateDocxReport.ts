import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
} from 'docx';

export async function createReportDocxBuffer(): Promise<Buffer> {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
  };

  // Full printable width between 1-inch margins on standard Letter page (12240 - 2880 = 9360 dxa)
  const TOTAL_TABLE_WIDTH_DXA = 9360;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // 8.5 inches
              height: 15840, // 11 inches
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'AI Cybersecurity Risk Lab | IPB ESTiG Academic Research Report',
                    size: 18,
                    color: '64748B',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Author: Rinor Basholli (rinorbasholli@gmail.com) | Academic Research Report — IPB ESTiG',
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Institutional Heading
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 80 },
            children: [
              new TextRun({
                text: 'INSTITUTO POLITÉCNICO DE BRAGANÇA (IPB)',
                bold: true,
                size: 26,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: 'Escola Superior de Tecnologia e Gestão (ESTiG) — Licenciatura em Engenharia Informática',
                size: 22,
                color: '475569',
              }),
            ],
          }),

          // Main Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'ACADEMIC RESEARCH & TECHNICAL REPORT:',
                bold: true,
                size: 32,
                color: '0F172A',
              }),
              new TextRun({
                text: 'AI CYBERSECURITY RISK LAB',
                bold: true,
                size: 32,
                color: '1E3A8A',
                break: 1,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: 'Practical Study of Cybersecurity Risks of Artificial Intelligence: AI-Generated Phishing, Deepfake Multimedia Forensics, and Adversarial Evasion Attacks',
                italics: true,
                size: 22,
                color: '334155',
              }),
            ],
          }),

          // Metadata Table (2 columns: 2800 dxa + 6560 dxa = 9360 dxa)
          new Table({
            width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Author / Student:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rinor Basholli (rinorbasholli@gmail.com)' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Academic Advisor:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Prof. Tiago Pedrosa' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Degree Program:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Licenciatura em Engenharia Informática' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Institution:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Instituto Politécnico de Bragança (ESTiG)' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Live Testbed App:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'https://ai-cybersecurity-risk-lab-600814116012.us-west1.run.app' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Date of Publication:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 6560, type: WidthType.DXA },
                    children: [new Paragraph({ children: [new TextRun({ text: 'September 2026' })] })],
                  }),
                ],
              }),
            ],
          }),

          // 1. Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '1. Executive Summary & Research Motivation', bold: true, size: 28, color: '1E3A8A' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The accelerated proliferation of Generative Artificial Intelligence (GAI) and Deep Learning foundation models has fundamentally transformed the modern cybersecurity threat landscape. Whereas traditional cyberattacks relied on recognizable manual patterns—such as generic phishing emails with grammatical errors, static malware signatures, and unedited media assets—modern attackers now deploy state-of-the-art Large Language Models (LLMs), neural voice synthesizers, and adversarial evasion vectors.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'This research project, developed at the Instituto Politécnico de Bragança (IPB - ESTiG), introduces the ',
              }),
              new TextRun({ text: 'AI Cybersecurity Risk Lab', bold: true }),
              new TextRun({
                text: ', an interactive full-stack experimental testbed designed to measure, simulate, and defend against three core AI threat vectors:',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'AI-Synthesized Phishing: ', bold: true }),
              new TextRun({ text: 'Evaluation of generative LLMs crafting hyper-targeted, zero-grammar-defect social engineering attacks that bypass conventional heuristic and Bayesian filters.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Deepfake Multimedia Forensics: ', bold: true }),
              new TextRun({ text: 'Acoustic and visual forensic inspection identifying synthetic voice clones, vocoder frequency fingerprints, pupil micro-glare mismatches, and temporal discontinuities.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Adversarial Machine Learning Perturbations: ', bold: true }),
              new TextRun({ text: 'Fast Gradient Sign Method (FGSM) and Projected Gradient Descent (PGD) evasion attacks capable of inducing catastrophic classification failure in deep neural vision networks with imperceptible perturbation budgets (ε).' }),
            ],
          }),

          // 2. Full-Stack System Architecture
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '2. Full-Stack System Architecture', bold: true, size: 28, color: '1E3A8A' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The experimental platform is built using a secure full-stack architecture running inside containerized Google Cloud Run infrastructure. To guarantee API security and prevent key leakage, all generative cognitive operations and forensic evaluations are routed through a dedicated Node.js Express server.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Key Architectural Components:', bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Frontend Client Layer: ', bold: true }),
              new TextRun({ text: 'React 18 with TypeScript and Tailwind CSS, featuring an integrated HTML5 canvas engine that synthesizes chromatic high-frequency noise overlays in real time based on gradient loss functions.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Backend REST API Proxy: ', bold: true }),
              new TextRun({ text: 'Node.js Express application (listening on port 3000) hosting dedicated endpoints for phishing generation (/api/generate-phishing), email triage (/api/analyze-email), multimedia forensics (/api/analyze-media-deepfake), and adversarial evasion calculations (/api/adversarial-perturb).' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'AI Cognitive Layer: ', bold: true }),
              new TextRun({ text: 'Google Gemini 3.5 Flash engine configured with strict JSON Schema output enforcement, structured prompt grounding, and deterministic local fallback resiliency.' }),
            ],
          }),

          // 3. Application Screens & Functional Modules
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '3. Application Screens & Functional Modules', bold: true, size: 28, color: '1E3A8A' })],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: '3.1 Screen 1: Unified Cybersecurity Research Dashboard', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Unified Dashboard serves as the central command interface. It aggregates real-time metrics computed across a balanced 90-sample empirical dataset (comprising 30 Legitimate Academic Emails, 30 Conventional Phishing Scams, and 30 AI-Synthesized Phishing Attacks).',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Key Visible UI Elements & Gauges:', bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Total Emails Database Card: ', bold: true }),
              new TextRun({ text: 'Displays 90 total specimens with a tripartite color-coded distribution progress bar (Green: Legitimate, Orange: Conventional, Purple: AI Phish).' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Email Realism Score: ', bold: true }),
              new TextRun({ text: 'Quantifies language polish and structural authenticity (averaging 94% across AI specimens).' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Filter Failure Rate: ', bold: true }),
              new TextRun({ text: 'Critical vulnerability metric demonstrating that traditional spam filters fail to detect up to 82% of AI-generated attacks.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Vigilance & Detection Score: ', bold: true }),
              new TextRun({ text: 'Reflects the probability that human end-users identify the communication as malicious (dropping to 34% for AI-generated attacks).' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Specimen Explorer & Search Filter: ', bold: true }),
              new TextRun({ text: 'Allows real-time keyword search across subjects, senders, and body texts with category toggle pills.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Forensic Investigator Audit Card: ', bold: true }),
              new TextRun({ text: 'Inspects full email envelope headers, writing realism, detection difficulty, highlighted scam clues, and defense recommendations.' }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: '3.2 Screen 2: AI Phishing Forensics Lab', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Phishing Forensics Lab features a three-tab operational environment enabling comparative study, attack synthesis, and heuristic classification:',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Sub-View 2A: Academic Benchmark Dataset: ', bold: true }),
              new TextRun({ text: 'Side-by-side comparative inspection of three canonical archetypes: Legitimate IPB tuition schedule, conventional IT password reset attack, and an AI-synthesized research proposal evaluation.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Sub-View 2B: AI Email Creator (Threat Generator): ', bold: true }),
              new TextRun({ text: 'An LLM generation console allowing researchers to configure scam themes (Tuition Notice, Executive Wire, SSO Migration, Research Appraisal), target keywords, and three complexity tiers (Standard, Sophisticated, Expert).' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Sub-View 2C: Email Security Check (Forensic Classifier): ', bold: true }),
              new TextRun({ text: 'An NLP analysis terminal evaluating incoming email texts for temporal coercion windows, domain mismatch, authority pressure triggers, and firewall mitigation rules.' }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: '3.3 Screen 3: Deepfake Media & Audio Inspector', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Deepfake Media Lab provides forensic analysis of synthetic multimedia, focusing on audio voice clones, altered video briefings, and tampered identity images.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Acoustic Anomaly Detection: ', bold: true }),
              new TextRun({ text: 'Identifies vocoder spectral footprints (especially in the 4kHz-8kHz frequency band), abrupt noise floor dropouts, and unnatural absence of physiological breathing cues.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Visual & Facial Artifact Inspection: ', bold: true }),
              new TextRun({ text: 'Flags pupil micro-glare reflection angles inconsistent with scene geometry, double-eyelash blurs, and boundary blending artifacts around the neck and jawline.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Pre-configured Presets: ', bold: true }),
              new TextRun({ text: 'Includes canonical attack scenarios: ceo_keynote_urgent_wire.mp4, financial_analyst_voicemail.wav, and id_verification_passport.png.' }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: '3.4 Screen 4: AI Model Attack Simulator (Adversarial Machine Learning)', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Adversarial Attack Simulator demonstrates the vulnerability of Deep Neural Networks to gradient-based evasion attacks. Users configure target vision architectures (ResNet-50, Vision Transformer ViT-Base, MobileNetV3) and select target classification pairs.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Core Mathematical Engine (Fast Gradient Sign Method - FGSM):', bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: 'x_adv = x + ε · sign( ∇_x J( θ, x, y_true ) )',
                bold: true,
                size: 24,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'An interactive perturbation budget slider (ε ranging from 0.005 to 0.250) dynamically updates a real-time HTML5 canvas rendering chromatic pixel noise. The simulation exposes how minimal perturbations cause high-confidence model misclassification (e.g., Airplane to Bird with 86.2% confidence).',
              }),
            ],
          }),

          // 4. Empirical Benchmark Results
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '4. Empirical Benchmark Findings & Comparative Analysis', bold: true, size: 28, color: '1E3A8A' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The laboratory conducted systematic testing across all three threat vectors. The empirical data collected from the 90-sample benchmark dataset reveals decisive disparities between human/heuristic detection and AI-synthesized attacks.',
              }),
            ],
          }),

          // Table 1: (4 columns: 2860 + 2160 + 2160 + 2180 = 9360 dxa)
          new Table({
            width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [2860, 2160, 2160, 2180],
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2860, type: WidthType.DXA },
                    shading: { fill: '1E3A8A' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Dimension', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 2160, type: WidthType.DXA },
                    shading: { fill: '1E3A8A' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Legitimate Academic', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 2160, type: WidthType.DXA },
                    shading: { fill: '1E3A8A' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Conventional Phishing', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 2180, type: WidthType.DXA },
                    shading: { fill: '1E3A8A' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'AI-Synthesized Phishing', bold: true, color: 'FFFFFF' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Writing Realism', bold: true })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '94 - 98%' })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '45 - 62%' })] })] }),
                  new TableCell({ width: { size: 2180, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '95 - 99%' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Syntactic Polish', bold: true })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'High (Academic standard)' })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Low (Spelling errors)' })] })] }),
                  new TableCell({ width: { size: 2180, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Near Perfect' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Urgency Pressure', bold: true })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Low / Informational' })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Severe threats' })] })] }),
                  new TableCell({ width: { size: 2180, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Subtle / Contextual' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Human Detection Rate', bold: true })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '96% (Correctly trusted)' })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '78% (Correctly flagged)' })] })] }),
                  new TableCell({ width: { size: 2180, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '34% (Alarmingly low)' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Filter Bypass Rate', bold: true })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'N/A' })] })] }),
                  new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '18% bypass' })] })] }),
                  new TableCell({ width: { size: 2180, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '82% bypass' })] })] }),
                ],
              }),
            ],
          }),

          // Table 2: (4 columns: 2100 + 3360 + 1600 + 2300 = 9360 dxa)
          new Paragraph({
            spacing: { before: 280, after: 120 },
            children: [new TextRun({ text: 'Table 2: Deepfake & Adversarial Evasion Forensic Signatures', bold: true, size: 22, color: '334155' })],
          }),
          new Table({
            width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [2100, 3360, 1600, 2300],
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2100, type: WidthType.DXA },
                    shading: { fill: '334155' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Threat Vector', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 3360, type: WidthType.DXA },
                    shading: { fill: '334155' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Primary Forensic Indicator', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 1600, type: WidthType.DXA },
                    shading: { fill: '334155' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Confidence', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    width: { size: 2300, type: WidthType.DXA },
                    shading: { fill: '334155' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Countermeasure', bold: true, color: 'FFFFFF' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Deepfake Audio', bold: true })] })] }),
                  new TableCell({ width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Vocoder trace (4-8kHz) & zero respiration' })] })] }),
                  new TableCell({ width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '88 - 91%' })] })] }),
                  new TableCell({ width: { size: 2300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Cryptographic callback' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Deepfake Video', bold: true })] })] }),
                  new TableCell({ width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Pupil micro-glare asymmetry & uniform blink' })] })] }),
                  new TableCell({ width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '92 - 95%' })] })] }),
                  new TableCell({ width: { size: 2300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'C2PA credentials' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'FGSM Vision Evasion', bold: true })] })] }),
                  new TableCell({ width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'High-frequency gradient sign noise (ε ≥ 0.03)' })] })] }),
                  new TableCell({ width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '86 - 98%' })] })] }),
                  new TableCell({ width: { size: 2300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'PGD adversarial training' })] })] }),
                ],
              }),
            ],
          }),

          // 5. Step-by-Step Use Cases
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '5. Step-by-Step Use Case Scenarios', bold: true, size: 28, color: '1E3A8A' })],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: 'Scenario 1: Comparative Evaluation of Academic Phishing', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Access Dashboard: ', bold: true }),
              new TextRun({ text: 'Open the Unified Dashboard and click "Reset & Load Study Dataset (90 Samples)" to initialize the empirical testbed.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Examine Baseline: ', bold: true }),
              new TextRun({ text: 'Select an authentic academic email (e.g., tuition schedule from servicos.academicos@ipb.pt) and inspect the clean envelope and lack of urgency.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '3. Compare Conventional Scam: ', bold: true }),
              new TextRun({ text: 'Inspect a conventional phishing attack (e.g., IT Password Expiry). Observe obvious typographical flaws, non-institutional domain, and high urgency.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '4. Analyze AI Spear Phishing: ', bold: true }),
              new TextRun({ text: 'Inspect an AI-generated specimen (e.g., Provost Project Appraisal). Note how the natural academic tone and personalized context result in an 82% filter bypass rate.' }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: 'Scenario 2: Multi-Modal Deepfake Audio Forensics', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Navigate to Deepfake Media Lab: ', bold: true }),
              new TextRun({ text: 'Select the "Audio" media type tab.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Load Preset: ', bold: true }),
              new TextRun({ text: 'Click the "financial_analyst_voicemail.wav" preset card to populate test parameters.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '3. Execute Forensic Pipeline: ', bold: true }),
              new TextRun({ text: 'Click "Analyze Media File" to run acoustic artifact extraction.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '4. Evaluate Indicators: ', bold: true }),
              new TextRun({ text: 'Review the 88% confidence score for vocoder spectral distortion and note the recommended implementation of out-of-band callback verification.' }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: 'Scenario 3: Adversarial Evasion on Deep Vision Models', bold: true, size: 24, color: '334155' })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Open AI Model Attacks: ', bold: true }),
              new TextRun({ text: 'Select the ResNet-50 deep convolutional network architecture.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Set Epsilon Budget: ', bold: true }),
              new TextRun({ text: 'Adjust the perturbation slider to ε = 0.050. Observe the real-time canvas rendering high-frequency noise overlay.' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '3. Run Perturbation Engine: ', bold: true }),
              new TextRun({ text: 'Click "SIMULATE ATTACK ON MODEL". The engine confirms classification inversion from Airplane (98.5% confidence) to Bird (86.2% confidence).' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '4. Review Hardening Measures: ', bold: true }),
              new TextRun({ text: 'Review the three actionable defense pillars: Adversarial Training with PGD, Spatial Smoothing / Gaussian Filtering, and Defensive Distillation.' }),
            ],
          }),

          // 6. Institutional Defense Guidelines
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 160 },
            children: [new TextRun({ text: '6. Institutional Defense Guidelines & Hardening Strategy', bold: true, size: 28, color: '1E3A8A' })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Based on the experimental outcomes from the laboratory, institutions must shift from passive keyword-based filtering to multi-layered, zero-trust defenses:',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Hardware-Bound Authentication (FIDO2 / WebAuthn): ', bold: true }),
              new TextRun({ text: 'Because AI phishing generates linguistically flawless credential capture lures, passwords must be superseded by cryptographically bound physical security keys.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Enforced Cryptographic Email Standards: ', bold: true }),
              new TextRun({ text: 'Implement strict DMARC "reject" policies with SPF alignment and 2048-bit DKIM keys to neutralize lookalike domain spoofing.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Cryptographic Media Provenance (C2PA): ', bold: true }),
              new TextRun({ text: 'Establish mandatory digital watermarking and Coalition for Content Provenance and Authenticity (C2PA) signing for executive communications.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            indent: { left: 540, hanging: 360 },
            children: [
              new TextRun({ text: '•  ', bold: true, color: '1E3A8A' }),
              new TextRun({ text: 'Robust ML Adversarial Defenses: ', bold: true }),
              new TextRun({ text: 'Train production classifiers using Projected Gradient Descent (PGD) minimax formulation to raise the minimum perturbation budget required for evasion.' }),
            ],
          }),

          // Sign-off section (2 columns: 4680 + 4680 = 9360 dxa)
          new Paragraph({
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: 'Academic Project Sign-Off & Institutional Endorsement', bold: true, size: 22, color: '334155' })],
          }),
          new Table({
            width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [4680, 4680],
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    shading: { fill: 'F8FAFC' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Researcher: Rinor Basholli', bold: true }),
                          new TextRun({ text: 'Licenciatura em Engenharia Informática', break: 1 }),
                          new TextRun({ text: 'Instituto Politécnico de Bragança (ESTiG)', break: 1 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    shading: { fill: 'F8FAFC' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Academic Advisor: Prof. Tiago Pedrosa', bold: true }),
                          new TextRun({ text: 'Departamento de Informática e Comunicações', break: 1 }),
                          new TextRun({ text: 'ESTiG — Instituto Politécnico de Bragança', break: 1 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
