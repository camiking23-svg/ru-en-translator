// ---- Spanish fixes applied to Google's English → Spanish output (Latin American Spanish) ----
// 1. tú (casual) / usted (formal): pronouns, verbs in every common tense, commands
//    (dime → dígame, siéntate → siéntese, no te preocupes → no se preocupe) and possessives (tu → su).
//    "You all" is always ustedes in Latin America, so plurals are left alone.
// 2. Talking to a woman: ¿Estás lista?, ¿Está usted cansada?, Bienvenida
// 3. Female speaker: Estoy cansada, Soy americana, Encantada
const { tokens, sentenceSplit, isQuestionAt, agreeChain, matchCase } = require("./romance-core.js");

const unaccent = s => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

// ---------- a small conjugator: the tú and usted forms of ~200 everyday verbs ----------
// flags: ie / ue / i = stem change (piensas, puedes, pides), u = jugar, zc = conozca, acc = envías, gu = sigas
const VERBS = ("hablar estar ser ir tener hacer decir poder querer venir poner salir saber dar ver haber traer oír " +
  "sentar:ie sentir:ie dormir:ue pedir:i seguir:i servir:i repetir:i vestir:i elegir:i reír:i sonreír:i conseguir:i " +
  "pensar:ie empezar:ie comenzar:ie cerrar:ie despertar:ie entender:ie perder:ie preferir:ie mentir:ie divertir:ie " +
  "recomendar:ie calentar:ie sugerir:ie nevar:ie querer encontrar:ue volver:ue recordar:ue contar:ue costar:ue " +
  "mostrar:ue probar:ue acostar:ue soñar:ue morir:ue mover:ue llover:ue devolver:ue almorzar:ue jugar:u " +
  "conocer:zc parecer:zc ofrecer:zc agradecer:zc merecer:zc nacer:zc crecer:zc conducir:zc traducir:zc producir:zc " +
  "enviar:acc continuar:acc confiar:acc " +
  "comer beber vivir leer creer caer escribir abrir recibir subir decidir compartir describir existir permitir " +
  "aprender comprender correr vender responder deber prometer meter romper toser coser temer " +
  "llamar llegar pagar buscar tocar sacar explicar practicar indicar equivocar colocar acercar " +
  "cambiar trabajar estudiar comprar mirar escuchar esperar tomar dejar pasar llevar necesitar ayudar usar " +
  "preguntar contestar cocinar cenar desayunar bailar cantar viajar visitar caminar manejar descansar " +
  "olvidar terminar entrar regresar quedar preocupar calmar relajar levantar bañar duchar lavar llamar " +
  "gustar encantar importar molestar interesar faltar disculpar perdonar avisar cuidar intentar tratar " +
  "mandar regalar enseñar invitar celebrar disfrutar arreglar preparar limpiar cortar firmar " +
  "escoger:g recoger:g proteger:g " +
  "apagar entregar jugar:u negar:ie navegar pegar cargar " +
  "alcanzar cruzar organizar utilizar realizar " +
  "construir:y destruir:y incluir:y huir:y " +
  "acompañar apurar animar aceptar acostumbrar alquilar reservar cancelar confirmar " +
  "fijar enojar casar callar sentar:ie mudar portar ganar lograr quitar volar:ue colgar:ue " +
  "acordar:ue despedir:i acostumbrar quejar sorprender ocurrir suceder " +
  "atender:ie extrañar amar odiar saludar besar abrazar:z").split(/\s+/).filter(Boolean);

