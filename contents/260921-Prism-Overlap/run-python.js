// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Runs the SymPy snippets of the folded checks on the proof pages (derivations/*.html) in the browser,
// with Pyodide, and copies the snippets. Pyodide and SymPy are loaded from jsDelivr on the first run only;
// the output of a snippet is shown under it. Plain JavaScript, no build step.
//
// Each check (<details class="checks">, "Check with SymPy and Mathematica") follows a formula or a table
// and has two blocks. The SymPy one is a <div class="check run-python">: a button that copies the code
// (data-action="copy"), one that runs it (data-action="run"), the code in a <code> element and a
// <pre class="run-output"> for the output. The Mathematica one, which is only copied, is a
// <div class="check copy-code"> with its copy button and the code in a <code> element.

const RunPython = (() => {
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
  let ready = null;                      // the promise of Pyodide with SymPy, made on the first run
  let queue = Promise.resolve();         // the runs, one after another, so that their outputs do not mix

  function load() {
    ready ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PYODIDE}pyodide.js`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`could not load ${script.src}`));
      document.head.append(script);
    })
      .then(() => loadPyodide({ indexURL: PYODIDE }))
      .then(async (pyodide) => {
        await pyodide.loadPackage("sympy");
        return pyodide;
      });
    ready.catch(() => { ready = null; });   // allow another try
    return ready;
  }

  function setup(root) {
    const button = root.querySelector('button[data-action="run"]');
    const output = root.querySelector(".run-output");
    const source = root.querySelector("code").textContent;
    button.addEventListener("click", () => {
      button.disabled = true;
      output.hidden = false;
      output.textContent = Lang.t({ en: "Loading Pyodide and SymPy…", ja: "Pyodide と SymPy を読み込んでいます…" });
      // Pyodide has one standard output, so a run waits until the one before it has finished.
      queue = queue.then(async () => {
        try {
          const pyodide = await load();
          output.textContent = Lang.t({ en: "Running…", ja: "実行しています…" });
          let text = "";
          pyodide.setStdout({ batched: (line) => { text += `${line}\n`; output.textContent = text; } });
          pyodide.setStderr({ batched: (line) => { text += `${line}\n`; output.textContent = text; } });
          await pyodide.runPythonAsync(source);
          if (!text) output.textContent = Lang.t({ en: "(no output)", ja: "（出力なし）" });
        } catch (error) {
          output.textContent += `\n${error}`;
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  // A button that copies the code of its block as it is.
  function copier(button) {
    const code = button.closest(".run-python, .copy-code").querySelector("code").textContent;
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

  return { setup, copier };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll(".run-python")) RunPython.setup(root);
  for (const button of document.querySelectorAll('button[data-action="copy"]')) RunPython.copier(button);
}
