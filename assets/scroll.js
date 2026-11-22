const hero = document.querySelector('.hero');
const stage = hero.querySelector('.hero-stage');
const chipStack = hero.querySelector('.chip-stack');
const header = document.querySelector('.header');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const parallaxLayers = [...document.querySelectorAll('[data-parallax]')].map((element) => ({
  element,
  section: element.closest('section'),
  distance: Number(element.dataset.parallax)
}));
let framePending = false;
let chipTarget = 0;
let chipProgress = 0;
let chipFrame;
let previousChipTime;

function paintChipProgress() {
  const eased = chipProgress * chipProgress * (3 - 2 * chipProgress);
  chipStack.style.setProperty('--chip-progress', eased);
}

function animateChips(time) {
  const elapsed = previousChipTime === undefined ? 16 : Math.min(time - previousChipTime, 36);
  previousChipTime = time;
  chipProgress += (chipTarget - chipProgress) * (1 - Math.exp(-elapsed / 92));

  if (Math.abs(chipTarget - chipProgress) < .001) {
    chipProgress = chipTarget;
    chipFrame = undefined;
    previousChipTime = undefined;
  } else {
    chipFrame = window.requestAnimationFrame(animateChips);
  }
  paintChipProgress();
}

function updateHero() {
  framePending = false;
  const canExpand = !reducedMotion.matches &&
    stage.offsetHeight <= window.innerHeight - header.offsetHeight + 2;
  hero.classList.toggle('is-expanding', canExpand);
  if (reducedMotion.matches) {
    window.cancelAnimationFrame(chipFrame);
    chipFrame = undefined;
    previousChipTime = undefined;
    return;
  }

  const travel = canExpand ? hero.offsetHeight - stage.offsetHeight : stage.offsetHeight * .65;
  const distance = header.offsetHeight - hero.getBoundingClientRect().top;
  chipTarget = Math.max(0, Math.min(distance / Math.max(travel, 1), 1));
  if (chipProgress !== chipTarget) chipFrame ??= window.requestAnimationFrame(animateChips);
  const viewportHeight = window.innerHeight;
  const intensity = window.innerWidth < 768 ? .55 : 1;
  for (const { element, section, distance } of parallaxLayers) {
    const bounds = section.getBoundingClientRect();
    const middle = bounds.top + bounds.height / 2;
    const position = Math.max(-1, Math.min((middle - viewportHeight / 2) / (viewportHeight * .6), 1));
    element.style.setProperty('--parallax-offset', `${position * distance * intensity}px`);
  }
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
paintChipProgress();
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

const orbitalLayout = document.querySelector('.orbital-layout');
const trajectoryList = document.querySelector('.trajectory-list');
const trajectoryDetail = orbitalLayout.querySelector('.orbit-detail');
const orbitalNodes = [...orbitalLayout.querySelectorAll('[data-entry]')];
const orbitToggle = orbitalLayout.querySelector('.orbit-toggle');
let selectedMilestone = orbitalNodes[0];
let milestoneAnimation;

function showMilestone(selectedNode) {
  const entry = document.getElementById(selectedNode.dataset.entry);
  const category = document.createElement('p');
  category.className = 'eyebrow';
  category.textContent = entry.dataset.category;
  trajectoryDetail.replaceChildren(category, ...[...entry.children].map((child) => child.cloneNode(true)));
  for (const node of orbitalNodes) {
    node.setAttribute('aria-pressed', node === selectedNode);
  }
}

async function selectMilestone(node) {
  if (selectedMilestone === node) return;
  selectedMilestone = node;
  const currentOpacity = Number(getComputedStyle(trajectoryDetail).opacity);
  milestoneAnimation?.cancel();

  if (reducedMotion.matches || !trajectoryDetail.animate) {
    showMilestone(node);
    return;
  }

  const fadeOut = trajectoryDetail.animate(
    [{ opacity: currentOpacity }, { opacity: 0 }],
    { duration: 220, easing: 'ease-in', fill: 'forwards' }
  );
  milestoneAnimation = fadeOut;
  try {
    await fadeOut.finished;
  } catch {
    return;
  }
  if (milestoneAnimation !== fadeOut) return;

  showMilestone(node);
  fadeOut.cancel();
  milestoneAnimation = trajectoryDetail.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 470, easing: 'ease-out' }
  );
}

