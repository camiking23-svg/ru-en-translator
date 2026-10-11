// ---- Italian fixes applied to Google's English → Italian output ----
// 1. tu (casual) / Lei (formal): formal "you" in Italian is Lei with the he/she verb form —
//    hai → ha, sei → è, ti chiami → si chiama, dimmi → mi dica, scusa → scusi, tuo → Suo.
//    "You all" is voi (plural) and is left alone.
// 2. Talking to a woman: sei pronta?, è stata gentile, benvenuta
// 3. Female speaker: sono stanca, sono andata, mi sono svegliata
const { tokens, sentenceSplit, agreeChain, matchCase } = require("./romance-core.js");

// ---------- a small conjugator: tu and Lei forms of everyday verbs ----------
const VERBS = ("essere avere andare fare dire venire volere potere dovere sapere stare dare uscire tenere bere rimanere " +
  "sedere scegliere salire piacere morire tradurre " +
  "parlare mangiare cercare pagare studiare lavorare abitare amare aspettare ascoltare guardare chiamare comprare " +
  "pensare trovare provare portare lasciare entrare tornare arrivare restare passare cominciare iniziare finire:isc " +
  "capire:isc preferire:isc pulire:isc spedire:isc costruire:isc dormire sentire partire aprire offrire seguire servire " +
  "prendere leggere scrivere vedere vendere credere chiedere rispondere mettere perdere vivere conoscere correre " +
  "chiudere decidere ricevere ripetere spendere spegnere accendere piangere ridere sorridere vincere muovere " +
  "scusare preoccupare calmare rilassare alzare sbrigare fermare divertire:x accomodare ricordare dimenticare " +
  "giocare spiegare mandare inviare usare cucinare viaggiare visitare camminare guidare riposare cantare ballare " +
  "lavare cambiare toccare mostrare presentare invitare incontrare prenotare ordinare telefonare aiutare " +
  "sposare innamorare trasferire:isc sentire annoiare svegliare vestire laureare chiamare piacere sbagliare " +
  "girare continuare controllare accompagnare raccontare insegnare imparare regalare augurare ringraziare " +
  "salutare baciare abbracciare dimagrire:isc ingrassare arrabbiare offendere stancare godere permettere").split(/\s+/).filter(Boolean);

const IRR = {
  essere: { pres: ["sei", "è"], imp: ["eri", "era"], fut: ["sarai", "sarà"], cond: ["saresti", "sarebbe"], impT: "sii", impU: "sia" },
  avere: { pres: ["hai", "ha"], fut: ["avrai", "avrà"], cond: ["avresti", "avrebbe"], impT: "abbi", impU: "abbia" },
  andare: { pres: ["vai", "va"], fut: ["andrai", "andrà"], cond: ["andresti", "andrebbe"], impT: "vai", impU: "vada" },
  fare: { pres: ["fai", "fa"], imp: ["facevi", "faceva"], fut: ["farai", "farà"], cond: ["faresti", "farebbe"], impT: "fai", impU: "faccia", mono: "fa" },
  dire: { pres: ["dici", "dice"], imp: ["dicevi", "diceva"], fut: ["dirai", "dirà"], cond: ["diresti", "direbbe"], impT: "di'", impU: "dica", mono: "di" },
  venire: { pres: ["vieni", "viene"], fut: ["verrai", "verrà"], cond: ["verresti", "verrebbe"], impT: "vieni", impU: "venga" },
  volere: { pres: ["vuoi", "vuole"], fut: ["vorrai", "vorrà"], cond: ["vorresti", "vorrebbe"] },
  potere: { pres: ["puoi", "può"], fut: ["potrai", "potrà"], cond: ["potresti", "potrebbe"] },
  dovere: { pres: ["devi", "deve"], fut: ["dovrai", "dovrà"], cond: ["dovresti", "dovrebbe"] },
  sapere: { pres: ["sai", "sa"], fut: ["saprai", "saprà"], cond: ["sapresti", "saprebbe"], impT: "sappi", impU: "sappia" },
  stare: { pres: ["stai", "sta"], fut: ["starai", "starà"], cond: ["staresti", "starebbe"], impT: "stai", impU: "stia", mono: "sta" },
  dare: { pres: ["dai", "dà"], fut: ["darai", "darà"], cond: ["daresti", "darebbe"], impT: "dai", impU: "dia", mono: "da" },
  uscire: { pres: ["esci", "esce"], impT: "esci", impU: "esca" },
  tenere: { pres: ["tieni", "tiene"], fut: ["terrai", "terrà"], cond: ["terresti", "terrebbe"], impT: "tieni", impU: "tenga" },
  bere: { pres: ["bevi", "beve"], imp: ["bevevi", "beveva"], fut: ["berrai", "berrà"], cond: ["berresti", "berrebbe"], impT: "bevi", impU: "beva" },
  rimanere: { pres: ["rimani", "rimane"], fut: ["rimarrai", "rimarrà"], cond: ["rimarresti", "rimarrebbe"], impT: "rimani", impU: "rimanga" },
  sedere: { pres: ["siedi", "siede"], impT: "siedi", impU: "sieda" },
  scegliere: { pres: ["scegli", "sceglie"], impT: "scegli", impU: "scelga" },
  salire: { pres: ["sali", "sale"], impT: "sali", impU: "salga" },
  piacere: { pres: ["piaci", "piace"], impU: "piaccia" },
  morire: { pres: ["muori", "muore"], impU: "muoia" },
  tradurre: { pres: ["traduci", "traduce"], imp: ["traducevi", "traduceva"], fut: ["tradurrai", "tradurrà"], cond: ["tradurresti", "tradurrebbe"], impT: "traduci", impU: "traduca" },
};

