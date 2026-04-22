/**
 * SellThru AI Shopping Assistant — Widget v2.0
 * Features: localStorage persistence, 8-product pagination, Make It Yours filters
 *           extracted from actual results, product drawer, universal store support
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────
  const PAGE_SIZE = 8;
  const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h
  const MAX_STORED_MESSAGES = 20;
  const MAX_STORED_HISTORY = 40;
  const SHOP = (window.Shopify && window.Shopify.shop) || window.location.hostname;
  const STORAGE_KEY = 'slt_session_' + SHOP.replace(/\W/g, '_');

  // API_URL injected by liquid: <script>window.sltApiUrl = "{{ block.settings.api_url }}";</script>
  function getApiUrl() {
    return window.sltApiUrl || '';
  }

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  const state = {
    isOpen: false,
    isLoading: false,
    sessionId: uid(),
    messages: [],      // { id, role, text, allProducts, query, timestamp }
    history: [],       // OpenAI format: [{role, content}]
    selectedSizes: [],
    pageExpanded: {},  // msgId → boolean
    refineTerms: new Set(),
  };

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────
  function uid() {
    return 'slt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(price) {
    if (price == null || price === '') return '';
    const raw = parseFloat(price);
    if (isNaN(raw)) return String(price);
    // Shopify Storefront API → decimal string e.g. "49.99"
    // Cart/AJAX API → integer cents e.g. 4999
    const amount = raw > 1000 ? raw / 100 : raw;
    const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency', currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (_) {
      return currency + ' ' + amount.toFixed(2);
    }
  }

  // ─────────────────────────────────────────────
  // LOCALSTORAGE PERSISTENCE
  // ─────────────────────────────────────────────
  function saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 2,
        sessionId: state.sessionId,
        messages: state.messages.slice(-MAX_STORED_MESSAGES),
        history: state.history.slice(-MAX_STORED_HISTORY),
        selectedSizes: state.selectedSizes,
        timestamp: Date.now(),
      }));
    } catch (e) {
      // quota exceeded or private browsing — non-fatal
    }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.v !== 2) { localStorage.removeItem(STORAGE_KEY); return false; }
      if (Date.now() - data.timestamp > SESSION_TTL) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      state.sessionId    = data.sessionId    || state.sessionId;
      state.messages     = data.messages     || [];
      state.history      = data.history      || [];
      state.selectedSizes = data.selectedSizes || [];
      // Rebuild refineTerms from past user queries
      state.messages
        .filter(m => m.role === 'user')
        .forEach(m => m.text.toLowerCase().split(/\s+/).forEach(w => state.refineTerms.add(w)));
      return state.messages.length > 0;
    } catch (_) {
      return false;
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    state.messages = [];
    state.history = [];
    state.sessionId = uid();
    state.pageExpanded = {};
    state.refineTerms = new Set();
    state.selectedSizes = [];
  }

  // ─────────────────────────────────────────────
  // FILTER EXTRACTION (from actual result products)
  // ─────────────────────────────────────────────
  function extractFilters(products) {
    const colors      = new Set();
    const collections = new Set();
    const occasions   = new Set();

    products.forEach(function (p) {
      // ── Colors ──
      if (p.color)  colors.add(p.color);
      if (p.colour) colors.add(p.colour);

      if (Array.isArray(p.options)) {
        p.options.forEach(function (opt) {
          if (/colou?r/i.test(opt.name)) {
            (opt.values || []).forEach(function (v) { colors.add(v); });
          }
        });
      }
      if (Array.isArray(p.variants) && Array.isArray(p.options)) {
        p.variants.forEach(function (v) {
          p.options.forEach(function (opt, i) {
            if (/colou?r/i.test(opt.name)) {
              const val = v['option' + (i + 1)];
              if (val) colors.add(val);
            }
          });
        });
      }

      // ── Collections / product type ──
      if (p.product_type) collections.add(p.product_type);
      if (p.type)         collections.add(p.type);
      if (p.vendor)       collections.add(p.vendor);

      // ── Tags ──
      const rawTags = Array.isArray(p.tags)
        ? p.tags
        : (typeof p.tags === 'string' ? p.tags.split(',').map(function(t){ return t.trim(); }) : []);

      rawTags.forEach(function (t) {
        if (!t) return;
        if (/occasion|party|casual|formal|wedding|beach|evening|garden|holiday|gala|prom/i.test(t)) {
          occasions.add(t);
        }
      });
    });

    return {
      colors:      [...colors].filter(Boolean).slice(0, 8),
      collections: [...collections].filter(Boolean).slice(0, 6),
      occasions:   [...occasions].filter(Boolean).slice(0, 6),
    };
  }

  // ─────────────────────────────────────────────
  // PRODUCT CARD HTML
  // ─────────────────────────────────────────────
  function productCardHtml(product, gridMode) {
    const img     = (product.featured_image && product.featured_image.src) ||
                    product.image ||
                    (Array.isArray(product.images) && product.images[0] && product.images[0].src) ||
                    (Array.isArray(product.images) && product.images[0]) || '';
    const price   = formatPrice(product.price_min || product.price || 0);
    const cmpRaw  = product.compare_at_price_min || product.compare_at_price || null;
    const onSale  = cmpRaw && parseFloat(cmpRaw) > parseFloat(product.price_min || product.price || 0);

    // Size variant pills — only show sizes user has selected, if any
    const sizeOpt  = Array.isArray(product.options) && product.options.find(function(o){ return /^size$/i.test(o.name); });
    const allSizes = sizeOpt ? (sizeOpt.values || []) : [];
    const showSizes = state.selectedSizes.length > 0
      ? allSizes.filter(function(s){
          return state.selectedSizes.some(function(sel){
            return s.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(s.toLowerCase());
          });
        })
      : [];

    // Inline-safe product data (stripped to essentials for card)
    const cardData = JSON.stringify({
      id:          product.id,
      title:       product.title,
      handle:      product.handle || '',
      price:       product.price_min || product.price || 0,
      compare_at:  cmpRaw,
      images:      Array.isArray(product.images)
        ? product.images.map(function(im){ return im && (im.src || im); })
        : (img ? [img] : []),
      options:     product.options  || [],
      variants:    (product.variants || []).map(function(v){
        return { id: v.id, title: v.title, price: v.price, option1: v.option1, option2: v.option2, option3: v.option3, available: v.available };
      }),
      body_html:   product.body_html  || product.description || '',
      product_type: product.product_type || '',
    });

    const firstVariantId = product.variants && product.variants[0] ? product.variants[0].id : '';

    return (
      '<div class="slt-product-card' + (gridMode ? ' slt-card-grid' : '') + '"' +
        ' data-product=\'' + esc(cardData) + '\'' +
        ' tabindex="0" role="button" aria-label="' + esc(product.title) + '">' +
        '<div class="slt-card-img-wrap">' +
          '<img class="slt-card-img" src="' + esc(img) + '" alt="' + esc(product.title) + '" loading="lazy" />' +
          (onSale ? '<span class="slt-card-badge">SALE</span>' : '') +
          '<button class="slt-card-cart-btn" data-variant-id="' + esc(firstVariantId) + '" title="Quick add to cart" aria-label="Add to cart">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="slt-card-info">' +
          '<div class="slt-card-title">' + esc(product.title) + '</div>' +
          '<div class="slt-card-price">' +
            '<span class="slt-price-now">' + price + '</span>' +
            (onSale ? '<span class="slt-price-was">' + formatPrice(cmpRaw) + '</span>' : '') +
          '</div>' +
          (showSizes.length > 0
            ? '<div class="slt-variant-pills">' +
                showSizes.slice(0, 4).map(function(s){ return '<span class="slt-variant-pill">' + esc(s) + '</span>'; }).join('') +
              '</div>'
            : '') +
        '</div>' +
      '</div>'
    );
  }

  // ─────────────────────────────────────────────
  // PRODUCTS BLOCK (carousel or grid)
  // ─────────────────────────────────────────────
  function productsBlockHtml(msgId, allProducts, expanded) {
    const shown     = expanded ? allProducts : allProducts.slice(0, PAGE_SIZE);
    const remaining = allProducts.length - PAGE_SIZE;
    const gridMode  = expanded;

    return (
      '<div class="slt-products-wrap ' + (expanded ? 'slt-products-grid' : 'slt-products-carousel') + '" id="slt-pw-' + msgId + '">' +
        '<div class="slt-products-inner" id="slt-pi-' + msgId + '">' +
          shown.map(function(p){ return productCardHtml(p, gridMode); }).join('') +
        '</div>' +
        (!expanded && allProducts.length > 1 ?
          '<div class="slt-carousel-arrows">' +
            '<button class="slt-arr slt-arr-prev" data-mid="' + msgId + '" aria-label="Previous">&#8249;</button>' +
            '<button class="slt-arr slt-arr-next" data-mid="' + msgId + '" aria-label="Next">&#8250;</button>' +
          '</div>'
        : '') +
      '</div>' +
      (allProducts.length > PAGE_SIZE ?
        '<div class="slt-pagination" id="slt-pag-' + msgId + '">' +
          (!expanded
            ? '<button class="slt-more-btn" data-mid="' + msgId + '" data-action="expand">Show ' + remaining + ' More Curated Styles</button>'
            : '<button class="slt-more-btn slt-less-btn" data-mid="' + msgId + '" data-action="collapse">Show Less Curated Styles</button>'
          ) +
        '</div>'
      : '')
    );
  }

  // ─────────────────────────────────────────────
  // MAKE IT YOURS (filter pills from actual products)
  // ─────────────────────────────────────────────
  function makeItYoursHtml(products, msgId, originalQuery) {
    const f        = extractFilters(products);
    const sections = [];

    if (f.colors.length > 0) {
      sections.push({ label: 'Shop by Color', values: f.colors });
    }
    if (f.collections.length > 0) {
      sections.push({ label: 'Shop by Style', values: f.collections });
    }
    if (f.occasions.length > 0) {
      sections.push({ label: 'Shop by Occasion', values: f.occasions });
    }

    if (sections.length === 0) return '';

    return (
      '<div class="slt-miy" id="slt-miy-' + msgId + '">' +
        '<div class="slt-miy-label">Make it yours</div>' +
        sections.map(function (sec) {
          return (
            '<div class="slt-miy-section">' +
              '<div class="slt-miy-sec-title">' + esc(sec.label) + '</div>' +
              '<div class="slt-miy-chips">' +
                sec.values.map(function (v) {
                  return '<button class="slt-miy-chip"' +
                    ' data-val="' + esc(v) + '"' +
                    ' data-orig="' + esc(originalQuery) + '">' +
                    esc(v) + '</button>';
                }).join('') +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  // ─────────────────────────────────────────────
  // MESSAGE ELEMENT
  // ─────────────────────────────────────────────
  function buildMessageEl(msg) {
    const el = document.createElement('div');
    el.className = 'slt-msg slt-msg--' + msg.role;
    el.dataset.mid = msg.id;

    if (msg.role === 'user') {
      el.innerHTML =
        '<div class="slt-bubble slt-bubble-user">' + esc(msg.text) + '</div>';
    } else {
      const expanded    = !!state.pageExpanded[msg.id];
      const hasProducts = msg.allProducts && msg.allProducts.length > 0;

      el.innerHTML =
        '<div class="slt-bubble slt-bubble-ai">' +
          (msg.text
            ? '<div class="slt-msg-text">' + esc(msg.text).replace(/\n/g, '<br>') + '</div>'
            : '') +
          (hasProducts ? productsBlockHtml(msg.id, msg.allProducts, expanded) : '') +
          (hasProducts ? makeItYoursHtml(msg.allProducts, msg.id, msg.query || '') : '') +
        '</div>';
    }
    return el;
  }

  function appendMessageEl(msg) {
    const wrap = document.getElementById('slt-messages');
    if (!wrap) return;
    const el = buildMessageEl(msg);
    wrap.appendChild(el);
    bindCardListeners(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function restoreAllMessages() {
    const wrap = document.getElementById('slt-messages');
    if (!wrap) return;
    wrap.innerHTML = '';
    state.messages.forEach(function (msg) {
      const el = buildMessageEl(msg);
      wrap.appendChild(el);
      bindCardListeners(el);
    });
    if (wrap.lastElementChild) {
      wrap.lastElementChild.scrollIntoView({ block: 'end' });
    }
  }

  // ─────────────────────────────────────────────
  // EXPAND / COLLAPSE PRODUCTS
  // ─────────────────────────────────────────────
  function toggleExpansion(msgId, expand) {
    state.pageExpanded[msgId] = expand;
    const msg = state.messages.find(function (m) { return m.id === msgId; });
    if (!msg || !msg.allProducts) return;

    const pw  = document.getElementById('slt-pw-' + msgId);
    const pi  = document.getElementById('slt-pi-' + msgId);
    const pag = document.getElementById('slt-pag-' + msgId);

    if (pi) {
      const shown = expand ? msg.allProducts : msg.allProducts.slice(0, PAGE_SIZE);
      pi.innerHTML = shown.map(function (p) { return productCardHtml(p, expand); }).join('');
    }
    if (pw) {
      pw.className = 'slt-products-wrap ' + (expand ? 'slt-products-grid' : 'slt-products-carousel');
    }
    if (pag) {
      const remaining = msg.allProducts.length - PAGE_SIZE;
      pag.innerHTML = expand
        ? '<button class="slt-more-btn slt-less-btn" data-mid="' + msgId + '" data-action="collapse">Show Less Curated Styles</button>'
        : '<button class="slt-more-btn" data-mid="' + msgId + '" data-action="expand">Show ' + remaining + ' More Curated Styles</button>';
    }

    // Re-bind listeners in this message node
    const msgEl = document.querySelector('[data-mid="' + msgId + '"]');
    if (msgEl) bindCardListeners(msgEl);
  }

  // ─────────────────────────────────────────────
  // PRODUCT DRAWER
  // ─────────────────────────────────────────────
  function openProductDrawer(product) {
    const existing = document.getElementById('slt-pd');
    if (existing) existing.remove();

    const images = (Array.isArray(product.images) ? product.images : [])
      .map(function (im) { return im && (im.src || im); })
      .filter(Boolean);
    if (images.length === 0 && product.image) images.push(product.image);

    const variants   = product.variants || [];
    const price      = formatPrice(product.price_min || product.price || (variants[0] && variants[0].price) || 0);
    const cmpPrice   = product.compare_at || product.compare_at_price_min || null;
    const sizeOpt    = (product.options || []).find(function (o) { return /^size$/i.test(o.name); });
    const sizeValues = sizeOpt ? (sizeOpt.values || []) : [];
    const descHtml   = (product.body_html || product.description || '').replace(/<script[^>]*>.*?<\/script>/gi, '');

    const drawer = document.createElement('div');
    drawer.id    = 'slt-pd';
    drawer.innerHTML =
      '<div class="slt-pd-overlay" id="slt-pd-overlay"></div>' +
      '<div class="slt-pd-panel" id="slt-pd-panel">' +
        '<button class="slt-pd-close" id="slt-pd-close" aria-label="Close">&#10005;</button>' +

        // Images
        '<div class="slt-pd-images">' +
          '<div class="slt-pd-main-wrap">' +
            '<img id="slt-pd-main-img" src="' + esc(images[0] || '') + '" alt="' + esc(product.title) + '" />' +
            (images.length > 1
              ? '<button class="slt-pd-arrow slt-pd-prev" data-dir="-1" aria-label="Previous image">&#8249;</button>' +
                '<button class="slt-pd-arrow slt-pd-next" data-dir="1"  aria-label="Next image">&#8250;</button>'
              : '') +
          '</div>' +
          (images.length > 1
            ? '<div class="slt-pd-thumbs">' +
                images.slice(0, 6).map(function (src, i) {
                  return '<img class="slt-pd-thumb ' + (i === 0 ? 'active' : '') + '" src="' + esc(src) + '" data-idx="' + i + '" alt="" loading="lazy" />';
                }).join('') +
              '</div>'
            : '') +
        '</div>' +

        // Details
        '<div class="slt-pd-details">' +
          '<h2 class="slt-pd-name">' + esc(product.title) + '</h2>' +
          '<div class="slt-pd-price-row">' +
            '<span class="slt-pd-price-now">' + price + '</span>' +
            (cmpPrice ? '<span class="slt-pd-price-was">' + formatPrice(cmpPrice) + '</span>' : '') +
          '</div>' +

          (sizeValues.length > 0
            ? '<div class="slt-pd-size-section">' +
                '<div class="slt-pd-size-label" id="slt-pd-size-label">Select Size</div>' +
                '<div class="slt-pd-size-btns">' +
                  sizeValues.map(function (s) {
                    return '<button class="slt-pd-size-btn" data-size="' + esc(s) + '">' + esc(s) + '</button>';
                  }).join('') +
                '</div>' +
              '</div>'
            : '') +

          (descHtml
            ? '<div class="slt-pd-desc">' + descHtml + '</div>'
            : '') +

          '<div class="slt-pd-footer">' +
            '<button class="slt-pd-atc" id="slt-pd-atc"' +
              ' data-variant-id="' + esc((variants[0] && variants[0].id) || '') + '">' +
              'Add to Cart' +
            '</button>' +
            (product.handle
              ? '<a class="slt-pd-pdp-link" href="/products/' + esc(product.handle) + '" target="_blank" rel="noopener">View Full Details ↗</a>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(drawer);

    // Animate open
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var panel = document.getElementById('slt-pd-panel');
        if (panel) panel.classList.add('slt-pd-open');
      });
    });

    var currentIdx = 0;

    function setImage(idx) {
      currentIdx = (idx + images.length) % images.length;
      var mainImg = document.getElementById('slt-pd-main-img');
      if (mainImg) mainImg.src = images[currentIdx];
      drawer.querySelectorAll('.slt-pd-thumb').forEach(function (t, i) {
        t.classList.toggle('active', i === currentIdx);
      });
    }

    drawer.querySelector('#slt-pd-overlay').addEventListener('click', closeProductDrawer);
    drawer.querySelector('#slt-pd-close').addEventListener('click', closeProductDrawer);

    drawer.querySelectorAll('.slt-pd-arrow').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setImage(currentIdx + parseInt(btn.dataset.dir, 10));
      });
    });

    drawer.querySelectorAll('.slt-pd-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        setImage(parseInt(thumb.dataset.idx, 10));
      });
    });

    // Size selection
    var selectedVariantId = (variants[0] && variants[0].id) || '';

    drawer.querySelectorAll('.slt-pd-size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        drawer.querySelectorAll('.slt-pd-size-btn').forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
        var sz = btn.dataset.size;
        var match = variants.find(function (v) {
          return v.option1 === sz || v.option2 === sz || v.option3 === sz;
        });
        if (match) {
          selectedVariantId = match.id;
          document.getElementById('slt-pd-atc').dataset.variantId = match.id;
        }
        var lbl = document.getElementById('slt-pd-size-label');
        if (lbl) { lbl.textContent = 'Select Size'; lbl.style.color = ''; }
      });
    });

    // Add to cart
    var atcBtn = document.getElementById('slt-pd-atc');
    atcBtn && atcBtn.addEventListener('click', function () {
      var varId = atcBtn.dataset.variantId || selectedVariantId;
      if (!varId || varId === 'undefined') {
        var lbl = document.getElementById('slt-pd-size-label');
        if (lbl) { lbl.textContent = 'Please select a size ↑'; lbl.style.color = '#c0392b'; }
        return;
      }
      atcBtn.textContent = 'Adding…';
      atcBtn.disabled    = true;
      addToCart(varId, 1).then(function () {
        atcBtn.textContent = '✓ Added to Cart!';
        setTimeout(closeProductDrawer, 1400);
      }).catch(function () {
        atcBtn.textContent = 'Add to Cart';
        atcBtn.disabled    = false;
      });
    });
  }

  function closeProductDrawer() {
    var drawer = document.getElementById('slt-pd');
    if (!drawer) return;
    var panel = document.getElementById('slt-pd-panel');
    if (panel) panel.classList.remove('slt-pd-open');
    setTimeout(function () {
      if (drawer.parentNode) drawer.parentNode.removeChild(drawer);
    }, 320);
  }

  // ─────────────────────────────────────────────
  // EVENT BINDING FOR CARDS (scoped to a container el)
  // ─────────────────────────────────────────────
  function bindCardListeners(container) {
    // Product card → drawer
    container.querySelectorAll('.slt-product-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.slt-card-cart-btn')) return;
        try {
          openProductDrawer(JSON.parse(card.dataset.product));
        } catch (_) {}
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Quick add to cart button
    container.querySelectorAll('.slt-card-cart-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var varId = btn.dataset.variantId;
        if (!varId || varId === 'undefined') {
          // No first-variant available — open drawer for size selection
          var card = btn.closest('.slt-product-card');
          if (card) {
            try { openProductDrawer(JSON.parse(card.dataset.product)); } catch (_) {}
          }
          return;
        }
        btn.innerHTML = '…';
        btn.disabled  = true;
        addToCart(varId, 1).then(function () {
          btn.innerHTML = '✓';
          setTimeout(function () {
            btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
            btn.disabled = false;
          }, 2200);
        }).catch(function () {
          btn.innerHTML = '!';
          btn.disabled  = false;
        });
      });
    });

    // Carousel arrows
    container.querySelectorAll('.slt-arr').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pi = document.getElementById('slt-pi-' + btn.dataset.mid);
        if (pi) pi.scrollBy({ left: btn.classList.contains('slt-arr-next') ? 260 : -260, behavior: 'smooth' });
      });
    });

    // Show More / Show Less
    container.querySelectorAll('.slt-more-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleExpansion(btn.dataset.mid, btn.dataset.action === 'expand');
      });
    });

    // Make It Yours chips
    container.querySelectorAll('.slt-miy-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var query = chip.dataset.val + (chip.dataset.orig ? ' ' + chip.dataset.orig : '');
        fireQuery(query);
      });
    });
  }

  // ─────────────────────────────────────────────
  // CART
  // ─────────────────────────────────────────────
  function addToCart(variantId, quantity) {
    return fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: variantId, quantity: quantity || 1 }),
    }).then(function (r) {
      if (!r.ok) throw new Error('Cart add failed: ' + r.status);
      triggerCartDrawer();
      refreshCartCount();
      return r.json();
    });
  }

  function triggerCartDrawer() {
    var selectors = [
      '[data-cart-drawer-toggle]',
      '[data-drawer="cart-drawer"]',
      '.cart-drawer__toggle',
      'a[href="#cart-drawer"]',
      '[data-cart-toggle]',
      '.js-cart-open',
      '#cart-icon-bubble',
      '.cart-icon-bubble',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) { el.click(); return; }
    }
    // Fallback: custom events (Dawn, Debut, etc.)
    ['cart:open', 'theme:cart:open', 'CartDrawer:open', 'cart-drawer:open'].forEach(function (evName) {
      document.dispatchEvent(new CustomEvent(evName, { bubbles: true }));
    });
  }

  function refreshCartCount() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        document.querySelectorAll('[data-cart-count], .cart-count, .cart__count, .cart-icon__bubble-count').forEach(function (el) {
          el.textContent = cart.item_count;
        });
      })
      .catch(function () {});
  }

  // ─────────────────────────────────────────────
  // TYPING INDICATOR
  // ─────────────────────────────────────────────
  function showTyping() {
    var wrap = document.getElementById('slt-messages');
    if (!wrap) return;
    var el   = document.createElement('div');
    el.id    = 'slt-typing';
    el.className = 'slt-msg slt-msg--assistant';
    el.innerHTML = '<div class="slt-bubble slt-bubble-ai slt-typing"><span></span><span></span><span></span></div>';
    wrap.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function hideTyping() {
    var el = document.getElementById('slt-typing');
    if (el) el.parentNode.removeChild(el);
  }

  // ─────────────────────────────────────────────
  // SIZE FILTER MODAL
  // ─────────────────────────────────────────────
  var SIZE_OPTIONS = [
    'XS','S','M','L','XL','XXL','XXXL',
    'UK 4','UK 6','UK 8','UK 10','UK 12','UK 14','UK 16','UK 18','UK 20',
    'US 0','US 2','US 4','US 6','US 8','US 10','US 12',
    'EU 32','EU 34','EU 36','EU 38','EU 40','EU 42',
    'ONE SIZE',
  ];

  function openSizeModal() {
    if (document.getElementById('slt-size-modal')) {
      document.getElementById('slt-size-modal').remove();
      return;
    }
    var modal = document.createElement('div');
    modal.id  = 'slt-size-modal';
    modal.innerHTML =
      '<div class="slt-modal-bg" id="slt-modal-bg"></div>' +
      '<div class="slt-modal-box">' +
        '<div class="slt-modal-hd">' +
          '<span>Select Sizes to Filter</span>' +
          '<button class="slt-modal-x" id="slt-modal-x" aria-label="Close">&#10005;</button>' +
        '</div>' +
        '<div class="slt-modal-grid">' +
          SIZE_OPTIONS.map(function (s) {
            return '<button class="slt-sz-chip' + (state.selectedSizes.indexOf(s) > -1 ? ' sel' : '') + '"' +
              ' data-size="' + esc(s) + '">' + esc(s) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="slt-modal-ft">' +
          '<button class="slt-modal-cancel" id="slt-modal-cancel">Cancel</button>' +
          '<button class="slt-modal-save" id="slt-modal-save">Apply Filter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var tmp = state.selectedSizes.slice();

    modal.querySelectorAll('.slt-sz-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sz  = btn.dataset.size;
        var idx = tmp.indexOf(sz);
        if (idx > -1) { tmp.splice(idx, 1); btn.classList.remove('sel'); }
        else          { tmp.push(sz);       btn.classList.add('sel');    }
      });
    });

    function closeModal() { if (modal.parentNode) modal.parentNode.removeChild(modal); }

    document.getElementById('slt-modal-bg').addEventListener('click', closeModal);
    document.getElementById('slt-modal-x').addEventListener('click', closeModal);
    document.getElementById('slt-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('slt-modal-save').addEventListener('click', function () {
      state.selectedSizes = tmp;
      updateSizeBtn();
      saveSession();
      closeModal();
    });
  }

  function updateSizeBtn() {
    var btn = document.getElementById('slt-size-btn');
    if (!btn) return;
    if (state.selectedSizes.length === 0) {
      btn.textContent = 'Size';
      btn.classList.remove('slt-size-active');
    } else {
      btn.textContent = state.selectedSizes.slice(0, 2).join(', ') + (state.selectedSizes.length > 2 ? '…' : '');
      btn.classList.add('slt-size-active');
    }
  }

  // ─────────────────────────────────────────────
  // QUICK-SEARCH CHIPS (from backend)
  // ─────────────────────────────────────────────
  function renderChips(chips) {
    var wrap = document.getElementById('slt-chips');
    if (!wrap) return;
    wrap.innerHTML = chips.map(function (c) {
      return '<button class="slt-chip" data-q="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    wrap.querySelectorAll('.slt-chip').forEach(function (btn) {
      btn.addEventListener('click', function () { fireQuery(btn.dataset.q); });
    });
  }

  // ─────────────────────────────────────────────
  // API CALL
  // ─────────────────────────────────────────────
  function fireQuery(text) {
    var input = document.getElementById('slt-input');
    if (input) input.value = '';
    sendMessage(text);
  }

  function sendMessage(text) {
    if (state.isLoading || !text.trim()) return;
    state.isLoading = true;

    // Remove welcome screen if present
    var welcome = document.querySelector('.slt-welcome');
    if (welcome) welcome.remove();

    var userMsg = {
      id:        uid(),
      role:      'user',
      text:      text.trim(),
      timestamp: Date.now(),
    };
    state.messages.push(userMsg);
    state.history.push({ role: 'user', content: userMsg.text });
    appendMessageEl(userMsg);

    text.toLowerCase().split(/\s+/).forEach(function (w) { state.refineTerms.add(w); });

    showTyping();

    var payload = {
      message:    userMsg.text,
      sessionId:  state.sessionId,
      history:    state.history.slice(-20),
      sizes:      state.selectedSizes,
      shop:       SHOP,
    };

    fetch(getApiUrl() + '/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        hideTyping();

        var aiMsg = {
          id:          uid(),
          role:        'assistant',
          text:        data.message || data.response || '',
          allProducts: data.products || [],
          query:       userMsg.text,
          timestamp:   Date.now(),
        };
        state.messages.push(aiMsg);
        state.history.push({ role: 'assistant', content: aiMsg.text });

        appendMessageEl(aiMsg);
        saveSession();

        if (data.chips && data.chips.length > 0) {
          renderChips(data.chips);
        }
      })
      .catch(function (err) {
        hideTyping();
        console.error('[SellThru]', err);
        var errMsg = {
          id:          uid(),
          role:        'assistant',
          text:        "I'm having trouble connecting right now. Please try again in a moment.",
          allProducts: [],
          timestamp:   Date.now(),
        };
        state.messages.push(errMsg);
        appendMessageEl(errMsg);
      })
      .finally(function () {
        state.isLoading = false;
      });
  }

  function submitInput() {
    var input = document.getElementById('slt-input');
    var text  = input ? input.value.trim() : '';
    if (!text) return;
    input.value = '';
    sendMessage(text);
  }

  // ─────────────────────────────────────────────
  // WIDGET MARKUP
  // ─────────────────────────────────────────────
  function buildWidget() {
    // Launcher FAB
    var launcher     = document.createElement('button');
    launcher.id      = 'slt-launcher';
    launcher.setAttribute('aria-label', 'Open AI Shopping Assistant');
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">' +
        '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' +
      '</svg>';
    document.body.appendChild(launcher);

    // Widget panel
    var root = document.createElement('div');
    root.id  = 'slt-widget';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'AI Shopping Assistant');
    root.innerHTML =
      '<div class="slt-hd">' +
        '<div class="slt-hd-left">' +
          '<div class="slt-hd-icon">✦</div>' +
          '<div>' +
            '<div class="slt-hd-title">AI Shopping Assistant</div>' +
            '<div class="slt-hd-sub">Powered by SellThru</div>' +
          '</div>' +
        '</div>' +
        '<div class="slt-hd-actions">' +
          '<button id="slt-size-btn" title="Filter by size" aria-label="Size filter">Size</button>' +
          '<button id="slt-new-btn"  title="New conversation" aria-label="New chat">New</button>' +
          '<button id="slt-close"    aria-label="Close assistant">&#10005;</button>' +
        '</div>' +
      '</div>' +
      '<div id="slt-messages" role="log" aria-live="polite" aria-atomic="false"></div>' +
      '<div id="slt-chips" aria-label="Quick search suggestions"></div>' +
      '<div class="slt-input-row">' +
        '<input id="slt-input" type="text" placeholder="What are you looking for?" autocomplete="off" aria-label="Search input" />' +
        '<button id="slt-send" aria-label="Send">' +
          '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '<line x1="22" y1="2" x2="11" y2="13"/>' +
            '<polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
          '</svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(root);
  }

  function showWelcome() {
    var wrap = document.getElementById('slt-messages');
    if (!wrap || wrap.children.length > 0) return;
    var el = document.createElement('div');
    el.className = 'slt-welcome';
    el.innerHTML =
      '<div class="slt-welcome-icon">&#10024;</div>' +
      '<div class="slt-welcome-title">How can I help you today?</div>' +
      '<div class="slt-welcome-text">Ask me about products, styles, sizes, or anything you\'re looking for.</div>';
    wrap.appendChild(el);
  }

  // ─────────────────────────────────────────────
  // EVENT BINDING
  // ─────────────────────────────────────────────
  function bindGlobalEvents() {
    // Launcher
    document.getElementById('slt-launcher').addEventListener('click', function () {
      state.isOpen = !state.isOpen;
      document.getElementById('slt-widget').classList.toggle('slt-open', state.isOpen);
      if (state.isOpen) {
        var inp = document.getElementById('slt-input');
        if (inp) inp.focus();
      }
    });

    // Close
    document.getElementById('slt-close').addEventListener('click', function () {
      state.isOpen = false;
      document.getElementById('slt-widget').classList.remove('slt-open');
    });

    // Send
    document.getElementById('slt-send').addEventListener('click', submitInput);
    document.getElementById('slt-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInput(); }
    });

    // Size filter
    document.getElementById('slt-size-btn').addEventListener('click', openSizeModal);

    // New chat
    document.getElementById('slt-new-btn').addEventListener('click', function () {
      if (!confirm('Start a new conversation? Your current chat will be cleared.')) return;
      clearSession();
      var wrap = document.getElementById('slt-messages');
      if (wrap) wrap.innerHTML = '';
      showWelcome();
      updateSizeBtn();
      renderChips([]);
    });

    // Global keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeProductDrawer();
        var sm = document.getElementById('slt-size-modal');
        if (sm) sm.parentNode.removeChild(sm);
      }
    });
  }

  // ─────────────────────────────────────────────
  // INITIAL CHIP LOAD
  // ─────────────────────────────────────────────
  function loadInitialChips() {
    fetch(getApiUrl() + '/api/widget-config?shop=' + encodeURIComponent(SHOP))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.chips && data.chips.length > 0) renderChips(data.chips);
        if (data.title) {
          var t = document.querySelector('.slt-hd-title');
          if (t) t.textContent = data.title;
        }
      })
      .catch(function () {});
  }

  // ─────────────────────────────────────────────
  // CSS
  // ─────────────────────────────────────────────
  function injectCss() {
    if (document.getElementById('slt-css')) return;
    var s = document.createElement('style');
    s.id  = 'slt-css';
    s.textContent = [
      /* Reset */
      '#slt-widget *,#slt-pd *,#slt-size-modal *{box-sizing:border-box;margin:0;padding:0;}',

      /* ── Launcher ── */
      '#slt-launcher{position:fixed;bottom:24px;right:24px;z-index:9998;width:56px;height:56px;border-radius:50%;background:#111;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.28);transition:transform .2s,box-shadow .2s;font-family:inherit;}',
      '#slt-launcher:hover{transform:scale(1.07);box-shadow:0 6px 26px rgba(0,0,0,.34);}',

      /* ── Widget panel ── */
      '#slt-widget{position:fixed;bottom:92px;right:24px;z-index:9997;width:420px;max-width:calc(100vw - 32px);height:680px;max-height:calc(100vh - 112px);background:#fff;border-radius:16px;box-shadow:0 8px 48px rgba(0,0,0,.2);display:flex;flex-direction:column;opacity:0;pointer-events:none;transform:translateY(14px) scale(.97);transition:opacity .24s,transform .24s;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '#slt-widget.slt-open{opacity:1;pointer-events:all;transform:translateY(0) scale(1);}',

      /* ── Header ── */
      '.slt-hd{padding:14px 16px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:10px;}',
      '.slt-hd-left{display:flex;align-items:center;gap:10px;}',
      '.slt-hd-icon{font-size:18px;opacity:.9;}',
      '.slt-hd-title{font-size:14px;font-weight:700;line-height:1.2;}',
      '.slt-hd-sub{font-size:11px;opacity:.55;margin-top:2px;}',
      '.slt-hd-actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}',
      '#slt-size-btn,#slt-new-btn{background:rgba(255,255,255,.14);border:none;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;transition:background .15s;white-space:nowrap;}',
      '#slt-size-btn.slt-size-active{background:rgba(255,255,255,.3);}',
      '#slt-size-btn:hover,#slt-new-btn:hover{background:rgba(255,255,255,.24);}',
      '#slt-close{background:none;border:none;color:rgba(255,255,255,.7);font-size:18px;cursor:pointer;line-height:1;padding:2px 4px;transition:color .15s;}',
      '#slt-close:hover{color:#fff;}',

      /* ── Messages ── */
      '#slt-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;}',
      '#slt-messages::-webkit-scrollbar{width:4px;}',
      '#slt-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px;}',

      /* ── Message bubbles ── */
      '.slt-msg{display:flex;flex-direction:column;max-width:100%;}',
      '.slt-msg--user{align-items:flex-end;}',
      '.slt-msg--assistant{align-items:flex-start;}',
      '.slt-bubble{padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;max-width:88%;}',
      '.slt-bubble-user{background:#111;color:#fff;border-bottom-right-radius:3px;}',
      '.slt-bubble-ai{background:#f5f5f5;color:#111;border-bottom-left-radius:3px;max-width:100%;padding:12px;}',
      '.slt-msg-text{margin-bottom:8px;color:#222;line-height:1.55;}',

      /* ── Typing ── */
      '.slt-typing{display:flex;gap:5px;align-items:center;padding:12px 16px!important;}',
      '.slt-typing span{width:7px;height:7px;background:#bbb;border-radius:50%;animation:slt-dot 1.2s infinite ease-in-out;}',
      '.slt-typing span:nth-child(2){animation-delay:.2s;}',
      '.slt-typing span:nth-child(3){animation-delay:.4s;}',
      '@keyframes slt-dot{0%,80%,100%{transform:scale(.55);opacity:.4;}40%{transform:scale(1);opacity:1;}}',

      /* ── Products carousel ── */
      '.slt-products-wrap{position:relative;margin-top:6px;}',
      '.slt-products-carousel .slt-products-inner{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:none;}',
      '.slt-products-carousel .slt-products-inner::-webkit-scrollbar{display:none;}',
      '.slt-products-carousel .slt-product-card{flex:0 0 148px;scroll-snap-align:start;}',

      /* ── Products grid (expanded) ── */
      '.slt-products-grid .slt-products-inner{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}',
      '.slt-products-grid .slt-product-card{flex:none;}',

      /* ── Product card ── */
      '.slt-product-card{border-radius:9px;overflow:hidden;background:#fff;border:1px solid #ececec;cursor:pointer;transition:box-shadow .2s,transform .2s;outline-offset:2px;}',
      '.slt-product-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.1);transform:translateY(-2px);}',
      '.slt-card-img-wrap{position:relative;aspect-ratio:3/4;overflow:hidden;}',
      '.slt-card-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s;}',
      '.slt-product-card:hover .slt-card-img{transform:scale(1.04);}',
      '.slt-card-badge{position:absolute;top:5px;left:5px;background:#c0392b;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;letter-spacing:.4px;}',
      '.slt-card-cart-btn{position:absolute;bottom:6px;right:6px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.72);border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .2s;z-index:2;}',
      '.slt-product-card:hover .slt-card-cart-btn{opacity:1;}',
      '.slt-card-info{padding:7px 8px;}',
      '.slt-card-title{font-size:11.5px;font-weight:500;line-height:1.3;color:#111;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px;}',
      '.slt-card-price{font-size:11.5px;display:flex;gap:4px;align-items:baseline;}',
      '.slt-price-now{font-weight:700;color:#111;}',
      '.slt-price-was{text-decoration:line-through;color:#aaa;font-size:10.5px;}',
      '.slt-variant-pills{display:flex;gap:3px;flex-wrap:wrap;margin-top:4px;}',
      '.slt-variant-pill{font-size:10px;background:#f0f0f0;padding:1px 5px;border-radius:3px;color:#555;}',

      /* ── Grid compact card ── */
      '.slt-card-grid .slt-card-title{font-size:11px;}',
      '.slt-card-grid .slt-card-price{font-size:11px;}',

      /* ── Carousel arrows ── */
      '.slt-carousel-arrows{position:absolute;top:50%;left:-6px;right:-6px;transform:translateY(-50%);pointer-events:none;display:flex;justify-content:space-between;z-index:3;}',
      '.slt-arr{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.95);border:1px solid #ddd;font-size:16px;cursor:pointer;pointer-events:all;display:flex;align-items:center;justify-content:center;transition:background .15s;box-shadow:0 2px 6px rgba(0,0,0,.1);}',
      '.slt-arr:hover{background:#fff;}',

      /* ── Pagination ── */
      '.slt-pagination{margin-top:8px;text-align:center;}',
      '.slt-more-btn{background:none;border:1.5px solid #111;color:#111;padding:6px 16px;border-radius:20px;font-size:12px;cursor:pointer;transition:background .15s,color .15s;font-family:inherit;}',
      '.slt-more-btn:hover{background:#111;color:#fff;}',
      '.slt-less-btn{border-color:#aaa;color:#888;}',
      '.slt-less-btn:hover{background:#888;color:#fff;border-color:#888;}',

      /* ── Make It Yours ── */
      '.slt-miy{margin-top:12px;padding-top:10px;border-top:1px solid #e5e5e5;}',
      '.slt-miy-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#888;margin-bottom:8px;}',
      '.slt-miy-section{margin-bottom:8px;}',
      '.slt-miy-sec-title{font-size:11px;color:#999;margin-bottom:5px;}',
      '.slt-miy-chips{display:flex;gap:5px;flex-wrap:wrap;}',
      '.slt-miy-chip{background:#fff;border:1px solid #e0e0e0;color:#333;padding:4px 10px;border-radius:14px;font-size:11.5px;cursor:pointer;transition:background .15s,border-color .15s,color .15s;font-family:inherit;}',
      '.slt-miy-chip:hover{background:#111;color:#fff;border-color:#111;}',

      /* ── Suggestion chips ── */
      '#slt-chips{padding:5px 12px 6px;display:flex;gap:5px;overflow-x:auto;flex-shrink:0;scrollbar-width:none;background:#fafafa;border-top:1px solid #f0f0f0;}',
      '#slt-chips:empty{display:none;}',
      '#slt-chips::-webkit-scrollbar{display:none;}',
      '.slt-chip{background:#fff;border:1px solid #e0e0e0;color:#333;padding:5px 12px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s;font-family:inherit;flex-shrink:0;}',
      '.slt-chip:hover{background:#111;color:#fff;border-color:#111;}',

      /* ── Input ── */
      '.slt-input-row{padding:9px 12px;border-top:1px solid #eee;display:flex;gap:8px;flex-shrink:0;background:#fff;align-items:center;}',
      '#slt-input{flex:1;border:1px solid #ddd;border-radius:22px;padding:8px 14px;font-size:13.5px;outline:none;transition:border-color .15s;font-family:inherit;}',
      '#slt-input:focus{border-color:#111;}',
      '#slt-send{width:36px;height:36px;border-radius:50%;background:#111;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;}',
      '#slt-send:hover{background:#333;}',

      /* ── Welcome ── */
      '.slt-welcome{text-align:center;padding:32px 16px;color:#666;}',
      '.slt-welcome-icon{font-size:32px;margin-bottom:10px;}',
      '.slt-welcome-title{font-size:15px;font-weight:600;color:#111;margin-bottom:6px;}',
      '.slt-welcome-text{font-size:13px;line-height:1.55;color:#888;}',

      /* ── Size modal ── */
      '#slt-size-modal{position:fixed;inset:0;z-index:10002;display:flex;align-items:flex-end;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '.slt-modal-bg{position:absolute;inset:0;background:rgba(0,0,0,.42);}',
      '.slt-modal-box{position:relative;background:#fff;border-radius:18px 18px 0 0;padding:20px 16px 24px;width:100%;max-width:500px;z-index:1;max-height:80vh;overflow-y:auto;}',
      '.slt-modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-weight:600;font-size:15px;}',
      '.slt-modal-x{background:none;border:none;font-size:18px;cursor:pointer;color:#666;line-height:1;}',
      '.slt-modal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;}',
      '.slt-sz-chip{padding:9px 4px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:12.5px;cursor:pointer;text-align:center;transition:background .15s,border-color .15s;font-family:inherit;}',
      '.slt-sz-chip.sel{background:#111;color:#fff;border-color:#111;}',
      '.slt-modal-ft{display:flex;gap:10px;}',
      '.slt-modal-cancel{flex:1;padding:11px;border:1px solid #ddd;border-radius:9px;background:#fff;cursor:pointer;font-size:14px;font-family:inherit;}',
      '.slt-modal-save{flex:1;padding:11px;border:none;border-radius:9px;background:#111;color:#fff;cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;}',

      /* ── Product drawer ── */
      '#slt-pd{position:fixed;inset:0;z-index:10001;display:flex;justify-content:flex-end;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '.slt-pd-overlay{position:absolute;inset:0;background:rgba(0,0,0,.42);}',
      '.slt-pd-panel{position:relative;background:#fff;z-index:1;width:480px;max-width:100vw;height:100%;overflow-y:auto;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);}',
      '.slt-pd-panel.slt-pd-open{transform:translateX(0);}',
      '.slt-pd-close{position:absolute;top:12px;right:12px;z-index:3;background:rgba(255,255,255,.92);border:none;border-radius:50%;width:32px;height:32px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:background .15s;}',
      '.slt-pd-close:hover{background:#fff;}',
      '.slt-pd-images{flex-shrink:0;}',
      '.slt-pd-main-wrap{position:relative;aspect-ratio:3/4;overflow:hidden;background:#f8f8f8;}',
      '.slt-pd-main-wrap img{width:100%;height:100%;object-fit:cover;display:block;}',
      '.slt-pd-arrow{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.9);border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.12);}',
      '.slt-pd-prev{left:10px;}',
      '.slt-pd-next{right:10px;}',
      '.slt-pd-thumbs{display:flex;gap:6px;padding:8px 12px;overflow-x:auto;scrollbar-width:none;}',
      '.slt-pd-thumbs::-webkit-scrollbar{display:none;}',
      '.slt-pd-thumb{width:58px;height:76px;object-fit:cover;border-radius:5px;cursor:pointer;opacity:.55;transition:opacity .15s;border:2px solid transparent;flex-shrink:0;}',
      '.slt-pd-thumb.active{opacity:1;border-color:#111;}',
      '.slt-pd-details{padding:20px;flex:1;}',
      '.slt-pd-name{font-size:17px;font-weight:700;color:#111;line-height:1.3;margin-bottom:10px;}',
      '.slt-pd-price-row{display:flex;align-items:baseline;gap:8px;margin-bottom:18px;}',
      '.slt-pd-price-now{font-size:20px;font-weight:700;color:#111;}',
      '.slt-pd-price-was{font-size:14px;text-decoration:line-through;color:#aaa;}',
      '.slt-pd-size-section{margin-bottom:18px;}',
      '.slt-pd-size-label{font-size:13px;font-weight:600;color:#111;margin-bottom:8px;}',
      '.slt-pd-size-btns{display:flex;gap:7px;flex-wrap:wrap;}',
      '.slt-pd-size-btn{padding:7px 13px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:13px;cursor:pointer;transition:background .15s,border-color .15s;font-family:inherit;}',
      '.slt-pd-size-btn.sel{background:#111;color:#fff;border-color:#111;}',
      '.slt-pd-desc{font-size:13px;color:#555;line-height:1.6;margin-bottom:20px;max-height:130px;overflow-y:auto;}',
      '.slt-pd-desc p{margin-bottom:6px;}',
      '.slt-pd-footer{display:flex;flex-direction:column;gap:10px;margin-top:auto;}',
      '.slt-pd-atc{padding:14px;background:#111;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s;font-family:inherit;}',
      '.slt-pd-atc:hover:not(:disabled){background:#333;}',
      '.slt-pd-atc:disabled{opacity:.6;cursor:default;}',
      '.slt-pd-pdp-link{display:block;padding:12px;background:#fff;color:#111;border:1px solid #ddd;border-radius:8px;font-size:13.5px;text-align:center;text-decoration:none;transition:border-color .15s;}',
      '.slt-pd-pdp-link:hover{border-color:#111;}',

      /* ── Mobile ── */
      '@media(max-width:480px){',
      '#slt-widget{right:0;bottom:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0;}',
      '#slt-launcher{bottom:16px;right:16px;}',
      '.slt-pd-panel{width:100vw;}',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  function init() {
    injectCss();
    buildWidget();
    bindGlobalEvents();

    var hadSession = loadSession();
    updateSizeBtn();

    if (hadSession) {
      restoreAllMessages();
    } else {
      showWelcome();
    }

    loadInitialChips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();