/* =====================================================================
   Ozzy's Tree & Stump Services — interactions
   Vanilla JS, no dependencies. Progressive + accessible.
   ===================================================================== */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  // Make the rest of the page inert (non-focusable, hidden from AT) behind an overlay.
  function inertList(sels) { sels.forEach(function (s) { var e = $(s); if (e) e.setAttribute('inert', ''); }); }
  function unInertList(sels) { sels.forEach(function (s) { var e = $(s); if (e) e.removeAttribute('inert'); }); }

  /* ---------- Current year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header scroll state ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 30) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav-toggle');
  var menu = $('.mobile-menu');
  var menuInert = ['#main', '.site-footer', '.mobile-bar'];
  function closeMenu() {
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    doc.body.classList.remove('menu-open');
    unInertList(menuInert);
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  }
  function openMenu() {
    menu.classList.add('open');
    doc.body.classList.add('menu-open');
    inertList(menuInert);
    toggle.setAttribute('aria-expanded', 'true');
    var first = $('a', menu); if (first) first.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) closeMenu(); else openMenu();
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal],[data-reveal-stagger]').forEach(function (el) { revObs.observe(el); });
  } else {
    $$('[data-reveal],[data-reveal-stagger]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Count up ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var dur = 1500, start = null;
    if (reduce) { el.textContent = prefix + target + suffix; return; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(function (el) { cObs.observe(el); });
  } else {
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq-item').forEach(function (item, i) {
    var q = $('.faq-q', item);
    var panel = $('.faq-a', item);
    if (!q) return;
    q.setAttribute('type', 'button');
    if (panel) {
      if (!panel.id) panel.id = 'faq-panel-' + i;
      q.setAttribute('aria-controls', panel.id);
      if (!item.classList.contains('open')) panel.setAttribute('inert', '');
    }
    q.addEventListener('click', function () {
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel) { if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', ''); }
    });
  });

  /* ---------- Back to top ---------- */
  var toTop = $('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 700);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* =================================================================
     GALLERY
     ================================================================= */
  var galleryRoot = $('#gallery-grid');
  if (galleryRoot && window.OZ_GALLERY) {
    var data = window.OZ_GALLERY;
    var base = data.base || 'assets/gallery';
    var items = data.items || [];
    var catLabel = {};
    (data.categories || []).forEach(function (c) { catLabel[c.id] = c.label; });

    var iconZoom = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>';

    // Build filter buttons (categories present with >=2 items, plus All)
    var counts = {};
    items.forEach(function (it) { counts[it.cat] = (counts[it.cat] || 0) + 1; });
    var filterWrap = $('#gallery-filters');
    if (filterWrap) {
      var btns = ['<button class="filter-btn active" data-filter="all">All Work <span class="n">' + items.length + '</span></button>'];
      (data.categories || []).forEach(function (c) {
        if (c.id === 'all') return;
        if ((counts[c.id] || 0) >= 2) {
          btns.push('<button class="filter-btn" data-filter="' + c.id + '">' + c.label + ' <span class="n">' + counts[c.id] + '</span></button>');
        }
      });
      filterWrap.innerHTML = btns.join('');
    }

    // Build items
    var html = items.map(function (it, i) {
      var thumb = base + '/thumb/' + it.slug + '.jpg';
      var large = base + '/large/' + it.slug + '.jpg';
      var label = catLabel[it.cat] || '';
      return '<button class="gitem" type="button" data-i="' + i + '" data-cat="' + it.cat + '" data-large="' + large + '" data-caption="' + escapeAttr(it.caption) + '" data-tag="' + escapeAttr(label) + '" aria-label="View larger: ' + escapeAttr(it.caption) + '">' +
        '<img src="' + it.lqip + '" data-src="' + thumb + '" width="' + it.tw + '" height="' + it.th + '" alt="' + escapeAttr(it.alt) + '" decoding="async">' +
        '<span class="gi-overlay"><span class="gi-tag">' + escapeHtml(label) + '</span><span class="gi-cap">' + escapeHtml(it.caption) + '</span></span>' +
        '<span class="gi-zoom" aria-hidden="true">' + iconZoom + '</span>' +
        '</button>';
    }).join('');
    galleryRoot.innerHTML = html;

    var tiles = $$('.gitem', galleryRoot);

    // Lazy load thumbs + reveal
    function loadTile(tile) {
      var img = $('img', tile);
      if (!img || img.dataset.done) return;
      var real = img.getAttribute('data-src');
      var pre = new Image();
      pre.onload = function () { img.src = real; img.classList.add('loaded'); img.dataset.done = '1'; };
      pre.onerror = function () { img.classList.add('loaded'); };
      pre.src = real;
    }
    if ('IntersectionObserver' in window) {
      var imgObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { loadTile(en.target); imgObs.unobserve(en.target); }
        });
      }, { rootMargin: '300px 0px' });
      tiles.forEach(function (t) { imgObs.observe(t); });
    } else {
      tiles.forEach(loadTile);
    }
    // stagger in
    requestAnimationFrame(function () {
      tiles.forEach(function (t, i) { setTimeout(function () { t.classList.add('in'); }, reduce ? 0 : Math.min(i * 35, 500)); });
    });

    // Filtering
    var emptyEl = $('#gallery-empty');
    function applyFilter(cat) {
      var shown = 0;
      tiles.forEach(function (t) {
        var match = cat === 'all' || t.dataset.cat === cat;
        t.classList.toggle('hide', !match);
        if (match) { shown++; loadTile(t); }
      });
      if (emptyEl) emptyEl.style.display = shown ? 'none' : 'block';
    }
    if (filterWrap) {
      filterWrap.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (!b) return;
        $$('.filter-btn', filterWrap).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        applyFilter(b.getAttribute('data-filter'));
      });
    }

    /* ---------- Lightbox ---------- */
    var lb = $('#lightbox');
    if (lb) {
      var lbImg = $('.lightbox__img', lb);
      var lbTag = $('.lb-tag', lb);
      var lbText = $('.lb-text', lb);
      var lbCount = $('.lb-count', lb);
      var current = -1;
      var lastFocus = null;

      function visibleTiles() { return tiles.filter(function (t) { return !t.classList.contains('hide'); }); }

      function show(idxInVisible) {
        var list = visibleTiles();
        if (!list.length) return;
        if (idxInVisible < 0) idxInVisible = list.length - 1;
        if (idxInVisible >= list.length) idxInVisible = 0;
        current = idxInVisible;
        var tile = list[idxInVisible];
        lb.classList.remove('show-img');
        var pre = new Image();
        pre.onload = function () { lbImg.src = pre.src; lb.classList.add('show-img'); };
        pre.src = tile.getAttribute('data-large');
        lbImg.alt = $('img', tile).alt;
        if (lbTag) lbTag.textContent = tile.getAttribute('data-tag');
        if (lbText) lbText.textContent = tile.getAttribute('data-caption');
        if (lbCount) lbCount.textContent = (idxInVisible + 1) + ' / ' + list.length;
      }
      var lbInert = ['.site-header', '#main', '.site-footer', '.mobile-bar', '.mobile-menu'];
      function openLb(tile) {
        var list = visibleTiles();
        var idx = list.indexOf(tile);
        if (idx < 0) idx = 0;
        lastFocus = doc.activeElement;
        lb.classList.add('open');
        doc.body.classList.add('menu-open');
        inertList(lbInert);
        show(idx);
        var closeBtn = $('.lb-close', lb); if (closeBtn) closeBtn.focus();
      }
      function closeLb() {
        lb.classList.remove('open');
        doc.body.classList.remove('menu-open');
        unInertList(lbInert);
        if (lastFocus) lastFocus.focus();
      }
      galleryRoot.addEventListener('click', function (e) {
        var tile = e.target.closest('.gitem');
        if (tile) openLb(tile);
      });
      lb.addEventListener('click', function (e) {
        if (e.target.closest('.lb-next')) { show(current + 1); return; }
        if (e.target.closest('.lb-prev')) { show(current - 1); return; }
        if (e.target.closest('.lb-close')) { closeLb(); return; }
        if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLb();
      });
      doc.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLb();
        else if (e.key === 'ArrowRight') show(current + 1);
        else if (e.key === 'ArrowLeft') show(current - 1);
      });
      // swipe
      var sx = 0;
      lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }
  }

  /* =================================================================
     VIDEOS
     ================================================================= */
  var videoRoot = $('#video-grid');
  if (videoRoot && window.OZ_VIDEOS) {
    var vids = (window.OZ_VIDEOS.items || []);
    var playIco = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    videoRoot.innerHTML = vids.map(function (v, i) {
      return '<button class="vcard" type="button" data-src="' + v.src + '" aria-label="Play video: ' + escapeAttr(v.label) + '">' +
        '<span class="v-tag">Watch</span>' +
        '<span class="v-play" aria-hidden="true">' + playIco + '</span>' +
        '<span class="v-label">' + escapeHtml(v.label) + '</span>' +
        '</button>';
    }).join('');
    videoRoot.addEventListener('click', function (e) {
      var card = e.target.closest('.vcard');
      if (!card || card.dataset.playing) return;
      card.dataset.playing = '1';
      var vid = doc.createElement('video');
      vid.src = card.getAttribute('data-src');
      vid.controls = true; vid.autoplay = true; vid.playsInline = true; vid.setAttribute('playsinline', '');
      vid.preload = 'auto';
      card.appendChild(vid);
      var p = vid.play(); if (p && p.catch) p.catch(function () {});
    });
  }

  /* =================================================================
     CONTACT FORM (Resend via PHP endpoint, or configurable)
     ================================================================= */
  var form = $('#quote-form');
  if (form) {
    var status = $('#form-status', form.parentNode) || $('#form-status');
    var submitBtn = $('button[type="submit"]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // honeypot
      var hp = form.querySelector('input[name="company"]');
      if (hp && hp.value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var endpoint = form.getAttribute('action') || 'php/send.php';
      var fd = new FormData(form);
      setStatus('', '');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'Sending...'; }
      fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && (res.ok || res.success)) {
            setStatus('ok', "Thanks, your enquiry is on its way. We'll get back to you shortly. For anything urgent, call 0451 308 349.");
            form.reset();
          } else {
            setStatus('err', (res && res.message) || "Something went wrong sending your message. Please call or text us on 0451 308 349.");
          }
        })
        .catch(function () {
          setStatus('err', "We couldn't send that just now. Please call or text us on 0451 308 349 and we'll sort it out.");
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || 'Send enquiry'; }
        });
    });
    function setStatus(kind, msg) {
      if (!status) return;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
      status.textContent = msg;
      if (kind) status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  /* ---------- helpers ---------- */
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function escapeAttr(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
