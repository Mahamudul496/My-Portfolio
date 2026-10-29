/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- theme ---------- */
const root = document.documentElement;
try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch (e) {}
$('#themeToggle')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  document.dispatchEvent(new Event('themechange'));
});

/* ---------- mobile nav ---------- */
const menuToggle = $('.menu-toggle');
const nav = $('.nav');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- year, progress bar ---------- */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
const progress = $('#progress');
const onScroll = () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- active nav link ---------- */
const navLinks = $$('.nav a[href^="#"]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => io.observe(s));
}

/* ---------- card spotlight (follows the pointer) ---------- */
$$('.spot').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  });
});

/* ---------- typed role line ---------- */
const typed = $('#typed');
if (typed && !reduceMotion) {
  const words = ['secure networks', 'useful software', 'reliable systems', 'research experiments'];
  let w = 0, i = words[0].length, deleting = true;
  const tick = () => {
    i += deleting ? -1 : 1;
    typed.textContent = words[w].slice(0, i);
    let delay = deleting ? 40 : 75;
    if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
    else if (!deleting && i === words[w].length) { deleting = true; delay = 2000; }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2200);
}

/* ---------- hero simulation: proactive task migration ---------- */
(function sim() {
  const canvas = $('#sim');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, towers = [], vehicles = [], packets = [], colors = {};
  let running = true, last = performance.now();

  const readColors = () => {
    const cs = getComputedStyle(root);
    colors = {
      a: cs.getPropertyValue('--a').trim(), b: cs.getPropertyValue('--b').trim(),
      c: cs.getPropertyValue('--c').trim(), line: cs.getPropertyValue('--soft').trim(),
      text: cs.getPropertyValue('--text').trim()
    };
  };

  const setup = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = W < 600 ? 3 : W < 1000 ? 4 : 5;
    const spacing = W / n;
    towers = Array.from({ length: n }, (_, i) => ({ x: spacing * (i + 0.5), y: H * 0.30, r: spacing * 0.52, load: 0 }));
    const lanes = [H * 0.56, H * 0.72];
    const count = Math.round(n * 1.6);
    vehicles = Array.from({ length: count }, (_, i) => {
      const lane = i % 2;
      const v = { x: (W / count) * i + Math.random() * 40, y: lanes[lane], speed: 28 + Math.random() * 22 + lane * 6, serving: 0, migrating: false, color: [colors.c, colors.a, colors.b][i % 3] };
      v.serving = nearest(v.x);
      return v;
    });
    packets = [];
    towers.spacing = spacing;
  };

  const nearest = x => {
    let best = 0, d = Infinity;
    towers.forEach((t, i) => { const dd = Math.abs(t.x - x); if (dd < d) { d = dd; best = i; } });
    return best;
  };

  const update = dt => {
    vehicles.forEach(v => {
      v.x += v.speed * dt;
      if (v.x > W + 30) { v.x = -30; v.serving = nearest(v.x); v.migrating = false; }
      const cur = towers[v.serving];
      const next = towers[v.serving + 1];
      // Proactive: start migrating once the vehicle is past halfway toward the next cell
      if (next && !v.migrating && v.x > cur.x + towers.spacing * 0.22 && v.x < next.x) {
        v.migrating = true;
        packets.push({ from: cur, to: next, t: 0, v });
      }
    });
    packets.forEach(p => { p.t += dt / 1.1; });
    packets = packets.filter(p => {
      if (p.t >= 1) {
        p.v.serving = towers.indexOf(p.to);
        p.v.migrating = false;
        p.to.load = 1;
        return false;
      }
      return true;
    });
    towers.forEach(t => { t.load = Math.max(0, t.load - dt * 1.4); });
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);

    // roads
    ctx.lineCap = 'round';
    [H * 0.56, H * 0.72].forEach(y => {
      ctx.strokeStyle = colors.line; ctx.globalAlpha = .16; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.globalAlpha = .35; ctx.lineWidth = 1.5; ctx.setLineDash([10, 14]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.globalAlpha = 1;

    // tower-to-tower backbone
    ctx.strokeStyle = colors.a; ctx.globalAlpha = .2; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); towers.forEach((t, i) => (i ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y))); ctx.stroke(); ctx.setLineDash([]);

    // coverage cells + towers
    towers.forEach(t => {
      const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
      g.addColorStop(0, colors.a + '26'); g.addColorStop(1, colors.a + '00');
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.fill();
      ctx.strokeStyle = colors.a; ctx.globalAlpha = .28; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
      if (t.load > 0) {
        ctx.strokeStyle = colors.b; ctx.globalAlpha = t.load * .8; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, 14 + (1 - t.load) * 26, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = colors.a; ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = colors.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, 11, 0, 7); ctx.stroke();
    });

    // vehicle -> serving tower links
    vehicles.forEach(v => {
      const t = towers[v.serving]; if (!t) return;
      ctx.strokeStyle = v.color; ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(v.x, v.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // migrating tasks
    packets.forEach(p => {
      const e = p.t < .5 ? 2 * p.t * p.t : 1 - Math.pow(-2 * p.t + 2, 2) / 2;
      const x = p.from.x + (p.to.x - p.from.x) * e;
      const y = p.from.y + (p.to.y - p.from.y) * e - Math.sin(e * Math.PI) * 26;
      ctx.shadowColor = colors.b; ctx.shadowBlur = 14; ctx.fillStyle = colors.b;
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    });

    // vehicles
    vehicles.forEach(v => {
      ctx.fillStyle = v.color;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(v.x - 9, v.y - 5, 18, 10, 4) : ctx.rect(v.x - 9, v.y - 5, 18, 10); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(v.x + 1, v.y - 3.5, 5, 7);
    });
  };

  const loop = now => {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (running) { update(dt); draw(); requestAnimationFrame(loop); }
  };

  readColors(); setup(); draw();
  if (reduceMotion) { for (let i = 0; i < 60; i++) update(.05); draw(); }
  else requestAnimationFrame(loop);

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); if (reduceMotion) draw(); }, 150); });
  document.addEventListener('themechange', () => { readColors(); if (reduceMotion) draw(); });

  // pause when scrolled out of view
  if ('IntersectionObserver' in window && !reduceMotion) {
    new IntersectionObserver(([e]) => {
      const was = running; running = e.isIntersecting;
      if (running && !was) { last = performance.now(); requestAnimationFrame(loop); }
    }).observe(canvas);
  }
})();