function conjugate(spec) {
  const [inf, flag] = spec.split(":");
  const end = inf.slice(-3), stem = inf.slice(0, -3);
  const f = {};
  if (end === "are") {
    const hard = /[cg]$/.test(stem) ? stem + "h" : stem;                 // cerchi, paghi
    const soft = /[cg]i$/.test(stem) ? stem.slice(0, -1) : stem;          // mangerai, comincerai
    const tuStem = /i$/.test(stem) ? stem.slice(0, -1) : hard;            // studi, mangi
    f.pres = [tuStem + "i", stem + "a"];
    f.imp = [stem + "avi", stem + "ava"];
    const fs = (/[cg]$/.test(stem) ? hard : soft) + "er";
    f.fut = [fs + "ai", fs + "à"];
    f.cond = [fs + "esti", fs + "ebbe"];
    f.impT = stem + "a"; f.impU = tuStem + "i";
  } else {
    const ere = end === "ere", isc = flag === "isc";
    const ps = isc ? stem + "isc" : stem;
    const hardE = ere && /[cg]$/.test(stem) && /(scere|ncere|gere|cere)$/.test(inf);
    f.pres = [ps + "i", ps + "e"];
    f.imp = [stem + (ere ? "evi" : "ivi"), stem + (ere ? "eva" : "iva")];
    const fs = ere ? stem + "er" : stem + "ir";
    f.fut = [fs + "ai", fs + "à"];
    f.cond = [fs + "esti", fs + "ebbe"];
    f.impT = ps + "i";
    f.impU = (hardE ? (isc ? ps : stem.replace(/c$/, "c").replace(/g$/, "g")) : ps) + "a";
    if (/scere$/.test(inf)) f.impU = stem + "a";                          // conosca
  }
  Object.assign(f, IRR[inf] || {});
  f.inf = inf;
  return f;
}

const TU2LEI = {}, LEI2TU = {}, IMP_T2U = {}, IMP_U2T = {}, MONO = {}, INFS = new Set();
for (const spec of VERBS) {
  const f = conjugate(spec);
  INFS.add(f.inf);
  for (const t of ["pres", "imp", "fut", "cond"]) {
    const [tu, lei] = f[t];
    if (!TU2LEI[tu]) TU2LEI[tu] = lei;
    if (!LEI2TU[lei]) LEI2TU[lei] = tu;
  }
  const impT = f.impT.replace("'", "");
  if (!IMP_T2U[impT]) IMP_T2U[impT] = f.impU;
  if (!IMP_U2T[f.impU]) IMP_U2T[f.impU] = f.impT;
  if (f.mono) MONO[f.mono] = f.impU;
}
// nouns that look like tu-verbs
const NOUNY = new Set(["conti", "porti", "giri", "parti", "passi", "segni", "sogni", "resti", "lavori", "viaggi", "pensi",
  "regali", "cambi", "conosci", "studi", "tocchi", "baci", "abbracci", "piatti", "giochi", "inviti", "ordini", "saluti"]);
