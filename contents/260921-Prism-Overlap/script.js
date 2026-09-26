// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Plain JavaScript, no build step.

// Close or open the left column: on a wide screen the tab on its edge slides it away,
// on a narrow screen the three-line button folds it up. Both share one state,
// which is kept across the pages. The key is prefixed because every page under
// shiotatakumi.github.io shares one localStorage.
{
  const layout = document.querySelector(".layout");
  const toggles = document.querySelectorAll(".sidebar-toggle, .menu-toggle");
  const KEY = "walcom2027-prism:sidebar-closed";

  const setClosed = (closed) => {
    layout.classList.toggle("sidebar-closed", closed);
    const label = closed
      ? Lang.t({ en: "Show contents", ja: "目次を表示" })
      : Lang.t({ en: "Hide contents", ja: "目次を隠す" });
    for (const t of toggles) {
      t.setAttribute("aria-expanded", String(!closed));
      t.setAttribute("aria-label", label);
      t.title = label;
    }
    try { localStorage.setItem(KEY, closed ? "1" : "0"); } catch (e) { /* storage unavailable */ }
  };

  if (layout && toggles.length) {
    let closed = false;
    try { closed = localStorage.getItem(KEY) === "1"; } catch (e) { /* storage unavailable */ }
    setClosed(closed);
    // Turn the motion on only after the first paint (see .layout.animated in style.css).
    requestAnimationFrame(() => requestAnimationFrame(() => layout.classList.add("animated")));
    for (const t of toggles) {
      t.addEventListener("click", () => setClosed(!layout.classList.contains("sidebar-closed")));
    }
    Lang.onChange(() => setClosed(layout.classList.contains("sidebar-closed")));
  }
}

// Keep the reading position across a reload (and back or forward). On a wide screen it is the
// working area, not the page, that scrolls, and browsers restore only the page; the formulas
// typeset after loading change the heights anyway. So the position is kept in sessionStorage and
// restored once the fonts and MathJax are done. Coming from a link starts at the top, or at the
// #fragment, to which the page jumps again once the fonts and MathJax are done, for the same reason.
{
  const main = document.querySelector(".layout > main");
  const KEY = `walcom2027-prism:scroll:${location.pathname}`;
  // The working area on a wide screen, the page on a narrow one (see the media queries).
  const scroller = () => (main && getComputedStyle(main).overflowY !== "visible" ? main : document.scrollingElement);

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  let timer = 0;
  const save = () => {
    try { sessionStorage.setItem(KEY, String(scroller().scrollTop)); } catch (e) { /* storage unavailable */ }
  };
  const saveSoon = () => { clearTimeout(timer); timer = setTimeout(save, 150); };
  if (main) main.addEventListener("scroll", saveSoon, { passive: true });
  window.addEventListener("scroll", saveSoon, { passive: true });
  window.addEventListener("pagehide", save);

  const entry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  const returning = entry && (entry.type === "reload" || entry.type === "back_forward");
  let saved = null;
  try { saved = sessionStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }

  // Runs `jump` without the smooth scrolling of the working area, now, once the page, its fonts and
  // MathJax are done, and once more when the fonts of the formulas are in: MathJax asks for them only
  // when its output is laid out, a frame or two after it has typeset the page.
  const settle = (jump) => {
    const run = () => {
      const s = scroller(), smooth = s.style.scrollBehavior;
      s.style.scrollBehavior = "auto";
      jump(s);
      s.style.scrollBehavior = smooth;
    };
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    run();
    window.addEventListener("load", () => {
      const MJ = window.MathJax;
      Promise.all([
        document.fonts ? document.fonts.ready : null,
        MJ && MJ.startup && MJ.startup.promise ? MJ.startup.promise : null,
      ]).then(run).then(frames).then(() => (document.fonts ? document.fonts.ready : null)).then(run);
    });
  };

  if (returning && saved !== null) {
    settle((s) => { s.scrollTop = Number(saved); });
  } else if (location.hash) {
    // The target is looked up at each jump, since the lines of a program are made by program.js,
    // which runs after this script; a link to such a line brings it to the middle.
    let id = null;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { /* not a valid fragment */ }
    settle(() => {
      const target = id && document.getElementById(id);
      if (target) target.scrollIntoView({ block: /-L\d+$/.test(id) ? "center" : "start" });
    });
  }
}
