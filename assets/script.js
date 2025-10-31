document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const feedback = document.getElementById("feedback");
      feedback.textContent = "✅ Gracias por tu mensaje. Te responderemos pronto.";
      form.reset();
    });
  }

  // Newsletter simple
  const newsletter = document.getElementById("newsletterForm");
  if (newsletter) {
    newsletter.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail").value;
      const fb = document.getElementById("newsletterFeedback");
      fb.textContent = `✅ ${email} suscrito correctamente.`;
      newsletter.reset();
    });
  }

  // Resaltar nav actual
  const path = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a => {
    if (a.getAttribute("href") === path || (path === "" && a.getAttribute("href") === "index.html")) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });

  // ===== Menu: filtros, búsqueda, orden y modal =====
  const menuGrid = document.getElementById("menuGrid");
  const filters = document.querySelectorAll(".category-filters .filter");
  const search = document.getElementById("menuSearch");
  const sortSelect = document.getElementById("sortSelect");
  const liveRegion = menuGrid; // aria-live already on #menuGrid

  function filterCards(term = "", cat = "all") {
    const q = term.trim().toLowerCase();
    const cards = menuGrid ? Array.from(menuGrid.querySelectorAll(".card")) : [];
    let visible = 0;
    cards.forEach(card => {
      const name = (card.dataset.name || "").toLowerCase();
      const catName = (card.dataset.cat || "all");
      const matchesCat = cat === "all" ? true : catName === cat;
      const matchesTerm = q === "" ? true : name.includes(q);
      const show = matchesCat && matchesTerm;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });
    if (liveRegion) liveRegion.setAttribute("aria-busy", "false");
    return visible;
  }

  // filtros por categoría
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const cat = btn.dataset.cat || "all";
      filterCards(search ? search.value : "", cat);
    });
  });

  // búsqueda con pequeño debounce
  let debounceTimer = null;
  if (search) {
    search.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const activeBtn = document.querySelector(".category-filters .filter.active");
        const cat = activeBtn ? activeBtn.dataset.cat : "all";
        filterCards(e.target.value, cat);
      }, 180);
    });
  }

  // ordenar (reordenar DOM según precio)
  function sortVisibleCards(mode = "default") {
    if (!menuGrid) return;
    const cards = Array.from(menuGrid.querySelectorAll(".card"));
    const visible = cards.filter(c => c.style.display !== "none");
    if (mode === "default") return;
    visible.sort((a, b) => {
      const aPriceEl = a.querySelector(".card-actions .order-btn");
      const bPriceEl = b.querySelector(".card-actions .order-btn");
      const aPrice = aPriceEl ? Number(aPriceEl.dataset.price || 0) : 0;
      const bPrice = bPriceEl ? Number(bPriceEl.dataset.price || 0) : 0;
      return mode === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    });
    // append in order (keeps filtered hidden cards in place)
    visible.forEach(node => menuGrid.appendChild(node));
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortVisibleCards(e.target.value);
    });
  }

  // Modal de producto (delegación)
  const productModal = document.getElementById("productModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalPrice = document.getElementById("modalPrice");
  const modalOrder = document.getElementById("modalOrder");
  const modalClose = productModal ? productModal.querySelector(".modal-close") : null;

  function openModalFromCard(card) {
    const name = card.dataset.name || "";
    const priceText = card.querySelector(".price") ? card.querySelector(".price").textContent.trim() : "";
    const desc = card.querySelector(".desc") ? card.querySelector(".desc").textContent.trim() : "";
    if (!productModal) return;
    modalTitle.textContent = name;
    modalDesc.textContent = desc;
    modalPrice.textContent = priceText;
    modalOrder.dataset.name = name;
    modalOrder.dataset.price = card.querySelector(".card-actions .order-btn") ? card.querySelector(".card-actions .order-btn").dataset.price : "";
    productModal.setAttribute("aria-hidden", "false");
    if (modalClose) modalClose.focus();
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!productModal) return;
    productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Contador de carrito y funciones del carrito
  const cartCountEl = document.getElementById("cartCount");
  const cartBtn = document.getElementById("cartBtn");
  const cartModal = document.getElementById("cartModal");
  const cartClose = cartModal ? cartModal.querySelector(".cart-close") : null;
  const cartItemsEl = document.getElementById("cartItems");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  function getCart() {
    return JSON.parse(localStorage.getItem("cafe_cart") || "[]");
  }
  function saveCart(cart) {
    localStorage.setItem("cafe_cart", JSON.stringify(cart));
    updateCartCount();
  }
  function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((s, it) => s + (it.qty || 0), 0);
    if (cartCountEl) cartCountEl.textContent = total;
  }

  function formatPrice(n) {
    return n ? `$${n.toLocaleString('es-CO')}` : '$0';
  }

  function renderCart() {
    const cart = getCart();
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<div class="empty-cart">Tu pedido está vacío. Agrega algo delicioso 😊</div>`;
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(0);
      return;
    }
    let subtotal = 0;
    cart.forEach((it, idx) => {
      subtotal += (it.price || 0) * (it.qty || 0);
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <div class="ci-left">
          <div class="ci-title">${escapeHtml(it.name)}</div>
          <div class="ci-qty">
            <button class="qty-btn qty-decrease" data-idx="${idx}" aria-label="Disminuir cantidad" title="Disminuir">−</button>
            <span class="qty-value">${it.qty}</span>
            <button class="qty-btn qty-increase" data-idx="${idx}" aria-label="Aumentar cantidad" title="Aumentar">+</button>
          </div>
        </div>
        <div class="ci-right">
          <div class="ci-price">${formatPrice((it.price || 0) * (it.qty || 1))}</div>
          <div><button class="remove-item" data-idx="${idx}" aria-label="Eliminar artículo" title="Eliminar">🗑️</button></div>
        </div>
      `;
      cartItemsEl.appendChild(itemEl);
    });
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotal);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"'`=\/]/g, function(s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      })[s];
    });
  }

  // eventos delegados dentro del modal de carrito
  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', (e) => {
      const dec = e.target.closest('.qty-decrease');
      const inc = e.target.closest('.qty-increase');
      const rem = e.target.closest('.remove-item');
      if (dec || inc || rem) {
        const idx = Number((dec||inc||rem).dataset.idx);
        const cart = getCart();
        if (!cart[idx]) return;
        if (dec) {
          cart[idx].qty = Math.max(0, (cart[idx].qty || 1) - 1);
          if (cart[idx].qty === 0) cart.splice(idx, 1);
        } else if (inc) {
          cart[idx].qty = (cart[idx].qty || 0) + 1;
        } else if (rem) {
          cart.splice(idx, 1);
        }
        saveCart(cart);
        renderCart();
      }
    });
  }

  // abrir/cerrar carrito
  function openCart() {
    if (!cartModal) return;
    renderCart();
    cartModal.setAttribute('aria-hidden', 'false');
    if (cartClose) cartClose.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    if (!cartModal) return;
    cartModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', openCart);
  }
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) closeCart();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cartModal && cartModal.getAttribute('aria-hidden') === 'false') closeCart();
      if (productModal && productModal.getAttribute('aria-hidden') === 'false') closeModal();
    }
  });

  // Vaciar carrito
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (!confirm('¿Vaciar todo el pedido?')) return;
      saveCart([]);
      renderCart();
      closeCart();
    });
  }

  // Checkout (simulado)
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = getCart();
      if (!cart.length) { alert('Tu pedido está vacío.'); return; }
      // Aquí se podría integrar un checkout real
      alert('Gracias — tu pedido fue enviado (simulado).');
      saveCart([]);
      renderCart();
      closeCart();
    });
  }

  // Integración con botones "Pedir" ya existentes
  if (menuGrid) {
    menuGrid.addEventListener("click", (e) => {
      const orderBtn = e.target.closest(".order-btn");
      if (orderBtn) {
        const item = { name: orderBtn.dataset.name, price: Number(orderBtn.dataset.price || 0), qty: 1 };
        const cart = getCart();
        const existing = cart.find(i => i.name === item.name);
        if (existing) existing.qty += 1; else cart.push(item);
        saveCart(cart);
        // abrir carrito para feedback visual
        openCart();
      }
    });
  }

  // Inicializar: mostrar todas las tarjetas y contador
  filterCards();
  updateCartCount();
});