const DET = new Set(["i", "gli", "le", "dei", "degli", "delle", "miei", "tuoi", "suoi", "nostri", "vostri", "questi", "quelli",
  "molti", "pochi", "due", "tre", "quattro", "alcuni", "altri", "tanti", "tutti", "ai", "agli", "alle", "nei", "negli",
  "nelle", "sui", "sugli", "coi", "dai", "dagli", "dalle", "per", "di", "e", "mie", "tue", "sue"]);

const IMP_START = new Set(["scusa", "senti", "guarda", "aspetta", "vieni", "dimmi", "fai", "va", "vai", "prendi", "prova",
  "ascolta", "dai", "smetti", "lascia", "chiama", "entra", "siediti", "calmati", "alzati", "sbrigati", "fermati",
  "rilassati", "divertiti", "accomodati", "fammi", "dammi", "scusami", "aspettami", "chiamami", "ricordati", "stai", "abbi",
  "sii", "pensa", "immagina", "mangia", "bevi", "torna", "continua", "gira", "segui", "apri", "chiudi", "metti", "scrivi",
  "leggi", "aiutami", "mandami", "dicci", "perdonami", "ascoltami", "guardami"]);
const UDIMP_START = new Set(["scusi", "senta", "guardi", "aspetti", "venga", "faccia", "vada", "prenda", "provi", "ascolti",
  "smetta", "lasci", "chiami", "entri", "stia", "abbia", "sia", "pensi", "immagini", "mangi", "beva", "torni", "continui",
  "giri", "segua", "apra", "chiuda", "metta", "scriva", "legga", "dica"]);

const CLITICS = ["mi", "ti", "ci", "vi", "si", "lo", "la", "li", "le", "gli", "ne"];
const INDIRECT = /^(dir|dic|dic|dà|da|dai|dia|scriv|mand|invi|chied|spieg|piac|telefon|mostr|port|offr|raccont|present|regal|augur|insegn|rispond|ricord|consigli|prest|serv|fa|fac)/;

// dimmi → [di, [mi]], siediti → [siedi, [ti]], fammelo → [fa, [me, lo]]
function splitEnclitic(w, known) {
  for (const b of ["", ...CLITICS]) for (const a of CLITICS) {
    let suf = a + b;
    const aa = b ? a.replace(/i$/, "e") : a;                              // me lo, te lo (melo → mi + lo)
    for (const s of b ? [aa + b] : [suf]) {
      if (!(w.length > s.length && w.endsWith(s))) continue;
      let base = w.slice(0, -s.length);
      if (known[base]) return [base, b ? [a, b] : [a]];
      // dimmi, fammi, dacci: doubled consonant after a one-syllable command
      if (base.endsWith(s[0]) && MONO[base.slice(0, -1)]) return [base.slice(0, -1), b ? [a, b] : [a], true];
    }
  }
  return null;
}

