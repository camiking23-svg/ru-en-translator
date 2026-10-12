// ---- Arabic fixes applied to Google's English → Arabic output (Modern Standard Arabic) ----
// Arabic has no tu/vous verb system, but it does change "you" by gender, and so do verbs and adjectives:
//   to a man:   هل تريد؟  أنت مستعد؟  اجلس  لا تقلق
//   to a woman: هل تريدين؟  أنتِ مستعدة؟  اجلسي  لا تقلقي
// Google always writes the masculine, so Talking to: Female rewrites the "you" forms.
// I am: Female does the same for "I": أنا متعب → أنا متعبة, آسف → آسفة.
// Polite "you": حضرتك (hadratak), the respectful "you" people use with elders, staff and strangers.

const HARAKAT = /[ً-ٰٟ]/g;
const plain = w => w.replace(HARAKAT, "");
const WORD = /([ء-ٰٟ-ۓA-Za-z]+)/;
const BREAK = /[.!?؟،,؛;:…—–()«»"“”\n]/;
const KASRA = "ِ";

function tokens(s) {
  const T = s.split(WORD);
  const n = (T.length - 1) / 2;
  return {
    T, n,
    W: i => (i >= 0 && i < n ? T[2 * i + 1] : ""),
    P: i => (i >= 0 && i < n ? plain(T[2 * i + 1]) : ""),
    before: i => T[2 * i],
    set(i, w) { T[2 * i + 1] = w; },
    breakBefore: i => i === 0 || BREAK.test(T[2 * i]),
    text: () => T.join(""),
  };
}
const sentences = s => s.split(/([.!?؟…]+\s*|\n+)/);

// ---------- adjectives ----------
// not adjectives: little words, and verbs (أذهب = I go, سأذهب = I will go, تريد = you want)
const STOP = new Set(["في", "من", "إلى", "الى", "على", "مع", "عن", "لا", "لم", "لن", "قد", "هل", "ما", "كان", "ليس", "لست",
  "هنا", "هناك", "جدا", "جداً", "أيضا", "أيضاً", "الآن", "بخير", "هو", "هي", "أنا", "أنت", "نحن", "هم", "و", "أو", "لكن", "ثم",
  "كل", "بعد", "قبل", "عند", "عندي", "لدي", "لديك", "كيف", "متى", "أين", "لماذا", "ماذا", "إن", "أن", "إنني", "انا", "مش", "مو",
  "شخص", "رجل", "امرأة", "طالب", "معلم", "طبيب", "حقا", "حقاً", "فعلا", "فعلاً", "تماما", "تماماً", "قليلا", "قليلاً"]);
const ADJ_T = new Set(["تعبان", "تعبانة", "تمام"]);              // adjectives that happen to start with ت
const ADJ_A = new Set(["أكيد", "أمريكي", "أجنبي", "أعزب", "أسترالي", "أردني", "أوروبي", "ألماني", "إنجليزي", "إيطالي", "إسباني"]);
const SAME = new Set(["تمام", "بخير", "أفضل", "أكبر", "أصغر", "أحسن", "جاهزة"]);

function isAdj(w) {
  const p = plain(w);
  if (!p || STOP.has(p) || /^[A-Za-z]/.test(p) || /^ال/.test(p) || /^(وال|بال|لل|فال)/.test(p)) return false;
  if (/^س[أنتي]/.test(p)) return false;                          // future verbs
  if (/^[أ]/.test(p) && !ADJ_A.has(p) && !/ي$/.test(p)) return false;   // I-verbs: أحب، أريد
  if (/^ت/.test(p) && !ADJ_T.has(p)) return false;               // you-verbs: تريد
  if (/^[ني]/.test(p) && p.length <= 4 && !/^نا/.test(p)) return false; // we/he verbs: نذهب، يريد
  return p.length >= 3;
}
function feminine(w) {
  const p = plain(w);
  if (SAME.has(p) || /(ة|ى|اء|ات)$/.test(p)) return w;
  if (/اً?$/.test(w.replace(/ً/g, "ً")) && /ا$/.test(p) && p.length > 3) return p.slice(0, -1) + "ة";   // متأكداً → متأكدة
  return p + "ة";                                                // متعب → متعبة، أمريكي → أمريكية
}
// a you-verb for a woman: تريد → تريدين; after لا / لم / لن / أن: لا تقلق → لا تقلقي
function femVerb(w, short) {
  const p = plain(w);
  if (/ين$/.test(p) || !/^ت/.test(p) || p.length < 3) return w;
  if (short) {
    if (/ى$/.test(p)) return p.slice(0, -1) + "ي";
    if (/ي$/.test(p)) return p;
    return p + "ي";
  }
  if (/[يىو]$/.test(p)) return p.slice(0, -1) + "ين";            // تمشي → تمشين، تنسى → تنسين
  return p + "ين";
}
// adjective (or adjective + وadjective) after the subject
function agree(tk, k) {
  if (k >= tk.n || tk.breakBefore(k)) return;
  if (isAdj(tk.W(k))) {
    tk.set(k, feminine(tk.W(k)));
    // "متعب وجائع" → "متعبة وجائعة"
    const nx = tk.P(k + 1);
    if (/^و/.test(nx) && !tk.breakBefore(k + 1) && isAdj(nx.slice(1))) tk.set(k + 1, "و" + feminine(nx.slice(1)));
    else if (["جدا", "جداً"].includes(nx) && /^و/.test(tk.P(k + 2)) && isAdj(tk.P(k + 2).slice(1))) tk.set(k + 2, "و" + feminine(tk.P(k + 2).slice(1)));
  }
}

// ---------- "you" for a woman ----------
const IMP = { "اذهب": "اذهبي", "تعال": "تعالي", "انتظر": "انتظري", "اسمع": "اسمعي", "قل": "قولي", "خذ": "خذي", "اجلس": "اجلسي",
  "ادخل": "ادخلي", "اكتب": "اكتبي", "اقرأ": "اقرئي", "كل": "كلي", "اشرب": "اشربي", "انظر": "انظري", "ساعدني": "ساعديني",
  "أخبرني": "أخبريني", "اتصل": "اتصلي", "تفضل": "تفضلي", "ابق": "ابقي", "استمع": "استمعي", "توقف": "توقفي", "اهدأ": "اهدئي",
  "انتبه": "انتبهي", "عد": "عودي", "ارجع": "ارجعي", "أرسل": "أرسلي", "أعطني": "أعطيني", "قم": "قومي", "نم": "نامي",
  "افعل": "افعلي", "امش": "امشي", "اسمح": "اسمحي", "تذكر": "تذكري", "جرب": "جربي", "اطلب": "اطلبي", "استمتع": "استمتعي",
  "خذي": "خذي", "اتبعني": "اتبعيني", "انتظرني": "انتظريني", "اتصل بي": "اتصلي بي", "أرني": "أريني", "دعني": "دعيني",
  "سامحني": "سامحيني", "صدقني": "صدقيني", "اعتن": "اعتني", "كن": "كوني" };
const IMP_BACK = Object.fromEntries(Object.entries(IMP).map(([m, f]) => [f, m]));
// words ending in the "you" suffix ـك, read as -ki for a woman when marked with a kasra
const KAF = new Set(["حالك", "اسمك", "لك", "بك", "منك", "عليك", "معك", "إليك", "اليك", "عندك", "لديك", "نفسك", "رأيك", "بيتك",
  "صديقك", "عملك", "رقمك", "هاتفك", "عمرك", "بلدك", "أهلك", "عائلتك", "زوجك", "زوجتك", "أنك", "لأنك", "إنك", "مساعدتك",
  "بلقائك", "لقائك", "رؤيتك", "شكرك", "أحبك", "أشكرك", "أراك", "سأراك", "يعطيك", "عافاك"]);
const Q = new Set(["هل", "ماذا", "ما", "أين", "متى", "كيف", "لماذا", "كم", "من", "أي", "وهل", "فهل", "وماذا", "وأين"]);
const SHORT = new Set(["لا", "لم", "لن", "أن", "ألا", "كي", "حتى", "لكي"]);

function setFormality(ar, mode, l) {
  const parts = sentences(ar);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const isQ = /؟|\?/.test(parts[si + 1] || "");
    const tk = tokens(sent);
    const n = tk.n;
    const you = [];                                   // where "you" is the subject
    let second = isQ;                                 // is this sentence talking to "you"?
    for (let k = 0; k < n; k++) {
      const p = tk.P(k);
      if (p === "أنت" || p === "انت" || p === "حضرتك" || p === "سيادتك") { second = true; you.push(k); }
      if (KAF.has(p) || IMP[p] || IMP_BACK[p]) second = true;
    }
    if (mode === "t") for (let k = 0; k < n - 1; k++) if (tk.P(k) === "حال" && ["حضرتك", "سيادتك"].includes(tk.P(k + 1))) { tk.set(k, "حالك"); tk.set(k + 1, ""); tk.T[2 * (k + 1)] = ""; }
    // polite ⇄ plain "you"
    for (const k of you) {
      const p = tk.P(k);
      if (mode === "v" && (p === "أنت" || p === "انت")) tk.set(k, "حضرتك");
      if (mode === "t" && (p === "حضرتك" || p === "سيادتك")) tk.set(k, "أنت");
    }
    if (mode === "v") for (let k = 0; k < n - 1; k++) if (tk.P(k) === "كيف" && tk.P(k + 1) === "حالك") tk.set(k + 1, "حال حضرتك");
    if (l === "f") {
      for (let k = 0; k < n; k++) {
        const p = tk.P(k);
        if (p === "أنت" || p === "انت") { tk.set(k, "أنتِ"); }
        // the word after "you": a verb (أنت تريد → تريدين) or an adjective (أنت مستعد → مستعدة)
        if (["أنت", "انت", "حضرتك", "سيادتك"].includes(p)) {
          let j = k + 1;
          if (tk.P(j) === "لست" || tk.P(j) === "لا") j++;
          if (/^ت/.test(tk.P(j)) && !ADJ_T.has(tk.P(j))) tk.set(j, femVerb(tk.W(j), tk.P(j - 1) === "لا"));
          else agree(tk, j);
        }
        // commands: اجلس → اجلسي، ساعدني → ساعديني
        if (IMP[p] && (tk.breakBefore(k) || ["من", "رجاء", "رجاءً", "فضلك", "لو"].includes(tk.P(k - 1)) || tk.P(k - 1) === "و")) tk.set(k, IMP[p]);
        // you-verbs after a question word or لا/لم/لن (هل تريد → هل تريدين، لا تقلق → لا تقلقي)
        const prev = tk.P(k - 1);
        const command = prev === "لا" && tk.breakBefore(k - 1);           // "لا تقلق" on its own is said to you
        if ((second || command) && /^ت/.test(p) && !ADJ_T.has(p) && p.length >= 3 && !tk.breakBefore(k) && (Q.has(prev) || SHORT.has(prev)))
          tk.set(k, femVerb(tk.W(k), SHORT.has(prev)));                  // after لا / لم / لن / أن the short form: تقلقي
        // ـك read as -ki
        if (KAF.has(p) && second) tk.set(k, p + KASRA);
      }
    }
    return tk.text().replace(/ {2,}/g, " ");
  }).join("");
}

