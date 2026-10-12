// ---- Japanese fixes applied to Google's English → Japanese output ----
// Japanese has no "you" verb forms and no gender agreement. What changes is the speech level:
//   polite (です・ます):  行きます / 行きません / 行きました / 学生です / 待ってください
//   casual (plain):       行く   / 行かない   / 行った   / 学生だ   / 待って
// Polite is the default — it's right with shop and station staff, strangers and anyone older.
// The casual button rewrites sentence endings to the plain form you'd use with friends.

const SENT = /([。！？!?\n]+)/;
const KANJI = /[㐀-鿿々]/;
const ROW = {
  i2u: { き: "く", ぎ: "ぐ", し: "す", ち: "つ", に: "ぬ", び: "ぶ", み: "む", り: "る", い: "う" },
  i2a: { き: "か", ぎ: "が", し: "さ", ち: "た", に: "な", び: "ば", み: "ま", り: "ら", い: "わ" },
  i2o: { き: "こ", ぎ: "ご", し: "そ", ち: "と", に: "の", び: "ぼ", み: "も", り: "ろ", い: "お" },
  i2ta: { き: "いた", ぎ: "いだ", し: "した", ち: "った", り: "った", い: "った", に: "んだ", び: "んだ", み: "んだ" },
};
const U2I = Object.fromEntries(Object.entries(ROW.i2u).map(([i, u]) => [u, i]));
const A2I = Object.fromEntries(Object.entries(ROW.i2a).map(([i, a]) => [a, i]));
const O2I = Object.fromEntries(Object.entries(ROW.i2o).map(([i, o]) => [o, i]));
const E_ROW = new Set("えけげせぜてでねへべぺめれ".split(""));
// ichidan verbs whose stem ends in an i-sound or is a single kanji (起きる, 見る, 寝る…)
const ICHIDAN = ["起き", "生き", "飽き", "見", "着", "居", "似", "煮", "寝", "出", "得", "経", "降り", "借り", "足り", "下り",
  "信じ", "感じ", "閉じ", "落ち", "過ぎ", "浴び", "伸び", "でき", "出来", "できる", "い", "おり", "似合"];
const isIchidanStem = st => E_ROW.has(st.slice(-1)) || ICHIDAN.some(x => st === x || st.endsWith(x) && (x.length > 1 || !KANJI.test(st.slice(-2, -1))));

// The masu-stem in front of ます: "行き" in 行きます, "勉強し" in 勉強します
function stemInfo(st) {
  if (st.endsWith("し") && (st.length === 1 || /[をにがはもで、\s]$/.test(st.slice(0, -1)) || (KANJI.test(st.slice(-2, -1)) && KANJI.test(st.slice(-3, -2))) || /[ァ-ヶー]$/.test(st.slice(0, -1))))
    return { type: "suru", base: st.slice(0, -1) };
  if (/(^|[てで])き$/.test(st) || st.endsWith("来")) return { type: "kuru", base: st.slice(0, -1), kanji: st.endsWith("来") };
  if (/(^|[てで])い$/.test(st)) return { type: "ichidan", base: st };
  if (isIchidanStem(st)) return { type: "ichidan", base: st };
  if (st === "行き" || st.endsWith("行き") || st.endsWith("いき")) return { type: "iku", base: st.slice(0, -1) };
  const last = st.slice(-1);
  if (ROW.i2u[last]) return { type: "godan", base: st.slice(0, -1), last };
  return null;
}
const form = {
  dict(s) { return s.type === "suru" ? s.base + "する" : s.type === "kuru" ? s.base + (s.kanji ? "来る" : "くる")
    : s.type === "ichidan" ? s.base + "る" : s.type === "iku" ? s.base + "く" : s.base + ROW.i2u[s.last]; },
  neg(s) { return s.type === "suru" ? s.base + "しない" : s.type === "kuru" ? s.base + (s.kanji ? "来ない" : "こない")
    : s.type === "ichidan" ? s.base + "ない" : s.type === "iku" ? s.base + "かない" : s.base + ROW.i2a[s.last] + "ない"; },
  past(s) { return s.type === "suru" ? s.base + "した" : s.type === "kuru" ? s.base + (s.kanji ? "来た" : "きた")
    : s.type === "ichidan" ? s.base + "た" : s.type === "iku" ? s.base + "った" : s.base + ROW.i2ta[s.last]; },
  vol(s) { return s.type === "suru" ? s.base + "しよう" : s.type === "kuru" ? s.base + (s.kanji ? "来よう" : "こよう")
    : s.type === "ichidan" ? s.base + "よう" : s.type === "iku" ? s.base + "こう" : s.base + ROW.i2o[s.last] + "う"; },
};

