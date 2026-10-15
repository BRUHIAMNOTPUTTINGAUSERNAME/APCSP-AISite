// Voltbook site logic: accounts, cart, checkout, orders and the dynamic parts of each page.
// Accounts, carts and orders are saved in the visitor's browser (localStorage).
(function () {
  const D = window.VB_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page;

  // — storage —
  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  function remove(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  function session() { try { return localStorage.getItem('vb.session') || null; } catch (e) { return null; } }

  const state = { user: session() };
  state.cart = load('vb.cart.' + (state.user || 'guest'), []);
  state.orders = state.user ? load('vb.orders.' + state.user, []) : [];

  // — helpers —
  const find = id => D.products.find(p => p.id === id);
  const catName = slug => { const c = D.cats.find(x => x.slug === slug); return c ? c.name : ''; };
  const fmt = (n, cents) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
  const href = p => 'product.html?id=' + encodeURIComponent(p.id);
  const users = () => load('vb.users', {});
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
  const fromPrice = slug => fmt(Math.min(...D.products.filter(p => p.cat === slug).map(p => p.price)));
  const SHIPPING = { standard: { name: 'Standard', cost: 0, days: 2 }, express: { name: 'Express', cost: 19, days: 1 } };
  function totals(items, method) {
    const sub = items.reduce((a, x) => { const p = find(x.id); return a + (p ? p.price * x.qty : 0); }, 0);
    const ship = method ? SHIPPING[method].cost : 0;
    const tax = Math.round(sub * 0.08 * 100) / 100;
    return { sub, ship, tax, total: sub + ship + tax };
  }
  // The date a package arrives after `days` business days (weekends skipped).
  function arrives(days, from = new Date()) {
    const d = new Date(from);
    while (days > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) days--; }
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const media = (src, alt, cls) => `<div class="lighten media ${cls}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></div>`;
  // Sends logged-out visitors to the login page, then back here afterwards.
  function requireLogin(msg) {
    if (state.user) return true;
    if (msg) flashNext(msg);
    location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
    return false;
  }

  // — toast —
  let toastTimer;
  function flash(msg, link) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast elev-md'; t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.innerHTML = '<i class="ph ph-check-circle"></i><span></span>' + (link ? `<a href="${link.href}">${esc(link.text)}</a>` : '');
    $('span', t).textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, link ? 4000 : 2400);
  }
  // A message queued for the next page (e.g. "Welcome back" after the login redirect).
  function flashNext(msg) { try { sessionStorage.setItem('vb.flash', msg); } catch (e) { /* ignore */ } }
  function showQueuedFlash() {
    try { const m = sessionStorage.getItem('vb.flash'); if (m) { sessionStorage.removeItem('vb.flash'); flash(m); } } catch (e) { /* ignore */ }
  }

  // — header —
  function renderHeader() {
    const u = state.user ? users()[state.user] : null;
    $$('[data-when="out"]').forEach(el => { el.hidden = !!state.user; });
    $$('[data-when="in"]').forEach(el => { el.hidden = !state.user; });
    $$('[data-user-name]').forEach(el => { el.textContent = u ? u.name : ''; });
    $$('[data-user-email]').forEach(el => { el.textContent = state.user || ''; });
    const n = state.cart.reduce((a, x) => a + x.qty, 0);
    $$('[data-cart-count]').forEach(el => { el.textContent = n; });
  }
  // Phone menu: the ☰ button shows and hides the links and search box.
  const header = $('.site-header'), toggle = $('.nav-toggle');
  function setMenu(open) {
    header.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('i', toggle).className = 'ph ' + (open ? 'ph-x' : 'ph-list');
  }
  if (toggle) {
    toggle.addEventListener('click', () => setMenu(!header.classList.contains('open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && header.classList.contains('open')) { setMenu(false); toggle.focus(); } });
  }
  // Keep the search box filled in on the results page.
  const q = (params.get('q') || '').trim();
  if (page === 'shop' && q) $$('input[name="q"]').forEach(i => { i.value = q; });

  // — cart —
  function setCart(cart) {
    state.cart = cart;
    save('vb.cart.' + (state.user || 'guest'), cart);
    renderHeader();
    if (page === 'cart') renderCart();
  }
  function add(id) {
    const c = state.cart, has = c.find(x => x.id === id);
    setCart(has ? c.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x) : [...c, { id, qty: 1 }]);
    flash(find(id).name + ' added to cart', page === 'cart' ? null : { href: 'cart.html', text: 'View cart' });
  }
  function qty(id, d) { setCart(state.cart.map(x => x.id === id ? { ...x, qty: x.qty + d } : x).filter(x => x.qty > 0)); }

  // — compare list (up to 3 laptops, remembered between pages) —
  const MAX_COMPARE = 3;
  const compareList = () => load('vb.compare', []).filter(find).slice(0, MAX_COMPARE);
  const setCompare = ids => save('vb.compare', ids.slice(0, MAX_COMPARE));

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) { e.preventDefault(); add(b.dataset.add); }
    const qb = e.target.closest('[data-qty]');
    if (qb) {
      const [id, d] = qb.dataset.qty.split(':');
      qty(id, d === 'all' ? -Infinity : Number(d));
      if (d === 'all') flash(find(id).name + ' removed from cart');
    }
    if (e.target.closest('[data-logout]')) logout();
    if (e.target.closest('[data-compare-clear]')) { setCompare([]); if (page === 'shop') syncCompare(); }
    const pw = e.target.closest('[data-pw-toggle]');
    if (pw) {
      const input = document.getElementById(pw.dataset.pwToggle), show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      pw.setAttribute('aria-pressed', show);
      pw.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      $('i', pw).className = 'ph ' + (show ? 'ph-eye-slash' : 'ph-eye');
    }
  });

  // — accounts —
  async function digest(s) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return btoa(unescape(encodeURIComponent(s))); }
  }
  function startSession(email, msg) {
    const guest = load('vb.cart.guest', []);
    let cart = load('vb.cart.' + email, []);
    guest.forEach(g => { const h = cart.find(x => x.id === g.id); cart = h ? cart.map(x => x.id === g.id ? { ...x, qty: x.qty + g.qty } : x) : [...cart, g]; });
    remove('vb.cart.guest');
    save('vb.cart.' + email, cart);
    try { localStorage.setItem('vb.session', email); } catch (e) { /* ignore */ }
    flashNext(msg);
    const next = params.get('next');
    location.href = next && /^[a-z0-9-]+\.html$/i.test(next) ? next : 'index.html';
  }
  function logout() {
    remove('vb.session');
    if (['account', 'checkout', 'order'].includes(page)) { flashNext('Logged out'); location.href = 'index.html'; return; }
    state.user = null;
    state.cart = load('vb.cart.guest', []);
    state.orders = [];
    renderHeader();
    if (page === 'cart') renderCart();
    if (page === 'login') renderLogin();
    flash('Logged out');
  }

  // — product cards —
  const card = p => `
    <div class="card elev-sm pad">
      ${media(p.img, p.name, 'ratio-4-3')}
      <span class="card-kicker">${esc(catName(p.cat))}</span>
      <a href="${href(p)}" class="card-title title-link">${esc(p.name)}</a>
      <p class="card-body strong">${esc(p.summary)}</p>
      <div class="price-row"><span class="price">${fmt(p.price)}</span><button class="btn btn-primary push" data-add="${p.id}"><i class="ph ph-plus"></i>Add</button></div>
    </div>`;

  function renderHome() {
    const f = D.cats[0];
    $('#featured').href = 'shop.html?cat=' + f.slug;
    $('#featured').innerHTML = `
      ${media(f.img, f.name + ' laptop', 'ratio-16-9 r-8')}
      <div class="featured-copy">
        <span class="card-kicker">Featured category</span>
        <h2>${esc(f.name)}</h2>
        <p class="muted">${esc(f.blurb)}</p>
        <span class="from">From ${fromPrice(f.slug)}</span>
        <span class="btn btn-primary">Shop ${esc(f.name.toLowerCase())} <i class="ph ph-arrow-right"></i></span>
      </div>`;
    $('#categories').innerHTML = D.cats.slice(1).map(c => `
      <a href="shop.html?cat=${c.slug}" class="card elev-sm card-link">
        ${media(c.img, c.name + ' laptop', 'ratio-4-3')}
        <div class="card-title">${esc(c.name)}</div>
        <p class="card-body">${esc(c.blurb)}</p>
        <div class="card-meta">From ${fromPrice(c.slug)} <i class="ph ph-arrow-right"></i></div>
      </a>`).join('');
    $('#best-sellers').innerHTML = D.bestSellers.map(id => card(find(id))).join('');
  }

  // — shop: category filter, search, sort and compare picks —
  function matches(p, query) {
    const r = D.reviews[p.id] || {};
    const hay = [p.name, catName(p.cat), p.cat, p.summary, p.cpu, p.ram, p.storage, p.gpu, p.display, r.bestFor].join(' ').toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  }
  function syncCompare() {
    const ids = compareList();
    $$('[data-compare]').forEach(cb => {
      cb.checked = ids.includes(cb.dataset.compare);
      cb.disabled = !cb.checked && ids.length >= MAX_COMPARE;
      cb.closest('.shop-card').classList.toggle('picked', cb.checked);
    });
    $('#compare-n').textContent = ids.length;
    $('#compare-bar').hidden = ids.length === 0;
  }
  function renderShop() {
    const cat = D.cats.find(c => c.slug === params.get('cat')) || null;
    const sortEl = $('#sort');
    if (q) {
      document.title = 'Search: ' + q + ' · Voltbook';
      $('#shop-crumb').textContent = 'Search';
      $('#shop-title').textContent = 'Results for “' + q + '”';
      $('#shop-blurb').innerHTML = '<a href="shop.html">Clear search</a>';
    } else {
      if (cat) document.title = cat.name + ' laptops · Voltbook';
      $('#shop-crumb').textContent = cat ? cat.name : 'Shop';
      $('#shop-title').textContent = cat ? cat.name : 'All laptops';
      $('#shop-blurb').textContent = cat ? cat.blurb : 'Every laptop we sell, tested in‑house.';
    }
    const chip = (name, url, on) => `<a href="${url}" class="btn ${on ? 'btn-primary' : 'btn-secondary'} chip"${on ? ' aria-current="page"' : ''}>${esc(name)}</a>`;
    $('#chips').innerHTML = chip('All', 'shop.html', !cat && !q) + D.cats.map(c => chip(c.name, 'shop.html?cat=' + c.slug, cat && cat.slug === c.slug)).join('');
    function draw() {
      let list = D.products.filter(p => (!cat || p.cat === cat.slug) && (!q || matches(p, q)));
      if (sortEl.value === 'low') list = [...list].sort((a, b) => a.price - b.price);
      if (sortEl.value === 'high') list = [...list].sort((a, b) => b.price - a.price);
      $('#shop-count').textContent = plural(list.length, 'laptop');
      $('#no-results').hidden = list.length > 0;
      $('#no-results-q').textContent = q;
      $('#shop-list').innerHTML = list.map(p => `
        <div class="card elev-sm pad shop-card">
          ${media(p.img, p.name, 'ratio-4-3')}
          <span class="card-kicker">${esc(catName(p.cat))}</span>
          <a href="${href(p)}" class="card-title title-link">${esc(p.name)}</a>
          <div class="tags"><span class="tag tag-neutral">${esc(p.ram)}</span><span class="tag tag-neutral">${esc(p.storage)}</span><span class="tag tag-neutral">${esc(p.battery)}</span></div>
          <p class="card-body strong">${esc(p.summary)}</p>
          <label class="compare-pick"><input type="checkbox" data-compare="${p.id}">Compare</label>
          <div class="price-row"><span class="price">${fmt(p.price)}</span><a href="${href(p)}" class="btn btn-ghost push">Details</a><button class="btn btn-primary" data-add="${p.id}"><i class="ph ph-plus"></i>Add to cart</button></div>
        </div>`).join('');
      syncCompare();
    }
    $('#shop-list').addEventListener('change', e => {
      const cb = e.target.closest('[data-compare]');
      if (!cb) return;
      const ids = compareList().filter(id => id !== cb.dataset.compare);
      setCompare(cb.checked ? [...ids, cb.dataset.compare] : ids);
      syncCompare();
    });
    sortEl.addEventListener('change', draw);
    draw();
  }

  function renderProduct() {
    const prod = find(params.get('id'));
    if (!prod) { $('#product').hidden = true; $('#missing').hidden = false; document.title = 'Page not found · Voltbook'; return; }
    const r = D.reviews[prod.id] || { bestFor: '', pros: [], cons: [] };
    document.title = prod.name + ' · Voltbook';
    const cn = catName(prod.cat);
    $('#p-crumbs').innerHTML = `<a href="shop.html">Shop</a> / <a href="shop.html?cat=${prod.cat}">${esc(cn)}</a> / ${esc(prod.name)}`;
    $('#p-media').innerHTML = `<img src="${esc(prod.img)}" alt="${esc(prod.name)}">`;
    $('#p-kicker').textContent = cn;
    $('#p-name').textContent = prod.name;
    $('#p-summary').textContent = prod.summary;
    $('#p-best').textContent = r.bestFor;
    $('#p-price').textContent = fmt(prod.price);
    $('#p-add').dataset.add = prod.id;
    $('#p-compare').addEventListener('click', () => {
      const ids = compareList().filter(id => id !== prod.id);
      setCompare([prod.id, ...ids]);
    });
    $('#p-specs').innerHTML = [['Processor', prod.cpu], ['Memory', prod.ram], ['Storage', prod.storage], ['Graphics', prod.gpu], ['Display', prod.display], ['Battery', prod.battery], ['Weight', prod.weight]]
      .map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('');
    $('#p-pros').innerHTML = r.pros.map(x => `<li>${esc(x)}</li>`).join('');
    $('#p-cons').innerHTML = r.cons.map(x => `<li>${esc(x)}</li>`).join('');
    const related = [...D.products.filter(p => p.cat === prod.cat && p.id !== prod.id), ...D.products.filter(p => p.cat !== prod.cat)].slice(0, 3);
    $('#related').innerHTML = related.map(p => `
      <a href="${href(p)}" class="card elev-sm card-link related-card">
        <span class="card-kicker">${esc(catName(p.cat))}</span><div class="card-title">${esc(p.name)}</div><p class="card-body">${esc(p.summary)}</p><div class="card-meta">${fmt(p.price)}</div>
      </a>`).join('');
  }

  // — compare page: three columns, each with its own laptop picker —
  function renderCompare() {
    let ids = compareList();
    if (!ids.length) ids = D.bestSellers.slice(0, 2);
    const num = s => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
    const rows = [
      ['Price', p => fmt(p.price), p => -p.price],
      ['Best for', p => (D.reviews[p.id] || {}).bestFor || ''],
      ['Processor', p => p.cpu],
      ['Memory', p => p.ram, p => num(p.ram)],
      ['Storage', p => p.storage, p => num(p.storage) * (/TB/.test(p.storage) ? 1000 : 1)],
      ['Graphics', p => p.gpu],
      ['Display', p => p.display],
      ['Battery', p => p.battery, p => num(p.battery)],
      ['Weight', p => p.weight, p => -num(p.weight)]
    ];
    function draw() {
      const cols = [0, 1, 2].map(i => find(ids[i]) || null);
      const picked = cols.filter(Boolean);
      const options = sel => '<option value="">Choose a laptop…</option>' + D.products.map(p => `<option value="${p.id}"${sel && sel.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
      const head = cols.map((p, i) => `<th scope="col"><div class="compare-col">
        <select class="input" data-col="${i}" aria-label="Laptop ${i + 1}">${options(p)}</select>
        ${p ? `<a href="${href(p)}" class="thumb">${media(p.img, p.name, '')}</a>
          <span class="card-kicker">${esc(catName(p.cat))}</span>
          <a href="${href(p)}" class="name">${esc(p.name)}</a>
          <div class="row-actions"><button class="btn btn-primary" data-add="${p.id}"><i class="ph ph-plus"></i>Add to cart</button><button class="btn btn-ghost" data-drop="${i}">Remove</button></div>`
        : '<span class="compare-empty">Pick a laptop to compare.</span>'}
      </div></th>`).join('');
      const body = rows.map(([label, show, score]) => {
        const best = score && picked.length > 1 ? Math.max(...picked.map(score)) : null;
        const isBest = p => best !== null && score(p) === best && picked.filter(x => score(x) === best).length < picked.length;
        return `<tr><td>${label}</td>${cols.map(p => p ? `<td class="${isBest(p) ? 'best' : ''}">${esc(show(p))}</td>` : '<td></td>').join('')}</tr>`;
      }).join('');
      $('#compare-table').innerHTML = `<thead><tr><th scope="col">Laptop</th>${head}</tr></thead><tbody>${body}</tbody>` +
        (picked.length > 1 ? '<caption class="compare-note">★ marks the best value in each row.</caption>' : '');
      setCompare(cols.filter(Boolean).map(p => p.id));
    }
    $('#compare-table').addEventListener('change', e => {
      const s = e.target.closest('[data-col]');
      if (!s) return;
      ids = [0, 1, 2].map(i => ids[i] || '');
      ids[Number(s.dataset.col)] = s.value;
      draw();
    });
    $('#compare-table').addEventListener('click', e => {
      const d = e.target.closest('[data-drop]');
      if (!d) return;
      ids = [0, 1, 2].map(i => ids[i] || '');
      ids[Number(d.dataset.drop)] = '';
      draw();
    });
    draw();
  }

  // — cart —
  function renderCart() {
    const items = state.cart.map(x => ({ ...x, p: find(x.id) })).filter(x => x.p);
    $('#cart-empty').hidden = items.length > 0;
    $('#cart-full').hidden = items.length === 0;
    if (!items.length) $('#empty-picks').innerHTML = D.bestSellers.slice(0, 4).map(id => card(find(id))).join('');
    const count = items.reduce((a, x) => a + x.qty, 0);
    $('#cart-count-label').textContent = plural(count, 'item');
    $('#cart-count-label').hidden = count === 0;
    $('#item-count').textContent = plural(count, 'item');
    $('#cart-list').innerHTML = items.map(({ p, qty: n }) => `
      <div class="cart-item">
        <a href="${href(p)}" class="thumb" tabindex="-1" aria-hidden="true">${media(p.img, '', '')}</a>
        <div class="info">
          <span class="card-kicker">${esc(catName(p.cat))}</span>
          <a href="${href(p)}" class="name">${esc(p.name)}</a>
          <span class="spec">${esc(p.cpu)} · ${esc(p.ram)} · ${esc(p.storage)}</span>
          <span class="stock"><i class="ph ph-check-circle"></i>In stock, ships free in 2 days</span>
          <button class="btn btn-ghost remove" data-qty="${p.id}:all"><i class="ph ph-trash"></i>Remove</button>
        </div>
        <div class="stepper" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button class="btn btn-icon" data-qty="${p.id}:-1" aria-label="Decrease quantity"${n <= 1 ? ' disabled' : ''}><i class="ph ph-minus"></i></button>
          <span class="qty" aria-live="polite">${n}</span>
          <button class="btn btn-icon" data-qty="${p.id}:1" aria-label="Increase quantity"><i class="ph ph-plus"></i></button>
        </div>
        <div class="line"><b>${fmt(p.price * n)}</b>${n > 1 ? `<span>${n} × ${fmt(p.price)}</span>` : ''}</div>
      </div>`).join('');
    const t = totals(state.cart);
    $('#subtotal').textContent = fmt(t.sub, true);
    $('#tax').textContent = fmt(t.tax, true);
    $('#total').textContent = fmt(t.total, true);
    const co = $('#checkout');
    co.href = state.user ? 'checkout.html' : 'login.html?next=checkout.html';
    $('span', co).textContent = state.user ? 'Check out' : 'Log in to check out';
  }

  // — checkout —
  function initCheckout() {
    if (!requireLogin('Log in or sign up to check out')) return;
    if (!state.cart.length) { location.replace('cart.html'); return; }
    const form = $('#checkout-form');
    const method = () => (form.querySelector('input[name="method"]:checked') || {}).value || 'standard';
    $('#eta-standard').textContent = 'Arrives ' + arrives(SHIPPING.standard.days);
    $('#eta-express').textContent = 'Arrives ' + arrives(SHIPPING.express.days);
    // Prefill from the account and the last address used.
    const u = users()[state.user] || {};
    const last = load('vb.address.' + state.user, null);
    form.elements.name.value = (last && last.name) || u.name || '';
    if (last) ['phone', 'address1', 'address2', 'city', 'state', 'zip'].forEach(k => { if (last[k]) form.elements[k].value = last[k]; });

    function drawReview() {
      $('#review-items').innerHTML = state.cart.map(x => { const p = find(x.id); return p ? `
        <li><span class="thumb">${media(p.img, '', '')}</span><span class="nm"><a href="${href(p)}">${esc(p.name)}</a><span>Qty ${x.qty}</span></span><span class="amt">${fmt(p.price * x.qty)}</span></li>` : ''; }).join('');
      const t = totals(state.cart, method());
      $('#co-subtotal').textContent = fmt(t.sub, true);
      $('#co-shipping').textContent = t.ship ? fmt(t.ship, true) : 'Free';
      $('#co-tax').textContent = fmt(t.tax, true);
      $('#co-total').textContent = fmt(t.total, true);
    }
    form.addEventListener('change', e => { if (e.target.name === 'method') drawReview(); });

    const messages = { name: 'Enter your full name.', address1: 'Enter your street address.', city: 'Enter your city.', state: 'Choose your state.', zip: 'Enter a 5‑digit ZIP code.' };
    function check(input) {
      const bad = !input.checkValidity();
      input.setAttribute('aria-invalid', bad);
      let err = document.getElementById(input.id + '-err');
      if (bad && !err) {
        err = document.createElement('span'); err.id = input.id + '-err'; err.className = 'field-err';
        input.setAttribute('aria-describedby', err.id);
        input.closest('.field').appendChild(err);
      }
      if (err) { err.textContent = bad ? messages[input.name] : ''; err.hidden = !bad; }
      return !bad;
    }
    // Once a field has been flagged, re-check it as the visitor types or picks.
    function recheck(e) {
      if (!messages[e.target.name] || !e.target.getAttribute('aria-invalid')) return;
      check(e.target);
      if (!$$('[aria-invalid="true"]', form).length) $('#checkout-error').hidden = true;
    }
    ['input', 'change'].forEach(t => form.addEventListener(t, recheck));
    form.addEventListener('blur', recheck, true);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.keys(messages).map(k => form.elements[k]);
      const bad = fields.filter(f => !check(f));
      if (bad.length) {
        $('span', $('#checkout-error')).textContent = 'Please fix the ' + plural(bad.length, 'highlighted field') + ' above.';
        $('#checkout-error').hidden = false;
        bad[0].focus();
        return;
      }
      $('#checkout-error').hidden = true;
      const f = new FormData(form), get = k => String(f.get(k) || '').trim();
      const ship = { name: get('name'), phone: get('phone'), address1: get('address1'), address2: get('address2'), city: get('city'), state: get('state'), zip: get('zip') };
      save('vb.address.' + state.user, ship);
      const m = method(), items = state.cart.filter(x => find(x.id)), t = totals(items, m);
      const order = {
        id: 'VB-' + Date.now().toString().slice(-6), date: new Date().toLocaleDateString(), placed: new Date().toISOString(),
        items: items.map(x => ({ id: x.id, qty: x.qty, price: find(x.id).price })),
        count: items.reduce((a, x) => a + x.qty, 0), names: items.map(x => find(x.id).name).join(', '),
        method: m, eta: arrives(SHIPPING[m].days), ship, sub: t.sub, shipping: t.ship, tax: t.tax, total: t.total
      };
      state.orders = [order, ...state.orders];
      save('vb.orders.' + state.user, state.orders);
      setCart([]);
      location.href = 'order.html?id=' + encodeURIComponent(order.id) + '&new=1';
    });
    drawReview();
  }

  // — order confirmation / details —
  function renderOrder() {
    if (!requireLogin()) return;
    const o = state.orders.find(x => x.id === params.get('id'));
    if (!o) { $('#order-missing').hidden = false; document.title = 'Order not found · Voltbook'; return; }
    const isNew = params.get('new') === '1';
    $('#order-view').hidden = false;
    $('#order-steps').hidden = !isNew;
    document.title = (isNew ? 'Order confirmed' : 'Order ' + o.id) + ' · Voltbook';
    $('#o-title').textContent = isNew ? 'Thanks for your order!' : 'Order details';
    $('#o-id').textContent = o.id;
    $('#o-date').textContent = 'on ' + o.date;
    const items = o.items || [];
    $('#o-items').innerHTML = items.length ? items.map(x => { const p = find(x.id) || { name: x.id, img: '', cat: '' }; return `
      <li><span class="thumb">${media(p.img, '', '')}</span><span class="nm"><a href="${href(p)}">${esc(p.name)}</a><span>Qty ${x.qty} · ${fmt(x.price)} each</span></span><span class="amt">${fmt(x.price * x.qty)}</span></li>`; }).join('')
      : `<li><span></span><span class="nm">${esc(o.names)}</span><span></span></li>`;
    const s = o.ship;
    $('#o-address').innerHTML = s ? [s.name, s.address1, s.address2, `${s.city}, ${s.state} ${s.zip}`, s.phone].filter(Boolean).map(esc).join('<br>') : 'Not recorded for this order.';
    $('#o-method').textContent = o.method ? `${SHIPPING[o.method].name} shipping · arrives ${o.eta}` : 'Standard shipping';
    const sub = o.sub != null ? o.sub : o.total / 1.08;
    $('#o-subtotal').textContent = fmt(sub, true);
    $('#o-shipping').textContent = o.shipping ? fmt(o.shipping, true) : 'Free';
    $('#o-tax').textContent = fmt(o.tax != null ? o.tax : o.total - sub, true);
    $('#o-total').textContent = fmt(o.total, true);
  }

  // — account —
  function renderAccount() {
    if (!requireLogin('Log in to see your account')) return;
    const u = users()[state.user] || {};
    $('#acct-since').textContent = u.created ? new Date(u.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
    const n = state.cart.reduce((a, x) => a + x.qty, 0);
    $('#acct-cart').textContent = n ? plural(n, 'item') + ' in your cart' : 'Your cart is empty';
    const has = state.orders.length > 0;
    $('#no-orders').hidden = has;
    $('#orders-table').hidden = !has;
    $('#orders-sub').textContent = has ? plural(state.orders.length, 'order') : '';
    $('#order-rows').innerHTML = state.orders.map(o => `<tr>
      <td><a href="order.html?id=${encodeURIComponent(o.id)}" class="tag tag-accent">${esc(o.id)}</a></td>
      <td>${esc(o.date)}</td>
      <td>${esc(o.names)}<span class="count">${plural(o.count, 'laptop')} · <a class="view" href="order.html?id=${encodeURIComponent(o.id)}">View order</a></span></td>
      <td><span class="status">Confirmed</span></td>
      <td>${fmt(o.total, true)}</td></tr>`).join('');
  }

  // — login / sign up —
  function renderLogin() {
    $('#auth-in').hidden = !state.user;
    $('#auth-out').hidden = !!state.user;
  }
  function initLogin() {
    const msg = $('#auth-msg');
    const say = t => { $('span', msg).textContent = t; msg.hidden = !t; };
    function tab(which) {
      $('#tab-login').className = 'btn ' + (which === 'login' ? 'btn-primary' : 'btn-secondary');
      $('#tab-signup').className = 'btn ' + (which === 'signup' ? 'btn-primary' : 'btn-secondary');
      $('#tab-login').setAttribute('aria-pressed', which === 'login');
      $('#tab-signup').setAttribute('aria-pressed', which === 'signup');
      $('#login-form').hidden = which !== 'login';
      $('#signup-form').hidden = which !== 'signup';
      say('');
    }
    $('#tab-login').addEventListener('click', () => tab('login'));
    $('#tab-signup').addEventListener('click', () => tab('signup'));
    $('#to-signup').addEventListener('click', e => { e.preventDefault(); tab('signup'); });
    tab(params.get('tab') === 'signup' ? 'signup' : 'login');

    $('#login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const email = String(f.get('email') || '').trim().toLowerCase(), pw = String(f.get('password') || '');
      const u = users()[email];
      if (!u || u.pw !== await digest(pw)) return say('Wrong email or password.');
      startSession(email, 'Welcome back, ' + u.name + '!');
    });
    $('#signup-form').addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim().toLowerCase(), pw = String(f.get('password') || '');
      if (!name) return say('Please enter your name.');
      if (pw.length < 6) return say('Password must be at least 6 characters.');
      const us = users();
      if (us[email]) return say('An account with that email already exists — log in instead.');
      us[email] = { name, pw: await digest(pw), created: new Date().toISOString() };
      save('vb.users', us);
      startSession(email, 'Account created. Welcome, ' + name + '!');
    });
    renderLogin();
  }

  // The contact form is emailed by FormSubmit (https://formsubmit.co) to the address in the
  // form's action attribute in contact.html. If sending fails, the visitor gets a link that
  // opens their own email app with the message filled in.
  function initContact() {
    const form = $('#contact-form'), sent = $('#contact-sent'), err = $('#contact-error'), btn = $('#contact-btn');
    const to = form.action.split('/').pop();
    function fail(t) {
      const f = new FormData(form);
      const body = `${f.get('message') || ''}\n\n— ${f.get('name') || ''} (${f.get('email') || ''})`;
      $('#contact-mailto').href = 'mailto:' + to + '?subject=' + encodeURIComponent('Voltbook: ' + f.get('topic')) + '&body=' + encodeURIComponent(body);
      $('span', err).textContent = t;
      err.hidden = false;
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.hidden = true;
      // FormSubmit rejects pages opened straight from a file on your computer (file://).
      if (location.protocol === 'file:') return fail('This form only sends from the live website, not from a file opened on your computer.');
      btn.disabled = true; $('span', btn).textContent = 'Sending…';
      try {
        const r = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const j = await r.json().catch(() => ({}));
        if (r.ok && String(j.success) === 'true') { form.reset(); form.hidden = true; sent.hidden = false; }
        else fail(j.message ? 'Not sent: ' + j.message : 'Your message couldn’t be sent right now.');
      } catch (x) { fail('Network error: your message wasn’t sent.'); }
      btn.disabled = false; $('span', btn).textContent = 'Send message';
    });
    $('#contact-again').addEventListener('click', () => { sent.hidden = true; form.hidden = false; });
  }

  renderHeader();
  ({ home: renderHome, shop: renderShop, product: renderProduct, compare: renderCompare, cart: renderCart,
     checkout: initCheckout, order: renderOrder, account: renderAccount, login: initLogin, contact: initContact }[page] || (() => {}))();
  showQueuedFlash();
})();
