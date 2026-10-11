// ---- French grammar fixes applied to Google's English → French output ----
// 1. tu (casual) / vous (formal): every "you" in the translation made to match, verbs and all
// 2. Talking to a woman: tu es prête, vous êtes allée, es-tu sûre ?
// 3. Female speaker: je suis fatiguée, je suis allée, enchantée
// "vous" here always means ONE person (the one you're talking to), like the Talking-to buttons.

const LET = "A-Za-zÀ-ÖØ-öø-ÿŒœÆæ";
const WORD_RE = new RegExp("([" + LET + "]+)");
const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;
const H_ASPIRE = ["haï", "hai", "hurl", "heurt", "hât", "hat", "harcel", "harcèl", "honte", "hauss", "hél", "hiss", "hu", "hach", "hant", "hasard", "haut"];
const startsVowel = w => VOWEL.test(w) && !(/^h/i.test(w) && H_ASPIRE.some(h => w.toLowerCase().startsWith(h)));

function matchCase(src, out) {
  if (!src || !out) return out;
  if (src.length > 1 && src === src.toUpperCase() && src !== src.toLowerCase()) return out.toUpperCase();
  return src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

// ---------- verbs: tu-form ⇄ vous-form ----------
const TU_VOUS = {
  es: "êtes", as: "avez", vas: "allez", fais: "faites", dis: "dites", redis: "redites", peux: "pouvez", veux: "voulez",
  dois: "devez", sais: "savez", viens: "venez", reviens: "revenez", deviens: "devenez", souviens: "souvenez",
  tiens: "tenez", obtiens: "obtenez", retiens: "retenez", appartiens: "appartenez", maintiens: "maintenez", contiens: "contenez",
  prends: "prenez", comprends: "comprenez", apprends: "apprenez", surprends: "surprenez", reprends: "reprenez", entreprends: "entreprenez",
  mets: "mettez", permets: "permettez", promets: "promettez", remets: "remettez", admets: "admettez", transmets: "transmettez",
  bois: "buvez", vois: "voyez", revois: "revoyez", prévois: "prévoyez", crois: "croyez", connais: "connaissez",
  reconnais: "reconnaissez", parais: "paraissez", apparais: "apparaissez", disparais: "disparaissez",
  pars: "partez", repars: "repartez", sors: "sortez", dors: "dormez", endors: "endormez", sers: "servez", sens: "sentez",
  ressens: "ressentez", mens: "mentez", écris: "écrivez", décris: "décrivez", inscris: "inscrivez", lis: "lisez", relis: "relisez",
  ris: "riez", souris: "souriez", vis: "vivez", suis: "suivez", poursuis: "poursuivez", fuis: "fuyez", cours: "courez",
  parcours: "parcourez", secours: "secourez", conduis: "conduisez", traduis: "traduisez", construis: "construisez",
  détruis: "détruisez", produis: "produisez", réduis: "réduisez", introduis: "introduisez", cuis: "cuisez", séduis: "séduisez",
  plais: "plaisez", tais: "taisez", reçois: "recevez", aperçois: "apercevez", déçois: "décevez", attends: "attendez",
  entends: "entendez", vends: "vendez", rends: "rendez", réponds: "répondez", perds: "perdez", descends: "descendez",
  défends: "défendez", dépends: "dépendez", prétends: "prétendez", confonds: "confondez", mords: "mordez", tends: "tendez",
  interromps: "interrompez", romps: "rompez", bats: "battez", combats: "combattez", vaux: "valez", crains: "craignez",
  plains: "plaignez", peins: "peignez", éteins: "éteignez", atteins: "atteignez", joins: "joignez", rejoins: "rejoignez",
  meurs: "mourez", assieds: "asseyez", ouvres: "ouvrez", offres: "offrez", souffres: "souffrez", couvres: "couvrez",
  découvres: "découvrez", cueilles: "cueillez", accueilles: "accueillez", vas_imp: "allez",
};
const VOUS_TU = {};
for (const [t, v] of Object.entries(TU_VOUS)) if (!t.includes("_") && !VOUS_TU[v]) VOUS_TU[v] = t;

// stem-changing -er verbs
const E_TYPE = ["achet", "rachet", "lev", "élev", "enlev", "soulev", "relev", "prélev", "men", "amen", "emmen", "promen", "ramen", "pes", "sem", "crev", "achev", "gel", "congel", "dégel", "pel", "harcel", "model"];
const DOUBLE_L = ["appel", "rappel", "épel", "renouvel", "ensorcel", "ruissel"];
const DOUBLE_T = ["jet", "rejet", "projet", "feuillet", "cachet"];
// -ier verbs whose present vous-form ends in -iez (not an imperfect)
const IEZ_PRESENT = new Set(["oubliez", "étudiez", "remerciez", "criez", "appréciez", "copiez", "photocopiez", "confiez", "mariez",
  "vérifiez", "pliez", "priez", "niez", "skiez", "enviez", "publiez", "multipliez", "simplifiez", "modifiez", "identifiez",
  "justifiez", "notifiez", "certifiez", "signifiez", "spécifiez", "riez", "souriez", "liez", "reliez", "fiez", "méfiez", "défiez",
  "associez", "négociez", "initiez", "expédiez", "déviez", "amplifiez", "clarifiez", "diversifiez", "unifiez", "qualifiez",
  "rectifiez", "planifiez", "écriez", "dédiez", "variez", "contrariez", "étudiez", "influez", "excusiez_"]);
const IREZ_PRESENT = new Set(["tirez", "retirez", "attirez", "admirez", "désirez", "respirez", "inspirez", "aspirez", "expirez",
  "soupirez", "virez", "délirez", "chavirez", "transpirez", "conspirez", "étirez"]);
const VREZ_FUTURE = new Set(["devrez", "vivrez", "revivrez", "survivrez", "recevrez", "apercevrez", "décevrez", "suivrez", "poursuivrez"]);
const ISSEZ_ER = new Set(["glissez", "hissez", "lissez", "plissez", "tissez", "pissez", "crissez"]);
const NOT_VERB_EZ = new Set(["chez", "assez", "nez", "rez"]);

function tuToVous(w) {
  if (TU_VOUS[w]) return TU_VOUS[w];
  if (/ras$/.test(w) && w.length > 3) return w.replace(/as$/, "ez");              // futur: seras → serez
  if (/ais$/.test(w) && w.length > 3) return w.replace(/ais$/, "iez");            // imparfait / conditionnel: étais → étiez
  if (/es$/.test(w) && w.length > 2) {                                            // -er present: parles → parlez
    let st = w.slice(0, -2);
    if (/[aou]i$/.test(st) && /[aou]ies$/.test(w)) st = st.slice(0, -1) + "y";   // paies → payez, envoies → envoyez
    else if (/ell$/.test(st) && DOUBLE_L.some(x => st.endsWith(x + "l"))) st = st.slice(0, -1);   // appelles → appelez
    else if (/ett$/.test(st) && DOUBLE_T.some(x => st.endsWith(x + "t"))) st = st.slice(0, -1);   // jettes → jetez
    else {
      const m = st.match(/^(.*)è([^aeiouyéèêàâîïôûù]{1,2})$/);                   // achètes → achetez, préfères → préférez
      if (m) st = m[1] + (E_TYPE.some(x => st.endsWith(x.replace(/e([^e]*)$/, "è$1"))) ? "e" : "é") + m[2];
    }
    return st + "ez";
  }
  if (/uis$/.test(w)) return w + "ez";                                             // conduis → conduisez
  if (/is$/.test(w) && w.length > 3) return w.replace(/is$/, "issez");             // finis → finissez
  return null;
}

function vousToTu(w) {
  if (VOUS_TU[w]) return VOUS_TU[w];
  if (!/ez$/.test(w) || NOT_VERB_EZ.has(w) || w.length < 4) return null;
  if (IEZ_PRESENT.has(w)) return w.replace(/ez$/, "es");                          // oubliez → oublies
  if (/[iy]iez$/.test(w) || /iez$/.test(w)) return w.replace(/iez$/, "ais");      // étiez → étais, voudriez → voudrais
  if (/[^a]issez$/.test(w) && !ISSEZ_ER.has(w)) return w.replace(/ssez$/, "s");      // finissez → finis
  if (/erez$/.test(w)) return w.replace(/ez$/, "as");                             // serez → seras, parlerez → parleras
  if (/irez$/.test(w) && !IREZ_PRESENT.has(w)) return w.replace(/ez$/, "as");     // irez → iras, finirez → finiras
  if (/(rrez|drez|ttrez|aîtrez|aitrez)$/.test(w) || ["aurez", "saurez"].includes(w) || VREZ_FUTURE.has(w)) return w.replace(/ez$/, "as");
  // ordinary -er verb: parlez → parles, with the usual spelling changes
  let st = w.slice(0, -2);
  if (/ay$|oy$|uy$/.test(st)) return st.slice(0, -1) + "ies";                      // payez → paies, envoyez → envoies
  if (DOUBLE_L.some(x => st.endsWith(x))) return st + "les";                         // appelez → appelles
  if (DOUBLE_T.some(x => st.endsWith(x))) return st + "tes";                         // jetez → jettes
  if (E_TYPE.some(x => st.endsWith(x))) return st.replace(/e([^aeiouyéèêàâîïôûù]{1,2})$/, "è$1") + "es";   // achetez → achètes
  const m = st.match(/^(.*)é([^aeiouyéèêàâîïôûù]{1,2})$/);
  if (m) return m[1] + "è" + m[2] + "es";                                           // préférez → préfères
  return st + "es";
}

// imperatives
const IMP_TU_VOUS = { sois: "soyez", aie: "ayez", sache: "sachez", veuille: "veuillez", va: "allez", vas: "allez",
  dis: "dites", fais: "faites", tais: "taisez", assieds: "asseyez" };
const IMP_VOUS_TU = { soyez: "sois", ayez: "aie", sachez: "sache", veuillez: "veuille", allez: "va", faites: "fais",
  dites: "dis", taisez: "tais", asseyez: "assieds" };
function impTuToVous(w) {
  if (IMP_TU_VOUS[w]) return IMP_TU_VOUS[w];
  if (/e$/.test(w)) return tuToVous(w + "s");
  return tuToVous(w);
}
function impVousToTu(w, keepS) {
  if (IMP_VOUS_TU[w]) return w === "allez" && keepS ? "vas" : IMP_VOUS_TU[w];
  const t = vousToTu(w);
  if (!t) return null;
  if (/[^iy]ais$|iras$|eras$/.test(t) && !/ez$/.test(w)) return null;
  return /es$/.test(t) && !keepS ? t.slice(0, -1) : t;                                // regardez → regarde
}
// commands someone might start a sentence with (tu-form), for spotting imperatives without a hyphen
const IMP_TU = new Set(("regarde écoute attends viens va dis fais prends mets donne montre laisse arrête excuse pardonne " +
  "appelle envoie écris lis essaie essaye aide sois aie sache entre sors pars reviens tiens lève mange bois goûte rappelle " +
  "prépare ferme ouvre allume éteins tourne continue suis choisis réfléchis finis oublie crois imagine avoue touche passe " +
  "apporte pose cherche trouve garde demande réponds répète parle explique compte rentre reste approche avance monte descends " +
  "cours bouge respire profite calme dépêche amuse repose assieds tais vérifie clique tape signe remplis patiente envoie " +
  "décide pense ramène sers prévois préviens rejoins écoute fonce").split(" "));

// ---------- nouns: is it "ton" or "ta"? ----------
const NOUN_F = new Set(("main fin faim mer nuit voix fois croix loi foi paix part mort dent forêt souris chair cour radio photo " +
  "moto météo auto vidéo fac clé clef eau peau maison raison saison chanson leçon façon boisson prison liaison cuisson rançon " +
  "fleur peur couleur chaleur valeur odeur douleur humeur sœur vapeur saveur erreur horreur faveur sueur soif amitié moitié " +
  "pitié voiture tête vie famille mère femme fille copine amie voisine cousine tante grand-mère adresse chambre cuisine table " +
  "porte fenêtre ville rue place gare plage langue question réponse idée envie journée soirée année semaine heure minute " +
  "carte valise robe chemise veste jupe chaussure montre clé bouteille tasse assiette cuillère fourchette viande soupe salade " +
  "pizza bière glace boîte lettre photo musique danse fête vacances santé chance histoire victoire mémoire équipe école " +
  "entreprise boutique banque pharmacie poste bibliothèque église piscine salle classe note facture commande réservation " +
  "connaissance présence absence patience confiance aide permission attention opinion décision situation relation " +
  "conversation information solution destination profession nationalité identité personnalité spécialité vérité").split(" "));
const NOUN_M = new Set(("problème système thème poème programme groupe monde nombre livre téléphone verre rêve centre musée " +
  "lycée homme père frère ventre beurre fromage sucre légume vinaigre cidre café kilomètre mètre litre siècle membre peigne " +
  "signe génie incendie parapluie silence portable stylo magazine modèle type rôle contrôle style crime domaine risque masque " +
  "disque casque chèque spectacle obstacle miracle article véhicule territoire laboratoire pourboire dentiste guide " +
  "anniversaire numéro nom prénom âge mari copain ami fils oncle cousin voisin travail boulot métier rendez-vous week-end " +
  "repas déjeuner dîner petit-déjeuner dessert plat menu vin pain lait thé jus chocolat gâteau film jeu sport chien chat " +
  "hôtel appartement bureau ordinateur passeport billet ticket train bus métro taxi vélo avion bateau sac manteau pantalon " +
  "pull chapeau parfum cadeau prix compte message mail email courriel avis choix projet plan voyage pays visage cœur bonheur " +
  "malheur honneur temps moment jour soir matin mois an été hiver automne printemps côté comité pâté avenir passé conseil " +
  "accord accueil emploi besoin souvenir sourire rire regard corps esprit caractère genre talent goût succès échec désir " +
  "plaisir avis service quartier village restaurant magasin marché supermarché hôpital aéroport parking escalier ascenseur").split(" "));
function nounGender(w) {
  w = (w || "").toLowerCase();
  if (NOUN_F.has(w)) return "f";
  if (NOUN_M.has(w)) return "m";
  if (/(tion|sion|xion|té|ité|ette|ence|ance|ure|ude|ade|ine|elle|esse|ée|ie|ise|ière|euse|trice|ienne|onne|ace|ique)$/.test(w)) return "f";
  if (/(age|isme|ème|ège|acle|ment|eau|oir|ier|et|al|ail|eil|at|er|ard|in|on|ou|eur|isme|ut|us|ot|ard)$/.test(w)) return "m";
  if (/e$/.test(w)) return "f";
  return "m";
}

// ---------- adjectives / past participles: masculine → feminine ----------
const FEM_IRREG = { beau: "belle", bel: "belle", nouveau: "nouvelle", nouvel: "nouvelle", fou: "folle", fol: "folle", mou: "molle",
  vieux: "vieille", vieil: "vieille", frais: "fraîche", blanc: "blanche", franc: "franche", sec: "sèche", public: "publique",
  grec: "grecque", long: "longue", doux: "douce", faux: "fausse", roux: "rousse", jaloux: "jalouse", gentil: "gentille",
  favori: "favorite", malin: "maligne", bénin: "bénigne", gros: "grosse", bas: "basse", épais: "épaisse", las: "lasse",
  gras: "grasse", inquiet: "inquiète", complet: "complète", incomplet: "incomplète", discret: "discrète", secret: "secrète",
  concret: "concrète", muet: "muette", net: "nette", sot: "sotte", bon: "bonne", mignon: "mignonne", nul: "nulle",
  pareil: "pareille", meilleur: "meilleure", supérieur: "supérieure", inférieur: "inférieure", majeur: "majeure",
  mineur: "mineure", extérieur: "extérieure", intérieur: "intérieure", antérieur: "antérieure", postérieur: "postérieure",
  acteur: "actrice", directeur: "directrice", créateur: "créatrice", conservateur: "conservatrice", instituteur: "institutrice",
  ambassadeur: "ambassadrice", copain: "copine", héros: "héroïne", fier: "fière", cher: "chère", dernier: "dernière",
  premier: "première", léger: "légère", étranger: "étrangère", entier: "entière", grand: "grande", chaud: "chaude",
  marié: "mariée", né: "née", végan: "végane", vegan: "végane", sympa: "sympa", partant: "partante", crevé: "crevée",
  paysan: "paysanne", chic: "chic", aigu: "aiguë", ambigu: "ambiguë", exigu: "exiguë", andalou: "andalouse",
  frisé: "frisée", bavard: "bavarde", turc: "turque", hébreu: "hébraïque" };
const FEM_SAME = new Set(("mal bien mieux là ici debout ok ok sympa super top chic cool fun fan zen bio sexy gay standard marron " +
  "orange cash nickel extra pro ado prof chef médecin docteur ingénieur témoin bébé membre dispo accro relou chelou ouf " +
  "vénère grave trop plus pas très si en à au de du des le la les un une mon ton son ce cet cette moins aussi tellement " +
  "vraiment assez peu déjà encore toujours jamais rien personne là-bas partout dehors dedans ensemble seul? kiffe malade " +
  "désolée").split(" "));
function feminine(w) {
  const lw = w.toLowerCase();
  let out;
  if (FEM_IRREG[lw]) out = FEM_IRREG[lw];
  else if (FEM_SAME.has(lw) || /e$/.test(lw) || /[^a-zà-ÿœ]/.test(lw) || lw.length < 2) return w;
  else if (/é$/.test(lw)) out = lw + "e";
  else if (/eux$/.test(lw)) out = lw.slice(0, -1) + "se";
  else if (/eur$/.test(lw)) out = lw.slice(0, -1) + "se";
  else if (/if$/.test(lw)) out = lw.slice(0, -1) + "ve";
  else if (/er$/.test(lw)) out = lw.slice(0, -2) + "ère";
  else if (/el$|eil$/.test(lw)) out = lw + "le";
  else if (/ien$|éen$/.test(lw)) out = lw + "ne";
  else if (/on$/.test(lw)) out = lw + "ne";
  else if (/et$/.test(lw)) out = lw + "te";
  else if (/[éeiu]s$|ais$|ois$|[^s]s$/.test(lw) && /[aeiouéè]s$/.test(lw)) out = lw + "e";
  else if (/x$/.test(lw)) return w;
  else out = lw + "e";
  return matchCase(w, out);
}
// "vous" means one person here, so Google's plural agreement (prêts, allés) becomes singular
const SING_SAME = new Set(["assis", "pris", "surpris", "mis", "compris", "appris", "gris", "épris", "permis", "promis", "soumis",
  "admis", "acquis", "conquis", "exquis", "précis", "indécis", "confus", "inclus", "exclus", "obtus", "frais", "gros", "bas",
  "las", "gras", "épais", "mauvais", "heureux", "sérieux", "jaloux", "doux", "faux", "roux", "vieux", "nerveux", "curieux",
  "joyeux", "amoureux", "malheureux", "généreux", "délicieux", "dangereux", "paresseux", "ennuyeux", "courageux", "anxieux",
  "honteux", "religieux", "précieux", "furieux", "chanceux", "radieux", "soucieux", "pas", "plus", "très", "trop", "toujours"]);
function singular(w) {
  const lw = w.toLowerCase();
  if (SING_SAME.has(lw) || /ais$|ois$/.test(lw) || !/s$|aux$/.test(lw) || lw.length < 4) return w;
  let out;
  if (/aux$/.test(lw)) out = lw.replace(/aux$/, "al");
  else out = lw.slice(0, -1);
  return matchCase(w, out);
}

// ---------- tokens ----------
// "Comment t'appelles-tu ?" → words: Comment, t, appelles, tu   separators: " ", "'", "-", " ?"
function tokens(s) {
  const T = s.split(WORD_RE);      // even = separators, odd = words
  const n = (T.length - 1) / 2;
  const W = i => T[2 * i + 1];
  return { T, n, W,
    low: i => (i >= 0 && i < n ? T[2 * i + 1].toLowerCase() : ""),
    before: i => T[2 * i], after: i => T[2 * i + 2],
    set(i, w) { if (T[2 * i + 1] !== w) { T[2 * i + 1] = matchCase(T[2 * i + 1], w); this.changed.add(i); } },
    setAfter(i, sep) { T[2 * i + 2] = sep; },
    changed: new Set(),
    text: () => T.join("") };
}
const CLAUSE_BREAK = /[.,!?;:…—–()«»"“”\n]/;
const ELIDABLE = { ne: "n", te: "t", me: "m", je: "j", se: "s" };
const UNELIDE = { n: "ne", t: "te", m: "me", j: "je", s: "se" };
const CLITIC = new Set(["me", "m", "te", "t", "se", "s", "le", "la", "les", "l", "lui", "leur", "y", "en", "nous", "vous"]);
const SUBJ_PRON = new Set(["je", "j", "il", "elle", "on", "nous", "ils", "elles", "ce", "c", "ça", "cela", "qui"]);
const PREPS = new Set(["à", "de", "d", "pour", "avec", "chez", "sans", "sur", "sous", "vers", "contre", "entre", "par", "comme",
  "que", "qu", "et", "ou", "envers", "après", "avant", "derrière", "devant", "selon", "malgré", "est", "suis", "était", "sauf",
  "moi", "toi", "lui", "aussi", "non", "pas", "merci", "salut", "bonjour", "coucou", "au", "aux", "c"]);
const AFTER_TOI = new Set(["aussi", "même", "seul", "seule", "non", "et", "ou", "là", "", "qui", "seulement", "d", "de"]);
const ADVERBS = new Set(["pas", "plus", "jamais", "très", "trop", "si", "tellement", "vraiment", "assez", "bien", "déjà", "encore",
  "toujours", "aussi", "super", "hyper", "vachement", "carrément", "complètement", "totalement", "un", "peu", "tout", "toute",
  "extrêmement", "particulièrement", "plutôt", "moins", "presque", "enfin", "sûrement", "probablement", "peut", "être",
  "absolument", "parfois", "souvent", "rarement", "même", "point", "vraiment", "franchement", "grave", "tant", "aussitôt",
  "ne", "n"]);
const STOP_CHAIN = new Set(["à", "au", "aux", "en", "dans", "de", "du", "des", "d", "chez", "sur", "sous", "avec", "pour", "par",
  "ici", "là", "le", "la", "les", "l", "une", "ce", "cette", "cet", "mon", "ma", "mes", "ton", "ta", "tes", "votre", "vos",
  "son", "sa", "ses", "notre", "nos", "leur", "que", "qu", "qui", "quoi", "comme", "si", "quand", "parce", "car", "mais",
  "donc", "or", "ni", "train", "d'accord", "accord", "ça", "cela", "ceci", "vous", "tu", "toi", "moi", "nous", "il", "elle",
  "je", "j", "on", "y", "ils", "elles", "lui", "eux", "rien", "personne", "beaucoup", "trop", "combien", "où", "comment",
  "pourquoi", "fait"]);

// After a form of "être" (or "devenir", "rester", "se sentir"…): make the adjectives/participles agree
function agreeChain(tk, start, wantF, makeSingular) {
  let k = start, did = false;
  while (k < tk.n) {
    if (CLAUSE_BREAK.test(tk.before(k)) && k !== start) break;
    const w = tk.low(k);
    if (w === "un" && tk.low(k + 1) === "peu") { k += 2; continue; }
    if (ADVERBS.has(w) && !did) { k++; continue; }
    if (did) {
      if ((w === "et" || w === "ou" || w === "mais") && !CLAUSE_BREAK.test(tk.before(k))) { k++; did = false; continue; }
      break;
    }
    if (STOP_CHAIN.has(w) || (/^[A-ZÀ-Ý]/.test(tk.W(k)) && k !== 0)) break;
    if (/^(er|ir|re|oir)$/.test(w.slice(-2)) && /(er|ir|oir)$/.test(w) && !/^(fier|cher|dernier|premier|léger|étranger|entier|amer|noir|clair)$/.test(w)) break; // an infinitive
    let x = tk.W(k);
    if (makeSingular) x = singular(x);
    if (wantF) x = feminine(x);
    if (x !== tk.W(k)) tk.set(k, x.toLowerCase());
    did = true;
    // a past participle that is itself a copula keeps going: "suis devenu folle", "suis resté calme"
    if (/^(devenu|devenue|resté|restée|été)$/.test(tk.low(k))) did = false;
    k++;
  }
}

// Fix "ne/te/me/je" in front of a word that changed (tu ne vas → vous n'allez, vous t'aimez → …)
function fixElision(tk) {
  for (let i = 0; i < tk.n - 1; i++) {
    const w = tk.low(i);
    if (!tk.changed.has(i) && !tk.changed.has(i + 1)) continue;
    const sep = tk.after(i);
    const next = tk.W(i + 1);
    if (ELIDABLE[w] && startsVowel(next) && /^\s+$/.test(sep)) { tk.T[2 * i + 1] = matchCase(tk.W(i), ELIDABLE[w]); tk.setAfter(i, "'"); }
    else if (UNELIDE[w] && /^['’]$/.test(sep) && !startsVowel(next) && w !== "s") { tk.T[2 * i + 1] = matchCase(tk.W(i), UNELIDE[w]); tk.setAfter(i, " "); }
  }
}

function sentenceSplit(s) {
  return s.split(/([.!?…]+[»”")]*\s*|\n+)/);
}

// ---------- tu ⇄ vous ----------
function setFormality(fr, mode, l) {
  const parts = sentenceSplit(fr);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const isQ = /\?/.test(parts[si + 1] || "");
    const tk = tokens(sent);
    const clauseStart = i => i === 0 || CLAUSE_BREAK.test(tk.before(i));
    const hyphenBefore = i => tk.before(i) === "-" || tk.before(i) === "-t-";
    const done = new Set();
    const n = tk.n;
    // the verb that goes with a subject pronoun at k: skip ne/n' and object pronouns
    const verbAfter = k => {
      let j = k + 1;
      while (j < n && !CLAUSE_BREAK.test(tk.before(j)) && (tk.low(j) === "ne" || tk.low(j) === "n" || CLITIC.has(tk.low(j)))) j++;
      return j < n && !CLAUSE_BREAK.test(tk.before(j)) ? j : -1;
    };
    const reflexiveBetween = (k, j, from, to) => {
      for (let x = k + 1; x < j; x++) if (from.includes(tk.low(x)) && !done.has(x)) { tk.set(x, to); if (to === "vous") tk.setAfter(x, " "); done.add(x); }
    };

    if (mode === "v") {
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (done.has(k)) continue;
        // "as-tu", "t'appelles-tu" (inverted question)
        if (w === "tu" && hyphenBefore(k)) {
          const v = k - 1, f = tuToVous(tk.low(v));
          if (f) { tk.set(v, f); done.add(v); }
          if (v - 1 >= 0 && (tk.low(v - 1) === "t" || tk.low(v - 1) === "te")) { tk.set(v - 1, "vous"); tk.setAfter(v - 1, " "); done.add(v - 1); }
          tk.set(k, "vous"); done.add(k);
          continue;
        }
        // subject: "tu (ne) (te) verbe", and casual "t'es / t'as"
        const casualT = w === "t" && /^['’]$/.test(tk.after(k)) && ["es", "as", "étais", "avais", "vas"].includes(tk.low(k + 1)) && !SUBJ_PRON.has(tk.low(k - 1));
        if (w === "tu" || casualT) {
          const j = verbAfter(k);
          if (j >= 0) {
            const f = tuToVous(tk.low(j));
            if (f) { tk.set(j, f); done.add(j); }
            reflexiveBetween(k, j, ["te", "t"], "vous");
          }
          tk.set(k, "vous"); if (casualT) tk.setAfter(k, " "); done.add(k);
          continue;
        }
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (done.has(k)) continue;
        // commands: "Dis-moi", "Calme-toi", "Regarde !", "Ne t'inquiète pas"
        const hyphObj = tk.after(k) === "-" && ["moi", "toi", "le", "la", "les", "lui", "nous", "leur", "en", "y"].includes(tk.low(k + 1));
        let neStart = false;
        if (clauseStart(k) === false) {
          let b = k - 1;
          while (b >= 0 && CLITIC.has(tk.low(b)) && !CLAUSE_BREAK.test(tk.before(b + 1))) b--;
          neStart = b >= 0 && (tk.low(b) === "ne" || tk.low(b) === "n") && clauseStart(b) && /\b(pas|plus|jamais|rien)\b/i.test(sent.slice(sent.indexOf(tk.W(k))));
        }
        if ((hyphObj && !hyphenBefore(k)) || (clauseStart(k) && IMP_TU.has(w) && !["tu", "-"].includes(tk.after(k).trim()) && tk.low(k + 1) !== "tu") || neStart) {
          const f = impTuToVous(w);
          if (f) {
            tk.set(k, f); done.add(k);
            if (tk.low(k + 1) === "toi" && tk.after(k) === "-") { tk.set(k + 1, "vous"); done.add(k + 1); }
            if (neStart) for (let b = k - 1; b >= 0 && CLITIC.has(tk.low(b)); b--) if (tk.low(b) === "t" || tk.low(b) === "te") { tk.set(b, "vous"); tk.setAfter(b, " "); done.add(b); }
            continue;
          }
        }
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (done.has(k)) continue;
        const prev = tk.low(k - 1);
        if (w === "te" || (w === "t" && /^['’]$/.test(tk.after(k)))) { tk.set(k, "vous"); tk.setAfter(k, " "); }
        else if (w === "toi") tk.set(k, "vous");
        else if (w === "ton" || w === "ta") tk.set(k, "votre");
        else if (w === "tes") tk.set(k, "vos");
        else if (w === "tien" && prev === "le") tk.set(k, "vôtre");
        else if (w === "tienne" && prev === "la") tk.set(k, "vôtre");
        else if ((w === "tiens" || w === "tiennes") && prev === "les") tk.set(k, "vôtres");
        else if ((w === "salut" || w === "coucou") && k === 0) tk.set(k, "bonjour");
      }
    } else {
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (w !== "vous" || done.has(k) || !hyphenBefore(k)) continue;
        {
          const v = k - 1;
          if (isQ && !clauseStartImperative(tk, v)) {
            // inverted question: "Pouvez-vous" → "Peux-tu", "Comment vous appelez-vous" → "Comment t'appelles-tu"
            const f = vousToTu(tk.low(v));
            if (f) { tk.set(v, f); done.add(v); }
            if (v - 1 >= 0 && tk.low(v - 1) === "vous" && !done.has(v - 1)) { tk.set(v - 1, "te"); done.add(v - 1); }
            tk.set(k, "tu"); done.add(k);
          } else {
            // command: "Asseyez-vous" → "Assieds-toi"
            const f = impVousToTu(tk.low(v), false);
            if (f) { tk.set(v, f); done.add(v); }
            tk.set(k, "toi"); done.add(k);
          }
          continue;
        }
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (w !== "vous" || done.has(k)) continue;
        const prev = tk.low(k - 1);
        if (prev === "ne" || prev === "n") continue;
        const j = verbAfter(k);
        const subjectVerb = j >= 0 && !SUBJ_PRON.has(prev) && !(PREPS.has(prev) && prev !== "et" && prev !== "ou" && prev !== "que" && prev !== "qu") && vousToTu(tk.low(j));
        if (subjectVerb) {
          tk.set(j, vousToTu(tk.low(j))); done.add(j);
          for (let x = k + 1; x < j; x++) if (tk.low(x) === "vous" && !done.has(x)) { tk.set(x, "te"); done.add(x); }
          tk.set(k, "tu"); done.add(k);
        }
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (done.has(k)) continue;
        // commands: "Regardez", "Dites-moi", "Ne vous inquiétez pas", "Veuillez patienter"
        const hyphObj = tk.after(k) === "-" && ["moi", "le", "la", "les", "lui", "nous", "leur", "en", "y"].includes(tk.low(k + 1));
        let neStart = false, b = k - 1;
        while (b >= 0 && CLITIC.has(tk.low(b)) && !CLAUSE_BREAK.test(tk.before(b + 1))) b--;
        if (b >= 0 && b < k - 0 && (tk.low(b) === "ne" || tk.low(b) === "n") && clauseStart(b) && b !== k) neStart = true;
        const looksImp = clauseStart(k) && (IMP_VOUS_TU[w] || (/ez$/.test(w) && !NOT_VERB_EZ.has(w))) &&
          !(w === "allez" && /^[\s]*[,!.]/.test(tk.after(k)) ) && tk.low(k + 1) !== "vous";
        if (w === "veuillez" && clauseStart(k) && /(er|ir|re)$/.test(tk.low(k + 1))) {
          tk.set(k, "merci"); tk.setAfter(k, " de "); done.add(k);
          if (startsVowel(tk.W(k + 1))) tk.setAfter(k, " d'");
          continue;
        }
        if (hyphObj || looksImp || (neStart && /ez$|^(soyez|ayez|faites|dites)$/.test(w))) {
          const keepS = tk.after(k) === "-" && ["en", "y"].includes(tk.low(k + 1));
          const f = impVousToTu(w, keepS);
          if (f) { tk.set(k, f); done.add(k); }
        }
      }
      for (let k = 0; k < n; k++) {
        const w = tk.low(k);
        if (done.has(k)) continue;
        const prev = tk.low(k - 1), next = tk.low(k + 1);
        if (w === "vous") {
          // an object pronoun in front of a verb → te/t'; on its own, after a preposition → toi
          const beforeVerb = next && !CLAUSE_BREAK.test(tk.after(k)) && !AFTER_TOI.has(next) &&
            (!PREPS.has(prev) || /(er|ir|re|oir)$/.test(next) || CLITIC.has(next)) && !(tk.after(k) === "-");
          if (beforeVerb && (SUBJ_PRON.has(prev) || prev === "ne" || prev === "n" || PREPS.has(prev) || CLITIC.has(next) || k === 0 || /(er|ir|re|oir)$/.test(next) || /^[a-zà-ÿ]/.test(tk.W(k + 1))))
            tk.set(k, "te");
          else tk.set(k, "toi");
          if (tk.after(k) === "-" && next === "même") tk.set(k, "toi");
        }
        else if (w === "votre") {
          let g = startsVowel(tk.W(k + 1) || "") ? "m" : nounGender(next);
          tk.set(k, g === "f" ? "ta" : "ton");
        }
        else if (w === "vos") tk.set(k, "tes");
        else if (w === "vôtre" && prev === "le") tk.set(k, "tien");
        else if (w === "vôtre" && prev === "la") tk.set(k, "tienne");
        else if (w === "vôtres" && prev === "les") tk.set(k, "tiens");
      }
    }
    fixElision(tk);
    // Talking to a woman (tu or vous): tu es prête, vous êtes allée, êtes-vous sûre ?
    agreeListener(tk, l, mode);
    return tk.text();
  }).join("");
}
function clauseStartImperative(tk, v) { return false; }

const ETRE_TU = new Set(["es", "étais", "seras", "serais", "sois", "fus"]);
const ETRE_VOUS = new Set(["êtes", "étiez", "serez", "seriez", "soyez"]);
const COPULA_TU = new Set(["sens", "sentais", "sembles", "semblais", "restes", "restais", "deviens", "devenais", "parais", "avais", "as"]);
const COPULA_VOUS = new Set(["sentez", "sentiez", "semblez", "sembliez", "restez", "restiez", "devenez", "deveniez", "paraissez", "aviez", "avez"]);
function agreeListener(tk, l, mode) {
  const pron = mode === "v" ? "vous" : "tu";
  const ETRE = mode === "v" ? ETRE_VOUS : ETRE_TU, COP = mode === "v" ? COPULA_VOUS : COPULA_TU;
  const wantF = l === "f";
  const sing = true;           // the person you're talking to is one person
  for (let k = 0; k < tk.n; k++) {
    const w = tk.low(k);
    let start = -1;
    if (w === pron && tk.before(k) !== "-") {
      let j = k + 1;
      while (j < tk.n && ["ne", "n", "te", "t", "vous", "pas"].includes(tk.low(j)) && !(j === k + 1 && tk.low(j) === "vous" && mode === "v" && ETRE.has(tk.low(j + 1)) === false && tk.low(j + 1) !== "vous" && !ETRE.has(tk.low(j + 1)))) j++;
      const v = tk.low(j);
      if (ETRE.has(v)) start = j + 1;
      else if ((v === "as" || v === "avez" || v === "avais" || v === "aviez") && tk.low(j + 1) === "été") start = j + 2;
      else if ((v === "as" || v === "avez") && tk.low(j + 1) === "l" ) start = -1;
      else if (COP.has(v) && v !== "as" && v !== "avez" && v !== "avais" && v !== "aviez") start = j + 1;
    } else if (w === pron && tk.before(k) === "-") {
      // inverted: "es-tu prêt", "êtes-vous sûr", "t'es-tu levé"
      const v = tk.low(k - 1);
      if (ETRE.has(v) || COP.has(v) && v !== "as" && v !== "avez") start = k + 1;
      if ((v === "as" || v === "avez") && tk.low(k + 1) === "été") start = k + 2;
    } else if ((w === "sois" && mode === "t" || w === "soyez" && mode === "v") && (k === 0 || CLAUSE_BREAK.test(tk.before(k)) || tk.low(k - 1) === "ne")) {
      start = k + 1;                                   // "Sois prudent" / "Soyez prudent"
    }
    if (start >= 0 && start < tk.n && !CLAUSE_BREAK.test(tk.before(start))) agreeChain(tk, start, wantF, sing);
  }
}

// ---------- female speaker: je suis fatiguée, je suis allée, enchantée ----------
const ETRE_JE = new Set(["suis", "étais", "serai", "serais", "sois", "fus"]);
const COPULA_JE = new Set(["sens", "sentais", "sentirai", "semble", "semblais", "reste", "restais", "deviens", "devenais", "parais"]);
const ALONE_JE = new Set(["enchanté", "désolé", "ravi", "navré", "content", "heureux", "épuisé", "crevé", "prêt", "fatigué"]);
const NO_AGREE_REFLEXIVE = new Set(["demandé", "dit", "parlé", "téléphoné", "écrit", "souri", "plu", "succédé", "ressemblé",
  "menti", "nui", "rendu", "permis", "promis", "acheté", "lavé"]);
function makeFemale(fr) {
  const parts = sentenceSplit(fr);
  return parts.map((sent, si) => {
    if (si % 2) return sent;
    const tk = tokens(sent);
    for (let k = 0; k < tk.n; k++) {
      const w = tk.low(k);
      let start = -1, reflexive = false;
      if (w === "je" || (w === "j" && /^['’]$/.test(tk.after(k)))) {
        let j = k + 1;
        while (j < tk.n && ["ne", "n", "me", "m"].includes(tk.low(j))) { if (tk.low(j) === "me" || tk.low(j) === "m") reflexive = true; j++; }
        const v = tk.low(j);
        if (ETRE_JE.has(v)) start = j + 1;
        else if ((v === "ai" || v === "avais") && (tk.low(j + 1) === "été" || (tk.low(j + 1) === "pas" && tk.low(j + 2) === "été"))) start = tk.low(j + 1) === "été" ? j + 2 : j + 3;
        else if (COPULA_JE.has(v)) start = j + 1;
      } else if (w === "je" && tk.before(k) === "-") {
        if (ETRE_JE.has(tk.low(k - 1))) start = k + 1;    // "suis-je prête ?"
      } else if (ALONE_JE.has(w) && (k === 0 || CLAUSE_BREAK.test(tk.before(k)))) {
        // "Enchanté !", "Désolé pour le retard", "Ravi de vous rencontrer" — the speaker is implied
        const nx = tk.low(k + 1);
        if (k + 1 >= tk.n || CLAUSE_BREAK.test(tk.after(k)) || ["de", "d", "pour", "du", "que", "qu", "mais", "si"].includes(nx)) start = k;
      }
      if (start < 0 || start >= tk.n) continue;
      if (start > 0 && CLAUSE_BREAK.test(tk.before(start)) && start !== k) continue;
      if (reflexive && NO_AGREE_REFLEXIVE.has(tk.low(start))) continue;   // je me suis demandé (no agreement)
      agreeChain(tk, start, true, false);
    }
    return tk.text();
  }).join("");
}

module.exports = { setFormality, makeFemale, tuToVous, vousToTu, feminine, nounGender, impTuToVous, impVousToTu };