const SET_PHRASES_CASUAL = [
  [/どうぞよろしくお願いします/g, "よろしく"], [/よろしくお願いします/g, "よろしく"], [/ありがとうございました/g, "ありがとう"],
  [/ありがとうございます/g, "ありがとう"], [/おはようございます/g, "おはよう"], [/ごめんなさい/g, "ごめん"],
  [/おやすみなさい/g, "おやすみ"], [/お名前/g, "名前"], [/お願いします/g, "お願い"], [/お願いいたします/g, "お願い"],
];
const SET_PHRASES_POLITE = [
  [/ありがとう(?!ござ)/g, "ありがとうございます"], [/おはよう(?!ござ)/g, "おはようございます"], [/ごめんね?(?!なさい)/g, "すみません"],
  [/おやすみ(?!なさい)/g, "おやすみなさい"], [/あなたの名前/g, "お名前"], [/ちょうだい/g, "ください"],
];

// polite → casual, on one sentence (without its end punctuation)
function toCasual(s, end) {
  let q = false;
  let m = s.match(/^(.*?)(か)$/s);
  // "…ますか" / "…ですか" → plain + ？
  if (m && /(ます|ません|ました|ませんでした|ましょう|です|でした|でしょう)$/.test(m[1])) { s = m[1]; q = true; }
  const tailP = (s.match(/(よね|よ|ね)$/) || [""])[0];
  let body = tailP ? s.slice(0, -tailP.length) : s;
  let r;
  if ((r = body.match(/^(.*)ませんでした$/s))) { const st = stemInfo(r[1]); if (st) body = form.neg(st).replace(/ない$/, "なかった"); }
  else if ((r = body.match(/^(.*)ましょう$/s))) { const st = stemInfo(r[1]); if (st) body = form.vol(st); }
  else if ((r = body.match(/^(.*)ません$/s))) {
    if (/(では|じゃ)あり$/.test(r[1])) body = r[1].replace(/(では|じゃ)あり$/, "じゃない");
    else if (/あり$/.test(r[1])) body = r[1].replace(/あり$/, "ない");
    else { const st = stemInfo(r[1]); if (st) body = form.neg(st); }
  }
  else if ((r = body.match(/^(.*)ました$/s))) { const st = stemInfo(r[1]); if (st) body = form.past(st); }
  else if ((r = body.match(/^(.*)ます$/s))) { const st = stemInfo(r[1]); if (st) body = form.dict(st); }
  else if ((r = body.match(/^(.*)でしょう$/s))) body = r[1] + "だろう";
  else if ((r = body.match(/^(.*)でした$/s))) body = r[1] + "だった";
  else if ((r = body.match(/^(.*?)お([^お、\s]+)ください$/s)) && stemInfo(r[2])) {
    // honorific request: お待ちください → 待って
    body = r[1].replace(/少々$/, "ちょっと") + form.past(stemInfo(r[2])).replace(/た$/, "て").replace(/だ$/, "で");
  }
  else if ((r = body.match(/^(.*)(て|で)ください$/s))) body = r[1] + r[2];
  else if ((r = body.match(/^(.*)をください$/s))) body = r[1] + "をちょうだい";
  else if ((r = body.match(/^(.*)ください$/s))) body = r[1] + "ちょうだい";
  else if ((r = body.match(/^(.*)です$/s))) {
    // after an i-adjective (高い, ない, たい, かった) です just drops; after a noun it becomes だ (dropped in questions)
    if (/(い|かった|ない)$/.test(r[1])) body = r[1];
    else body = r[1] + (q || tailP === "ね" || tailP === "よね" ? (tailP && !q ? "だ" : "") : "だ");
  }
  s = body + tailP;
  if (q) end = end.replace(/^[。.]/, "？") || "？";
  return [s, end];
}

