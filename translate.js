const text = process.argv.slice(2).join(" ");
const isRussian = /[а-яё]/i.test(text);
const [from, to] = isRussian ? ["ru", "en"] : ["en", "ru"];
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;


fetch(url)
  .then(r => r.json())
  .then(d => console.log(d[0].map(s => s[0]).join("")));
