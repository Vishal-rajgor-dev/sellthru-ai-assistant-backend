(function () {
  const SHOP = window.sellthruShop || window.sellthruConfig?.shop || '';
  const API_URL = window.sellthruApiUrl || window.sellthruConfig?.apiUrl || '';

  async function init() {
    try {
      const r = await fetch(`${API_URL}/api/widget/config?shop=${SHOP}`);
      const config = await r.json();
      if (!config.enabled) return;
      mount(config);
    } catch (e) {
      mount({ enabled: true, color: '#000000', greeting: 'Hi! How can I help you find something today?', promptChips: ["What's new?", 'Best sellers', 'Under $100', 'Gifts'] });
    }
  }

  function mount(config) {
    const COLOR = config.color || '#000';
    const GREETING = config.greeting || 'Hi! How can I help you find something today?';
    const CHIPS = config.promptChips || ["What's new?", 'Best sellers', 'Under $100', 'Gifts'];

    const host = document.createElement('div');
    host.id = 'sellthru-host';
    host.style.cssText = 'position:fixed;bottom:0;right:0;width:490px;height:720px;z-index:2147483647;pointer-events:none;';    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      #st-launcher{position:absolute;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:${COLOR};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:all;transition:transform 0.2s;box-shadow:0 4px 16px rgba(0,0,0,0.18)}
      #st-launcher:hover{transform:scale(1.08)}
      #st-launcher svg{width:26px;height:26px;fill:white;pointer-events:none}
      #st-window{position:absolute;bottom:92px;right:24px;width:420px;height:600px;background:#fff;border-radius:20px;border:1px solid #e5e5e5;display:flex;flex-direction:column;overflow:hidden;pointer-events:all;transition:opacity 0.2s,transform 0.2s;box-shadow:0 8px 40px rgba(0,0,0,0.14)}
      #st-window.hidden{opacity:0;pointer-events:none;transform:translateY(12px)}
      #st-header{background:${COLOR};color:#fff;padding:14px 18px;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
      #st-header-left{display:flex;align-items:center;gap:10px}
      #st-header-dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      #st-close{background:none;border:none;color:#fff;cursor:pointer;font-size:22px;line-height:1;padding:0;opacity:0.7}
      #st-close:hover{opacity:1}
      #st-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px}
      #st-messages::-webkit-scrollbar{width:4px}
      #st-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
      .st-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-break:break-word}
      .st-bot{background:#f4f4f4;color:#111;align-self:flex-start;border-bottom-left-radius:4px}
      .st-user{background:${COLOR};color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
      .st-typing{display:flex;gap:4px;align-items:center;padding:12px 16px;background:#f4f4f4;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}
      .st-typing span{width:7px;height:7px;background:#999;border-radius:50%;display:inline-block;animation:bounce 1.2s infinite}
      .st-typing span:nth-child(2){animation-delay:0.2s}
      .st-typing span:nth-child(3){animation-delay:0.4s}
      @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      .st-products{width:100%}
      .st-filter-bar{display:flex;gap:6px;flex-wrap:wrap;padding-bottom:8px}
      .st-filter-btn{background:#fff;border:1px solid #ddd;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:500;cursor:pointer;color:#333;transition:all 0.15s;white-space:nowrap}
      .st-filter-btn:hover,.st-filter-btn.active{background:${COLOR};color:#fff;border-color:${COLOR}}
      .st-slider-wrap{position:relative;width:100%}
      .st-slider{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px;cursor:grab}
      .st-slider::-webkit-scrollbar{display:none}
      .st-slider:active{cursor:grabbing}
      .st-slider-btn{position:absolute;top:38%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid #ddd;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.15s;line-height:1}
      .st-slider-btn:hover{background:${COLOR};color:#fff;border-color:${COLOR}}
      .st-slider-prev{left:-14px}
      .st-slider-next{right:-14px}
      .st-card{background:#fff;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;transition:border-color 0.15s,transform 0.15s;display:flex;flex-direction:column;flex-shrink:0;width:175px;scroll-snap-align:start}
      .st-card:hover{border-color:#bbb;transform:translateY(-2px)}
      .st-card-img-wrap{position:relative;width:100%;aspect-ratio:1;overflow:hidden;cursor:pointer;background:#f8f8f8}
      .st-card-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
      .st-card-img-wrap:hover img{transform:scale(1.05)}
      .st-img-dots{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);display:flex;gap:4px}
      .st-img-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.5);transition:background 0.2s}
      .st-img-dot.active{background:#fff}
      .st-card-badge{position:absolute;top:7px;left:7px;font-size:9px;font-weight:700;padding:3px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px}
      .st-badge-out{background:#e44;color:#fff}
      .st-badge-sale{background:#e44;color:#fff}
      .st-card-body{padding:10px 11px 12px;flex:1;display:flex;flex-direction:column}
      .st-card-title{font-size:12px;font-weight:600;color:#111;margin-bottom:5px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .st-card-prices{display:flex;align-items:center;gap:5px;margin-bottom:8px;flex-wrap:wrap}
      .st-price{font-size:14px;font-weight:700;color:#111}
      .st-compare{font-size:11px;color:#aaa;text-decoration:line-through}
      .st-variants{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
      .st-variant-pill{border:1.5px solid #ddd;border-radius:5px;padding:3px 7px;font-size:10px;font-weight:500;cursor:pointer;color:#555;transition:all 0.15s;background:#fff}
      .st-variant-pill.selected{border-color:${COLOR};color:${COLOR};background:#f5f5f5}
      .st-variant-more{font-size:10px;color:#999;padding:3px 0;align-self:center}
      .st-card-actions{display:flex;gap:6px;margin-top:auto}
      .st-add{flex:1;background:${COLOR};color:#fff;border:none;border-radius:7px;padding:9px 4px;font-size:11px;font-weight:600;cursor:pointer;transition:background 0.15s}
      .st-add:disabled{background:#ccc;cursor:default}
      .st-add.st-added{background:#1a7a4a}
      .st-quick-view{background:#fff;color:#333;border:1.5px solid #ddd;border-radius:7px;padding:9px 8px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.15s}
      .st-quick-view:hover{border-color:${COLOR};color:${COLOR}}
      .st-qv-panel{background:#fff;border:1px solid #ebebeb;border-radius:14px;overflow:hidden;width:100%}
      .st-qv-imgs{display:flex;gap:6px;padding:10px;overflow-x:auto;background:#f8f8f8}
      .st-qv-imgs img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:2px solid transparent;cursor:pointer;flex-shrink:0;transition:border-color 0.15s}
      .st-qv-imgs img.active{border-color:${COLOR}}
      .st-qv-main{width:100%;aspect-ratio:1;object-fit:cover}
      .st-qv-body{padding:14px}
      .st-qv-title{font-size:15px;font-weight:700;margin-bottom:6px;color:#111}
      .st-qv-desc{font-size:12px;color:#666;line-height:1.6;margin-bottom:12px}
      .st-qv-add{width:100%;background:${COLOR};color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;transition:background 0.15s}
      .st-qv-add.st-added{background:#1a7a4a}
      .st-qv-close{width:100%;background:none;border:1px solid #ddd;border-radius:9px;padding:10px;font-size:13px;cursor:pointer;color:#555}
      .st-qv-close:hover{border-color:#999;color:#000}
      .st-load-more-wrap{margin-top:8px}
      .st-load-more{width:100%;background:#fff;border:1.5px solid ${COLOR};border-radius:10px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;color:${COLOR}}
      .st-load-more:hover{background:${COLOR};color:#fff}
      .st-follow-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0}
      .st-follow-chip{background:#f4f4f4;border:1px solid #e5e5e5;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer;white-space:nowrap;transition:background 0.15s}
      .st-follow-chip:hover{background:#e0e0e0}
      #st-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;flex-shrink:0}
      .st-chip{background:#f4f4f4;border:1px solid #e5e5e5;border-radius:20px;padding:7px 14px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background 0.15s}
      .st-chip:hover{background:#e0e0e0}
      #st-input-row{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff}
      #st-input{flex:1;border:1.5px solid #e5e5e5;border-radius:10px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit;color:#111}
      #st-input:focus{border-color:${COLOR}}
      #st-send{background:${COLOR};color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:16px;cursor:pointer;transition:background 0.15s}
      #st-send:disabled{background:#ccc;cursor:default}
    `;
    shadow.appendChild(style);

    const launcher = document.createElement('button');
launcher.id = 'st-launcher';
launcher.setAttribute('aria-label', 'Open shopping assistant');
launcher.style.pointerEvents = 'all';
    launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
    shadow.appendChild(launcher);

    const win = document.createElement('div');
win.id = 'st-window';
win.classList.add('hidden');
win.style.pointerEvents = 'all';
    win.innerHTML = '<div id="st-header"><div id="st-header-left"><div id="st-header-dot"></div><span>Shopping Assistant</span></div><button id="st-close">×</button></div><div id="st-messages"></div><div id="st-chips"></div><div id="st-input-row"><input id="st-input" type="text" placeholder="Search products, ask questions..." autocomplete="off"/><button id="st-send">↑</button></div>';
    shadow.appendChild(win);

    const closeBtn = shadow.getElementById('st-close');
    const messages = shadow.getElementById('st-messages');
    const input = shadow.getElementById('st-input');
    const sendBtn = shadow.getElementById('st-send');
    const chipsContainer = shadow.getElementById('st-chips');

    let isOpen = false;
    let lastProducts = [];
    let currentSort = 'default';

    function toggleWidget() {
      isOpen = !isOpen;
      win.classList.toggle('hidden', !isOpen);
      if (isOpen && messages.children.length === 0) { addBotMessage(GREETING); renderChips(CHIPS); }
      if (isOpen) setTimeout(() => input.focus(), 300);
    }

    launcher.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', toggleWidget);

    document.addEventListener('click', (e) => {
      if (isOpen && !host.contains(e.target)) { isOpen = false; win.classList.add('hidden'); }
    });

    function renderChips(chips) {
      chipsContainer.innerHTML = '';
      chips.forEach(chip => {
        const btn = document.createElement('button');
        btn.className = 'st-chip';
        btn.textContent = chip;
        btn.addEventListener('click', () => { chipsContainer.innerHTML = ''; sendMessage(chip); });
        chipsContainer.appendChild(btn);
      });
    }

    function addBotMessage(text) {
      const div = document.createElement('div');
      div.className = 'st-msg st-bot';
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function addUserMessage(text) {
      const div = document.createElement('div');
      div.className = 'st-msg st-user';
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'st-typing';
      div.id = 'st-typing-ind';
      div.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
      const t = shadow.getElementById('st-typing-ind');
      if (t) t.remove();
    }

    function refreshCartCount() {
      fetch('/cart.js').then(r => r.json()).then(() => {
        fetch('/?sections=header').then(r => r.json()).then(sections => {
          if (sections.header) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(sections.header, 'text/html');
            const newBubble = doc.querySelector('#cart-icon-bubble');
            const oldBubble = document.querySelector('#cart-icon-bubble');
            if (newBubble && oldBubble) oldBubble.innerHTML = newBubble.innerHTML;
          }
        }).catch(() => {});
      }).catch(() => {});
    }

    function sortProducts(products, sort) {
      const sorted = [...products];
      if (sort === 'price-asc') sorted.sort((a, b) => parseFloat(a.price?.replace('$','') || 0) - parseFloat(b.price?.replace('$','') || 0));
      else if (sort === 'price-desc') sorted.sort((a, b) => parseFloat(b.price?.replace('$','') || 0) - parseFloat(a.price?.replace('$','') || 0));
      return sorted;
    }

    function createProductCard(p) {
      const card = document.createElement('div');
      card.className = 'st-card';
      let selectedVariantId = p.variantId;
      let currentImgIndex = 0;
      const images = p.images?.length ? p.images : (p.image ? [p.image] : []);
      let saveBadge = '';
      if (p.comparePrice && p.price) {
        const orig = parseFloat(p.comparePrice.replace('$',''));
        const curr = parseFloat(p.price.replace('$',''));
        if (orig > curr) { const pct = Math.round((orig-curr)/orig*100); saveBadge = `<span class="st-card-badge st-badge-sale">-${pct}%</span>`; }
      }
      const outBadge = !p.available ? '<span class="st-card-badge st-badge-out">Out of stock</span>' : '';
      const dotsHtml = images.length > 1 ? `<div class="st-img-dots">${images.map((_,i) => `<div class="st-img-dot${i===0?' active':''}"></div>`).join('')}</div>` : '';
      const safeId = p.id.split('/').pop();
      card.innerHTML = `<div class="st-card-img-wrap">${outBadge}${saveBadge}<img id="cimg-${safeId}" src="${images[0]||''}" alt="${p.title}" onerror="this.style.background='#f0f0f0'"/>${dotsHtml}</div><div class="st-card-body"><div class="st-card-title">${p.title}</div><div class="st-card-prices"><span class="st-price">${p.price||''}</span>${p.comparePrice?`<span class="st-compare">${p.comparePrice}</span>`:''}</div><div class="st-variants" id="cvars-${safeId}"></div><div class="st-card-actions"><button class="st-add" id="cadd-${safeId}">${p.available?'Add to Cart':'Out of Stock'}</button><button class="st-quick-view" id="cqv-${safeId}">View</button></div></div>`;

      const imgEl = card.querySelector(`#cimg-${safeId}`);
      const dots = card.querySelectorAll('.st-img-dot');
      if (images.length > 1) {
        let imgTimer;
        card.querySelector('.st-card-img-wrap').addEventListener('mouseenter', () => { imgTimer = setInterval(() => { currentImgIndex = (currentImgIndex+1)%images.length; imgEl.src = images[currentImgIndex]; dots.forEach((d,i) => d.classList.toggle('active', i===currentImgIndex)); }, 1200); });
        card.querySelector('.st-card-img-wrap').addEventListener('mouseleave', () => { clearInterval(imgTimer); currentImgIndex = 0; imgEl.src = images[0]; dots.forEach((d,i) => d.classList.toggle('active', i===0)); });
      }

      const variantContainer = card.querySelector(`#cvars-${safeId}`);
      if (p.variants.length > 1) {
        p.variants.slice(0,3).forEach((v,i) => {
          const pill = document.createElement('button');
          pill.className = 'st-variant-pill' + (i===0?' selected':'');
          pill.textContent = v.title;
          if (!v.available) pill.style.opacity = '0.4';
          pill.addEventListener('click', () => { selectedVariantId = v.id; variantContainer.querySelectorAll('.st-variant-pill').forEach(vp => vp.classList.remove('selected')); pill.classList.add('selected'); });
          variantContainer.appendChild(pill);
        });
        if (p.variants.length > 3) { const more = document.createElement('span'); more.className = 'st-variant-more'; more.textContent = `+${p.variants.length-3} more`; variantContainer.appendChild(more); }
      }

      card.querySelector(`#cqv-${safeId}`).addEventListener('click', () => { const existing = shadow.getElementById('st-qv-active'); if (existing) existing.remove(); const qv = renderQuickView(p); qv.id = 'st-qv-active'; messages.appendChild(qv); messages.scrollTop = messages.scrollHeight; });
      card.querySelector('.st-card-img-wrap').addEventListener('click', () => { card.querySelector(`#cqv-${safeId}`).click(); });

      const addBtn = card.querySelector(`#cadd-${safeId}`);
      if (p.available) {
        addBtn.addEventListener('click', async function() {
          this.disabled = true; this.textContent = '...';
          const numericId = selectedVariantId.replace('gid://shopify/ProductVariant/','');
          try {
            const r = await fetch('/cart/add.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({items:[{id:parseInt(numericId),quantity:1}]}) });
            const data = await r.json();
            if (data.items) { this.textContent = 'Added ✓'; this.classList.add('st-added'); refreshCartCount(); }
            else { this.textContent = 'Error'; this.disabled = false; }
          } catch { this.textContent = 'Error'; this.disabled = false; }
        });
      } else { addBtn.disabled = true; }
      return card;
    }

    function renderQuickView(p) {
      const panel = document.createElement('div');
      panel.className = 'st-qv-panel';
      const images = p.images?.length ? p.images : (p.image ? [p.image] : []);
      let selectedVariantId = p.variantId;
      panel.innerHTML = `<img class="st-qv-main" id="st-qv-mainimg" src="${images[0]||''}" alt="${p.title}"/><div class="st-qv-imgs" id="st-qv-thumbs"></div><div class="st-qv-body"><div class="st-qv-title">${p.title}</div><div class="st-card-prices" style="margin-bottom:10px"><span class="st-price">${p.price||''}</span>${p.comparePrice?`<span class="st-compare">${p.comparePrice}</span>`:''}</div><div class="st-qv-desc">${p.description||'No description available.'}</div><div class="st-variants" id="st-qv-vars" style="margin-bottom:12px"></div><button class="st-qv-add" id="st-qv-addbtn">Add to Cart</button><button class="st-qv-close" id="st-qv-closebtn">← Back to results</button></div>`;
      const mainImg = panel.querySelector('#st-qv-mainimg');
      const thumbsContainer = panel.querySelector('#st-qv-thumbs');
      images.forEach((img,i) => { const thumb = document.createElement('img'); thumb.src = img; if(i===0) thumb.classList.add('active'); thumb.addEventListener('click', () => { mainImg.src = img; thumbsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }); thumbsContainer.appendChild(thumb); });
      const qvVars = panel.querySelector('#st-qv-vars');
      if (p.variants.length > 1) { p.variants.forEach((v,i) => { const pill = document.createElement('button'); pill.className = 'st-variant-pill'+(i===0?' selected':''); pill.textContent = v.title; if(!v.available) pill.style.opacity='0.4'; pill.addEventListener('click', () => { selectedVariantId = v.id; qvVars.querySelectorAll('.st-variant-pill').forEach(vp => vp.classList.remove('selected')); pill.classList.add('selected'); }); qvVars.appendChild(pill); }); }
      const addBtn = panel.querySelector('#st-qv-addbtn');
      addBtn.addEventListener('click', async function() {
        this.disabled = true; this.textContent = '...';
        const numericId = selectedVariantId.replace('gid://shopify/ProductVariant/','');
        try {
          const r = await fetch('/cart/add.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({items:[{id:parseInt(numericId),quantity:1}]}) });
          const data = await r.json();
          if (data.items) { this.textContent = 'Added to Cart ✓'; this.classList.add('st-added'); refreshCartCount(); }
          else { this.textContent = 'Error — try again'; this.disabled = false; }
        } catch { this.textContent = 'Error — try again'; this.disabled = false; }
      });
      panel.querySelector('#st-qv-closebtn').addEventListener('click', () => panel.remove());
      return panel;
    }

    function createLoadMoreBtn(query, cursor) {
      const btn = document.createElement('button');
      btn.className = 'st-load-more';
      btn.textContent = 'Show more results';
      btn.addEventListener('click', async () => {
        btn.textContent = 'Loading...'; btn.disabled = true;
        try {
          const r = await fetch(API_URL+'/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({shop:SHOP,message:query,cursor}) });
          const data = await r.json();
          if (data.products?.length) {
            btn.closest('.st-load-more-wrap')?.remove();
            const slider = messages.querySelector('.st-slider');
            if (slider) { data.products.forEach(p => { lastProducts.push(p); slider.appendChild(createProductCard(p)); }); if (data.cursor) { const wrap = document.createElement('div'); wrap.className = 'st-load-more-wrap'; wrap.appendChild(createLoadMoreBtn(query,data.cursor)); slider.closest('.st-products').appendChild(wrap); } }
            messages.scrollTop = messages.scrollHeight;
          } else { btn.textContent = 'No more results'; }
        } catch { btn.textContent = 'Error — try again'; btn.disabled = false; }
      });
      return btn;
    }

    function rebuildSlider(products, sliderEl) {
      sliderEl.innerHTML = '';
      products.forEach(p => sliderEl.appendChild(createProductCard(p)));
    }

    function renderProducts(products, query, cursor) {
      if (!products.length) return;
      lastProducts = products; currentSort = 'default';
      const wrapper = document.createElement('div');
      wrapper.className = 'st-products';
      const filterBar = document.createElement('div');
      filterBar.className = 'st-filter-bar';
      [{ label:'Price ↑', value:'price-asc' },{ label:'Price ↓', value:'price-desc' },{ label:'In stock', value:'in-stock' }].forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'st-filter-btn'; btn.textContent = f.label;
        btn.addEventListener('click', () => {
          const isActive = btn.classList.contains('active');
          filterBar.querySelectorAll('.st-filter-btn').forEach(b => b.classList.remove('active'));
          if (isActive) { currentSort = 'default'; rebuildSlider(lastProducts, sliderEl); }
          else { btn.classList.add('active'); currentSort = f.value; let filtered = [...lastProducts]; if (f.value==='in-stock') filtered = filtered.filter(p => p.available); else filtered = sortProducts(filtered,f.value); rebuildSlider(filtered,sliderEl); }
        });
        filterBar.appendChild(btn);
      });
      wrapper.appendChild(filterBar);
      const sliderWrap = document.createElement('div');
      sliderWrap.className = 'st-slider-wrap';
      const prevBtn = document.createElement('button');
      prevBtn.className = 'st-slider-btn st-slider-prev'; prevBtn.innerHTML = '&#8249;';
      const nextBtn = document.createElement('button');
      nextBtn.className = 'st-slider-btn st-slider-next'; nextBtn.innerHTML = '&#8250;';
      const sliderEl = document.createElement('div');
      sliderEl.className = 'st-slider';
      products.forEach(p => sliderEl.appendChild(createProductCard(p)));
      prevBtn.addEventListener('click', () => sliderEl.scrollBy({left:-185,behavior:'smooth'}));
      nextBtn.addEventListener('click', () => sliderEl.scrollBy({left:185,behavior:'smooth'}));
      let isDown=false,startX,scrollLeft;
      sliderEl.addEventListener('mousedown', e => { isDown=true; startX=e.pageX-sliderEl.offsetLeft; scrollLeft=sliderEl.scrollLeft; });
      sliderEl.addEventListener('mouseleave', () => { isDown=false; });
      sliderEl.addEventListener('mouseup', () => { isDown=false; });
      sliderEl.addEventListener('mousemove', e => { if(!isDown) return; e.preventDefault(); sliderEl.scrollLeft = scrollLeft-(e.pageX-sliderEl.offsetLeft-startX)*1.5; });
      sliderWrap.appendChild(prevBtn); sliderWrap.appendChild(sliderEl); sliderWrap.appendChild(nextBtn);
      wrapper.appendChild(sliderWrap);
      if (cursor) { const wrap = document.createElement('div'); wrap.className = 'st-load-more-wrap'; wrap.appendChild(createLoadMoreBtn(query,cursor)); wrapper.appendChild(wrap); }
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
    }

    function renderFollowUpChips(chips) {
      if (!chips?.length) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'st-follow-chips';
      chips.forEach(chip => { const btn = document.createElement('button'); btn.className = 'st-follow-chip'; btn.textContent = chip; btn.addEventListener('click', () => { wrapper.remove(); sendMessage(chip); }); wrapper.appendChild(btn); });
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage(text) {
      if (!text.trim()) return;
      chipsContainer.innerHTML = '';
      addUserMessage(text); input.value = ''; sendBtn.disabled = true; showTyping();
      try {
        const r = await fetch(API_URL+'/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({shop:SHOP,message:text}) });
        const data = await r.json();
        hideTyping(); addBotMessage(data.reply);
        if (data.products?.length) { renderProducts(data.products,data.searchQuery,data.cursor); if (data.followUpChips?.length) renderFollowUpChips(data.followUpChips); }
        if (data.promptChips?.length) renderChips(data.promptChips);
      } catch { hideTyping(); addBotMessage('Sorry, something went wrong. Please try again.'); }
      finally { sendBtn.disabled = false; }
    }

    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', e => { if (e.key==='Enter') sendMessage(input.value); });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
