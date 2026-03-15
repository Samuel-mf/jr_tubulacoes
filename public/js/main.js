/* =============================================
   RJ Tubulação de Gás — Frontend Logic
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  loadServices();
  loadGallery();
  loadConfig();
  initScrollReveal();
  initCounters();
  initQuoteForm();
  initLightbox();
  setCurrentYear();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// ── Icon mapping (Lucide SVG paths) ─────────
const ICONS = {
  flame: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  droplets: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 14.1c1.44 0 2.6-1.19 2.6-2.64 0-.76-.37-1.47-1.11-2.08S12.96 7.88 12.56 7c-.4.88-.97 1.7-1.49 2.38s-1.11 1.32-1.11 2.08c0 1.45 1.16 2.64 2.6 2.64z"/><path d="M17 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S17.29 6.75 17 5.3c-.29 1.45-1.14 2.84-2.29 3.76S13 11.1 13 12.25c0 2.22 1.8 4.05 4 4.05z"/></svg>`,
  wind: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
  factory: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>`,
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
};

// ── Navbar scroll behavior ──────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
}

// ── Mobile menu ─────────────────────────────
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');

  function closeMenu() {
    toggle.classList.remove('open');
    nav.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      toggle.classList.add('open');
      nav.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  overlay.addEventListener('click', closeMenu);

  // Close on nav link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

// ── Static fallback services data ───────────
const STATIC_SERVICES = [
  {
    title: 'Construção de Ponto de Gás',
    description: 'Instalação das tubulações principais, conectando a central de distribuição ao local de consumo, seguida pela conexão das redes externas aos pontos de consumo internos, como fogões, aquecedores e outros aparelhos a gás.',
    icon: 'wrench'
  },
  {
    title: 'Individualização de Gás',
    description: 'Serviço de individualização de medidores de gás em edifícios que utilizam uma tubulação coletiva. Com a individualização, cada apartamento passa a ter seu próprio medidor de consumo, permitindo um controle mais preciso e justo do uso de gás, além de aumentar a eficiência e segurança do sistema.',
    icon: 'flame'
  },
  {
    title: 'Instalação de Suporte de Ar Condicionado',
    description: 'A instalação de suporte para ar condicionado envolve a fixação de um suporte adequado à parede ou estrutura externa, projetado para sustentar a unidade externa do ar condicionado. O serviço inclui a montagem do suporte, o nivelamento e a verificação da segurança e estabilidade para garantir o funcionamento correto do equipamento.',
    icon: 'wind'
  },
  {
    title: 'Recomposição de Pastilhas em Fachadas',
    description: 'Reposição ou substituição de pastilhas danificadas ou soltas, restaurando a aparência e a integridade da fachada. O processo inclui a remoção das pastilhas deterioradas, preparação da superfície, aplicação de novas pastilhas e rejuntamento, garantindo um acabamento uniforme e duradouro.',
    icon: 'building'
  },
  {
    title: 'Prumada de Tubulação de Água e de Esgoto',
    description: 'Instalação de encanamentos verticais que percorrem externamente o edifício, atendendo todos os andares. Esse trabalho garante a distribuição eficiente de água e o correto escoamento de esgoto em todas as unidades do prédio.',
    icon: 'droplets'
  },
  {
    title: 'Instalação de Chaminé de Aquecedores',
    description: 'Instalação e manutenção de chaminés de aquecedores incluem a montagem do sistema de exaustão para direcionar os gases para fora do ambiente e a verificação periódica para garantir o funcionamento seguro e eficiente, prevenindo problemas como obstruções e vazamentos.',
    icon: 'factory'
  }
];

// ── Render service cards ────────────────────
function renderServiceCards(services) {
  const grid = document.getElementById('servicesGrid');

  grid.innerHTML = services.map((s, i) => `
    <div class="service-card reveal" style="transition-delay: ${i * 0.1}s">
      <div class="service-icon">
        ${ICONS[s.icon] || ICONS.wrench}
      </div>
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.description)}</p>
      <a href="#contact" class="service-link" onclick="document.getElementById('service').value='${escapeHtml(s.title)}'">
        Solicitar Orçamento →
      </a>
    </div>
  `).join('');

  initScrollReveal();
}

// ── Load services from API (fallback to static) ─
async function loadServices() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('API error');
    const services = await res.json();

    if (services.length > 0) {
      renderServiceCards(services);
      return;
    }
  } catch (err) {
    console.log('API indisponível, usando serviços estáticos.');
  }

  // Fallback: render static service data
  renderServiceCards(STATIC_SERVICES);
}

// ── Static fallback gallery data ────────────
const STATIC_GALLERY = [
  { image_path: '/images/gallery/caixa de registro de gás.png', caption: 'Instalação Profissional de Caixa de Registro de Gás' },
  { image_path: '/images/gallery/central de registros de gas 2.png', caption: 'Montagem de Central de Medição e Distribuição de Gás' },
  { image_path: '/images/gallery/central de registros de gas.png', caption: 'Implementação de Central de Gás Multicilindros' },
  { image_path: '/images/gallery/centro de distribuicao de gas.png', caption: 'Sistema Completo de Distribuição e Controle de Gás' },
  { image_path: '/images/gallery/fachada com colunas de gas.png', caption: 'Projeto Executivo de Tubulação de Gás em Fachada' },
  { image_path: '/images/gallery/instalacao de rede de gas.png', caption: 'Instalação Segura e Normatizada de Rede de Gás' },
  { image_path: '/images/gallery/rede de gas em fachada.png', caption: 'Adequação de Rede de Gás Externa em Altura' },
  { image_path: '/images/gallery/registro de gas fogao.png', caption: 'Ponto de Gás Individual Focado em Segurança Residencial' },
  { image_path: '/images/gallery/trabalhador em fachada.png', caption: 'Trabalho em Cadeira Suspensa com Máxima Segurança' },
  { image_path: '/images/gallery/trabalhador fachada alta 2.png', caption: 'Execução de Serviços Especiais em Área de Risco' },
  { image_path: '/images/gallery/trabalhador fachada alta.png', caption: 'Trabalho em Altura Seguindo Normas NR-35 e NR-18' }
];

// ── Render gallery items ────────────────────
function renderGalleryItems(images) {
  const wrapper = document.getElementById('galleryGrid');

  if (images.length === 0) {
    wrapper.innerHTML = `
      <div class="gallery-empty swiper-slide">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        <p>Em breve, fotos dos nossos projetos serão adicionadas aqui.</p>
      </div>
    `;
    return;
  }

  wrapper.innerHTML = images.map((img, i) => `
    <div class="gallery-item swiper-slide" onclick="openLightbox('${img.image_path}')">
      <img src="${img.image_path}" alt="${escapeHtml(img.caption || 'Projeto JR Tubulação')}" loading="lazy" />
      ${img.caption ? `<div class="caption">${escapeHtml(img.caption)}</div>` : ''}
    </div>
  `).join('');

  // Initialize Swiper
  new Swiper('#gallerySwiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 24 },
      1024: { slidesPerView: 3, spaceBetween: 32 },
      1280: { slidesPerView: 4, spaceBetween: 32 }
    }
  });

  initScrollReveal();
}

// ── Load gallery from API (fallback to static) ──
async function loadGallery() {
  try {
    const res = await fetch('/api/gallery');
    if (!res.ok) throw new Error('API error');
    const images = await res.json();

    if (images.length > 0) {
      renderGalleryItems(images);
      return;
    }
  } catch (err) {
    console.log('API de galeria indisponível, usando imagens estáticas.');
  }

  // Fallback: render static gallery data
  renderGalleryItems(STATIC_GALLERY);
}

// ── Load config (WhatsApp number) ───────────
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    const whatsappNum = config.whatsapp || '5519998038607';
    const whatsappMsg = encodeURIComponent('Olá! Vi o site da JR Tubulação e gostaria de solicitar um orçamento.');
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNum}&text=${whatsappMsg}`;

    const whatsappFab = document.getElementById('whatsappFab');
    const socialWhatsApp = document.getElementById('socialWhatsApp');

    whatsappFab.href = whatsappUrl;
    if (socialWhatsApp) {
      socialWhatsApp.href = whatsappUrl;
    }
  } catch (err) {
    console.log('Config API indisponível, usando links padrão.');
  }
}

// ── Scroll Reveal (IntersectionObserver) ────
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => {
    if (!el.classList.contains('visible')) {
      observer.observe(el);
    }
  });
}

// ── Counter animation ───────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el, target) {
  const duration = 2000;
  const startTime = performance.now();
  const suffix = el.textContent.includes('%') ? '%' : '+';

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    
    el.textContent = current + (progress >= 1 ? suffix : '');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ── Quote Form ──────────────────────────────
function initQuoteForm() {
  const form = document.getElementById('quoteForm');
  const message = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate
    if (!data.name || !data.phone) {
      showFormMessage('Por favor, preencha nome e telefone.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Enviando...
    `;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        showFormMessage('✓ ' + result.message, 'success');
        form.reset();
      } else {
        showFormMessage(result.error || 'Erro ao enviar. Tente novamente.', 'error');
      }
    } catch (err) {
      showFormMessage('Erro de conexão. Tente novamente ou entre em contato por WhatsApp.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Enviar Orçamento
      `;
    }
  });
}

function showFormMessage(text, type) {
  const msg = document.getElementById('formMessage');
  msg.textContent = text;
  msg.className = 'form-message ' + type;
  
  setTimeout(() => {
    msg.className = 'form-message';
  }, 6000);
}

// ── Lightbox ────────────────────────────────
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightboxClose');

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function openLightbox(src) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  img.src = src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// ── Utilities ───────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Spin animation for loading ──────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);
