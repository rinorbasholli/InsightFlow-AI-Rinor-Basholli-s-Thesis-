export interface AcademicExample {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  category: 'legitimate' | 'conventional_phishing' | 'ai_phishing';
  tag: string;
  explanation: string;
}

export interface AnalyzedSample {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  category: 'legitimate' | 'conventional_phishing' | 'ai_phishing';
  tag: string;
  realismScore: number;
  detectabilityScore: number;
  languagePolish: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  detectionDifficulty: 'Very Easy' | 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  indicators: string[];
  mitigationRules: string[];
  detailedAnalysis: string;
}

export const ACADEMIC_DATASET: AcademicExample[] = [
  {
    id: 'ex-1',
    sender: 'it-alerts@corporatesecure-portal.com',
    recipient: 'student@unibraganca.pt',
    subject: 'CRITICAL: Mandatory password change required immediately',
    body: `Dear employee,

We have detected suspicious log-in activities from a foreign IP address on your workstation. Consequently, we have placed a temporary block on critical outgoing access.

To restore unimpeded operations, you MUST reset your portal passwords within the next 4 hours using the secure link below:

http://portal-access-verification-secure.com/reset/unibraganca

Failure to comply with these security restrictions will lead to indefinite suspension of all system assets.

Best respects,
IT Infrastructure & CyberOps Team`,
    category: 'conventional_phishing',
    tag: 'Urgent Threat Bait',
    explanation: 'Contains high-urgency language, a generic greeting, severe threats for non-compliance, and links to an outer non-official domain.'
  },
  {
    id: 'ex-2',
    sender: 'academic-office@ipb.pt',
    recipient: 'student@ipb.pt',
    subject: 'Academic Registration and Tuition Fee Schedule 2026/2027',
    body: `Dear Student,

Please be informed that the renewed schedule for the upcoming academic registration period is now officially published on your student portal. 

You can review all individual payment plans, installment deadlines, and course enrolment requirements by authentication via standard institutional credentials at https://portal.ipb.pt. Only access official channels ending with the .pt extension.

Do not hesitate to reach out if you have further inquiries at the Student Office desk.

With kind regards,
Office of Academic Affairs
Instituto Politécnico de Bragança`,
    category: 'legitimate',
    tag: 'Institutional Official',
    explanation: 'Uses formal structural Portuguese university naming, directs to legitimate https protocol on the official .ipb.pt subdomain, and maintains calm academic tone.'
  },
  {
    id: 'ex-3',
    sender: 'provost-office-internal@ipb-portal-support.com',
    recipient: 'academic-board@ipb.pt',
    subject: 'Refined proposal evaluation feedback: Cybersecurity Projects 2025/2026',
    body: `Hello Board Members,

Following our recent committee session concerning the Applied Cybersecurity Project proposals on "Cybersecurity Risks of Artificial Intelligence", several revisions have been recommended to align your methodology with the standard curriculum of the Computer Science Degree (EI).

We have compiled the formal appraisal comments and reviewer annotations directly into a centralized document. Could you please take a moment to carefully review the feedback spreadsheet hosted on our secure file share?

Please review the document within this afternoon:
http://ipb-portal-support.com/shares/proposals/evaluation_sheet.xlsx

Thank you for your continued dedication to advancing the research curriculum.

Warm regards,
Academic Projects Committee Office`,
    category: 'ai_phishing',
    tag: 'Highly Tailored AI Phish',
    explanation: 'An extremely tailored social engineering sample. No grammatical errors, highly contextual regarding current research, but uses a non-institutional domain (ipb-portal-support.com).'
  }
];

