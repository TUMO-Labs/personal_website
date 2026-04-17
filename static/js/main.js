/* ===== ANIMATED BACKGROUND CANVAS — lighter warm pinks ===== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Blobs tuned to E67CBA / E394C2 / EBB9D4 palette — lighter, warmer
const blobs = [
  { x: 0.12, y: 0.18, r: 0.42, hue: 325, sat: 72, light: 55 },
  { x: 0.80, y: 0.55, r: 0.35, hue: 310, sat: 62, light: 60 },
  { x: 0.45, y: 0.88, r: 0.30, hue: 338, sat: 68, light: 58 },
  { x: 0.90, y: 0.12, r: 0.25, hue: 300, sat: 58, light: 62 },
  { x: 0.25, y: 0.70, r: 0.22, hue: 345, sat: 55, light: 65 },
  { x: 0.60, y: 0.30, r: 0.18, hue: 318, sat: 65, light: 57 },
];

let t = 0;

function drawBlobs() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  blobs.forEach((b, i) => {
    const ox = Math.sin(t * 0.6 + i * 1.4) * 0.07;
    const oy = Math.cos(t * 0.45 + i * 2.0) * 0.06;
    const px = (b.x + ox) * canvas.width;
    const py = (b.y + oy) * canvas.height;
    const radius = b.r * Math.min(canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
    grad.addColorStop(0,   `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0.50)`);
    grad.addColorStop(0.45,`hsla(${b.hue}, ${b.sat}%, ${b.light - 8}%, 0.22)`);
    grad.addColorStop(1,   `hsla(${b.hue}, ${b.sat}%, ${b.light - 12}%, 0)`);

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // Soft center haze
  const cx = canvas.width * 0.5 + Math.sin(t * 0.28) * 70;
  const cy = canvas.height * 0.45 + Math.cos(t * 0.35) * 50;
  const cr = 0.5 * Math.min(canvas.width, canvas.height);
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
  cg.addColorStop(0,  'hsla(330, 60%, 62%, 0.10)');
  cg.addColorStop(1,  'hsla(330, 60%, 50%, 0)');
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();

  t += 0.0035;
  requestAnimationFrame(drawBlobs);
}
drawBlobs();

/* ===== NAV SCROLL ===== */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ===== SCROLL REVEAL ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      setTimeout(() => el.classList.add('visible'), Number(el.dataset.delay || 0));
      revealObserver.unobserve(el);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal-line, .reveal-fade, .reveal-image, .welcome-text').forEach((el, i) => {
  if (!el.dataset.delay) el.dataset.delay = i * 55;
  revealObserver.observe(el);
});

/* ===== HERO PARALLAX ===== */
const heroPhoto = document.querySelector('.hero-photo');
window.addEventListener('scroll', () => {
  if (!heroPhoto) return;
  heroPhoto.style.transform = `translateY(${window.scrollY * 0.1}px)`;
}, { passive: true });

/* ===== TEXT SCRAMBLE ON LOAD ===== */
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function scramble(element, finalText, duration = 700) {
  const steps = Math.floor(duration / 30);
  let step = 0;
  const interval = setInterval(() => {
    step++;
    const progress = step / steps;
    const revealed = Math.floor(progress * finalText.length);
    let result = '';
    for (let i = 0; i < finalText.length; i++) {
      if (i < revealed) result += finalText[i];
      else if (finalText[i] === ' ') result += ' ';
      else result += chars[Math.floor(Math.random() * chars.length)];
    }
    element.textContent = result;
    if (step >= steps) { clearInterval(interval); element.textContent = finalText; }
  }, 30);
}

window.addEventListener('load', () => {
  document.querySelectorAll('.hero-title .line').forEach((line, i) => {
    const original = line.textContent;
    setTimeout(() => scramble(line, original, 600), 500 + i * 200);
  });
});

/* ===== SKILL CARD TILT ===== */
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -6;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
    card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
