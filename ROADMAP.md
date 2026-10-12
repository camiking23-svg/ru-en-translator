# Translator roadmap

Live now: 🇷🇺 Russian · 🇫🇷 French · 🇨🇳 Mandarin · 🇲🇽 Spanish · 🇮🇹 Italian · 🇧🇷 Portuguese · 🇸🇦 Arabic (after this push)

## ✅ Arabic — built
Modern Standard Arabic translations at `/ar`, right-to-left layout, Hamed / Zariyah voices, male/female "you"
(listener) and "I" (speaker) forms, حضرتك for the formal button, seven decks + 67 starter phrases.

## 📌 Next up: Japanese (for the trip, around September next year)
- With months to spare so there's time to practise with it before the trip.
- Lean toward the polite traveler: the polite -masu / -desu forms by default, with casual speech secondary.
- The travel, food, numbers and polite-phrases decks matter most.

## 📌 Offline version (idea, parked)
- Replace the one Google Translate call with a translation model running on your own always-on machine. Everything else stays the same.
- Hardware: 16 GB+ RAM, a graphics card if possible, tens of GB of free disk space, and a machine that stays awake.
- Steps:
  1. Pick a multilingual model.
  2. Run it as a local service.
  3. Point `google()` in server.js at it.
  4. Pass the from/to languages.
  5. Test every language in both directions.