const IRR = {
  ser: { pres: ["eres", "es"], pret: ["fuiste", "fue"], imp: ["eras", "era"], subj: ["seas", "sea"], impT: "sé" },
  estar: { pres: ["estás", "está"], pret: ["estuviste", "estuvo"], subj: ["estés", "esté"] },
  ir: { pres: ["vas", "va"], pret: ["fuiste", "fue"], imp: ["ibas", "iba"], subj: ["vayas", "vaya"], impT: "ve" },
  tener: { pres: ["tienes", "tiene"], pret: ["tuviste", "tuvo"], subj: ["tengas", "tenga"], impT: "ten", fut: "tendr" },
  hacer: { pret: ["hiciste", "hizo"], subj: ["hagas", "haga"], impT: "haz", fut: "har" },
  decir: { pres: ["dices", "dice"], pret: ["dijiste", "dijo"], subj: ["digas", "diga"], impT: "di", fut: "dir" },
  poder: { pres: ["puedes", "puede"], pret: ["pudiste", "pudo"], subj: ["puedas", "pueda"], fut: "podr" },
  querer: { pres: ["quieres", "quiere"], pret: ["quisiste", "quiso"], subj: ["quieras", "quiera"], fut: "querr" },
  venir: { pres: ["vienes", "viene"], pret: ["viniste", "vino"], subj: ["vengas", "venga"], impT: "ven", fut: "vendr" },
  poner: { pret: ["pusiste", "puso"], subj: ["pongas", "ponga"], impT: "pon", fut: "pondr" },
  salir: { subj: ["salgas", "salga"], impT: "sal", fut: "saldr" },
  saber: { pret: ["supiste", "supo"], subj: ["sepas", "sepa"], fut: "sabr" },
  dar: { pres: ["das", "da"], pret: ["diste", "dio"], subj: ["des", "dé"] },
  ver: { pres: ["ves", "ve"], pret: ["viste", "vio"], imp: ["veías", "veía"], subj: ["veas", "vea"] },
  haber: { pres: ["has", "ha"], pret: ["hubiste", "hubo"], subj: ["hayas", "haya"], fut: "habr" },
  traer: { pret: ["trajiste", "trajo"], subj: ["traigas", "traiga"] },
  oír: { pres: ["oyes", "oye"], pret: ["oíste", "oyó"], subj: ["oigas", "oiga"], impT: "oye" },
  caer: { pret: ["caíste", "cayó"], subj: ["caigas", "caiga"] },
  leer: { pret: ["leíste", "leyó"] }, creer: { pret: ["creíste", "creyó"] },
  reír: { pres: ["ríes", "ríe"], pret: ["reíste", "rio"], subj: ["rías", "ría"], impT: "ríe" },
  sonreír: { pres: ["sonríes", "sonríe"], pret: ["sonreíste", "sonrió"], subj: ["sonrías", "sonría"], impT: "sonríe" },
  conducir: { pret: ["condujiste", "condujo"] }, traducir: { pret: ["tradujiste", "tradujo"] }, producir: { pret: ["produjiste", "produjo"] },
  andar: { pret: ["anduviste", "anduvo"] },
};

function stemChange(stem, kind) {
  const from = kind === "ue" ? "o" : kind === "u" ? "u" : "e";
  const to = kind === "ie" ? "ie" : kind === "ue" || kind === "u" ? "ue" : "i";
  const i = stem.lastIndexOf(from);
  return i < 0 ? stem : stem.slice(0, i) + to + stem.slice(i + 1);
}
function conjugate(spec) {
  const [inf, flag] = spec.split(":");
  const base = unaccent(inf);
  const end = base.slice(-2), stem = base.slice(0, -2);
  const ar = end === "ar";
  let sc = flag && ["ie", "ue", "i", "u"].includes(flag) ? stemChange(stem, flag) : stem;   // stem in present / subjunctive
  if (flag === "acc") sc = stem.replace(/([iu])$/, c => (c === "i" ? "í" : "ú"));
  const presStem = flag === "y" ? sc + "y" : sc;
  const f = {};
  f.pres = [presStem + (ar ? "as" : "es"), presStem + (ar ? "a" : "e")];
  // preterite: -ir stem-changers change in the usted form (pidió, durmió, sintió)
  let p3 = stem;
  if (end === "ir" && (flag === "i" || flag === "ie")) p3 = stemChange(stem, "i");
  if (end === "ir" && flag === "ue") p3 = stem.replace(/o([^o]*)$/, "u$1");
  f.pret = [stem + (ar ? "aste" : "iste"), p3 + (ar ? "ó" : flag === "y" ? "yó" : "ió")];
  f.imp = ar ? [stem + "abas", stem + "aba"] : [stem + "ías", stem + "ía"];
  // subjunctive (also the usted command and the negative tú command)
  let ss = sc;
  if (/car$/.test(base)) ss = sc.replace(/c$/, "qu");
  else if (/gar$/.test(base)) ss = sc.replace(/g$/, "gu");
  else if (/zar$/.test(base)) ss = sc.replace(/z$/, "c");
  else if (/guir$/.test(base)) ss = sc.replace(/u$/, "");
  else if (/g[ei]r$/.test(base)) ss = sc.replace(/g$/, "j");
  else if (flag === "zc") ss = sc.replace(/c$/, "zc");
  else if (flag === "y") ss = sc + "y";
  f.subj = [ss + (ar ? "es" : "as"), ss + (ar ? "e" : "a")];
  const ir = IRR[inf] || {};
  const futStem = ir.fut || inf.replace(/í/g, "i").replace(/ír$/, "ir");
  f.fut = [futStem + "ás", futStem + "á"];
  f.cond = [futStem + "ías", futStem + "ía"];
  Object.assign(f, ir);
  f.fut = [futStem + "ás", futStem + "á"]; f.cond = [futStem + "ías", futStem + "ía"];
  f.impT = ir.impT || f.pres[1];                      // tú command: habla, come, ven
  f.impU = f.subj[1];                                 // usted command: hable, coma, venga
  f.inf = inf;
  return f;
}

