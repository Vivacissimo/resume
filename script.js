const indicatorLinks = [...document.querySelectorAll('.indicator-link')];
const sections = indicatorLinks
  .map((link) => ({
    link,
    section: document.getElementById(link.dataset.section),
  }))
  .filter((item) => item.section);

function updateIndicator() {
  const marker = window.scrollY + window.innerHeight * 0.38;
  let current = sections[0];

  sections.forEach((item) => {
    if (item.section.offsetTop <= marker) {
      current = item;
    }
  });

  indicatorLinks.forEach((link) => {
    link.classList.toggle('is-active', link === current?.link);
  });
}

window.addEventListener('scroll', updateIndicator, { passive: true });
window.addEventListener('resize', updateIndicator);
window.addEventListener('load', updateIndicator);
updateIndicator();
