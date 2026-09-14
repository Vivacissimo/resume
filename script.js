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

function loadProjectCardStyles() {
  if (document.querySelector('link[data-project-card-styles]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './project-links.css';
  link.dataset.projectCardStyles = 'true';
  document.head.appendChild(link);
}

function addMoongCheapProject() {
  const groups = [...document.querySelectorAll('.project-group')];
  const ktCloudGroup = groups.find((group) =>
    group.querySelector('.project-group-title h3')?.textContent.trim() === 'KT Cloud'
  );

  if (!ktCloudGroup) return;

  const content = ktCloudGroup.querySelector('.project-group-content');
  if (!content || content.querySelector('[data-project-key="moongcheap"]')) return;

  const article = document.createElement('article');
  article.className = 'project-item project-subgroup';
  article.dataset.projectKey = 'moongcheap';
  article.innerHTML = `
    <p class="project-type">INTEGRATED PROJECT / CLOUD DEVOPS</p>
    <h4>MoongCheap · Cloud Native Platform</h4>
    <p class="project-description">
      Frontend / Backend / AI 서비스를 AWS EKS에 일관되게 배포하기 위해
      CI, Helm, GitOps, ArgoCD를 연결한 통합 프로젝트.
    </p>
    <ul>
      <li>Jenkins → ECR → GitOps → ArgoCD → EKS 배포 흐름 설계</li>
      <li>공통 Helm Chart와 dev / prod 환경별 Values 구조 구성</li>
      <li>ApplicationSet 기반 서비스·환경 배포 패턴 구성</li>
    </ul>
    <p class="project-tech">AWS · EKS · ECR · Kubernetes · Helm · ArgoCD · Jenkins · Terraform</p>
  `;

  content.prepend(article);
}

const projectRoutes = new Map([
  ['MoongCheap · Cloud Native Platform', './projects/moongcheap.html'],
  ['Kubernetes · CI/CD · GitOps Infrastructure', './projects/cloud-native.html'],
  ['Real-time Content & Previs R&D', './projects/cocoavision.html#realtime'],
  ['Tractor Job Submission', './projects/cocoavision.html#tractor'],
  ['PXE Infrastructure Setting', './projects/cocoavision.html#pxe'],
  ['Render Farm Automation with Ansible', './projects/cocoavision.html#ansible'],
  ['junu.dev Home Infrastructure', './projects/personal-infra.html#home-infra'],
  ['Personal Dev Tools', './projects/personal-infra.html#dev-tools'],
]);

function makeProjectCardsClickable() {
  document.querySelectorAll('.project-item').forEach((card) => {
    const title = card.querySelector('h4')?.textContent.trim();
    const href = projectRoutes.get(title);
    if (!href || card.dataset.detailReady === 'true') return;

    card.dataset.detailReady = 'true';
    card.classList.add('project-clickable');
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `${title} 상세 프로젝트 보기`);

    const detailLink = document.createElement('a');
    detailLink.className = 'project-detail-link';
    detailLink.href = href;
    detailLink.textContent = 'View Project Detail →';
    card.appendChild(detailLink);

    card.addEventListener('click', (event) => {
      if (event.target.closest('a')) return;
      window.location.href = href;
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = href;
      }
    });
  });
}

function setupProjects() {
  loadProjectCardStyles();
  addMoongCheapProject();
  makeProjectCardsClickable();
}

window.addEventListener('scroll', updateIndicator, { passive: true });
window.addEventListener('resize', updateIndicator);
window.addEventListener('load', updateIndicator);
window.addEventListener('DOMContentLoaded', setupProjects);

updateIndicator();
if (document.readyState !== 'loading') setupProjects();