// ---------- agreement ----------
const FEM_WORD = { dottore: "dottoressa", studente: "studentessa", professore: "professoressa", signore: "signora" };
function feminine(w) {
  const lw = w.toLowerCase();
  let out = lw;
  if (FEM_WORD[lw]) out = FEM_WORD[lw];
  else if (/tore$/.test(lw)) out = lw.slice(0, -4) + "trice";                 // lavoratore → lavoratrice
  else if (/o$/.test(lw)) out = lw.slice(0, -1) + "a";                        // stanco → stanca
  return matchCase(w, out);
}
const CHAIN = {
  skip: new Set(["molto", "così", "troppo", "davvero", "proprio", "abbastanza", "già", "ancora", "sempre", "mai", "non", "più",
    "tanto", "super", "veramente", "parecchio", "piuttosto", "un", "poco", "assolutamente", "completamente", "tutto", "anche"]),
  skipPair: { un: "po" },
  stop: new Set(["a", "ad", "in", "di", "da", "con", "su", "per", "tra", "fra", "al", "allo", "alla", "ai", "agli", "alle", "del",
    "dello", "della", "dei", "degli", "delle", "nel", "nello", "nella", "sul", "sulla", "il", "lo", "la", "i", "gli", "le", "uno",
    "una", "che", "come", "qui", "qua", "lì", "là", "bene", "male", "io", "tu", "lui", "lei", "noi", "voi", "loro", "mi", "ti",
    "si", "ci", "vi", "ne", "questo", "quello", "mio", "tuo", "suo", "solo", "d", "l"]),
  stopRe: /(ando|endo)$|^\d/,
  and: new Set(["e", "ed", "o", "ma"]),
  copulaParticiple: /^(stato|stata|diventato|diventata|rimasto|rimasta)$/,
};
CHAIN.skip.delete("un");
const fixChain = (tk, start, fem) => agreeChain(tk, start, fem ? feminine : w => w, CHAIN);

const COP_TU = new Set(["sei", "eri", "sarai", "saresti", "senti"]);
const COP_LEI = new Set(["è", "era", "sarà", "sarebbe", "sente", "sia"]);
const PREP = new Set(["per", "con", "a", "di", "da", "su", "tra", "fra", "senza", "come", "che", "verso", "contro", "dopo", "prima"]);

