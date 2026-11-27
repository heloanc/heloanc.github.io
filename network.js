// Decorative agent network. No external libraries or network requests.
(() => {
  const canvas = document.getElementById('agent-network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('[data-pause-network]');
  let width = 0, height = 0, ratio = 1, raf = 0, last = 0, elapsed = 0, paused = false;
  // A spatial graph grows in successive layers. Reading progress opens the spacing,
  // thins connections and moves the composition; time controls the independent drift.
  const tau = Math.PI * 2;
  const palette = ['76,131,123', '99,127,157', '134,119,159', '150,132,110'];
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const noise = seed => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rgba = (rgb, a) => 'rgba(' + rgb + ',' + a + ')';
  let progress = 0;
  const resize = () => {
    width = innerWidth; height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    paint();
  };
  function paint() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const mobile = width < 700;
    const count = mobile ? 7 : 9;
    const centerX = width * (.48 + .17 * Math.sin(progress * Math.PI * .9));
    const centerY = height * (.42 + .13 * progress);
    const spacing = Math.max(width, height) * .055 * (1 + .85 * progress);
    const phase = (elapsed + 9) / 22;
    const layers = [];
    const density = .96 - .60 * progress;
    // A restrained central haze has no visible border or fixed side columns.
    const haze = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, spacing * 4);
    haze.addColorStop(0, 'rgba(124,160,165,.07)');
    haze.addColorStop(1, 'rgba(124,160,165,0)');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);
    for (let generation = Math.floor(phase) - 6; generation <= Math.floor(phase); generation++) {
      const age = phase - generation;
      const envelope = smooth(age / .8) * smooth((6.2 - age) / 1.5);
      const radius = spacing * Math.pow(1.72, age);
      const nodes = [];
      for (let i = 0; i < count; i++) {
        const seed = generation * 19 + i * 7;
        const rotation = elapsed * .009 * (generation % 2 ? 1 : -1);
        const angle = i * tau / count + noise(generation * 3) * tau + (noise(seed) - .5) * .32 + rotation;
        const spread = .8 + noise(seed + 1) * .4;
        const alpha = envelope * smooth((density - noise(seed + 4)) / .22) * (1 - progress * .22);
        nodes.push({
          x: centerX + Math.cos(angle) * radius * spread,
          y: centerY + Math.sin(angle) * radius * spread * .72,
          r: Math.min(6.3, 1.6 + age * .75), alpha,
          rgb: palette[((generation + i % 2) % palette.length + palette.length) % palette.length],
          seed
        });
      }
      layers.push(nodes);
    }
    function edge(a, b, seed, crossLayer) {
      const alpha = Math.min(a.alpha, b.alpha);
      if (alpha < .015) return;
      // Each edge bows independently, avoiding a visible lattice or ribbon pattern.
      const dx = b.x - a.x, dy = b.y - a.y;
      const bend = (noise(seed + 8) - .5) * .27;
      const cx = (a.x + b.x) / 2 - dy * bend;
      const cy = (a.y + b.y) / 2 + dx * bend;
      ctx.beginPath();ctx.moveTo(a.x, a.y);ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.strokeStyle = rgba(crossLayer ? '141,161,170' : a.rgb, alpha * (crossLayer ? .22 : .19));
      ctx.lineWidth = .8;ctx.stroke();
      if (noise(seed + 13) > .57) return;
      const t = (elapsed * .1 + noise(seed + 22)) % 1;
      const q = 1 - t;
      const x = q * q * a.x + 2 * q * t * cx + t * t * b.x;
      const y = q * q * a.y + 2 * q * t * cy + t * t * b.y;
      ctx.beginPath();ctx.arc(x, y, 1.8, 0, tau);
      ctx.fillStyle = rgba(a.rgb, alpha * .65 * Math.sin(t * Math.PI));ctx.fill();
    }
    layers.forEach((nodes, layer) => {
      nodes.forEach((a, i) => {
        edge(a, nodes[(i + 1) % count], a.seed, false);
        if (i % 3 === 0) edge(a, nodes[(i + 3) % count], a.seed + 50, false);
        if (layer + 1 < layers.length) edge(a, layers[layer + 1][(i + 2) % count], a.seed + 100, true);
      });
    });
    for (const nodes of layers) for (const a of nodes) {
      if (a.alpha < .015 || a.x < -30 || a.x > width + 30 || a.y < -30 || a.y > height + 30) continue;
      const breathe = .8 + .2 * Math.sin(elapsed * .6 + a.seed);
      const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 4);
      glow.addColorStop(0, rgba(a.rgb, a.alpha * .23 * breathe));
      glow.addColorStop(1, rgba(a.rgb, 0));
      ctx.fillStyle = glow;ctx.fillRect(a.x - a.r * 4, a.y - a.r * 4, a.r * 8, a.r * 8);
      ctx.beginPath();ctx.arc(a.x, a.y, a.r, 0, tau);
      ctx.fillStyle = 'rgba(255,255,255,' + a.alpha * .9 + ')';ctx.fill();
      ctx.strokeStyle = rgba(a.rgb, a.alpha * .55);ctx.lineWidth = 1;ctx.stroke();
    }
    // Dim only the reading column, preserving the spatial graph at both margins.
    const half = Math.min(width * .36, document.body.classList.contains('research-page') ? 390 : 470);
    const left = width / 2 - half;
    const right = width / 2 + half;
    const veil = ctx.createLinearGradient(0, 0, width, 0);
    veil.addColorStop(0, 'rgba(0,0,0,0)');
    veil.addColorStop(Math.max(.01, (left - 65) / width), 'rgba(0,0,0,.12)');
    veil.addColorStop((left + 45) / width, 'rgba(0,0,0,.82)');
    veil.addColorStop((right - 45) / width, 'rgba(0,0,0,.82)');
    veil.addColorStop(Math.min(.99, (right + 65) / width), 'rgba(0,0,0,.12)');
    veil.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = veil;ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    raf = 0;
    if (last === 0 || now - last >= 1000 / 30) {
      const delta = last ? Math.min((now - last) / 1000, .1) : 1 / 30;
      elapsed += last ? delta : 0;
      const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const target = clamp(window.scrollY / range);
      progress += (target - progress) * (1 - Math.exp(-delta * 6));
      last = now; paint();
    }
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (!paused && !motion.matches && !document.hidden) raf = requestAnimationFrame(tick);
    document.body.classList.toggle('network-paused', paused || motion.matches);
    if (button) {
      button.setAttribute('aria-pressed', String(paused));
      button.querySelector('[lang="en"]').textContent = paused ? 'Resume motion' : 'Pause motion';
      button.querySelector('[lang="zh-CN"]').textContent = paused ? '继续动画' : '暂停动画';
    }
  }
  button?.addEventListener('click', () => { paused = !paused; sync(); });
  addEventListener('resize', resize, {passive: true});
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  addEventListener('pagehide', () => cancelAnimationFrame(raf));
  addEventListener('pageshow', sync);
  resize(); sync();
})();