// Helper to generate 90 distinct academic samples (30 Legitimate, 30 Conventional, 30 AI Phishing)
export function generate90Samples(): AnalyzedSample[] {
  const samples: AnalyzedSample[] = [];

  // Helper lists for variations
  const names = ['Pedro', 'Marta', 'Alexandre', 'Inês', 'João', 'Sofia', 'Ricardo', 'Carolina', 'Tiago', 'Diana', 'Bruno', 'Filipa', 'José', 'Rita', 'Carlos', 'Beatriz'];
  const subjectsLegitimate = [
    'Academic Registration Approval Review',
    'Official Grades Published: Applied Cybersecurity II',
    'SASIPB Scholarship Eligibility Notice',
    'Library Book Return Due Date Notice',
    'Symposium Call for Papers 2026: Advances in Secure ML',
    'Master Thesis Defense Scheduled - Room B104',
    'Moodle System Routine Virtual Maintenance Patch',
    'ESTiG Lab Access Protocol & Keycard Pickup',
    'Tuition Fee Payment Schedule Installation Confirmation',
    'Research Internship Placement: Porto Cybersecurity Lab',
  ];

  const subjectsConventional = [
    '!! IMPORTANT: URGENT ACCOUNT PASSWORD RESET REQUEST !!',
    'WIRE RECOVERY TRANSFER TO DEPOSIT TUITION DIRECTLY',
    'System Alert: Your ESTiG credential workspace has been locked',
    'Package Delivery Pending: Submit administrative dispatch fee',
    'Your supervisor sent you an emergency direct message',
    'SECURITY BREACH WARNING: Reset password to prevent suspension',
    'Claim €250 Bragança Municipality Student Aid Voucher NOW',
    'CRITICAL IPB PORTAL RESTRICTION ALERT - RESOLVE IMMEDIATELY',
  ];

  const subjectsAIPhishing = [
    'Critical Peer Review Feedback: Defensive Distillation in CNNs',
    'Refined Horizon Europe Grant Contribution Proposal',
    'Formal Evaluation Report: Applied Cybersecurity Project Proposal Revisions',
    'Estig Identity Integration: Action Required on Moodle SSO System',
    'Supervisor Annotation: Methodological adjustments for adversarial simulation',
    'Collaborative Research Sheet: Cybersecurity Risks of AI Projects',
    'Revised Lecture Presentation: Federated Learning Under Spoof Trials',
    'Official Invitation: IPB Cybersecurity Assessment Advisory Board',
  ];

  const genericIndicators = {
    legitimate: [
      'Official HTTPS endpoint matching ipb.pt subdomain',
      'Sign-off aligns perfectly with registered ESTiG staff profiles',
      'Neutral academic language lacking artificial urgency elements',
      'Lack of third-party domains or external link masks'
    ],
    conventional: [
      'Aggressive capitalisation and coercive threat bait',
      'Sender domain mismatch (ipb-academic-pt.xyz vs ipb.pt)',
      'Direct link points to external unauthenticated site',
      'Grammar mistakes and generic greeting template structure'
    ],
    ai: [
      'Contextually spotless tailored spear-phishing scenario without linguistic flaws',
      'Sender utilizes realistic domain spoof mapping (e.g., ipb-portal-support.com)',
      'Subtle urgency framework leveraging academic time deadlines',
      'Request links to external mock cloud spreadsheet file share'
    ]
  };

  const genericMitigations = {
    legitimate: [
      'Maintain standard local password storage hygiene',
      'Mark sender as trusted IPB partner address',
      'Standard communication protocol - no administrative changes required'
    ],
    conventional: [
      'Blacklist the domain prefix on central spam defense relays',
      'Implement multi-factor authentication (MFA) to nullify phished credential',
      'Deploy string-distance filters targeting domain-spoof attempts (e.g. looking for ipb-support)'
    ],
    ai: [
      'Increase student cyber-hygiene training regarding hyper-personalized academic context requests',
      'Enforce DKIM, SPF and DMARC alignment checks strictly at ESTiG exchange servers',
      'Deploy behavioral heuristic filters tracking newly registered external support domain templates'
    ]
  };

  // Convert the 3 manual seed samples as the first 3 items but mapped as analyzed
  samples.push({
    id: 's-ex-1',
    sender: 'it-alerts@corporatesecure-portal.com',
    recipient: 'student@unibraganca.pt',
    subject: 'CRITICAL: Mandatory password change required immediately',
    body: ACADEMIC_DATASET[0].body,
    category: 'conventional_phishing',
    tag: 'Urgent Threat Bait',
    realismScore: 48,
    detectabilityScore: 88,
    languagePolish: 55,
    urgencyLevel: 'high',
    detectionDifficulty: 'Easy',
    indicators: genericIndicators.conventional,
    mitigationRules: genericMitigations.conventional,
    detailedAnalysis: 'This conventional phishing email represents classic coercive engineering. It utilizes high-threat urgency parameters, extreme temporal pressure (4 hours), and masks a malignant external security resetting address. Detection difficulty remains low due to apparent spelling and formatting indicators.'
  });

  samples.push({
    id: 's-ex-2',
    sender: 'academic-office@ipb.pt',
    recipient: 'student@ipb.pt',
    subject: 'Academic Registration and Tuition Fee Schedule 2026/2027',
    body: ACADEMIC_DATASET[1].body,
    category: 'legitimate',
    tag: 'Institutional Official',
    realismScore: 98,
    detectabilityScore: 22,
    languagePolish: 99,
    urgencyLevel: 'low',
    detectionDifficulty: 'Moderate',
    indicators: genericIndicators.legitimate,
    mitigationRules: genericMitigations.legitimate,
    detailedAnalysis: 'Legitimate administrative update from the Polytechic of Bragança (IPB). It contains direct pathways to official, secure subdomains within standard networks, uses professional nomenclature, and does not pose immediate coercive blocks.'
  });

  samples.push({
    id: 's-ex-3',
    sender: 'provost-office-internal@ipb-portal-support.com',
    recipient: 'academic-board@ipb.pt',
    subject: 'Refined proposal evaluation feedback: Cybersecurity Projects 2025/2026',
    body: ACADEMIC_DATASET[2].body,
    category: 'ai_phishing',
    tag: 'Highly Tailored AI Phish',
    realismScore: 89,
    detectabilityScore: 54,
    languagePolish: 96,
    urgencyLevel: 'medium',
    detectionDifficulty: 'Difficult',
    indicators: genericIndicators.ai,
    mitigationRules: genericMitigations.ai,
    detailedAnalysis: 'A state-of-the-art AI spear-phishing email targeting academics. Synthesized without semantic errors, it matches ongoing institutional syllabus topics perfectly. Only the external host domain domain registration reveals its illicit nature. Conventional filters fails to spot this.'
  });

  // Loop to generate sample items up to 90
  const totalWanted = 90;
  let counter = 4;

  while (samples.length < totalWanted) {
    const categorySelectorIndex = samples.length % 3;
    let category: 'legitimate' | 'conventional_phishing' | 'ai_phishing';
    
    if (categorySelectorIndex === 0) category = 'legitimate';
    else if (categorySelectorIndex === 1) category = 'conventional_phishing';
    else category = 'ai_phishing';

    const currentId = `s-${counter}`;
    const studentId = Math.floor(Math.random() * 20000) + 45000;
    const staffName = names[counter % names.length];
    const receiverName = names[(counter + 3) % names.length];

    if (category === 'legitimate') {
      const subj = subjectsLegitimate[counter % subjectsLegitimate.length] + ` (Ref #${currentId.toUpperCase()})`;
      const domains = ['@ipb.pt', '@estig.ipb.pt', '@sas.ipb.pt'];
      const domain = domains[counter % domains.length];
      const sendAddress = `${staffName.toLowerCase()}-office${domain}`;
      const realism = Math.floor(Math.random() * 10) + 90; // 90-99
      const detectability = Math.floor(Math.random() * 20) + 15; // 15-35
      const polish = Math.floor(Math.random() * 8) + 93; // 93-100
      
      samples.push({
        id: currentId,
        sender: sendAddress,
        recipient: `student_${studentId}@ipb.pt`,
        subject: subj,
        body: `Prezado(a) Aluno(a) ${receiverName},

Escrevemos para informar que o processo de submissão documental referente ao tópico "${subj}" foi integralmente validado pelos serviços integrados.

Poderá consultar a ata técnica e o andamento geral na plataforma institucional correspondente. Por motivos de segurança, use sempre o portal autenticado via protocolo seguro: http://autenticacao.ipb.pt. 

Qualquer esclarecimento complementar deverá ser endereçado fisicamente no balcão de atendimento da ESTiG Bragança.

Com os melhores cumprimentos,
Dra. ${staffName} Santos
Serviço Académico Local IPB`,
        category: 'legitimate',
        tag: `Official Grant Case`,
        realismScore: realism,
        detectabilityScore: detectability,
        languagePolish: polish,
        urgencyLevel: counter % 5 === 0 ? 'medium' : 'low',
        detectionDifficulty: 'Moderate',
        indicators: [
          'Certified IPB academic MX record match',
          'Professional Portuguese phrasing devoid of coercion pressure',
          'Secure authentication link redirecting to internal domain (ipb.pt)'
        ],
        mitigationRules: [
          'Ensure the sender address matches legitimate staff logs',
          'Observe normal corporate policy regarding grading and SAS scholarship disbursements'
        ],
        detailedAnalysis: `Legitimate communication containing real academic registration indexes. Formatted under standard ESTiG-compliant nomenclature without any anomalous redirects or malicious pressure triggers.`
      });
    } else if (category === 'conventional_phishing') {
      const subj = subjectsConventional[counter % subjectsConventional.length];
      const mockDomains = ['ipb-portugal-finance-operations.com', 'secure-estig-recovery.net', 'ipb-tuitions-online.pt.tk', 'alert-system-ipb.info'];
      const mockDomain = mockDomains[counter % mockDomains.length];
      const sendAddress = `admin-alert@${mockDomain}`;
      const realism = Math.floor(Math.random() * 25) + 30; // 30-55
      const detectability = Math.floor(Math.random() * 15) + 80; // 80-95
      const polish = Math.floor(Math.random() * 25) + 40; // 40-65

      samples.push({
        id: currentId,
        sender: sendAddress,
        recipient: `student_${studentId}@ipb.pt`,
        subject: subj,
        body: `ATTENTION IPB STUDENT ID ${studentId} !!!

Your overall moodle login has detected anomalous access and was PERMANENTLY SUSPENDED.
To reinstate critical access, you must IMMEDIATELY purchase a €50 academic security activation code or update credit card information within 1 hour:

http://moodle-login-restore-${currentId}.support-office-portugal.com/renew

If you do NOT update credential details, the system will delete all academic curriculum metrics!

IPB Support Team, Bragança`,
        category: 'conventional_phishing',
        tag: 'Urgent Threat Bait',
        realismScore: realism,
        detectabilityScore: detectability,
        languagePolish: polish,
        urgencyLevel: 'high',
        detectionDifficulty: 'Easy',
        indicators: [
          `Obvious non-pt spelling grammar mismatch (${mockDomain})`,
          'Blatant coercive language regarding credential deletion and immediate credit card payment',
          'Direct link using external, non-secured protocol masking'
        ],
        mitigationRules: [
          'Filter out external emails containing high-severity threat hooks targeting the student portal',
          'Incorporate user reports inside active firewall routers'
        ],
        detailedAnalysis: `A conventional phishing template. High grammatical inaccuracies, extremely aggressive blackmail tactics, and suspicious outer links flag this sample clearly on automated rule-based filters.`
      });
    } else {
      const subj = subjectsAIPhishing[counter % subjectsAIPhishing.length];
      const smartDomains = ['ipb-portal-support.com', 'academic-peer-evaluation.org', 'springer-cyber-peer.com', 'horizon-eu-review.net'];
      const smartDomain = smartDomains[counter % smartDomains.length];
      const sendAddress = `${staffName.toLowerCase()}.${names[(counter + 1) % names.length].toLowerCase()}@${smartDomain}`;
      const realism = Math.floor(Math.random() * 15) + 81; // 81-96
      const detectability = Math.floor(Math.random() * 20) + 40; // 40-60
      const polish = Math.floor(Math.random() * 10) + 90; // 90-100

      samples.push({
        id: currentId,
        sender: sendAddress,
        recipient: `student_${studentId}@ipb.pt`,
        subject: subj,
        body: `Dear Researcher,

I hope this message finds you well. As discussed in our previous session regarding the Applied Cybersecurity research projects, the examination committee has finished reading your draft regarding "${subj}".

Several critical structural feedback loops have been noted. In order to complete your academic grade review on time for the Bragança graduation council list, please review the annotated spreadsheet hosted on our secure research share:

http://${smartDomain}/proposals/sharing/${currentId}_review_file.xlsx

Please submit the corrected methodology framework within 12 hours.

Best regards,
Dr. ${staffName} ${names[(counter + 2) % names.length]}
Academic Evaluation & Peer Review Group`,
        category: 'ai_phishing',
        tag: 'Highly Tailored AI Phish',
        realismScore: realism,
        detectabilityScore: detectability,
        languagePolish: polish,
        urgencyLevel: 'medium',
        detectionDifficulty: 'Difficult',
        indicators: [
          'No grammar anomalies or obvious syntax elements',
          'Extremely precise terminology mapping local Bragança cybersecurity course context',
          `Anomalous communication origin domain (${smartDomain} which is unregistered on central registrar boards)`
        ],
        mitigationRules: [
          'Enforce strict domain authentication records verification',
          'Utilize advanced semantic AI-based content filters targeting anomalous link request patterns'
        ],
        detailedAnalysis: `A sophisticated generative AI spear-phishing attack. By referencing specific curricula, Dr. names, and local timelines, it bypasses basic lexical spam rules. Only proactive DNS alignment checks can intercept this.`
      });
    }

    counter++;
  }

  return samples;
}
