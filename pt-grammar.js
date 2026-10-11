// ---- Portuguese fixes applied to Google's English → Portuguese output (Brazilian Portuguese) ----
// 1. você (casual) / o senhor · a senhora (formal). In Brazil both take the same verb form, so the
//    formal switch changes the pronoun (picking senhor or senhora from Talking to), its contractions
//    (de você → do senhor, para você → para a senhora), te → lhe, teu → seu, and casual commands
//    (Olha → Olhe, Me diz → Me diga). "You all" is vocês and is left alone.
// 2. Talking to a woman: Você está pronta?, A senhora está cansada?, Bem-vinda
// 3. Female speaker: Estou cansada, Sou americana, Obrigada, Encantada
const { tokens, sentenceSplit, agreeChain, matchCase } = require("./romance-core.js");

// contractions of a preposition with o/a: de + o senhor → do senhor
const CONTRACT = { de: ["do", "da"], em: ["no", "na"], a: ["ao", "à"], por: ["pelo", "pela"] };
const UNCONTRACT = { do: "de", da: "de", no: "em", na: "em", ao: "a", "à": "a", pelo: "por", pela: "por" };

// casual command → formal command
const IMP = { olha: "olhe", fala: "fale", escuta: "escute", espera: "espere", desculpa: "desculpe", vem: "venha", faz: "faça",
  diz: "diga", senta: "sente", liga: "ligue", chama: "chame", pega: "pegue", deixa: "deixe", toma: "tome", traz: "traga",
  volta: "volte", entra: "entre", sobe: "suba", desce: "desça", abre: "abra", fecha: "feche", come: "coma", bebe: "beba",
  ajuda: "ajude", cuida: "cuide", avisa: "avise", espera_: "espere", acalma: "acalme", calma: "calma", relaxa: "relaxe",
  vai: "vá", continua: "continue", experimenta: "experimente", prova: "prove", manda: "mande", fica: "fique", segue: "siga",
  pensa: "pense", lembra: "lembre", esquece: "esqueça", passa: "passe", corre: "corra", anda: "ande", sai: "saia", põe: "ponha",
  confia: "confie", perdoa: "perdoe", aproveita: "aproveite", descansa: "descanse" };
delete IMP.espera_;
const IMP_BACK = Object.fromEntries(Object.entries(IMP).filter(([a, b]) => a !== b && !["vá", "saia", "ponha"].includes(b)).map(([a, b]) => [b, a]));
const CLIT = new Set(["me", "nos", "se", "te", "lhe", "o", "a"]);

const FEM_SAME = new Set(["melhor", "pior", "maior", "menor", "superior", "inferior", "interior", "exterior", "anterior", "posterior"]);
function feminine(w) {
  const lw = w.toLowerCase();
  let out = lw;
  if (lw === "bom") out = "boa";
  else if (lw === "mau") out = "má";
  else if (/ão$/.test(lw)) out = lw.slice(0, -2) + "ã";                                  // alemão → alemã
  else if (/o$/.test(lw)) out = lw.slice(0, -1) + "a";                                  // cansado → cansada
  else if (/or$/.test(lw) && !FEM_SAME.has(lw)) out = lw + "a";                          // trabalhador → trabalhadora
  else if (/ês$/.test(lw)) out = lw.slice(0, -2) + "esa";                                // inglês → inglesa
  else if (/eu$/.test(lw)) out = lw.slice(0, -2) + "eia";                                // europeu → europeia
  return matchCase(w, out);
}
const CHAIN = {
  skip: new Set(["muito", "tão", "bem", "meio", "super", "bastante", "já", "ainda", "sempre", "nunca", "não", "também", "mais",
    "menos", "realmente", "totalmente", "completamente", "demais", "pouco", "um"]),
  skipPair: { um: "pouco" },
  stop: new Set(["em", "no", "na", "nos", "nas", "de", "do", "da", "dos", "das", "a", "ao", "à", "com", "por", "pelo", "pela",
    "para", "pra", "o", "os", "as", "uma", "que", "como", "aqui", "ali", "lá", "aí", "mal", "eu", "você", "ele", "ela", "me",
    "te", "se", "lhe", "meu", "minha", "seu", "sua", "isso", "isto"]),
  stopRe: /(ando|endo|indo)$|^\d/,
  and: new Set(["e", "ou", "mas"]),
  copulaParticiple: /^(estado|sido|ficado)$/,
};
CHAIN.skip.delete("um");
const fixChain = (tk, start, fem) => agreeChain(tk, start, fem ? feminine : w => w, CHAIN);

const COPULA = new Set(["está", "é", "estava", "era", "estará", "será", "estaria", "seria", "ficou", "fica", "parece", "foi",
  "esteve", "sente", "ficará", "ficaria", "tem"]);

