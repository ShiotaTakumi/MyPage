// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Runs the SymPy program shown on the page of a family (derivations/*.html) in the browser, with Pyodide.
// Pyodide and SymPy are loaded from jsDelivr on the first run only; the output of the program is shown
// under its button. Plain JavaScript, no build step.
//
// Each program is in a <div class="run-python">: its button, a <pre class="run-output"> for the output,
// and the source code in a <code> element. The checks on the page of pattern SBS (derivations/sbs.html)
// are small programs of this kind, each with a button that copies it (data-action="copy") before the one
// that runs it (data-action="run"); their Mathematica versions, which are only copied, are each in a
// <div class="copy-code"> with the code in a <code> element.

const RunPython = (() => {
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
  let ready = null;                      // the promise of Pyodide with SymPy, made on the first run

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
    const button = root.querySelector('button[data-action="run"]') || root.querySelector("button:not([data-action])");
    const output = root.querySelector(".run-output");
    const source = root.querySelector("code").textContent;
    button.addEventListener("click", async () => {
      button.disabled = true;
      output.hidden = false;
      output.textContent = Lang.t({ en: "Loading Pyodide and SymPy…", ja: "Pyodide と SymPy を読み込んでいます…" });
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
