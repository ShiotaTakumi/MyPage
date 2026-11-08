/* ===== 第 41 回 OSME-J のスライドの図：4 枚目の、先行研究の表を本研究の成果の表へ続けて変える動き ===== */
/* 目印（<span step class="mv-mark">）が出たら、次の順に続けて動かす（時刻は T、全部で END ミリ秒）。
     1. 文献の列を消す　2. 表を左右の真ん中へ寄せる　3. 赤の矢印を出す（少し左から）　4. 右の「頂点・面」の表を出す
     5. 4 つの図（先行研究）を消してから、3 つの図（この研究）を出す（キャプションが重ならないように、続けて）
   動き終えた形は 41OSME-J.css に書いてあり（ページの写し・印刷も同じ形）、動いている間だけ、ここで途中の形を書き込む。
   目印が消えたとき（←）・ページを移ったときは動かさず、CSS の形（動く前か、動き終えた形）のまま。
   動いている途中に次のキーかクリックが来たら、最後の形にしてから進む（common.js の RUNNING） */
var RESULTS = (function () {
  const T = { cite: [0, 400], move: [500, 1100], arrow: [1200, 1600], table: [1700, 2100], out: [2200, 2500], in: [2500, 2800] };
  const END = 2800, SHIFT = 148 - 82;   // 表を寄せる幅（もとの表の左端 82px → 148px）
  /* 時刻 ms での、区間 span の進み具合（0〜1） */
  function seg(ms, span) { return Math.max(0, Math.min(1, (ms - span[0]) / (span[1] - span[0]))); }

  function start() {
    const mark = document.querySelector(".mv-mark");
    if (!mark) return;
    const slide = mark.closest("slide"), q = function (s) { return slide.querySelector(s); };
    const left = q(".mv-left"), cite = q(".mv-cite"), arrow = q(".mv-arrow"), right = q(".mv-new");
    const before = q(".rec-models"), after = q(".res-models"), all = [left, cite, arrow, right, before, after];
    let raf = 0, t0 = 0;
    /* 途中の形を書き込む */
    function draw(ms) {
      cite.style.opacity = 1 - seg(ms, T.cite);
      left.style.transform = "translateX(" + (-SHIFT * (1 - ease(seg(ms, T.move)))).toFixed(2) + "px)";
      const a = seg(ms, T.arrow);
      arrow.style.opacity = a;
      arrow.style.transform = "translateX(" + (-16 * (1 - a)).toFixed(2) + "px)";
      right.style.opacity = seg(ms, T.table);
      before.style.opacity = 1 - seg(ms, T.out);
      after.style.opacity = seg(ms, T.in);
      before.style.pointerEvents = after.style.pointerEvents = "none";
    }
    /* 書き込んだものを消して、CSS の形に戻す */
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      all.forEach(function (el) { el.style.opacity = el.style.transform = el.style.pointerEvents = ""; });
      RUNNING.delete(self);
    }
    const self = { finish: stop };
    function frame(now) {
      const ms = now - t0;
      if (ms >= END) { stop(); return; }
      draw(Math.max(0, ms));
      raf = requestAnimationFrame(frame);
    }
    watchStep(mark, function (on, moved) {
      stop();
      if (!on || moved) return;
      draw(0);                       // 目印が出た時点（画面に描かれる前）で、動く前の形にしておく
      t0 = performance.now();
      RUNNING.add(self);
      raf = requestAnimationFrame(frame);
    });
  }
  document.addEventListener("DOMContentLoaded", start);
  return { start: start };
})();
