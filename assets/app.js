(function () {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress-line');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-links');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactQuery = window.matchMedia('(max-width: 800px)');
  let lenis = null;

  /* Header e barra de progresso */
  const updateScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      const total = root.scrollHeight - window.innerHeight;
      progress.style.setProperty('--scroll-progress', `${total > 0 ? (y / total) * 100 : 0}%`);
    }
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  /* Smooth scroll (desativado com prefers-reduced-motion) */
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      autoRaf: true,
      anchors: { offset: -(header ? header.offsetHeight + 16 : 0) },
      lerp: 0.1,
      smoothWheel: true,
      prevent: node => Boolean(node?.closest?.('dialog[open], [data-lenis-prevent], .nav-links.is-open'))
    });
    lenis.on('scroll', updateScroll);
  }

  /* Menu mobile: aria, Esc, clique fora e trava de rolagem */
  const setMenu = open => {
    if (!toggle || !menu) return;
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) menu.querySelector('a')?.focus();
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener('click', event => {
      if (menu.classList.contains('is-open') && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    compactQuery.addEventListener?.('change', () => setMenu(false));
  }

  /* Revelação no scroll */
  const revealGroups = [
    ['.trust-grid > *, .service-row, .quote, .step, .timeline-item, .case-card, .area, .principle, .contact-details > div, .footer-grid > div', 'reveal-up', 65],
    ['.split > :first-child, .case-copy, .closing-grid > :first-child', 'reveal-left', 0],
    ['.split > :last-child, .closing-grid > :last-child', 'reveal-right', 0],
    ['.case-image, .story-visual, .person-image, .map', 'reveal-image', 80],
    ['.filters', 'reveal-scale', 90]
  ];
  revealGroups.forEach(([selector, variant, delay]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (!element.hasAttribute('data-reveal')) element.setAttribute('data-reveal', '');
      element.classList.add(variant);
      element.style.transitionDelay = `${Math.min(index, 6) * delay}ms`;
    });
  });
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(item => observer.observe(item));
  }

  /* Filtro de casos com contagem anunciada */
  const filterButtons = document.querySelectorAll('[data-filter]');
  const filterCount = document.querySelector('[data-filter-count]');
  const cards = document.querySelectorAll('.case-card');
  const applyFilter = filter => {
    let visible = 0;
    cards.forEach(card => {
      const show = filter === 'todos' || card.dataset.area === filter;
      card.hidden = !show;
      if (show) { visible += 1; card.classList.add('is-visible'); }
    });
    if (filterCount) filterCount.textContent = `${visible} ${visible === 1 ? 'caso exibido' : 'casos exibidos'}`;
  };
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    applyFilter(button.dataset.filter);
  }));

  /* Modal de casos */
  const dialog = document.querySelector('#case-dialog');
  const details = {
    empresarial: { title: 'Reorganização contratual para empresa familiar', area: 'Direito Empresarial', challenge: 'A empresa enfrentava contratos heterogêneos e decisões societárias sem um fluxo claro de aprovação.', strategy: 'Mapeamento de riscos, revisão por prioridade e criação de uma matriz de decisões com linguagem acessível à gestão.', outcome: 'Acompanhamento mais previsível das relações contratuais e governança documental fortalecida.' },
    imobiliario: { title: 'Estruturação preventiva de aquisição imobiliária', area: 'Direito Imobiliário', challenge: 'Um negócio de aquisição reunia documentos de diferentes períodos e exigia leitura cuidadosa de riscos.', strategy: 'Due diligence documental, alinhamento entre as partes e registro das condicionantes da operação.', outcome: 'Tomada de decisão com informações organizadas e pontos de atenção definidos antes da contratação.' },
    familia: { title: 'Organização patrimonial e sucessória', area: 'Família e Sucessões', challenge: 'Uma família buscava organizar decisões patrimoniais preservando diálogo e confidencialidade.', strategy: 'Escuta individual, cenário patrimonial e definição de alternativas jurídicas adequadas ao contexto.', outcome: 'Diretrizes registradas para a continuidade do planejamento familiar.' },
    trabalhista: { title: 'Revisão de práticas de gestão de pessoas', area: 'Direito Trabalhista', challenge: 'Crescimento rápido trouxe dúvidas sobre rotinas internas e documentos de trabalho.', strategy: 'Diagnóstico prático, atualização de instrumentos e orientação à liderança.', outcome: 'Rotinas mais claras e critérios consistentes para decisões recorrentes.' }
  };
  if (dialog) {
    const fill = (key, value) => { const el = dialog.querySelector(`[data-dialog-${key}]`); if (el) el.textContent = value; };
    document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
      const d = details[button.dataset.case];
      if (!d) return;
      fill('title', d.title); fill('area', d.area); fill('challenge', d.challenge); fill('strategy', d.strategy); fill('outcome', d.outcome);
      dialog.showModal();
      lenis?.stop();
      dialog.querySelector('.dialog-close')?.focus();
    }));
    dialog.querySelectorAll('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => lenis?.start());
  }

  /* Barra de contato mobile: escondida enquanto o hero (com seus CTAs) está visível */
  const contactBar = document.querySelector('.mobile-contact-bar');
  if (contactBar) {
    const setBar = visible => {
      contactBar.classList.toggle('is-hidden', !visible);
      document.body.classList.toggle('has-mobile-contact-bar', visible);
    };
    const heroSection = document.querySelector('.hero');
    if (heroSection && 'IntersectionObserver' in window) {
      setBar(false);
      new IntersectionObserver(([entry]) => setBar(!entry.isIntersecting), { threshold: 0.01 }).observe(heroSection);
    } else {
      setBar(true);
    }
  }

  /* Formulário: máscara de telefone e validação inline */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.noValidate = true; // validação nativa permanece como fallback sem JS
    const phone = form.querySelector('#telefone');
    const areaSelect = form.querySelector('#area');
    const requestedArea = new URLSearchParams(window.location.search).get('area');
    if (areaSelect && requestedArea) {
      const option = [...areaSelect.options].find(opt => opt.text === requestedArea);
      if (option) option.selected = true;
    }
    phone?.addEventListener('input', () => {
      const digits = phone.value.replace(/\D/g, '').slice(0, 11);
      let masked = digits;
      if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
      phone.value = masked;
    });

    const messages = {
      nome: 'Informe seu nome.',
      telefone: 'Informe um WhatsApp com DDD, ex.: (11) 91234-5678.',
      email: 'Informe um e-mail válido, ex.: nome@empresa.com.br.',
      area: 'Selecione a área de interesse.'
    };
    const validate = field => {
      const error = form.querySelector(`#${field.id}-erro`);
      let valid = field.checkValidity();
      if (valid && field === phone && field.value) valid = field.value.replace(/\D/g, '').length >= 10;
      field.setAttribute('aria-invalid', String(!valid));
      if (error) error.textContent = valid ? '' : (messages[field.name] || 'Verifique este campo.');
      return valid;
    };
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      field.addEventListener('blur', () => { if (field.value || field.getAttribute('aria-invalid')) validate(field); });
      field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); });
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      const invalid = [...fields].filter(field => !validate(field));
      if (invalid.length) {
        status.classList.add('is-error');
        status.textContent = invalid.length === 1 ? 'Há 1 campo a corrigir.' : `Há ${invalid.length} campos a corrigir.`;
        invalid[0].focus();
        return;
      }
      // TODO: integrar com o serviço de envio (backend, Formspree, Resend etc.).
      const submit = form.querySelector('[type="submit"]');
      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Enviando…';
      status.classList.remove('is-error');
      status.textContent = '';
      setTimeout(() => {
        status.textContent = 'Solicitação recebida. Retornaremos pelo WhatsApp informado em horário comercial.';
        submit.disabled = false;
        submit.textContent = label;
        form.reset();
        fields.forEach(field => field.removeAttribute('aria-invalid'));
      }, 700);
    });
  }
})();