// casual → polite, on one sentence (without its end punctuation)
function toPolite(s, end) {
  const q = /^[？?]/.test(end);
  const tailP = (s.match(/(よね|よ|ね)$/) || [""])[0];
  let body = tailP ? s.slice(0, -tailP.length) : s;
  let r, done = true;
  if (/(です|ます|ません|ました|でした|でしょう|ましょう|ください|ございます)$/.test(body)) { return [s, end]; }
  if ((r = body.match(/^(.*)だった$/s))) body = r[1] + "でした";
  else if ((r = body.match(/^(.*)だろう$/s))) body = r[1] + "でしょう";
  else if ((r = body.match(/^(.*)だ$/s))) body = r[1] + "です";
  else if ((r = body.match(/^(.*)(じゃ|では)ない$/s))) body = r[1] + "ではありません";
  else if ((r = body.match(/^(.*[がはも])ない$/s))) body = r[1] + "ありません";
  else if ((r = body.match(/^(.*?)しない$/s))) body = r[1] + "しません";
  else if ((r = body.match(/^(.*)([かがさたなばまらわ])ない$/s))) body = r[1] + A2I[r[2]] + "ません";
  else if ((r = body.match(/^(.*[えけげせぜてでねへべぺめれ見寝出着])ない$/s))) body = r[1] + "ません";
  else if ((r = body.match(/^(.*)(て|で)る$/s))) body = r[1] + r[2] + "います";
  else if ((r = body.match(/^(.*)する$/s))) body = r[1] + "します";
  else if ((r = body.match(/^(.*)(来|く)る$/s))) body = r[1] + (r[2] === "来" ? "来ます" : "きます");
  else if ((r = body.match(/^(.*)した$/s))) body = r[1] + "しました";
  else if ((r = body.match(/^(.*)来た$/s))) body = r[1] + "来ました";
  else if ((r = body.match(/^(.*[えけげせぜてでねへべぺめれ見寝出着])た$/s))) body = r[1] + "ました";
  else if ((r = body.match(/^(.*[㐀-鿿])いた$/s))) body = r[1] + "きました";
  else if ((r = body.match(/^(.*)よう$/s)) && E_ROW.has(r[1].slice(-1))) body = r[1] + "ましょう";
  else if ((r = body.match(/^(.*)しよう$/s))) body = r[1] + "しましょう";
  else if ((r = body.match(/^(.*[㐀-鿿])([こごそとのぼもろお])う$/s))) body = r[1] + O2I[r[2]] + "ましょう";
  else if ((r = body.match(/^(.*)(て|で)$/s)) && /[っんいしけげべめれてで]$/.test(r[1]) ) body = r[1] + r[2] + "ください";
  else if ((r = body.match(/^(.*[㐀-鿿]|.*[えけげせぜてでねへべぺめれ])る$/s)) && isIchidanStem(r[1].replace(/^.*[をにがはもで、]/, ""))) body = r[1] + "ます";
  else if ((r = body.match(/^(.*[㐀-鿿ぁ-ゖ])([くぐすつぬぶむるう])$/s)) && KANJI.test(r[1].slice(-2)) && !/[ょゅゃ]$/.test(r[1])) body = r[1] + U2I[r[2]] + "ます";
  else if (/[い]$/.test(body) && !/ない$/.test(body) && /[㐀-鿿しかさたらく]い$/.test(body)) body = body + "です";
  else if (/くない$|たくない$/.test(body)) body = body + "です";
  // ends in a noun (kanji or katakana) or a question word: 大丈夫 → 大丈夫です, どこ？ → どこですか？
  else if (q && (/[\u3400-\u9fff\u30a0-\u30ffー]$/.test(body) || /(どこ|いくら|なに|何|だれ|誰|いつ|どれ|どう|どちら|どっち)$/.test(body))) body = body + "です";
  else done = false;
  if (done && q && !/か$/.test(body)) body += "か";
  return [body + (q ? "" : tailP), end];
}

function setFormality(ja, mode) {
  for (const [re, to] of (mode === "v" ? SET_PHRASES_POLITE : SET_PHRASES_CASUAL)) ja = ja.replace(re, to);
  if (mode === "v") ja = ja.replace(/^あなたは(?=[^。！？]*[かね]?[？?])/, "");          // "あなたはどこから来ましたか" — Japanese leaves the "you" out
  const parts = ja.split(SENT);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) {
    let s = parts[i], end = parts[i + 1] || "";
    if (!s.trim()) { out.push(s, end); continue; }
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    const core = s.trim();
    const [c2, e2] = mode === "v" ? toPolite(core, end) : toCasual(core, end);
    out.push(lead + c2 + trail, e2);
  }
  return out.join("");
}

// Which parts to read in which voice: Japanese (kana, kanji, Japanese punctuation) in the Japanese voice,
// runs of Latin letters (an English name or title kept as typed) in English
const JA = /[　-ヿ㐀-鿿＀-￯々ー]/;
function voiceParts(text) {
  const parts = [];
  let cur = null;
  for (const ch of text) {
    const lang = JA.test(ch) ? "ja" : /[A-Za-z]/.test(ch) ? "en" : null;
    if (lang && (!cur || cur[0] !== lang)) { cur = [lang, ""]; parts.push(cur); }
    if (!cur) { cur = ["ja", ""]; parts.push(cur); }
    cur[1] += ch;
  }
  return parts.filter(p => /[A-Za-z0-9぀-ヿ㐀-鿿]/.test(p[1]));
}
const hasJapanese = s => /[぀-ヿ㐀-鿿]/.test(s);

module.exports = { setFormality, voiceParts, hasJapanese, stemInfo, form };
