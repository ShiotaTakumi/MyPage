(() => {
  const GRID = 55;
  const COLS = 20;
  const ROWS = 8;
  const VERTEX_R = 14;
  const W = GRID * COLS;
  const H = GRID * ROWS;

  const board = document.getElementById('board');
  board.setAttribute('width', W);
  board.setAttribute('height', H);
  board.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const status = document.getElementById('status');
  const clearOverlay = document.getElementById('clear-overlay');
  const vertexSubmode = document.getElementById('vertex-submode');
  const edgeSubmode = document.getElementById('edge-submode');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');

  // state.vertices: { id, gx, gy, color: 'white'|'black' }
  // state.edges: { id, a, b }  (a,b are vertex ids)
  let state = { vertices: [], edges: [], nextVid: 1, nextEid: 1 };
  let mode = 'vertex';
  let subMode = 'place';
  let edgeFirstPick = null; // vertex id

  const history = [];
  const future = [];

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > 500) history.shift();
    future.length = 0;
    clearOverlay.classList.add('hidden');
    updateUndoRedo();
  }

  function undo() {
    if (history.length === 0) return;
    future.push(snapshot());
    state = history.pop();
    edgeFirstPick = null;
    render();
    updateUndoRedo();
  }

  function redo() {
    if (future.length === 0) return;
    history.push(snapshot());
    state = future.pop();
    edgeFirstPick = null;
    render();
    updateUndoRedo();
  }

  function updateUndoRedo() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = future.length === 0;
  }

  // --- Drawing -------------------------------------------------------------

  function drawGrid() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i <= COLS; i++) {
      const x = i * GRID;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'grid-line');
      line.setAttribute('x1', x); line.setAttribute('y1', 0);
      line.setAttribute('x2', x); line.setAttribute('y2', H);
      frag.appendChild(line);
    }
    for (let j = 0; j <= ROWS; j++) {
      const y = j * GRID;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'grid-line');
      line.setAttribute('x1', 0); line.setAttribute('y1', y);
      line.setAttribute('x2', W); line.setAttribute('y2', y);
      frag.appendChild(line);
    }
    for (let i = 0; i <= COLS; i++) {
      for (let j = 0; j <= ROWS; j++) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('class', 'grid-dot');
        dot.setAttribute('cx', i * GRID);
        dot.setAttribute('cy', j * GRID);
        dot.setAttribute('r', 2.5);
        frag.appendChild(dot);
      }
    }
    return frag;
  }

  function vertexById(id) {
    return state.vertices.find(v => v.id === id);
  }

  function render() {
    while (board.firstChild) board.removeChild(board.firstChild);
    board.appendChild(drawGrid());

    // edges
    for (const e of state.edges) {
      const a = vertexById(e.a), b = vertexById(e.b);
      if (!a || !b) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'edge');
      line.setAttribute('x1', a.gx * GRID);
      line.setAttribute('y1', a.gy * GRID);
      line.setAttribute('x2', b.gx * GRID);
      line.setAttribute('y2', b.gy * GRID);
      line.dataset.eid = e.id;
      line.addEventListener('click', onEdgeClick);
      board.appendChild(line);
    }

    // vertices
    for (const v of state.vertices) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', `vertex ${v.color}${edgeFirstPick === v.id ? ' selected' : ''}`);
      c.setAttribute('cx', v.gx * GRID);
      c.setAttribute('cy', v.gy * GRID);
      c.setAttribute('r', VERTEX_R);
      c.dataset.vid = v.id;
      c.addEventListener('click', onVertexClick);
      board.appendChild(c);
    }

    updateStatus();
  }

  function updateStatus() {
    const w = state.vertices.filter(v => v.color === 'white').length;
    const bk = state.vertices.filter(v => v.color === 'black').length;
    let modeLabel = '';
    if (mode === 'vertex') modeLabel = `頂点配置 (${subMode === 'place' ? '配置' : subMode === 'flip' ? '反転' : '削除'})`;
    else if (mode === 'edge') modeLabel = `辺配置 (${subMode === 'place' ? '配置' : '削除'})`;
    else modeLabel = 'Play';
    status.textContent = `モード: ${modeLabel} | 白: ${w}  黒: ${bk}  辺: ${state.edges.length}`;
  }

  // --- Coordinate helpers --------------------------------------------------

  function svgPoint(evt) {
    const rect = board.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (W / rect.width);
    const y = (evt.clientY - rect.top) * (H / rect.height);
    return { x, y };
  }

  function snapToGrid(x, y) {
    const gx = Math.round(x / GRID);
    const gy = Math.round(y / GRID);
    if (gx < 0 || gx > COLS || gy < 0 || gy > ROWS) return null;
    return { gx, gy };
  }

  function vertexAt(gx, gy) {
    return state.vertices.find(v => v.gx === gx && v.gy === gy);
  }

  // --- Interactions --------------------------------------------------------

  board.addEventListener('click', (evt) => {
    if (evt.target !== board) return; // vertex/edge clicks handled separately
    if (mode !== 'vertex' || subMode !== 'place') return;
    const p = svgPoint(evt);
    const g = snapToGrid(p.x, p.y);
    if (!g) return;
    if (vertexAt(g.gx, g.gy)) return;
    pushHistory();
    state.vertices.push({
      id: state.nextVid++,
      gx: g.gx,
      gy: g.gy,
      color: 'white',
    });
    render();
  });

  function onVertexClick(evt) {
    evt.stopPropagation();
    const vid = Number(evt.currentTarget.dataset.vid);
    const v = vertexById(vid);
    if (!v) return;

    if (mode === 'vertex') {
      if (subMode === 'place') {
        // already a vertex here; do nothing
        return;
      }
      if (subMode === 'flip') {
        pushHistory();
        v.color = v.color === 'white' ? 'black' : 'white';
        render();
        return;
      }
      if (subMode === 'delete') {
        pushHistory();
        state.vertices = state.vertices.filter(x => x.id !== vid);
        state.edges = state.edges.filter(e => e.a !== vid && e.b !== vid);
        render();
        return;
      }
    }

    if (mode === 'edge') {
      if (subMode === 'place') {
        if (edgeFirstPick === null) {
          edgeFirstPick = vid;
          render();
          return;
        }
        if (edgeFirstPick === vid) {
          edgeFirstPick = null;
          render();
          return;
        }
        const a = edgeFirstPick, b = vid;
        const exists = state.edges.some(e =>
          (e.a === a && e.b === b) || (e.a === b && e.b === a)
        );
        if (!exists) {
          pushHistory();
          state.edges.push({ id: state.nextEid++, a, b });
        }
        edgeFirstPick = null;
        render();
        return;
      }
      // edge delete sub-mode: clicking a vertex does nothing
      return;
    }

    if (mode === 'play') {
      if (v.color !== 'white') return; // 黒は選べない
      pushHistory();
      const neighborEdges = state.edges.filter(e => e.a === vid || e.b === vid);
      const neighborIds = neighborEdges.map(e => (e.a === vid ? e.b : e.a));
      for (const nid of neighborIds) {
        const nv = vertexById(nid);
        if (!nv) continue;
        nv.color = nv.color === 'white' ? 'black' : 'white';
      }
      state.vertices = state.vertices.filter(x => x.id !== vid);
      state.edges = state.edges.filter(e => e.a !== vid && e.b !== vid);
      render();
      checkClear();
    }
  }

  function onEdgeClick(evt) {
    evt.stopPropagation();
    const eid = Number(evt.currentTarget.dataset.eid);
    if (mode === 'edge' && subMode === 'delete') {
      pushHistory();
      state.edges = state.edges.filter(e => e.id !== eid);
      render();
    }
  }

  function checkClear() {
    const blackCount = state.vertices.filter(v => v.color === 'black').length;
    if (mode === 'play' && blackCount === 0) {
      clearOverlay.classList.remove('hidden');
    }
  }

  clearOverlay.addEventListener('click', () => {
    clearOverlay.classList.add('hidden');
  });

  // --- Mode buttons --------------------------------------------------------

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.mode;
      if (newMode === mode) return;
      mode = newMode;
      edgeFirstPick = null;
      document.querySelectorAll('.mode-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      vertexSubmode.classList.toggle('hidden', mode !== 'vertex');
      edgeSubmode.classList.toggle('hidden', mode !== 'edge');
      document.getElementById('random-group').classList.toggle('hidden', mode !== 'vertex');
      // reset submode to first available
      if (mode === 'vertex') {
        subMode = 'place';
        setActiveSub(vertexSubmode, 'place');
      } else if (mode === 'edge') {
        subMode = 'place';
        setActiveSub(edgeSubmode, 'place');
      }
      board.style.cursor = mode === 'play' ? 'pointer' : 'crosshair';
      render();
    });
  });

  function setActiveSub(container, sub) {
    container.querySelectorAll('.sub-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.sub === sub)
    );
  }

  document.querySelectorAll('.sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      subMode = btn.dataset.sub;
      const container = btn.closest('.submode');
      setActiveSub(container, subMode);
      edgeFirstPick = null;
      render();
    });
  });

  // --- Random generation ---------------------------------------------------

  function randomGenerate(n, maxHeight) {
    n = Math.max(1, Math.min(30, n | 0));
    const totalCells = (COLS + 1) * (ROWS + 1);
    n = Math.min(n, totalCells);
    // maxHeight: 縦に並べてよい頂点の最大個数 (バウンディングボックスの行数)
    maxHeight = Math.max(1, Math.min(ROWS + 1, maxHeight | 0));

    pushHistory();
    state.vertices = [];
    state.edges = [];
    state.nextVid = 1;
    state.nextEid = 1;
    edgeFirstPick = null;

    // 仮想座標（負も可）で木を成長。あとで中央寄せ。
    // フロンティアの方向重み: 横方向を優先して横長に。
    const HORIZONTAL_BIAS = 3;

    const verts = []; // {id, gx, gy, color}
    const edges = [];
    let nextVid = 1, nextEid = 1;
    const occupied = new Map(); // key -> id

    function key(x, y) { return `${x},${y}`; }
    function add(x, y, parentId) {
      const v = {
        id: nextVid++, gx: x, gy: y,
        color: Math.random() < 0.5 ? 'white' : 'black',
      };
      verts.push(v);
      occupied.set(key(x, y), v.id);
      if (parentId != null) {
        edges.push({ id: nextEid++, a: parentId, b: v.id });
      }
      return v;
    }

    const start = add(0, 0, null);

    // 現在使用中のYレンジ（追加すると minY..maxY が広がる可能性あり）
    let curMinY = 0, curMaxY = 0;

    // フロンティア: 重み付き候補
    const frontier = []; // {gx, gy, parentId, weight}
    function pushFrontier(gx, gy, parentId) {
      const dirs = [
        { dx: 1,  dy: 0,  w: HORIZONTAL_BIAS },
        { dx: -1, dy: 0,  w: HORIZONTAL_BIAS },
        { dx: 0,  dy: 1,  w: 1 },
        { dx: 0,  dy: -1, w: 1 },
      ];
      for (const d of dirs) {
        const nx = gx + d.dx, ny = gy + d.dy;
        if (occupied.has(key(nx, ny))) continue;
        frontier.push({ gx: nx, gy: ny, parentId, weight: d.w });
      }
    }
    pushFrontier(0, 0, start.id);

    while (verts.length < n && frontier.length > 0) {
      // 重複（同じセルが複数候補にある）を除去しつつ、最大の weight を保持
      // 追加すると縦の広がりが maxHeight 個を超える候補は除外
      const cellBest = new Map(); // key -> index in frontier
      for (let i = 0; i < frontier.length; i++) {
        const f = frontier[i];
        if (occupied.has(key(f.gx, f.gy))) continue;
        const newMinY = Math.min(curMinY, f.gy);
        const newMaxY = Math.max(curMaxY, f.gy);
        if (newMaxY - newMinY + 1 > maxHeight) continue;
        const k = key(f.gx, f.gy);
        const prev = cellBest.get(k);
        if (prev == null || frontier[prev].weight < f.weight) {
          cellBest.set(k, i);
        }
      }
      const candidates = Array.from(cellBest.values()).map(i => frontier[i]);
      if (candidates.length === 0) break;

      const totalW = candidates.reduce((s, c) => s + c.weight, 0);
      let r = Math.random() * totalW;
      let chosen = candidates[0];
      for (const c of candidates) {
        r -= c.weight;
        if (r <= 0) { chosen = c; break; }
      }

      add(chosen.gx, chosen.gy, chosen.parentId);
      if (chosen.gy < curMinY) curMinY = chosen.gy;
      if (chosen.gy > curMaxY) curMaxY = chosen.gy;

      // 使ったセルを frontier から除去（同セルの他候補も含む）
      const ck = key(chosen.gx, chosen.gy);
      for (let i = frontier.length - 1; i >= 0; i--) {
        if (key(frontier[i].gx, frontier[i].gy) === ck) frontier.splice(i, 1);
      }
      pushFrontier(chosen.gx, chosen.gy, verts[verts.length - 1].id);
    }

    // バウンディングボックスを取得し、盤面に収まるよう縮小はしないが中央寄せする
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of verts) {
      if (v.gx < minX) minX = v.gx;
      if (v.gx > maxX) maxX = v.gx;
      if (v.gy < minY) minY = v.gy;
      if (v.gy > maxY) maxY = v.gy;
    }
    const w = maxX - minX;
    const h = maxY - minY;

    // 盤面に収まらない場合は警告し、生成し直さずそのまま中央寄せ（端に張り付かない範囲で）
    let offsetX = Math.round((COLS - w) / 2) - minX;
    let offsetY = Math.round((ROWS - h) / 2) - minY;
    // クリップ: 盤外にはみ出す場合は補正
    if (minX + offsetX < 0) offsetX = -minX;
    if (maxX + offsetX > COLS) offsetX = COLS - maxX;
    if (minY + offsetY < 0) offsetY = -minY;
    if (maxY + offsetY > ROWS) offsetY = ROWS - maxY;

    for (const v of verts) {
      v.gx += offsetX;
      v.gy += offsetY;
    }

    state.vertices = verts;
    state.edges = edges;
    state.nextVid = nextVid;
    state.nextEid = nextEid;

    render();
  }

  document.getElementById('random-btn').addEventListener('click', () => {
    const n = parseInt(document.getElementById('random-n').value, 10);
    const h = parseInt(document.getElementById('random-h').value, 10);
    if (isNaN(n) || n < 1) return;
    randomGenerate(n, isNaN(h) ? ROWS + 1 : h);
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); undo();
    } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault(); redo();
    }
  });

  updateUndoRedo();
  render();
})();