// ---------- female speaker ----------
const SORRY = new Set(["آسف", "متأسف", "سعيد", "مسرور", "متشوق", "شاكر", "ممتن"]);
function makeFemale(ar) {
  const parts = sentences(ar);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const tk = tokens(sent);
    for (let k = 0; k < tk.n; k++) {
      const p = tk.P(k);
      if (p === "أنا" || p === "انا") {
        let j = k + 1;
        if (["لست", "كنت", "سأكون", "أصبحت", "صرت", "أشعر", "أكون"].includes(tk.P(j))) j++;
        if (tk.P(j) === "بأنني" || tk.P(j) === "ب") j++;
        agree(tk, j);
      } else if ((p === "لست" || p === "كنت" || p === "سأكون" || p === "أشعر" || p === "أصبحت") && tk.breakBefore(k)) {
        // "لست متأكداً" (I'm not sure), "أشعر بالتعب"
        agree(tk, k + 1);
      } else if (SORRY.has(p) && tk.breakBefore(k)) {
        // "آسف", "سعيد بلقائك" — the speaker is implied
        tk.set(k, feminine(tk.W(k)));
      }
    }
    return tk.text();
  }).join("");
}

// Which parts to read in which voice: Arabic in the Arabic voice, Latin letters (an English name or title) in English
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
function voiceParts(text) {
  const parts = [];
  let cur = null;
  for (const ch of text) {
    const lang = ARABIC.test(ch) ? "ar" : /[A-Za-z]/.test(ch) ? "en" : null;
    if (lang && (!cur || cur[0] !== lang)) { cur = [lang, ""]; parts.push(cur); }
    if (!cur) { cur = ["ar", ""]; parts.push(cur); }
    cur[1] += ch;
  }
  return parts.filter(p => /[A-Za-z0-9ء-ي٠-٩]/.test(p[1]));
}
const hasArabic = s => /[ء-ي]/.test(s);

module.exports = { setFormality, makeFemale, feminine, femVerb, voiceParts, hasArabic };
