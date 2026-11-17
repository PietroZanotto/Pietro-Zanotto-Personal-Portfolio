/* ----------------------------------------------------------------
   PietroZanotto* — design section state
   web    : false = printed scan, true = web version
   tab    : 'work' | 'about'   (only clickable when web is on)
   short  : summarized web version (only for Work, only when web is on)
   The state is kept for the visit (sessionStorage) and can be forced
   from the URL: index.html?web=1&tab=about&short=1
---------------------------------------------------------------- */
(function () {
  var KEY = 'pz-design';
  var body = document.body;
  var isProject = body.classList.contains('is-project');
  var base = body.getAttribute('data-base') || '';

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: ignore */ }
  }

  var state = Object.assign({ web: false, tab: 'work', short: false }, load());
  var q = new URLSearchParams(location.search);
  if (q.has('web')) state.web = q.get('web') === '1';
  if (q.has('tab')) state.tab = q.get('tab') === 'about' ? 'about' : 'work';
  if (q.has('short')) state.short = q.get('short') === '1';
  if (isProject) { state.web = true; state.tab = 'work'; }
  if (!state.web) state.short = false;

  var webSwitch = document.querySelector('[data-switch="web"]');
  var shortSwitch = document.querySelector('[data-switch="short"]');
  var tabs = document.querySelector('.pz-tabs');
  var tabButtons = tabs ? tabs.querySelectorAll('button') : [];

  function render() {
    body.setAttribute('data-view', state.web ? state.tab : 'printed');
    body.classList.toggle('is-short', state.web && state.tab === 'work' && state.short);
    webSwitch.setAttribute('aria-checked', String(state.web));
    shortSwitch.setAttribute('aria-checked', String(state.web && state.short));
    tabs.classList.toggle('is-disabled', !state.web);
    shortSwitch.classList.toggle('is-disabled', !state.web || state.tab !== 'work');
    tabButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.web && b.getAttribute('data-tab') === state.tab));
    });
    save(state);
  }

  function goIndex() {
    save(state);
    location.href = base + 'index.html';
  }

  webSwitch.addEventListener('click', function () {
    state.web = !state.web;
    if (!state.web) state.short = false;
    if (isProject) return goIndex();
    render();
    window.scrollTo(0, 0);
  });

  shortSwitch.addEventListener('click', function () {
    if (!state.web || state.tab !== 'work') return;
    state.short = !state.short;
    render();
  });

  tabButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      if (!state.web) return;
      state.tab = b.getAttribute('data-tab');
      if (isProject) return goIndex();
      render();
      window.scrollTo(0, 0);
    });
  });

  render();

  /* ---------- Open a project like a window ----------
     The clicked row rises to the title-bar position of the project page,
     rows below fall away, rows above fade; then the project page opens its
     content underneath the same bar (see .is-opening in design.css). */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var indexRows = Array.prototype.slice.call(document.querySelectorAll('.pz-index a.pz-row'));
  var EASE = 'cubic-bezier(.65,0,.35,1)';

  function resetRows() {
    indexRows.forEach(function (r) { r.style.transition = ''; r.style.transform = ''; r.style.viewTransitionName = ''; r.classList.remove('is-picked'); });
    body.classList.remove('is-leaving');
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) resetRows(); });

  indexRows.forEach(function (row, i) {
    row.addEventListener('click', function (e) {
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      body.classList.add('is-leaving');
      var header = parseFloat(getComputedStyle(body).getPropertyValue('--header-h')) || 52;
      var dy = (header + 8) - row.getBoundingClientRect().top;
      var T = '.55s ' + EASE;
      /* the picked row keeps both its lines: it becomes the title bar */
      row.classList.add('is-picked');
      row.style.transition = 'transform ' + T;
      row.style.transform = 'translateY(' + dy + 'px)';
      row.style.viewTransitionName = 'pz-title';
      indexRows.forEach(function (r, j) {
        if (j === i) return;
        /* nothing fades: rows above slide up under the header,
           rows below slide down out of the window, lines and all */
        r.style.transition = 'transform ' + T;
        r.style.transform = 'translateY(' + (j < i ? dy : window.innerHeight) + 'px)';
      });
      try { sessionStorage.setItem('pz-open', '1'); } catch (err) { /* ignore */ }
      setTimeout(function () { location.href = row.href; }, 560);
    });
  });
}());
