(function () {
  const SHOP = window.sellthruConfig?.shop || '';
  const API_URL = window.sellthruConfig?.apiUrl || '';
  const GREETING = window.sellthruConfig?.greeting || 'Hi! How can I help you find something today?';
<<<<<<< HEAD
  const CHIPS = window.sellthruConfig?.promptChips || ['What\'s new?', 'Best sellers', 'Under $100', 'Gifts'];

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #st-launcher{position:fixed!important;bottom:24px!important;right:24px!important;width:56px!important;height:56px!important;border-radius:50%!important;background:#000!important;border:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:2147483647!important;transition:transform 0.2s!important;box-shadow:0 4px 16px rgba(0,0,0,0.18)!important}
    #st-launcher:hover{transform:scale(1.08)!important}
    #st-launcher svg{width:26px;height:26px;fill:white;pointer-events:none}
    #st-window{position:fixed!important;bottom:92px!important;right:24px!important;width:430px!important;height:640px!important;background:#fff!important;border-radius:20px!important;border:1px solid #e5e5e5!important;display:flex!important;flex-direction:column!important;z-index:2147483646!important;overflow:hidden!important;transition:opacity 0.2s,transform 0.2s!important;box-shadow:0 8px 32px rgba(0,0,0,0.12)!important}
    #st-window.st-hidden{opacity:0!important;pointer-events:none!important;transform:translateY(12px)!important}
    #st-header{background:#000!important;color:#fff!important;padding:14px 18px!important;font-size:15px!important;font-weight:600!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-shrink:0!important}
    #st-header-left{display:flex;align-items:center;gap:10px}
    #st-header-dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:st-pulse 2s infinite}
    @keyframes st-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    #st-close{background:none!important;border:none!important;color:#fff!important;cursor:pointer!important;font-size:22px!important;line-height:1!important;padding:0!important;opacity:0.7}
    #st-close:hover{opacity:1}
    #st-messages{flex:1!important;overflow-y:auto!important;padding:14px!important;display:flex!important;flex-direction:column!important;gap:12px!important}
    #st-messages::-webkit-scrollbar{width:4px}
    #st-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
    .st-msg{max-width:85%!important;padding:10px 14px!important;border-radius:14px!important;font-size:14px!important;line-height:1.5!important;word-break:break-word!important}
    .st-bot{background:#f4f4f4!important;color:#111!important;align-self:flex-start!important;border-bottom-left-radius:4px!important}
    .st-user{background:#000!important;color:#fff!important;align-self:flex-end!important;border-bottom-right-radius:4px!important}
    .st-typing{display:flex!important;gap:4px!important;align-items:center!important;padding:12px 16px!important;background:#f4f4f4!important;border-radius:14px!important;border-bottom-left-radius:4px!important;align-self:flex-start!important}
    .st-typing span{width:7px!important;height:7px!important;background:#999!important;border-radius:50%!important;animation:st-bounce 1.2s infinite!important;display:inline-block!important}
    .st-typing span:nth-child(2){animation-delay:0.2s!important}
    .st-typing span:nth-child(3){animation-delay:0.4s!important}
    @keyframes st-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    .st-products{width:100%!important}
    .st-filter-bar{display:flex!important;gap:6px!important;flex-wrap:wrap!important;padding-bottom:8px!important}
    .st-filter-btn{background:#fff!important;border:1px solid #ddd!important;border-radius:20px!important;padding:5px 12px!important;font-size:11px!important;font-weight:500!important;cursor:pointer!important;color:#333!important;transition:all 0.15s!important;white-space:nowrap!important}
    .st-filter-btn:hover,.st-filter-btn.active{background:#000!important;color:#fff!important;border-color:#000!important}
    .st-slider-wrap{position:relative!important;width:100%!important}
    .st-slider{display:flex!important;gap:10px!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;scrollbar-width:none!important;-ms-overflow-style:none!important;padding-bottom:4px!important;cursor:grab!important}
    .st-slider::-webkit-scrollbar{display:none!important}
    .st-slider:active{cursor:grabbing!important}
    .st-slider-btn{position:absolute!important;top:40%!important;transform:translateY(-50%)!important;width:32px!important;height:32px!important;border-radius:50%!important;background:#fff!important;border:1px solid #ddd!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:10!important;font-size:18px!important;box-shadow:0 2px 8px rgba(0,0,0,0.12)!important;transition:all 0.15s!important;line-height:1!important}
    .st-slider-btn:hover{background:#000!important;color:#fff!important;border-color:#000!important}
    .st-slider-prev{left:-14px!important}
    .st-slider-next{right:-14px!important}
    .st-card{background:#fff!important;border:1px solid #ebebeb!important;border-radius:12px!important;overflow:hidden!important;transition:border-color 0.15s,transform 0.15s!important;display:flex!important;flex-direction:column!important;flex-shrink:0!important;width:175px!important;scroll-snap-align:start!important}
    .st-card:hover{border-color:#bbb!important;transform:translateY(-2px)!important}
    .st-card-img-wrap{position:relative!important;width:100%!important;aspect-ratio:1!important;overflow:hidden!important;cursor:pointer!important;background:#f8f8f8!important}
    .st-card-img-wrap img{width:100%!important;height:100%!important;object-fit:cover!important;transition:transform 0.3s!important}
    .st-card-img-wrap:hover img{transform:scale(1.05)!important}
    .st-img-dots{position:absolute!important;bottom:7px!important;left:50%!important;transform:translateX(-50%)!important;display:flex!important;gap:4px!important}
    .st-img-dot{width:5px!important;height:5px!important;border-radius:50%!important;background:rgba(255,255,255,0.5)!important;transition:background 0.2s!important}
    .st-img-dot.active{background:#fff!important}
    .st-card-badge{position:absolute!important;top:7px!important;left:7px!important;font-size:9px!important;font-weight:700!important;padding:3px 7px!important;border-radius:4px!important;text-transform:uppercase!important;letter-spacing:0.5px!important}
    .st-badge-out{background:#e44!important;color:#fff!important}
    .st-badge-sale{background:#e44!important;color:#fff!important}
    .st-card-body{padding:10px 11px 12px!important;flex:1!important;display:flex!important;flex-direction:column!important}
    .st-card-title{font-size:12px!important;font-weight:600!important;color:#111!important;margin-bottom:5px!important;line-height:1.4!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
    .st-card-prices{display:flex!important;align-items:center!important;gap:5px!important;margin-bottom:8px!important;flex-wrap:wrap!important}
    .st-price{font-size:14px!important;font-weight:700!important;color:#111!important}
    .st-compare{font-size:11px!important;color:#aaa!important;text-decoration:line-through!important}
    .st-save-badge{font-size:9px!important;background:#fff0f0!important;color:#d33!important;padding:2px 5px!important;border-radius:4px!important;font-weight:700!important}
    .st-variants{display:flex!important;flex-wrap:wrap!important;gap:4px!important;margin-bottom:8px!important}
    .st-variant-pill{border:1.5px solid #ddd!important;border-radius:5px!important;padding:3px 7px!important;font-size:10px!important;font-weight:500!important;cursor:pointer!important;color:#555!important;transition:all 0.15s!important;background:#fff!important}
    .st-variant-pill.selected{border-color:#000!important;color:#000!important;background:#f5f5f5!important}
    .st-variant-more{font-size:10px!important;color:#999!important;padding:3px 0!important;align-self:center!important}
    .st-card-actions{display:flex!important;gap:6px!important;margin-top:auto!important}
    .st-add{flex:1!important;background:#000!important;color:#fff!important;border:none!important;border-radius:7px!important;padding:9px 4px!important;font-size:11px!important;font-weight:600!important;cursor:pointer!important;transition:background 0.15s!important}
    .st-add:hover{background:#222!important}
    .st-add:disabled{background:#ccc!important;cursor:default!important}
    .st-add.st-added{background:#1a7a4a!important}
    .st-quick-view{background:#fff!important;color:#333!important;border:1.5px solid #ddd!important;border-radius:7px!important;padding:9px 8px!important;font-size:11px!important;font-weight:500!important;cursor:pointer!important;white-space:nowrap!important;transition:all 0.15s!important}
    .st-quick-view:hover{border-color:#000!important;color:#000!important}
    .st-load-more-wrap{margin-top:8px!important}
    .st-load-more{width:100%!important;background:#fff!important;border:1.5px solid #000!important;border-radius:10px!important;padding:11px!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important;transition:all 0.15s!important}
    .st-load-more:hover{background:#000!important;color:#fff!important}
    .st-follow-chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important;padding:4px 0!important}
    .st-follow-chip{background:#f4f4f4!important;border:1px solid #e5e5e5!important;border-radius:20px!important;padding:6px 14px!important;font-size:12px!important;cursor:pointer!important;white-space:nowrap!important;transition:background 0.15s!important}
    .st-follow-chip:hover{background:#e0e0e0!important}
    .st-qv-panel{background:#fff!important;border:1px solid #ebebeb!important;border-radius:14px!important;overflow:hidden!important;width:100%!important}
    .st-qv-imgs{display:flex!important;gap:6px!important;padding:10px!important;overflow-x:auto!important;background:#f8f8f8!important}
    .st-qv-imgs img{width:64px!important;height:64px!important;object-fit:cover!important;border-radius:8px!important;border:2px solid transparent!important;cursor:pointer!important;flex-shrink:0!important;transition:border-color 0.15s!important}
    .st-qv-imgs img.active{border-color:#000!important}
    .st-qv-main{width:100%!important;aspect-ratio:1!important;object-fit:cover!important}
    .st-qv-body{padding:14px!important}
    .st-qv-title{font-size:15px!important;font-weight:700!important;margin-bottom:6px!important;color:#111!important}
    .st-qv-desc{font-size:12px!important;color:#666!important;line-height:1.6!important;margin-bottom:12px!important}
    .st-qv-add{width:100%!important;background:#000!important;color:#fff!important;border:none!important;border-radius:9px!important;padding:12px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;margin-bottom:8px!important;transition:background 0.15s!important}
    .st-qv-add:hover{background:#222!important}
    .st-qv-add.st-added{background:#1a7a4a!important}
    .st-qv-close{width:100%!important;background:none!important;border:1px solid #ddd!important;border-radius:9px!important;padding:10px!important;font-size:13px!important;cursor:pointer!important;color:#555!important}
    .st-qv-close:hover{border-color:#999!important;color:#000!important}
    #st-chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important;padding:0 14px 10px!important;flex-shrink:0!important}
    .st-chip{background:#f4f4f4!important;border:1px solid #e5e5e5!important;border-radius:20px!important;padding:7px 14px!important;font-size:12px!important;font-weight:500!important;cursor:pointer!important;white-space:nowrap!important;transition:background 0.15s!important}
    .st-chip:hover{background:#e0e0e0!important}
    #st-input-row{display:flex!important;gap:8px!important;padding:12px 14px!important;border-top:1px solid #f0f0f0!important;flex-shrink:0!important;background:#fff!important}
    #st-input{flex:1!important;border:1.5px solid #e5e5e5!important;border-radius:10px!important;padding:10px 14px!important;font-size:14px!important;outline:none!important;font-family:inherit!important;color:#111!important}
    #st-input:focus{border-color:#000!important}
    #st-send{background:#000!important;color:#fff!important;border:none!important;border-radius:10px!important;padding:10px 16px!important;font-size:16px!important;cursor:pointer!important;transition:background 0.15s!important}
    #st-send:hover{background:#333!important}
    #st-send:disabled{background:#ccc!important;cursor:default!important}
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.id = 'st-launcher';
  launcher.setAttribute('aria-label', 'Open shopping assistant');
  launcher.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  document.body.appendChild(launcher);

=======
  const CHIPS = window.sellthruConfig?.promptChips || ['What\'s new?', 'Best sellers', 'Gifts under $50'];

  // Inject styles directly into page head
  const style = document.createElement('style');
  style.textContent = `
    #st-launcher { position:fixed!important; bottom:24px!important; right:24px!important; width:52px!important; height:52px!important; border-radius:50%!important; background:#000!important; border:none!important; cursor:pointer!important; display:flex!important; align-items:center!important; justify-content:center!important; z-index:2147483647!important; }
    #st-launcher svg { width:24px; height:24px; fill:white; pointer-events:none; }
    #st-window { position:fixed!important; bottom:88px!important; right:24px!important; width:380px!important; height:560px!important; background:#fff!important; border-radius:16px!important; border:1px solid #e5e5e5!important; display:flex!important; flex-direction:column!important; z-index:2147483646!important; overflow:hidden!important; transition:opacity 0.2s,transform 0.2s!important; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important; }
    #st-window.st-hidden { opacity:0!important; pointer-events:none!important; transform:translateY(8px)!important; }
    #st-header { background:#000!important; color:#fff!important; padding:14px 16px!important; font-size:15px!important; font-weight:600!important; display:flex!important; align-items:center!important; justify-content:space-between!important; flex-shrink:0!important; }
    #st-header button { background:none!important; border:none!important; color:#fff!important; cursor:pointer!important; font-size:20px!important; line-height:1!important; padding:0!important; }
    #st-messages { flex:1!important; overflow-y:auto!important; padding:16px!important; display:flex!important; flex-direction:column!important; gap:10px!important; }
    .st-msg { max-width:80%!important; padding:10px 14px!important; border-radius:12px!important; font-size:14px!important; line-height:1.5!important; word-break:break-word!important; }
    .st-msg.st-bot { background:#f4f4f4!important; color:#111!important; align-self:flex-start!important; border-bottom-left-radius:4px!important; }
    .st-msg.st-user { background:#000!important; color:#fff!important; align-self:flex-end!important; border-bottom-right-radius:4px!important; }
    .st-typing { display:flex!important; gap:4px!important; align-items:center!important; padding:10px 14px!important; background:#f4f4f4!important; border-radius:12px!important; align-self:flex-start!important; }
    .st-typing span { width:6px!important; height:6px!important; background:#999!important; border-radius:50%!important; animation:st-bounce 1.2s infinite!important; display:inline-block!important; }
    .st-typing span:nth-child(2) { animation-delay:0.2s!important; }
    .st-typing span:nth-child(3) { animation-delay:0.4s!important; }
    @keyframes st-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .st-products { display:flex!important; flex-direction:column!important; gap:8px!important; width:100%!important; }
    .st-card { display:flex!important; gap:10px!important; background:#fff!important; border:1px solid #e5e5e5!important; border-radius:10px!important; padding:10px!important; align-items:center!important; }
    .st-card img { width:56px!important; height:56px!important; object-fit:cover!important; border-radius:6px!important; flex-shrink:0!important; }
    .st-card-info { flex:1!important; min-width:0!important; }
    .st-card-title { font-size:13px!important; font-weight:500!important; color:#111!important; white-space:nowrap!important; overflow:hidden!important; text-overflow:ellipsis!important; }
    .st-card-price { font-size:13px!important; color:#555!important; margin-top:2px!important; }
    .st-add { background:#000!important; color:#fff!important; border:none!important; border-radius:6px!important; padding:6px 12px!important; font-size:12px!important; font-weight:500!important; cursor:pointer!important; white-space:nowrap!important; flex-shrink:0!important; }
    .st-add.st-added { background:#1a7a4a!important; }
    .st-add:disabled { background:#999!important; cursor:default!important; }
    #st-chips { display:flex!important; flex-wrap:wrap!important; gap:6px!important; padding:0 16px 8px!important; flex-shrink:0!important; }
    .st-chip { background:#f4f4f4!important; border:1px solid #e5e5e5!important; border-radius:20px!important; padding:6px 12px!important; font-size:12px!important; cursor:pointer!important; white-space:nowrap!important; }
    #st-input-row { display:flex!important; gap:8px!important; padding:12px 16px!important; border-top:1px solid #e5e5e5!important; flex-shrink:0!important; }
    #st-input { flex:1!important; border:1px solid #e5e5e5!important; border-radius:8px!important; padding:9px 12px!important; font-size:14px!important; outline:none!important; font-family:inherit!important; }
    #st-send { background:#000!important; color:#fff!important; border:none!important; border-radius:8px!important; padding:9px 14px!important; font-size:14px!important; cursor:pointer!important; }
    #st-send:disabled { background:#ccc!important; cursor:default!important; }
  `;
  document.head.appendChild(style);

  // Create launcher button
  const launcher = document.createElement('button');
  launcher.id = 'st-launcher';
  launcher.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  document.body.appendChild(launcher);

  // Create chat window
>>>>>>> fbd726a (Initial SellThru backend)
  const win = document.createElement('div');
  win.id = 'st-window';
  win.classList.add('st-hidden');
  win.innerHTML = `
    <div id="st-header">
<<<<<<< HEAD
      <div id="st-header-left">
        <div id="st-header-dot"></div>
        <span>Shopping Assistant</span>
      </div>
      <button id="st-close" aria-label="Close">×</button>
=======
      <span>Shopping Assistant</span>
      <button id="st-close">×</button>
>>>>>>> fbd726a (Initial SellThru backend)
    </div>
    <div id="st-messages"></div>
    <div id="st-chips"></div>
    <div id="st-input-row">
<<<<<<< HEAD
      <input id="st-input" type="text" placeholder="Search products, ask questions..." autocomplete="off"/>
=======
      <input id="st-input" type="text" placeholder="Search for products..." autocomplete="off"/>
>>>>>>> fbd726a (Initial SellThru backend)
      <button id="st-send">↑</button>
    </div>
  `;
  document.body.appendChild(win);

<<<<<<< HEAD
=======
  // Refs
>>>>>>> fbd726a (Initial SellThru backend)
  const closeBtn = document.getElementById('st-close');
  const messages = document.getElementById('st-messages');
  const input = document.getElementById('st-input');
  const sendBtn = document.getElementById('st-send');
  const chipsContainer = document.getElementById('st-chips');

<<<<<<< HEAD
  let isOpen = false;
  let lastProducts = [];
  let currentSort = 'default';
=======
  let cartId = null;
  let isOpen = false;
>>>>>>> fbd726a (Initial SellThru backend)

  function toggleWidget() {
    isOpen = !isOpen;
    win.classList.toggle('st-hidden', !isOpen);
    if (isOpen && messages.children.length === 0) {
      addBotMessage(GREETING);
      renderChips(CHIPS);
    }
  }

  launcher.addEventListener('click', toggleWidget);
  closeBtn.addEventListener('click', toggleWidget);

  function renderChips(chips) {
    chipsContainer.innerHTML = '';
    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.className = 'st-chip';
      btn.textContent = chip;
      btn.addEventListener('click', () => {
        chipsContainer.innerHTML = '';
        sendMessage(chip);
      });
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
<<<<<<< HEAD
    div.id = 'st-typing-ind';
=======
    div.id = 'st-typing';
>>>>>>> fbd726a (Initial SellThru backend)
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
<<<<<<< HEAD
    const t = document.getElementById('st-typing-ind');
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
    if (sort === 'price-asc') {
      sorted.sort((a, b) => parseFloat(a.price?.replace('$', '') || 0) - parseFloat(b.price?.replace('$', '') || 0));
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => parseFloat(b.price?.replace('$', '') || 0) - parseFloat(a.price?.replace('$', '') || 0));
    }
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
      const orig = parseFloat(p.comparePrice.replace('$', ''));
      const curr = parseFloat(p.price.replace('$', ''));
      if (orig > curr) {
        const pct = Math.round((orig - curr) / orig * 100);
        saveBadge = `<span class="st-card-badge st-badge-sale">-${pct}%</span>`;
      }
    }

    const outBadge = !p.available ? `<span class="st-card-badge st-badge-out">Out of stock</span>` : '';
    const dotsHtml = images.length > 1
      ? `<div class="st-img-dots">${images.map((_, i) => `<div class="st-img-dot${i === 0 ? ' active' : ''}"></div>`).join('')}</div>`
      : '';

    const safeId = p.id.split('/').pop();

    card.innerHTML = `
      <div class="st-card-img-wrap">
        ${outBadge}${saveBadge}
        <img id="cimg-${safeId}" src="${images[0] || ''}" alt="${p.title}" onerror="this.style.background='#f0f0f0'"/>
        ${dotsHtml}
      </div>
      <div class="st-card-body">
        <div class="st-card-title">${p.title}</div>
        <div class="st-card-prices">
          <span class="st-price">${p.price || ''}</span>
          ${p.comparePrice ? `<span class="st-compare">${p.comparePrice}</span>` : ''}
        </div>
        <div class="st-variants" id="cvars-${safeId}"></div>
        <div class="st-card-actions">
          <button class="st-add" id="cadd-${safeId}">${p.available ? 'Add to Cart' : 'Out of Stock'}</button>
          <button class="st-quick-view" id="cqv-${safeId}">View</button>
        </div>
      </div>
    `;

    // Image cycling on hover
    const imgEl = card.querySelector(`#cimg-${safeId}`);
    const dots = card.querySelectorAll('.st-img-dot');
    if (images.length > 1) {
      let imgTimer;
      card.querySelector('.st-card-img-wrap').addEventListener('mouseenter', () => {
        imgTimer = setInterval(() => {
          currentImgIndex = (currentImgIndex + 1) % images.length;
          imgEl.src = images[currentImgIndex];
          dots.forEach((d, i) => d.classList.toggle('active', i === currentImgIndex));
        }, 1200);
      });
      card.querySelector('.st-card-img-wrap').addEventListener('mouseleave', () => {
        clearInterval(imgTimer);
        currentImgIndex = 0;
        imgEl.src = images[0];
        dots.forEach((d, i) => d.classList.toggle('active', i === 0));
      });
    }

    // Variant pills
    const variantContainer = card.querySelector(`#cvars-${safeId}`);
    if (p.variants.length > 1) {
      p.variants.slice(0, 3).forEach((v, i) => {
        const pill = document.createElement('button');
        pill.className = 'st-variant-pill' + (i === 0 ? ' selected' : '');
        pill.textContent = v.title;
        if (!v.available) pill.style.opacity = '0.4';
        pill.addEventListener('click', () => {
          selectedVariantId = v.id;
          variantContainer.querySelectorAll('.st-variant-pill').forEach(vp => vp.classList.remove('selected'));
          pill.classList.add('selected');
        });
        variantContainer.appendChild(pill);
      });
      if (p.variants.length > 3) {
        const more = document.createElement('span');
        more.className = 'st-variant-more';
        more.textContent = `+${p.variants.length - 3} more`;
        variantContainer.appendChild(more);
      }
    }

    // Quick view
    card.querySelector(`#cqv-${safeId}`).addEventListener('click', () => {
      const existing = document.getElementById('st-qv-active');
      if (existing) existing.remove();
      const qv = renderQuickView(p);
      qv.id = 'st-qv-active';
      messages.appendChild(qv);
      messages.scrollTop = messages.scrollHeight;
    });

    card.querySelector('.st-card-img-wrap').addEventListener('click', () => {
      card.querySelector(`#cqv-${safeId}`).click();
    });

    // Add to cart
    const addBtn = card.querySelector(`#cadd-${safeId}`);
    if (p.available) {
      addBtn.addEventListener('click', async function () {
        this.disabled = true;
        this.textContent = '...';
        const numericId = selectedVariantId.replace('gid://shopify/ProductVariant/', '');
        try {
          const r = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: parseInt(numericId), quantity: 1 }] })
          });
          const data = await r.json();
          if (data.items) {
            this.textContent = 'Added ✓';
            this.classList.add('st-added');
            refreshCartCount();
          } else {
            this.textContent = 'Error';
            this.disabled = false;
          }
        } catch {
          this.textContent = 'Error';
          this.disabled = false;
        }
      });
    } else {
      addBtn.disabled = true;
    }

    return card;
  }

  function renderQuickView(p) {
    const panel = document.createElement('div');
    panel.className = 'st-qv-panel';

    const images = p.images?.length ? p.images : (p.image ? [p.image] : []);
    let selectedVariantId = p.variantId;

    panel.innerHTML = `
      <img class="st-qv-main" id="st-qv-mainimg" src="${images[0] || ''}" alt="${p.title}"/>
      <div class="st-qv-imgs" id="st-qv-thumbs"></div>
      <div class="st-qv-body">
        <div class="st-qv-title">${p.title}</div>
        <div class="st-card-prices" style="margin-bottom:10px">
          <span class="st-price">${p.price || ''}</span>
          ${p.comparePrice ? `<span class="st-compare">${p.comparePrice}</span>` : ''}
        </div>
        <div class="st-qv-desc">${p.description || 'No description available.'}</div>
        <div class="st-variants" id="st-qv-vars" style="margin-bottom:12px"></div>
        <button class="st-qv-add" id="st-qv-addbtn">Add to Cart</button>
        <button class="st-qv-close" id="st-qv-closebtn">← Back to results</button>
      </div>
    `;

    const mainImg = panel.querySelector('#st-qv-mainimg');
    const thumbsContainer = panel.querySelector('#st-qv-thumbs');

    images.forEach((img, i) => {
      const thumb = document.createElement('img');
      thumb.src = img;
      if (i === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        mainImg.src = img;
        thumbsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbsContainer.appendChild(thumb);
    });

    const qvVars = panel.querySelector('#st-qv-vars');
    if (p.variants.length > 1) {
      p.variants.forEach((v, i) => {
        const pill = document.createElement('button');
        pill.className = 'st-variant-pill' + (i === 0 ? ' selected' : '');
        pill.textContent = v.title;
        if (!v.available) pill.style.opacity = '0.4';
        pill.addEventListener('click', () => {
          selectedVariantId = v.id;
          qvVars.querySelectorAll('.st-variant-pill').forEach(vp => vp.classList.remove('selected'));
          pill.classList.add('selected');
        });
        qvVars.appendChild(pill);
      });
    }

    const addBtn = panel.querySelector('#st-qv-addbtn');
    addBtn.addEventListener('click', async function () {
      this.disabled = true;
      this.textContent = '...';
      const numericId = selectedVariantId.replace('gid://shopify/ProductVariant/', '');
      try {
        const r = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: parseInt(numericId), quantity: 1 }] })
        });
        const data = await r.json();
        if (data.items) {
          this.textContent = 'Added to Cart ✓';
          this.classList.add('st-added');
          refreshCartCount();
        } else {
          this.textContent = 'Error — try again';
          this.disabled = false;
        }
      } catch {
        this.textContent = 'Error — try again';
        this.disabled = false;
      }
    });

    panel.querySelector('#st-qv-closebtn').addEventListener('click', () => panel.remove());
    return panel;
  }

  function createLoadMoreBtn(query, cursor) {
    const btn = document.createElement('button');
    btn.className = 'st-load-more';
    btn.textContent = 'Show more results';
    btn.addEventListener('click', async () => {
      btn.textContent = 'Loading...';
      btn.disabled = true;
      try {
        const r = await fetch(API_URL + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop: SHOP, message: query, cursor })
        });
        const data = await r.json();
        if (data.products?.length) {
          btn.closest('.st-load-more-wrap')?.remove();
          const slider = messages.querySelector('.st-slider');
          if (slider) {
            data.products.forEach(p => {
              lastProducts.push(p);
              slider.appendChild(createProductCard(p));
            });
            if (data.cursor) {
              const wrap = document.createElement('div');
              wrap.className = 'st-load-more-wrap';
              wrap.appendChild(createLoadMoreBtn(query, data.cursor));
              slider.closest('.st-products').appendChild(wrap);
            }
          }
          messages.scrollTop = messages.scrollHeight;
        } else {
          btn.textContent = 'No more results';
        }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    });
    return btn;
  }

  function rebuildSlider(products, sliderEl) {
    sliderEl.innerHTML = '';
    products.forEach(p => sliderEl.appendChild(createProductCard(p)));
  }

  function renderProducts(products, query, cursor) {
    if (!products.length) return;
    lastProducts = products;
    currentSort = 'default';

    const wrapper = document.createElement('div');
    wrapper.className = 'st-products';

    // Filter bar
    const filterBar = document.createElement('div');
    filterBar.className = 'st-filter-bar';
    const filterDefs = [
      { label: 'Price ↑', value: 'price-asc' },
      { label: 'Price ↓', value: 'price-desc' },
      { label: 'In stock', value: 'in-stock' }
    ];
    filterDefs.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'st-filter-btn';
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        const isActive = btn.classList.contains('active');
        filterBar.querySelectorAll('.st-filter-btn').forEach(b => b.classList.remove('active'));
        if (isActive) {
          currentSort = 'default';
          rebuildSlider(lastProducts, sliderEl);
        } else {
          btn.classList.add('active');
          currentSort = f.value;
          let filtered = [...lastProducts];
          if (f.value === 'in-stock') filtered = filtered.filter(p => p.available);
          else filtered = sortProducts(filtered, f.value);
          rebuildSlider(filtered, sliderEl);
        }
      });
      filterBar.appendChild(btn);
    });
    wrapper.appendChild(filterBar);

    // Slider
    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'st-slider-wrap';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'st-slider-btn st-slider-prev';
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', () => sliderEl.scrollBy({ left: -185, behavior: 'smooth' }));

    const nextBtn = document.createElement('button');
    nextBtn.className = 'st-slider-btn st-slider-next';
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', () => sliderEl.scrollBy({ left: 185, behavior: 'smooth' }));

    const sliderEl = document.createElement('div');
    sliderEl.className = 'st-slider';
    products.forEach(p => sliderEl.appendChild(createProductCard(p)));

    // Drag to scroll
    let isDown = false, startX, scrollLeft;
    sliderEl.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - sliderEl.offsetLeft;
      scrollLeft = sliderEl.scrollLeft;
    });
    sliderEl.addEventListener('mouseleave', () => { isDown = false; });
    sliderEl.addEventListener('mouseup', () => { isDown = false; });
    sliderEl.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - sliderEl.offsetLeft;
      sliderEl.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });

    sliderWrap.appendChild(prevBtn);
    sliderWrap.appendChild(sliderEl);
    sliderWrap.appendChild(nextBtn);
    wrapper.appendChild(sliderWrap);

    // Load more
    if (cursor) {
      const wrap = document.createElement('div');
      wrap.className = 'st-load-more-wrap';
      wrap.appendChild(createLoadMoreBtn(query, cursor));
      wrapper.appendChild(wrap);
    }

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderFollowUpChips(chips) {
    if (!chips?.length) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'st-follow-chips';
    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.className = 'st-follow-chip';
      btn.textContent = chip;
      btn.addEventListener('click', () => {
        wrapper.remove();
        sendMessage(chip);
      });
      wrapper.appendChild(btn);
=======
    const t = document.getElementById('st-typing');
    if (t) t.remove();
  }

  function renderProducts(products) {
    if (!products.length) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'st-products';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'st-card';
      card.innerHTML = `
        <img src="${p.image || ''}" alt="${p.title}" onerror="this.style.display='none'"/>
        <div class="st-card-info">
          <div class="st-card-title">${p.title}</div>
          <div class="st-card-price">${p.price || ''}</div>
        </div>
        <button class="st-add">Add</button>
      `;
 card.querySelector('.st-add').addEventListener('click', async function () {
  this.disabled = true;
  this.textContent = '...';
  try {
    const variantNumericId = p.variantId.replace('gid://shopify/ProductVariant/', '');
    
    const r = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: parseInt(variantNumericId), quantity: 1 }]
      })
    });

    const data = await r.json();

    if (data.items) {
  this.textContent = 'Added';
  this.classList.add('st-added');

  // Fetch updated cart and refresh Dawn theme cart bubble
  fetch('/cart.js')
    .then(r => r.json())
    .then(cart => {
      const count = cart.item_count;

      // Dawn theme specific selectors
      const bubbles = document.querySelectorAll(
        '#cart-icon-bubble, ' +
        '.cart-count-bubble, ' +
        '[data-cart-count], ' +
        '.cart__count, ' +
        '.cart-count, ' +
        'a[href="/cart"] .visually-hidden ~ *'
      );
      bubbles.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
      });

      // Dawn theme uses this event to refresh cart drawer
      document.documentElement.dispatchEvent(
        new CustomEvent('cart:refresh', { bubbles: true })
      );

      // Also try Shopify section rendering API to refresh header
      fetch('/?sections=header')
        .then(r => r.json())
        .then(sections => {
          if (sections.header) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(sections.header, 'text/html');
            const newBubble = doc.querySelector('#cart-icon-bubble');
            const oldBubble = document.querySelector('#cart-icon-bubble');
            if (newBubble && oldBubble) {
              oldBubble.innerHTML = newBubble.innerHTML;
            }
          }
        });
    });
} else {
      this.textContent = 'Error';
      this.disabled = false;
    }
  } catch (err) {
    console.error('Cart error:', err);
    this.textContent = 'Error';
    this.disabled = false;
  }
});
      wrapper.appendChild(card);
>>>>>>> fbd726a (Initial SellThru backend)
    });
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
<<<<<<< HEAD
    chipsContainer.innerHTML = '';
=======
>>>>>>> fbd726a (Initial SellThru backend)
    addUserMessage(text);
    input.value = '';
    sendBtn.disabled = true;
    showTyping();
<<<<<<< HEAD

=======
>>>>>>> fbd726a (Initial SellThru backend)
    try {
      const r = await fetch(API_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, message: text })
      });
      const data = await r.json();
      hideTyping();
      addBotMessage(data.reply);
<<<<<<< HEAD
      if (data.products?.length) {
        renderProducts(data.products, data.searchQuery, data.cursor);
        if (data.followUpChips?.length) renderFollowUpChips(data.followUpChips);
      }
=======
      if (data.products?.length) renderProducts(data.products);
>>>>>>> fbd726a (Initial SellThru backend)
      if (data.promptChips?.length) renderChips(data.promptChips);
    } catch {
      hideTyping();
      addBotMessage('Sorry, something went wrong. Please try again.');
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(input.value); });

})();