const TU2UD = {}, UD2TU = {}, IMP_T2U = {}, IMP_U2T = {};
const INFS = new Set();
for (const spec of VERBS) {
  const f = conjugate(spec);
  INFS.add(f.inf);
  for (const t of ["pres", "pret", "imp", "fut", "cond", "subj"]) {
    if (!f[t]) continue;
    const [tu, ud] = f[t];
    if (!TU2UD[tu]) TU2UD[tu] = ud;
    if (!UD2TU[ud]) UD2TU[ud] = tu;
  }
  if (!IMP_T2U[f.impT]) IMP_T2U[f.impT] = f.impU;
  if (!IMP_U2T[f.impU]) IMP_U2T[f.impU] = f.impT;
}
const DET = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "mis", "tus", "sus", "nuestras", "nuestros", "estas",
  "estos", "esas", "esos", "aquellas", "muchas", "muchos", "pocas", "pocos", "dos", "tres", "cuatro", "cinco", "varias", "varios",
  "algunas", "algunos", "otras", "otros", "las", "tantas", "todas", "todos", "de", "del", "con", "sin", "en", "y"]);

// the tú form most often stands alone at the start of a command
const IMP_START = new Set(["mira", "oye", "escucha", "espera", "perdona", "disculpa", "ven", "haz", "pon", "sal", "di", "ten",
  "toma", "deja", "avisa", "cuida", "llama", "prueba", "pasa", "sigue", "vuelve", "entra", "sube", "baja", "abre", "cierra",
  "recuerda", "piensa", "imagina", "cuenta", "dime", "dame", "ayuda", "corre", "come", "bebe", "descansa", "maneja", "camina"]);
const UDIMP_START = new Set(["mire", "oiga", "escuche", "espere", "perdone", "disculpe", "venga", "haga", "ponga", "salga",
  "diga", "tenga", "tome", "deje", "avise", "cuide", "llame", "pruebe", "pase", "siga", "vuelva", "entre", "suba", "baje",
  "abra", "cierre", "recuerde", "piense", "imagine", "cuente", "ayude", "corra", "coma", "beba", "descanse", "maneje", "camine"]);

const CLITICS = ["me", "te", "se", "nos", "lo", "la", "los", "las", "le", "les"];
// verbs where "you" is usually the indirect object (te digo → le digo); otherwise te → lo / la
const INDIRECT = /^(dec|dig|dij|di|d|da|doy|dé|escrib|mand|envi|enví|pregunt|cont|cuent|explic|regal|enseñ|gust|encant|import|molest|interes|falt|pas|pid|ped|mostr|muestr|traig|tra|ofrec|ofrezc|agradezc|agradec|recomiend|recomend|prest|compr|llev|prepar|hac|hag|hic|parec)/;

