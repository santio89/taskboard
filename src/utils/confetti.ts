const PARTICLE_COUNT = 40;
const COLORS = ['#8b5cf6', '#6d28d9', '#a78bfa', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function fireConfetti(originX?: number, originY?: number) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) { canvas.remove(); return; }
  const ctx: CanvasRenderingContext2D = maybeCtx;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const cx = originX ?? canvas.width / 2;
  const cy = originY ?? canvas.height / 3;

  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: cx,
    y: cy,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -10 - 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));

  let frame = 0;
  const maxFrames = 80;

  function animate() {
    frame++;
    if (frame > maxFrames) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
