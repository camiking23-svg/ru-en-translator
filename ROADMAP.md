# Translator roadmap

Live now: 🇷🇺 Russian · 🇫🇷 French · 🇨🇳 Mandarin · 🇲🇽 Spanish · 🇮🇹 Italian · 🇧🇷 Portuguese · 🇸🇦 Arabic · 🇯🇵 Japanese (after this push)

## ✅ Arabic — built
Modern Standard Arabic translations at `/ar`, right-to-left layout, Hamed / Zariyah voices, male/female "you"
(listener) and "I" (speaker) forms, حضرتك for the formal button, seven decks + 67 starter phrases.

## ✅ Japanese — built (for the September trip)
Polite です・ます by default with a casual タメ口 button, Keita / Nanami voices, seven decks weighted to travel
(trains and IC cards, ordering, ticket machines, tax-free shopping, emergencies) + 67 starter phrases.
Practise with the Polite, Food, Travel and Numbers decks before you go.

## 📌 Next up: (open — say the word)

## 📌 Offline version (idea, parked)
- Replace the one Google Translate call with a translation model running on your own always-on machine. Everything else stays the same.
- Hardware: 16 GB+ RAM, a graphics card if possible, tens of GB of free disk space, and a machine that stays awake.
- Steps:
  1. Pick a multilingual model.
  2. Run it as a local service.
  3. Point `google()` in server.js at it.
  4. Pass the from/to languages.
  5. Test every language in both directions.
