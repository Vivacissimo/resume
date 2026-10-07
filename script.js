const indicatorLinks = [...document.querySelectorAll('.indicator-link')];
const sections = indicatorLinks
  .map((link) => ({
    link,
    section: document.getElementById(link.dataset.section),
  }))
  .filter((item) => item.section);

function updateIndicator() {
  const marker = window.scrollY + window.innerHeight * 0.38;
  const atBottom =
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  let current = sections[0];

  sections.forEach((item) => {
    if (item.section.offsetTop <= marker) {
      current = item;
    }
  });

  // The last section can be too short to reach the marker; activate it at the bottom.
  if (atBottom) current = sections[sections.length - 1];

  indicatorLinks.forEach((link) => {
    link.classList.toggle('is-active', link === current?.link);
  });
}

window.addEventListener('scroll', updateIndicator, { passive: true });
window.addEventListener('resize', updateIndicator);
window.addEventListener('load', updateIndicator);

updateIndicator();
