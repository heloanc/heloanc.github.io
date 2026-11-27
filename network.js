// Decorative agent network. No external libraries or network requests.
(() => {
  const canvas = document.getElementById('agent-network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('[data-pause-network]');
  let width = 0, height = 0, ratio = 1, raf = 0, last = 0, elapsed = 0, paused = false;
  // Two continuous folded surfaces, composed as an asymmetric frame around the text.
  // Stable topology and deterministic placement prevent popping when the viewport changes.
  const tau = Math.PI * 2;
  let scrollPosition = Math.max(0, window.scrollY);
  // Bounded camera travel keeps the surfaces in frame even on long articles.
  const travel = () => height * .22 * Math.tanh(scrollPosition / Math.max(height, 1) * .65);
  function surface(u, v, side) {
    const mobile = width < 700;
    const scale = Math.min(width, 1600);
    const time = elapsed * .075;
    const phase = u * tau * .85 + time + side * 2 + scrollPosition * .00024;
    const center = side === 0
      ? width * .045 + Math.sin(phase + .7) * scale * .07
      : width * .965 + Math.sin(phase + 1.4) * scale * .075;
    const breadth = scale * (mobile ? .21 : .13) * (.68 + .32 * Math.sin(u * Math.PI));
    const twist = phase * .9 + v * .65;
    const depth = Math.sin(twist) * v;
    return {
      x: center + v * breadth * Math.cos(twist) + Math.sin(u * 8 + v * 2 + time) * scale * .018,
      y: -height * .22 + u * height * 1.55 + Math.sin(twist) * v * height * .075 - travel() * (.65 + (depth + 1) * .3),
      z: depth,
      alpha: .24 + .76 * Math.pow(Math.sin(Math.PI * u), .7)
    };
  }
  function color(side, alpha) {
    return 'rgba(' + (side ? '104,119,169' : '63,140,131') + ',' + alpha + ')';
  }
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
    // Diffuse atmosphere blends into the paper instead of forming a rectangular panel.
    for (const [x, y, radius, rgb] of [
      [width * .97, height * .28 - travel() * .22, Math.max(240, width * .31), '166,175,218'],
      [width * .02, height * .72 - travel() * .32, Math.max(210, width * .28), '153,201,188']
    ]) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, 'rgba(' + rgb + ',.19)');
      glow.addColorStop(.5, 'rgba(' + rgb + ',.07)');
      glow.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    }
    for (let side = 0; side < 2; side++) {
      const strands = mobile ? 7 : 11;
      // Smooth longitudinal filaments give the network its direction and depth.
      for (let j = 0; j < strands; j++) {
        const v = -1 + j / (strands - 1) * 2;
        ctx.beginPath();
        for (let step = 0; step <= 90; step++) {
          const p = surface(step / 90, v, side);
          if (!step) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = color(side, .11 + .08 * (1 - Math.abs(v)));
        ctx.lineWidth = j % 3 === 0 ? .85 : .5; ctx.stroke();
      }
      // Sparse curved cross-links, with denser nodes only on the visible side of the fold.
      for (let row = 1; row < 24; row++) {
        const u = row / 24;
        ctx.beginPath();
        for (let step = 0; step <= 36; step++) {
          const p = surface(u, -1 + step / 18, side);
          if (!step) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = color(side, .10 * Math.sin(u * Math.PI));
        ctx.lineWidth = .55; ctx.stroke();
        for (let j = 0; j < strands; j++) {
          if ((row + j * 3 + side) % 4 !== 0) continue;
          const p = surface(u, -1 + j / (strands - 1) * 2, side);
          const radius = (row + j) % 7 === 0 ? 2.5 : 1.25;
          ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, tau);
          ctx.fillStyle = color(side, p.alpha * (.35 + .12 * p.z)); ctx.fill();
        }
      }
      // Signals follow the curves; their soft tails imply information flow.
      for (let k = 0; k < (mobile ? 3 : 5); k++) {
        const u = (k * .197 + elapsed * .018 + side * .11) % 1;
        const v = Math.sin(k * 2.4 + side) * .85;
        const p = surface(u, v, side);
        ctx.beginPath();
        for (let step = 0; step <= 12; step++) {
          const q = surface(Math.max(0, u - .035 + step / 12 * .035), v, side);
          if (!step) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.strokeStyle = color(side, p.alpha * .32); ctx.lineWidth = 1.3; ctx.stroke();
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
        halo.addColorStop(0, color(side, .2 * p.alpha)); halo.addColorStop(1, color(side, 0));
        ctx.fillStyle = halo; ctx.fillRect(p.x - 12, p.y - 12, 24, 24);
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, tau);
        ctx.fillStyle = color(side, p.alpha * .64); ctx.fill();
      }
    }
    // A soft central veil preserves negative space without a visible panel edge.
    ctx.globalCompositeOperation = 'destination-out';
    const veil = ctx.createLinearGradient(0, 0, width, 0);
    veil.addColorStop(0, 'rgba(0,0,0,0)');
    veil.addColorStop(.2, 'rgba(0,0,0,.25)');
    veil.addColorStop(.34, 'rgba(0,0,0,.94)');
    veil.addColorStop(.67, 'rgba(0,0,0,.94)');
    veil.addColorStop(.82, 'rgba(0,0,0,.25)');
    veil.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = veil; ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    raf = 0;
    if (last === 0 || now - last >= 1000 / 30) {
      const delta = last ? Math.min((now - last) / 1000, .1) : 1 / 30;
      elapsed += last ? delta : 0;
      scrollPosition += (Math.max(0, window.scrollY) - scrollPosition) * (1 - Math.exp(-delta * 9));
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