function splitClitics(w, known) {
  // dímelo → [dí, me, lo]; siéntate → [siénta, te] — only a split whose verb part is a known command counts
  for (const b of ["", ...CLITICS]) for (const a of CLITICS) {
    const suf = a + b;
    if (w.length > suf.length && w.endsWith(suf) && known[unaccent(w.slice(0, -suf.length))]) return [unaccent(w.slice(0, -suf.length)), b ? [a, b] : [a]];
  }
  return null;
}
// put the written accent back when pronouns are added to a command: diga + me → dígame
function accentFor(word) {
  const w = unaccent(word);
  const nuc = [];
  const re = /[aeiouáéíóúü]+/gi; let m;
  while ((m = re.exec(w))) {
    const g = m[0];
    // two strong vowels together are two syllables
    const parts = g.match(/[aeo](?=[aeo])|[^aeo]*[aeo][^aeo]*|[^aeo]+/gi) || [g];
    let pos = m.index;
    for (const p of parts) { nuc.push([pos, p]); pos += p.length; }
  }
  if (nuc.length < 2) return w;
  const [pos, g] = nuc[nuc.length - 2];
  const strong = g.search(/[aeo]/i);
  const at = pos + (strong >= 0 ? strong : g.length - 1);
  const acc = { a: "á", e: "é", i: "í", o: "ó", u: "ú" }[w[at].toLowerCase()];
  return w.slice(0, at) + acc + w.slice(at + 1);
}
function joinCommand(verb, clitics) {
  return (clitics.length ? accentFor(verb) : verb) + clitics.join("");
}

// ---------- agreement ----------
const FEM_SAME = new Set(["mayor", "menor", "mejor", "peor", "superior", "inferior", "exterior", "interior", "anterior", "posterior"]);
function feminine(w) {
  const lw = w.toLowerCase();
  let out = lw;
  if (lw === "español") out = "española";
  else if (/[^aeiu]o$/.test(lw) || /[aeiu]o$/.test(lw)) out = lw.slice(0, -1) + "a";       // cansado → cansada
  else if (/or$/.test(lw) && !FEM_SAME.has(lw)) out = lw + "a";                           // trabajador → trabajadora
  else if (/ón$/.test(lw)) out = lw.slice(0, -2) + "ona";
  else if (/án$/.test(lw)) out = lw.slice(0, -2) + "ana";                                 // alemán → alemana
  else if (/ín$/.test(lw)) out = lw.slice(0, -2) + "ina";
  else if (/és$/.test(lw)) out = lw.slice(0, -2) + "esa";                                 // inglés → inglesa
  return matchCase(w, out);
}
const CHAIN = {
  skip: new Set(["muy", "tan", "bastante", "super", "súper", "re", "demasiado", "algo", "más", "menos", "todavía", "aún", "ya",
    "no", "siempre", "nunca", "también", "tampoco", "realmente", "totalmente", "completamente", "un", "poco", "medio", "bien", "re"]),
  stop: new Set(["en", "a", "de", "con", "por", "para", "al", "del", "sin", "sobre", "el", "la", "los", "las", "una", "unos",
    "unas", "que", "como", "aquí", "allí", "acá", "allá", "mal", "yo", "tú", "usted", "él", "ella", "lo", "le", "se", "me", "te",
    "nos", "muy", "mi", "tu", "su", "este", "esta", "eso", "esto", "uno", "solo"]),
  stopRe: /(ando|iendo|yendo)$|^\d/,
  and: new Set(["y", "e", "o", "pero"]),
  copulaParticiple: /^(estado|estada|sido|quedado)$/,
};
// "un poco cansado": "un poco" is skipped, but "un" before a noun stops it
CHAIN.skip.delete("un");
CHAIN.skipPair = { un: "poco" };

const fixChain = (tk, start, fem) => agreeChain(tk, start, fem ? feminine : w => w, CHAIN);

// ---------- tú ⇄ usted ----------
const COP_TU = new Set(["estás", "eres", "estabas", "eras", "estarás", "serás", "estarías", "serías", "estés", "seas",
  "estuviste", "fuiste", "pareces", "quedaste"]);
const COP_UD = new Set(["está", "es", "estaba", "era", "estará", "será", "estaría", "sería", "esté", "sea", "estuvo", "fue", "parece", "quedó"]);
const PREP = new Set(["con", "para", "a", "de", "por", "sin", "en", "contra", "hacia", "entre", "sobre", "como", "que", "según"]);

