// Prevent placeholder links from scrolling to top
document.querySelectorAll('.js-noop').forEach(el => {
  el.addEventListener('click', e => e.preventDefault());
});

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

// Reveal on scroll — stagger via CSS custom property --reveal-delay
(function () {
  const sections = document.querySelectorAll('.projects, .about, .contact');
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
