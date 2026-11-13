/* Sport&Perf : interactions (défilement doux, slider des formules, menus, planning, formulaire) */
(function () {
  var d = document, w = window, root = d.documentElement;
  root.classList.add('js');
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Défilement doux (Lenis si disponible)
  var lenis = null;
  if (!reduce && w.Lenis) {
    lenis = new w.Lenis({ lerp: 0.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = d.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -90 });
      });
    });
  }

  // En-tête : fond au défilement, se cache en descendant, revient en remontant
  var hdr = d.querySelector('.hdr'), lastY = 0, ticking = false;
  var paras = [].slice.call(d.querySelectorAll('[data-parallax]'));
  function onScroll() {
    var y = w.scrollY || w.pageYOffset;
    if (hdr) {
      hdr.classList.toggle('is-scrolled', y > 30);
      hdr.classList.toggle('is-hidden', y > 400 && y > lastY && !d.body.classList.contains('menu-open'));
    }
    if (!reduce) paras.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > w.innerHeight) return;
      var p = (r.top + r.height / 2 - w.innerHeight / 2) / w.innerHeight;
      el.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0)';
    });
    d.body.classList.toggle('show-mcta', y > w.innerHeight * 0.8);
    lastY = y; ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  // Menu mobile
  var burger = d.querySelector('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = d.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  var subs = d.querySelectorAll('.nav-btn');
  subs.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var was = b.getAttribute('aria-expanded') === 'true';
      subs.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      b.setAttribute('aria-expanded', String(!was));
    });
  });
  d.addEventListener('click', function () { if (w.innerWidth > 1080) subs.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); }); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    subs.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
    if (d.body.classList.contains('menu-open') && burger) burger.click();
  });

  // Apparitions (seulement pour ce qui est sous la ligne de flottaison au chargement)
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    d.querySelectorAll('.rv').forEach(function (el, i) {
      if (el.getBoundingClientRect().top > w.innerHeight * 0.95) {
        el.classList.add('pre');
        var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
        el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
        io.observe(el);
      }
    });
  }

  // Slider des formules : flèches, glisser à la souris, barre de progression
  d.querySelectorAll('[data-slider]').forEach(function (sl) {
    var sec = sl.closest('section'), track = sl.querySelector('.sl-track');
    var prev = sec.querySelector('.sl-prev'), next = sec.querySelector('.sl-next'), bar = sec.querySelector('.sl-bar span');
    function step() { var c = track.children[0]; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300; }
    function go(dir) { sl.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' }); }
    function upd() {
      var max = sl.scrollWidth - sl.clientWidth;
      var r = max > 0 ? sl.scrollLeft / max : 1;
      if (bar) { bar.style.width = Math.max(18, (sl.clientWidth / sl.scrollWidth) * 100) + '%'; bar.style.transform = 'translateX(' + (r * (100 / parseFloat(bar.style.width) * 100 - 100)) + '%)'; }
      if (prev) prev.disabled = sl.scrollLeft < 8;
      if (next) next.disabled = sl.scrollLeft > max - 8;
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    sl.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    w.addEventListener('resize', upd); upd();
    sl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    // glisser à la souris (le tactile défile nativement)
    var down = false, sx = 0, sl0 = 0, moved = false;
    sl.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl0 = sl.scrollLeft; sl.classList.add('is-drag'); });
    w.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; sl.scrollLeft = sl0 - dx; });
    w.addEventListener('pointerup', function () { if (!down) return; down = false; sl.classList.remove('is-drag'); });
    sl.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    // pas de défilement vertical capturé par Lenis sur le slider
    sl.setAttribute('data-lenis-prevent-wheel', '');
  });

  // Hero V2 : les 4 espaces du club (survol, onglets, défilement auto)
  d.querySelectorAll('[data-zones]').forEach(function (z) {
    var hero = z.closest('section') || d;
    var items = [].slice.call(z.querySelectorAll('[data-zone]'));
    var dots = [].slice.call(hero.querySelectorAll('[data-zone-btn]'));
    var cur = hero.querySelector('.hzx-cur');
    var i = 0, timer = null, held = false, desk = w.matchMedia('(min-width:861px) and (hover:hover)');
    function on(k) {
      i = k;
      items.forEach(function (el, n) { el.classList.toggle('is-on', n === k); });
      dots.forEach(function (b, n) { b.classList.toggle('is-on', n === k); b.setAttribute('aria-pressed', n === k ? 'true' : 'false'); });
      if (cur && items[k]) {
        cur.querySelector('.n').textContent = items[k].getAttribute('data-n');
        cur.querySelector('.t').textContent = items[k].getAttribute('data-t');
        cur.querySelector('.d').textContent = items[k].getAttribute('data-d');
      }
    }
    items.forEach(function (el, n) {
      el.addEventListener('mouseenter', function () { if (desk.matches) { held = true; on(n); } });
      el.addEventListener('focus', function () { held = true; on(n); });
    });
    dots.forEach(function (b, n) { b.addEventListener('click', function () { held = true; on(n); restart(); }); });
    function tick() { if (!held) on((i + 1) % items.length); }
    function restart() { if (timer) clearInterval(timer); if (!reduce) timer = setInterval(tick, 4500); }
    z.addEventListener('mouseleave', function () { held = false; });
    d.addEventListener('visibilitychange', function () { if (d.hidden) { clearInterval(timer); timer = null; } else restart(); });
    restart();
  });

  // Hero V2 : diaporama (avance à la fin de la barre de progression, pause, survol souris, statut d'ouverture)
  d.querySelectorAll('[data-hx]').forEach(function (hx) {
    var slides = [].slice.call(hx.querySelectorAll('.hx-slide'));
    var segs = [].slice.call(hx.querySelectorAll('.hx-seg'));
    var sweep = hx.querySelector('.hx-sweep');
    var num = hx.querySelector('.hx-count .cur span');
    var kick = hx.querySelector('.hx-kicker'), kn = kick && kick.querySelector('.zn'), ki = kick && kick.querySelector('.idx b');
    var pauseBtn = hx.querySelector('.hx-pause');
    var cur = 0, prevTimer = null;
    function skew() { var W = hx.offsetWidth + 56, H = hx.offsetHeight + 56; hx.style.setProperty('--sk', (-Math.atan(0.2 * W / H) * 180 / Math.PI).toFixed(2) + 'deg'); }
    skew(); w.addEventListener('resize', skew);
    function go(k) {
      if (k === cur) { var f = segs[k]; f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on'); return; }
      var old = cur; cur = k;
      slides.forEach(function (s, n) { s.classList.remove('is-prev'); if (n !== k) s.classList.remove('is-on'); });
      slides[old].classList.add('is-prev');
      void slides[k].offsetWidth;
      slides[k].classList.add('is-on');
      clearTimeout(prevTimer); prevTimer = setTimeout(function () { slides[old].classList.remove('is-prev'); }, 1300);
      if (sweep && !reduce) { sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go'); }
      segs.forEach(function (s, n) { s.classList.toggle('is-done', n < k); s.classList.remove('is-on'); s.removeAttribute('aria-current'); });
      void segs[k].offsetWidth; segs[k].classList.add('is-on'); segs[k].setAttribute('aria-current', 'true');
      var nn = ('0' + (k + 1)).slice(-2);
      if (num) { num.textContent = nn; num.classList.remove('roll'); void num.offsetWidth; num.classList.add('roll'); }
      if (kick) { kn.textContent = slides[k].getAttribute('data-name'); ki.textContent = nn; kick.setAttribute('href', slides[k].getAttribute('data-href')); }
    }
    segs.forEach(function (s, n) { s.addEventListener('click', function () { go(n); }); });
    hx.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('fill') && e.target.closest('.hx-seg.is-on')) go((cur + 1) % slides.length);
    });
    function setPaused(p) {
      hx.classList.toggle('is-paused', p);
      if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseBtn.setAttribute('aria-label', p ? 'Relancer le diaporama' : 'Mettre le diaporama en pause'); }
    }
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!hx.classList.contains('is-paused')); });
    if (reduce) setPaused(true);
    d.addEventListener('visibilitychange', function () { if (d.hidden) hx.classList.add('is-paused'); else if (!pauseBtn || pauseBtn.getAttribute('aria-pressed') !== 'true') hx.classList.remove('is-paused'); });
    // léger déplacement de l'image avec la souris
    if (!reduce && w.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      hx.addEventListener('mousemove', function (e) {
        var r = hx.getBoundingClientRect();
        hx.style.setProperty('--px', (((e.clientX - r.left) / r.width - .5) * -22).toFixed(1) + 'px');
        hx.style.setProperty('--py', (((e.clientY - r.top) / r.height - .5) * -14).toFixed(1) + 'px');
      });
      hx.addEventListener('mouseleave', function () { hx.style.setProperty('--px', '0px'); hx.style.setProperty('--py', '0px'); });
      [].forEach.call(hx.querySelectorAll('[data-magnetic]'), function (b) {
        b.addEventListener('mousemove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)';
        });
        b.addEventListener('mouseleave', function () { b.style.transform = ''; });
      });
    }
    // statut d'ouverture à l'heure de Toulouse (club ouvert 7j/7 de 7h à 22h30)
    var st = hx.querySelector('[data-status]');
    function status() {
      if (!st) return;
      try {
        var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
        var h = 0, m = 0; parts.forEach(function (p) { if (p.type === 'hour') h = +p.value % 24; if (p.type === 'minute') m = +p.value; });
        var t = h * 60 + m, open = t >= 420 && t < 1350;
        st.classList.toggle('is-closed', !open);
        st.querySelector('.txt').textContent = open ? 'Ouvert maintenant · jusqu\u2019à 22h30' : 'Fermé · ouvre à 7h';
      } catch (err) {}
    }
    status(); setInterval(status, 60000);
  });

  // Filtres planning
  d.querySelectorAll('.chips').forEach(function (g) {
    var sched = g.parentNode.querySelector('.sched');
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      g.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
      var f = b.getAttribute('data-filter');
      sched.querySelectorAll('.slot').forEach(function (s) { s.hidden = !(f === 'all' || s.getAttribute('data-type') === f); });
    });
  });

  // Formulaire (à relier à un service d'envoi, voir README)
  d.querySelectorAll('form.form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('.form-msg');
      if (!f.checkValidity()) {
        f.classList.add('was-validated');
        msg.textContent = 'Merci de remplir les champs obligatoires et de cocher la case de consentement.';
        msg.className = 'form-msg is-err';
        var bad = f.querySelector(':invalid'); if (bad) bad.focus();
        return;
      }
      msg.textContent = 'Le formulaire n’est pas encore relié : appelez le 05 61 16 64 35 pour réserver votre essai.';
      msg.className = 'form-msg is-ok';
    });
  });
  d.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
