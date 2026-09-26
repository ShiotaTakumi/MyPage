// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// The programs page (program.html, written by scripts/gen_program_page.py): the source code of each
// program gets line numbers, each a link to its line (#enumeration-L12), and colors for Python, and a
// button copies it. The source code is folded at first; a link to one of its lines unfolds it.
// Plain JavaScript, no build step.

const Program = (() => {
  // ---------------------------------------------------------------- colors for Python

  const KEYWORDS = new Set(("False None True and as assert async await break class continue def del elif else except " +
    "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield").split(" "));
  const BUILTINS = new Set(("abs all any bool dict enumerate float int isinstance len list map max min open print range " +
    "reversed round set sorted str sum tuple zip").split(" "));

  // The pieces of Python code, in the order tried at each position.
  const TOKEN = new RegExp([
    /(?<comment>#[^\n]*)/,
    /(?<string>[rRbBfFuU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))/,
    /(?<number>\b\d[\d_]*(?:\.\d+)?\b)/,
    /(?<word>[A-Za-z_]\w*)/,
  ].map((r) => r.source).join("|"), "g");

  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // The code as a list of lines, each a list of [kind, text]; a piece that spans lines is cut at them.
  function tokenize(code) {
    const pieces = [];
    let last = 0, after = "";
    for (const m of code.matchAll(TOKEN)) {
      if (m.index > last) pieces.push(["", code.slice(last, m.index)]);
      const g = m.groups;
      let kind = "";
      if (g.comment) kind = "comment";
      else if (g.string) kind = /^[rRbBfFuU]{0,2}("""|''')/.test(g.string) ? "doc" : "string";   // docstrings apart
      else if (g.number) kind = "number";
      else if (KEYWORDS.has(g.word)) kind = "keyword";
      else if (after === "def" || after === "class") kind = "name";
      else if (BUILTINS.has(g.word)) kind = "builtin";
      pieces.push([kind, m[0]]);
      if (g.word) after = g.word;
      else if (!/^\s*$/.test(m[0])) after = m[0];
      last = m.index + m[0].length;
    }
    if (last < code.length) pieces.push(["", code.slice(last)]);

    const lines = [[]];
    for (const [kind, text] of pieces) {
      text.split("\n").forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part) lines[lines.length - 1].push([kind, part]);
      });
    }
    return lines;
  }

  // ---------------------------------------------------------------- the page

  function setup() {
    const sections = [...document.querySelectorAll("section.program")];
    if (!sections.length) return;

    for (const section of sections) {
      const pre = section.querySelector("pre.source"), code = pre.textContent;
      pre.innerHTML = tokenize(code).map((pieces, i) => {
        const id = `${section.id}-L${i + 1}`;
        const body = pieces.map(([kind, text]) => (kind ? `<span class="tok-${kind}">${escape(text)}</span>` : escape(text))).join("");
        return `<span class="line" id="${id}"><a class="ln" href="#${id}" aria-hidden="true" tabindex="-1">${i + 1}</a><span class="lc">${body}</span></span>`;
      }).join("");

      // Copies the code as it is in the file.
      const button = section.querySelector("button.copy");
      const label = (done) => { button.textContent = done ? Lang.t({ en: "Copied", ja: "コピーしました" }) : Lang.t({ en: "Copy", ja: "コピー" }); };
      label(false);
      Lang.onChange(() => label(false));
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch (e) {
          // Without the clipboard API (as on file://), copy through a selection.
          const area = document.createElement("textarea");
          area.value = code;
          document.body.append(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        }
        label(true);
        setTimeout(() => label(false), 1500);
      });
    }

    // A link to a line unfolds the source code around it and brings the line into view.
    const reveal = () => {
      const line = /-L\d+$/.test(location.hash) && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!line) return;
      line.closest("details").open = true;
      line.scrollIntoView({ block: "center" });
    };
    window.addEventListener("hashchange", reveal);
    reveal();
  }

  return { tokenize, setup };
})();

if (typeof document !== "undefined") Program.setup();