function setFormality(text, mode, l) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const q = isQuestionAt(parts, si);
    const tk = tokens(sent);
    const n = tk.n;
    const done = new Set();
    const youVerbs = [];                    // where a "you" verb ended up, for the Talking-to agreement
    const nextVerb = k => { let j = k + 1; while (j < n && !tk.breakBefore(j) && CLITICS.includes(tk.low(j))) j++; return j < n && !tk.breakBefore(j) ? j : -1; };
    const orig = Array.from({ length: n }, (_, i) => tk.low(i));      // the words as Google wrote them
    const isNoun = k => DET.has(orig[k - 1]);
    const inQuestion = k => { for (let j = k; j >= 0; j--) { if (/¿/.test(tk.before(j))) return true; if (/[.!?]/.test(tk.before(j))) break; } return false; };
    if (mode === "v") {
      const clauseHasTu = k => { for (let j = k; j >= 0; j--) { if (TU2UD[orig[j]] && !isNoun(j)) return true; if (tk.breakBefore(j)) break; }
        for (let j = k + 1; j < n && !tk.breakBefore(j); j++) if (TU2UD[orig[j]] && !isNoun(j)) return true; return false; };
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        // object / reflexive te: before a tú verb it's reflexive (te llamas → se llama), otherwise "you" as an object
        if (w === "te") {
          const j = nextVerb(k);
          const v = j >= 0 ? tk.low(j) : "";
          if (TU2UD[v] && !isNoun(j)) tk.set(k, "se");
          else tk.set(k, INDIRECT.test(v) ? "le" : l === "f" ? "la" : "lo");
          done.add(k); continue;
        }
        if (w === "tú") { tk.set(k, "usted"); done.add(k); continue; }
        if (w === "ti") { tk.set(k, "usted"); done.add(k); continue; }
        if (w === "contigo") { tk.set(k, "con usted"); done.add(k); continue; }
        if (w === "tu") { tk.set(k, "su"); continue; }
        if (w === "tus") { tk.set(k, "sus"); continue; }
        const tuyo = { tuyo: "suyo", tuya: "suya", tuyos: "suyos", tuyas: "suyas" }[w];
        if (tuyo) { tk.set(k, tuyo); continue; }
        // commands with pronouns attached: dime → dígame, siéntate → siéntese, cálmate → cálmese
        const sp = splitClitics(w, IMP_T2U);
        if (sp && (tk.breakBefore(k) || tk.low(k - 1) === "y") && !TU2UD[w]) {
          const formal = IMP_T2U[sp[0]];
          tk.set(k, joinCommand(formal, sp[1].map(c => (c === "te" ? "se" : c))));
          done.add(k); youVerbs.push(k); continue;
        }
        // infinitive + te: reflexive if the clause is about "you" (¿quieres sentarte? → ¿quiere sentarse?), else an object
        const inf = w.match(/^(.+(?:ar|er|ir|ír))te$/);
        if (inf && INFS.has(unaccent(inf[1]).replace(/ir$/, "ir")) ) {
          const refl = clauseHasTu(k);
          tk.set(k, inf[1] + (refl ? "se" : INDIRECT.test(inf[1]) ? "le" : l === "f" ? "la" : "lo"));
          continue;
        }
        const ger = w.match(/^(.+(?:ándo|iéndo|yéndo))te$/);
        if (ger) { tk.set(k, ger[1] + (clauseHasTu(k) ? "se" : l === "f" ? "la" : "lo")); continue; }
        // plain command at the start: Mira, Espera, Ven, Perdona
        if (tk.breakBefore(k) && IMP_START.has(w) && !inQuestion(k) && !TU2UD[w]) {
          tk.set(k, IMP_T2U[w] || w); done.add(k); youVerbs.push(k); continue;
        }
        // a tú verb anywhere (estás → está, tienes → tiene, fuiste → fue)
        if (TU2UD[w] && !isNoun(k)) { tk.set(k, TU2UD[w]); done.add(k); youVerbs.push(k); continue; }
      }
    } else {
      // usted → tú, only where "usted" is actually there (plain "está" could be he/she) or for polite commands
      let hadUsted = false;
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (w !== "usted") continue;
        hadUsted = true;
        const prev = tk.low(k - 1);
        if (PREP.has(prev) && prev !== "que" && prev !== "como") {
          if (prev === "con") { tk.set(k - 1, "contigo"); tk.remove(k); } else tk.set(k, "ti");
          continue;
        }
        const j = nextVerb(k);
        if (j >= 0 && UD2TU[tk.low(j)]) {
          tk.set(j, UD2TU[tk.low(j)]); youVerbs.push(j);
          for (let x = k + 1; x < j; x++) if (tk.low(x) === "se") tk.set(x, "te");
          tk.set(k, "tú"); continue;
        }
        // "¿Cómo está usted?" → "¿Cómo estás?"
        let b = k - 1;
        if (b >= 0 && UD2TU[tk.low(b)] && !tk.breakBefore(k)) {
          tk.set(b, UD2TU[tk.low(b)]); youVerbs.push(b);
          for (let x = b - 1; x >= 0 && CLITICS.includes(tk.low(x)); x--) if (tk.low(x) === "se") tk.set(x, "te");
          tk.remove(k); continue;
        }
        tk.set(k, "tú");
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        const sp = splitClitics(w, IMP_U2T);
        // Dígame → Dime, Siéntese → Siéntate, Disculpe → Disculpa, No se preocupe → No te preocupes
        if (sp && tk.breakBefore(k) && !inQuestion(k)) {
          const verb = IMP_U2T[sp[0]];
          tk.set(k, joinCommand(verb, sp[1].map(c => (c === "se" ? "te" : c))));
          continue;
        }
        if (tk.breakBefore(k) && UDIMP_START.has(w) && !inQuestion(k)) { tk.set(k, IMP_U2T[w] || w); continue; }
        if (w === "no" && tk.breakBefore(k)) {
          let j = k + 1; const cl = [];
          while (j < n && CLITICS.includes(tk.low(j))) { cl.push(j); j++; }
          const v = tk.low(j);
          if (cl.length && UD2TU[v] && /[ae]$/.test(v) && !inQuestion(k)) {
            tk.set(j, UD2TU[v]);
            for (const c of cl) if (tk.low(c) === "se") tk.set(c, "te");
          }
        }
        if (hadUsted && (w === "su" || w === "sus")) tk.set(k, w === "su" ? "tu" : "tus");
      }
    }
    // Talking to: ¿Estás listo? → ¿Estás lista?, Bienvenido → Bienvenida
    if (mode === "t") for (let k = 0; k < n; k++) if (COP_TU.has(tk.low(k)) && !isNoun(k) && !youVerbs.includes(k)) youVerbs.push(k);
    for (const k of youVerbs) {
      const v = tk.low(k);
      if (COP_TU.has(v) || COP_UD.has(v)) {
        let s = k + 1;
        if (tk.low(s) === "usted" || tk.low(s) === "tú") s++;
        fixChain(tk, s, l === "f");
      }
    }
    if (l === "f") for (let k = 0; k < n; k++) if (["bienvenido", "bienvenidos"].includes(tk.low(k)) && tk.breakBefore(k)) tk.set(k, "bienvenida");
    return tk.text().replace(/ {2,}/g, " ");
  }).join("");
}