function setFormality(text, mode, l) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const q = /\?/.test(parts[si + 1] || "");
    const tk = tokens(sent);
    const n = tk.n;
    const orig = Array.from({ length: n }, (_, i) => tk.low(i));
    const isNoun = k => DET.has(orig[k - 1]) || (NOUNY.has(orig[k]) && /^(il|la|i|gli|le|un|una|dei|delle)$/.test(orig[k - 1] || ""));
    const youVerbs = [];
    // a command can't be in the question part: "Scusa, dov'è il bagno?" — Scusa is its own clause
    const inQ = k => { if (!q) return false; for (let j = k + 1; j < n; j++) if (tk.breakBefore(j)) return false; return true; };
    const blank = i => { tk.T[2 * i + 1] = ""; tk.T[2 * i] = ""; };
    const nextVerb = k => { let j = k + 1; while (j < n && !tk.breakBefore(j) && (CLITICS.includes(tk.low(j)) || tk.low(j) === "non")) j++; return j < n && !tk.breakBefore(j) ? j : -1; };
    if (mode === "v") {
      const clauseHasTu = k => { for (let j = k; j >= 0; j--) { if (TU2LEI[orig[j]] && !isNoun(j)) return true; if (tk.breakBefore(j)) break; }
        for (let j = k + 1; j < n && !tk.breakBefore(j); j++) if (TU2LEI[orig[j]] && !isNoun(j)) return true; return false; };
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (!tk.W(k)) continue;
        // non ti preoccupare / non preoccuparti → non si preoccupi
        if (w === "non" && tk.breakBefore(k) && !inQ(k)) {
          let j = k + 1, cl = [];
          while (CLITICS.includes(tk.low(j))) { cl.push(j); j++; }
          const v = tk.low(j);
          const enc = v.match(/^(.+r)(ti|mi|lo|la|ci|si)$/);
          if (INFS.has(v) || (enc && INFS.has(enc[1] + "e"))) {
            const inf = INFS.has(v) ? v : enc[1] + "e";
            const impU = conjugate(VERBS.find(s => s.split(":")[0] === inf)).impU;
            const proc = cl.map(c => (tk.low(c) === "ti" ? "si" : tk.low(c)));
            if (enc) proc.push(enc[2] === "ti" ? "si" : enc[2]);
            for (const c of cl) tk.remove(c);
            tk.set(j, proc.concat([impU]).join(" "));
            youVerbs.push(j); k = j; continue;
          }
        }
        if (w === "ti") {
          const j = nextVerb(k);
          const v = j >= 0 ? orig[j] : "";
          if (TU2LEI[v] && !isNoun(j)) tk.set(k, "si");
          else tk.setRaw(k, matchCase(tk.W(k), INDIRECT.test(v) ? "Le" : "La"));
          continue;
        }
        if (w === "tu" && !(tk.before(k) === "-")) { tk.setRaw(k, matchCase(tk.W(k), "Lei")); continue; }
        if (w === "te" && PREP.has(tk.low(k - 1))) { tk.setRaw(k, "Lei"); continue; }
        if (w === "te" && CLITICS.includes(tk.low(k + 1)) === false && ["lo", "la", "li", "le", "ne"].includes(tk.low(k + 1))) { tk.set(k, "glie"); continue; }
        const poss = { tuo: "Suo", tua: "Sua", tuoi: "Suoi", tue: "Sue" }[w];
        if (poss) { tk.setRaw(k, poss); continue; }
        // commands with pronouns attached: dimmi → mi dica, siediti → si sieda, scusami → mi scusi
        const sp = splitEnclitic(w, IMP_T2U);
        if (sp && tk.breakBefore(k) && !inQ(k) && !TU2LEI[w]) {
          const formal = MONO[sp[0]] && sp[2] ? MONO[sp[0]] : IMP_T2U[sp[0]];
          const cl = sp[1].map(c => (c === "ti" ? "si" : c));
          tk.set(k, cl.join(" ") + " " + formal);
          youVerbs.push(k); continue;
        }
        // infinitive + ti: reflexive if the clause is about "you" (vuoi sederti → vuole sedersi), else an object (vederti → vederLa)
        const inf = w.match(/^(.+r)(ti)$/);
        if (inf && INFS.has(inf[1] + "e")) {
          const refl = clauseHasTu(k);
          tk.setRaw(k, matchCase(tk.W(k), inf[1] + (refl ? "si" : INDIRECT.test(inf[1]) ? "Le" : "La")));
          continue;
        }
        if (tk.breakBefore(k) && IMP_START.has(w) && !inQ(k)) {
          const f = IMP_T2U[w];
          if (f) { tk.set(k, f); youVerbs.push(k); continue; }
        }
        if (TU2LEI[w] && !isNoun(k) && tk.before(k) !== "'") { tk.set(k, TU2LEI[w]); youVerbs.push(k); continue; }
        if (w === "ciao" && tk.breakBefore(k)) tk.set(k, k === 0 ? "buongiorno" : "arrivederci");
      }
    } else {
      // Lei → tu: only where Lei (capital L) is really there, plus polite commands and Suo/Sua with a capital
      let hadLei = false;
      for (let k = 0; k < n; k++) {
        if (tk.W(k) !== "Lei" && !(tk.W(k) === "lei" && false)) continue;
        hadLei = true;
        const prev = tk.low(k - 1);
        if (PREP.has(prev)) { tk.setRaw(k, "te"); continue; }
        const j = nextVerb(k);
        if (j >= 0 && LEI2TU[tk.low(j)]) {
          tk.set(j, LEI2TU[tk.low(j)]); youVerbs.push(j);
          for (let x = k + 1; x < j; x++) if (tk.low(x) === "si") tk.set(x, "ti");
          tk.set(k, "tu"); continue;
        }
        if (k > 0 && LEI2TU[tk.low(k - 1)] && !tk.breakBefore(k)) {
          tk.set(k - 1, LEI2TU[tk.low(k - 1)]); youVerbs.push(k - 1);
          for (let x = k - 2; x >= 0 && CLITICS.includes(tk.low(x)); x--) if (tk.low(x) === "si") tk.set(x, "ti");
          tk.remove(k); continue;
        }
        tk.set(k, "tu");
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (!tk.W(k)) continue;
        // Mi dica → Dimmi, Si sieda → Siediti, Si accomodi → Accomodati, Non si preoccupi → Non preoccuparti
        if (tk.breakBefore(k) || (w === "non" && false)) {
          let j = k, cl = [];
          const neg = w === "non";
          if (neg) j++;
          while (CLITICS.includes(tk.low(j)) && !tk.breakBefore(j === k ? -1 : j)) { cl.push(j); j++; }
          const v = tk.low(j);
          if ((cl.length || neg) && IMP_U2T[v] && !inQ(k)) {
            const clit = cl.map(c => (tk.low(c) === "si" ? "ti" : tk.low(c)));
            let out;
            if (neg) {
              const inf = VERBS.map(s => conjugate(s)).find(f => f.impU === v);
              out = inf ? inf.inf.replace(/e$/, "") + clit.join("") : null;
            } else {
              const tuImp = IMP_U2T[v].replace("'", "");
              const mono = Object.keys(MONO).find(m => MONO[m] === v);
              out = mono && clit.length ? mono + clit[0][0] + clit.join("") : tuImp + clit.join("");
            }
            if (out) {
              if (neg) { for (const c of cl) blank(c); tk.T[2 * j] = " "; tk.setRaw(j, out); }
              else { tk.setRaw(k, matchCase(tk.W(k), out)); for (const c of cl.slice(1)) blank(c); blank(j); }
              k = j; continue;
            }
          }
          if (!cl.length && !neg && UDIMP_START.has(w) && !inQ(k)) { tk.set(k, IMP_U2T[w].replace("'", "")); continue; }
        }
        if (tk.W(k) === "Suo" || tk.W(k) === "Sua" || tk.W(k) === "Suoi" || tk.W(k) === "Sue") {
          if (!tk.breakBefore(k) || hadLei) tk.setRaw(k, matchCase(tk.breakBefore(k) ? tk.W(k) : "x", { suo: "tuo", sua: "tua", suoi: "tuoi", sue: "tue" }[w]));
        }
        if (w === "arrivederla") tk.set(k, "ciao");
      }
    }
    if (mode === "t") for (let k = 0; k < n; k++) if (COP_TU.has(tk.low(k)) && !youVerbs.includes(k) && !(tk.low(k) === "senti" && tk.low(k - 1) !== "ti")) youVerbs.push(k);
    for (const k of youVerbs) {
      const v = tk.low(k).split(" ").pop();
      if (COP_TU.has(v) || COP_LEI.has(v)) {
        let s = k + 1;
        if (["lei", "tu"].includes(tk.low(s))) s++;
        fixChain(tk, s, l === "f");
      }
    }
    if (l === "f") for (let k = 0; k < n; k++) if (tk.low(k) === "benvenuto" && tk.breakBefore(k)) tk.set(k, "benvenuta");
    // "Non si preoccupi" style results put a capital in the right place
    let out = tk.text().replace(/ {2,}/g, " ").replace(/(^|[.!?]\s+)([a-zà-ù])/g, (_, a, c) => a + c.toUpperCase());
    if (mode === "v") out = out.replace(/\b([Dd]ove|[Cc]ome|[Cc]osa|[Qq]uando) è(?![a-zà-ù])/g, (_, w) => w.slice(0, -1) + "'è");   // dove è → dov'è
    return out;
  }).join("");
}

// ---------- female speaker ----------
const COP_IO = new Set(["sono", "ero", "sarò", "sarei", "sia"]);
function makeFemale(text) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const tk = tokens(sent);
    for (let k = 0; k < tk.n; k++) {
      const w = tk.low(k);
      let start = -1;
      if (COP_IO.has(w) && !["ci", "c", "ce", "ne"].includes(tk.low(k - 1)) && (w !== "sia" || tk.low(k - 1) === "io")) start = k + 1;
      else if (w === "sento" && tk.low(k - 1) === "mi") start = k + 1;
      else if (["contento", "felice", "lieto"].includes(w) && tk.breakBefore(k) && ["di", "d"].includes(tk.low(k + 1))) start = k;
      if (start >= 0 && start < tk.n && (start === k || !tk.breakBefore(start))) fixChain(tk, start, true);
    }
    return tk.text();
  }).join("");
}

module.exports = { setFormality, makeFemale, feminine, conjugate, TU2LEI, LEI2TU, IMP_T2U, IMP_U2T };
