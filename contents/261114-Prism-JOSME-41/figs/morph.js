/* ===== 第 41 回 OSME-J のスライドの図：3 枚目から 4 枚目へ、角柱とキャプションをなめらかに動かす ===== */
/* 3 枚目と 4 枚目の正 12 角柱・正 15 角柱は、大きさと横の位置が同じで、縦の位置だけが違う。
   3 枚目から 4 枚目に進んだとき（4 枚目のクリックがまだ 1 つも出ていないとき）だけ、3 枚目と 4 枚目の
   角柱（図の中の面の絵）とキャプションの位置を測り、4 枚目のものを、その差だけずらした所から元の位置へ MOVE ミリ秒で動かす。
   ← で戻ったとき・ページ一覧から全部出した状態で飛んだときなどは動かさない。
   ページを組み立て終えてから始める（uoh-slide.js の組み立ても DOMContentLoaded で動き、そちらが先に読まれている） */
var MORPH = (function () {
  const MOVE = 600;
  /* 3 枚目の図と、それに続く 4 枚目の図（<svg> の id） */
  const PAIRS = [["prism-12", "overlap-12"], ["prism-15", "overlap-15"]];

  /* 要素の、スライドの中の座標での真ん中（ステージの拡大縮小を除く） */
  function center(el) {
    const s = el.closest("slide").getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / 904;
    return [((r.left + r.right) / 2 - s.left) / k, ((r.top + r.bottom) / 2 - s.top) / k];
  }
  /* 図の中の面の絵（最初の <g>）と、キャプション */
  function parts(id) {
    const svg = document.getElementById(id);
    return { svg: svg, drawing: svg.querySelector("g"), caption: svg.closest("figure").querySelector("figcaption") };
  }

  function start() {
    if (!document.getElementById(PAIRS[0][0]) || !document.getElementById(PAIRS[0][1])) return;
    const from = document.getElementById(PAIRS[0][0]).closest(".page"), to = document.getElementById(PAIRS[0][1]).closest(".page");
    /* 4 枚目の図とキャプションを、3 枚目での位置から動かす */
    function play() {
      /* 3 枚目はもう隠れているので、一瞬だけ表示の扱いに戻して位置を測る（描かれる前に戻すので、画面には出ない） */
      from.style.display = "block";
      const saved = PAIRS.map(function (p) { const a = parts(p[0]); return { drawing: center(a.drawing), caption: center(a.caption) }; });
      from.style.display = "";
      const anims = [];
      PAIRS.forEach(function (p, i) {
        const b = parts(p[1]);
        [[b.svg, saved[i].drawing, center(b.drawing)], [b.caption, saved[i].caption, center(b.caption)]].forEach(function (m) {
          const dx = m[1][0] - m[2][0], dy = m[1][1] - m[2][1];
          anims.push(m[0].animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
                                  { duration: MOVE, easing: "ease-in-out" }));
        });
      });
      /* 動いている途中なら RUNNING（common.js）に入れておき、次のキーかクリックで最後の形にする */
      const self = { finish: function () { anims.forEach(function (a) { a.finish(); }); } };
      RUNNING.add(self);
      anims[0].onfinish = function () { RUNNING.delete(self); };
    }
    /* 3 枚目の出し入れを見る。3 枚目から 4 枚目へ移るときは、3 枚目が消えた時点で 4 枚目はもう出ている */
    new MutationObserver(function (recs) {
      const left = recs.some(function (r) { return r.target === from; }) && !from.classList.contains("on");
      if (left && to.classList.contains("on") && !to.querySelector("[step].on")) play();
    }).observe(from, { attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("DOMContentLoaded", start);
  return { start: start };
})();