// ---------- female speaker ----------
const COP_YO = new Set(["estoy", "soy", "estuve", "fui", "estaré", "seré", "quedé", "sentí"]);
const COP_YO_NEEDS_YO = new Set(["estaba", "era", "estaría", "sería", "esté", "sea"]);
const ALONE_YO = new Set(["encantado", "agradecido", "contento", "cansado"]);
function makeFemale(text) {
  const parts = sentenceSplit(text);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const tk = tokens(sent);
    for (let k = 0; k < tk.n; k++) {
      const w = tk.low(k);
      let start = -1;
      if (COP_YO.has(w) && !(w === "fui" && false)) start = k + 1;
      else if (COP_YO_NEEDS_YO.has(w) && (tk.low(k - 1) === "yo" || (tk.low(k - 1) === "no" && tk.low(k - 2) === "yo"))) start = k + 1;
      else if (w === "siento" && tk.low(k - 1) === "me") start = k + 1;
      else if (w === "he" && ["estado", "sido", "quedado"].includes(tk.low(k + 1))) start = k + 2;
      else if (ALONE_YO.has(w) && tk.breakBefore(k) && (k + 1 >= tk.n || tk.breakBefore(k + 1) || ["de", "por", "con"].includes(tk.low(k + 1)))) start = k;
      if (start >= 0 && start < tk.n && (start === k || !tk.breakBefore(start))) fixChain(tk, start, true);
    }
    return tk.text();
  }).join("");
}

module.exports = { setFormality, makeFemale, feminine, conjugate, TU2UD, UD2TU, IMP_T2U, IMP_U2T, accentFor };