function setFormality(text, mode, l) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const q = /\?/.test(parts[si + 1] || "");
    const tk = tokens(sent);
    const n = tk.n;
    const inQ = k => { if (!q) return false; for (let j = k + 1; j < n; j++) if (tk.breakBefore(j)) return false; return true; };
    const subj = [];                                       // where "you" now sits, for the Talking-to agreement
    const art = l === "f" ? "a" : "o", sen = l === "f" ? "senhora" : "senhor";
    if (mode === "v") {
      let hadYou = false;
      for (let k = 0; k < n; k++) {
        const w = tk.low(k), prev = tk.low(k - 1);
        if (w === "você" || w === "tu") {
          hadYou = true;
          if (CONTRACT[prev] && !tk.breakBefore(k)) { tk.set(k - 1, CONTRACT[prev][l === "f" ? 1 : 0]); tk.set(k, sen); }
          else tk.set(k, art + " " + sen);
          subj.push(k); continue;
        }
        if (w === "contigo") { tk.set(k, "com " + art + " " + sen); continue; }
        if (w === "ti" && ["para", "a", "de", "por", "sem", "sobre", "entre"].includes(prev)) {
          if (CONTRACT[prev]) { tk.set(k - 1, CONTRACT[prev][l === "f" ? 1 : 0]); tk.set(k, sen); } else tk.set(k, art + " " + sen);
          continue;
        }
        const poss = { teu: "seu", tua: "sua", teus: "seus", tuas: "suas" }[w];
        if (poss) { tk.set(k, poss); continue; }
        if (w === "te" && tk.after(k) !== "-") { tk.set(k, "lhe"); continue; }
        // commands at the start: Olha → Olhe, Me diz → Me diga, Se acalma → Se acalme
        if (tk.breakBefore(k) && !inQ(k)) {
          let j = k;
          while (CLIT.has(tk.low(j)) && j < n - 1 && !["o", "a"].includes(tk.low(j))) j++;
          const v = tk.low(j);
          if (IMP[v] && (j === k || !tk.breakBefore(j))) { tk.set(j, IMP[v]); k = j; continue; }
        }
        if (k === 0 && w === "oi") tk.set(k, "olá");
        if (w === "tchau") tk.set(k, "até logo");
      }
      void hadYou;
    } else {
      let hadSenhor = false;
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (!["senhor", "senhora"].includes(w) || /^[A-ZÀ-Ý]/.test(tk.W(k + 1))) continue;
        const prev = tk.low(k - 1);
        const blank = i => { tk.T[2 * i + 1] = ""; tk.T[2 * i] = ""; };
        // "o senhor" / "a senhora" → "você";  "do senhor" → "de você", "ao senhor" → "a você"
        const rep = ["o", "a"].includes(prev) ? "você" : UNCONTRACT[prev] ? UNCONTRACT[prev] + " você" : null;
        if (!rep || tk.breakBefore(k)) continue;
        hadSenhor = true;
        tk.setRaw(k - 1, matchCase(tk.W(k - 1), rep));
        blank(k);
        subj.push(k - 1);
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (w === "lhe" && hadSenhor) tk.set(k, "te");
        if (tk.breakBefore(k) && IMP_BACK[w] && !inQ(k)) tk.set(k, IMP_BACK[w]);
      }
    }
    // Talking to: você está pronto → pronta
    if (mode === "t") for (let k = 0; k < n; k++) if (tk.low(k) === "você" && !subj.includes(k)) subj.push(k);
    for (const k of subj) {
      let j = k + 1;
      while (j < n && !tk.W(j)) j++;
      while (["não", "se", "já", "ainda", "também", "sempre", "nunca"].includes(tk.low(j))) j++;
      if (COPULA.has(tk.low(j))) {
        let s = j + 1;
        if (tk.low(j) === "tem" && tk.low(s) === "estado") s++; else if (tk.low(j) === "tem") continue;
        fixChain(tk, s, l === "f");
      }
    }
    if (l === "f") for (let k = 0; k < n; k++) if (tk.low(k) === "vindo" && tk.low(k - 1) === "bem" && tk.after(k - 1) === "-") tk.set(k, "vinda");
    return tk.text().replace(/ {2,}/g, " ").replace(/(^|[.!?]\s+)([a-zà-ú])/g, (_, a, c) => a + c.toUpperCase());
  }).join("");
}

// ---------- female speaker ----------
const COP_EU = new Set(["estou", "sou", "fiquei", "estive", "estarei", "serei", "fico"]);
const COP_EU_NEEDS_EU = new Set(["estava", "era", "estaria", "seria", "fui"]);
function makeFemale(text) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const tk = tokens(sent);
    for (let k = 0; k < tk.n; k++) {
      const w = tk.low(k);
      if (w === "obrigado") { tk.set(k, "obrigada"); continue; }                 // the speaker's own thanks
      let start = -1;
      if (COP_EU.has(w)) start = k + 1;
      else if (COP_EU_NEEDS_EU.has(w) && (tk.low(k - 1) === "eu" || (tk.low(k - 1) === "não" && tk.low(k - 2) === "eu"))) start = k + 1;
      else if (w === "sinto" && tk.low(k - 1) === "me") start = k + 1;
      else if (w === "tenho" && tk.low(k + 1) === "estado") start = k + 2;
      else if (["encantado", "cansado", "contente"].includes(w) && tk.breakBefore(k) && (k + 1 >= tk.n || tk.breakBefore(k + 1) || ["de", "em", "por"].includes(tk.low(k + 1)))) start = k;
      if (start >= 0 && start < tk.n && (start === k || !tk.breakBefore(start))) fixChain(tk, start, true);
    }
    return tk.text();
  }).join("");
}

module.exports = { setFormality, makeFemale, feminine };
