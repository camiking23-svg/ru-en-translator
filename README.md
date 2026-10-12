# RU ⇄ EN Translator

Russian, French, Mandarin, Spanish, Italian, Portuguese, Arabic and Japanese ⇄ English translator for your phone: male/female voices, casual/formal "you", your own slang list,
favorites, and learning sections (slang, formal, food, texting, travel, proverbs, numbers).

- **Russian** is at the main address (`/`), **French** at `/fr`, **Mandarin** at `/zh`, **Spanish** at `/es`, **Italian** at `/it`, **Portuguese** at `/pt`, **Arabic** at `/ar`, **Japanese** at `/ja`.
  The flag buttons at the top switch between them.

- **Run at home:** `node server.js`, then open `http://<your-PC-address>:3000` on your phone.
- **Run online:** follow the steps below. Then it works anywhere, and your PC can be off.

---

## Only you can do these (about 15 minutes)

- [ ] Make a free **GitHub** account: github.com → Sign up
- [ ] Make a free **Render** account: render.com → Get Started → **Sign in with GitHub** (this connects the two)
- [ ] Upload this folder to GitHub (step A)
- [ ] Click deploy on Render (step B)
- [ ] Open your new link on your phone and **Add to Home Screen** (step C)

Everything else (start command, Node version, build settings and ignored files) is already set up in this folder.

---

## A. Put this folder on GitHub (no software needed)

1. On github.com, click **+** (top right) → **New repository**.
2. Name: `ru-en-translator` → choose **Private** → click **Create repository**.
3. On the next page, click **uploading an existing file**.
4. Open this translator folder in File Explorer and drag these files onto the page:
   - `server.js`, `package.json`, `package-lock.json`
   - `render.yaml`, `.gitignore`, `README.md`
   - `phrases.json` and all seven `*-russian.json` files
   - `lang-fr.js`, `fr-grammar.js`, `phrases-fr.json` and all seven `*-french.json` / `french-slang.json` files
   - `lang-zh.js`, `zh-grammar.js`, `phrases-zh.json` and all seven `*-chinese.json` / `chinese-slang.json` files
   - `romance-core.js`, plus for each of Spanish, Italian, Portuguese: `lang-es.js` / `es-grammar.js` / `phrases-es.json` and the seven
     `*-spanish.json` files (same pattern with `it` / `*-italian.json` and `pt` / `*-portuguese.json`)

   **Don't drag `node_modules`**, since Render installs that itself.
   If `.gitignore` doesn't show up, in File Explorer go to **View → Show → Hidden items**.
5. Click **Commit changes**.

> Prefer an app? **GitHub Desktop** (desktop.github.com) does the same thing: File → Add local repository →
> pick this folder → Publish repository. It skips `node_modules` automatically thanks to `.gitignore`.

## B. Connect it to Render

1. On render.com, click **New** → **Blueprint**.
2. Pick your `ru-en-translator` repository → **Connect**.
3. Render reads `render.yaml` and fills in everything:

   | Setting | Value |
   |---|---|
   | Runtime | Node |
   | Build command | `npm install --ignore-scripts` |
   | Start command | `npm start` |
   | Plan | Free |

4. Click **Apply** / **Deploy**. After a few minutes you'll see **Live** and a link like
   `https://ru-en-translator.onrender.com`.

> If you'd rather not use Blueprint: **New → Web Service** → pick the repo, then type the settings from the table above.

## C. Use it on a phone

- **iPhone:** open the link in **Safari** → **Share** → **Add to Home Screen** → **Add**
- **Android:** open the link in **Chrome** → **⋮** → **Add to Home screen**

It opens full-screen as "RU ⇄ EN". To share it, just send the other person the link and have them do the same.

---

## Updating it later
Upload the changed file(s) to the same GitHub repository (**Add file → Upload files**). Render redeploys by itself.

## Good to know
- **Free plan sleeps** after about 15 minutes idle, so the first open afterwards can take up to a minute. A paid plan (about $7/month) keeps it awake.
- **Each phone keeps its own Favorites and My phrases.** New phones start with `phrases.json` (Russian), `phrases-fr.json` (French), `phrases-zh.json` (Mandarin), `phrases-es.json`, `phrases-it.json`, `phrases-pt.json`, `phrases-ar.json` or `phrases-ja.json`. Nothing a phone changes is saved on the server.
- **Each language has its own** My phrases, Favorites, casual/formal setting, Talking to setting and share link. "I am" is shared.
- **French tu/vous:** the toggle rewrites "you", verbs, commands and possessives (ton/ta ↔ votre). French "vous" is treated as one person,
  so Talking to also applies in vous mode (vous êtes prête). Google picks tu or vous itself, so the toggle overrides it.
- **The home version and the online version have separate lists**, because they're different web addresses.
- **Anyone with the link can use it**, so share it only with people you choose.
- Translation uses Google and the voices use Microsoft's free online service. Both are unofficial and could change.
  If the voices stop, Speak falls back to the phone's own voices.
- **Mandarin 你/您:** Mandarin verbs don't change for "you" and nothing agrees with gender, so the toggle swaps 你 (casual) ↔ 您 (polite).
  "You all" stays 你们. Talking to only picks the voice for their side of a voice conversation. Cards show pinyin with tone marks.
- **Spanish** is Latin American (Mexican slang is marked). tú ↔ usted rewrites verbs in every common tense, commands
  (dime ↔ dígame, siéntate ↔ siéntese) and tu ↔ su. "You all" is always ustedes. Going back from usted to tú only happens where
  "usted" is actually written, because a plain "está" could also mean he or she.
- **Italian** tu ↔ Lei uses the formal third-person forms (hai → ha, dimmi → mi dica, tuo → Suo). "You all" (voi) is left alone.
- **Portuguese** is Brazilian. você ↔ o senhor / a senhora (picked from Talking to); the verbs stay the same, the pronoun and its
  contractions change (para você → para a senhora, de você → do senhor), te → lhe, and casual commands become polite (Olha → Olhe).
- For all three, I am makes "I'm tired" agree (cansada, stanca, cansada) and Talking to makes "you" agree, in both casual and formal.
- **Arabic** translations are Modern Standard Arabic (understood everywhere); the slang and texting decks use everyday
  spoken words marked Egypt / Levant / Gulf. Arabic changes "you" by gender, so Talking to: Female rewrites
  هل تريد → هل تريدين, مستعد → مستعدة, اجلس → اجلسي. The formal button uses حضرتك, the respectful spoken "you".
  Text boxes and cards switch to right-to-left automatically. Files: `lang-ar.js`, `ar-grammar.js`, `phrases-ar.json`
  and the seven `*-arabic.json` / `arabic-slang.json` decks.
- **Japanese** starts on polite (です・ます) — right with staff, strangers and anyone older. The casual (タメ口) button
  rewrites sentence endings to the plain form for friends: 行きます → 行く, 食べましょう → 食べよう, 待ってください → 待って.
  Japanese has no male/female word endings, so I am / Talking to only pick the voices (Keita / Nanami).
  Files: `lang-ja.js`, `ja-grammar.js`, `phrases-ja.json` and the seven `*-japanese.json` / `japanese-slang.json` decks.
