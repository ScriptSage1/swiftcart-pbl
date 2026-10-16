/*
 * SwiftCart prototype — small UI helpers: escaping, icons, product artwork,
 * toasts, number tweening and scroll-reveal.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function html(markup) {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }

  /* ---------- Icons (24px stroke set) ---------- */

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
    upi: '<path d="M7 4 4 20M12 4l8 8-11 8 3-16Z"/>',
    cash: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
    mapPin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    box: '<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4v-9Z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.8l-5.3 2.8 1.1-5.8L3.5 9.7l5.9-.8L12 3.5Z"/>'
  };

  function icon(name, cls) {
    const filled = name === 'star';
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="20" height="20" fill="' +
      (filled ? 'currentColor' : 'none') + '" stroke="' + (filled ? 'none' : 'currentColor') +
      '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  /* ---------- Product artwork: a photo when the product has one, otherwise a lightweight inline SVG ---------- */

  const PHOTOS = {};
  window.SC_DATA.products.forEach(function (p) { if (p.image) PHOTOS[p.id] = p.image; });

  function keyboardKeys() {
    let out = '';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        const accent = (row === 0 && col === 7) || (row === 2 && col === 0);
        out += '<rect x="' + (39 + col * 15.5) + '" y="' + (80 + row * 15.5) + '" width="12" height="12" rx="3" fill="' +
          (accent ? '#E0714F' : '#F3F2EE') + '"/>';
      }
    }
    return out;
  }

  const ART = {
    'aura-headphones':
      '<path d="M52 118V98a48 48 0 0 1 96 0v20" fill="none" stroke="#23262C" stroke-width="9" stroke-linecap="round"/>' +
      '<rect x="38" y="104" width="28" height="52" rx="12" fill="#23262C"/><rect x="134" y="104" width="28" height="52" rx="12" fill="#23262C"/>' +
      '<rect x="46" y="115" width="6" height="30" rx="3" fill="#D8B48A"/><rect x="148" y="115" width="6" height="30" rx="3" fill="#D8B48A"/>',
    'pulse-watch':
      '<rect x="80" y="26" width="40" height="48" rx="9" fill="#4A5059"/><rect x="80" y="126" width="40" height="48" rx="9" fill="#4A5059"/>' +
      '<rect x="60" y="60" width="80" height="80" rx="22" fill="#16181C"/><rect x="68" y="68" width="64" height="64" rx="16" fill="#262A31"/>' +
      '<circle cx="100" cy="100" r="19" fill="none" stroke="#3A4049" stroke-width="5"/>' +
      '<circle cx="100" cy="100" r="19" fill="none" stroke="#6FCF97" stroke-width="5" stroke-dasharray="84 120" stroke-linecap="round" transform="rotate(-90 100 100)"/>' +
      '<rect x="140" y="92" width="5" height="16" rx="2.5" fill="#4A5059"/>',
    'nomad-backpack':
      '<path d="M80 54a20 20 0 0 1 40 0" fill="none" stroke="#5B4636" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="56" y="50" width="88" height="118" rx="28" fill="#C98B5A"/><rect x="68" y="106" width="64" height="46" rx="12" fill="#B3774A"/>' +
      '<rect x="70" y="78" width="60" height="6" rx="3" fill="#5B4636" opacity=".5"/><rect x="94" y="118" width="12" height="20" rx="4" fill="#5B4636"/>',
    'halo-lamp':
      '<path d="M66 100 100 168h0L134 100Z" fill="#F7E3A1" opacity=".45"/>' +
      '<rect x="70" y="160" width="60" height="9" rx="4.5" fill="#2B2F36"/><rect x="97" y="96" width="6" height="66" rx="3" fill="#2B2F36"/>' +
      '<path d="M68 98 84 44h32l16 54Z" fill="#E3A93C"/><path d="M68 98h64" stroke="#C48A1E" stroke-width="5" stroke-linecap="round"/>',
    'stride-shoes':
      '<path d="M36 132c0-13 5-25 16-28l20-5 21-23c4-4 10-4 13 1l7 10c9 12 23 18 41 22 9 2 12 8 12 17v6Z" fill="#2E6E8E"/>' +
      '<path d="M30 130h140v9a11 11 0 0 1-11 11H41a11 11 0 0 1-11-11Z" fill="#FFFFFF"/>' +
      '<path d="m84 93 13 10M94 82l13 10M74 104l13 9" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M120 119c12 4 25 6 42 8" stroke="#F2B544" stroke-width="5" stroke-linecap="round" fill="none"/>',
    'ember-mug':
      '<path d="M132 94h10a18 18 0 0 1 0 36h-10" fill="none" stroke="#2A4468" stroke-width="9"/>' +
      '<rect x="58" y="78" width="78" height="86" rx="15" fill="#33507A"/><rect x="58" y="78" width="78" height="17" rx="8.5" fill="#2A4468"/>' +
      '<path d="M84 62c-6-8 6-12 0-21M106 62c-6-8 6-12 0-21" stroke="#B6BAC6" stroke-width="4" stroke-linecap="round" fill="none"/>',
    'tactile-keyboard':
      '<rect x="28" y="69" width="144" height="65" rx="13" fill="#2A2D33"/>' + keyboardKeys(),
    'flow-bottle':
      '<rect x="88" y="28" width="24" height="18" rx="6" fill="#2B2F36"/><rect x="84" y="44" width="32" height="11" rx="4" fill="#9AA3AD"/>' +
      '<rect x="74" y="54" width="52" height="120" rx="21" fill="#5E8C7B"/><rect x="74" y="98" width="52" height="26" fill="#4E7A6A"/>' +
      '<rect x="84" y="66" width="6" height="24" rx="3" fill="#FFFFFF" opacity=".35"/>',
    'echo-speaker':
      '<rect x="58" y="42" width="84" height="124" rx="26" fill="#31353C"/><circle cx="100" cy="120" r="29" fill="#1D2025"/>' +
      '<circle cx="100" cy="120" r="14" fill="#3D424A"/><circle cx="100" cy="68" r="10" fill="#1D2025"/><circle cx="100" cy="68" r="4" fill="#E86A4A"/>',
    'shade-sunglasses':
      '<path d="M42 90c-9-2-15 2-18 9M158 90c9-2 15 2 18 9" stroke="#2B2F36" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<rect x="40" y="84" width="54" height="42" rx="19" fill="#2B2F36"/><rect x="106" y="84" width="54" height="42" rx="19" fill="#2B2F36"/>' +
      '<path d="M93 98q7-8 14 0" stroke="#2B2F36" stroke-width="5" fill="none"/>' +
      '<path d="M52 98q8-6 18-4M118 98q8-6 18-4" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="4" stroke-linecap="round" fill="none"/>',
    'terra-planter':
      '<ellipse cx="80" cy="76" rx="12" ry="32" fill="#4F8A68" transform="rotate(-30 80 76)"/>' +
      '<ellipse cx="120" cy="76" rx="12" ry="32" fill="#3F7557" transform="rotate(30 120 76)"/><ellipse cx="100" cy="64" rx="12" ry="36" fill="#5C9A76"/>' +
      '<path d="M66 110h68l-9 50a10 10 0 0 1-10 8H85a10 10 0 0 1-10-8Z" fill="#C9744F"/><rect x="61" y="100" width="78" height="15" rx="7" fill="#B6613E"/>',
    'volt-powerbank':
      '<rect x="62" y="34" width="76" height="132" rx="17" fill="#23262C"/><rect x="70" y="42" width="60" height="116" rx="11" fill="#2E3239"/>' +
      '<path d="M105 66 88 100h11l-4 26 17-34h-11Z" fill="#F2C14E"/>' +
      '<circle cx="85" cy="144" r="3" fill="#6FCF97"/><circle cx="95" cy="144" r="3" fill="#6FCF97"/><circle cx="105" cy="144" r="3" fill="#6FCF97"/><circle cx="115" cy="144" r="3" fill="#4A5059"/>'
  };

  function art(id, label) {
    if (PHOTOS[id]) {
      return '<img class="art art--photo" src="' + esc(PHOTOS[id]) + '" alt="' + esc(label || '') + '" loading="lazy" decoding="async">';
    }
    return '<svg class="art" viewBox="0 0 200 200" role="img" aria-label="' + esc(label || '') + '">' + (ART[id] || '') + '</svg>';
  }

  /* ---------- Toasts ---------- */

  function toast(message, kind, options) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const opts = options || {};
    const node = html(
      '<div class="toast toast--' + (kind || 'ok') + '" role="status">' +
        '<span class="toast__icon">' + icon(kind === 'warn' ? 'clock' : 'check') + '</span>' +
        '<span class="toast__msg">' + esc(message) + '</span>' +
        (opts.action ? '<button type="button" class="toast__action">' + esc(opts.action.label) + '</button>' : '') +
      '</div>'
    );
    // Keep the stack short so toasts never cover the page.
    while (host.children.length >= 2) host.removeChild(host.firstElementChild);
    host.appendChild(node);

    let timer;
    function dismiss() {
      window.clearTimeout(timer);
      node.classList.add('is-leaving');
      window.setTimeout(function () { node.remove(); }, 260);
    }
    if (opts.action) {
      node.querySelector('.toast__action').addEventListener('click', function () {
        opts.action.run();
        dismiss();
      });
    }
    timer = window.setTimeout(dismiss, opts.duration || 3200);
    return dismiss;
  }

  /* ---------- Number tween for prices ---------- */

  function animateNumber(el, to, format) {
    if (!el) return;
    const from = typeof el._value === 'number' ? el._value : to;
    el._value = to;
    if (el._raf) window.cancelAnimationFrame(el._raf);
    if (reduceMotion || from === to) { el.textContent = format(to); return; }
    const start = performance.now();
    const duration = 420;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = format(from + (to - from) * eased);
      if (t < 1) el._raf = window.requestAnimationFrame(frame);
    }
    el._raf = window.requestAnimationFrame(frame);
  }

  // Re-triggers a one-shot CSS animation class.
  function pulse(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- Scroll reveal ---------- */

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;

  function observeReveals(root) {
    const nodes = (root || document).querySelectorAll('[data-reveal]:not(.is-in)');
    Array.prototype.forEach.call(nodes, function (node) {
      if (revealObserver && !reduceMotion) revealObserver.observe(node);
      else node.classList.add('is-in');
    });
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      const args = arguments;
      const self = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  window.SC_UI = {
    reduceMotion: reduceMotion,
    esc: esc,
    html: html,
    icon: icon,
    art: art,
    toast: toast,
    animateNumber: animateNumber,
    pulse: pulse,
    observeReveals: observeReveals,
    debounce: debounce
  };
})();
