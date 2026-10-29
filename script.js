// Interactive Popcorn Logic & Canvas Particle Physics
document.addEventListener('DOMContentLoaded', () => {
  const screenArea = document.getElementById('screen-area');
  const canvas = document.getElementById('popcorn-canvas');
  const ctx = canvas.getContext('2d');
  const popcornImg = document.getElementById('popcorn-img');
  const flashOverlay = document.getElementById('flash-overlay');
  const wmpContainer = document.querySelector('.wmp-container');
  const playBtn = document.getElementById('play-button');

  // Set proper canvas resolution
  function resizeCanvas() {
    canvas.width = screenArea.clientWidth || 553;
    canvas.height = screenArea.clientHeight || 374;
  }
  resizeCanvas();

  let heat = 0; // 0 to 100
  let isExploding = false;
  let lastClickTime = 0;
  let explosionTimer = 0;

  const popcornColors = [
    '#FFFEEA',
    '#FFF8D0',
    '#FFEAA0',
    '#FFF1B8',
    '#FFFFFF',
    '#FFDD67'
  ];

  const particles = [];

  // Spawn single popcorn piece
  function spawnPopcornPiece(originX, originY, speedScale = 1, isExplode = false) {
    const angle = isExplode
      ? Math.random() * Math.PI * 2
      : -Math.PI / 2 + (Math.random() - 0.5) * 1.6;

    const speed = isExplode
      ? 5 + Math.random() * 16 * speedScale
      : 5 + Math.random() * 8 * speedScale;

    particles.push({
      type: 'popcorn',
      x: originX + (Math.random() - 0.5) * 30,
      y: originY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      size: 9 + Math.random() * 10,
      color: popcornColors[Math.floor(Math.random() * popcornColors.length)],
      life: 1.0,
      decay: 0.01 + Math.random() * 0.012,
      bounces: 0
    });
  }

  // Spawn spark particle
  function spawnSpark(originX, originY) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 12;
    particles.push({
      type: 'spark',
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: 0,
      vRot: 0,
      size: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? '#FF4500' : '#FFD700',
      life: 1.0,
      decay: 0.02 + Math.random() * 0.02
    });
  }

  // Spawn smoke puff
  function spawnSmoke(originX, originY) {
    particles.push({
      type: 'smoke',
      x: originX + (Math.random() - 0.5) * 40,
      y: originY + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2.5,
      vy: -1.5 - Math.random() * 2,
      rotation: 0,
      vRot: 0,
      size: 14 + Math.random() * 16,
      color: 'rgba(230, 230, 230, 0.45)',
      life: 1.0,
      decay: 0.012 + Math.random() * 0.008
    });
  }

  // Explosion action
  function triggerExplosion() {
    isExploding = true;
    heat = 100;
    explosionTimer = 150; // frames ~2.5s

    // Flash screen
    flashOverlay.style.opacity = '0.9';
    setTimeout(() => {
      flashOverlay.style.opacity = '0';
    }, 180);

    // Screen shake
    if (wmpContainer) {
      wmpContainer.classList.add('shake-explosion');
      setTimeout(() => {
        wmpContainer.classList.remove('shake-explosion');
      }, 700);
    }

    // Popcorn image wild animation
    popcornImg.style.transition = 'transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    popcornImg.style.transform = 'translate(0, -50px) rotate(720deg) scale(1.35)';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 30;

    // Massively spawn popcorns in 360 degrees
    for (let i = 0; i < 110; i++) {
      spawnPopcornPiece(centerX, centerY, 1.3, true);
    }

    // Sparks and smoke
    for (let i = 0; i < 40; i++) {
      spawnSpark(centerX, centerY);
    }
    for (let i = 0; i < 25; i++) {
      spawnSmoke(centerX, centerY);
    }
  }

  // Handle user clicks / presses
  function handlePopcornPress(e) {
    if (isExploding) return;

    const now = performance.now();
    const interval = now - lastClickTime;
    lastClickTime = now;

    // Faster clicks generate much more heat!
    const speedBonus = interval < 220 ? 8 : (interval < 350 ? 5 : 2);
    heat = Math.min(100, heat + 7 + speedBonus);

    // Squash & bounce image
    popcornImg.style.transition = 'transform 0.06s ease';
    popcornImg.style.transform = 'scale(1.15, 0.86)';
    setTimeout(() => {
      if (!isExploding) {
        popcornImg.style.transition = 'transform 0.08s ease';
        popcornImg.style.transform = 'scale(1)';
      }
    }, 70);

    // Spawn popcorn: more heat = more popcorn flying out faster!
    const spawnCount = 3 + Math.floor((heat / 100) * 8);
    const rect = canvas.getBoundingClientRect();
    const clickX = e ? e.clientX - rect.left : canvas.width / 2;
    const clickY = e ? e.clientY - rect.top : canvas.height / 2 + 40;

    const originX = Math.max(40, Math.min(canvas.width - 40, clickX));
    const originY = Math.max(50, Math.min(canvas.height - 40, clickY));

    for (let i = 0; i < spawnCount; i++) {
      spawnPopcornPiece(originX, originY, 1 + (heat / 100) * 0.8);
    }

    // Occasional smoke/steam when hot
    if (heat > 45 && Math.random() > 0.4) {
      spawnSmoke(originX, originY - 20);
    }

    // Check for explosion
    if (heat >= 100) {
      triggerExplosion();
    }
  }

  // Click & Touch events on screen area
  screenArea.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handlePopcornPress(e);
  });

  // Play button also triggers popcorn click
  if (playBtn) {
    playBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handlePopcornPress(null);
    });
  }

  // Draw a single popcorn particle
  function renderPopcorn(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));

    const s = p.size;
    ctx.fillStyle = p.color;

    // Center round puff
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Distinct puffy popcorn lobes
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.22, s * 0.34, 0, Math.PI * 2);
    ctx.arc(s * 0.3, -s * 0.22, s * 0.34, 0, Math.PI * 2);
    ctx.arc(0, s * 0.33, s * 0.38, 0, Math.PI * 2);
    ctx.arc(-s * 0.2, s * 0.2, s * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Golden-brown kernel core
    ctx.fillStyle = '#C87820';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw spark particle
  function renderSpark(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  // Draw smoke particle
  function renderSmoke(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.max(0, p.life * 0.4);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main Animation & Physics Loop
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Heat decay when not exploding
    if (!isExploding) {
      if (heat > 0) {
        // Natural heat decay
        heat = Math.max(0, heat - 19 * dt);
      }

      // Popcorn jitter / shake when heating up
      if (heat > 8) {
        const jitter = (heat / 100) * 7.5;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;
        const rot = (Math.random() - 0.5) * (heat / 100) * 11;
        const scale = 1 + (heat / 100) * 0.12;

        popcornImg.style.transform = `translate(${jx}px, ${jy}px) rotate(${rot}deg) scale(${scale})`;
        popcornImg.style.filter = `drop-shadow(0 0 ${(heat / 100) * 14}px rgba(255, ${Math.max(0, Math.floor(180 - heat * 1.5))}, 0, 0.85))`;
      } else {
        popcornImg.style.transform = 'translate(0px, 0px) scale(1)';
        popcornImg.style.filter = 'none';
      }
    } else {
      // Exploding state countdown
      explosionTimer--;
      if (explosionTimer <= 0) {
        isExploding = false;
        heat = 0;
        popcornImg.style.transition = 'transform 0.4s ease';
        popcornImg.style.transform = 'scale(1)';
        popcornImg.style.filter = 'none';
      }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Gravity and movement
      if (p.type === 'popcorn') {
        p.vy += 22 * dt; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.life -= p.decay;

        // Floor bounce inside screen
        if (p.y > canvas.height - p.size * 0.8 && p.bounces < 2) {
          p.y = canvas.height - p.size * 0.8;
          p.vy = -p.vy * 0.35;
          p.vx *= 0.7;
          p.bounces++;
        }

        renderPopcorn(p);
      } else if (p.type === 'spark') {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        renderSpark(p);
      } else if (p.type === 'smoke') {
        p.x += p.vx;
        p.y += p.vy;
        p.size += 14 * dt;
        p.life -= p.decay;
        renderSmoke(p);
      }

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
