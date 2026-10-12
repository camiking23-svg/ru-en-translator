const http = require("http");
const fs = require("fs");
const path = require("path");

// Hosts like Render set PORT; at home it falls back to 3000
const PORT = Number(process.env.PORT) || 3000;


function renderPage(L) { return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${L.short}">
<title>${L.short} Translator</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 0 16px; }
  textarea { display: block; width: 100%; max-width: 100%; height: 120px; font-size: 18px; padding: 8px; }
  button { margin-top: 10px; padding: 10px 20px; font-size: 18px; cursor: pointer; }
  #out { margin-top: 20px; font-size: 20px; min-height: 40px; overflow-wrap: anywhere; }
  .speaker { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 16px; }
  .speaker button { margin-top: 0; padding: 6px 14px; font-size: 16px; border: 1px solid #ccc; background: #f4f4f4; border-radius: 8px;
    color: #111; line-height: 1.2; display: inline-flex; align-items: center; gap: 6px; -webkit-appearance: none; appearance: none; }
  .rs-btns { display: flex; flex-direction: column; gap: 6px; }
  .rs-card button.star { font-size: 20px; color: #b8860b; line-height: 1; }
  .rs-card button.star.on { background: #fff4cc; border-color: #e6c35c; }
  #favs summary { color: #8a6d00; }
  .rs-card { cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background .2s; border-radius: 8px; }
  .rs-card:active, .rs-card.picked { background: #eef5ff; }
  #out.flash { background: #fff6cc; transition: background .3s; border-radius: 6px; }
  #out { transition: background .6s; }
  .tap-note { margin-top: -4px; }
  .rs-card { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: flex-start; }
  .rs-body { flex: 1; min-width: 0; }
  .rs-word { font-size: 20px; font-weight: 600; }
  .rs-say { font-size: 14px; color: #888; margin-left: 6px; font-weight: 400; }
  .rs-mean { margin-top: 2px; }
  .rs-ex { margin-top: 6px; font-size: 15px; color: #333; }
  .rs-ex-en { font-size: 14px; color: #777; }
  .rs-card button { margin-top: 0; padding: 6px 10px; font-size: 18px; background: #f4f4f4; border: 1px solid #ddd;
    border-radius: 8px; -webkit-appearance: none; appearance: none; }
  #conv-btn { display: block; width: 100%; margin: 4px 0 6px; padding: 18px 12px; font-size: 20px; font-weight: 600;
    border: none; border-radius: 14px; background: #1f6feb; color: #fff; -webkit-appearance: none; appearance: none; }
  #conv-btn.them { background: #b3261e; }
  #conv-btn.listening { animation: convPulse 1.2s ease-in-out infinite; }
  @keyframes convPulse { 0%, 100% { opacity: 1; } 50% { opacity: .65; } }
  #conv-status { margin: 0 0 10px; min-height: 1em; }
  .phrases { margin-top: 18px; padding-top: 14px; border-top: 1px solid #eee; font-size: 16px; }
  .phrases summary { cursor: pointer; font-weight: 600; padding: 4px 0; }
  .ph-help { margin: 6px 0 10px; font-size: 14px; color: #666; }
  .ph-add { display: flex; flex-wrap: wrap; gap: 8px; }
  .ph-add input { flex: 1 1 140px; min-width: 0; font-size: 16px; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
  .ph-add button { margin-top: 0; padding: 8px 16px; font-size: 16px; }
  .ph-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .ph-row .ph-text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .ph-row .ph-ru { color: #555; }
  .ph-row button { margin-top: 0; padding: 4px 10px; font-size: 14px; color: #a00; background: #f6f6f6;
    border: 1px solid #ddd; border-radius: 6px; -webkit-appearance: none; appearance: none; }
  .listener { margin-top: 18px; padding-top: 14px; border-top: 1px solid #eee; }
  .listener.dim { opacity: .45; }
  .speaker .hint { font-size: 13px; opacity: .65; }
  .speaker .sym { font-size: 18px; line-height: 1; display: inline-block; }
  .voices { margin-top: 12px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .voices button { margin-top: 0; padding: 4px 10px; font-size: 14px; color: #111; background: #f4f4f4;
    border: 1px solid #ddd; border-radius: 6px; -webkit-appearance: none; appearance: none; }
  .speaker button.on { background: #222; color: #fff; border-color: #222; }
${L.navCss}${L.extraCss || ""}</style></head>
<body>
${L.nav}  <h1>${L.name} ⇄ English</h1>
  <div class="speaker">I am:
    <button id="g-m" onclick="setGender('m')"><span class="sym">♂&#xFE0E;</span><span>Male</span></button>
    <button id="g-f" onclick="setGender('f')"><span class="sym">♀&#xFE0E;</span><span>Female</span></button>
  </div>
  <div class="speaker">You:
    <button id="y-t" onclick="setYou('t')"><span>${L.youT}</span><span class="hint">casual</span></button>
    <button id="y-v" onclick="setYou('v')"><span>${L.youV}</span><span class="hint">formal</span></button>
  </div>
  <div id="conv" style="display:none">
    <button id="conv-btn" onclick="convTap()">🎤 My turn (English)</button>
    <p id="conv-status" class="ph-help"></p>
  </div>
  <textarea id="input" placeholder="Type ${L.name} or English..." onkeydown="if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); go(); }"></textarea>
  <button onclick="go()">Translate</button>
 <div id="out"></div>
<button onclick="navigator.clipboard.writeText(document.getElementById('out').textContent)">Copy</button><button onclick="speak()">🔊 Speak</button>
<div class="speaker listener" id="listener-row">Talking to:
  <button id="l-m" onclick="setListener('m')"><span class="sym">♂&#xFE0E;</span><span>Male</span></button>
  <button id="l-f" onclick="setListener('f')"><span class="sym">♀&#xFE0E;</span><span>Female</span></button>
</div>
<div class="voices">🔒 Voice:
  <button id="v-${L.code}" onclick="nextVoice('${L.code}')"></button>
  <button id="v-en" onclick="nextVoice('en')"></button>
</div>
<details class="phrases" id="favs" open>
  <summary>⭐ Favorites <span id="fav-count"></span></summary>
  <div id="fav-list"></div>
</details>
<details class="phrases" id="phrases">
  <summary>📖 My phrases &amp; slang <span id="ph-count"></span></summary>
  <p class="ph-help">Always translated exactly the way you write them, both directions.</p>
  <div class="ph-add">
    <input id="ph-en" placeholder="English (e.g. No cap)" autocomplete="off">
    <input id="ph-${L.code}" placeholder="${L.name} (e.g. ${L.phEx})" autocomplete="off" lang="${L.code}">
    <button onclick="addPhrase()">Add</button>
  </div>
  <div id="ph-list"></div>
</details>
<details class="phrases" id="share">
  <summary>🔗 Share or back up my setup</summary>
  <p class="ph-help">Makes a link with this phone's phrases, favorites and settings. Open it on another phone to copy
    everything there, or save it in Notes as a backup in case Safari's data gets cleared.</p>
  <button onclick="makeShareLink()">🔗 Create my setup link</button>
  <p class="ph-help" id="share-status"></p>
  <textarea id="share-link" readonly rows="3" onclick="this.select()"
    style="display:none; width:100%; font-size:13px; padding:6px; border:1px solid #ccc; border-radius:8px;"></textarea>
</details>
${L.sectionsHtml}
<script>
  const LANG = "${L.code}", LK = "${L.keyPrefix}", CFG = ${L.cfgJson};
  let gender = "m";
  try { gender = localStorage.getItem("gender") || "m"; } catch (e) {}

  function setGender(g) {
    gender = g;
    try { localStorage.setItem("gender", g); } catch (e) {}
    document.getElementById("g-m").classList.toggle("on", g === "m");
    document.getElementById("g-f").classList.toggle("on", g === "f");
    if (window.speechSynthesis && document.getElementById("v-" + LANG)) showVoices();
    // Re-translate English input so the Russian updates right away
    const text = document.getElementById("input").value;
    if (text.trim() && englishInput(text) && document.getElementById("out").textContent) go();
  }

  // Casual ты or formal вы, kept the same through the whole translation
  let you = "t";
  if (CFG.defYou) you = CFG.defYou;                    // Japanese starts polite
  try { you = localStorage.getItem(LK + "you") || CFG.defYou || "t"; } catch (e) {}
  function setYou(y) {
    you = y;
    try { localStorage.setItem(LK + "you", y); } catch (e) {}
    const row = document.getElementById("listener-row");
    if (row) row.classList.toggle("dim", y === "v" && LANG === "ru");   // Russian вы doesn't depend on their gender (French vous does)
    document.getElementById("y-t").classList.toggle("on", y === "t");
    document.getElementById("y-v").classList.toggle("on", y === "v");
    const text = document.getElementById("input").value;
    if (text.trim() && englishInput(text) && document.getElementById("out").textContent) go();
  }

  // Who you're talking to: picks был/была, готов/готова when using ты
  let listener = "m";
  try { listener = localStorage.getItem(LK + "listener") || "m"; } catch (e) {}
  function setListener(l) {
    listener = l;
    try { localStorage.setItem(LK + "listener", l); } catch (e) {}
    document.getElementById("l-m").classList.toggle("on", l === "m");
    document.getElementById("l-f").classList.toggle("on", l === "f");
    const text = document.getElementById("input").value;
    if ((you === "t" || LANG !== "ru") && text.trim() && englishInput(text) && document.getElementById("out").textContent) go();
  }

  // ---- My phrases & slang — saved on THIS phone, so each person keeps their own list ----
  // A new phone starts with the server's starter list (phrases.json), then it's theirs to change.
  // New starter phrases (added to phrases.json later) are merged in automatically,
  // without bringing back ones you've deleted.
  let myPhrases = [];
  const phraseKey = p => String(p.en || "").trim().toLowerCase();
  function loadPhrases() {
    let saved = null, seen = null;
    try { saved = JSON.parse(localStorage.getItem(LK + "myPhrases") || "null"); } catch (e) {}
    try { seen = JSON.parse(localStorage.getItem(LK + "starterSeen") || "null"); } catch (e) {}
    if (Array.isArray(saved)) { myPhrases = saved; drawPhrases(); }
    fetch(CFG.phrasesUrl).then(r => r.json()).then(starters => {
      if (!Array.isArray(starters)) return;
      const tidy = p => Object.assign({ en: p.en, [LANG]: p[LANG] }, p.oneWay ? { oneWay: true } : {}, p.alone ? { alone: true } : {});
      if (!Array.isArray(saved)) {
        myPhrases = starters.map(tidy);                       // brand-new phone: start with the full list
      } else {
        // phones from before this update already had the original list (entries without "v")
        if (!Array.isArray(seen)) seen = starters.filter(p => !p.v).map(phraseKey);
        const mine = new Set(myPhrases.map(phraseKey));
        const fresh = starters.filter(p => !seen.includes(phraseKey(p)) && !mine.has(phraseKey(p)));
        // keep settings like "only on its own" in step with the starter list, if you haven't changed the Russian
        const byKey = new Map(starters.map(p => [phraseKey(p), p]));
        myPhrases = myPhrases.map(m => {
          const s = byKey.get(phraseKey(m));
          return s && s[LANG] === m[LANG] ? tidy(Object.assign({}, m, { oneWay: s.oneWay, alone: s.alone })) : m;
        });
        myPhrases = fresh.map(tidy).concat(myPhrases);         // new starters go to the top
      }
      try { localStorage.setItem(LK + "starterSeen", JSON.stringify(starters.map(phraseKey))); } catch (e) {}
      savePhrases();
    }).catch(() => {});
  }
  function savePhrases() {
    try { localStorage.setItem(LK + "myPhrases", JSON.stringify(myPhrases)); } catch (e) {}
    drawPhrases();
  }
  function drawPhrases() {
    const box = document.getElementById("ph-list");
    box.textContent = "";
    document.getElementById("ph-count").textContent = "(" + myPhrases.length + ")";
    myPhrases.forEach((p, i) => {
      const row = document.createElement("div"); row.className = "ph-row";
      const t = document.createElement("div"); t.className = "ph-text";
      const en = document.createElement("div"); en.textContent = p.en;
      const ru = document.createElement("div"); ru.className = "ph-ru"; ru.textContent = "→ " + p[LANG] + (p.oneWay ? "  (English → " + CFG.name + " only)" : "") + (p.alone ? "  (only when typed on its own)" : "");
      t.appendChild(en); t.appendChild(ru);
      t.style.cursor = "pointer";
      t.onclick = () => usePhrase(p.en, p[LANG], null, row);
      const del = document.createElement("button"); del.textContent = "✕";
      del.setAttribute("aria-label", "Delete " + p.en);
      del.onclick = () => { myPhrases.splice(i, 1); savePhrases(); };
      row.appendChild(t); row.appendChild(del);
      box.appendChild(row);
    });
  }
  function addPhrase() {
    const en = document.getElementById("ph-en").value.trim();
    const ru = document.getElementById("ph-" + LANG).value.trim();
    if (!en || !ru) return;
    // same English again → replace the old one
    myPhrases = myPhrases.filter(p => p.en.toLowerCase() !== en.toLowerCase());
    myPhrases.unshift({ en: en, [LANG]: ru });
    document.getElementById("ph-en").value = "";
    document.getElementById("ph-" + LANG).value = "";
    savePhrases();
  }

  // ---- Learning decks (listed per language in CFG.decks) ----
  function loadDecks() { CFG.decks.forEach(d => loadCards(d.url, d.list, d.count)); }
  function loadCards(url, listId, countId) {
    fetch(url).then(r => r.json()).then(list => {
      const box = document.getElementById(listId);
      box.textContent = "";
      if (!box.previousElementSibling || !box.previousElementSibling.classList.contains("tap-note")) {
        const note = document.createElement("p"); note.className = "ph-help tap-note";
        note.textContent = "👆 Tap any card to use it — the " + CFG.name + " goes to the top, ready to Copy or Speak. ☆ saves it to Favorites.";
        box.parentNode.insertBefore(note, box);
      }
      document.getElementById(countId).textContent = "(" + list.length + ")";
      list.forEach(w => box.appendChild(makeCard(w, url + "|" + w[LANG])));
    }).catch(() => {});
  }

  // One card: tap to use, 🔊 to hear, ☆ to save to Favorites
  function makeCard(w, key) {
    const card = document.createElement("div"); card.className = "rs-card";
    card.title = "Tap to use this phrase";
    card.onclick = () => usePhrase(w.en, w[LANG], w.speak, card);
    const body = document.createElement("div"); body.className = "rs-body";
    const word = document.createElement("div"); word.className = "rs-word"; word.textContent = w[LANG];
    if (w.say) {
      const say = document.createElement("span"); say.className = "rs-say"; say.textContent = "[" + w.say + "]";
      word.appendChild(say);
    }
    const mean = document.createElement("div"); mean.className = "rs-mean"; mean.textContent = w.en;
    body.appendChild(word); body.appendChild(mean);
    if (w.lit) {
      const lit = document.createElement("div"); lit.className = "rs-ex-en"; lit.textContent = "Literally: " + w.lit;
      body.appendChild(lit);
    }
    if (w.ex) {
      const ex = document.createElement("div"); ex.className = "rs-ex"; ex.textContent = w.ex;
      const exEn = document.createElement("div"); exEn.className = "rs-ex-en"; exEn.textContent = w.exEn || "";
      body.appendChild(ex); body.appendChild(exEn);
    }
    const btns = document.createElement("div"); btns.className = "rs-btns";
    const btn = document.createElement("button"); btn.textContent = "🔊";
    btn.setAttribute("aria-label", "Hear " + w[LANG]);
    btn.onclick = e => {
      e.stopPropagation();
      const first = w.speak || pickGender(w[LANG], genderFor(w.en));
      speakText(first + (w.ex ? (/[.!?…]$/.test(first) ? " " : ". ") + w.ex : ""));
    };
    const star = document.createElement("button"); star.className = "star";
    star.dataset.key = key;
    paintStar(star);
    star.onclick = e => { e.stopPropagation(); toggleFav(key, w); };
    btns.appendChild(btn); btns.appendChild(star);
    card.appendChild(body); card.appendChild(btns);
    return card;
  }

  // ---- ⭐ Favorites (kept on this phone, survive refreshes and server restarts) ----
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(LK + "favs") || "[]"); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  function isFav(key) { return favs.some(f => f.key === key); }
  function paintStar(star) {
    const on = isFav(star.dataset.key);
    star.textContent = on ? "★" : "☆";
    star.classList.toggle("on", on);
    star.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
  }
  function toggleFav(key, w) {
    if (isFav(key)) favs = favs.filter(f => f.key !== key);
    else favs.unshift({ key, w });
    try { localStorage.setItem(LK + "favs", JSON.stringify(favs)); } catch (e) {}
    document.querySelectorAll(".star").forEach(paintStar);   // update every ☆/★ on the page
    renderFavorites();
  }
  function renderFavorites() {
    const box = document.getElementById("fav-list");
    box.textContent = "";
    document.getElementById("fav-count").textContent = favs.length ? "(" + favs.length + ")" : "";
    if (!favs.length) {
      const hint = document.createElement("p"); hint.className = "ph-help";
      hint.textContent = "No favorites yet — tap the ☆ on any card below to keep it here.";
      box.appendChild(hint);
      return;
    }
    favs.forEach(f => box.appendChild(makeCard(f.w, f.key)));
  }

  // Was the text in the box English? Russian is told apart by its letters; French and English share
  // an alphabet, so for French we go by what the last translation found.
  let lastFrom = "", lastTo = "", lastSay = null, lastOut = "";
  function englishInput(text) {
    if (LANG === "ru") return !/[а-яё]/i.test(text);
    return lastFrom === "en";
  }

  async function go(fromHint) {
    const text = document.getElementById("input").value;
    // send this phone's own phrase list along with the text
    if (LANG === "ru") {
      const r = await fetch("/translate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, g: gender, y: you, l: listener, phrases: myPhrases }) });
      document.getElementById("out").textContent = await r.text();
      return;
    }
    // French (and later languages): the server also says which way it went and which parts to say in which voice
    const r = await fetch("/translate", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: LANG, from: fromHint || "", q: text, g: gender, y: you, l: listener, phrases: myPhrases }) });
    if (!r.ok) throw new Error("translate failed");
    const j = await r.json();
    lastFrom = j.from || ""; lastTo = j.to || ""; lastSay = j.say || null; lastOut = j.out || "";
    const out = document.getElementById("out");
    out.textContent = lastOut;
    out.dataset.for = ""; out.dataset.say = "";
  }
  // Speak each run of Russian or English text in its own voice,
  // so an English title inside a Russian sentence is said in English.
  function speak() {
    const out = document.getElementById("out");
    const t = out.textContent;
    const d = out.dataset || {};
    if (LANG !== "ru") {
      if (d.say && d.for === t) return speakText(d.say, LANG);
      if (lastSay && t === lastOut) return speakParts(lastSay.map(p => ({ lang: CFG.locales[p[0]], text: p[1] })));
      return speakText(t, t === lastOut && lastTo ? lastTo : LANG);
    }
    speakText(d.say && d.for === t ? d.say : t);
  }

  // Put a ready-made phrase straight into the result — no Translate needed
  // ---- Gendered cards: insert only the form that fits (no backslashes — this lives inside the page template) ----
  const PUNCT = '.,!?…;:«»"';
  function bare(w) {                       // word without surrounding punctuation, lower-case
    let a = 0, b = w.length;
    while (a < b && PUNCT.includes(w[a])) a++;
    while (b > a && PUNCT.includes(w[b - 1])) b--;
    return w.slice(a, b).toLowerCase();
  }
  // Is (m, f) a masculine/feminine pair? хотел/хотела, заблудился/заблудилась, вегетарианец/вегетарианка, сам/сама
  function genderPair(m, f) {
    m = bare(m); f = bare(f);
    if (!m || !f || m === f) return false;
    if (f === m + "а") return true;
    if (m.endsWith("ся") && f === m.slice(0, -2) + "ась") return true;
    if (m.endsWith("ец") && f === m.slice(0, -2) + "ка") return true;
    if (m.endsWith("ен") && f === m.slice(0, -2) + "на") return true;   // должен/должна, согласен/согласна
    if (LANG === "fr") return frGenderPair(m, f);
    if (LANG === "es" || LANG === "it" || LANG === "pt") return roGenderPair(m, f);
    if (LANG === "ar") return arGenderPair(m, f);
    return false;
  }
  // Arabic: متعب/متعبة، تفضل/تفضلي، تصبح/تصبحين، حبيبي/حبيبتي (ignoring short-vowel marks and ؟ ،)
  function arGenderPair(m, f) {
    const c = w => w.replace(/[\u064B-\u065F\u0670؟،!.]/g, "");
    m = c(m); f = c(f);
    if (!m || m === f) return false;
    return f === m + "ة" || f === m + "ي" || f === m + "ين" || (m.endsWith("ي") && f === m.slice(0, -1) + "تي");
  }
  // Spanish / Italian / Portuguese: cansado/cansada, señor/señora, signore/signora, alemão/alemã, el/la, o/a…
  const RO_PAIRS = { "el": "la", "un": "una", "il": "la", "lo": "la", "o": "a", "do": "da", "no": "na", "ao": "à", "um": "uma",
    "dottore": "dottoressa", "bom": "boa" };
  function roGenderPair(m, f) {
    if (RO_PAIRS[m] === f) return true;
    if (/[oe]$/.test(m) && f === m.slice(0, -1) + "a") return true;
    if (f === m + "a" && /(or|ol|és|ês|n)$/.test(m)) return true;
    if (m.endsWith("és") && f === m.slice(0, -2) + "esa") return true;
    if (m.endsWith("ão") && f === m.slice(0, -2) + "ã") return true;
    return false;
  }
  // French: prêt/prête, désolé/désolée, heureux/heureuse, sportif/sportive, premier/première, canadien/canadienne…
  const FR_PAIRS = { "un": "une", "le": "la", "il": "elle", "mon": "ma", "ton": "ta", "son": "sa", "ce": "cette",
    "beau": "belle", "nouveau": "nouvelle", "fou": "folle", "vieux": "vieille", "lui": "elle", "frais": "fraîche",
    "blanc": "blanche", "doux": "douce", "faux": "fausse", "long": "longue", "gentil": "gentille", "acteur": "actrice",
    "copain": "copine", "mec": "meuf", "monsieur": "madame", "frère": "sœur", "fils": "fille", "chéri": "chérie" };
  function frGenderPair(m, f) {
    if (FR_PAIRS[m] === f) return true;
    if (f === m + "e") return true;
    const ends = [["eux", "euse"], ["eur", "euse"], ["teur", "trice"], ["if", "ive"], ["er", "ère"], ["ien", "ienne"],
      ["on", "onne"], ["el", "elle"], ["et", "ette"], ["et", "ète"], ["en", "enne"], ["x", "se"], ["s", "sse"]];
    return ends.some(p => m.endsWith(p[0]) && f === m.slice(0, -p[0].length) + p[1]);
  }
  // Pick one form from "masc / fem" text. g = "m" or "f". Non-gender slashes (Чай / кофе) are left alone.
  function pickGender(text, g) {
    const sides = text.split(" / ");
    if (sides.length !== 2) return text;
    const L = sides[0].split(" "), R = sides[1].split(" ");
    // Whole-phrase choice: "Как сам? / Как сама?" — same length, differs in exactly one gendered word
    if (L.length === R.length) {
      const diff = L.map((w, i) => i).filter(i => bare(L[i]) !== bare(R[i]));
      if (diff.length === 1 && genderPair(L[diff[0]], R[diff[0]])) return g === "f" ? sides[1] : sides[0];
      // French often changes two words: "un ami / une amie", "Tu es prêt ? / Tu es prête ?"
      if (LANG !== "ru" && LANG !== "zh" && diff.length > 1 && diff.length <= 3 && diff.every(i => genderPair(L[i], R[i]))) return g === "f" ? sides[1] : sides[0];
    }
    // Single-word choice: "Я бы хотел / хотела заказать…"
    const m = L[L.length - 1], f = R[0];
    if (genderPair(m, f)) {
      const word = g === "f" ? f : m;
      return L.slice(0, -1).concat([word], R.slice(1)).join(" ");
    }
    return text;
  }
  // Remove "(man / woman)"-style notes from the English once the form is chosen
  function stripGenderNote(en) {
    const i = en.lastIndexOf(" (");
    if (i < 0 || !en.endsWith(")")) return en;
    const note = en.slice(i).toLowerCase();
    const isNote = ["man", "woman", "guy", "girl"].some(w => note.includes(w));
    return isNote ? en.slice(0, i) : en;
  }
  // "Как сам? / Как сама?" is about the person you're talking to; everything else is about you
  function genderFor(en) {
    const e = (en || "").toLowerCase();
    return (e.includes("to a guy") || e.includes("to a girl") || e.includes("to a man") || e.includes("to a woman"))
      ? listener : gender;
  }

  function usePhrase(en, ru, say, el) {
    const input = document.getElementById("input");
    const out = document.getElementById("out");
    // gendered card → keep only the form that fits (I am / Talking to toggles)
    const picked = pickGender(ru, genderFor(en));
    if (picked !== ru) { ru = picked; en = stripGenderNote(en); }
    input.value = en;                       // what it means, so you can see what you're saying
    out.textContent = ru;                   // the Russian, ready for Copy / Speak
    out.dataset.for = ru;
    out.dataset.say = say || "";
    if (el) { el.classList.add("picked"); setTimeout(() => el.classList.remove("picked"), 700); }
    out.classList.add("flash"); setTimeout(() => out.classList.remove("flash"), 900);
    out.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function speakText(t, lang) {
    if (LANG === "ar" && (!lang || lang === "ar")) {
      // Arabic cards can mix in Latin letters (Arabizi, names): each run of text in its own voice
      const runs = []; let cur = null;
      for (const ch of String(t || "")) {
        const isAr = ch >= "؀" && ch <= "ۿ", isLat = /[a-z]/i.test(ch);
        const lg = isAr ? "ar-SA" : isLat ? "en-US" : null;
        if (lg && (!cur || cur.lang !== lg)) { cur = { lang: lg, text: "" }; runs.push(cur); }
        if (!cur) { cur = { lang: "ar-SA", text: "" }; runs.push(cur); }
        cur.text += ch;
      }
      return speakParts(runs);
    }
    if (LANG !== "ru") {
      // French and English look alike, so the caller says which language this is
      if (!String(t || "").trim()) return;
      return speakParts([{ lang: CFG.locales[lang || LANG] || CFG.locales[LANG], text: t }]);
    }
    const chunks = [];
    let cur = null;
    for (const ch of t) {
      const lang = /[а-яё]/i.test(ch) ? "ru-RU" : /[a-z]/i.test(ch) ? "en-US" : null;
      if (lang && (!cur || cur.lang !== lang)) { cur = { lang, text: "" }; chunks.push(cur); }
      if (!cur) { cur = { lang: "en-US", text: "" }; chunks.push(cur); }
      cur.text += ch;   // spaces and punctuation stay with the run before them
    }
    speakParts(chunks.filter(c => /[а-яёa-z0-9]/i.test(c.text)));
  }
  function hasWords(t) { return LANG === "ru" ? /[а-яёa-z0-9]/i.test(t) : !!String(t).trim(); }
  function speakParts(parts) {
    parts = parts.filter(c => c.text && hasWords(c.text));
    if (!parts.length) return;
    speechSynthesis.cancel();
    if (player) { player.pause(); player = null; }

    if (online) {
      // Real male/female Microsoft voices, made by your PC and played as one audio clip
      const d = JSON.stringify(parts.map(c => [c.lang.slice(0, 2), c.text]));
      const a = sharedAudio || new Audio();
      a.src = "/tts?g=" + gender + "&d=" + encodeURIComponent(d);
      player = a;
      let fellBack = false;
      const fallback = () => {
        if (fellBack || player !== a) return;
        fellBack = true; player = null;
        speakLocal(parts);                 // internet or add-on trouble → phone voices
      };
      a.onerror = fallback;
      const p = a.play();
      if (p && p.catch) p.catch(fallback);
      return;
    }
    speakLocal(parts);
  }

  // Phone's built-in voices (used when the Microsoft voices aren't available)
  function speakLocal(chunks) {
    speechSynthesis.cancel();
    for (const c of chunks) {
      if (!hasWords(c.text)) continue;
      const u = new SpeechSynthesisUtterance(c.text);
      u.lang = c.lang;
      const lang = c.lang.slice(0, 2);
      const v = lockedVoice(lang);
      if (v) u.voice = v;
      else {
        // No voice of the right gender: borrow another voice and shift its pitch toward the speaker's
        const fb = fallbackVoice(lang);
        if (fb) u.voice = fb;
        u.pitch = gender === "m" ? 0.5 : 1.35;   // 0.5 is the lowest iPhone Safari allows
        u.rate = gender === "m" ? 0.9 : 1;
      }
      speechSynthesis.speak(u);   // utterances play one after another
    }
  }

  // ---- Microsoft online voices: fixed per gender, so always the same voice ----
  let online = false;
  let player = null;
  const ONLINE = { m: { ru: "Dmitry", fr: "Henri", zh: "Yunxi", es: "Jorge", it: "Diego", pt: "Antonio", ar: "Hamed", ja: "Keita", en: "Guy" },
                   f: { ru: "Svetlana", fr: "Denise", zh: "Xiaoxiao", es: "Dalia", it: "Elsa", pt: "Francisca", ar: "Zariyah", ja: "Nanami", en: "Jenny" } };
  fetch("/tts-status").then(r => r.json()).then(s => { online = !!s.ok; showVoices(); }).catch(() => {});

  // ---- Voice matches the speaker's gender, and stays locked ----
  // Browsers don't label voices male/female, so we go by known voice names.
  var FEMALE = ["milena", "katya", "irina", "svetlana", "dariya", "ekaterina", "alena", "google русский",
    "samantha", "karen", "moira", "tessa", "victoria", "allison", "ava", "susan", "zoe", "nicky", "kate",
    "serena", "fiona", "veena", "zira", "aria", "jenny", "hazel", "libby", "sonia", "michelle", "emma",
    "amélie", "amelie", "audrey", "aurélie", "aurelie", "marie", "denise", "julie", "hortense", "eloise",
    "vivienne", "céline", "celine", "google français", "laila", "mariam", "maryam", "zariyah", "salma", "hoda", "amina", "kyoko", "o-ren", "nanami", "ayumi", "haruka", "sayaka", "google 日本語",
    "paulina", "monica", "mónica", "dalia", "elvira", "marisol", "google español", "alice", "federica", "elsa",
    "isabella", "google italiano", "luciana", "joana", "francisca", "thalita", "fernanda", "google português",
    "tingting", "ting-ting", "meijia", "mei-jia", "sinji", "sin-ji", "lili", "yaoyao", "huihui", "xiaoxiao", "xiaoyi", "yushu", "yu-shu", "google 普通话",
    "female", "google us english"];
  var MALE = ["yuri", "pavel", "dmitry", "maxim", "daniel", "alex", "fred", "aaron", "arthur", "gordon",
    "oliver", "tom", "rishi", "reed", "eddy", "ralph", "david", "mark", "guy", "george", "ryan",
    "christopher", "eric", "roger", "steffan", "brian", "thomas", "jacques", "henri", "paul", "remy", "rémy",
    "nicolas", "jorge", "diego", "alvaro", "álvaro", "juan", "luca", "cosimo", "giuseppe", "antonio", "duarte", "felipe", "maged", "majed", "tarik", "hamed", "shakir", "naayf", "hamdan", "otoya", "hattori", "keita", "ichiro",
    "kangkang", "yunxi", "yunjian", "yunyang", "li-mu", "limu", "male"];

  function voiceGender(v) {
    const n = v.name.toLowerCase();
    if (n.includes("female")) return "f";            // check before "male"
    if (MALE.some(w => n.includes(w))) return "m";
    if (FEMALE.some(w => n.includes(w))) return "f";
    return null;
  }

  function voicesFor(lang, g) {
    return speechSynthesis.getVoices()
      .filter(v => v.lang.replace("_", "-").toLowerCase().startsWith(lang))
      .filter(v => voiceGender(v) === g)
      .sort((a, b) => voiceRank(a) - voiceRank(b));
  }

  // Prefer natural-sounding voices; push Apple's novelty/robotic voices (Fred, Ralph…) to the end.
  var NOVELTY = ["fred", "ralph", "eddy", "grandpa", "grandma", "rocko", "reed", "sandy", "shelley", "flo",
    "albert", "bahh", "bells", "boing", "bubbles", "cellos", "jester", "organ", "superstar", "trinoids",
    "whisper", "wobble", "zarvox", "junior", "kathy", "bad news", "good news"];
  function voiceRank(v) {
    const n = v.name.toLowerCase();
    if (NOVELTY.some(w => n.includes(w))) return 3;
    // French: prefer France French over Canadian (fr-CA) voices
    const vl = v.lang.replace("_", "-").toLowerCase();
    const off = (LANG === "fr" && vl.startsWith("fr") && !vl.startsWith("fr-fr")) ||
                (LANG === "zh" && vl.startsWith("zh") && !vl.startsWith("zh-cn")) ||        // and Mainland over Taiwan/HK voices
                (LANG === "es" && vl.startsWith("es") && !/^es-(mx|us|419)/.test(vl)) ||     // Latin American Spanish voices first
                (LANG === "pt" && vl.startsWith("pt") && !vl.startsWith("pt-br")) ||
                (LANG === "ar" && vl.startsWith("ar") && !vl.startsWith("ar-sa")) ||
                (LANG === "ja" && !vl.startsWith("ja")) ? 0.5 : 0;
    if (n.includes("premium") || n.includes("enhanced")) return 0 + off;
    return 1 + off;
  }

  // Remembers one voice per language + gender, so it never snaps back to the default.
  function lockedVoice(lang) {
    const key = "voice2_" + lang + "_" + gender;
    const list = voicesFor(lang, gender);
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) {}
    let v = list.find(x => x.name === saved) || list[0] || null;
    if (v) { try { localStorage.setItem(key, v.name); } catch (e) {} }
    return v;
  }

  // Best available voice of the other gender, used with a pitch shift when the right one is missing.
  function fallbackVoice(lang) {
    const other = gender === "m" ? "f" : "m";
    const list = voicesFor(lang, other);
    if (list.length) return list[0];
    return speechSynthesis.getVoices().find(v => v.lang.replace("_", "-").toLowerCase().startsWith(lang)) || null;
  }

  // Tap a voice name to switch to the next one of the same gender (it then stays locked).
  function nextVoice(lang) {
    if (online) return;                    // Microsoft voices are fixed per gender
    const list = voicesFor(lang, gender);
    if (list.length < 2) return;
    const cur = lockedVoice(lang);
    const v = list[(list.indexOf(cur) + 1) % list.length];
    try { localStorage.setItem("voice2_" + lang + "_" + gender, v.name); } catch (e) {}
    showVoices();
  }

  function showVoices() {
    const short = v => v.name.split(" (")[0].replace("Microsoft ", "").replace(" Online", "");
    const label = lang => {
      const v = lockedVoice(lang);
      if (v) return short(v);
      const fb = fallbackVoice(lang);
      return fb ? short(fb) + (gender === "m" ? " (lowered)" : " (raised)") : "default";
    };
    if (online) {
      document.getElementById("v-" + LANG).textContent = LANG.toUpperCase() + ": " + ONLINE[gender][LANG] + " (Microsoft)";
      document.getElementById("v-en").textContent = "EN: " + ONLINE[gender].en + " (Microsoft)";
      return;
    }
    document.getElementById("v-" + LANG).textContent = LANG.toUpperCase() + ": " + label(LANG);
    document.getElementById("v-en").textContent = "EN: " + label("en");
  }
  speechSynthesis.onvoiceschanged = showVoices;   // voices load a moment after the page
  // ---- 🎤 Voice conversation: one big button, turns alternate (no backslashes: inside the page template) ----
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let convTurn = "me";            // "me" = I speak English, "them" = they speak Russian
  let convRec = null, convBusy = false, convHeard = "";
  let sharedAudio = null;         // one audio player, unlocked by a tap so iPhone lets it speak later

  // iPhone only plays sound that starts from a tap. The answer is spoken seconds after the tap
  // (after listening + translating), so "unlock" both the audio player and the phone voices right on the tap.
  function unlockAudio() {
    try {
      if (!sharedAudio) sharedAudio = new Audio();
      sharedAudio.src = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
      const p = sharedAudio.play(); if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  }

  function convLabel() {
    const btn = document.getElementById("conv-btn");
    if (!btn) return;
    btn.classList.toggle("them", convTurn === "them");
    btn.classList.remove("listening");
    btn.textContent = convTurn === "me" ? "🎤 My turn (English)" : "🎤 Their turn (" + CFG.name + ")";
  }
  function convStatus(t) { const s = document.getElementById("conv-status"); if (s) s.textContent = t || ""; }

  function convTap() {
    const btn = document.getElementById("conv-btn");
    if (convBusy) return;
    if (convRec) { convRec.stop(); return; }                 // tap again while listening = done talking
    unlockAudio();
    speechSynthesis.cancel(); if (player) { player.pause(); }   // stop the phone talking so the mic doesn't hear it
    const turn = convTurn;
    const rec = new SpeechRec();
    rec.lang = turn === "me" ? "en-US" : CFG.locales[LANG];
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    convHeard = "";
    convRec = rec;
    btn.classList.add("listening");
    btn.textContent = turn === "me" ? "● Listening (English)… tap when done" : "● " + CFG.listening + " (" + CFG.name + ")… tap when done";
    convStatus("");
    rec.onresult = e => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      convHeard = t.trim();
      document.getElementById("input").value = convHeard;       // show words as they're heard
    };
    rec.onerror = e => {
      const why = e && e.error;
      if (why === "not-allowed" || why === "service-not-allowed")
        convStatus("Microphone is blocked. On iPhone: Settings → Apps → Safari → Microphone → Allow, and make sure Dictation is on.");
      else if (why === "no-speech") convStatus("Didn't hear anything — tap and try again.");
      else if (why !== "aborted") convStatus("Couldn't listen (" + why + ") — tap to try again.");
    };
    rec.onend = async () => {
      convRec = null;
      if (!convHeard) { convLabel(); return; }                  // nothing heard → same person's turn again
      convBusy = true;
      btn.classList.remove("listening");
      btn.textContent = "Translating…";
      try {
        await go(turn === "me" ? "en" : LANG);                   // same translate path as the Translate button
        // their turn: the English is "their" voice, so use the Talking-to gender for it
        const saved = gender;
        if (turn === "them") gender = listener;
        try { speak(); } finally { gender = saved; }
        convTurn = turn === "me" ? "them" : "me";                // flip for the next tap
        convStatus(turn === "me" ? "✓ Said it in " + CFG.name + ". Hand it over — their turn." : "✓ Said it in English. Your turn.");
      } catch (e) {
        convStatus("Translation failed — check the connection and tap to try again.");
      } finally {
        convBusy = false;
        convLabel();
      }
    };
    try { rec.start(); }
    catch (e) { convRec = null; convLabel(); convStatus("Couldn't start the microphone — tap to try again."); }
  }
  function setupConversation() {
    const box = document.getElementById("conv");
    if (!box) return;
    // Hide where speech recognition isn't available or the page isn't secure (the mic needs https)
    if (!SpeechRec || !window.isSecureContext) { box.style.display = "none"; return; }
    box.style.display = "";
    convLabel();
  }
  // ---- 🔗 Share / back up this phone's setup as a link (no backslashes: this lives inside the page template) ----
  // The link itself carries everything (phrases, favorites, toggles), so nothing is stored on the server.
  function b64urlFromBytes(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(s).split("+").join("-").split("/").join("_").split("=").join("");
  }
  function bytesFromB64url(t) {
    let s = t.split("-").join("+").split("_").join("/");
    while (s.length % 4) s += "=";
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function packSetup(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) {
      const zipped = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
      return "z" + b64urlFromBytes(zipped);
    }
    return "p" + b64urlFromBytes(raw);
  }
  async function unpackSetup(code) {
    const bytes = bytesFromB64url(code.slice(1));
    let raw = bytes;
    if (code[0] === "z") {
      if (!window.DecompressionStream) throw new Error("This browser can't open compressed links");
      raw = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(raw));
  }
  async function makeShareLink() {
    const status = document.getElementById("share-status");
    const box = document.getElementById("share-link");
    let seen = null;
    try { seen = JSON.parse(localStorage.getItem(LK + "starterSeen") || "null"); } catch (e) {}
    const setup = { app: CFG.app, v: 1, phrases: myPhrases, favs: favs, starterSeen: seen,
                    gender: gender, you: you, listener: listener };
    const link = location.origin + CFG.path + "#setup=" + (await packSetup(setup));
    box.value = link; box.style.display = "block";
    const what = myPhrases.length + " phrases, " + favs.length + " favorites";
    if (navigator.share) {
      try { await navigator.share({ title: "My " + CFG.short + " setup", text: "Open this to copy my translator setup (" + what + ")", url: link });
            status.textContent = "Shared ✓ (" + what + ")"; return; } catch (e) { /* cancelled → fall through to copy */ }
    }
    try { await navigator.clipboard.writeText(link); status.textContent = "Link copied ✓ (" + what + ") — paste it into a message or Notes."; }
    catch (e) { box.select(); status.textContent = "Copy the link below (" + what + ")."; }
  }
  // Opening a #setup= link: ask, then load it onto this phone
  async function importFromLink() {
    const h = location.hash || "";
    if (h.indexOf("#setup=") !== 0) return;
    history.replaceState(null, "", location.pathname);       // tidy the address bar either way
    let data;
    try { data = await unpackSetup(h.slice(7)); } catch (e) { alert("Sorry, that setup link couldn't be opened."); return; }
    // a link made on another language's page (e.g. a French setup opened here) → open it on that page
    if (data && data.app !== CFG.app && CFG.apps[data.app]) { location.replace(CFG.apps[data.app] + h); return "moved"; }
    if (!data || data.app !== CFG.app || !Array.isArray(data.phrases)) { alert("That isn't a translator setup link."); return; }
    const n = data.phrases.length, f = Array.isArray(data.favs) ? data.favs.length : 0;
    if (!confirm("Load the shared setup on this phone?" + String.fromCharCode(10) + String.fromCharCode(10) +
                 n + " phrases and " + f + " favorites will REPLACE what's on this phone now.")) return;
    try {
      localStorage.setItem(LK + "myPhrases", JSON.stringify(data.phrases));
      localStorage.setItem(LK + "favs", JSON.stringify(Array.isArray(data.favs) ? data.favs : []));
      if (Array.isArray(data.starterSeen)) localStorage.setItem(LK + "starterSeen", JSON.stringify(data.starterSeen));
      else localStorage.removeItem(LK + "starterSeen");
      // "I am" is about you, so it's shared by every language; ты/вы, tu/vous and Talking to are per language
      ["gender", "you", "listener"].forEach(k => { if (data[k] === "m" || data[k] === "f" || data[k] === "t" || data[k] === "v") localStorage.setItem(k === "gender" ? k : LK + k, data[k]); });
    } catch (e) { alert("Couldn't save on this phone (private browsing?)."); return; }
    favs = Array.isArray(data.favs) ? data.favs : [];
    if (data.gender === "m" || data.gender === "f") gender = data.gender;
    if (data.you === "t" || data.you === "v") you = data.you;
    if (data.listener === "m" || data.listener === "f") listener = data.listener;
    importedNote = "Loaded the shared setup ✓ (" + n + " phrases, " + f + " favorites)";
  }
  let importedNote = "";

  function startApp() {           // start up once everything above is defined
    if (CFG.rtl) ["input", "out", "ph-" + LANG].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute("dir", "auto"); });
    setGender(gender);
    setYou(you);
    setListener(listener);
    loadPhrases();
    loadDecks();
    renderFavorites();
    setTimeout(showVoices, 300);
    setupConversation();
    if (importedNote) {
      document.getElementById("share-status").textContent = importedNote;
      document.getElementById("share").open = true;
    }
  }
  importFromLink().catch(() => {}).then(r => { if (r !== "moved") startApp(); });
  // a setup link opened while the app is already showing: reload so it gets loaded
  window.addEventListener("hashchange", () => { if ((location.hash || "").indexOf("#setup=") === 0) location.reload(); });

</script>
</body></html>`; }

// ---- Languages: each one gets its own page (Russian at /, French at /fr) built from the same template ----
// To add a language: a lang-xx.js file (its grammar fixes + learning decks), then an entry here.
const FR = require("./lang-fr.js");
const ZH = require("./lang-zh.js");
// Spanish, Italian and Portuguese share one translate pipeline (translateRomance below)
const ROMANCE = { es: require("./lang-es.js"), it: require("./lang-it.js"), pt: require("./lang-pt.js") };
const AR = require("./lang-ar.js");
const JA = require("./lang-ja.js");
// Arabic reads right to left: each text box and card follows the direction of its own text
const RTL_CSS = "  #out, .rs-word, .rs-ex, .ph-text div { unicode-bidi: plaintext; text-align: start; }\n" +
  "  #out { font-size: 24px; } .rs-word { font-size: 24px; } .rs-ex { font-size: 18px; }\n" +
  "  .rs-say { unicode-bidi: isolate; direction: ltr; display: inline-block; }\n";
const LANG_LIST = [
  { code: "ru", name: "Russian", flag: "🇷🇺", short: "RU ⇄ EN", path: "/", app: "ru-en", keyPrefix: "",
    youT: "ты", youV: "вы", phEx: "Без шуток", phrasesUrl: "/phrases", listening: "Слушаю",
    decks: [
      { id: "ruslang", list: "rs-list", count: "rs-count", url: "/ru-slang", title: "🇷🇺 Russian slang to learn",
        help: "Everyday slang young Russians use. Tap 🔊 to hear the word and the example." },
      { id: "formalru", list: "fr-list", count: "fr-count", url: "/formal-russian", title: "🇷🇺 Formal / respectful Russian",
        help: "Polite вы-forms for elders and people you don't know well. Tap 🔊 to hear the phrase and the example." },
      { id: "foodru", list: "fd-list", count: "fd-count", url: "/food-russian", title: "🍽️ Food &amp; eating out",
        help: "Ordering, restaurants, cafés and grocery shopping. Tap 🔊 to hear it." },
      { id: "textru", list: "tx-list", count: "tx-count", url: "/texting-russian", title: "💬 Texting &amp; chatting",
        help: "Informal texting shorthand young Russians use with friends — not for formal messages. 🔊 reads the full word." },
      { id: "travelru", list: "tv-list", count: "tv-count", url: "/travel-russian", title: "✈️ Travel &amp; everyday situations",
        help: "Directions, transport, pharmacy, shopping, hotels and asking for help." },
      { id: "proverbru", list: "pv-list", count: "pv-count", url: "/proverbs-russian", title: "📜 Proverbs &amp; sayings",
        help: "Sayings Russians really use — what they literally say and what they mean. 🔊 reads the proverb." },
      { id: "numbersru", list: "nm-list", count: "nm-count", url: "/numbers-russian", title: "🔢 Numbers &amp; counting",
        help: "Numbers, prices and telling the time — handy with the food and travel phrases." },
    ] },
  { code: "fr", name: "French", flag: "🇫🇷", short: "FR ⇄ EN", path: "/fr", app: "fr-en", keyPrefix: "fr_",
    youT: "tu", youV: "vous", phEx: "Pas de souci", phrasesUrl: "/fr/phrases", listening: "J'écoute",
    decks: FR.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "zh", name: "Mandarin", flag: "🇨🇳", short: "ZH ⇄ EN", path: "/zh", app: "zh-en", keyPrefix: "zh_",
    youT: "你", youV: "您", phEx: "没事", phrasesUrl: "/zh/phrases", listening: "我在听",
    decks: ZH.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "es", name: "Spanish", flag: "🇲🇽", short: "ES ⇄ EN", path: "/es", app: "es-en", keyPrefix: "es_",
    youT: "tú", youV: "usted", phEx: "No manches", phrasesUrl: "/es/phrases", listening: "Te escucho",
    decks: ROMANCE.es.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "it", name: "Italian", flag: "🇮🇹", short: "IT ⇄ EN", path: "/it", app: "it-en", keyPrefix: "it_",
    youT: "tu", youV: "Lei", phEx: "Ci sta", phrasesUrl: "/it/phrases", listening: "Ti ascolto",
    decks: ROMANCE.it.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", short: "PT ⇄ EN", path: "/pt", app: "pt-en", keyPrefix: "pt_",
    youT: "você", youV: "senhor(a)", phEx: "De boa", phrasesUrl: "/pt/phrases", listening: "Estou ouvindo",
    decks: ROMANCE.pt.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "ar", name: "Arabic", flag: "🇸🇦", short: "AR ⇄ EN", path: "/ar", app: "ar-en", keyPrefix: "ar_",
    youT: "أنت", youV: "حضرتك", phEx: "يلا", phrasesUrl: "/ar/phrases", listening: "أسمعك", rtl: true, extraCss: RTL_CSS,
    decks: AR.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
  { code: "ja", name: "Japanese", flag: "🇯🇵", short: "JA ⇄ EN", path: "/ja", app: "ja-en", keyPrefix: "ja_",
    youT: "タメ口", youV: "です・ます", phEx: "マジで", phrasesUrl: "/ja/phrases", listening: "聞いています", defYou: "v",
    decks: JA.DECKS.map(d => ({ id: d.id, list: d.list, count: d.count, url: d.url, title: d.title, help: d.help })) },
];
const LOCALES = { ru: "ru-RU", fr: "fr-FR", zh: "zh-CN", es: "es-MX", it: "it-IT", pt: "pt-BR", ar: "ar-SA", ja: "ja-JP", en: "en-US" };

function langNav(cur) {
  return '  <nav class="langs">' + LANG_LIST.map(l =>
    '<a href="' + l.path + '"' + (l.code === cur.code ? ' class="on" aria-current="page"' : "") + ">" + l.flag + " " + l.name + "</a>").join("") +
    "</nav>\n";
}
const NAV_CSS = "  .langs { display: flex; flex-wrap: wrap; gap: 6px; margin: -24px 0 4px; }\n" +
  "  .langs a { padding: 6px 12px; border: 1px solid #ddd; border-radius: 999px; color: #333; text-decoration: none; font-size: 15px; background: #f7f7f7; }\n" +
  "  .langs a.on { background: #222; color: #fff; border-color: #222; }\n";

function sectionsHtml(decks) {
  return decks.map(d => '<details class="phrases" id="' + d.id + '">\n' +
    "  <summary>" + d.title + ' <span id="' + d.count + '"></span></summary>\n' +
    '  <p class="ph-help">' + d.help + "</p>\n" +
    '  <div id="' + d.list + '"></div>\n' +
    "</details>\n").join("");
}

const PAGES = {};
for (const l of LANG_LIST) {
  const cfg = { name: l.name, short: l.short, app: l.app, path: l.path, phrasesUrl: l.phrasesUrl, listening: l.listening, rtl: !!l.rtl, defYou: l.defYou || "",
    locales: LOCALES, decks: l.decks.map(d => ({ url: d.url, list: d.list, count: d.count })),
    apps: Object.fromEntries(LANG_LIST.map(x => [x.app, x.path])) };
  PAGES[l.path] = renderPage(Object.assign({}, l, {
    nav: langNav(l), navCss: NAV_CSS, sectionsHtml: sectionsHtml(l.decks),
    cfgJson: JSON.stringify(cfg).replace(/</g, "\\u003c") }));
}


// ---- Female speaker: switch "я" + masculine past tense / short adjectives to feminine ----
// Google defaults to masculine ("Я хотел бы…"). This rewrites the forms tied to "я".
const SKIP = new Set(["не", "бы", "уже", "вчера", "сегодня", "тоже", "также", "так", "очень", "просто",
  "только", "ещё", "еще", "всегда", "никогда", "действительно", "давно", "недавно", "сразу", "наконец",
  "почти", "правда", "же", "ли", "сам", "сама", "здесь", "там", "раньше", "когда-то", "часто", "иногда"]);
const SHORT_ADJ = { "рад": "рада", "готов": "готова", "уверен": "уверена", "должен": "должна",
  "счастлив": "счастлива", "занят": "занята", "свободен": "свободна", "согласен": "согласна",
  "благодарен": "благодарна", "болен": "больна", "влюблён": "влюблена", "влюблен": "влюблена",
  "удивлён": "удивлена", "удивлен": "удивлена", "знаком": "знакома", "одинок": "одинока",
  "виноват": "виновата", "голоден": "голодна", "женат": "замужем", "сам": "сама" };
const IRREG = { "мог": "могла", "смог": "смогла", "помог": "помогла", "привык": "привыкла",
  "умер": "умерла", "лёг": "легла", "лег": "легла", "мёрз": "мёрзла", "замёрз": "замёрзла" };

function femVerb(w) {
  const lw = w.toLowerCase();
  let out = null;
  if (IRREG[lw]) out = IRREG[lw];
  else if (/ш[её]л$/.test(lw)) out = lw.replace(/ш[её]л$/, "шла");          // пришёл → пришла
  else if (/[аеёиыуя]лся$/.test(lw)) out = lw.replace(/лся$/, "лась");     // учился → училась
  else if (/[аеёиыуя]л$/.test(lw)) out = lw + "а";                         // хотел → хотела
  if (!out) return null;
  return w[0] === w[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

// ---- ты (casual) / вы (formal): make every "you" in the Russian match ----
// Google often mixes them in one translation ("Какая у вас еда? Что ты ешь?").
const TY_TO_VY = { "ты": "вы", "тебя": "вас", "тебе": "вам", "тобой": "вами", "тобою": "вами",
  "твой": "ваш", "твоя": "ваша", "твоё": "ваше", "твое": "ваше", "твои": "ваши", "твоего": "вашего",
  "твоей": "вашей", "твоему": "вашему", "твоих": "ваших", "твоим": "вашим", "твоими": "вашими",
  "твою": "вашу", "твоём": "вашем", "твоем": "вашем" };
const VY_TO_TY = { "вы": "ты", "вас": "тебя", "вам": "тебе", "вами": "тобой", "ваш": "твой",
  "ваша": "твоя", "ваше": "твоё", "ваши": "твои", "вашего": "твоего", "вашей": "твоей",
  "вашему": "твоему", "ваших": "твоих", "вашим": "твоим", "вашими": "твоими", "вашу": "твою", "вашем": "твоём" };
// Verbs that don't follow the usual endings
const VERB_TY_TO_VY = { "ешь": "едите", "съешь": "съедите", "хочешь": "хотите", "бежишь": "бежите" };
const VERB_VY_TO_TY = Object.fromEntries(Object.entries(VERB_TY_TO_VY).map(([a, b]) => [b, a]));
// Common casual commands → polite form (скажи → скажите)
const IMPERATIVES = ["скажи", "подожди", "извини", "прости", "посмотри", "послушай", "попробуй", "давай",
  "позвони", "напиши", "приходи", "иди", "помоги", "расскажи", "покажи", "дай", "возьми", "будь", "знай",
  "представь", "проверь", "садись", "заходи", "звони", "пиши", "ешь", "пей", "отдыхай", "здравствуй"];
const YOU_SKIP = new Set(["не", "бы", "уже", "обычно", "тоже", "также", "часто", "сейчас", "сегодня",
  "же", "ли", "всегда", "никогда", "ещё", "еще", "так", "очень", "действительно", "вообще", "вчера", "завтра"]);

function matchCase(src, out) {
  if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
  return src[0] === src[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

function verbToVy(w) {                 // ты-form → вы-form
  if (VERB_TY_TO_VY[w]) return VERB_TY_TO_VY[w];
  if (/[её]шься$/.test(w)) return w.replace(/([её])шься$/, "$1тесь");
  if (/ишься$/.test(w)) return w.replace(/ишься$/, "итесь");
  if (/[её]шь$/.test(w) && w.length > 3) return w.replace(/([её])шь$/, "$1те");
  if (/ишь$/.test(w) && w.length > 3) return w.replace(/ишь$/, "ите");
  return null;
}
function verbToTy(w) {                 // вы-form → ты-form
  if (VERB_VY_TO_TY[w]) return VERB_VY_TO_TY[w];
  if (/[её]тесь$/.test(w)) return w.replace(/([её])тесь$/, "$1шься");
  if (/итесь$/.test(w)) return w.replace(/итесь$/, "ишься");
  if (/[её]те$/.test(w)) return w.replace(/([её])те$/, "$1шь");
  if (/ите$/.test(w)) return w.replace(/ите$/, "ишь");
  return null;
}
function pastToVy(w) {                 // ты был/была → вы были
  if (/лся$|лась$/.test(w)) return w.replace(/(лся|лась)$/, "лись");
  if (/[аеёиыуяо]л[ао]?$/.test(w)) return w.replace(/л[ао]?$/, "ли");
  return null;
}
function pastToTy(w, l) {              // вы были → ты был / была (l = who you're talking to)
  if (/лись$/.test(w)) return w.replace(/лись$/, l === "f" ? "лась" : "лся");
  if (/[аеёиыуяо]ли$/.test(w)) return w.replace(/ли$/, l === "f" ? "ла" : "л");
  return null;
}
// вы готовы → ты готов / готова
const SHORT_PL = { "рады": ["рад", "рада"], "готовы": ["готов", "готова"], "уверены": ["уверен", "уверена"],
  "должны": ["должен", "должна"], "счастливы": ["счастлив", "счастлива"], "заняты": ["занят", "занята"],
  "свободны": ["свободен", "свободна"], "согласны": ["согласен", "согласна"], "знакомы": ["знаком", "знакома"],
  "голодны": ["голоден", "голодна"], "больны": ["болен", "больна"], "одиноки": ["одинок", "одинока"],
  "правы": ["прав", "права"], "довольны": ["доволен", "довольна"], "живы": ["жив", "жива"],
  "уверенны": ["уверен", "уверена"], "сами": ["сам", "сама"] };
// ты готов / готова → вы готовы
const SHORT_SG_TO_PL = {};
for (const [pl, [m, f]] of Object.entries(SHORT_PL)) { SHORT_SG_TO_PL[m] = SHORT_SG_TO_PL[m] || pl; SHORT_SG_TO_PL[f] = SHORT_SG_TO_PL[f] || pl; }

function setFormality(ru, mode, l) {
  const PRON = mode === "v" ? TY_TO_VY : VY_TO_TY;
  const SUBJ = mode === "v" ? "ты" : "вы";
  return ru.split(/([.!?…]+\s*)/).map((sentence, si) => {
    if (si % 2) return sentence;        // punctuation between sentences
    let firstInSentence = true;
    return sentence.split(/([,;:—–]+\s*)/).map((clause, ci) => {
      if (ci % 2) return clause;
      const parts = clause.split(/(\s+)/);
      const idx = [];                   // positions of real words
      parts.forEach((p, i) => { if (i % 2 === 0 && /[а-яё]/i.test(p)) idx.push(i); });
      const core = i => parts[i].match(/^([^а-яё]*)([а-яё-]+)([^а-яё]*)$/i);
      const lower = i => { const m = core(i); return m ? m[2].toLowerCase() : ""; };
      const put = (i, w) => { const m = core(i); parts[i] = m[1] + matchCase(m[2], w) + m[3]; };
      const subjAt = idx.findIndex(i => lower(i) === SUBJ);

      // 1. The verb that goes with ты/вы (just after it, or just before it in "Знаете ли вы…")
      if (subjAt >= 0) {
        for (let k = subjAt + 1; k < idx.length; k++) {
          const w = lower(idx[k]);
          if (YOU_SKIP.has(w)) continue;
          if (mode === "t" && SHORT_PL[w]) { put(idx[k], SHORT_PL[w][l === "f" ? 1 : 0]); break; }
          if (mode === "v" && SHORT_SG_TO_PL[w]) { put(idx[k], SHORT_SG_TO_PL[w]); break; }
          const f = mode === "v" ? (verbToVy(w) || pastToVy(w)) : (verbToTy(w) || pastToTy(w, l));
          if (f) {
            put(idx[k], f);
            // "вы были рады" → "ты был рад/была рада"
            const nx = idx[k + 1] !== undefined ? lower(idx[k + 1]) : "";
            if (mode === "t" && SHORT_PL[nx]) put(idx[k + 1], SHORT_PL[nx][l === "f" ? 1 : 0]);
            if (mode === "v" && SHORT_SG_TO_PL[nx]) put(idx[k + 1], SHORT_SG_TO_PL[nx]);
          }
          break;
        }
        for (let k = subjAt - 1; k >= 0; k--) {
          const w = lower(idx[k]);
          if (YOU_SKIP.has(w)) continue;
          const f = mode === "v" ? verbToVy(w) : verbToTy(w);
          if (f) put(idx[k], f);
          break;
        }
      }
      // 1b. Google already used ты: "ты был" → "ты была" when talking to a woman
      const tyAt = idx.findIndex(i => lower(i) === "ты");
      if (mode === "t" && l === "f" && tyAt >= 0 && subjAt < 0) {
        for (let k = tyAt + 1; k < idx.length; k++) {
          const w = lower(idx[k]);
          if (YOU_SKIP.has(w)) continue;
          if (SHORT_ADJ[w] && w !== "женат") { put(idx[k], SHORT_ADJ[w]); break; }
          const f = femVerb(w);
          if (f) {
            put(idx[k], f);
            const nx = idx[k + 1] !== undefined ? lower(idx[k + 1]) : "";
            if (SHORT_ADJ[nx] && nx !== "женат") put(idx[k + 1], SHORT_ADJ[nx]);
          }
          break;
        }
      }
      // 2. Present-tense ты-verbs anywhere (endings -ешь/-ишь only ever mean "you")
      if (mode === "v") idx.forEach(i => { const f = verbToVy(lower(i)); if (f && /шь(ся)?$/.test(lower(i))) put(i, f); });

      // 3. Commands at the start of a sentence (Скажи / Скажите)
      if (firstInSentence && idx.length && subjAt < 0) {
        const i = idx[0], w = lower(i);
        if (mode === "v" && IMPERATIVES.includes(w)) put(i, w + "те");
        if (mode === "t" && w !== "пожалуйста" && /(ите|йте|ьте)$/.test(w) && w.length > 4)
          put(i, w.replace(/ите$/, "и").replace(/йте$/, "й").replace(/ьте$/, "ь"));
      }
      if (idx.length) firstInSentence = false;

      // 4. The pronouns themselves (ты/тебя/твой… ↔ вы/вас/ваш…)
      idx.forEach(i => { const w = lower(i); if (PRON[w]) put(i, PRON[w]); });
      return parts.join("");
    }).join("");
  }).join("");
}

function makeFemale(ru) {
  // Work clause by clause; only touch words that follow "я".
  return ru.split(/([.,!?;:—–\n]+)/).map(clause => {
    const parts = clause.split(/(\s+)/);
    const words = parts.filter((_, i) => i % 2 === 0);
    const start = words.findIndex(w => w.toLowerCase() === "я");
    if (start < 0) return clause;
    let expectVerb = true;
    for (let i = start + 1; i < words.length; i++) {
      const lw = words[i].toLowerCase();
      if (!lw) continue;
      if (SKIP.has(lw) && !(lw === "сам")) continue;
      if (SHORT_ADJ[lw]) { words[i] = SHORT_ADJ[lw]; expectVerb = false; continue; }
      if (expectVerb) {
        const f = femVerb(words[i]);
        if (f) { words[i] = f; expectVerb = false; continue; }
        break;                                   // first real word isn't a verb → stop
      }
      if (lw === "и") { expectVerb = true; continue; }   // "я пришла и увидела"
      break;
    }
    let k = 0;
    return parts.map((p, i) => (i % 2 === 0 ? words[k++] : p)).join("");
  }).join("");
}


// ---- Names & titles ----
// Names to always spell your way. Add more: "English": "Русский"
const NAMES = {
  "Cami": "Ками",
  "Sophie": "Софи",
};

// Text in "quotes", “smart quotes” or «guillemets» is kept exactly as typed.
function protectTitles(text) {
  const titles = [];
  // Quotes around the whole message aren't a title — just drop them and translate normally
  const whole = text.trim().match(/^(?:"([^"]+)"|“([^”]+)”|«([^»]+)»|„([^“”]+)[“”])$/);
  if (whole) return { text: whole[1] || whole[2] || whole[3] || whole[4], titles };
  const safe = text.replace(/"([^"]+)"|“([^”]+)”|«([^»]+)»/g, (all, a, b, c) => {
    const inner = a || b || c;
    // A quoted full sentence ("How are you?") is speech, not a title — translate it
    if (/[.?!]\s*$/.test(inner) || /[.?!]\s+\S/.test(inner)) return all;
    titles.push(inner);
    return "ZQX" + (titles.length - 1);
  });
  return { text: safe, titles };
}

function restoreTitles(out, titles, to) {
  const [open, close] = to === "ru" ? ["«", "»"] : to === "fr" ? ["« ", " »"] : to === "zh" ? ["《", "》"] : to === "ar" ? ["«", "»"] : to === "ja" ? ["「", "」"] : ["“", "”"];
  return out
    .replace(/ZQX(\d+)/g, (_, i) => open + titles[+i] + close)
    // Google sometimes lowercases the start of a sentence next to a placeholder ("? мне")
    .replace(/(^|[.!?]\s+)([a-zа-яё])/g, (_, pre, c) => pre + c.toUpperCase());
}

// Keep names spelled consistently in both directions (Ками → Cami, not Kami)
function fixNames(out, to) {
  for (const [en, ru] of Object.entries(NAMES)) {
    if (to === "en") {
      // Google's transliteration of the Russian spelling, e.g. Kami, Sofi
      out = out.replace(new RegExp("\\b(" + translit(ru) + ")\\b", "g"), en);
    }
  }
  return out;
}

function translit(ru) {
  const m = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",
    н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ы:"y",э:"e",
    ю:"yu",я:"ya",ь:"",ъ:"" };
  const s = [...ru.toLowerCase()].map(c => m[c] ?? c).join("");
  return s[0].toUpperCase() + s.slice(1);
}

async function google(text, from, to) {
  const g = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + from + "&tl=" + to + "&dt=t&q=" + encodeURIComponent(text);
  const d = await (await fetch(g)).json();
  return d[0].map(s => s[0]).join("");
}


// ---- Microsoft voices (msedge-tts add-on) ----
// Install once in this folder:  npm install msedge-tts
const TTS_VOICES = {
  m: { ru: "ru-RU-DmitryNeural",   fr: "fr-FR-HenriNeural",  zh: "zh-CN-YunxiNeural",    es: "es-MX-JorgeNeural",
       it: "it-IT-DiegoNeural", pt: "pt-BR-AntonioNeural",   ar: "ar-SA-HamedNeural",  ja: "ja-JP-KeitaNeural",  en: "en-US-GuyNeural" },
  f: { ru: "ru-RU-SvetlanaNeural", fr: "fr-FR-DeniseNeural", zh: "zh-CN-XiaoxiaoNeural", es: "es-MX-DaliaNeural",
       it: "it-IT-ElsaNeural",  pt: "pt-BR-FranciscaNeural", ar: "ar-SA-ZariyahNeural", ja: "ja-JP-NanamiNeural", en: "en-US-JennyNeural" },
};
let edge = null;
import("msedge-tts")
  .then(m => { edge = m; console.log("Microsoft voices: on"); })
  .catch(() => console.log("Microsoft voices: off (run  npm install msedge-tts  to turn on)"));

const ttsCache = new Map();   // repeat taps on Speak don't re-download

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function synth(text, voice) {
  const tts = new edge.MsEdgeTTS();
  try {
    await tts.setMetadata(voice, edge.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(xmlEscape(text));
    return await new Promise((resolve, reject) => {
      const bufs = [];
      const timer = setTimeout(() => reject(new Error("TTS timeout")), 15000);
      audioStream.on("data", b => bufs.push(b));
      audioStream.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(bufs)); });
      audioStream.on("error", e => { clearTimeout(timer); reject(e); });
    });
  } finally {
    try { tts.close(); } catch (e) {}
  }
}

// Microsoft sometimes drops a connection mid-clip; try again up to 2 more times
async function synthRetry(text, voice) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await synth(text, voice); }
    catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 300 * (attempt + 1))); }
  }
  throw lastErr;
}

async function handleTTS(req, u, res) {
  const g = u.searchParams.get("g") === "f" ? "f" : "m";
  let parts;
  try { parts = JSON.parse(u.searchParams.get("d") || "[]"); } catch (e) { parts = []; }
  parts = parts.filter(p => Array.isArray(p) && TTS_VOICES.m[p[0]] && typeof p[1] === "string" && p[1].trim())
               .slice(0, 20);
  if (!edge || !parts.length) { res.writeHead(503); return res.end(); }
  const key = g + JSON.stringify(parts);
  try {
    // iPhone asks for the same clip 2–3 times at once; share one download instead of
    // opening several Microsoft connections together (which made Microsoft drop them)
    if (!ttsCache.has(key)) {
      const job = (async () => {
        const clips = [];
        for (const [lang, text] of parts) clips.push(await synthRetry(text.slice(0, 1000), TTS_VOICES[g][lang]));
        return Buffer.concat(clips);        // MP3 clips of the same format play back-to-back
      })();
      ttsCache.set(key, job);
      job.catch(() => ttsCache.delete(key)); // don't keep failures
      if (ttsCache.size > 100) ttsCache.delete(ttsCache.keys().next().value);
    }
    const mp3 = await ttsCache.get(key);
    // iPhone Safari asks for audio in byte ranges and won't play it otherwise
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (m) {
      let start = m[1] === "" ? Math.max(0, mp3.length - Number(m[2])) : Number(m[1]);
      let end = m[1] !== "" && m[2] !== "" ? Math.min(Number(m[2]), mp3.length - 1) : mp3.length - 1;
      if (start > end || start >= mp3.length) {
        res.writeHead(416, { "Content-Range": "bytes */" + mp3.length });
        return res.end();
      }
      res.writeHead(206, { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes",
        "Content-Range": "bytes " + start + "-" + end + "/" + mp3.length, "Content-Length": end - start + 1 });
      return res.end(mp3.subarray(start, end + 1));
    }
    res.writeHead(200, { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Content-Length": mp3.length });
    res.end(mp3);
  } catch (e) {
    console.log("TTS failed:", e.message);
    res.writeHead(502);
    res.end();
  }
}


// ---- My phrases (your slang) — saved in phrases.json next to this file ----
const PHRASES_FILE = path.join(__dirname, "phrases.json");
const STARTER_PHRASES = [
  { en: "How do you eat?", ru: "Как ты питаешься?" },
  { en: "What's up?", ru: "Как дела?" },
  { en: "No worries", ru: "Не парься" },
  { en: "See ya", ru: "Увидимся" },
  { en: "I'm down", ru: "Я за" },
];
let phrases = STARTER_PHRASES;
try { phrases = JSON.parse(fs.readFileSync(PHRASES_FILE, "utf8")); }
catch (e) { try { fs.writeFileSync(PHRASES_FILE, JSON.stringify(phrases, null, 2)); } catch (e2) {} }

const norm = s => s.replace(/[’‘`]/g, "'").replace(/ё/g, "е").replace(/Ё/g, "Е");
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function phraseRegex(p) {
  // match the words, ignoring end punctuation and case; never inside a bigger word
  const core = norm(p).trim().replace(/[.!?…,]+$/, "").replace(/^[¿¡]+/, "");
  const body = core.split(/\s+/).map(reEscape).join("\\s+");
  // Chinese: no spaces between words, so no word-edge check (and its own end punctuation is optional)
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(core)) return new RegExp(core.replace(/[。！？，～]+$/, "").split(/\s+/).map(reEscape).join("\\s*"), "giu");
  return new RegExp("(?<![\\p{L}\\p{N}'])" + body + "(?![\\p{L}\\p{N}'])", "giu");
}

function cleanPhrases(list, tg = "ru") {
  if (!Array.isArray(list)) return null;
  return list.filter(p => p && typeof p.en === "string" && typeof p[tg] === "string" && p.en.trim() && p[tg].trim())
    .slice(0, 500).map(p => Object.assign({ en: p.en.trim().slice(0, 200), [tg]: p[tg].trim().slice(0, 200) },
      p.oneWay ? { oneWay: true } : {}, p.alone ? { alone: true } : {}));
}

function protectPhrases(text, from, phrases, to = from === "en" ? "ru" : "en") {
  const hits = [];
  let t = norm(text);
  // longest phrases first, so "how do you eat" wins over "you eat"
  // oneWay phrases (e.g. lowkey → немного) only apply English→Russian
  // "alone" phrases (yes / no / thanks) only count when they are the whole message,
  // so "I have no idea" doesn't turn into «Нет»
  const bareMsg = s => norm(s).trim().replace(/[.!?…,]+$/, "").replace(/^[¿¡]+/, "").trim().toLowerCase();
  const whole = bareMsg(text);
  const tg = from === "en" ? to : from;
  const list = phrases.filter(p => p.en && p[tg] && !(p.oneWay && from !== "en") && (!p.alone || bareMsg(p[from]) === whole))
    .slice().sort((a, b) => b[from].length - a[from].length);
  for (const p of list) {
    t = t.replace(phraseRegex(p[from]), () => { hits.push(p); return "ZQP" + (hits.length - 1); });
  }
  return { text: t, hits };
}
const CAP_RU = /(^|[.!?]\s+)([a-zа-яё])/g;
const CAP_FR = /(^|[.!?]\s+)([a-zà-ÿœ])/g;    // French/English: also capitalise é, à…
const CAP_ES = /((?:^|[.!?]\s+)[¿¡]?)([a-zà-ÿ])/g;   // Spanish: also after an opening ¿ or ¡
function restorePhrases(out, hits, to, cap = CAP_RU) {
  return out.replace(/ZQP(\d+)/g, (_, i) => {
    let s = ((hits[+i] && hits[+i][to]) || "").trim().replace(/[.!?…]+$/, "");  // punctuation comes from your message
    // lower-case the first letter; it's capitalised again below if it starts a sentence
    if (s.length > 1 && s[1] === s[1].toLowerCase() && !/^I\b/.test(s)) s = s[0].toLowerCase() + s.slice(1);
    return s;
  }).replace(cap, (_, pre, c) => pre + c.toUpperCase());
}

// ---- Russian slang to learn — saved in russian-slang.json (edit it to add your own) ----
const RU_SLANG_FILE = path.join(__dirname, "russian-slang.json");
const RU_SLANG = [
  { ru: "Чё как?", say: "chyo kak", en: "What's up? / How's it going?", ex: "Привет! Чё как?", exEn: "Hey! What's up?" },
  { ru: "Здорово!", say: "zdaróva", en: "Hey! (casual hello, mostly between friends)", ex: "Здорово, бро!", exEn: "Hey, bro!" },
  { ru: "Как сам? / Как сама?", say: "kak sam / kak samá", en: "How are you? (to a guy / to a girl)", ex: "Давно не виделись! Как сама?", exEn: "Long time no see! How are you?" },
  { ru: "Норм", say: "norm", en: "Fine, OK, decent", ex: "— Как фильм? — Норм.", exEn: "— How was the movie? — It was OK." },
  { ru: "Круто", say: "krúta", en: "Cool, awesome", ex: "Круто выглядишь!", exEn: "You look cool!" },
  { ru: "Огонь", say: "agón'", en: "Fire, amazing", ex: "Этот трек — огонь!", exEn: "This track is fire!" },
  { ru: "Имба", say: "ímba", en: "OP, insanely good (from gaming)", ex: "Новый телефон — просто имба.", exEn: "The new phone is just insane." },
  { ru: "Жесть", say: "zhest'", en: "Crazy, intense, harsh", ex: "Жесть, какие пробки сегодня!", exEn: "Traffic is crazy today!" },
  { ru: "Капец", say: "kapéts", en: "Damn / total disaster (mild)", ex: "Капец, я опоздал!", exEn: "Damn, I'm late!" },
  { ru: "Блин", say: "blin", en: "Dang, shoot (mild; literally 'pancake')", ex: "Блин, забыл ключи.", exEn: "Dang, I forgot my keys." },
  { ru: "Кринж", say: "krinzh", en: "Cringe", ex: "Это видео — такой кринж.", exEn: "That video is so cringe." },
  { ru: "Зашквар", say: "zashkvár", en: "Embarrassing, totally uncool", ex: "Носить это — зашквар.", exEn: "Wearing that is embarrassing." },
  { ru: "Вайб", say: "vayp", en: "Vibe", ex: "У этого места классный вайб.", exEn: "This place has a great vibe." },
  { ru: "Краш", say: "krash", en: "Crush (someone you like)", ex: "Он мой краш.", exEn: "He's my crush." },
  { ru: "Ну такое", say: "nu takóye", en: "Meh, so-so", ex: "— Понравилось? — Ну такое.", exEn: "— Did you like it? — Meh." },
  { ru: "Прикольно", say: "prikól'na", en: "Cool, fun, funny", ex: "Прикольно придумал!", exEn: "Cool idea!" },
  { ru: "Прикол", say: "prikól", en: "A joke, a funny thing", ex: "В чём прикол?", exEn: "What's the joke? / What's the point?" },
  { ru: "Ржу не могу", say: "rzhu ne magú", en: "LMAO, I can't stop laughing", ex: "Ахаха, ржу не могу!", exEn: "Hahaha, I'm dying!" },
  { ru: "Рофл", say: "rofl", en: "A joke, trolling (from ROFL)", ex: "Это был рофл, не обижайся.", exEn: "It was a joke, don't be mad." },
  { ru: "Сто пудов", say: "sto pudóf", en: "For sure, 100%", ex: "Он придёт, сто пудов.", exEn: "He's coming, for sure." },
  { ru: "Изи", say: "ízi", en: "Easy", ex: "Экзамен был изи.", exEn: "The exam was easy." },
  { ru: "Го!", say: "go", en: "Let's go!", ex: "Го в кино!", exEn: "Let's go to the movies!" },
  { ru: "Тусить", say: "tusít'", en: "To hang out, to party", ex: "Пойдём тусить в субботу?", exEn: "Wanna hang out on Saturday?" },
  { ru: "Чилить", say: "chílit'", en: "To chill", ex: "Сегодня просто чилю дома.", exEn: "Just chilling at home today." },
  { ru: "Залипать", say: "zalipát'", en: "To zone out on / binge something", ex: "Опять залип в телефоне.", exEn: "Zoned out on my phone again." },
  { ru: "Шарить", say: "shárit'", en: "To know your stuff, to get it", ex: "Ты шаришь в машинах?", exEn: "Do you know much about cars?" },
  { ru: "Тащить", say: "tashchít'", en: "To carry (the team), do great", ex: "Ты сегодня тащишь!", exEn: "You're killing it today!" },
  { ru: "Бесит", say: "bésit", en: "It annoys me / drives me nuts", ex: "Меня это бесит.", exEn: "That drives me nuts." },
  { ru: "Не парься", say: "ne pár'sya", en: "Don't worry about it", ex: "Не парься, всё будет норм.", exEn: "Don't worry, it'll be fine." },
  { ru: "Сорян", say: "saryán", en: "Sorry (casual)", ex: "Сорян, не увидел сообщение.", exEn: "Sorry, didn't see your message." },
  { ru: "Чувак", say: "chuvák", en: "Dude", ex: "Чувак, это гениально!", exEn: "Dude, that's genius!" },
  { ru: "Братан", say: "bratán", en: "Bro", ex: "Спасибо, братан!", exEn: "Thanks, bro!" },
  { ru: "Чел", say: "chel", en: "A guy, a person ('dude')", ex: "Какой-то чел мне написал.", exEn: "Some guy texted me." },
  { ru: "Типа", say: "típa", en: "Like, kind of (filler word)", ex: "Он типа обиделся.", exEn: "He's, like, offended." },
  { ru: "Короче", say: "karóche", en: "Anyway, long story short", ex: "Короче, я опоздал.", exEn: "Long story short, I was late." },
  { ru: "Ваще", say: "vashché", en: "Totally / at all (casual 'вообще')", ex: "Ваще не понял.", exEn: "Didn't get it at all." },
  { ru: "Ща", say: "shcha", en: "One sec / right now (casual 'сейчас')", ex: "Ща приду.", exEn: "Be right there." },
  { ru: "Давай", say: "daváy", en: "OK / see ya (to end a chat)", ex: "Ладно, давай, пока!", exEn: "OK, see ya, bye!" },
  { ru: "Хайп", say: "khayp", en: "Hype", ex: "Столько хайпа вокруг этого фильма.", exEn: "So much hype around this movie." },
  { ru: "Имхо", say: "ímkha", en: "IMO (in my opinion)", ex: "Имхо, первая часть лучше.", exEn: "IMO, the first part is better." },
];
let ruSlang = RU_SLANG;
try { ruSlang = JSON.parse(fs.readFileSync(RU_SLANG_FILE, "utf8")); }
catch (e) { try { fs.writeFileSync(RU_SLANG_FILE, JSON.stringify(RU_SLANG, null, 2)); } catch (e2) {} }

// ---- Formal / respectful Russian — saved in formal-russian.json (edit it to add your own) ----
const FORMAL_RU_FILE = path.join(__dirname, "formal-russian.json");
const FORMAL_RU = [
  { ru: "Здравствуйте", say: "zdrástvuytye", en: "Hello (formal, the safe choice with anyone older)", ex: "Здравствуйте, Анна Петровна!", exEn: "Hello, Anna Petrovna!" },
  { ru: "Иван Петрович / Анна Петровна", say: "iván pyetróvich / ánna pyetróvna", en: "How to address elders: first name + patronymic (father's name)", ex: "Иван Петрович, можно вас на минутку?", exEn: "Ivan Petrovich, may I have a minute?" },
  { ru: "Доброе утро", say: "dóbraye útra", en: "Good morning", ex: "Доброе утро! Как вам спалось?", exEn: "Good morning! How did you sleep?" },
  { ru: "Добрый день", say: "dóbryy dyen'", en: "Good afternoon / Good day", ex: "Добрый день! Чем могу помочь?", exEn: "Good afternoon! How can I help?" },
  { ru: "Добрый вечер", say: "dóbryy vyéchyer", en: "Good evening", ex: "Добрый вечер, проходите, пожалуйста.", exEn: "Good evening, please come in." },
  { ru: "Как вы поживаете?", say: "kak vy pazhyváyetye", en: "How are you doing? (formal)", ex: "Давно не виделись! Как вы поживаете?", exEn: "Long time no see! How are you doing?" },
  { ru: "Как ваше здоровье?", say: "kak váshe zdaróv'ye", en: "How is your health? (caring, often asked of elders)", ex: "Как ваше здоровье? Всё хорошо?", exEn: "How's your health? Is everything OK?" },
  { ru: "Как вас зовут?", say: "kak vas zavút", en: "What is your name? (formal)", ex: "Простите, как вас зовут?", exEn: "Excuse me, what is your name?" },
  { ru: "Разрешите представиться", say: "razryeshýtye pryedstávit'sya", en: "Allow me to introduce myself", ex: "Разрешите представиться: меня зовут Ками.", exEn: "Allow me to introduce myself: my name is Cami." },
  { ru: "Очень приятно", say: "óchyen' priyátna", en: "Nice to meet you (reply after a name)", ex: "— Меня зовут Ольга. — Очень приятно!", exEn: "— My name is Olga. — Nice to meet you!" },
  { ru: "Приятно познакомиться", say: "priyátna paznakómit'sya", en: "Pleased to meet you", ex: "Приятно с вами познакомиться.", exEn: "Pleased to meet you." },
  { ru: "Рад / Рада с вами познакомиться", say: "rat / ráda s vámi paznakómit'sya", en: "Glad to meet you (рад if you're a man, рада if you're a woman)", ex: "Я очень рада с вами познакомиться.", exEn: "I'm very glad to meet you. (said by a woman)" },
  { ru: "Извините", say: "izvinítye", en: "Excuse me / Sorry", ex: "Извините, вы не подскажете, который час?", exEn: "Excuse me, could you tell me the time?" },
  { ru: "Простите", say: "prastítye", en: "Pardon me / Forgive me", ex: "Простите за опоздание.", exEn: "Sorry for being late." },
  { ru: "Прошу прощения", say: "prashú prashchyéniya", en: "I beg your pardon / My apologies", ex: "Прошу прощения за беспокойство.", exEn: "Sorry to bother you." },
  { ru: "Будьте добры", say: "bút'tye dabrý", en: "Would you be so kind…", ex: "Будьте добры, передайте соль.", exEn: "Would you kindly pass the salt." },
  { ru: "Будьте любезны", say: "bút'tye lyubyézny", en: "Would you be so kind… (very polite)", ex: "Будьте любезны, закройте дверь.", exEn: "Would you be so kind as to close the door." },
  { ru: "Не могли бы вы…?", say: "nye maglí by vy", en: "Could you please…?", ex: "Не могли бы вы говорить помедленнее?", exEn: "Could you speak a little more slowly?" },
  { ru: "Подскажите, пожалуйста", say: "patskazhýtye, pazhálusta", en: "Could you tell me, please…", ex: "Подскажите, пожалуйста, где здесь аптека?", exEn: "Could you tell me where the pharmacy is?" },
  { ru: "Можно вас спросить?", say: "mózhna vas sprasít'", en: "May I ask you something?", ex: "Можно вас спросить? Вы здесь живёте?", exEn: "May I ask you something? Do you live here?" },
  { ru: "Вы не против…?", say: "vy nye prótif", en: "Do you mind…?", ex: "Вы не против, если я сяду здесь?", exEn: "Do you mind if I sit here?" },
  { ru: "Пожалуйста", say: "pazhálusta", en: "Please / You're welcome", ex: "— Спасибо! — Пожалуйста.", exEn: "— Thank you! — You're welcome." },
  { ru: "Спасибо большое", say: "spasíba bal'shóye", en: "Thank you very much", ex: "Спасибо большое за помощь!", exEn: "Thank you very much for your help!" },
  { ru: "Благодарю вас", say: "blagadaryú vas", en: "I thank you (very respectful)", ex: "Благодарю вас за гостеприимство.", exEn: "Thank you for your hospitality." },
  { ru: "Приятного аппетита", say: "priyátnava appyetíta", en: "Enjoy your meal", ex: "Всё готово. Приятного аппетита!", exEn: "Everything's ready. Enjoy your meal!" },
  { ru: "Поздравляю вас", say: "pazdravlyáyu vas", en: "Congratulations (to you)", ex: "Поздравляю вас с днём рождения!", exEn: "Happy birthday to you!" },
  { ru: "С праздником!", say: "s práznikam", en: "Happy holiday!", ex: "С праздником вас! Всего самого доброго!", exEn: "Happy holiday! All the very best!" },
  { ru: "Примите мои соболезнования", say: "primítye mayí sabalyéznavaniya", en: "Please accept my condolences", ex: "Примите мои искренние соболезнования.", exEn: "Please accept my sincere condolences." },
  { ru: "Берегите себя", say: "byeryegítye syebyá", en: "Take care of yourself", ex: "Берегите себя и своё здоровье.", exEn: "Take care of yourself and your health." },
  { ru: "Всего доброго", say: "fsyevó dóbrava", en: "All the best (a warm goodbye)", ex: "Спасибо за всё. Всего доброго!", exEn: "Thank you for everything. All the best!" },
  { ru: "Всего хорошего", say: "fsyevó kharóshyeva", en: "All the best / Have a good day", ex: "До встречи! Всего хорошего!", exEn: "See you! Have a good day!" },
  { ru: "Мирного вам дня", say: "mírnava vam dnya", en: "Have a peaceful day (warm, respectful)", ex: "Спасибо за всё. Мирного вам дня!", exEn: "Thank you for everything. Have a peaceful day!" },
  { ru: "До свидания", say: "da svidániya", en: "Goodbye (formal)", ex: "До свидания, ждём вас снова!", exEn: "Goodbye, we hope to see you again!" },
];
let formalRu = FORMAL_RU;
try { formalRu = JSON.parse(fs.readFileSync(FORMAL_RU_FILE, "utf8")); }
catch (e) { try { fs.writeFileSync(FORMAL_RU_FILE, JSON.stringify(FORMAL_RU, null, 2)); } catch (e2) {} }

// ---- Four more learning sections (each saved in its own .json file; edit to add your own) ----
// Fields: ru, say (how to pronounce), en (meaning), ex/exEn (example + English),
//         lit (proverbs: literal meaning), speak (what the 🔊 button says, if different from ru)
const FOOD_RU = [
  { ru: "Я бы хотел / хотела заказать…", say: "ya by khatyél / khatyéla zakazát'", en: "I'd like to order… (хотел if you're a man, хотела if you're a woman)", ex: "Я бы хотела заказать борщ.", exEn: "I'd like to order the borscht. (said by a woman)" },
  { ru: "Меню, пожалуйста", say: "myenyú, pazhálusta", en: "The menu, please", ex: "Добрый вечер! Меню, пожалуйста.", exEn: "Good evening! The menu, please." },
  { ru: "Что вы посоветуете?", say: "shto vy pasavyétuyetye", en: "What do you recommend?", ex: "Что вы посоветуете из горячего?", exEn: "What would you recommend for a main course?" },
  { ru: "Столик на двоих", say: "stólik na dvaíkh", en: "A table for two", ex: "У вас есть столик на двоих?", exEn: "Do you have a table for two?" },
  { ru: "Я забронировал / забронировала столик", say: "ya zabraníraval / zabraníravala stólik", en: "I booked a table (man / woman)", ex: "Я забронировала столик на семь часов.", exEn: "I booked a table for seven o'clock. (said by a woman)" },
  { ru: "Счёт, пожалуйста", say: "shchyot, pazhálusta", en: "The check, please", ex: "Спасибо, было вкусно. Счёт, пожалуйста.", exEn: "Thank you, it was delicious. The check, please." },
  { ru: "Можно оплатить картой?", say: "mózhna aplatít' kártay", en: "Can I pay by card?", ex: "Можно оплатить картой или только наличными?", exEn: "Can I pay by card, or cash only?" },
  { ru: "Это очень вкусно!", say: "éta óchyen' fkúsna", en: "This is delicious!", ex: "Спасибо, это очень вкусно!", exEn: "Thank you, this is delicious!" },
  { ru: "Можно воды?", say: "mózhna vadý", en: "Could I have some water?", ex: "Можно воды без газа?", exEn: "Could I have some still water?" },
  { ru: "С газом / без газа", say: "s gázam / byez gáza", en: "Sparkling / still (water)", ex: "Вам воду с газом или без газа?", exEn: "Would you like sparkling or still water?" },
  { ru: "Можно ещё…?", say: "mózhna yeshchyó", en: "Could I have more…?", ex: "Можно ещё хлеба?", exEn: "Could we have more bread?" },
  { ru: "Я вегетарианец / вегетарианка", say: "ya vyegyetariányets / vyegyetariánka", en: "I'm vegetarian (man / woman)", ex: "Я вегетарианка. У вас есть блюда без мяса?", exEn: "I'm vegetarian. Do you have dishes without meat?" },
  { ru: "У меня аллергия на…", say: "u myenyá allyergíya na", en: "I'm allergic to…", ex: "У меня аллергия на орехи.", exEn: "I'm allergic to nuts." },
  { ru: "Это острое?", say: "éta óstraye", en: "Is it spicy?", ex: "Это блюдо острое?", exEn: "Is this dish spicy?" },
  { ru: "Без сахара", say: "byez sákhara", en: "Without sugar", ex: "Чёрный кофе без сахара, пожалуйста.", exEn: "Black coffee without sugar, please." },
  { ru: "Чай / кофе", say: "chay / kófye", en: "Tea / coffee", ex: "Чай с лимоном, пожалуйста.", exEn: "Tea with lemon, please." },
  { ru: "Здесь или с собой?", say: "zdyes' íli s sabóy", en: "For here or to go?", ex: "— Здесь или с собой? — С собой.", exEn: "— For here or to go? — To go." },
  { ru: "На вынос", say: "na výnas", en: "To go / takeaway", ex: "Капучино на вынос, пожалуйста.", exEn: "A cappuccino to go, please." },
  { ru: "Завтрак / обед / ужин", say: "záftrak / abyét / úzhyn", en: "Breakfast / lunch / dinner", ex: "Во сколько у вас завтрак?", exEn: "What time is breakfast?" },
  { ru: "Мясо / курица / рыба", say: "myása / kúritsa / rýba", en: "Meat / chicken / fish", ex: "Я буду рыбу.", exEn: "I'll have the fish." },
  { ru: "Овощи и фрукты", say: "óvashchi i frúkty", en: "Vegetables and fruit", ex: "Где у вас овощи и фрукты?", exEn: "Where are the vegetables and fruit?" },
  { ru: "Хлеб / молоко / яйца", say: "khlyep / malakó / yáytsa", en: "Bread / milk / eggs", ex: "Мне нужно купить хлеб, молоко и яйца.", exEn: "I need to buy bread, milk and eggs." },
  { ru: "Пакет нужен?", say: "pakyét núzhyen", en: "Do you need a bag? (asked at checkout)", ex: "— Пакет нужен? — Нет, спасибо.", exEn: "— Do you need a bag? — No, thank you." },
  { ru: "Сдачи не надо", say: "zdáchi nye náda", en: "Keep the change", ex: "Вот, пожалуйста. Сдачи не надо.", exEn: "Here you go. Keep the change." },
  { ru: "Приятного аппетита", say: "priyátnava appyetíta", en: "Enjoy your meal", ex: "Всё готово. Приятного аппетита!", exEn: "Everything's ready. Enjoy your meal!" },
];

const TEXTING_RU = [
  { ru: "спс", say: "spasíba", speak: "спасибо", en: "Thanks (texting shorthand for спасибо)", ex: "Спс за помощь!", exEn: "Thanks for the help!" },
  { ru: "пасиб", say: "pasíp", speak: "пасиб", en: "Thx (casual спасибо)", ex: "Пасиб, ты лучший!", exEn: "Thx, you're the best!" },
  { ru: "пжлст / плз", say: "pazhálusta / plz", speak: "пожалуйста", en: "Please (shorthand)", ex: "Скинь фото плз.", exEn: "Send the photo pls." },
  { ru: "нзч", say: "nyé za shta", speak: "не за что", en: "You're welcome (не за что)", ex: "— Спс! — Нзч.", exEn: "— Thanks! — NP." },
  { ru: "прив", say: "priv", en: "Hi (short for привет)", ex: "Прив! Чё делаешь?", exEn: "Hi! What are you doing?" },
  { ru: "пока / покеда", say: "paká / pakyéda", en: "Bye / bye-bye", ex: "Ладно, покеда!", exEn: "OK, bye-bye!" },
  { ru: "спок", say: "spok", speak: "спокойной ночи", en: "Good night (спокойной ночи)", ex: "Всем спок!", exEn: "Good night, everyone!" },
  { ru: "норм", say: "norm", en: "Fine, OK", ex: "— Как ты? — Норм.", exEn: "— How are you? — Fine." },
  { ru: "ок / окей", say: "ok / akéy", en: "OK", ex: "Ок, до вечера!", exEn: "OK, see you tonight!" },
  { ru: "+", say: "plyus", speak: "плюс", en: "Yes / agreed / I'm in", ex: "— Идём в кино? — +", exEn: "— Going to the movies? — I'm in." },
  { ru: "лол", say: "lol", en: "LOL", ex: "Лол, это смешно.", exEn: "LOL, that's funny." },
  { ru: "ахах / хаха", say: "akhákh / khakhá", en: "Haha", ex: "Ахах, точно!", exEn: "Haha, exactly!" },
  { ru: "ору", say: "arú", en: "LMAO (literally 'I'm screaming')", ex: "Ору с этого видео!", exEn: "I'm dying at this video!" },
  { ru: "др", say: "dyen' razhdyéniya", speak: "день рождения", en: "Birthday (день рождения)", ex: "С др тебя!", exEn: "Happy birthday!" },
  { ru: "кст", say: "kstáti", speak: "кстати", en: "By the way (кстати)", ex: "Кст, ты завтра занят?", exEn: "BTW, are you busy tomorrow? (to a guy)" },
  { ru: "мб", say: "mózhyet byt'", speak: "может быть", en: "Maybe (может быть)", ex: "Мб встретимся вечером?", exEn: "Maybe meet up tonight?" },
  { ru: "оч", say: "och", speak: "очень", en: "Very (очень)", ex: "Оч круто!", exEn: "So cool!" },
  { ru: "скок", say: "skok", en: "How much / how many (сколько)", ex: "Скок стоит?", exEn: "How much is it?" },
  { ru: "щас / ща", say: "shchas / shcha", en: "Now / one sec (сейчас)", ex: "Ща, пять минут.", exEn: "One sec, five minutes." },
  { ru: "чё", say: "chyo", en: "What (casual что)", ex: "Чё делаешь?", exEn: "What are you doing?" },
  { ru: "тип", say: "tip", en: "Like (filler, short for типа)", ex: "Он тип обиделся.", exEn: "He's, like, offended." },
  { ru: "ваще", say: "vashché", en: "Totally / at all (вообще)", ex: "Ваще не понял.", exEn: "Didn't get it at all." },
  { ru: "чел", say: "chel", en: "Dude / a person", ex: "Чел, ты где?", exEn: "Dude, where are you?" },
  { ru: "го", say: "go", en: "Let's go / wanna…?", ex: "Го гулять?", exEn: "Wanna go for a walk?" },
  { ru: "имхо", say: "ímkha", en: "IMO", ex: "Имхо, это лучший фильм.", exEn: "IMO, it's the best movie." },
  { ru: "лс", say: "líchnyye saabshchyéniya", speak: "личные сообщения", en: "DMs (личные сообщения)", ex: "Напиши мне в лс.", exEn: "Message me in DMs." },
];

const TRAVEL_RU = [
  { ru: "Как пройти к…?", say: "kak praytí k", en: "How do I get to…? (on foot)", ex: "Извините, как пройти к вокзалу?", exEn: "Excuse me, how do I get to the train station?" },
  { ru: "Где находится…?", say: "gdye nakhóditsa", en: "Where is…?", ex: "Где находится Красная площадь?", exEn: "Where is Red Square?" },
  { ru: "Это далеко?", say: "éta dalyekó", en: "Is it far?", ex: "Это далеко отсюда?", exEn: "Is it far from here?" },
  { ru: "Направо / налево / прямо", say: "napráva / nalyéva / pryáma", en: "Right / left / straight ahead", ex: "Идите прямо, потом налево.", exEn: "Go straight, then turn left." },
  { ru: "Где станция метро?", say: "gdye stántsiya myetró", en: "Where's the metro station?", ex: "Подскажите, где ближайшая станция метро?", exEn: "Could you tell me where the nearest metro station is?" },
  { ru: "Сколько стоит билет?", say: "skól'ka stóit bilyét", en: "How much is a ticket?", ex: "Сколько стоит билет до Москвы?", exEn: "How much is a ticket to Moscow?" },
  { ru: "Один билет до…", say: "adín bilyét da", en: "One ticket to…", ex: "Один билет до Петербурга, пожалуйста.", exEn: "One ticket to St. Petersburg, please." },
  { ru: "Вызовите такси", say: "výzavitye taksí", en: "Call a taxi", ex: "Вызовите, пожалуйста, такси.", exEn: "Please call a taxi." },
  { ru: "Остановите здесь, пожалуйста", say: "astanavítye zdyes', pazhálusta", en: "Please stop here (in a taxi)", ex: "Остановите здесь, пожалуйста. Спасибо!", exEn: "Please stop here. Thank you!" },
  { ru: "Где аптека?", say: "gdye aptyéka", en: "Where's a pharmacy?", ex: "Извините, где здесь аптека?", exEn: "Excuse me, where's a pharmacy around here?" },
  { ru: "Мне нужно лекарство от…", say: "mnye núzhna lyekárstva at", en: "I need medicine for…", ex: "Мне нужно лекарство от головной боли.", exEn: "I need medicine for a headache." },
  { ru: "Мне плохо", say: "mnye plókha", en: "I feel unwell", ex: "Мне плохо, вызовите врача.", exEn: "I feel unwell, please call a doctor." },
  { ru: "Вызовите скорую!", say: "výzavitye skóruyu", en: "Call an ambulance! (emergency number in Russia: 112)", ex: "Человеку плохо, вызовите скорую!", exEn: "Someone's unwell, call an ambulance!" },
  { ru: "Помогите, пожалуйста", say: "pamagítye, pazhálusta", en: "Please help me", ex: "Помогите, пожалуйста, я не знаю, куда идти.", exEn: "Please help me, I don't know where to go." },
  { ru: "Я заблудился / заблудилась", say: "ya zabludílsya / zabludílas'", en: "I'm lost (man / woman)", ex: "Извините, я заблудилась. Где эта улица?", exEn: "Excuse me, I'm lost. Where is this street? (said by a woman)" },
  { ru: "Вы говорите по-английски?", say: "vy gavarítye pa-anglíyski", en: "Do you speak English?", ex: "Извините, вы говорите по-английски?", exEn: "Excuse me, do you speak English?" },
  { ru: "Я не понимаю", say: "ya nye panimáyu", en: "I don't understand", ex: "Я не понимаю. Повторите, пожалуйста.", exEn: "I don't understand. Could you repeat that, please?" },
  { ru: "Говорите медленнее, пожалуйста", say: "gavarítye myédlyennyeye, pazhálusta", en: "Please speak more slowly", ex: "Говорите медленнее, пожалуйста, я только учусь.", exEn: "Please speak more slowly, I'm just learning." },
  { ru: "Сколько это стоит?", say: "skól'ka éta stóit", en: "How much does this cost?", ex: "Сколько стоит эта куртка?", exEn: "How much is this jacket?" },
  { ru: "Можно примерить?", say: "mózhna primyérit'", en: "Can I try it on?", ex: "Можно примерить это платье?", exEn: "Can I try on this dress?" },
  { ru: "Где примерочная?", say: "gdye primyérachnaya", en: "Where's the fitting room?", ex: "Подскажите, где примерочная?", exEn: "Could you tell me where the fitting room is?" },
  { ru: "У меня бронь", say: "u myenyá bron'", en: "I have a reservation", ex: "Здравствуйте, у меня бронь на имя Ками.", exEn: "Hello, I have a reservation under the name Cami." },
  { ru: "Во сколько выезд?", say: "va skól'ka výyezd", en: "What time is check-out?", ex: "Скажите, во сколько выезд?", exEn: "Could you tell me what time check-out is?" },
  { ru: "Где туалет?", say: "gdye tualyét", en: "Where's the restroom?", ex: "Извините, где здесь туалет?", exEn: "Excuse me, where's the restroom?" },
  { ru: "Какой пароль от вай-фая?", say: "kakóy paról' at vay-fáya", en: "What's the Wi-Fi password?", ex: "Извините, какой пароль от вай-фая?", exEn: "Excuse me, what's the Wi-Fi password?" },
  { ru: "Я из Америки", say: "ya iz amyériki", en: "I'm from America", ex: "Я из Америки, я здесь в первый раз.", exEn: "I'm from America, it's my first time here." },
];

const PROVERBS_RU = [
  { ru: "Тише едешь — дальше будешь", say: "tíshe yédyesh' — dál'she búdyesh'", lit: "The slower you ride, the farther you'll get.", en: "Slow and steady wins the race." },
  { ru: "Не всё то золото, что блестит", say: "nye fsyo to zólata, shto blyestít", lit: "Not everything that glitters is gold.", en: "Appearances can be deceiving." },
  { ru: "Без труда не выловишь и рыбку из пруда", say: "byez trudá nye výlavish' i rýpku iz prudá", lit: "Without effort you can't even pull a little fish out of a pond.", en: "No pain, no gain." },
  { ru: "Семь раз отмерь — один раз отрежь", say: "syem' ras atmyér' — adín ras atryézh", lit: "Measure seven times, cut once.", en: "Think carefully before you act." },
  { ru: "Волков бояться — в лес не ходить", say: "valkóf bayát'sya — v lyes nye khadít'", lit: "If you're afraid of wolves, don't go into the forest.", en: "Nothing ventured, nothing gained." },
  { ru: "Любишь кататься — люби и саночки возить", say: "lyúbish' katát'sya — lyubí i sánachki vazít'", lit: "If you love sledding, love pulling the sled back up too.", en: "If you want the fun, accept the work that comes with it." },
  { ru: "Утро вечера мудренее", say: "útra vyéchyera mudryenyéye", lit: "The morning is wiser than the evening.", en: "Sleep on it." },
  { ru: "Что посеешь, то и пожнёшь", say: "shto pasyéyesh', to i pazhnyósh", lit: "What you sow is what you'll reap.", en: "You reap what you sow." },
  { ru: "Лучше поздно, чем никогда", say: "lúchshe pózna, chyem nikagdá", lit: "Better late than never.", en: "Better late than never." },
  { ru: "Нет худа без добра", say: "nyet khúda byez dabrá", lit: "There's no bad without some good.", en: "Every cloud has a silver lining." },
  { ru: "Друзья познаются в беде", say: "druz'yá paznayútsa v byedyé", lit: "Friends are known in times of trouble.", en: "A friend in need is a friend indeed." },
  { ru: "В гостях хорошо, а дома лучше", say: "v gastyákh kharashó, a dóma lúchshe", lit: "It's nice visiting, but it's better at home.", en: "There's no place like home." },
  { ru: "Аппетит приходит во время еды", say: "appyetít prikhódit va vryémya yedý", lit: "Appetite comes while eating.", en: "Once you get started, you want more." },
  { ru: "Не откладывай на завтра то, что можно сделать сегодня", say: "nye atkládyvay na záftra to, shto mózhna zdyélat' syevódnya", lit: "Don't put off until tomorrow what you can do today.", en: "Don't procrastinate." },
  { ru: "Слово — серебро, молчание — золото", say: "slóva — syeryebró, malchániye — zólata", lit: "Speech is silver, silence is gold.", en: "Sometimes it's wiser to say nothing." },
  { ru: "Кто рано встаёт, тому Бог подаёт", say: "kto rána fstayót, tamú bokh padayót", lit: "God gives to the one who gets up early.", en: "The early bird catches the worm." },
  { ru: "Яблоко от яблони недалеко падает", say: "yáblaka at yáblani nyedalyekó pádayet", lit: "The apple doesn't fall far from the apple tree.", en: "Like parent, like child." },
  { ru: "Не имей сто рублей, а имей сто друзей", say: "nye iméy sto rubléy, a iméy sto druzyéy", lit: "Don't have a hundred rubles — have a hundred friends.", en: "Friends are worth more than money." },
  { ru: "На вкус и цвет товарищей нет", say: "na fkus i tsvyet tavárishchyey nyet", lit: "In taste and color, there are no comrades.", en: "To each their own." },
  { ru: "Поживём — увидим", say: "pazhyvyóm — uvídim", lit: "We'll live and we'll see.", en: "Time will tell." },
  { ru: "Москва не сразу строилась", say: "maskvá nye srázu stróilas'", lit: "Moscow wasn't built all at once.", en: "Rome wasn't built in a day." },
  { ru: "Делу время — потехе час", say: "dyélu vryémya — patyékhe chas", lit: "A time for work, an hour for fun.", en: "Business before pleasure." },
];

const NUMBERS_RU = [
  { ru: "ноль", say: "nol'", en: "0 — zero", ex: "Ноль градусов.", exEn: "Zero degrees." },
  { ru: "один", say: "adín", en: "1 — one", ex: "Один кофе, пожалуйста.", exEn: "One coffee, please." },
  { ru: "два", say: "dva", en: "2 — two", ex: "Мне два билета, пожалуйста.", exEn: "Two tickets for me, please." },
  { ru: "три", say: "tri", en: "3 — three" },
  { ru: "четыре", say: "chyetýrye", en: "4 — four" },
  { ru: "пять", say: "pyat'", en: "5 — five", ex: "Пять минут.", exEn: "Five minutes." },
  { ru: "шесть", say: "shest'", en: "6 — six" },
  { ru: "семь", say: "syem'", en: "7 — seven" },
  { ru: "восемь", say: "vósyem'", en: "8 — eight" },
  { ru: "девять", say: "dyévyat'", en: "9 — nine" },
  { ru: "десять", say: "dyésyat'", en: "10 — ten" },
  { ru: "одиннадцать", say: "adínatsat'", en: "11 — eleven" },
  { ru: "двенадцать", say: "dvyenátsat'", en: "12 — twelve" },
  { ru: "тринадцать", say: "trinátsat'", en: "13 — thirteen" },
  { ru: "четырнадцать", say: "chyetýrnatsat'", en: "14 — fourteen" },
  { ru: "пятнадцать", say: "pyatnátsat'", en: "15 — fifteen" },
  { ru: "шестнадцать", say: "shysnátsat'", en: "16 — sixteen" },
  { ru: "семнадцать", say: "syemnátsat'", en: "17 — seventeen" },
  { ru: "восемнадцать", say: "vasyemnátsat'", en: "18 — eighteen" },
  { ru: "девятнадцать", say: "dyevyatnátsat'", en: "19 — nineteen" },
  { ru: "двадцать", say: "dvátsat'", en: "20 — twenty", ex: "Двадцать один, двадцать два…", exEn: "Twenty-one, twenty-two… (just put the numbers together)" },
  { ru: "тридцать", say: "trítsat'", en: "30 — thirty" },
  { ru: "сорок", say: "sórak", en: "40 — forty" },
  { ru: "пятьдесят", say: "pyad'dyesyát", en: "50 — fifty" },
  { ru: "шестьдесят", say: "shyz'dyesyát", en: "60 — sixty" },
  { ru: "семьдесят", say: "syém'dyesyat", en: "70 — seventy" },
  { ru: "восемьдесят", say: "vósyem'dyesyat", en: "80 — eighty" },
  { ru: "девяносто", say: "dyevyanósta", en: "90 — ninety" },
  { ru: "сто", say: "sto", en: "100 — one hundred", ex: "Это стоит сто рублей.", exEn: "It costs a hundred rubles." },
  { ru: "двести / пятьсот", say: "dvyésti / pyat'sót", en: "200 / 500", ex: "Пятьсот рублей, пожалуйста.", exEn: "Five hundred rubles, please." },
  { ru: "тысяча", say: "týsyacha", en: "1000 — one thousand", ex: "Две тысячи рублей.", exEn: "Two thousand rubles." },
  { ru: "Сколько это стоит?", say: "skól'ka éta stóit", en: "How much does it cost?", ex: "Сколько стоит этот кофе?", exEn: "How much is this coffee?" },
  { ru: "рубль / рубля / рублей", say: "rubl' / rublyá / rubléy", en: "Ruble — the ending changes: 1 рубль, 2–4 рубля, 5+ рублей", ex: "Один рубль, два рубля, пять рублей.", exEn: "One ruble, two rubles, five rubles." },
  { ru: "Это дорого / дёшево", say: "éta dóraga / dyóshyeva", en: "That's expensive / cheap", ex: "Это слишком дорого.", exEn: "That's too expensive." },
  { ru: "Можно скидку?", say: "mózhna skítku", en: "Can I get a discount?", ex: "Если возьму два, можно скидку?", exEn: "If I take two, can I get a discount?" },
  { ru: "Который час?", say: "katóryy chas", en: "What time is it?", ex: "Извините, который час?", exEn: "Excuse me, what time is it?" },
  { ru: "Сколько времени?", say: "skól'ka vryémyeni", en: "What time is it? (casual)", ex: "Сколько времени? Я опаздываю.", exEn: "What time is it? I'm running late." },
  { ru: "Сейчас три часа", say: "syeychás tri chasá", en: "It's three o'clock", ex: "Сейчас ровно три часа.", exEn: "It's exactly three o'clock." },
  { ru: "в пять часов", say: "f pyat' chasóf", en: "at five o'clock", ex: "Встретимся в пять часов.", exEn: "Let's meet at five o'clock." },
  { ru: "через полчаса", say: "chyéryez polchasá", en: "in half an hour", ex: "Я буду через полчаса.", exEn: "I'll be there in half an hour." },
  { ru: "полдень", say: "póldyen'", en: "noon", ex: "Обед в полдень.", exEn: "Lunch is at noon." },
  { ru: "полночь", say: "pólnach'", en: "midnight", ex: "Метро работает до полуночи.", exEn: "The metro runs until midnight." },
  { ru: "утром / днём / вечером / ночью", say: "útram / dnyom / vyéchyeram / nóch'yu", en: "in the morning / afternoon / evening / at night", ex: "Позвони мне вечером.", exEn: "Call me in the evening." },
  { ru: "первый / второй / третий", say: "pyérvyy / ftaróy / tryétiy", en: "first / second / third", ex: "Это мой первый раз в России.", exEn: "It's my first time in Russia." },
];

// Load each list from its file, or create the file from the list above
function loadList(file, seed) {
  const f = path.join(__dirname, file);
  try { return JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { try { fs.writeFileSync(f, JSON.stringify(seed, null, 2)); } catch (e2) {} return seed; }
}
const EXTRA_SECTIONS = {
  "/food-russian":     loadList("food-russian.json", FOOD_RU),
  "/texting-russian":  loadList("texting-russian.json", TEXTING_RU),
  "/travel-russian":   loadList("travel-russian.json", TRAVEL_RU),
  "/proverbs-russian": loadList("proverbs-russian.json", PROVERBS_RU),
  "/numbers-russian":  loadList("numbers-russian.json", NUMBERS_RU),
};

// ---- French: decks, starter phrases and the translate pipeline ----
const FR_SECTIONS = {};
for (const d of FR.DECKS) FR_SECTIONS[d.url] = loadList(d.file, d.data);
const phrasesFr = loadList("phrases-fr.json", FR.STARTER_PHRASES_FR);

// Google's guess at the language ("fr", "en"…)
async function googleDetect(text) {
  const g = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + encodeURIComponent(text.slice(0, 500));
  const d = await (await fetch(g)).json();
  return typeof d[2] === "string" ? d[2] : "";
}

// French and English share an alphabet, so: a phrase of yours typed on its own decides it,
// then the conversation button's turn, then Google's guess.
async function frDirection(text, hint, userPhrases) {
  if (hint === "en" || hint === "fr") return hint;
  const bare = s => norm(s).trim().replace(/[.!?…,]+$/, "").trim().toLowerCase();
  const whole = bare(text);
  if (userPhrases.some(p => bare(p.en) === whole)) return "en";
  if (userPhrases.some(p => bare(p.fr) === whole)) return "fr";
  return (await googleDetect(text)) === "fr" ? "fr" : "en";
}

async function translateFr(body, arg) {
  const text = arg("q").slice(0, 5000);
  const gender = arg("g") === "f" ? "f" : "m";
  const userPhrases = cleanPhrases(body.phrases, "fr") || phrasesFr;
  if (!text.trim()) return { out: "", from: "en", to: "fr", say: [] };
  const from = await frDirection(text, arg("from"), userPhrases);
  const to = from === "fr" ? "en" : "fr";
  const { text: safe0, titles } = protectTitles(text);
  const { text: safe, hits } = protectPhrases(safe0, from, userPhrases, to);
  let out;
  if (/^\s*ZQP0\s*[.!?…]*\s*$/.test(safe) && hits.length === 1) out = safe;     // the whole message is one of your phrases
  else out = await google(safe, from, to);
  const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
  if (!ok) out = await google(text, from, to);                                     // placeholder got mangled → plain translation
  else out = restoreTitles(out, titles, to);
  if (to === "fr") {
    out = FR.grammar.setFormality(out, arg("y") === "v" ? "v" : "t", arg("l") === "f" ? "f" : "m");
    if (gender === "f") out = FR.grammar.makeFemale(out);
  }
  if (ok) out = restorePhrases(out, hits, to, CAP_FR);                            // last, so nothing rewrites your wording
  if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
  // which parts to read in which voice: kept titles stay in the language they were typed in
  const say = [];
  let rest = out;
  for (const t of (ok ? titles : [])) {
    const i = rest.indexOf(t);
    if (i < 0) continue;
    if (i > 0) say.push([to, rest.slice(0, i)]);
    say.push([from, t]);
    rest = rest.slice(i + t.length);
  }
  if (rest) say.push([to, rest]);
  return { out, from, to, say: say.filter(p => /[A-Za-zÀ-ÿ0-9]/.test(p[1])) };
}

// ---- Mandarin: decks, starter phrases and the translate pipeline ----
const ZH_SECTIONS = {};
for (const d of ZH.DECKS) ZH_SECTIONS[d.url] = loadList(d.file, d.data);
const phrasesZh = loadList("phrases-zh.json", ZH.STARTER_PHRASES_ZH);

// Chinese characters make it easy: any in the message → Chinese to English
function zhDirection(text, hint, userPhrases) {
  if (hint === "en" || hint === "zh") return hint;
  const bare = s => norm(s).trim().replace(/[.!?…,。！？，]+$/, "").trim().toLowerCase();
  const whole = bare(text);
  if (userPhrases.some(p => bare(p.en) === whole)) return "en";
  return ZH.grammar.hasChinese(text) ? "zh" : "en";
}

async function translateZh(body, arg) {
  const text = arg("q").slice(0, 5000);
  const userPhrases = cleanPhrases(body.phrases, "zh") || phrasesZh;
  if (!text.trim()) return { out: "", from: "en", to: "zh", say: [] };
  const from = zhDirection(text, arg("from"), userPhrases);
  const to = from === "zh" ? "en" : "zh";
  const g = code => (code === "zh" ? "zh-CN" : code);             // Google's code for simplified Chinese
  const { text: safe0, titles } = protectTitles(text);
  const { text: safe, hits } = protectPhrases(safe0, from, userPhrases, to);
  let out;
  if (/^\s*ZQP0\s*[.!?…。！？]*\s*$/.test(safe) && hits.length === 1) out = safe;   // the whole message is one of your phrases
  else out = await google(safe, g(from), g(to));
  const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
  if (!ok) out = await google(text, g(from), g(to));               // placeholder got mangled → plain translation
  else out = restoreTitles(out, titles, to);
  if (to === "zh") out = ZH.grammar.setFormality(out, arg("y") === "v" ? "v" : "t");
  if (ok) out = restorePhrases(out, hits, to, CAP_FR);             // last, so nothing rewrites your wording
  if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
  // English output: Chinese full-width punctuation (！？，。) back to normal punctuation
  if (to === "en") out = out.replace(/！/g, "!").replace(/？/g, "?").replace(/，\s*/g, ", ").replace(/。/g, ".").replace(/：/g, ": ");
  // Chinese characters in the Mandarin voice, any English (names, titles) in the English voice
  const say = to === "zh" ? ZH.grammar.voiceParts(out) : [["en", out]];
  return { out, from, to, say };
}

// ---- Spanish, Italian, Portuguese: decks, starter phrases and one shared translate pipeline ----
const ROMANCE_SECTIONS = {}, ROMANCE_PHRASES = {};
for (const [code, L] of Object.entries(ROMANCE)) {
  for (const d of L.DECKS) ROMANCE_SECTIONS[d.url] = loadList(d.file, d.data);
  ROMANCE_PHRASES[code] = loadList("phrases-" + code + ".json", L.STARTER_PHRASES);
}

// Same alphabet as English, so: a phrase of yours typed on its own decides it,
// then the conversation button's turn, then Google's guess.
async function romanceDirection(code, text, hint, userPhrases) {
  if (hint === "en" || hint === code) return hint;
  const bare = s => norm(s).trim().replace(/[.!?…,]+$/, "").replace(/^[¿¡]+/, "").trim().toLowerCase();
  const whole = bare(text);
  if (userPhrases.some(p => bare(p.en) === whole)) return "en";
  if (userPhrases.some(p => bare(p[code]) === whole)) return code;
  return (await googleDetect(text)) === code ? code : "en";
}

async function translateRomance(code, body, arg) {
  const L = ROMANCE[code];
  const text = arg("q").slice(0, 5000);
  const gender = arg("g") === "f" ? "f" : "m";
  const userPhrases = cleanPhrases(body.phrases, code) || ROMANCE_PHRASES[code];
  if (!text.trim()) return { out: "", from: "en", to: code, say: [] };
  const from = await romanceDirection(code, text, arg("from"), userPhrases);
  const to = from === code ? "en" : code;
  const { text: safe0, titles } = protectTitles(text);
  const { text: safe, hits } = protectPhrases(safe0, from, userPhrases, to);
  let out;
  if (/^\s*ZQP0\s*[.!?…]*\s*$/.test(safe) && hits.length === 1) out = safe;     // the whole message is one of your phrases
  else out = await google(safe, from, to);
  const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
  if (!ok) out = await google(text, from, to);                                     // placeholder got mangled → plain translation
  else out = restoreTitles(out, titles, to);
  if (to === code) {
    out = L.grammar.setFormality(out, arg("y") === "v" ? "v" : "t", arg("l") === "f" ? "f" : "m");
    if (gender === "f") out = L.grammar.makeFemale(out);
  }
  if (ok) out = restorePhrases(out, hits, to, to === "es" ? CAP_ES : CAP_FR);       // last, so nothing rewrites your wording
  if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
  // which parts to read in which voice: kept titles stay in the language they were typed in
  const say = [];
  let rest = out;
  for (const t of (ok ? titles : [])) {
    const i = rest.indexOf(t);
    if (i < 0) continue;
    if (i > 0) say.push([to, rest.slice(0, i)]);
    say.push([from, t]);
    rest = rest.slice(i + t.length);
  }
  if (rest) say.push([to, rest]);
  return { out, from, to, say: say.filter(p => /[A-Za-zÀ-ÿ0-9]/.test(p[1])) };
}

// ---- Arabic: decks, starter phrases and the translate pipeline ----
const AR_SECTIONS = {};
for (const d of AR.DECKS) AR_SECTIONS[d.url] = loadList(d.file, d.data);
const phrasesAr = loadList("phrases-ar.json", AR.STARTER_PHRASES);

// Arabic letters make it easy: any in the message → Arabic to English
function arDirection(text, hint, userPhrases) {
  if (hint === "en" || hint === "ar") return hint;
  const bare = s => norm(s).trim().replace(/[.!?…,؟،]+$/, "").trim().toLowerCase();
  const whole = bare(text);
  if (userPhrases.some(p => bare(p.en) === whole)) return "en";
  return AR.grammar.hasArabic(text) ? "ar" : "en";
}

async function translateAr(body, arg) {
  const text = arg("q").slice(0, 5000);
  const userPhrases = cleanPhrases(body.phrases, "ar") || phrasesAr;
  if (!text.trim()) return { out: "", from: "en", to: "ar", say: [] };
  const from = arDirection(text, arg("from"), userPhrases);
  const to = from === "ar" ? "en" : "ar";
  const { text: safe0, titles } = protectTitles(text);
  const { text: safe, hits } = protectPhrases(safe0, from, userPhrases, to);
  let out;
  if (/^\s*ZQP0\s*[.!?…؟]*\s*$/.test(safe) && hits.length === 1) out = safe;     // the whole message is one of your phrases
  else out = await google(safe, from, to);
  const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
  if (!ok) out = await google(text, from, to);                    // placeholder got mangled → plain translation
  else out = restoreTitles(out, titles, to);
  if (to === "ar") {
    out = AR.grammar.setFormality(out, arg("y") === "v" ? "v" : "t", arg("l") === "f" ? "f" : "m");
    if (arg("g") === "f") out = AR.grammar.makeFemale(out);
  }
  if (ok) out = restorePhrases(out, hits, to, CAP_FR);            // last, so nothing rewrites your wording
  if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
  // English output: Arabic punctuation (؟ ، ؛) back to normal punctuation
  if (to === "en") out = out.replace(/؟/g, "?").replace(/،\s*/g, ", ").replace(/؛/g, ";");
  // Arabic in the Arabic voice, any English (names, titles) in the English voice
  const say = to === "ar" ? AR.grammar.voiceParts(out) : [["en", out]];
  return { out, from, to, say };
}

// ---- Japanese: decks, starter phrases and the translate pipeline ----
const JA_SECTIONS = {};
for (const d of JA.DECKS) JA_SECTIONS[d.url] = loadList(d.file, d.data);
const phrasesJa = loadList("phrases-ja.json", JA.STARTER_PHRASES);

// Kana or kanji in the message → Japanese to English
function jaDirection(text, hint, userPhrases) {
  if (hint === "en" || hint === "ja") return hint;
  const bare = s => norm(s).trim().replace(/[.!?…,。！？、]+$/, "").trim().toLowerCase();
  const whole = bare(text);
  if (userPhrases.some(p => bare(p.en) === whole)) return "en";
  return JA.grammar.hasJapanese(text) ? "ja" : "en";
}

async function translateJa(body, arg) {
  const text = arg("q").slice(0, 5000);
  const userPhrases = cleanPhrases(body.phrases, "ja") || phrasesJa;
  if (!text.trim()) return { out: "", from: "en", to: "ja", say: [] };
  const from = jaDirection(text, arg("from"), userPhrases);
  const to = from === "ja" ? "en" : "ja";
  const { text: safe0, titles } = protectTitles(text);
  const { text: safe, hits } = protectPhrases(safe0, from, userPhrases, to);
  let out;
  if (/^\s*ZQP0\s*[.!?…。！？]*\s*$/.test(safe) && hits.length === 1) out = safe;   // the whole message is one of your phrases
  else out = await google(safe, from, to);
  const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
  if (!ok) out = await google(text, from, to);                    // placeholder got mangled → plain translation
  else out = restoreTitles(out, titles, to);
  // polite です・ます (the default) or casual plain form
  if (to === "ja") out = JA.grammar.setFormality(out, arg("y") === "t" ? "t" : "v");
  if (ok) out = restorePhrases(out, hits, to, CAP_FR);            // last, so nothing rewrites your wording
  if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
  // English output: Japanese punctuation back to normal punctuation
  if (to === "en") out = out.replace(/。/g, ". ").replace(/、/g, ", ").replace(/？/g, "?").replace(/！/g, "!").replace(/[「」]/g, '"').replace(/ +$/, "").replace(/ {2,}/g, " ");
  const say = to === "ja" ? JA.grammar.voiceParts(out) : [["en", out]];
  return { out, from, to, say };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = "";
    req.on("data", c => { b += c; if (b.length > 200000) req.destroy(); });
    req.on("end", () => resolve(b));
    req.on("error", reject);
  });
}


http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (ROMANCE_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(ROMANCE_SECTIONS[u.pathname]));
  }
  const rp = u.pathname.match(/^\/(es|it|pt)\/phrases$/);
  if (rp) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(ROMANCE_PHRASES[rp[1]]));
  }
  if (JA_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(JA_SECTIONS[u.pathname]));
  }
  if (u.pathname === "/ja/phrases") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(phrasesJa));
  }
  if (AR_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(AR_SECTIONS[u.pathname]));
  }
  if (u.pathname === "/ar/phrases") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(phrasesAr));
  }
  if (ZH_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(ZH_SECTIONS[u.pathname]));
  }
  if (u.pathname === "/zh/phrases") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(phrasesZh));
  }
  if (FR_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(FR_SECTIONS[u.pathname]));
  }
  if (u.pathname === "/fr/phrases") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(phrasesFr));
  }
  if (EXTRA_SECTIONS[u.pathname]) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(EXTRA_SECTIONS[u.pathname]));
  }
  if (u.pathname === "/formal-russian") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(formalRu));
  }
  if (u.pathname === "/ru-slang") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(ruSlang));
  }
  // Starter phrase list for new phones (read-only — each phone keeps its own copy after that)
  if (u.pathname === "/phrases") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify(phrases));
  }
  if (u.pathname === "/tts-status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: !!edge }));
  }
  if (u.pathname === "/tts") return handleTTS(req, u, res);
  if (u.pathname === "/translate") {
    // POST {q, g, y, l, phrases} from the page; plain ?q= links still work too
    let body = {};
    if (req.method === "POST") {
      try { body = JSON.parse(await readBody(req)) || {}; } catch (e) { res.writeHead(400); return res.end(); }
    }
    const arg = k => (typeof body[k] === "string" ? body[k] : u.searchParams.get(k)) || "";
    if (arg("lang") === "fr" || arg("lang") === "zh" || arg("lang") === "ar" || arg("lang") === "ja" || ROMANCE[arg("lang")]) {
      try {
        const r = arg("lang") === "ja" ? await translateJa(body, arg) : arg("lang") === "ar" ? await translateAr(body, arg) : arg("lang") === "zh" ? await translateZh(body, arg) : arg("lang") === "fr" ? await translateFr(body, arg)
          : await translateRomance(arg("lang"), body, arg);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(r));
      } catch (e) {
        res.writeHead(500);
        res.end("Something went wrong");
      }
      return;
    }
    const text = arg("q").slice(0, 5000);
    const gender = arg("g") === "f" ? "f" : "m";
    const userPhrases = cleanPhrases(body.phrases) || phrases;
    const isRussian = /[а-яё]/i.test(text);
    const [from, to] = isRussian ? ["ru", "en"] : ["en", "ru"];
    try {
      // Pull out anything in quotes so Google can't translate it
      const { text: safe0, titles } = protectTitles(text);
      // Your own phrases/slang: swapped out before Google, put back exactly as you wrote them
      const { text: safe, hits } = protectPhrases(safe0, from, userPhrases);
      let out;
      if (/^\s*ZQP0\s*[.!?…]*\s*$/.test(safe) && hits.length === 1) {
        out = safe;                                  // the whole message is one of your phrases
      } else {
        out = await google(safe, from, to);
      }
      const ok = titles.every((_, i) => out.includes("ZQX" + i)) && hits.every((_, i) => out.includes("ZQP" + i));
      if (!ok) {
        out = await google(text, from, to);          // placeholder got mangled → plain translation
      } else {
        out = restoreTitles(out, titles, to);
      }
      out = fixNames(out, to);
      if (to === "ru") out = setFormality(out, arg("y") === "v" ? "v" : "t", arg("l") === "f" ? "f" : "m");
      if (to === "ru" && gender === "f") out = makeFemale(out);
      if (ok) out = restorePhrases(out, hits, to);   // last, so nothing rewrites your wording
      // the whole message is one phrase and you typed no end punctuation → keep the phrase exactly as written
      if (ok && hits.length === 1 && /^\s*ZQP0\s*$/.test(safe)) out = hits[0][to];
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(out);
    } catch (e) {
      res.writeHead(500);
      res.end("Something went wrong");
    }
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(PAGES[u.pathname.replace(/\/+$/, "") || "/"] || PAGES["/"]);
}).listen(PORT, "0.0.0.0", () => console.log("Translator running on port " + PORT + " — open http://localhost:" + PORT));

