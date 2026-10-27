/* ============================================================
   Reconnaissance du clavier à partir d'une frappe.
   La touche physique (event.code) ne dépend pas de la disposition ; le
   caractère obtenu (event.key) en dépend. Quelques touches suffisent donc
   à distinguer AZERTY français, AZERTY belge et QWERTY, sans rien demander.
   ============================================================ */
'use strict';

/* touche physique → { caractère obtenu sans Maj : disposition } */
const LAYOUT_PROBES = {
  Digit8: { '_': 'azerty', '!': 'be', '8': 'qwerty' },
  Digit6: { '-': 'azerty', '§': 'be', '6': 'qwerty' },
  Equal: { '-': 'be' },
  Slash: { '!': 'azerty', '=': 'be', '/': 'qwerty' },
};

/** Disposition révélée par cette frappe, ou null si elle ne permet pas de conclure
 *  (Maj, AltGr, Verr Maj : les chiffres sortent à la place des signes). */
function detectLayout(e) {
  if (!e || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return null;
  try {
    if (e.getModifierState && (e.getModifierState('CapsLock') || e.getModifierState('AltGraph'))) return null;
  } catch (err) { /* ignoré */ }
  const p = LAYOUT_PROBES[e.code];
  return (p && Object.prototype.hasOwnProperty.call(p, e.key)) ? p[e.key] : null;
}
