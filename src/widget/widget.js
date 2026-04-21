(function () {
  const SHOP = window.sellthruShop || window.sellthruConfig?.shop || '';
  const API_URL = window.sellthruApiUrl || window.sellthruConfig?.apiUrl || '';

  async function init() {
    try {
      const r = await fetch(`${API_URL}/api/widget/config?shop=${encodeURIComponent(SHOP)}`);
      const config = await r.json();
      if (!config.enabled) return;
      mount(config);
    } catch (e) {
      mount({ enabled: true, color: '#000000', greeting: 'Hi! How can I help you find something today?', promptChips: ["What's new?", 'Best sellers', 'Under $100', 'Gifts'] });
    }
  }

  function mount(config) {
    if (document.getElementById('slt-launcher')) return;
    const COLOR = config.color || '#000';
    const GREETING = config.greeting || 'Hi! How can I help you find something today?';
    const CHIPS = config.promptChips || ["What's new?", 'Best sellers', 'Under $100', 'Gifts'];

    const style = document.createElement('style');
    style.id = 'slt-styles';
    style.textContent = `
      #slt-launcher{position:fixed!important;bottom:24px!important;right:24px!important;width:56px!important;height:56px!important;border-radius:50%!important;background:${COLOR}!important;border:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:2147483647!important;box-shadow:0 4px 16px rgba(0,0,0,0.18)!important;transition:transform 0.2s!important;padding:0!important}
      #slt-launcher:hover{transform:scale(1.08)!important}
      #slt-launcher svg{width:26px!important;height:26px!important;fill:white!important;pointer-events:none!important}
      #slt-window{position:fixed!important;bottom:92px!important;right:24px!important;width:420px!important;height:620px!important;background:#fff!important;border-radius:20px!important;border:1px solid #e0e0e0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;z-index:2147483646!important;box-shadow:0 8px 40px rgba(0,0,0,0.14)!important;transition:opacity 0.25s,transform 0.25s!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important}
      #slt-window.slt-hidden{opacity:0!important;pointer-events:none!important;transform:translateY(14px)!important}
      #slt-window.slt-expanded{width:90vw!important;height:90vh!important;bottom:5vh!important;right:5vw!important;border-radius:16px!important}
      #slt-header{background:${COLOR}!important;color:#fff!important;padding:12px 16px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-shrink:0!important;gap:8px!important}
      #slt-header-left{display:flex!important;align-items:center!important;gap:8px!important;flex:1!important;min-width:0!important}
      #slt-header-dot{width:8px!important;height:8px!important;background:#4ade80!important;border-radius:50%!important;animation:slt-pulse 2s infinite!important;flex-shrink:0!important}
      #slt-header-title{font-size:14px!important;font-weight:600!important;white-space:nowrap!important}
      #slt-size-filter{background:rgba(255,255,255,0.15)!important;border:1px solid rgba(255,255,255,0.3)!important;color:#fff!important;border-radius:20px!important;padding:4px 10px!important;font-size:11px!important;cursor:pointer!important;white-space:nowrap!important;transition:background 0.15s!important}
      #slt-size-filter:hover{background:rgba(255,255,255,0.25)!important}
      #slt-header-actions{display:flex!important;align-items:center!important;gap:6px!important;flex-shrink:0!important}
      .slt-icon-btn{background:none!important;border:none!important;color:rgba(255,255,255,0.8)!important;cursor:pointer!important;font-size:16px!important;padding:4px!important;line-height:1!important;transition:color 0.15s!important}
      .slt-icon-btn:hover{color:#fff!important}
      @keyframes slt-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      #slt-messages{flex:1!important;overflow-y:auto!important;padding:14px!important;display:flex!important;flex-direction:column!important;gap:12px!important}
      #slt-messages::-webkit-scrollbar{width:4px!important}
      #slt-messages::-webkit-scrollbar-thumb{background:#e0e0e0!important;border-radius:4px!important}
      .slt-msg{max-width:85%!important;padding:10px 14px!important;border-radius:14px!important;font-size:14px!important;line-height:1.5!important;word-break:break-word!important}
      .slt-bot{background:#f5f5f5!important;color:#111!important;align-self:flex-start!important;border-bottom-left-radius:4px!important}
      .slt-user{background:${COLOR}!important;color:#fff!important;align-self:flex-end!important;border-bottom-right-radius:4px!important}
      .slt-typing{display:flex!important;gap:4px!important;align-items:center!important;padding:12px 16px!important;background:#f5f5f5!important;border-radius:14px!important;border-bottom-left-radius:4px!important;align-self:flex-start!important}
      .slt-typing span{width:7px!important;height:7px!important;background:#bbb!important;border-radius:50%!important;display:inline-block!important;animation:slt-bounce 1.2s infinite!important}
      .slt-typing span:nth-child(2){animation-delay:0.2s!important}
      .slt-typing span:nth-child(3){animation-delay:0.4s!important}
      @keyframes slt-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      .slt-products{width:100%!important}
      .slt-filter-bar{display:flex!important;gap:6px!important;flex-wrap:wrap!important;padding-bottom:8px!important}
      .slt-filter-btn{background:#fff!important;border:1px solid #ddd!important;border-radius:20px!important;padding:5px 12px!important;font-size:11px!important;font-weight:500!important;cursor:pointer!important;color:#333!important;transition:all 0.15s!important;white-space:nowrap!important}
      .slt-filter-btn:hover,.slt-filter-btn.active{background:${COLOR}!important;color:#fff!important;border-color:${COLOR}!important}
      .slt-slider-wrap{position:relative!important;width:100%!important}
      .slt-slider{display:flex!important;gap:10px!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;scrollbar-width:none!important;padding-bottom:4px!important;cursor:grab!important}
      .slt-slider::-webkit-scrollbar{display:none!important}
      .slt-slider:active{cursor:grabbing!important}
      .slt-slider-btn{position:absolute!important;top:38%!important;transform:translateY(-50%)!important;width:30px!important;height:30px!important;border-radius:50%!important;background:#fff!important;border:1px solid #ddd!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:10!important;font-size:16px!important;box-shadow:0 2px 8px rgba(0,0,0,0.1)!important;transition:all 0.15s!important;line-height:1!important}
      .slt-slider-btn:hover{background:${COLOR}!important;color:#fff!important;border-color:${COLOR}!important}
      .slt-slider-prev{left:-13px!important}
      .slt-slider-next{right:-13px!important}
      .slt-card{background:#fff!important;border:1px solid #ebebeb!important;border-radius:12px!important;overflow:hidden!important;transition:border-color 0.15s,transform 0.15s!important;display:flex!important;flex-direction:column!important;flex-shrink:0!important;width:165px!important;scroll-snap-align:start!important}
      .slt-card:hover{border-color:#ccc!important;transform:translateY(-2px)!important}
      .slt-card-img-wrap{position:relative!important;width:100%!important;aspect-ratio:0.75!important;overflow:hidden!important;cursor:pointer!important;background:#f8f8f8!important}
      .slt-card-img-wrap img{width:100%!important;height:100%!important;object-fit:cover!important;transition:transform 0.3s!important}
      .slt-card-img-wrap:hover img{transform:scale(1.04)!important}
      .slt-img-dots{position:absolute!important;bottom:7px!important;left:50%!important;transform:translateX(-50%)!important;display:flex!important;gap:4px!important}
      .slt-img-dot{width:5px!important;height:5px!important;border-radius:50%!important;background:rgba(255,255,255,0.5)!important;transition:background 0.2s!important}
      .slt-img-dot.active{background:#fff!important}
      .slt-card-actions-top{position:absolute!important;bottom:8px!important;right:8px!important;display:flex!important;gap:4px!important}
      .slt-card-icon-btn{width:28px!important;height:28px!important;border-radius:50%!important;background:rgba(255,255,255,0.9)!important;border:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:13px!important;transition:background 0.15s!important;backdrop-filter:blur(4px)!important}
      .slt-card-icon-btn:hover{background:#fff!important}
      .slt-card-badge{position:absolute!important;top:7px!important;left:7px!important;font-size:9px!important;font-weight:700!important;padding:3px 7px!important;border-radius:4px!important;text-transform:uppercase!important;letter-spacing:0.5px!important}
      .slt-badge-out{background:#e44!important;color:#fff!important}
      .slt-badge-sale{background:#e44!important;color:#fff!important}
      .slt-card-body{padding:9px 10px 11px!important;flex:1!important;display:flex!important;flex-direction:column!important}
      .slt-card-title{font-size:11px!important;font-weight:600!important;color:#111!important;margin-bottom:4px!important;line-height:1.4!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
      .slt-card-prices{display:flex!important;align-items:center!important;gap:5px!important;margin-bottom:6px!important;flex-wrap:wrap!important}
      .slt-price{font-size:13px!important;font-weight:700!important;color:#111!important}
      .slt-compare{font-size:11px!important;color:#aaa!important;text-decoration:line-through!important}
      .slt-variants{display:flex!important;flex-wrap:wrap!important;gap:3px!important;margin-bottom:7px!important}
      .slt-variant-pill{border:1.5px solid #e0e0e0!important;border-radius:4px!important;padding:2px 6px!important;font-size:9px!important;font-weight:500!important;cursor:pointer!important;color:#555!important;transition:all 0.15s!important;background:#fff!important;white-space:nowrap!important}
      .slt-variant-pill.selected{border-color:${COLOR}!important;color:${COLOR}!important;background:#f5f5f5!important}
      .slt-variant-more{font-size:9px!important;color:#999!important;padding:2px 0!important;align-self:center!important}
      .slt-card-actions{display:flex!important;gap:5px!important;margin-top:auto!important}
      .slt-add{flex:1!important;background:${COLOR}!important;color:#fff!important;border:none!important;border-radius:6px!important;padding:8px 4px!important;font-size:10px!important;font-weight:600!important;cursor:pointer!important;transition:background 0.15s!important}
      .slt-add:disabled{background:#ccc!important;cursor:default!important}
      .slt-add.slt-added{background:#1a7a4a!important}
      .slt-quick-view{background:#fff!important;color:#333!important;border:1.5px solid #e0e0e0!important;border-radius:6px!important;padding:8px!important;font-size:10px!important;font-weight:500!important;cursor:pointer!important;white-space:nowrap!important;transition:all 0.15s!important}
      .slt-quick-view:hover{border-color:${COLOR}!important;color:${COLOR}!important}
      .slt-refine-panel{background:#fffbf0!important;border:1px solid #f0e6c0!important;border-radius:12px!important;padding:12px 14px!important;width:100%!important}
      .slt-refine-title{font-size:12px!important;font-weight:600!important;color:#333!important;margin-bottom:4px!important}
      .slt-refine-sub{font-size:11px!important;color:#666!important;margin-bottom:10px!important}
      .slt-refine-chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-bottom:10px!important}
      .slt-refine-chip{background:#fff!important;border:1px solid #ddd!important;border-radius:20px!important;padding:6px 12px!important;font-size:11px!important;font-weight:500!important;cursor:pointer!important;color:#333!important;transition:all 0.15s!important;display:flex!important;align-items:center!important;gap:4px!important}
      .slt-refine-chip:hover{background:${COLOR}!important;color:#fff!important;border-color:${COLOR}!important}
      .slt-refine-chip svg{width:12px!important;height:12px!important;flex-shrink:0!important}
      .slt-modify-btn{background:${COLOR}!important;color:#fff!important;border:none!important;border-radius:20px!important;padding:7px 16px!important;font-size:11px!important;font-weight:600!important;cursor:pointer!important;transition:background 0.15s!important}
      .slt-modify-btn:hover{opacity:0.9!important}
      .slt-load-more-wrap{margin-top:8px!important}
      .slt-load-more{width:100%!important;background:#fff!important;border:1.5px solid ${COLOR}!important;border-radius:10px!important;padding:11px!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important;transition:all 0.15s!important;color:${COLOR}!important}
      .slt-load-more:hover{background:${COLOR}!important;color:#fff!important}
      .slt-follow-chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important;padding:4px 0!important}
      .slt-follow-chip{background:#f4f4f4!important;border:1px solid #e5e5e5!important;border-radius:20px!important;padding:6px 14px!important;font-size:12px!important;cursor:pointer!important;white-space:nowrap!important;transition:background 0.15s!important}
      .slt-follow-chip:hover{background:#e0e0e0!important}
      .slt-qv-panel{background:#fff!important;border:1px solid #ebebeb!important;border-radius:14px!important;overflow:hidden!important;width:100%!important}
      .slt-qv-imgs{display:flex!important;gap:6px!important;padding:10px!important;overflow-x:auto!important;background:#f8f8f8!important}
      .slt-qv-imgs img{width:64px!important;height:80px!important;object-fit:cover!important;border-radius:8px!important;border:2px solid transparent!important;cursor:pointer!important;flex-shrink:0!important;transition:border-color 0.15s!important}
      .slt-qv-imgs img.active{border-color:${COLOR}!important}
      .slt-qv-main{width:100%!important;aspect-ratio:0.75!important;object-fit:cover!important}
      .slt-qv-body{padding:14px!important}
      .slt-qv-title{font-size:15px!important;font-weight:700!important;margin-bottom:6px!important;color:#111!important}
      .slt-qv-desc{font-size:12px!important;color:#666!important;line-height:1.6!important;margin-bottom:12px!important}
      .slt-qv-add{width:100%!important;background:${COLOR}!important;color:#fff!important;border:none!important;border-radius:9px!important;padding:12px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;margin-bottom:8px!important;transition:background 0.15s!important}
      .slt-qv-add.slt-added{background:#1a7a4a!important}
      .slt-qv-close{width:100%!important;background:none!important;border:1px solid #ddd!important;border-radius:9px!important;padding:10px!important;font-size:13px!important;cursor:pointer!important;color:#555!important}
      .slt-qv-close:hover{border-color:#999!important;color:#000!important}
      #slt-chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important;padding:0 14px 10px!important;flex-shrink:0!important}
      .slt-chip{background:#f4f4f4!important;border:1px solid #e5e5e5!important;border-radius:20px!important;padding:7px 14px!important;font-size:12px!important;font-weight:500!important;cursor:pointer!important;white-space:nowrap!important;transition:background 0.15s!important}
      .slt-chip:hover{background:#e0e0e0!important}
      #slt-input-row{display:flex!important;gap:8px!important;padding:12px 14px!important;border-top:1px solid #f0f0f0!important;flex-shrink:0!important;background:#fff!important;align-items:center!important}
      #slt-input{flex:1!important;border:1.5px solid #e5e5e5!important;border-radius:22px!important;padding:10px 16px!important;font-size:14px!important;outline:none!important;font-family:inherit!important;color:#111!important;background:#f8f8f8!important}
      #slt-input:focus{border-color:${COLOR}!important;background:#fff!important}
      #slt-send{background:${COLOR}!important;color:#fff!important;border:none!important;border-radius:50%!important;width:38px!important;height:38px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;transition:background 0.15s!important;flex-shrink:0!important}
      #slt-send:disabled{background:#ccc!important;cursor:default!important}
      #slt-send svg{width:16px!important;height:16px!important;fill:white!important}
    `;
    document.head.appendChild(style);

    // Size filter state
    let selectedSize = null;
    const commonSizes = ['XS','S','M','L','XL','XXL','UK6','UK8','UK10','UK12','UK14','UK16'];

    const launcher = document.createElement('button');
    launcher.id = 'slt-launcher';
    launcher.setAttribute('aria-label', 'Open shopping assistant');
    launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
    document.body.appendChild(launcher);

    const win = document.createElement('div');
    win.id = 'slt-window';
    win.classList.add('slt-hidden');
    win.innerHTML = `
      <div id="slt-header">
        <div id="slt-header-left">
          <div id="slt-header-dot"></div>
          <span id="slt-header-title">Shopping Assistant</span>
        </div>
        <button id="slt-size-btn" class="slt-icon-btn" title="Filter by size" style="font-size:11px;padding:4px 8px;border:1px solid rgba(255,255,255,0.3);border-radius:20px;white-space:nowrap;">Size ▾</button>
        <div id="slt-header-actions">
          <button class="slt-icon-btn" id="slt-reset-btn" title="Reset conversation">↺</button>
          <button class="slt-icon-btn" id="slt-expand-btn" title="Expand">⤢</button>
          <button class="slt-icon-btn" id="slt-close">✕</button>
        </div>
      </div>
      <div id="slt-messages"></div>
      <div id="slt-chips"></div>
      <div id="slt-input-row">
        <input id="slt-input" type="text" placeholder="Ask me anything about fashion or products..." autocomplete="off"/>
        <button id="slt-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div>
    `;
    document.body.appendChild(win);

    // Size dropdown
    const sizeDropdown = document.createElement('div');
    sizeDropdown.id = 'slt-size-dropdown';
    sizeDropdown.style.cssText = `position:fixed;background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:12px;z-index:2147483648;box-shadow:0 4px 20px rgba(0,0,0,0.12);display:none;flex-wrap:wrap;gap:6px;width:220px;`;
    const clearBtn = document.createElement('button');
    clearBtn.style.cssText = 'width:100%;background:none;border:1px solid #ddd;border-radius:6px;padding:6px;font-size:11px;cursor:pointer;margin-bottom:6px;color:#555;';
    clearBtn.textContent = 'Clear size filter';
    clearBtn.addEventListener('click', () => { selectedSize = null; document.getElementById('slt-size-btn').textContent = 'Size ▾'; sizeDropdown.style.display = 'none'; });
    sizeDropdown.appendChild(clearBtn);
    commonSizes.forEach(size => {
      const btn = document.createElement('button');
      btn.style.cssText = `border:1.5px solid #ddd;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:500;cursor:pointer;background:#fff;color:#333;transition:all 0.15s;`;
      btn.textContent = size;
      btn.addEventListener('click', () => {
        selectedSize = size;
        document.getElementById('slt-size-btn').textContent = `${size} ✕`;
        sizeDropdown.style.display = 'none';
      });
      sizeDropdown.appendChild(btn);
    });
    document.body.appendChild(sizeDropdown);

    document.getElementById('slt-size-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = e.target.getBoundingClientRect();
      sizeDropdown.style.top = (rect.bottom + 8) + 'px';
      sizeDropdown.style.right = '24px';
      sizeDropdown.style.display = sizeDropdown.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', () => { sizeDropdown.style.display = 'none'; });

    const closeBtn = document.getElementById('slt-close');
    const messages = document.getElementById('slt-messages');
    const input = document.getElementById('slt-input');
    const sendBtn = document.getElementById('slt-send');
    const chipsContainer = document.getElementById('slt-chips');
    const resetBtn = document.getElementById('slt-reset-btn');
    const expandBtn = document.getElementById('slt-expand-btn');

    let isOpen = false;
    let isExpanded = false;
    let lastProducts = [];
    let currentSort = 'default';
    let conversationHistory = [];

    function toggleWidget() {
      isOpen = !isOpen;
      win.classList.toggle('slt-hidden', !isOpen);
      if (isOpen && messages.children.length === 0) { addBotMessage(GREETING); renderChips(CHIPS); }
      if (isOpen) setTimeout(() => input.focus(), 300);
    }

    launcher.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', toggleWidget);

    resetBtn.addEventListener('click', () => {
      messages.innerHTML = '';
      conversationHistory = [];
      selectedSize = null;
      document.getElementById('slt-size-btn').textContent = 'Size ▾';
      chipsContainer.innerHTML = '';
      addBotMessage(GREETING);
      renderChips(CHIPS);
    });

    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      win.classList.toggle('slt-expanded', isExpanded);
      expandBtn.textContent = isExpanded ? '⤡' : '⤢';
    });

    function renderChips(chips) {
      chipsContainer.innerHTML = '';
      chips.forEach(chip => {
        const btn = document.createElement('button');
        btn.className = 'slt-chip';
        btn.textContent = chip;
        btn.addEventListener('click', () => { chipsContainer.innerHTML = ''; sendMessage(chip); });
        chipsContainer.appendChild(btn);
      });
    }

    function addBotMessage(text) {
  const div = document.createElement('div');
  div.className = 'slt-msg slt-bot';
  div.textContent = text;
  messages.appendChild(div);
  setTimeout(() => {
    div.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

    function addUserMessage(text) {
      const div = document.createElement('div');
      div.className = 'slt-msg slt-user';
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'slt-typing';
      div.id = 'slt-typing-ind';
      div.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
      const t = document.getElementById('slt-typing-ind');
      if (t) t.remove();
    }

function refreshCartCount() {
  fetch('/cart.js')
    .then(r => r.json())
    .then(cart => {
      const count = cart.item_count;

      // Update cart count bubble
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
              oldBubble.classList.remove('hidden');
            }
          }
        }).catch(() => {});

      // Update count directly as backup
      document.querySelectorAll(
        '#cart-icon-bubble span:not(.visually-hidden), ' +
        '.cart-count-bubble span:not(.visually-hidden), ' +
        '[data-cart-count], .cart-count'
      ).forEach(el => {
        if (el.tagName === 'SPAN') el.textContent = count;
        else el.setAttribute('data-cart-count', count);
      });

      // Open cart using auto-detected trigger
      setTimeout(() => {
        if (!cartTriggerEl) cartTriggerEl = findCartTrigger();
        if (cartTriggerEl) {
          cartTriggerEl.click();
        }
      }, 300);

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
      card.className = 'slt-card';
      let selectedVariantId = p.variantId;
      let currentImgIndex = 0;
      const images = p.images?.length ? p.images : (p.image ? [p.image] : []);
      let saveBadge = '';
      if (p.comparePrice && p.price) {
        const orig = parseFloat(p.comparePrice.replace('$',''));
        const curr = parseFloat(p.price.replace('$',''));
        if (orig > curr) { const pct = Math.round((orig-curr)/orig*100); saveBadge = `<span class="slt-card-badge slt-badge-sale">-${pct}%</span>`; }
      }
      const outBadge = !p.available ? '<span class="slt-card-badge slt-badge-out">Out of stock</span>' : '';
      const dotsHtml = images.length > 1 ? `<div class="slt-img-dots">${images.map((_,i) => `<div class="slt-img-dot${i===0?' active':''}"></div>`).join('')}</div>` : '';
      const safeId = p.id.split('/').pop();

      card.innerHTML = `
        <div class="slt-card-img-wrap">
          ${outBadge}${saveBadge}
          <img id="sltcimg-${safeId}" src="${images[0]||''}" alt="${p.title}" onerror="this.style.background='#f0f0f0'"/>
          ${dotsHtml}
          <div class="slt-card-actions-top">
            <button class="slt-card-icon-btn" id="sltcqv-${safeId}" title="Quick view">⤢</button>
          </div>
        </div>
        <div class="slt-card-body">
          <div class="slt-card-title">${p.title}</div>
          <div class="slt-card-prices">
            <span class="slt-price">${p.price||''}</span>
            ${p.comparePrice?`<span class="slt-compare">${p.comparePrice}</span>`:''}
          </div>
          <div class="slt-variants" id="sltcvars-${safeId}"></div>
          <div class="slt-card-actions">
            <button class="slt-add" id="sltcadd-${safeId}">${p.available?'Add to Cart':'Out of Stock'}</button>
          </div>
        </div>
      `;

      const imgEl = card.querySelector(`#sltcimg-${safeId}`);
      const dots = card.querySelectorAll('.slt-img-dot');
      if (images.length > 1) {
        let imgTimer;
        card.querySelector('.slt-card-img-wrap').addEventListener('mouseenter', () => { imgTimer = setInterval(() => { currentImgIndex=(currentImgIndex+1)%images.length; imgEl.src=images[currentImgIndex]; dots.forEach((d,i)=>d.classList.toggle('active',i===currentImgIndex)); },1400); });
        card.querySelector('.slt-card-img-wrap').addEventListener('mouseleave', () => { clearInterval(imgTimer); currentImgIndex=0; imgEl.src=images[0]; dots.forEach((d,i)=>d.classList.toggle('active',i===0)); });
      }

      const variantContainer = card.querySelector(`#sltcvars-${safeId}`);
      if (p.variants.length > 1) {
        p.variants.slice(0,3).forEach((v,i) => {
          const pill = document.createElement('button');
          pill.className = 'slt-variant-pill'+(i===0?' selected':'');
          pill.textContent = v.title;
          if (!v.available) pill.style.opacity='0.4';
          pill.addEventListener('click', () => { selectedVariantId=v.id; variantContainer.querySelectorAll('.slt-variant-pill').forEach(vp=>vp.classList.remove('selected')); pill.classList.add('selected'); });
          variantContainer.appendChild(pill);
        });
        if (p.variants.length > 3) { const more=document.createElement('span'); more.className='slt-variant-more'; more.textContent=`+${p.variants.length-3}`; variantContainer.appendChild(more); }
      }

      card.querySelector(`#sltcqv-${safeId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        const existing=document.getElementById('slt-qv-active'); if(existing) existing.remove();
        const qv=renderQuickView(p); qv.id='slt-qv-active'; messages.appendChild(qv); messages.scrollTop=messages.scrollHeight;
      });

      const addBtn = card.querySelector(`#sltcadd-${safeId}`);
      if (p.available) {
        addBtn.addEventListener('click', async function() {
          this.disabled=true; this.textContent='...';
          const numericId=selectedVariantId.replace('gid://shopify/ProductVariant/','');
          try {
            const r=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:parseInt(numericId),quantity:1}]})});
            const data=await r.json();
            if(data.items){this.textContent='Added ✓';this.classList.add('slt-added');refreshCartCount();}
            else{this.textContent='Error';this.disabled=false;}
          } catch{this.textContent='Error';this.disabled=false;}
        });
      } else { addBtn.disabled=true; }
      return card;
    }

    function renderQuickView(p) {
      const panel=document.createElement('div');
      panel.className='slt-qv-panel';
      const images=p.images?.length?p.images:(p.image?[p.image]:[]);
      let selectedVariantId=p.variantId;
      panel.innerHTML=`<img class="slt-qv-main" id="slt-qv-mainimg" src="${images[0]||''}" alt="${p.title}"/><div class="slt-qv-imgs" id="slt-qv-thumbs"></div><div class="slt-qv-body"><div class="slt-qv-title">${p.title}</div><div class="slt-card-prices" style="margin-bottom:10px"><span class="slt-price">${p.price||''}</span>${p.comparePrice?`<span class="slt-compare">${p.comparePrice}</span>`:''}</div><div class="slt-qv-desc">${p.description||'No description available.'}</div><div class="slt-variants" id="slt-qv-vars" style="margin-bottom:12px"></div><button class="slt-qv-add" id="slt-qv-addbtn">Add to Cart</button><button class="slt-qv-close" id="slt-qv-closebtn">← Back to results</button></div>`;
      const mainImg=panel.querySelector('#slt-qv-mainimg');
      const thumbsContainer=panel.querySelector('#slt-qv-thumbs');
      images.forEach((img,i)=>{const thumb=document.createElement('img');thumb.src=img;if(i===0)thumb.classList.add('active');thumb.addEventListener('click',()=>{mainImg.src=img;thumbsContainer.querySelectorAll('img').forEach(t=>t.classList.remove('active'));thumb.classList.add('active');});thumbsContainer.appendChild(thumb);});
      const qvVars=panel.querySelector('#slt-qv-vars');
      if(p.variants.length>1){p.variants.forEach((v,i)=>{const pill=document.createElement('button');pill.className='slt-variant-pill'+(i===0?' selected':'');pill.textContent=v.title;if(!v.available)pill.style.opacity='0.4';pill.addEventListener('click',()=>{selectedVariantId=v.id;qvVars.querySelectorAll('.slt-variant-pill').forEach(vp=>vp.classList.remove('selected'));pill.classList.add('selected');});qvVars.appendChild(pill);});}
      const addBtn=panel.querySelector('#slt-qv-addbtn');
      addBtn.addEventListener('click',async function(){
        this.disabled=true;this.textContent='...';
        const numericId=selectedVariantId.replace('gid://shopify/ProductVariant/','');
        try{const r=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:parseInt(numericId),quantity:1}]})});const data=await r.json();if(data.items){this.textContent='Added to Cart ✓';this.classList.add('slt-added');refreshCartCount();}else{this.textContent='Error';this.disabled=false;}}catch{this.textContent='Error';this.disabled=false;}
      });
      panel.querySelector('#slt-qv-closebtn').addEventListener('click',()=>panel.remove());
      return panel;
    }

    function createLoadMoreBtn(query, cursor, totalHint) {
      const btn=document.createElement('button');
      btn.className='slt-load-more';
      btn.textContent = totalHint ? `Show more styles` : 'Show more results';
      btn.addEventListener('click',async()=>{
        btn.textContent='Loading...';btn.disabled=true;
        try{
          const r=await fetch(API_URL+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop:SHOP,message:query,cursor,history:conversationHistory})});
          const data=await r.json();
          if(data.products?.length){
            btn.closest('.slt-load-more-wrap')?.remove();
            const slider=messages.querySelector('.slt-slider');
            if(slider){data.products.forEach(p=>{lastProducts.push(p);slider.appendChild(createProductCard(p));});if(data.cursor){const wrap=document.createElement('div');wrap.className='slt-load-more-wrap';wrap.appendChild(createLoadMoreBtn(query,data.cursor));slider.closest('.slt-products').appendChild(wrap);}}
            messages.scrollTop=messages.scrollHeight;
          }else{btn.textContent='No more results';}
        }catch{btn.textContent='Error — try again';btn.disabled=false;}
      });
      return btn;
    }

    function rebuildSlider(products,sliderEl){sliderEl.innerHTML='';products.forEach(p=>sliderEl.appendChild(createProductCard(p)));}

    function renderRefinePanel(searchQuery) {
      const panel = document.createElement('div');
      panel.className = 'slt-refine-panel';
      panel.innerHTML = `
        <div class="slt-refine-title">Make it yours</div>
        <div class="slt-refine-sub">Refine your results:</div>
        <div class="slt-refine-chips" id="slt-refine-chips-container"></div>
        <button class="slt-modify-btn" id="slt-modify-btn">Modify the results</button>
      `;

      const refineOptions = [
        { label: 'Under $50', query: `${searchQuery} under $50` },
        { label: 'Under $100', query: `${searchQuery} under $100` },
        { label: 'Black', query: `${searchQuery} black` },
        { label: 'White', query: `${searchQuery} white` },
        { label: 'Red', query: `${searchQuery} red` },
        { label: 'New arrivals', query: `new arrival ${searchQuery}` },
      ];

      const container = panel.querySelector('#slt-refine-chips-container');
      refineOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'slt-refine-chip';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
          panel.remove();
          sendMessage(opt.query);
        });
        container.appendChild(btn);
      });

      panel.querySelector('#slt-modify-btn').addEventListener('click', () => {
        input.value = `Show me ${searchQuery} but `;
        input.focus();
        panel.remove();
      });

      return panel;
    }

    function renderProducts(products, query, cursor) {
      if(!products.length)return;
      lastProducts=products; currentSort='default';
      const wrapper=document.createElement('div');wrapper.className='slt-products';
      const filterBar=document.createElement('div');filterBar.className='slt-filter-bar';
      let sliderEl;
      [{label:'Price ↑',value:'price-asc'},{label:'Price ↓',value:'price-desc'},{label:'In stock',value:'in-stock'}].forEach(f=>{
        const btn=document.createElement('button');btn.className='slt-filter-btn';btn.textContent=f.label;
        btn.addEventListener('click',()=>{
          const isActive=btn.classList.contains('active');
          filterBar.querySelectorAll('.slt-filter-btn').forEach(b=>b.classList.remove('active'));
          if(isActive){currentSort='default';rebuildSlider(lastProducts,sliderEl);}
          else{btn.classList.add('active');currentSort=f.value;let filtered=[...lastProducts];if(f.value==='in-stock')filtered=filtered.filter(p=>p.available);else filtered=sortProducts(filtered,f.value);rebuildSlider(filtered,sliderEl);}
        });
        filterBar.appendChild(btn);
      });
      wrapper.appendChild(filterBar);

      const sliderWrap=document.createElement('div');sliderWrap.className='slt-slider-wrap';
      const prevBtn=document.createElement('button');prevBtn.className='slt-slider-btn slt-slider-prev';prevBtn.innerHTML='&#8249;';
      const nextBtn=document.createElement('button');nextBtn.className='slt-slider-btn slt-slider-next';nextBtn.innerHTML='&#8250;';
      sliderEl=document.createElement('div');sliderEl.className='slt-slider';
      products.forEach(p=>sliderEl.appendChild(createProductCard(p)));
      prevBtn.addEventListener('click',()=>sliderEl.scrollBy({left:-175,behavior:'smooth'}));
      nextBtn.addEventListener('click',()=>sliderEl.scrollBy({left:175,behavior:'smooth'}));
      let isDown=false,startX,scrollLeft;
      sliderEl.addEventListener('mousedown',e=>{isDown=true;startX=e.pageX-sliderEl.offsetLeft;scrollLeft=sliderEl.scrollLeft;});
      sliderEl.addEventListener('mouseleave',()=>{isDown=false;});
      sliderEl.addEventListener('mouseup',()=>{isDown=false;});
      sliderEl.addEventListener('mousemove',e=>{if(!isDown)return;e.preventDefault();sliderEl.scrollLeft=scrollLeft-(e.pageX-sliderEl.offsetLeft-startX)*1.5;});
      sliderWrap.appendChild(prevBtn);sliderWrap.appendChild(sliderEl);sliderWrap.appendChild(nextBtn);
      wrapper.appendChild(sliderWrap);

      if(cursor){const wrap=document.createElement('div');wrap.className='slt-load-more-wrap';wrap.appendChild(createLoadMoreBtn(query,cursor));wrapper.appendChild(wrap);}

      messages.appendChild(wrapper);

      // Add refine panel below products
      messages.appendChild(renderRefinePanel(query));
      messages.scrollTop=messages.scrollHeight;
    }

    function renderFollowUpChips(chips){
      if(!chips?.length)return;
      const wrapper=document.createElement('div');wrapper.className='slt-follow-chips';
      chips.forEach(chip=>{const btn=document.createElement('button');btn.className='slt-follow-chip';btn.textContent=chip;btn.addEventListener('click',()=>{wrapper.remove();sendMessage(chip);});wrapper.appendChild(btn);});
      messages.appendChild(wrapper);messages.scrollTop=messages.scrollHeight;
    }

    async function sendMessage(text) {
      if(!text.trim())return;
      chipsContainer.innerHTML='';
      addUserMessage(text);

     // Add to conversation history with search context
const userContent = selectedSize ? `${text} (size preference: ${selectedSize})` : text;
conversationHistory.push({ role: 'user', content: userContent });

      // Append size filter to query if set
      const queryWithSize = selectedSize ? `${text} in size ${selectedSize}` : text;

      input.value='';sendBtn.disabled=true;showTyping();
      try{
        const r=await fetch(API_URL+'/api/chat',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            shop:SHOP,
            message:queryWithSize,
            history:conversationHistory.slice(-10)
          })
        });
        const data=await r.json();
        hideTyping();
        addBotMessage(data.reply);

        // Add assistant response to history including what was searched
