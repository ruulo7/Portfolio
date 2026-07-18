// Prevent placeholder links from scrolling to top
document.querySelectorAll('.js-noop').forEach(el => {
  el.addEventListener('click', e => e.preventDefault());
});

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

// Reading progress bar — reutiliza el bottom stroke del nav (solo flowck.html)
(function () {
  const navProgress = document.querySelector('.nav--progress');
  if (!navProgress) return;

  let ticking = false;

  function update() {
    const scrollY = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(100, Math.max(0, (scrollY / scrollable) * 100)) : 0;
    navProgress.style.setProperty('--scroll-progress', progress + '%');
    navProgress.classList.toggle('nav--progress-active', scrollY > 0);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}());

// Reveal on scroll — stagger via CSS custom property --reveal-delay
(function () {
  const sections = document.querySelectorAll('main > section:not(#hero)');
  if (!sections.length) return;

  sections.forEach(section => {
    section.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', (i * 80) + 'ms');
    });
  });

  // About: override delays for two-phase lateral reveal
  const aboutSection = document.querySelector('.about');
  if (aboutSection) {
    aboutSection.querySelectorAll('.reveal--left').forEach(el => {
      el.style.setProperty('--reveal-delay', '0ms');
    });
    aboutSection.querySelectorAll('.reveal--right').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', (500 + i * 60) + 'ms');
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}());

// Badges de estado — coreografía en cadena, se dispara una vez al entrar en viewport
(function () {
  const containers = document.querySelectorAll('.cs-badges');
  if (!containers.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    containers.forEach(el => el.classList.add('cs-badges--play'));
    return;
  }

  // Red de seguridad: al terminar la animación de cada badge, fija su estado
  // final de forma permanente (visible y quieto), pase lo que pase con el fill-mode.
  containers.forEach(el => {
    el.querySelectorAll('.cs-badge').forEach(badge => {
      badge.addEventListener('animationend', () => {
        badge.classList.add('is-settled');
      });
    });
  });

  const badgeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('cs-badges--play');
      badgeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  containers.forEach(el => badgeObserver.observe(el));
}());

