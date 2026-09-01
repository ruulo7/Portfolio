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

// Journey de puntos de dolor (Orris) — mismo patrón que la línea de metro de
// Flowck: los pasos entran uno a uno troquelados en gris, y los acentuados
// pasan a línea continua y verde una vez han entrado.
(function () {
  const journeys = document.querySelectorAll('.cs-journey');
  if (!journeys.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  journeys.forEach(journey => {
    const steps = journey.querySelectorAll('.cs-journey__step');
    steps.forEach((el, i) => {
      el.style.transitionDelay = (i * 90) + 'ms';
    });

    if (reduceMotion) {
      journey.classList.add('cs-journey--play', 'cs-journey--accent-play');
      return;
    }

    const journeyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        journey.classList.add('cs-journey--play');
        const ACCENT_DELAY = steps.length * 90 + 500;
        setTimeout(() => journey.classList.add('cs-journey--accent-play'), ACCENT_DELAY);
        journeyObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    journeyObserver.observe(journey);
  });
}());

// Diagramas de flujo (UX Design, Orris) — entrada en dos tiempos: primero todo
// el andamiaje gris, y 2s después las ramas acentuadas en verde.
(function () {
  const flows = document.querySelectorAll('.cs-flow');
  if (!flows.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    flows.forEach(el => el.classList.add('cs-flow--play', 'cs-flow--accent-play'));
    return;
  }

  flows.forEach(flow => {
    const flowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        flow.classList.add('cs-flow--play');
        setTimeout(() => flow.classList.add('cs-flow--accent-play'), 2000);
        flowObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    flowObserver.observe(flow);
  });
}());

// Diagrama de estructura (UX Design, Orris) — "Producto" aparece primero, y
// los cuatro nodos acentuados entran encadenados uno a uno con su línea.
(function () {
  const arches = document.querySelectorAll('.cs-arch');
  if (!arches.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  arches.forEach(arch => {
    const nodes = arch.querySelectorAll('.cs-arch__node');
    nodes.forEach((el, i) => {
      el.style.transitionDelay = (i * 250) + 'ms';
    });

    if (reduceMotion) {
      arch.classList.add('cs-arch--play', 'cs-arch--nodes-play');
      return;
    }

    const archObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        arch.classList.add('cs-arch--play');
        setTimeout(() => arch.classList.add('cs-arch--nodes-play'), 500);
        archObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    archObserver.observe(arch);
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

// Detalle de pieza de Diseño — la imagen entra desde la izquierda y, un beat
// después, el copy entra desde la derecha. Se dispara una sola vez.
(function () {
  const demos = document.querySelectorAll('.cs-detail-demo');
  if (!demos.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  demos.forEach(demo => {
    if (reduceMotion) {
      demo.classList.add('cs-detail-demo--img-play', 'cs-detail-demo--copy-play');
      return;
    }

    const detailObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        demo.classList.add('cs-detail-demo--img-play');
        setTimeout(() => demo.classList.add('cs-detail-demo--copy-play'), 1000);
        detailObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    detailObserver.observe(demo);
  });
}());

// Sidebar de comentarios de Diseño — aparece el cuadro (solo título) y un
// segundo después llegan los comentarios uno a uno. Se dispara una sola vez
// al entrar en viewport.
(function () {
  const wraps = document.querySelectorAll('.cs-comments-demo-wrap');
  if (!wraps.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    wraps.forEach(el => {
      el.classList.add('cs-comments-demo-wrap--in');
      el.querySelector('.cs-comments-demo').classList.add('cs-comments-demo--items-play');
    });
    return;
  }

  wraps.forEach(wrap => {
    const comments = wrap.querySelector('.cs-comments-demo');
    const items = comments.querySelectorAll('.cs-comment-item');

    const WRAP_REVEAL_DURATION = 500;
    const PAUSE_BEFORE_ITEMS = 1000;
    const ITEM_STAGGER = 450;

    items.forEach((item, i) => {
      item.style.transitionDelay = (i * ITEM_STAGGER) + 'ms';
    });

    function playSequence() {
      // Fase 1: aparece el cuadro (solo título)
      wrap.classList.add('cs-comments-demo-wrap--in');

      // Fase 2: los comentarios llegan uno a uno y quedan estáticos
      setTimeout(() => {
        comments.classList.add('cs-comments-demo--items-play');
      }, WRAP_REVEAL_DURATION + PAUSE_BEFORE_ITEMS);
    }

    const commentsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        playSequence();
        commentsObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    commentsObserver.observe(wrap);
  });
}());

// Pantallazo final de Result — fade + rise sobrio, sin rebote. Una sola vez.
(function () {
  const shots = document.querySelectorAll('.cs-result-shot');
  if (!shots.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    shots.forEach(el => el.classList.add('cs-result-shot--in'));
    return;
  }

  const shotObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('cs-result-shot--in');
      shotObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  shots.forEach(el => shotObserver.observe(el));
}());

// Diagrama de herramientas de Build — las cards crecen desde la nada con
// rebote, en orden (01 → 02 → 03), 0.5s de diferencia entre cada una. Una
// sola vez al entrar en viewport.
(function () {
  const diagrams = document.querySelectorAll('.cs-tools-diagram');
  if (!diagrams.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    diagrams.forEach(el => {
      el.querySelectorAll('.cs-tools-phase').forEach(phase => {
        phase.style.opacity = '1';
        phase.style.transform = 'none';
      });
    });
    return;
  }

  const PHASE_STAGGER = 500;

  diagrams.forEach(diagram => {
    const phases = diagram.querySelectorAll('.cs-tools-phase');
    phases.forEach((phase, i) => {
      phase.style.animationDelay = (i * PHASE_STAGGER) + 'ms';
    });

    const diagramObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        phases.forEach(phase => {
          phase.classList.add('cs-tools-phase--grow');
          phase.addEventListener('animationend', () => phase.classList.add('is-settled'), { once: true });
        });
        diagramObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    diagramObserver.observe(diagram);
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

// Rediseño de la Home (UI Design) — Home 1 crece, la flecha y Home 2 aparecen
// en cadena; se dispara una sola vez al entrar en scroll y queda fija.
(function () {
  const blocks = document.querySelectorAll('.cs-redesign');
  if (!blocks.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    blocks.forEach(el => {
      el.querySelectorAll('.cs-redesign__img, .cs-redesign__arrow').forEach(part => {
        part.style.opacity = '1';
        part.style.transform = 'none';
      });
    });
    return;
  }

  blocks.forEach(block => {
    const parts = block.querySelectorAll('.cs-redesign__img, .cs-redesign__arrow');

    const redesignObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        block.classList.add('cs-redesign--play');
        parts.forEach(part => {
          part.addEventListener('animationend', () => part.classList.add('is-settled'), { once: true });
        });
        redesignObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    redesignObserver.observe(block);
  });
}());

// Pantallas finales (UI Design) — las tres capturas entran encadenadas de
// izquierda a derecha; se dispara una sola vez al entrar en scroll y queda fija.
(function () {
  const blocks = document.querySelectorAll('.cs-screens');
  if (!blocks.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    blocks.forEach(el => {
      el.querySelectorAll('.cs-screens__img, .cs-screens__label').forEach(part => {
        part.style.opacity = '1';
        part.style.transform = 'none';
      });
    });
    return;
  }

  blocks.forEach(block => {
    const parts = block.querySelectorAll('.cs-screens__img, .cs-screens__label');

    const screensObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        block.classList.add('cs-screens--play');
        parts.forEach(part => {
          part.addEventListener('animationend', () => part.classList.add('is-settled'), { once: true });
        });
        screensObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    screensObserver.observe(block);
  });
}());


// Funnel de conversión — Hero Home
(function () {
  const hero = document.querySelector('#hero');
  const svg  = hero ? hero.querySelector('.funnel') : null;
  if (!svg) return;

  const eyebrow = hero.querySelector('.eyebrow');
  const title   = hero.querySelector('.hero__title');
  const sub     = hero.querySelector('.hero__sub');
  const actions = hero.querySelector('.hero__actions');
  if (!eyebrow || !title || !sub || !actions) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attr(el, a, v) { if (el) el.setAttribute(a, Math.round(v)); }

  function layout() {
    const hRect = hero.getBoundingClientRect();
    const W = hRect.width;
    const H = hRect.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const T = el => el.getBoundingClientRect().top    - hRect.top;
    const B = el => el.getBoundingClientRect().bottom - hRect.top;

    const PAD = 24;
    const yT  = T(eyebrow) - PAD;
    const yG1 = (B(eyebrow) + T(title))   / 2;
    const yG2 = (B(title)   + T(sub))     / 2;
    const yG3 = (B(sub)     + T(actions)) / 2;
    const yB  = B(actions)  + PAD;

    // Embudo: 84% ancho arriba → 32% ancho abajo, centrado
    const xLT = W * 0.08,  xRT = W * 0.92;
    const xLB = W * 0.34,  xRB = W * 0.66;

    const f  = y => (y - yT) / (yB - yT);
    const xL = y => xLT + f(y) * (xLB - xLT);
    const xR = y => xRT + f(y) * (xRB - xRT);

    const sL = svg.querySelector('.funnel__side--left');
    const sR = svg.querySelector('.funnel__side--right');
    const h1 = svg.querySelector('.funnel__h--1');
    const h2 = svg.querySelector('.funnel__h--2');
    const h3 = svg.querySelector('.funnel__h--3');

    attr(sL, 'x1', xLT);     attr(sL, 'y1', yT);   attr(sL, 'x2', xLB);     attr(sL, 'y2', yB);
    attr(sR, 'x1', xRT);     attr(sR, 'y1', yT);   attr(sR, 'x2', xRB);     attr(sR, 'y2', yB);
    attr(h1, 'x1', xL(yG1)); attr(h1, 'y1', yG1);  attr(h1, 'x2', xR(yG1)); attr(h1, 'y2', yG1);
    attr(h2, 'x1', xL(yG2)); attr(h2, 'y1', yG2);  attr(h2, 'x2', xR(yG2)); attr(h2, 'y2', yG2);
    attr(h3, 'x1', xL(yG3)); attr(h3, 'y1', yG3);  attr(h3, 'x2', xR(yG3)); attr(h3, 'y2', yG3);
  }

  const allLines = () => Array.from(svg.querySelectorAll('line'));

  requestAnimationFrame(() => {
    layout();

    if (reduced) return;

    // Ocultar líneas para animarlas progresivamente
    allLines().forEach(line => {
      const len = line.getTotalLength();
      line.style.strokeDasharray  = len;
      line.style.strokeDashoffset = len;
    });

    const BASE = 2200;
    const order = [
      ['.funnel__side--left',  BASE],
      ['.funnel__side--right', BASE],
      ['.funnel__h--1',        BASE + 450],
      ['.funnel__h--2',        BASE + 750],
      ['.funnel__h--3',        BASE + 1050],
    ];

    requestAnimationFrame(() => {
      order.forEach(([sel, delay]) => {
        const el = svg.querySelector(sel);
        if (!el) return;
        el.style.transition       = `stroke-dashoffset 1s ease-out ${delay}ms`;
        el.style.strokeDashoffset = '0';
      });
    });

    // Limpiar estilos de animación cuando todo haya terminado (evita problemas en resize)
    setTimeout(() => {
      allLines().forEach(line => {
        line.style.transition       = 'none';
        line.style.strokeDasharray  = '';
        line.style.strokeDashoffset = '';
      });
    }, BASE + 1050 + 1000 + 200);
  });

  window.addEventListener('resize', layout);
}());

// Sistema de votación (UI Design) — bucle de 11.9s que solo debe arrancar
// cuando el apartado entra en el viewport, nunca antes (si no, el usuario lo
// pilla ya empezado por un punto aleatorio al llegar por scroll).
(function () {
  const blocks = document.querySelectorAll('.cs-vote');
  if (!blocks.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  blocks.forEach(block => {
    const voteObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        block.classList.add('cs-vote--play');
        voteObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    voteObserver.observe(block);
  });
}());