const assistantContent = data.searchQuery 
  ? `${data.reply} [Found products for: ${data.searchQuery}]`
  : data.reply;
conversationHistory.push({ role: 'assistant', content: assistantContent });

        if(data.products?.length){
          renderProducts(data.products,data.searchQuery||text,data.cursor);
          if(data.refineChips?.length)renderFollowUpChips(data.refineChips);
        }
        if(data.promptChips?.length)renderChips(data.promptChips);
      }catch{
        hideTyping();
        addBotMessage('Sorry, something went wrong. Please try again.');
      }finally{sendBtn.disabled=false;}
    }

    sendBtn.addEventListener('click',()=>sendMessage(input.value));
    input.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage(input.value);});

    // Auto-detect cart trigger on page load
let cartTriggerEl = null;

function findCartTrigger() {
  // Try in order of most common themes
  const selectors = [
    '#cart-icon-bubble',              // Dawn
    '#CartToggle',                    // Debut
    '.cart-toggle',                   // Impulse
    '[data-cart-toggle]',             // Various
    '[aria-controls="cart-drawer"]',  // Various
    '[aria-controls="CartDrawer"]',   // Dawn variant
    'a[href="/cart"]',                // Universal fallback
    '.cart__icon',                    // Prestige
    '#cart',                          // Simple themes
    '.js-cart-count',                 // Various
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log('SellThru: cart trigger found:', sel);
      return el;
    }
  }
  return null;
}

// Find cart trigger after DOM is ready
setTimeout(() => {
  cartTriggerEl = findCartTrigger();
}, 1000);
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();