// Fila de tabla real — fase 1 (aparición por columnas) + fase 2 (mutación cíclica de "Pendiente de")
(function () {
  const wraps = document.querySelectorAll('.cs-pr-wrap');
  if (!wraps.length) return;

  const VALUES = ['Julia B.', 'María G.', 'Cliente', 'Carlos R.'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function startCycle(wrap) {
    const pendingText = wrap.querySelector('.cs-pr-pending__text');

    if (reduceMotion) {
      pendingText.textContent = VALUES[0];
      return;
    }

    // Fase 1: columnas aparecen en secuencia (fade + slide sobrio, sin rebote)
    const fadeParts = wrap.querySelectorAll('.cs-pr-fade');
    fadeParts.forEach(part => {
      part.classList.add('cs-pr-fade--in');
      part.addEventListener('animationend', () => part.classList.add('is-settled'), { once: true });
    });

    const GROW_MS = 90;
    const SHRINK_MS = 110;
    const ENTER_MS = 380;
    const PAUSE_MS = 1600;
    const PHASE1_TOTAL_MS = 450 + 400; // último delay (pending) + su duración

    let i = 0;
    function loop() {
      pendingText.classList.remove('cs-enter');
      void pendingText.offsetWidth; // fuerza reflow para reiniciar la animación
      pendingText.classList.add('cs-grow');

      setTimeout(() => {
        pendingText.classList.remove('cs-grow');
        void pendingText.offsetWidth;
        pendingText.classList.add('cs-shrink');

        setTimeout(() => {
          pendingText.classList.remove('cs-shrink');
          i = (i + 1) % VALUES.length;
          pendingText.textContent = VALUES[i];
          void pendingText.offsetWidth;
          pendingText.classList.add('cs-enter');

          setTimeout(loop, ENTER_MS + PAUSE_MS);
        }, SHRINK_MS);
      }, GROW_MS);
    }

    setTimeout(loop, PHASE1_TOTAL_MS);
  }

  const rowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      startCycle(entry.target);
      rowObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  wraps.forEach(el => rowObserver.observe(el));
}());

// Línea de metro de Discovery — línea se dibuja, nodos aparecen, y se acentúan los dos verdes
(function () {
  const metros = document.querySelectorAll('.cs-metro');
  if (!metros.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  metros.forEach(metro => {
    const track = metro.querySelector('.cs-metro__track');
    const parts = track.querySelectorAll('.cs-metro__connector, .cs-metro__node');
    parts.forEach((el, i) => {
      el.style.transitionDelay = (i * 90) + 'ms';
    });

    // Posiciona la etiqueta de competencia centrada sobre los dos nodos verdes.
    // Usa offsetLeft/offsetWidth (ignoran el transform) para que el cálculo sea
    // correcto incluso antes de que la animación de entrada haya terminado.
    const accentNodes = track.querySelectorAll('.cs-metro__node--accent');
    const competitors = metro.querySelector('.cs-metro__competitors');
    const first = accentNodes[0];
    const last = accentNodes[accentNodes.length - 1];
    competitors.style.left = first.offsetLeft + 'px';
    competitors.style.width = (last.offsetLeft + last.offsetWidth - first.offsetLeft) + 'px';

    if (reduceMotion) {
      metro.classList.add('cs-metro--play', 'cs-metro--accent-play', 'cs-metro--label-play');
      return;
    }

    const metroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        metro.classList.add('cs-metro--play');
        const ACCENT_DELAY = parts.length * 90 + 500;
        setTimeout(() => metro.classList.add('cs-metro--accent-play'), ACCENT_DELAY);
        setTimeout(() => metro.classList.add('cs-metro--label-play'), ACCENT_DELAY + 400 + 300);
        metroObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    metroObserver.observe(metro);
  });
}());

// Donuts de Discovery — cada uno se dibuja al entrar en viewport, en su propio momento
(function () {
  const donuts = document.querySelectorAll('.cs-donut__value');
  if (!donuts.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    donuts.forEach(el => {
      el.style.transition = 'none';
      el.style.strokeDashoffset = el.dataset.targetOffset;
    });
    return;
  }

  const donutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.strokeDashoffset = entry.target.dataset.targetOffset;
      donutObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  donuts.forEach(el => donutObserver.observe(el));
}());

// Fórmula de Discovery — factores encadenados + contador del resultado
(function () {
  const formulas = document.querySelectorAll('.cs-formula');
  if (!formulas.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatEs(n) {
    return Math.round(n).toLocaleString('es-ES', { useGrouping: true });
  }

  function animateCounter(el, target, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatEs(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  formulas.forEach(formula => {
    const counter = formula.querySelector('.cs-formula__counter');
    const target = parseInt(counter.dataset.target, 10);

    if (reduceMotion) {
      formula.classList.add('cs-formula--play');
      counter.textContent = formatEs(target);
      return;
    }

    const formulaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('cs-formula--play');
        setTimeout(() => animateCounter(counter, target, 1200), 960);
        formulaObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    formulaObserver.observe(formula);
  });
}());

// Card de bloqueo de Diseño — la card aparece sin el motivo, el motivo surge con
// rebote, destella una vez y todo queda fijo. Se dispara una sola vez.
(function () {
  const cards = document.querySelectorAll('.cs-blockcard');
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach(card => {
    const reason = card.querySelector('.cs-blockcard__reason');

    if (reduceMotion) {
      card.classList.add('is-settled');
      reason.classList.add('is-settled');
      return;
    }

    function playSequence() {
      // Fase 1: la card aparece con fade + slide suave (el motivo queda en blanco)
      card.classList.add('cs-blockcard--visible');
      card.addEventListener('animationend', () => card.classList.add('is-settled'), { once: true });

      const CARD_DURATION = 450;
      const PAUSE = 2000; // hueco vacío visible unos segundos antes de que surja el motivo

      // Fase 2: el motivo surge de la nada con rebote y destello en un único gesto,
      // y queda fijo para siempre (una sola animación: crecer + destellar + asentar).
      setTimeout(() => {
        reason.classList.add('cs-blockcard__reason--reveal');
        reason.addEventListener('animationend', () => reason.classList.add('is-settled'), { once: true });
      }, CARD_DURATION + PAUSE);
    }

    const blockObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        playSequence();
        blockObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    blockObserver.observe(card);
  });
}());
