/* ----------------------------------------------------------------
   Lightbox condiviso per tutte le pagine evento.
   Aggiunge automaticamente il counter basandosi sul numero di
   .photo-grid__item presenti nella pagina: aggiungi o rimuovi
   blocchi <div class="photo-grid__item"> nell'HTML e il contatore
   si aggiorna senza toccare questo file.
---------------------------------------------------------------- */
(function () {
  const items   = Array.from(document.querySelectorAll('.photo-grid__item'));
  const total   = items.length;
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  const lbCount  = document.getElementById('lightbox-counter');
  let current = 0;

  function openAt(idx) {
    current = (idx + total) % total;
    lbImg.src = items[current].querySelector('img').src;
    if (lbCount) lbCount.textContent = (current + 1) + ' / ' + total;
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
  }

  items.forEach((item, i) => item.addEventListener('click', () => openAt(i)));
  document.querySelector('.lightbox__prev').addEventListener('click', () => openAt(current - 1));
  document.querySelector('.lightbox__next').addEventListener('click', () => openAt(current + 1));
  document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  openAt(current - 1);
    if (e.key === 'ArrowRight') openAt(current + 1);
    if (e.key === 'Escape')     closeLightbox();
  });

  /* Swipe touch nel lightbox */
  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 40) return; /* soglia minima */
    if (dx < 0) openAt(current + 1);
    else        openAt(current - 1);
  }, { passive: true });

  /* Swipe hint nel lightbox (solo mobile) */
  var hint = document.createElement('span');
  hint.className = 'lightbox__swipe-hint';
  hint.textContent = 'Swipe to navigate';
  lightbox.appendChild(hint);
}());

/* ----------------------------------------------------------------
   Loader: barra animata 2 secondi
---------------------------------------------------------------- */
(function () {
  var loader = document.getElementById('loader');
  if (!loader) return;
  var fill = document.getElementById('loader-bar-fill');
  if (fill) {
    setTimeout(function () {
      fill.style.transition = 'width 2s linear';
      fill.style.width = '100%';
    }, 20);
  }
  setTimeout(function () { loader.classList.add('done'); }, 2000);
}());

/* ----------------------------------------------------------------
   Masonry: ogni foto occupa la sua altezza naturale.
   grid-auto-rows: 1px in event.css — qui calcoliamo
   grid-row-end: span N per ogni item dopo il caricamento.
---------------------------------------------------------------- */
(function () {
  function updateSpans() {
    document.querySelectorAll('#gallery .photo-grid__item').forEach(function (item) {
      var h = item.querySelector('img').offsetHeight;
      if (h > 0) item.style.gridRowEnd = 'span ' + (h + 2);
    });
  }
  document.querySelectorAll('#gallery img').forEach(function (img) {
    img.addEventListener('load', updateSpans);
  });
  window.addEventListener('load', updateSpans);
  window.addEventListener('resize', updateSpans);
}());
