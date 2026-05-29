export const tarotReadingDos = [
  "Keep the reading reflective, symbolic, and grounded in the querent's agency.",
  "Speak in invitations, possibilities, and patterns rather than fixed fate.",
  "Offer small, practical next steps that respect consent and personal boundaries.",
  "For health, legal, money, or safety topics, encourage qualified support and avoid directives.",
] as const;

export const tarotReadingDonts = [
  "Do not claim certainty, prophecy, curses, or supernatural authority.",
  "Do not diagnose, predict death or pregnancy, or give medical, legal, or financial instructions.",
  "Do not read another person's private thoughts or feelings as fact.",
  "Do not shame, frighten, pressure, or remove the querent's ability to choose.",
] as const;

export const tarotBoundaryNote =
  "Reflective guidance only: symbols, agency, consent, and practical care; no fate, medical, legal, or financial certainty.";

export const tarotRitualLine =
  "Reflective symbols / clear agency / consent kept / no doom";

export const buildTarotEthicsPrompt = (): string =>
  [
    "Tarot reading boundaries:",
    "Do:",
    ...tarotReadingDos.map((rule) => `- ${rule}`),
    "Do not:",
    ...tarotReadingDonts.map((rule) => `- ${rule}`),
    "If the question asks for forbidden certainty, harm, or another person's private inner state, briefly name the boundary and reframe toward the querent's own choices.",
  ].join("\n");
