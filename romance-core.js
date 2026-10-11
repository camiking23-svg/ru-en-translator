// ---- Shared helpers for the Spanish, Italian and Portuguese grammar fixes ----
// Text is split into words and the bits between them, so a fix can change one word
// and leave spacing and punctuation exactly as Google wrote them.

const LET = "A-Za-zÀ-ÖØ-öø-ÿ";
const WORD_RE = new RegExp("([" + LET + "]+)");
const CLAUSE_BREAK = /[.,!?¿¡;:…—–()«»"“”\n]/;

function matchCase(src, out) {
  if (!src || !out) return out;
  if (src.length > 1 && src === src.toUpperCase() && src !== src.toLowerCase()) return out.toUpperCase();
  return src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

function tokens(s) {
  const T = s.split(WORD_RE);              // even = separators, odd = words
  const n = (T.length - 1) / 2;
  const tk = {
    T, n,
    W: i => (i >= 0 && i < n ? T[2 * i + 1] : ""),
    low: i => (i >= 0 && i < n ? T[2 * i + 1].toLowerCase() : ""),
    before: i => T[2 * i], after: i => T[2 * i + 2],
    changed: new Set(),
    set(i, w) { if (T[2 * i + 1] !== w) { T[2 * i + 1] = matchCase(T[2 * i + 1], w); this.changed.add(i); } },
    setRaw(i, w) { T[2 * i + 1] = w; this.changed.add(i); },
    setAfter(i, sep) { T[2 * i + 2] = sep; },
    remove(i) { T[2 * i + 1] = ""; T[2 * i] = T[2 * i].replace(/\s+$/, ""); },   // drop a word and the space before it
    breakBefore: i => i === 0 || CLAUSE_BREAK.test(T[2 * i]),
    text: () => T.join(""),
  };
  return tk;
}

// sentences, keeping their end punctuation as separate pieces (odd indexes)
const sentenceSplit = s => s.split(/([.!?…]+[»”")]*\s*|\n+)/);
const isQuestionAt = (parts, si) => /\?/.test(parts[si + 1] || "") || /¿/.test(parts[si] || "");

// Walk adjectives / participles after a "to be" verb and fix their agreement.
// opts: { fem(word) → feminine form, stop: Set, skip: Set, stopRe: RegExp }
function agreeChain(tk, start, fem, opts) {
  let k = start, did = false;
  while (k < tk.n) {
    if (k !== start && tk.breakBefore(k)) break;
    const w = tk.low(k);
    if (!tk.W(k)) { k++; continue; }                                   // a word removed earlier
    if (!did && opts.skipPair && opts.skipPair[w] === tk.low(k + 1)) { k += 2; continue; }   // "un poco", "un po'"
    if (!did && opts.skip.has(w)) { k++; continue; }
    if (did) {
      if (opts.and.has(w) && !tk.breakBefore(k)) { k++; did = false; continue; }
      break;
    }
    if (opts.stop.has(w) || (opts.stopRe && opts.stopRe.test(w)) || (/^[A-ZÀ-Ý]/.test(tk.W(k)) && k !== 0) || !/^[a-zà-ÿ]+$/i.test(tk.W(k))) break;
    const f = fem(tk.W(k));
    if (f !== tk.W(k)) tk.setRaw(k, matchCase(tk.W(k), f.toLowerCase()));
    did = true;
    if (opts.copulaParticiple && opts.copulaParticiple.test(tk.low(k))) did = false;   // "sono stata brava", "he estado cansada"
    k++;
  }
}

module.exports = { WORD_RE, CLAUSE_BREAK, matchCase, tokens, sentenceSplit, isQuestionAt, agreeChain };
