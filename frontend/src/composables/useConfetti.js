// Plain canvas particle burst, no dependency - mirrors utils/dragGhost.js's
// approach of doing lightweight DOM/canvas work outside Vue's reactivity
// (this only ever runs for ~2.5s and gets torn down, nothing to react to).

const COLORS = ['#6366F1', '#A78BFA', '#38BDF8', '#F59E0B', '#10B981', '#F43F5E'];
const PARTICLE_COUNT = 140;
const DURATION_MS = 2600;
const GRAVITY = 0.16;

export function useConfetti() {
  function burst() {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Launched from a spread near top-center, like a popper going off.
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 160,
      y: canvas.height * 0.3 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 15 - 4,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 22,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }));

    const start = performance.now();
    let frameId;

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        frameId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(frameId);
        canvas.remove();
      }
    }

    frameId = requestAnimationFrame(frame);
  }

  return { burst };
}
