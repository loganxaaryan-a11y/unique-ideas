(() => {
  'use strict';
  const pieces = JSON.parse(document.getElementById('piece-data').textContent);
  const cards = [...document.querySelectorAll('.card')];
  const tabs = [...document.querySelectorAll('.work-tab')];
  const filters = [...document.querySelectorAll('.filter')];
  const search = document.getElementById('piece-search');
  const more = document.getElementById('load-more');
  const status = document.getElementById('gallery-status');
  let kind = 'finished', category = 'all', limit = 9, matching = [];

  function updateGallery() {
    const query = search.value.trim().toLocaleLowerCase();
    matching = cards.filter((card, index) => {
      const piece = pieces[index];
      return card.dataset.kind === kind &&
        (category === 'all' || piece.category === category) &&
        (!query || `${piece.title} ${piece.description} ${piece.category}`.toLocaleLowerCase().includes(query));
    });
    const shown = new Set(matching.slice(0, limit));
    cards.forEach(card => { card.hidden = !shown.has(card); });
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.kind === kind)));
    filters.forEach(filter => {
      filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
    });
    status.textContent = `${Math.min(limit, matching.length)} of ${matching.length} ${kind === 'finished' ? 'finished creations' : 'design ideas'}${query || category !== 'all' ? ' matching your filters' : ''}`;
    document.getElementById('concept-note').hidden = kind !== 'concept';
    document.getElementById('empty-gallery').hidden = matching.length !== 0;
    more.hidden = matching.length <= limit;
    more.textContent = `View ${Math.min(9, matching.length - limit)} more creations`;
  }
  tabs.forEach(tab => tab.addEventListener('click', () => {
    kind = tab.dataset.kind; category = 'all'; search.value = ''; limit = 9; updateGallery();
  }));
  filters.forEach(filter => filter.addEventListener('click', () => {
    category = filter.dataset.filter; limit = 9; updateGallery();
  }));
  search.addEventListener('input', () => { limit = 9; updateGallery(); });
  document.getElementById('reset-filters').addEventListener('click', () => {
    category = 'all'; search.value = ''; limit = 9; updateGallery(); search.focus();
  });
  more.addEventListener('click', () => {
    const previousLimit = limit; limit += 9; updateGallery();
    matching[previousLimit]?.querySelector('[data-view]').focus({preventScroll:true});
  });
  updateGallery();

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); }
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded',String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });

  const dialog = document.getElementById('piece-dialog');
  const inspiration = document.getElementById('inspiration');
  const preview = document.getElementById('enquiry-preview');
  let current = 0, dialogPieces = [], previousOverflow = '';
  function selectPiece(index) {
    const piece = pieces[index];
    inspiration.value = piece.title + (piece.concept ? ' (design concept)' : '');
    preview.hidden = true;
    if (dialog.open) dialog.close();
    document.getElementById('enquire').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    inspiration.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => selectPiece(Number(button.dataset.select))));
  function renderPiece() {
    const piece = pieces[dialogPieces[current]];
    const photo = document.getElementById('piece-photo');
    photo.src = piece.src; photo.alt = piece.alt;
    document.getElementById('piece-title').textContent = piece.title;
    document.getElementById('piece-category').textContent = piece.category.replaceAll('-', ' ');
    document.getElementById('piece-description').textContent = piece.description;
    document.getElementById('piece-concept').hidden = !piece.concept;
    document.getElementById('use-piece').textContent = piece.concept ? 'Discuss this design idea ↗' : 'Personalise this piece ↗';
    document.getElementById('piece-count').textContent = `${current + 1} / ${dialogPieces.length}`;
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    dialogPieces = matching.map(card => Number(card.dataset.piece));
    current = dialogPieces.indexOf(Number(button.dataset.view));
    if (current < 0) return;
    renderPiece(); previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.showModal();
  }));
  function stepPiece(delta) { current = (current + delta + dialogPieces.length) % dialogPieces.length; renderPiece(); }
  document.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  document.getElementById('previous-piece').addEventListener('click', () => stepPiece(-1));
  document.getElementById('next-piece').addEventListener('click', () => stepPiece(1));
  document.getElementById('use-piece').addEventListener('click', () => selectPiece(dialogPieces[current]));
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); stepPiece(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepPiece(-1); }
  });

  const form = document.getElementById('enquiry-form');
  const date = document.getElementById('required-date');
  const today = new Date();
  date.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  form.addEventListener('input', () => { preview.hidden = true; });
  form.addEventListener('change', () => { preview.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const details = document.getElementById('personalisation');
    details.setCustomValidity(details.value.trim() ? '' : 'Please add a few details about your idea.');
    if (!form.reportValidity()) return;
    const value = id => document.getElementById(id).value.trim();
    const lines = ['Hi Dimple, I’d like to discuss a custom piece from Unique Ideas.'];
    if (value('customer-name')) lines.push(`Name: ${value('customer-name')}`);
    if (value('inspiration')) lines.push(`Inspiration: ${value('inspiration')}`);
    if (value('occasion')) lines.push(`Occasion: ${value('occasion')}`);
    lines.push(`Quantity: ${value('quantity')}`);
    if (value('required-date')) lines.push(`Preferred date: ${value('required-date')} (please confirm availability)`);
    lines.push(`Personalisation: ${value('personalisation')}`, 'Please share the quotation, timing and next steps.');
    const message = lines.join('\n\n');
    document.getElementById('preview-message').textContent = message;
    document.getElementById('whatsapp-enquiry').href = `https://wa.me/919512114114?text=${encodeURIComponent(message)}`;
    preview.hidden = false; document.getElementById('preview-title').focus();
  });
  document.getElementById('personalisation').addEventListener('input', event => event.target.setCustomValidity(''));
})();
