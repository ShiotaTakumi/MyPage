// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// English and Japanese. A text is written in both languages, marked with lang="en" and lang="ja",
// and the language of <html> decides which one is shown (see style.css). Titles and labels that are
// attributes carry their Japanese in data-ja (on <title>) and data-ja-label (for aria-label).
//
// This script runs in <head>, before the page is drawn, so that a page opened in Japanese never shows
// English first. English is the default; the choice is kept across the pages, and ?lang=ja (or
// ?lang=en) in the address sets it. Plain JavaScript, no build step.

const Lang = (() => {
  const KEY = "walcom2027-prism:lang";
  const LANGS = ["en", "ja"];
  const listeners = [];

  const asked = new URLSearchParams(location.search).get("lang");
  let current = "en";
  try { current = localStorage.getItem(KEY) || current; } catch (e) { /* storage unavailable */ }
  if (asked) current = asked;
  if (!LANGS.includes(current)) current = "en";

  const remember = () => {
    try { localStorage.setItem(KEY, current); } catch (e) { /* storage unavailable */ }
  };

  // The text in the current language, from { en: ..., ja: ... }.
  const t = (text) => text[current] ?? text.en;

  // The title of the page, the labels of the elements, and the state of the switch.
  function relabel() {
    const title = document.querySelector("title");
    if (title && title.dataset.ja) {
      if (!title.dataset.en) title.dataset.en = title.textContent;
      document.title = title.dataset[current];
    }
    for (const el of document.querySelectorAll("[data-ja-label]")) {
      if (!el.dataset.enLabel) el.dataset.enLabel = el.getAttribute("aria-label");
      el.setAttribute("aria-label", current === "ja" ? el.dataset.jaLabel : el.dataset.enLabel);
    }
    for (const b of document.querySelectorAll(".lang-switch button")) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === current));
    }
  }

  function set(lang) {
    if (!LANGS.includes(lang) || lang === current) return;
    current = lang;
    remember();
    document.documentElement.lang = current;
    relabel();
    // Keep ?lang= in the address in step, so that a reload shows the language chosen.
    try {
      const url = new URL(location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", current);
        history.replaceState(history.state, "", url);
      }
    } catch (e) { /* the address cannot be changed, as on file:// in some browsers */ }
    for (const fn of listeners) fn(current);
  }

  // Calls fn with the new language whenever it changes.
  const onChange = (fn) => { listeners.push(fn); };

  document.documentElement.lang = current;
  if (asked) remember();
  relabel();                            // the title is already there; the rest once the page is read
  document.addEventListener("DOMContentLoaded", () => {
    relabel();
    for (const b of document.querySelectorAll(".lang-switch button")) {
      b.addEventListener("click", () => set(b.dataset.lang));
    }
  });

  return { get current() { return current; }, t, set, onChange };
})();
