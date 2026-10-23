/* Jewel v2 (#11). Intro: a countdown on a dark olive wall, cracks in three bursts along a shard mesh,
   the giant word appears in place and the wall falls apart along the same cracks.
   Also: falling photo cards during the count, drifting dust, the photo reels and the map on demand. */
(() => {
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const veil = document.getElementById('veil');
  const word = document.querySelector('.bigword');
  const opening = document.querySelector('.opening__in');

  /* the giant word always fits its column */
  const fitWord = () => {
    if (!word || !opening) return;
    word.style.removeProperty('--bigword-size');
    const room = opening.clientWidth - parseFloat(getComputedStyle(opening).paddingLeft) * 2;
    const used = word.scrollWidth;
    if (used > room) {
      const now = parseFloat(getComputedStyle(word).fontSize);
      word.style.setProperty('--bigword-size', `${Math.floor(now * room / used) - 1}px`);
    }
  };
  fitWord();
  document.fonts?.ready.then(fitWord);
  window.addEventListener('resize', fitWord);

  /* ---------- intro ---------- */
  const intro = () => {
    const wall = veil.querySelector('.veil__wall');
    const numBox = veil.querySelector('.veil__num');
    const digit = veil.querySelector('.veil__digit');
    const pen = wall.getContext('2d');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, texture = null, shards = [], seams = [], hairs = [], reach = 1;
    const corner = { x: 0, y: 0 };

    const rand = (a, b) => a + Math.random() * (b - a);

    const paintTexture = () => {
      texture = document.createElement('canvas');
      texture.width = W * ratio; texture.height = H * ratio;
      const t = texture.getContext('2d');
      t.scale(ratio, ratio);
      t.fillStyle = '#263023';
      t.fillRect(0, 0, W, H);
      const shade = t.createRadialGradient(W * .15, H * .9, 0, W * .15, H * .9, Math.hypot(W, H));
      shade.addColorStop(0, 'rgba(70, 84, 58, .45)');
      shade.addColorStop(1, 'rgba(10, 14, 9, .35)');
      t.fillStyle = shade;
      t.fillRect(0, 0, W, H);
      const grains = Math.round(W * H / 14);
      for (let i = 0; i < grains; i += 1) {
        const light = Math.random() < .5;
        t.fillStyle = light ? `rgba(220, 230, 200, ${rand(.02, .07)})` : `rgba(0, 0, 0, ${rand(.04, .12)})`;
        t.fillRect(Math.random() * W, Math.random() * H, rand(.6, 1.6), rand(.6, 1.6));
      }
    };

    /* jittered grid, every cell cut into two triangles; triangle edges are the future cracks */
    const buildMesh = () => {
      const step = W < 600 ? 74 : 112;
      const cols = Math.ceil(W / step) + 1;
      const rows = Math.ceil(H / step) + 1;
      const sx = W / (cols - 1), sy = H / (rows - 1);
      const pts = [];
      for (let r = 0; r < rows; r += 1) {
        pts.push([]);
        for (let c = 0; c < cols; c += 1) {
          const edgeX = c === 0 || c === cols - 1, edgeY = r === 0 || r === rows - 1;
          pts[r].push({ x: c * sx + (edgeX ? 0 : rand(-.36, .36) * sx), y: r * sy + (edgeY ? 0 : rand(-.36, .36) * sy) });
        }
      }
      const seen = new Map();
      const seam = (a, b) => {
        const key = a.x < b.x || (a.x === b.x && a.y < b.y) ? `${a.x},${a.y},${b.x},${b.y}` : `${b.x},${b.y},${a.x},${a.y}`;
        if (seen.has(key)) return;
        const da = Math.hypot(a.x - corner.x, a.y - corner.y), db = Math.hypot(b.x - corner.x, b.y - corner.y);
        const [near, far, dn, df] = da <= db ? [a, b, da, db] : [b, a, db, da];
        const item = { near, far, dn, df, border: (a.x === b.x && (a.x === 0 || a.x === W)) || (a.y === b.y && (a.y === 0 || a.y === H)) };
        seen.set(key, item);
        if (!item.border) seams.push(item);
      };
      shards = []; seams = []; hairs = [];
      for (let r = 0; r < rows - 1; r += 1) {
        for (let c = 0; c < cols - 1; c += 1) {
          const p = pts[r][c], q = pts[r][c + 1], s = pts[r + 1][c + 1], u = pts[r + 1][c];
          const tris = Math.random() < .5 ? [[p, q, s], [p, s, u]] : [[p, q, u], [q, s, u]];
          for (const tri of tris) {
            seam(tri[0], tri[1]); seam(tri[1], tri[2]); seam(tri[2], tri[0]);
            const cx = (tri[0].x + tri[1].x + tri[2].x) / 3, cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
            shards.push({ tri, cx, cy, d: Math.hypot(cx - corner.x, cy - corner.y), dx: 0, dy: 0, rot: 0,
              vx: rand(-60, 60), vy: rand(-90, 10), spin: rand(-2.6, 2.6), wob: rand(0, Math.PI * 2) });
            /* fine hairlines inside the shard for the last, denser burst */
            if (Math.random() < .55) {
              const k = tri[Math.floor(Math.random() * 3)];
              const len = rand(.25, .7);
              hairs.push({ a: { x: cx, y: cy }, b: { x: cx + (k.x - cx) * len, y: cy + (k.y - cy) * len }, d: Math.hypot(cx - corner.x, cy - corner.y) });
            }
          }
        }
      }
      reach = Math.max(...seams.map((s) => s.df), 1);
    };

    const place = () => {
      W = window.innerWidth; H = window.innerHeight;
      wall.width = W * ratio; wall.height = H * ratio;
      pen.setTransform(ratio, 0, 0, ratio, 0, 0);
      const box = numBox.getBoundingClientRect();
      corner.x = box.left + box.width * .5;
      corner.y = box.bottom - box.height * .25;
      paintTexture();
      buildMesh();
    };

    /* keep the digit off the future booking button (phones) */
    const dodgeButton = () => {
      const button = document.querySelector('.opening__actions .pill');
      if (!button) return;
      numBox.style.removeProperty('font-size');
      numBox.style.removeProperty('bottom');
      const b = button.getBoundingClientRect();
      const n = numBox.getBoundingClientRect();
      const hits = (r) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
      if (!hits(n)) return;
      const gapBelow = window.innerHeight - b.bottom - 12;
      const size = parseFloat(getComputedStyle(numBox).fontSize);
      if (gapBelow >= 64) {
        numBox.style.fontSize = `${Math.min(size, gapBelow / .9)}px`;
        numBox.style.bottom = '6px';
      } else {
        numBox.style.bottom = `${window.innerHeight - b.top + 10}px`;
        const roomAbove = b.top - 10 - (document.getElementById('fixedtop')?.getBoundingClientRect().bottom || 0);
        numBox.style.fontSize = `${Math.max(56, Math.min(size, roomAbove * .5))}px`;
      }
      if (hits(numBox.getBoundingClientRect())) numBox.style.fontSize = '56px';
    };

    const drawWhole = () => {
      pen.clearRect(0, 0, W, H);
      pen.drawImage(texture, 0, 0, W, H);
    };
    const drawSeams = (front, hairFront) => {
      pen.lineCap = 'round';
      for (const s of seams) {
        if (front <= s.dn) continue;
        const f = Math.min(1, (front - s.dn) / Math.max(1, s.df - s.dn));
        const x = s.near.x + (s.far.x - s.near.x) * f, y = s.near.y + (s.far.y - s.near.y) * f;
        pen.strokeStyle = 'rgba(6, 8, 5, .85)'; pen.lineWidth = 2.2;
        pen.beginPath(); pen.moveTo(s.near.x, s.near.y); pen.lineTo(x, y); pen.stroke();
        pen.strokeStyle = 'rgba(214, 222, 196, .16)'; pen.lineWidth = .8;
        pen.beginPath(); pen.moveTo(s.near.x + .9, s.near.y + .9); pen.lineTo(x + .9, y + .9); pen.stroke();
      }
      if (hairFront > 0) {
        pen.strokeStyle = 'rgba(6, 8, 5, .6)'; pen.lineWidth = .7;
        pen.beginPath();
        for (const h of hairs) if (h.d < hairFront) { pen.moveTo(h.a.x, h.a.y); pen.lineTo(h.b.x, h.b.y); }
        pen.stroke();
      }
    };
    const drawShards = () => {
      pen.clearRect(0, 0, W, H);
      for (const s of shards) {
        if (s.dy > H + 200) continue;
        pen.save();
        pen.translate(s.cx + s.dx, s.cy + s.dy);
        pen.rotate(s.rot);
        pen.translate(-s.cx, -s.cy);
        pen.beginPath();
        pen.moveTo(s.tri[0].x, s.tri[0].y); pen.lineTo(s.tri[1].x, s.tri[1].y); pen.lineTo(s.tri[2].x, s.tri[2].y);
        pen.closePath();
        pen.save(); pen.clip(); pen.drawImage(texture, 0, 0, W, H); pen.restore();
        pen.strokeStyle = 'rgba(6, 8, 5, .8)'; pen.lineWidth = 1.6; pen.stroke();
        pen.restore();
      }
    };

    /* timeline, seconds */
    const T = { count: 4, b1: [4.05, 4.55], b2: [4.85, 5.35], b3: [5.65, 6.35], word: 6.45, loose: 7.0, fall: 7.35, beat: 7.9, end: 9.4 };
    const bursts = [[T.b1, .3], [T.b2, .62], [T.b3, 1.04]];
    let started = 0, raf = 0, lastDigit = -1, finished = false, wordShown = false, beaten = false, lastFrame = 0;

    const frontAt = (t) => {
      let prev = 0;
      for (const [[a, b], to] of bursts) {
        if (t < a) return prev * reach;
        if (t < b) { const k = (t - a) / (b - a); return (prev + (to - prev) * (1 - (1 - k) ** 2)) * reach; }
        prev = to;
      }
      return prev * reach;
    };

    const showWord = () => {
      if (wordShown) return;
      wordShown = true;
      word.classList.add('is-raised', 'is-arriving');
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      root.classList.remove('is-walled');
      root.classList.add('is-open');
      word.classList.remove('is-raised', 'is-arriving', 'is-beating');
      window.removeEventListener('keydown', onKey);
      veil.removeEventListener('click', finish);
      window.removeEventListener('resize', onResize);
      veil.dataset.state = 'done';
    };
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    const onResize = () => { if (!finished) { place(); dodgeButton(); } };

    const tick = (now) => {
      if (!started) started = now;
      const t = (now - started) / 1000;
      const dt = Math.min(.05, lastFrame ? (now - lastFrame) / 1000 : .016);
      lastFrame = now;

      if (t < T.count) {
        const n = 3 - Math.floor(t);
        if (n !== lastDigit) {
          lastDigit = n;
          digit.textContent = String(n);
          digit.classList.remove('is-drawn'); void digit.offsetWidth; digit.classList.add('is-drawn');
          veil.dataset.digit = String(n);
        }
      } else if (lastDigit !== 0) { lastDigit = 0; digit.textContent = '0'; veil.dataset.digit = '0'; }

      if (t < T.loose) {
        drawWhole();
        drawSeams(frontAt(t), t > T.b3[0] ? Math.min(1, (t - T.b3[0]) / (T.b3[1] - T.b3[0])) * reach : 0);
        if (t >= T.b1[0]) veil.dataset.state = 'cracking';
      } else {
        if (veil.dataset.state !== 'falling') { veil.dataset.state = 'falling'; veil.style.background = 'transparent'; numBox.style.opacity = '0'; }
        for (const s of shards) {
          if (t < T.fall) {
            const k = (t - T.loose) / (T.fall - T.loose);
            s.dx = Math.sin(s.wob + t * 40) * 1.6 * k; s.dy = 2.5 * k; s.rot = s.spin * .004 * k;
          } else {
            const delay = T.fall + (s.d / reach) * .75;
            if (t < delay) continue;
            s.vy += 1700 * dt; s.dx += s.vx * dt; s.dy += s.vy * dt; s.rot += s.spin * dt;
          }
        }
        drawShards();
      }
      if (t >= T.word) showWord();
      if (t >= T.beat && !beaten) { beaten = true; word.classList.remove('is-arriving'); void word.offsetWidth; word.classList.add('is-beating'); }
      if (t >= T.end || (veil.dataset.state === 'falling' && shards.every((s) => s.cy + s.dy - 140 > H))) { finish(); return; }
      raf = requestAnimationFrame(tick);
    };

    place();
    dodgeButton();
    document.fonts?.ready.then(() => { if (!finished) dodgeButton(); });
    window.addEventListener('keydown', onKey);
    veil.addEventListener('click', finish);
    window.addEventListener('resize', onResize);
    veil.style.animation = 'none';
    veil.dataset.state = 'counting';
    raf = requestAnimationFrame(tick);
  };

  if (veil && word && !calm) intro();
  else if (veil) { root.classList.remove('is-walled'); root.classList.add('is-open'); veil.dataset.state = 'off'; }

  /* ---------- dust ---------- */
  const motes = document.querySelector('.motes');
  if (motes && !calm) {
    const ctx = motes.getContext('2d');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, idleTimer = 0, last = 0;
    const N = 54;
    const px = new Float32Array(N), py = new Float32Array(N), pr = new Float32Array(N), pv = new Float32Array(N), pa = new Float32Array(N), ph = new Float32Array(N);
    const size = () => {
      w = window.innerWidth; h = Math.max(window.innerHeight, motes.clientHeight);
      motes.width = w * ratio; motes.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const seed = (i, anywhere) => {
      px[i] = Math.random() * w; py[i] = anywhere ? Math.random() * h : h + 6;
      pr[i] = .6 + Math.random() * 1.5; pv[i] = 6 + Math.random() * 14; pa[i] = .12 + Math.random() * .3; ph[i] = Math.random() * 6.3;
    };
    size();
    for (let i = 0; i < N; i += 1) seed(i, true);
    const draw = (now) => {
      const dt = Math.min(.05, last ? (now - last) / 1000 : .016);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < N; i += 1) {
        py[i] -= pv[i] * dt; ph[i] += dt * .7;
        px[i] += Math.sin(ph[i]) * 8 * dt;
        if (py[i] < -6) seed(i, false);
        ctx.globalAlpha = pa[i];
        ctx.fillStyle = '#efe6d2';
        ctx.beginPath(); ctx.arc(px[i], py[i], pr[i], 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    const run = () => {
      if (raf || document.hidden) return;
      last = 0; motes.dataset.running = 'true'; raf = requestAnimationFrame(draw);
    };
    const halt = () => {
      cancelAnimationFrame(raf); raf = 0; motes.dataset.running = 'false';
    };
    const nudge = () => {
      clearTimeout(idleTimer);
      run();
      idleTimer = setTimeout(halt, 9000);
    };
    ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart', 'wheel'].forEach((type) => window.addEventListener(type, nudge, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); else nudge(); });
    window.addEventListener('resize', size);
    nudge();
  }

  /* ---------- photo reels: scroll-snap, arrows, dots, keyboard ---------- */
  document.querySelectorAll('.reel').forEach((reel) => {
    const track = reel.querySelector('.reel__track');
    const slides = [...track.children];
    const dots = [...reel.querySelectorAll('.reel__dot')];
    const prev = reel.querySelector('.reel__arrow--prev');
    const next = reel.querySelector('.reel__arrow--next');
    let current = 0, settle = 0;
    const per = () => Math.max(1, Math.round(parseFloat(getComputedStyle(reel).getPropertyValue('--per')) || 1));
    const last = () => Math.max(0, slides.length - per());
    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth) || 1;
    const mark = (i) => {
      current = i;
      reel.dataset.index = String(i);
      prev.disabled = i === 0; next.disabled = i === last();
      dots.forEach((d, k) => { d.hidden = k > last(); if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      slides.forEach((s, k) => { const on = k >= i && k < i + per(); s.setAttribute('aria-hidden', on ? 'false' : 'true'); s.inert = !on; });
    };
    const go = (i) => {
      const n = Math.max(0, Math.min(last(), i));
      track.scrollTo({ left: n * step(), behavior: calm ? 'auto' : 'smooth' });
      mark(n);
    };
    track.addEventListener('scroll', () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const i = Math.max(0, Math.min(last(), Math.round(track.scrollLeft / step())));
        if (i !== current) mark(i);
      }, 90);
    }, { passive: true });
    prev.addEventListener('click', () => go(current - 1));
    next.addEventListener('click', () => go(current + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });
    window.addEventListener('resize', () => { const n = Math.min(current, last()); track.scrollLeft = n * step(); mark(n); });
    mark(0);
  });

  /* ---------- section shots open as a circle from the centre ---------- */
  const groups = document.querySelectorAll('.gallery__group');
  if (groups.length && !calm && 'IntersectionObserver' in window) {
    root.classList.add('js-circle');
    const io = new IntersectionObserver((list) => {
      list.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-open'); io.unobserve(en.target); } });
    }, { threshold: .2 });
    groups.forEach((g) => io.observe(g));
  }

  /* ---------- map on demand ---------- */
  const stub = document.querySelector('.map-stub');
  stub?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = stub.dataset.map;
    frame.title = 'Jewel на карте';
    frame.allowFullscreen = true;
    stub.replaceWith(frame);
  }, { once: true });
})();
