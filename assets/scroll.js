const hero = document.querySelector('.hero');
const stage = hero.querySelector('.hero-stage');
const header = document.querySelector('.header');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let framePending = false;

function updateHero() {
  framePending = false;
  const canExpand = !reducedMotion.matches &&
    CSS.supports('clip-path', 'inset(0 round 1rem)') &&
    stage.offsetHeight <= window.innerHeight - header.offsetHeight + 2;
  hero.classList.toggle('is-expanding', canExpand);
  if (!canExpand) return;

  const travel = hero.offsetHeight - stage.offsetHeight;
  const distance = header.offsetHeight - hero.getBoundingClientRect().top;
  const progress = Math.max(0, Math.min(distance / travel, 1));
  hero.style.setProperty('--hero-progress', progress);
}

function scheduleHeroUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateHero);
}

window.addEventListener('scroll', scheduleHeroUpdate, { passive: true });
window.addEventListener('resize', scheduleHeroUpdate);
reducedMotion.addEventListener('change', scheduleHeroUpdate);
if ('ResizeObserver' in window) {
  const layoutObserver = new ResizeObserver(scheduleHeroUpdate);
  layoutObserver.observe(stage);
  layoutObserver.observe(header);
}
updateHero();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches) entry.target.classList.add('entering');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
