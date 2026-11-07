/* 第 41 回 OSME-J のスライドだけの動きの調整。見た目と動きの元は uoh-slide.js（触らない） */

/* コピーしたときの数式：KaTeX の数式は、上付き・下付き（h ∈ ℝ^+ の + など）を表のような組み方で並べるので、
   そのままコピーすると、字の前後に改行が入る（「h∈R\n+\n」）。そこで、コピーするときは、選んだ範囲の数式を、
   見た目の字をつなげた 1 つの文字列に置き換えてから文字にする（例：「h∈ℝ+」）。白抜きの字（\mathbb）は ℝ などの 1 字に直す。
   数式でない部分は、ブラウザがふつうにコピーするときと同じ（innerText） */
(function () {
  const BB = { R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ", C: "ℂ" };
  document.addEventListener("copy", function (e) {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const frag = sel.getRangeAt(0).cloneContents();
    if (!frag.querySelector(".katex")) return;
    frag.querySelectorAll(".katex").forEach(function (k) {
      const html = k.querySelector(".katex-html") || k;
      html.querySelectorAll(".mathbb").forEach(function (b) { b.textContent = b.textContent.replace(/[RNZQC]/g, function (ch) { return BB[ch]; }); });
      k.replaceWith(document.createTextNode(html.textContent.replace(/\s+/g, "")));
    });
    /* 改行の入り方をふつうのコピーとそろえるため、画面の外に置いて innerText を取る */
    const box = document.createElement("div");
    box.style.cssText = "position: fixed; left: -99999px; top: 0";
    box.appendChild(frag);
    document.body.appendChild(box);
    const text = box.innerText;
    box.remove();
    e.clipboardData.setData("text/plain", text);
    e.preventDefault();
  });
})();

/* スマホ（指で触る画面）でページを送るボタン。uoh-slide.js は window の click でページを送るが、スマホではタップで進まなかった
   （iPhone の Chrome でも。原因は確かめられていない）。そこで、画面の下に ◀ ▶ のボタンを置き、
   押したら ← → のキーを押したのと同じにする（uoh-slide.js の keydown が受け、段階表示も 1 つずつ進む。
   ボタンの click は、uoh-slide.js はページ送りに使わない）。出すかどうかと置き場所・形は 41OSME-J.css（指で触る画面だけ） */
(function () {
  function add() {
    [["tap-prev", "前へ", "ArrowLeft"], ["tap-next", "次へ", "ArrowRight"]].forEach(function (b) {
      const el = document.createElement("button");
      el.className = "tap-nav " + b[0];
      el.setAttribute("aria-label", b[1]);
      el.addEventListener("click", function () {
        el.blur();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: b[2], bubbles: true }));
      });
      document.body.appendChild(el);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();

/* ← で戻るとき（ArrowLeft と PageUp。スマホの ◀ ボタンも ArrowLeft を送る）は、印を付けておき、その間は動きを
   付けずに、すぐ前の形にする（41OSME-J.css の .step-back）。印は、切り替えが描かれたあと（2 こま後）に外す */
(function () {
  addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "PageUp") return;
    const root = document.documentElement;
    root.classList.add("step-back");
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove("step-back"); }); });
  }, true);
})();

/* アドレスの #s番号 を書き換えて Enter を押したとき（すでに開いているページで #s1 → #s2 など）にも、そのページへ移る。
   uoh-slide.js は、開いたときに 1 回だけ #s番号 を読み、ページを送るときは history.replaceState で書き換える（このときは hashchange は出ない）。
   そこで、hashchange が来たら、読み直して、その番号のページから始める */
addEventListener("hashchange", function () { location.reload(); });
