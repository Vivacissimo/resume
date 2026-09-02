const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1 }
);

reveals.forEach((element) => revealObserver.observe(element));

const pageSections = [...document.querySelectorAll('.page-section')];
const navigationLinks = [
  ...document.querySelectorAll('.nav a[data-section], .pager-link[data-section]'),
];

const setActiveSection = (sectionId) => {
  navigationLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.section === sectionId);
  });
};

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries.length > 0) {
      setActiveSection(visibleEntries[0].target.id);
    }
  },
  {
    rootMargin: '-28% 0px -52% 0px',
    threshold: [0, 0.15, 0.35, 0.6],
  }
);

pageSections.forEach((section) => sectionObserver.observe(section));

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => setActiveSection(link.dataset.section));
});