for (const node of orbitalNodes) {
  node.addEventListener('click', () => selectMilestone(node));
}
orbitToggle.addEventListener('click', () => {
  const paused = orbitalLayout.classList.toggle('is-paused');
  orbitToggle.textContent = paused ? 'Reanudar órbitas' : 'Pausar órbitas';
});
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#formacion') selectMilestone(orbitalNodes[0]);
});
reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  milestoneAnimation?.cancel();
  showMilestone(selectedMilestone);
});
showMilestone(orbitalNodes[0]);
trajectoryList.hidden = true;
orbitalLayout.hidden = false;

const reflectiveSurfaces = document.querySelectorAll('.tech-card, .orbit-summary');
const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');

for (const surface of reflectiveSurfaces) {
  surface.addEventListener('pointermove', (event) => {
    if (!hoverPointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;

    const bounds = surface.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    surface.style.setProperty('--gloss-x', `${x * 100}%`);
    surface.style.setProperty('--gloss-y', `${y * 100}%`);
    surface.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
    surface.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
  });
  surface.addEventListener('pointerleave', () => {
    for (const property of ['--gloss-x', '--gloss-y', '--tilt-x', '--tilt-y']) {
      surface.style.removeProperty(property);
    }
  });
}

const silkCanvas = document.querySelector('.silk-background');
const silkContext = silkCanvas.getContext('2d', { alpha: false });

if (silkContext) {
  let silkImage;
  let silkFrame;
  let lastPaint;
  let silkTime = 0;

  function paintSilk() {
    const { width, height, data } = silkImage;
    const aspect = Math.max(.85, Math.min(silkCanvas.clientWidth / silkCanvas.clientHeight, 1.8));
    const centerX = .57 + Math.sin(silkTime * .62) * .045;
    const centerY = .46 + Math.cos(silkTime * .54) * .05;
    const twist = 3.05 + Math.sin(silkTime * .58) * .36;

    for (let row = 0; row < height; row++) {
      const y = row / height - centerY;
      for (let col = 0; col < width; col++) {
        const u = col / width;
        const x = (u - centerX) * aspect;
        const radius = x * x + y * y;
        const turn = twist * Math.exp(-radius * 4.4);
        const along = x * Math.cos(turn) - y * Math.sin(turn);
        const across = x * Math.sin(turn) + y * Math.cos(turn);
        const fold = across * 9.4 + along * 1.6 + .9 * Math.sin(along * 3.3 - silkTime * .75);
        const sheen = .5 + .5 * Math.sin(fold);
        const edge = Math.pow(sheen, 12);
        const shadow = .5 + .5 * Math.cos(fold - .8);
        const light = (.33 + .49 * Math.exp(-radius * 1.8)) * (.61 + .39 * u);
        const tone = 9 + (52 * sheen * sheen + 146 * edge + 15 * shadow) * light;
        const index = (row * width + col) * 4;
        const lavender = 5 + sheen * 27;
        data[index] = tone + lavender * .55;
        data[index + 1] = tone + lavender * .32;
        data[index + 2] = tone + lavender;
        data[index + 3] = 255;
      }
    }
    silkContext.putImageData(silkImage, 0, 0);
  }

  function sizeSilk() {
    const width = Math.min(304, Math.ceil(silkCanvas.clientWidth / 3));
    const height = Math.min(192, Math.ceil(silkCanvas.clientHeight / 3));
    silkCanvas.width = Math.max(1, width);
    silkCanvas.height = Math.max(1, height);
    silkImage = silkContext.createImageData(silkCanvas.width, silkCanvas.height);
    paintSilk();
  }

  function animateSilk(now) {
    lastPaint ??= now;
    const elapsed = now - lastPaint;
    if (elapsed >= (chipFrame === undefined ? 46 : 80)) {
      silkTime += Math.min(elapsed, 90) * .00055;
      lastPaint = now;
      paintSilk();
    }
    silkFrame = window.requestAnimationFrame(animateSilk);
  }

  function syncSilkMotion() {
    window.cancelAnimationFrame(silkFrame);
    lastPaint = undefined;
    if (!reducedMotion.matches && !document.hidden) {
      silkFrame = window.requestAnimationFrame(animateSilk);
    }
  }

  window.addEventListener('resize', sizeSilk);
  document.addEventListener('visibilitychange', syncSilkMotion);
  reducedMotion.addEventListener('change', syncSilkMotion);
  sizeSilk();
  syncSilkMotion();
}
