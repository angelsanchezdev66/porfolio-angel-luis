const hero = document.querySelector('.hero');
const landscape = document.querySelector('.hero-art');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactScreen = window.matchMedia('(max-width: 48rem)');
let framePending = false;

function updateLandscape() {
  framePending = false;
  if (reducedMotion.matches) {
    landscape.style.removeProperty('--shift');
    landscape.style.removeProperty('--zoom');
    return;
  }

  const progress = Math.max(0, Math.min(window.scrollY / hero.offsetHeight, 1));
  const travel = compactScreen.matches ? 30 : 85;
  landscape.style.setProperty('--shift', `${progress * travel}px`);
  landscape.style.setProperty('--zoom', 1 + progress * 0.08);
}

function scheduleLandscapeUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateLandscape);
}

window.addEventListener('scroll', scheduleLandscapeUpdate, { passive: true });
window.addEventListener('resize', scheduleLandscapeUpdate);
reducedMotion.addEventListener('change', scheduleLandscapeUpdate);
updateLandscape();

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
