// Decorative agent network. No external libraries or network requests.
(() => {
  const canvas = document.getElementById('agent-network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('[data-pause-network]');
  let width = 0, height = 0, ratio = 1, points = [], raf = 0, last = 0, elapsed = 0, paused = false;
  const palette = ['47,128,119', '66,118,160', '92,142,135'];
  const random = (min, max) => min + Math.random() * (max - min);
  const resize = () => {
    width = innerWidth; height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const cols = width < 700 ? 4 : Math.min(13, Math.ceil(width / 130));
    const rows = Math.min(8, Math.ceil(height / 140));
    points = Array.from({length: cols * rows}, (_, index) => ({
      x: ((index % cols) + random(.12, .88)) / cols * width,
      y: (Math.floor(index / cols) + random(.12, .88)) / rows * height,
      phase: random(0, Math.PI * 2), color: palette[index % palette.length],
      r: index % 9 === 0 ? 3 : 1.5
    }));
    paint();
  };
  function paint() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const positions = points.map(p => ({...p,
      x: p.x + Math.sin(elapsed * .16 + p.phase) * 18,
      y: p.y + Math.cos(elapsed * .12 + p.phase) * 14
    }));
    const distanceLimit = width < 700 ? 155 : 195;
    // The center stays quiet so that body text remains easy to read.
    const opacityAt = x => .35 + .65 * Math.pow(Math.abs(x - width / 2) / (width / 2), .7);
    for (let i = 0; i < positions.length; i++) {
      const a = positions[i];
      for (let j = i + 1; j < positions.length; j++) {
        const b = positions[j], distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= distanceLimit) continue;
        const alpha = (1 - distance / distanceLimit) * .38 * opacityAt((a.x + b.x) / 2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(' + a.color + ',' + alpha + ')';
        ctx.lineWidth = .8; ctx.stroke();
        // A few signals travel along edges rather than flashing the whole mesh.
        if ((i * 7 + j) % 11 === 0) {
          const t = (elapsed * .12 + a.phase) % 1;
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + a.color + ',' + .65 * opacityAt(a.x) + ')'; ctx.fill();
        }
      }
      const alpha = opacityAt(a.x) * (.42 + Math.sin(elapsed * .8 + a.phase) * .1);
      if (a.r > 2) {
        ctx.beginPath(); ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + a.color + ',' + alpha * .12 + ')'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + a.color + ',' + alpha + ')'; ctx.fill();
    }
  }
  function tick(now) {
    raf = 0;
    if (last === 0 || now - last >= 1000 / 30) {
      elapsed += last ? Math.min((now - last) / 1000, .1) : 0;
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
