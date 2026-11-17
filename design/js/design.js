/* ----------------------------------------------------------------
   PietroZanotto* — design section state
   web    : false = printed scan (Print switch on), true = web version (Print off)
   tab    : 'work' | 'about'   (only clickable when web is on)
   short  : summarized web version (only for Work, only when web is on)
   The state is kept for the visit (sessionStorage) and can be forced
   from the URL: index.html?web=1&tab=about&short=1 (web=0 = Print on).
   Arriving in the design section from outside, Print always starts off.
---------------------------------------------------------------- */
(function () {
  var KEY = 'pz-design';
  var body = document.body;
  var isProject = body.classList.contains('is-project');
  var projectOpen = false;   // a project opened in place on the index page

  /* Make every relative link/src absolute once, so the page keeps working
     after the URL changes to a project (history.pushState). */
  function absolutize(root, baseUrl) {
    root.querySelectorAll('[href],[src]').forEach(function (el) {
      ['href', 'src'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && !/^(#|mailto:|tel:|data:|https?:)/.test(v)) el.setAttribute(a, new URL(v, baseUrl).href);
      });
    });
  }
  absolutize(document, location.href);
  var indexUrl = new URL(isProject ? '../index.html' : 'index.html', location.href).href;

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: ignore */ }
  }

  var fromInside = document.referrer && new URL(document.referrer, location.href).pathname.indexOf('/design/') !== -1;
  var state = Object.assign({ web: true, tab: 'work', short: false }, fromInside ? load() : {});
  var q = new URLSearchParams(location.search);
  if (q.has('web')) state.web = q.get('web') === '1';
  if (q.has('tab')) state.tab = q.get('tab') === 'about' ? 'about' : 'work';
  if (q.has('short')) state.short = q.get('short') === '1';
  if (isProject) { state.web = true; state.tab = 'work'; }
  if (!state.web) state.short = false;

  var printSwitch = document.querySelector('[data-switch="print"]');
  var shortSwitch = document.querySelector('[data-switch="short"]');
  var tabs = document.querySelector('.pz-tabs');
  var tabButtons = tabs ? tabs.querySelectorAll('button') : [];

  function render() {
    body.setAttribute('data-view', projectOpen ? 'project' : (state.web ? state.tab : 'printed'));
    body.classList.toggle('is-short', state.web && state.tab === 'work' && state.short);
    printSwitch.setAttribute('aria-checked', String(!state.web));
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
    location.href = indexUrl;
  }

  printSwitch.addEventListener('click', function () {
    state.web = !state.web;
    if (!state.web) state.short = false;
    if (isProject || projectOpen) return goIndex();
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
      if (isProject || projectOpen) return goIndex();
      render();
      window.scrollTo(0, 0);
    });
  });

  render();

  /* ---------- Open a project like a window, on the same page ----------
     1. the picked row rises to the title-bar position, the other rows slide
        away (above: under the header, below: out of the window);
     2. meanwhile the project page is fetched;
     3. its title bar replaces the row in the very same spot, its content is
        inserted and drops in from above; the URL becomes the project's. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var indexRows = Array.prototype.slice.call(document.querySelectorAll('.pz-index a.pz-row'));
  var EASE = 'cubic-bezier(.65,0,.35,1)';
  var EXIT_MS = 700;   // 25% slower than before

  window.addEventListener('popstate', function () { location.reload(); });

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function openInPlace(html, url) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    absolutize(doc, url);
    var title = doc.querySelector('.pz-project-title');
    var content = doc.querySelector('.pz-project');
    var footer = doc.querySelector('.pz-footer');
    if (!title || !content) throw new Error('unexpected page');

    var view = document.createElement('section');
    view.id = 'view-project';
    view.className = 'is-dropping';
    view.appendChild(document.importNode(title, true));
    var main = document.createElement('div');
    main.className = content.className;
    main.innerHTML = content.innerHTML;
    view.appendChild(main);
    // drop the animation once done, so nothing transformed is left around the sticky labels
    main.addEventListener('animationend', function () { view.classList.remove('is-dropping'); }, { once: true });
    document.querySelector('main').after(view);

    var oldFooter = document.querySelector('.pz-footer');
    if (oldFooter && footer) {
      var f = document.importNode(footer, true);
      f.classList.add('is-entering');
      oldFooter.replaceWith(f);
    }
    document.title = doc.title;
    history.pushState({ pz: 'project' }, '', url);
    projectOpen = true;
    window.scrollTo(0, 0);
    render();
    body.classList.remove('is-leaving');
  }

  indexRows.forEach(function (row, i) {
    row.addEventListener('click', function (e) {
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var url = row.href;
      var page = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });

      body.classList.add('is-leaving');
      var header = parseFloat(getComputedStyle(body).getPropertyValue('--header-h')) || 52;
      var dy = (header + 8) - row.getBoundingClientRect().top;
      var T = (EXIT_MS / 1000) + 's ' + EASE;
      row.classList.add('is-picked');   // keeps both lines: it becomes the title bar
      row.style.transition = 'transform ' + T;
      row.style.transform = 'translateY(' + dy + 'px)';
      indexRows.forEach(function (r, j) {
        if (j === i) return;
        r.style.transition = 'transform ' + T;
        r.style.transform = 'translateY(' + (j < i ? dy : window.innerHeight) + 'px)';
      });

      Promise.all([page, wait(EXIT_MS)])
        .then(function (res) { openInPlace(res[0], url); })
        .catch(function () { location.href = url; });
    });
  });
}());
