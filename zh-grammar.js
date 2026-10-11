// ---- Mandarin fixes applied to Google's English → Chinese output ----
// Mandarin verbs don't change for "you", and nothing agrees with gender, so the one switch that
// matters is the word for "you": 你 (nǐ, casual) or 您 (nín, polite/respectful).
// 您 is only singular: "you all" stays 你们 (您们 isn't standard), so plurals are left alone.

function setFormality(zh, mode) {
  if (mode === "v") return zh.replace(/你(?!们)/g, "您");     // 你好 → 您好, 谢谢你 → 谢谢您, 你的 → 您的
  return zh.replace(/您们/g, "你们").replace(/您/g, "你");     // 您好 → 你好
}

// Which parts to read in which voice: Chinese characters (and Chinese punctuation) in the Mandarin voice,
// runs of Latin letters (an English name or title kept as typed) in the English voice.
const CJK = /[㐀-䶿一-鿿豈-﫿　-〿＀-￯]/;
function voiceParts(text) {
  const parts = [];
  let cur = null;
  for (const ch of text) {
    const lang = CJK.test(ch) ? "zh" : /[A-Za-z]/.test(ch) ? "en" : null;
    if (lang && (!cur || cur[0] !== lang)) { cur = [lang, ""]; parts.push(cur); }
    if (!cur) { cur = ["zh", ""]; parts.push(cur); }
    cur[1] += ch;                       // spaces, digits and punctuation stay with the run before them
  }
  return parts.filter(p => /[A-Za-z0-9㐀-鿿]/.test(p[1]));
}

const hasChinese = s => /[㐀-䶿一-鿿]/.test(s);

module.exports = { setFormality, voiceParts, hasChinese };
