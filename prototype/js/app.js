/*
 * SwiftCart prototype — application shell: router, views, cart drawer and
 * the three-step guest checkout.
 */
(function () {
  'use strict';

  const D = window.SC_DATA;
  const C = window.SC_CORE;
  const S = window.SC_STORE;
  const U = window.SC_UI;
  const { products, categories, deliveryOptions, promoCodes, pinDirectory, config } = D;
  const { esc, icon, art } = U;

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const money = (n) => C.formatMoney(n, config);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const view = $('#view');
  const drawer = $('#cartDrawer');
  const backdrop = $('#backdrop');
  const header = $('#siteHeader');

  const CONTACT_FIELDS = ['email', 'phone', 'fullName', 'pin', 'address', 'city', 'state'];
  const STEPS = [
    { n: 1, title: 'Contact and address', short: 'Details' },
    { n: 2, title: 'Delivery', short: 'Delivery' },
    { n: 3, title: 'Payment', short: 'Payment' }
  ];
  const BRAND_NAMES = { visa: 'Visa', mastercard: 'Mastercard', rupay: 'RuPay', amex: 'Amex' };

  // Transient UI state (not persisted).
  const shop = { category: 'All', sort: 'featured', query: '', loaded: false };
  let checkout = null;      // { step, method, startedAt, contact } while a checkout is in progress
  let currentView = null;
  let lastFocus = null;     // element to refocus when the drawer closes

  function getTotals(deliveryId) {
    const s = S.get();
    return C.computeTotals(s.cart, products, {
      deliveryOptions, promoCodes, config,
      deliveryId: deliveryId || s.deliveryId,
      promoCode: s.promoCode
    });
  }

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function etaRange(option) {
    const eta = C.estimateDelivery(option);
    return C.formatDate(eta.earliest, config.locale) + ' – ' + C.formatDate(eta.latest, config.locale);
  }

  /* =====================================================================
     Shared templates
     ===================================================================== */

  function discountPct(p) {
    return p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  }

  function priceHTML(p) {
    return `<span class="price"><span class="price__now">${money(p.price)}</span>` +
      (p.mrp > p.price ? `<s class="price__was">${money(p.mrp)}</s>` : '') + '</span>';
  }

  function cardHTML(p, i) {
    const off = discountPct(p);
    return `
      <article class="card" data-reveal style="--i:${i % 8}">
        <a class="card__media" href="#/product/${p.id}" style="--tile:${p.tile}" aria-label="${esc(p.name)}">
          ${art(p.id, p.name)}
          ${off ? `<span class="badge">${off}% off</span>` : ''}
          ${p.stock <= 5 ? `<span class="badge badge--low">Only ${p.stock} left</span>` : ''}
        </a>
        <div class="card__body">
          <div class="card__meta">
            <span>${esc(p.category)}</span>
            <span class="rating">${icon('star')}${p.rating.toFixed(1)}</span>
          </div>
          <a class="card__title" href="#/product/${p.id}">${esc(p.name)}</a>
          <div class="card__foot">
            ${priceHTML(p)}
            <button type="button" class="add-btn" data-action="add" data-id="${p.id}" aria-label="Add ${esc(p.name)} to cart">
              <span class="add-btn__idle">${icon('plus')}<span>Add</span></span>
              <span class="add-btn__done">${icon('check')}<span>Added</span></span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function skeletonHTML() {
    return `
      <div class="skeleton" aria-hidden="true">
        <div class="skeleton__media sk"></div>
        <div class="skeleton__body">
          <div class="sk" style="width:38%;height:10px"></div>
          <div class="sk" style="width:82%;height:14px"></div>
          <div class="sk" style="width:46%;height:14px"></div>
        </div>
      </div>`;
  }

  function qtyHTML(qty, prefix, large) {
    return `
      <div class="qty${large ? ' qty--lg' : ''}">
        <button type="button" data-action="${prefix}dec" aria-label="Decrease quantity">${icon('minus')}</button>
        <output aria-live="polite">${qty}</output>
        <button type="button" data-action="${prefix}inc" aria-label="Increase quantity">${icon('plus')}</button>
      </div>`;
  }

  function lineHTML(line) {
    const p = line.product;
    return `
      <li class="line" data-id="${p.id}">
        <a class="line__media" href="#/product/${p.id}" style="--tile:${p.tile}" tabindex="-1" aria-hidden="true">${art(p.id, '')}</a>
        <div class="line__info">
          <a class="line__name" href="#/product/${p.id}">${esc(p.name)}</a>
          <span class="line__unit">${money(p.price)} each</span>
          <div class="line__controls">
            ${qtyHTML(line.qty, '')}
            <button type="button" class="link link--muted" data-action="remove">Remove</button>
          </div>
        </div>
        <strong class="line__total">${money(line.lineTotal)}</strong>
      </li>`;
  }

  function totalsHTML() {
    return `
      <dl class="totals">
        <div class="totals__row"><dt>Subtotal</dt><dd data-total="subtotal"></dd></div>
        <div class="totals__row totals__row--discount" data-total-row="discount" hidden>
          <dt>Discount<span class="pill" data-total="code"></span></dt><dd data-total="discount"></dd>
        </div>
        <div class="totals__row"><dt>Delivery</dt><dd data-total="delivery"></dd></div>
        <div class="totals__row totals__row--grand">
          <dt>Total<small data-total="tax"></small></dt><dd data-total="total"></dd>
        </div>
      </dl>`;
  }

  function staticTotalsHTML(t) {
    return `
      <dl class="totals">
        <div class="totals__row"><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
        ${t.discount ? `<div class="totals__row totals__row--discount"><dt>Discount<span class="pill">${esc(t.promoCode)}</span></dt><dd>− ${money(t.discount)}</dd></div>` : ''}
        <div class="totals__row"><dt>Delivery</dt><dd class="${t.delivery ? '' : 'is-free'}">${t.delivery ? money(t.delivery) : 'Free'}</dd></div>
        <div class="totals__row totals__row--grand">
          <dt>Total paid<small>Includes ${money(t.taxIncluded)} GST</small></dt><dd>${money(t.total)}</dd>
        </div>
      </dl>`;
  }

  function messageViewHTML(title, body) {
    return `
      <section class="container notice">
        <div class="notice__icon">${icon('bag')}</div>
        <h1>${esc(title)}</h1>
        <p>${esc(body)}</p>
        <a class="btn btn--primary btn--lg" href="#/">Browse products</a>
      </section>`;
  }

  /* =====================================================================
     Home / catalogue
     ===================================================================== */

  function viewHome() {
    view.innerHTML = `
      <section class="hero">
        <div class="container hero__inner">
          <div class="hero__copy">
            <span class="eyebrow"><i class="eyebrow__dot"></i>New: checkout in three quick steps</span>
            <h1 class="hero__title">Everyday essentials, <span>without the wait.</span></h1>
            <p class="hero__lead">Well-made products at honest prices. Your cart is saved automatically, delivery costs are shown up front, and you can check out as a guest in three short steps.</p>
            <div class="hero__cta">
              <button type="button" class="btn btn--primary btn--lg" data-action="scroll-products">Shop the collection<span class="btn__arrow">${icon('arrowRight')}</span></button>
              <button type="button" class="btn btn--ghost btn--lg" data-action="open-cart">View cart</button>
            </div>
            <ul class="hero__facts">
              <li><strong>3</strong><span>steps to check out</span></li>
              <li><strong>0</strong><span>hidden charges</span></li>
              <li><strong>7 days</strong><span>easy returns</span></li>
            </ul>
          </div>
          <div class="hero__art" aria-hidden="true">
            <div class="hero__tile hero__tile--a" style="--tile:#ECEEF2">${art('aura-headphones')}</div>
            <div class="hero__tile hero__tile--b" style="--tile:#F2EEE3">${art('halo-lamp')}</div>
            <div class="hero__tile hero__tile--c" style="--tile:#E8EFEA">${art('pulse-watch')}</div>
            <div class="hero__chip hero__chip--a">${icon('truck')}<span>Free delivery above ${money(config.freeDeliveryThreshold)}</span></div>
            <div class="hero__chip hero__chip--b">${icon('bolt')}<span>No account needed</span></div>
          </div>
        </div>
      </section>

      <section class="shop" id="products">
        <div class="container">
          <div class="shop__head">
            <div>
              <h2>Shop the collection</h2>
              <p class="muted" id="resultCount" aria-live="polite">&nbsp;</p>
            </div>
            <label class="select">
              <span class="sr-only">Sort products</span>
              <select id="sortSelect">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
              ${icon('chevron')}
            </label>
          </div>
          <div class="chips" id="chips" role="tablist" aria-label="Product categories">
            <span class="chips__pill" aria-hidden="true"></span>
            ${categories.map((c) => `<button type="button" role="tab" class="chip" data-action="category" data-category="${c}" aria-selected="${c === shop.category}">${c}</button>`).join('')}
          </div>
          <div class="grid" id="grid"></div>
          <div class="empty" id="emptyState" hidden>
            <h3>No products match your search</h3>
            <p class="muted">Try a different word, or browse every category.</p>
            <button type="button" class="btn btn--outline" data-action="clear-search">Clear search</button>
          </div>
        </div>
      </section>

      <section class="container perks">
        <div class="perk" data-reveal style="--i:0"><span class="perk__icon">${icon('truck')}</span><div><h3>Fast, tracked delivery</h3><p>Standard delivery in 3–5 days, or express in 1–2. The cost is shown before checkout.</p></div></div>
        <div class="perk" data-reveal style="--i:1"><span class="perk__icon">${icon('shield')}</span><div><h3>Secure payments</h3><p>Pay by UPI, card or cash on delivery. Card details are never stored.</p></div></div>
        <div class="perk" data-reveal style="--i:2"><span class="perk__icon">${icon('refresh')}</span><div><h3>Easy 7-day returns</h3><p>Changed your mind? Return any item within seven days for a full refund.</p></div></div>
      </section>`;

    $('#sortSelect').value = shop.sort;
    $('#sortSelect').addEventListener('change', (e) => { shop.sort = e.target.value; renderGrid(); });
    movePill($('#chips'), true);
    renderGrid();
  }

  function visibleProducts() {
    const q = shop.query.trim().toLowerCase();
    const list = products.filter((p) =>
      (shop.category === 'All' || p.category === shop.category) &&
      (!q || (p.name + ' ' + p.category + ' ' + p.blurb).toLowerCase().includes(q)));
    const sorters = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating
    };
    return sorters[shop.sort] ? list.slice().sort(sorters[shop.sort]) : list;
  }

  function renderGrid() {
    const grid = $('#grid');
    if (!grid) return;
    const list = visibleProducts();
    const paint = () => {
      grid.innerHTML = list.map(cardHTML).join('');
      $('#resultCount').textContent = plural(list.length, 'product') + (shop.query.trim() ? ' for “' + shop.query.trim() + '”' : '');
      $('#emptyState').hidden = list.length > 0;
      U.observeReveals(grid);
    };
    if (shop.loaded) { paint(); return; }
    // First visit: show skeleton cards while the (simulated) catalogue request resolves.
    shop.loaded = true;
    grid.innerHTML = Array.from({ length: 8 }, skeletonHTML).join('');
    window.setTimeout(() => { if (grid.isConnected) paint(); }, 600);
  }

  // Slides the highlight pill under the selected chip or tab.
  function movePill(wrap, instant) {
    if (!wrap) return;
    const active = $('[aria-selected="true"]', wrap);
    const pill = wrap.firstElementChild;
    if (!active || !pill) return;
    if (instant) pill.style.transition = 'none';
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
  }

  function scrollToProducts() {
    const target = $('#products');
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;
    window.scrollTo({ top, behavior: U.reduceMotion ? 'auto' : 'smooth' });
  }

  /* =====================================================================
     Product detail
     ===================================================================== */

  function viewProduct(id) {
    const p = byId[id];
    if (!p) { view.innerHTML = messageViewHTML('Product not found', 'This product is no longer available.'); return; }
    S.track('view_product', { id });

    const off = discountPct(p);
    const low = p.stock <= 5;
    const related = products.filter((x) => x.id !== p.id && x.category === p.category)
      .concat(products.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 4);
    const stars = Array.from({ length: 5 }, (_, i) => `<span class="${i < Math.round(p.rating) ? '' : 'is-off'}">${icon('star')}</span>`).join('');

    view.innerHTML = `
      <section class="pdp container">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="#/">Shop</a><span>/</span><span>${esc(p.category)}</span><span>/</span><span aria-current="page">${esc(p.name)}</span>
        </nav>
        <div class="pdp__grid">
          <div class="pdp__media" style="--tile:${p.tile}">${art(p.id, p.name)}</div>
          <div class="pdp__info">
            <span class="eyebrow">${esc(p.category)}</span>
            <h1>${esc(p.name)}</h1>
            <div class="pdp__rating"><span class="stars">${stars}</span><span>${p.rating.toFixed(1)} · ${p.reviews} reviews</span></div>
            <div class="pdp__price">
              <strong>${money(p.price)}</strong>
              ${off ? `<s>${money(p.mrp)}</s><span class="pill">Save ${off}%</span>` : ''}
            </div>
            <p class="pdp__tax">Inclusive of all taxes · Free standard delivery above ${money(config.freeDeliveryThreshold)}</p>
            <p class="pdp__blurb">${esc(p.blurb)}</p>
            <div class="pdp__buy" data-id="${p.id}">
              ${qtyHTML(1, 'pdp-', true)}
              <button type="button" class="btn btn--primary btn--lg" data-action="pdp-add">Add to cart</button>
              <button type="button" class="btn btn--outline btn--lg" data-action="pdp-buy">Buy now</button>
            </div>
            <p class="stock${low ? ' is-low' : ''}"><i></i>${low ? `Only ${p.stock} left in stock` : 'In stock, dispatched within 24 hours'}</p>

            <form class="pin-check" id="pinCheck" novalidate>
              <label for="pinCheckInput">Check delivery to your PIN code</label>
              <div class="pin-check__row">
                <input id="pinCheckInput" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code">
                <button type="submit" class="btn btn--outline">Check</button>
              </div>
              <p class="pin-check__result" id="pinCheckResult" role="status"></p>
            </form>

            <div class="acc is-open">
              <button type="button" class="acc__btn" data-action="acc-toggle" aria-expanded="true">Highlights${icon('chevron')}</button>
              <div class="collapse"><div><ul class="acc__list">${p.highlights.map((h) => `<li>${icon('check')}<span>${esc(h)}</span></li>`).join('')}</ul></div></div>
            </div>
            <div class="acc">
              <button type="button" class="acc__btn" data-action="acc-toggle" aria-expanded="false">Delivery and returns${icon('chevron')}</button>
              <div class="collapse"><div><p class="acc__text">Standard delivery arrives in 3–5 working days and is free above ${money(config.freeDeliveryThreshold)}. Express delivery arrives in 1–2 working days. Return any unused item within 7 days for a full refund.</p></div></div>
            </div>
          </div>
        </div>

        <section class="related">
          <h2>You may also like</h2>
          <div class="grid">${related.map(cardHTML).join('')}</div>
        </section>
      </section>`;

    $('#pinCheck').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#pinCheckInput');
      const result = $('#pinCheckResult');
      const error = C.validators.pin(input.value);
      result.classList.toggle('is-error', !!error);
      if (error) { result.textContent = error; return; }
      const hit = C.lookupPin(input.value, pinDirectory);
      result.innerHTML = icon('truck') + '<span>' + (hit ? 'Delivering to ' + esc(hit.city) + '. ' : '') +
        'Arrives ' + etaRange(deliveryOptions[0]) + '</span>';
    });
    $('#pinCheckInput').addEventListener('input', (e) => { e.target.value = C.digitsOnly(e.target.value).slice(0, 6); });
  }

  /* =====================================================================
     Cart: actions and drawer
     ===================================================================== */

  function lineQty(cart, id) {
    const line = cart.find((l) => l.id === id);
    return line ? line.qty : 0;
  }

  function addToCart(id, qty, button) {
    const p = byId[id];
    const before = S.get().cart;
    const next = C.addItem(before, p, qty, config.maxQtyPerItem);
    if (lineQty(next, id) === lineQty(before, id)) {
      U.toast('You can order up to ' + lineQty(before, id) + ' of this item', 'warn');
      return false;
    }
    S.set({ cart: next }, 'cart');
    S.track('add_to_cart', { id, qty });
    if (button) {
      button.classList.add('is-added');
      window.setTimeout(() => button.classList.remove('is-added'), 1500);
    }
    U.toast(p.name + ' added to cart', 'ok', { action: { label: 'View cart', run: openCart } });
    return true;
  }

  function changeQty(id, delta) {
    const cart = S.get().cart;
    const current = lineQty(cart, id);
    if (!current) return;
    if (current + delta <= 0) { removeLine(id); return; }
    const next = C.setQty(cart, byId[id], current + delta, config.maxQtyPerItem);
    if (lineQty(next, id) === current) {
      U.toast('You can order up to ' + current + ' of this item', 'warn');
      return;
    }
    S.set({ cart: next }, 'cart');
  }

  function removeLine(id) {
    const cart = S.get().cart;
    const index = cart.findIndex((l) => l.id === id);
    if (index < 0) return;
    const removed = cart[index];
    S.set({ cart: C.removeItem(cart, id) }, 'cart');
    S.track('remove_from_cart', { id });
    U.toast(byId[id].name + ' removed', 'ok', {
      duration: 5000,
      action: {
        label: 'Undo',
        run: () => {
          const now = S.get().cart.slice();
          if (now.some((l) => l.id === id)) return;
          now.splice(Math.min(index, now.length), 0, removed);
          S.set({ cart: now }, 'cart');
        }
      }
    });
  }

  function initDrawer() {
    drawer.innerHTML = `
      <header class="drawer__head">
        <h2 id="cartTitle">Your cart<span class="drawer__count" id="drawerCount"></span></h2>
        <button type="button" class="icon-btn" data-action="close-cart" aria-label="Close cart">${icon('close')}</button>
      </header>
      <div class="drawer__meter" id="shipMeter">
        <p class="meter__msg" id="shipMsg"></p>
        <div class="meter"><span class="meter__fill" id="shipFill"></span></div>
      </div>
      <div class="drawer__body">
        <ul class="lines" id="drawerLines"></ul>
        <div class="drawer__empty">
          <span class="notice__icon">${icon('bag')}</span>
          <h3>Your cart is empty</h3>
          <p class="muted">Items you add are saved here, even if you leave and come back later.</p>
          <button type="button" class="btn btn--primary" data-action="close-cart">Start shopping</button>
        </div>
      </div>
      <footer class="drawer__foot" id="drawerFoot">
        ${totalsHTML()}
        <a class="btn btn--primary btn--lg btn--block" href="#/checkout" id="drawerCheckout">${icon('lock')}<span>Checkout securely</span></a>
        <p class="fine">${icon('shield')}<span>No surprises: this is the full amount you pay.</span></p>
      </footer>`;
  }

  // Keyed update of a cart list so quantity changes animate instead of re-rendering.
  function syncLines(list, totals) {
    if (!list) return;
    const existing = new Map($$('li.line:not(.is-leaving)', list).map((li) => [li.dataset.id, li]));
    totals.lines.forEach((line, i) => {
      let li = existing.get(line.id);
      if (li) {
        existing.delete(line.id);
      } else {
        li = U.html(lineHTML(line));
        li.classList.add('is-entering');
        list.insertBefore(li, list.children[i] || null);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => li.classList.remove('is-entering')));
      }
      const out = $('output', li);
      if (out.textContent !== String(line.qty)) {
        out.textContent = line.qty;
        U.pulse(out, 'is-bumped');
      }
      $('.line__total', li).textContent = money(line.lineTotal);
      $('[data-action="inc"]', li).disabled = line.qty >= Math.min(line.product.stock, config.maxQtyPerItem);
    });
    existing.forEach((li) => {
      li.classList.add('is-leaving');
      li.style.height = li.offsetHeight + 'px';
      void li.offsetHeight;
      li.style.height = '0px';
      window.setTimeout(() => li.remove(), 380);
    });
  }

  function paintTotals(root, t) {
    if (!root) return;
    const hasItems = t.lines.length > 0;
    U.animateNumber($('[data-total="subtotal"]', root), t.subtotal, money);
    U.animateNumber($('[data-total="total"]', root), t.total, money);
    $('[data-total-row="discount"]', root).hidden = !t.discount;
    $('[data-total="discount"]', root).textContent = '− ' + money(t.discount);
    $('[data-total="code"]', root).textContent = t.promo && t.promo.ok ? t.promo.code : '';
    const delivery = $('[data-total="delivery"]', root);
    delivery.textContent = !hasItems ? '—' : t.delivery === 0 ? 'Free' : money(t.delivery);
    delivery.classList.toggle('is-free', hasItems && t.delivery === 0);
    $('[data-total="tax"]', root).textContent = hasItems ? 'Includes ' + money(t.taxIncluded) + ' GST' : '';
  }

  function renderCart() {
    const t = getTotals();

    const badge = $('#cartCount');
    const previous = Number(badge.dataset.count || 0);
    badge.textContent = t.itemCount;
    badge.dataset.count = t.itemCount;
    badge.hidden = t.itemCount === 0;
    if (t.itemCount !== previous) U.pulse(badge, 'is-bumped');
    $('#cartBtn').setAttribute('aria-label', 'Open cart, ' + plural(t.itemCount, 'item'));

    $('#drawerCount').textContent = t.itemCount ? plural(t.itemCount, 'item') : '';
    drawer.classList.toggle('is-empty', t.lines.length === 0);
    syncLines($('#drawerLines'), t);
    paintTotals($('#drawerFoot'), t);

    const unlocked = t.lines.length > 0 && t.freeDeliveryRemaining === 0;
    $('#shipMeter').classList.toggle('is-done', unlocked);
    $('#shipFill').style.transform = 'scaleX(' + (t.lines.length ? t.freeDeliveryProgress : 0) + ')';
    $('#shipMsg').innerHTML = unlocked
      ? icon('check') + '<span>You have unlocked <strong>free standard delivery</strong></span>'
      : '<span>Add <strong>' + money(t.freeDeliveryRemaining) + '</strong> more for free standard delivery</span>';

    paintSummary(t);
  }

  function openCart() {
    if (drawer.classList.contains('is-open') || currentView === viewCheckout) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    window.requestAnimationFrame(() => backdrop.classList.add('is-visible'));
    document.body.classList.add('no-scroll');
    S.track('view_cart', { items: C.countItems(S.get().cart) });
    window.setTimeout(() => $('[data-action="close-cart"]', drawer).focus({ preventScroll: true }), 80);
  }

  function closeCart(restoreFocus) {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-visible');
    window.setTimeout(() => { if (!drawer.classList.contains('is-open')) backdrop.hidden = true; }, 340);
    document.body.classList.remove('no-scroll');
    if (restoreFocus !== false && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  /* =====================================================================
     Checkout
     ===================================================================== */

  function fieldHTML(name, label, attrs, cls) {
    return `
      <div class="field${cls ? ' ' + cls : ''}" data-field="${name}">
        <div class="field__control">
          <input id="f-${name}" name="${name}" placeholder=" " aria-describedby="f-${name}-msg" ${attrs || ''}>
          <label for="f-${name}">${label}</label>
          <span class="field__status" aria-hidden="true">${icon('check')}</span>
        </div>
        <p class="field__msg" id="f-${name}-msg" role="alert"><span></span></p>
      </div>`;
  }

  function stepHTML(step, body) {
    return `
      <section class="step" data-step="${step.n}" aria-labelledby="step${step.n}-title">
        <header class="step__head">
          <span class="step__badge"><span>${step.n}</span>${icon('check')}</span>
          <h2 id="step${step.n}-title">${step.title}</h2>
          <button type="button" class="link step__edit" data-action="edit-step" data-step="${step.n}">Edit</button>
        </header>
        <div class="step__summary collapse"><div><div class="step__summary-text" data-summary="${step.n}"></div></div></div>
        <div class="step__panel collapse"><div><div class="step__inner">${body}</div></div></div>
      </section>`;
  }

  function viewCheckout() {
    const s = S.get();
    if (!s.cart.length) {
      checkout = null;
      view.innerHTML = messageViewHTML('Your cart is empty', 'Add a product to your cart to start checking out.');
      return;
    }
    if (!checkout) {
      checkout = { step: 1, method: 'upi', startedAt: Date.now(), contact: Object.assign({}, s.contact) };
      S.track('begin_checkout', { items: C.countItems(s.cart), value: getTotals().total });
    }

    const stepOne = `
      <div class="form-grid">
        ${fieldHTML('email', 'Email address', 'type="email" autocomplete="email" inputmode="email"')}
        ${fieldHTML('phone', 'Mobile number', 'type="tel" autocomplete="tel-national" inputmode="numeric" maxlength="10"')}
        ${fieldHTML('fullName', 'Full name', 'type="text" autocomplete="name"')}
        ${fieldHTML('pin', 'PIN code', 'type="text" autocomplete="postal-code" inputmode="numeric" maxlength="6"')}
        ${fieldHTML('address', 'Flat, house number and street', 'type="text" autocomplete="street-address"', 'field--full')}
        ${fieldHTML('city', 'City', 'type="text" autocomplete="address-level2"')}
        ${fieldHTML('state', 'State', 'type="text" autocomplete="address-level1"')}
      </div>
      <p class="field__note" id="pinNote" role="status"></p>
      <label class="check">
        <input type="checkbox" id="rememberMe" checked>
        <span class="check__box">${icon('check')}</span>
        <span>Save these details on this device for next time</span>
      </label>
      <div class="step__actions">
        <button type="button" class="btn btn--primary btn--lg" data-action="next-step">Continue to delivery<span class="btn__arrow">${icon('arrowRight')}</span></button>
      </div>`;

    const stepTwo = `
      <div class="options" role="radiogroup" aria-label="Delivery method">
        ${deliveryOptions.map((o) => `
          <label class="option">
            <input type="radio" name="delivery" value="${o.id}" ${o.id === s.deliveryId ? 'checked' : ''}>
            <span class="option__radio"></span>
            <span class="option__body"><strong>${esc(o.label)}</strong><span class="muted" data-eta="${o.id}"></span></span>
            <span class="option__price" data-fee="${o.id}"></span>
          </label>`).join('')}
      </div>
      <div class="step__actions">
        <button type="button" class="btn btn--primary btn--lg" data-action="next-step">Continue to payment<span class="btn__arrow">${icon('arrowRight')}</span></button>
      </div>`;

    const stepThree = `
      <div class="tabs" id="payTabs" role="tablist" aria-label="Payment method">
        <span class="tabs__pill" aria-hidden="true"></span>
        <button type="button" role="tab" class="tab" data-action="pay-method" data-method="upi" aria-selected="${checkout.method === 'upi'}">${icon('upi')}<span>UPI</span></button>
        <button type="button" role="tab" class="tab" data-action="pay-method" data-method="card" aria-selected="${checkout.method === 'card'}">${icon('card')}<span>Card</span></button>
        <button type="button" role="tab" class="tab" data-action="pay-method" data-method="cod" aria-selected="${checkout.method === 'cod'}">${icon('cash')}<span>Cash on delivery</span></button>
      </div>
      <div class="pay-panel" data-panel="upi" ${checkout.method === 'upi' ? '' : 'hidden'}>
        ${fieldHTML('upiId', 'UPI ID', 'type="text" autocomplete="off" autocapitalize="none" spellcheck="false"')}
        <p class="hint">You will approve the request in your UPI app. For this demo, use <code>demo@upi</code>.</p>
      </div>
      <div class="pay-panel" data-panel="card" ${checkout.method === 'card' ? '' : 'hidden'}>
        <div class="form-grid">
          ${fieldHTML('cardNumber', 'Card number', 'type="text" autocomplete="cc-number" inputmode="numeric" maxlength="23"', 'field--full field--card')}
          ${fieldHTML('expiry', 'Expiry (MM/YY)', 'type="text" autocomplete="cc-exp" inputmode="numeric" maxlength="5"')}
          ${fieldHTML('cvv', 'Security code', 'type="password" autocomplete="cc-csc" inputmode="numeric" maxlength="4"')}
          ${fieldHTML('cardName', 'Name on card', 'type="text" autocomplete="cc-name"', 'field--full')}
        </div>
        <p class="hint">Demo only: use the test card <code>4111 1111 1111 1111</code>, any future date and any code.</p>
      </div>
      <div class="pay-panel" data-panel="cod" ${checkout.method === 'cod' ? '' : 'hidden'}>
        <p class="cod-note">${icon('cash')}<span>Pay in cash or by UPI when your order arrives. There is no extra charge for cash on delivery.</span></p>
      </div>
      <button type="submit" class="btn btn--primary btn--lg btn--block pay-btn" id="payBtn">
        <span class="pay-btn__label">${icon('lock')}<span id="payLabel"></span></span>
        <span class="pay-btn__spinner" aria-hidden="true"></span>
      </button>
      <p class="fine fine--center">${icon('shield')}<span>Payments are encrypted. Card details are never stored.</span></p>`;

    view.innerHTML = `
      <section class="checkout container">
        <div class="checkout__main">
          <a class="back-link" href="#/">${icon('arrowLeft')}<span>Continue shopping</span></a>
          <div class="checkout__title">
            <h1>Checkout</h1>
            <span class="guest-note">${icon('bolt')}<span>Guest checkout, no account needed</span></span>
          </div>
          <div class="progress" id="progress">
            <span class="progress__track" aria-hidden="true"><span class="progress__fill"></span></span>
            <ol aria-label="Checkout progress">
              ${STEPS.map((st) => `<li class="progress__step" data-progress="${st.n}"><span class="progress__dot"><span>${st.n}</span>${icon('check')}</span><span>${st.short}</span></li>`).join('')}
            </ol>
          </div>
          <form id="checkoutForm" novalidate>
            ${stepHTML(STEPS[0], stepOne)}
            ${stepHTML(STEPS[1], stepTwo)}
            ${stepHTML(STEPS[2], stepThree)}
          </form>
          <p class="demo-note">Prototype build: payments and emails are simulated, and nothing leaves this browser.</p>
        </div>

        <aside class="summary" id="summary" aria-label="Order summary">
          <button type="button" class="summary__toggle" data-action="toggle-summary" aria-expanded="false">
            <span class="summary__toggle-label">${icon('bag')}<span>Order summary</span>${icon('chevron')}</span>
            <strong data-total="mini"></strong>
          </button>
          <div class="summary__panel collapse"><div><div class="summary__inner">
            <h2>Order summary</h2>
            <ul class="lines lines--compact" id="summaryLines"></ul>
            <div class="promo" id="promo">
              <button type="button" class="promo__toggle" data-action="toggle-promo" aria-expanded="false">${icon('tag')}<span>Have a promo code?</span>${icon('chevron')}</button>
              <div class="promo__panel collapse"><div><div class="promo__inner">
                <div class="promo__row">
                  <input id="promoInput" placeholder="Enter code" aria-label="Promo code" autocapitalize="characters" autocomplete="off" spellcheck="false">
                  <button type="button" class="btn btn--outline" data-action="apply-promo">Apply</button>
                </div>
                <p class="promo__msg" id="promoMsg" role="alert"></p>
                <p class="hint">New here? Try <button type="button" class="link" data-action="use-promo" data-code="WELCOME10">WELCOME10</button></p>
              </div></div></div>
              <div class="promo__applied" id="promoApplied" hidden>
                ${icon('tag')}<span><strong id="promoCode"></strong><small id="promoLabel"></small></span>
                <button type="button" class="icon-btn icon-btn--sm" data-action="remove-promo" aria-label="Remove promo code">${icon('close')}</button>
              </div>
            </div>
            ${totalsHTML()}
            <ul class="trust">
              <li>${icon('shield')}<span>Secure, encrypted payment</span></li>
              <li>${icon('refresh')}<span>Free returns within 7 days</span></li>
              <li>${icon('truck')}<span>Delivery cost shown before you pay</span></li>
            </ul>
          </div></div></div>
        </aside>
      </section>`;

    // Restore saved details so returning shoppers do not retype them.
    CONTACT_FIELDS.forEach((name) => {
      const input = $('#f-' + name);
      if (checkout.contact[name]) input.value = checkout.contact[name];
    });

    const form = $('#checkoutForm');
    form.addEventListener('input', onCheckoutInput);
    form.addEventListener('focusout', (e) => {
      const input = e.target;
      if (!FIELD_RULES[input.name] || !input.value) return;
      input.dataset.touched = '1';
      validateField(input);
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'delivery') S.set({ deliveryId: e.target.value }, 'delivery');
      if (e.target.id === 'rememberMe') saveContact();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (checkout.step < STEPS.length) actions['next-step'](); else placeOrder();
    });
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || checkout.step === STEPS.length) return;
      e.preventDefault();
      actions['next-step']();
    });

    setStep(checkout.step, false);
    paintSummary(getTotals());
    movePill($('#payTabs'), true);
    return () => window.clearTimeout(pinTimer);
  }

  const FIELD_RULES = {
    email: (v) => C.validators.email(v),
    phone: (v) => C.validators.phone(v),
    fullName: (v) => C.validators.fullName(v),
    pin: (v) => C.validators.pin(v),
    address: (v) => C.validators.address(v),
    city: (v) => C.validators.city(v),
    state: (v) => C.validators.state(v),
    upiId: (v) => C.validators.upiId(v),
    cardNumber: (v) => C.validators.cardNumber(v),
    expiry: (v) => C.validators.expiry(v),
    cvv: (v) => C.validators.cvv(v, C.cardBrand($('#f-cardNumber').value)),
    cardName: (v) => C.validators.cardName(v)
  };

  function validateField(input) {
    const message = FIELD_RULES[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('is-invalid', !!message);
    field.classList.toggle('is-valid', !message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    // Keep the previous text while the message collapses, so it does not jump.
    if (message) $('.field__msg span', field).textContent = message;
    return !message;
  }

  function validateStep(n) {
    const step = $('.step[data-step="' + n + '"]', view);
    const inputs = $$('input[name]', step).filter((i) => FIELD_RULES[i.name] && !i.closest('[hidden]'));
    let firstInvalid = null;
    inputs.forEach((input) => {
      input.dataset.touched = '1';
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      U.pulse(firstInvalid.closest('.field'), 'is-shaking');
    }
    return !firstInvalid;
  }

  function readContact() {
    const contact = {};
    CONTACT_FIELDS.forEach((name) => { contact[name] = $('#f-' + name).value.trim(); });
    return contact;
  }

  function saveContact() {
    if (!checkout || !$('#checkoutForm')) return;
    checkout.contact = readContact();
    S.set({ contact: $('#rememberMe').checked ? checkout.contact : {} }, 'contact');
  }
  const saveContactSoon = U.debounce(saveContact, 300);

  let pinTimer = 0;
  function lookupPinCode(input) {
    const pin = input.value;
    const note = $('#pinNote');
    const fields = [$('#f-city'), $('#f-state')];
    window.clearTimeout(pinTimer);
    fields.forEach((el) => el.closest('.field').classList.remove('is-loading'));
    note.classList.remove('is-visible');
    if (C.validators.pin(pin)) return;

    const hit = C.lookupPin(pin, pinDirectory);
    if (!hit) {
      note.innerHTML = icon('mapPin') + '<span>We deliver to ' + esc(pin) + '. Please enter your city and state.</span>';
      note.classList.add('is-visible');
      return;
    }
    // Simulated round trip to the PIN-code service.
    fields.forEach((el) => el.closest('.field').classList.add('is-loading'));
    pinTimer = window.setTimeout(() => {
      fields.forEach((el) => el.closest('.field').classList.remove('is-loading'));
      if (!input.isConnected || input.value !== pin) return;
      fields[0].value = hit.city;
      fields[1].value = hit.state;
      fields.forEach((el) => {
        el.dataset.touched = '1';
        validateField(el);
        U.pulse(el.closest('.field'), 'is-autofilled');
      });
      note.innerHTML = icon('truck') + '<span>Delivering to ' + esc(hit.city) + ', ' + esc(hit.state) + '. City and state filled in for you.</span>';
      note.classList.add('is-visible');
      saveContact();
    }, 380);
  }

  function onCheckoutInput(e) {
    const input = e.target;
    const name = input.name;
    if (name === 'phone') input.value = C.digitsOnly(input.value).slice(0, 10);
    if (name === 'pin') { input.value = C.digitsOnly(input.value).slice(0, 6); lookupPinCode(input); }
    if (name === 'cvv') input.value = C.digitsOnly(input.value).slice(0, 4);
    if (name === 'expiry') input.value = C.formatExpiry(input.value);
    if (name === 'cardNumber') {
      input.value = C.formatCardNumber(input.value);
      const brand = C.cardBrand(input.value);
      input.parentElement.dataset.brand = BRAND_NAMES[brand] || '';
    }
    if (FIELD_RULES[name] && input.dataset.touched) validateField(input);
    if (CONTACT_FIELDS.includes(name)) saveContactSoon();
  }

  function setStep(n, focus) {
    checkout.step = n;
    $$('.step', view).forEach((el) => {
      const k = Number(el.dataset.step);
      el.classList.toggle('is-active', k === n);
      el.classList.toggle('is-done', k < n);
      el.classList.toggle('is-upcoming', k > n);
      $('.step__panel', el).toggleAttribute('inert', k !== n);
    });
    $$('.progress__step', view).forEach((el) => {
      const k = Number(el.dataset.progress);
      el.classList.toggle('is-current', k === n);
      el.classList.toggle('is-done', k < n);
      if (k === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    $('#progress').style.setProperty('--progress', (n - 1) / (STEPS.length - 1));
    paintStepSummaries();
    if (n === 3) window.setTimeout(() => movePill($('#payTabs'), true), 0);
    if (focus === false) return;

    // Wait for the panels to finish resizing, then bring the active step into view.
    window.setTimeout(() => {
      const active = $('.step.is-active', view);
      if (!active) return;
      const top = active.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: U.reduceMotion ? 'auto' : 'smooth' });
      const controls = $$('input:not([type="checkbox"]):not([type="radio"]), input:checked, [role="tab"][aria-selected="true"]', $('.step__panel', active))
        .filter((el) => !el.closest('[hidden]'));
      const target = controls.find((el) => el.tagName === 'INPUT') || controls[0];
      if (target) target.focus({ preventScroll: true });
    }, U.reduceMotion ? 0 : 420);
  }

  function paintStepSummaries() {
    if (!checkout || !$('#checkoutForm')) return;
    const c = checkout.contact || {};
    const one = $('[data-summary="1"]', view);
    one.innerHTML = `<span>${esc(c.fullName)} · ${esc(c.email)} · +91 ${esc(c.phone)}</span>` +
      `<span>${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.pin)}</span>`;
    const t = getTotals();
    const option = t.deliveryOption;
    $('[data-summary="2"]', view).innerHTML = `<span>${esc(option.label)} · ${t.delivery ? money(t.delivery) : 'Free'}</span>` +
      `<span>Arrives ${etaRange(option)}</span>`;
  }

  function paintSummary(t) {
    const summary = $('#summary');
    if (!summary || !checkout) return;
    syncLines($('#summaryLines'), t);
    paintTotals(summary, t);
    U.animateNumber($('[data-total="mini"]', summary), t.total, money);

    const applied = t.promo && t.promo.ok;
    $('#promoApplied').hidden = !applied;
    $('.promo__toggle', summary).hidden = !!applied;
    if (applied) {
      $('#promoCode').textContent = t.promo.code;
      $('#promoLabel').textContent = t.promo.discount ? 'You save ' + money(t.promo.discount) : t.promo.message;
      $('#promo').classList.remove('is-open');
      $('.promo__toggle', summary).setAttribute('aria-expanded', 'false');
    }

    deliveryOptions.forEach((o) => {
      const fee = getTotals(o.id).delivery;
      const feeEl = $('[data-fee="' + o.id + '"]', view);
      feeEl.textContent = fee === 0 ? 'Free' : money(fee);
      feeEl.classList.toggle('is-free', fee === 0);
      $('[data-eta="' + o.id + '"]', view).textContent = 'Arrives ' + etaRange(o);
    });

    $('#payLabel').textContent = (checkout.method === 'cod' ? 'Place order · ' : 'Pay ') + money(t.total);
    paintStepSummaries();
  }

  function applyPromo(code) {
    const result = C.evaluatePromo(code, getTotals().subtotal, promoCodes);
    const msg = $('#promoMsg');
    if (!result.ok) {
      msg.textContent = result.message;
      U.pulse($('.promo__row', view), 'is-shaking');
      return;
    }
    msg.textContent = '';
    $('#promoInput').value = '';
    S.set({ promoCode: result.code }, 'promo');
    S.track('apply_promo', { code: result.code });
    U.toast(result.code + ' applied. ' + (result.discount ? 'You save ' + money(result.discount) : result.message));
  }

  function paymentSummary() {
    if (checkout.method === 'upi') return 'UPI · ' + $('#f-upiId').value.trim();
    if (checkout.method === 'cod') return 'Cash on delivery';
    const number = C.digitsOnly($('#f-cardNumber').value);
    return (BRAND_NAMES[C.cardBrand(number)] || 'Card') + ' ending ' + number.slice(-4);
  }

  function placeOrder() {
    if (!checkout || checkout.step !== 3 || !validateStep(3)) return;
    const button = $('#payBtn');
    if (button.classList.contains('is-loading')) return;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    const payment = paymentSummary(); // only the method and last four digits are kept

    // Simulated payment authorisation.
    window.setTimeout(() => {
      const s = S.get();
      const t = getTotals();
      const id = C.generateOrderId();
      const order = {
        id,
        placedAt: Date.now(),
        durationMs: Date.now() - checkout.startedAt,
        lines: t.lines.map((l) => ({ id: l.id, name: l.product.name, qty: l.qty, price: l.product.price, lineTotal: l.lineTotal })),
        totals: {
          subtotal: t.subtotal, discount: t.discount, delivery: t.delivery, total: t.total,
          taxIncluded: t.taxIncluded, promoCode: t.promo && t.promo.ok ? t.promo.code : ''
        },
        contact: checkout.contact,
        delivery: { label: t.deliveryOption.label, eta: etaRange(t.deliveryOption) },
        payment
      };
      S.track('purchase', { id, value: t.total, method: checkout.method, seconds: Math.round(order.durationMs / 1000) });
      checkout = null;
      S.set({ orders: Object.assign({}, s.orders, { [id]: order }), cart: [], promoCode: '' }, 'order');
      window.location.hash = '#/order/' + id;
    }, 1300);
  }

  /* =====================================================================
     Order confirmation
     ===================================================================== */

  function formatDuration(ms) {
    const seconds = Math.max(1, Math.round(ms / 1000));
    if (seconds < 60) return seconds + ' seconds';
    const minutes = Math.floor(seconds / 60);
    return minutes + ' min ' + (seconds % 60) + ' s';
  }

  function viewOrder(id) {
    const order = S.get().orders[id];
    if (!order) { view.innerHTML = messageViewHTML('Order not found', 'We could not find an order with that number on this device.'); return; }
    const c = order.contact;
    const firstName = String(c.fullName || '').split(' ')[0];

    view.innerHTML = `
      <section class="confirm container">
        <div class="confirm__head">
          <svg class="tick" viewBox="0 0 72 72" aria-hidden="true">
            <circle class="tick__ring" cx="36" cy="36" r="33"/>
            <path class="tick__mark" d="m22 37 10 10 19-21"/>
          </svg>
          <p class="eyebrow">Order ${esc(order.id)}</p>
          <h1><span>Thank you, ${esc(firstName)}.</span> <span>Your order is confirmed.</span></h1>
          <p class="confirm__lead">We have sent a receipt to <strong>${esc(c.email)}</strong>. Estimated arrival: <strong>${esc(order.delivery.eta)}</strong>.</p>
        </div>

        <ol class="track" aria-label="Order status">
          <li class="is-done">Confirmed</li><li>Packed</li><li>Shipped</li><li>Delivered</li>
        </ol>

        <div class="confirm__grid">
          <div class="panel">
            <h2>Order summary</h2>
            <ul class="mini-lines">
              ${order.lines.map((l) => `
                <li>
                  <span class="line__media" style="--tile:${byId[l.id] ? byId[l.id].tile : '#EEE'}">${art(l.id, '')}</span>
                  <span class="mini-lines__name">${esc(l.name)}<small>Qty ${l.qty}</small></span>
                  <strong>${money(l.lineTotal)}</strong>
                </li>`).join('')}
            </ul>
            ${staticTotalsHTML(order.totals)}
          </div>
          <div class="confirm__side">
            <div class="panel panel--sm"><h3>${icon('mapPin')}Delivering to</h3><p>${esc(c.fullName)}<br>${esc(c.address)}<br>${esc(c.city)}, ${esc(c.state)} ${esc(c.pin)}<br>+91 ${esc(c.phone)}</p></div>
            <div class="panel panel--sm"><h3>${icon('truck')}Delivery</h3><p>${esc(order.delivery.label)}<br>Arrives ${esc(order.delivery.eta)}</p></div>
            <div class="panel panel--sm"><h3>${icon('card')}Payment</h3><p>${esc(order.payment)}</p></div>
          </div>
        </div>

        <p class="confirm__metric">${icon('bolt')}<span>You checked out in <strong>${formatDuration(order.durationMs)}</strong> across <strong>3 steps</strong>, with no account and no redirects.</span></p>
        <div class="confirm__actions">
          <a class="btn btn--primary btn--lg" href="#/">Continue shopping</a>
          <a class="btn btn--outline btn--lg" href="#/orders">View all orders</a>
        </div>
        <p class="demo-note">Prototype build: payments and emails are simulated, and nothing leaves this browser.</p>
      </section>`;
  }

  /* =====================================================================
     My orders
     ===================================================================== */

  const MAX_ORDER_THUMBS = 4;

  function orderCardHTML(order) {
    const items = order.lines.reduce((sum, l) => sum + l.qty, 0);
    const extra = order.lines.length - MAX_ORDER_THUMBS;
    return `
      <li class="panel order-card" data-order="${esc(order.id)}">
        <div class="order-card__head">
          <div>
            <p class="eyebrow">Order ${esc(order.id)}<span class="pill">Confirmed</span></p>
            <p class="order-card__placed">Placed ${esc(C.formatDate(new Date(order.placedAt), config.locale))} · ${plural(items, 'item')}</p>
          </div>
          <strong class="order-card__total">${money(order.totals.total)}</strong>
        </div>
        <div class="order-card__items">
          <div class="order-card__thumbs" aria-hidden="true">
            ${order.lines.slice(0, MAX_ORDER_THUMBS).map((l) => `<span class="line__media" style="--tile:${byId[l.id] ? byId[l.id].tile : '#EEE'}">${art(l.id, '')}</span>`).join('')}
            ${extra > 0 ? `<span class="order-card__more">+${extra}</span>` : ''}
          </div>
          <p class="order-card__names">${esc(order.lines.map((l) => l.name).join(', '))}</p>
        </div>
        <div class="order-card__foot">
          <p class="order-card__eta">${icon('truck')}<span>Estimated arrival: <strong>${esc(order.delivery.eta)}</strong><small>${esc(order.delivery.label)}</small></span></p>
          <a class="btn btn--outline" href="#/order/${esc(order.id)}" aria-label="View order ${esc(order.id)}">View order</a>
        </div>
      </li>`;
  }

  function viewOrders() {
    const orders = Object.values(S.get().orders).sort((a, b) => b.placedAt - a.placedAt);
    if (!orders.length) { view.innerHTML = messageViewHTML('No orders yet', 'Orders you place on this device will show up here.'); return; }

    view.innerHTML = `
      <section class="orders container">
        <div class="orders__head">
          <h1>My orders</h1>
          <p>${plural(orders.length, 'order')} placed on this device, newest first.</p>
        </div>
        <ul class="orders__list">${orders.map(orderCardHTML).join('')}</ul>
      </section>`;
  }

  /* =====================================================================
     Router
     ===================================================================== */

  const routes = [
    [/^#\/?$/, viewHome],
    [/^#\/product\/([\w-]+)$/, viewProduct],
    [/^#\/checkout$/, viewCheckout],
    [/^#\/orders$/, viewOrders],
    [/^#\/order\/([\w-]+)$/, viewOrder]
  ];
  let teardown = null;

  function mount(fn, args) {
    if (teardown) { teardown(); teardown = null; }
    closeCart(false);
    currentView = fn;
    document.body.classList.toggle('is-checkout', fn === viewCheckout);
    view.classList.remove('view-enter');
    teardown = fn.apply(null, args) || null;
    void view.offsetWidth;
    view.classList.add('view-enter');
    window.scrollTo(0, 0);
    U.observeReveals(view);
  }

  function route() {
    const hash = window.location.hash || '#/';
    for (const [pattern, fn] of routes) {
      const match = hash.match(pattern);
      if (match) { mount(fn, match.slice(1)); return; }
    }
    mount(viewHome, []);
  }

  /* =====================================================================
     Events
     ===================================================================== */

  const actions = {
    'add': (el) => addToCart(el.dataset.id, 1, el),
    'open-cart': () => openCart(),
    'close-cart': () => closeCart(),
    'scroll-products': () => scrollToProducts(),
    'category': (el) => {
      shop.category = el.dataset.category;
      $$('.chip', el.parentElement).forEach((chip) => chip.setAttribute('aria-selected', String(chip === el)));
      movePill(el.parentElement);
      renderGrid();
    },
    'clear-search': () => {
      shop.query = '';
      shop.category = 'All';
      $('#searchInput').value = '';
      mount(viewHome, []);
      scrollToProducts();
    },
    'inc': (el) => changeQty(el.closest('.line').dataset.id, 1),
    'dec': (el) => changeQty(el.closest('.line').dataset.id, -1),
    'remove': (el) => removeLine(el.closest('.line').dataset.id),
    'pdp-inc': (el) => stepPdpQty(el, 1),
    'pdp-dec': (el) => stepPdpQty(el, -1),
    'pdp-add': (el) => {
      const wrap = el.closest('.pdp__buy');
      addToCart(wrap.dataset.id, Number($('output', wrap).textContent), null);
    },
    'pdp-buy': (el) => {
      const wrap = el.closest('.pdp__buy');
      const id = wrap.dataset.id;
      // Express path: make sure the item is in the cart, then go straight to checkout.
      if (!lineQty(S.get().cart, id)) {
        S.set({ cart: C.addItem(S.get().cart, byId[id], Number($('output', wrap).textContent), config.maxQtyPerItem) }, 'cart');
        S.track('add_to_cart', { id, source: 'buy_now' });
      }
      window.location.hash = '#/checkout';
    },
    'acc-toggle': (el) => {
      const open = el.parentElement.classList.toggle('is-open');
      el.setAttribute('aria-expanded', String(open));
    },
    'next-step': () => {
      if (!validateStep(checkout.step)) return;
      if (checkout.step === 1) saveContact();
      S.track('checkout_step_complete', { step: checkout.step });
      setStep(checkout.step + 1);
    },
    'edit-step': (el) => setStep(Number(el.dataset.step)),
    'pay-method': (el) => {
      checkout.method = el.dataset.method;
      $$('.tab', el.parentElement).forEach((tab) => tab.setAttribute('aria-selected', String(tab === el)));
      movePill(el.parentElement);
      $$('.pay-panel', view).forEach((panel) => { panel.hidden = panel.dataset.panel !== checkout.method; });
      $('#payLabel').textContent = (checkout.method === 'cod' ? 'Place order · ' : 'Pay ') + money(getTotals().total);
    },
    'toggle-summary': (el) => {
      const open = $('#summary').classList.toggle('is-open');
      el.setAttribute('aria-expanded', String(open));
    },
    'toggle-promo': (el) => {
      const open = $('#promo').classList.toggle('is-open');
      el.setAttribute('aria-expanded', String(open));
      if (open) window.setTimeout(() => $('#promoInput').focus({ preventScroll: true }), 200);
    },
    'apply-promo': () => applyPromo($('#promoInput').value),
    'use-promo': (el) => applyPromo(el.dataset.code),
    'remove-promo': () => S.set({ promoCode: '' }, 'promo')
  };

  function stepPdpQty(el, delta) {
    const wrap = el.closest('.pdp__buy');
    const p = byId[wrap.dataset.id];
    const out = $('output', wrap);
    const limit = Math.min(p.stock, config.maxQtyPerItem);
    const next = Math.max(1, Math.min(limit, Number(out.textContent) + delta));
    if (next === Number(out.textContent)) {
      if (delta > 0) U.toast('You can order up to ' + limit + ' of this item', 'warn');
      return;
    }
    out.textContent = next;
    U.pulse(out, 'is-bumped');
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const run = actions[el.dataset.action];
    if (run) run(el, e);
  });

  backdrop.addEventListener('click', () => closeCart());

  document.addEventListener('keydown', (e) => {
    const drawerOpen = drawer.classList.contains('is-open');
    if (e.key === 'Escape' && drawerOpen) { closeCart(); return; }

    // Keep keyboard focus inside the open cart drawer.
    if (e.key === 'Tab' && drawerOpen) {
      const focusable = $$('a[href], button:not([disabled]), input', drawer).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }

    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing && currentView !== viewCheckout) {
      e.preventDefault();
      $('#searchInput').focus();
    }
    if (e.key === 'Enter' && document.activeElement.id === 'promoInput') {
      e.preventDefault();
      applyPromo(document.activeElement.value);
    }
  });

  $('#searchInput').addEventListener('input', U.debounce((e) => {
    shop.query = e.target.value;
    if (currentView !== viewHome) { window.location.hash = '#/'; }
    else renderGrid();
    if (shop.query.trim()) window.setTimeout(scrollToProducts, 60);
  }, 160));

  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 8), { passive: true });
  window.addEventListener('resize', U.debounce(() => { movePill($('#chips'), true); movePill($('#payTabs'), true); }, 120));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { movePill($('#chips'), true); movePill($('#payTabs'), true); });
  }
  window.addEventListener('hashchange', route);

  S.subscribe((state, reason) => {
    // A promo that no longer qualifies (cart shrank) is removed with an explanation.
    if (state.promoCode && state.cart.length) {
      const t = getTotals();
      if (t.promo && !t.promo.ok) {
        U.toast(t.promo.code + ' removed. ' + t.promo.message, 'warn');
        S.set({ promoCode: '' }, 'promo');
        return;
      }
    }
    renderCart();
    if (currentView === viewCheckout && !state.cart.length && reason !== 'order') mount(viewCheckout, []);
  });

  /* =====================================================================
     Start
     ===================================================================== */

  initDrawer();
  renderCart();
  route();

  // Cart recovery: remind returning shoppers that their cart was saved.
  try {
    const items = C.countItems(S.get().cart);
    if (items && !window.sessionStorage.getItem('swiftcart:session') && currentView !== viewCheckout) {
      window.setTimeout(() => U.toast('Welcome back. Your cart was saved (' + plural(items, 'item') + ')', 'ok', {
        duration: 6000,
        action: { label: 'View cart', run: openCart }
      }), 900);
    }
    window.sessionStorage.setItem('swiftcart:session', '1');
  } catch (err) {
    /* sessionStorage unavailable: skip the reminder */
  }
})();
