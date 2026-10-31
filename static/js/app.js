// GiftHampers Single Page Application Engine (Multi-Photo Enabled)

// Global State
let state = {
  token: localStorage.getItem('gh_token') || null,
  user: JSON.parse(localStorage.getItem('gh_user')) || null,
  cart: JSON.parse(localStorage.getItem('gh_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('gh_wishlist')) || [],
  discountPercent: 0,
  products: [],
  catalogMinPrice: 0,
  catalogMaxPrice: 999999,
  aiSelection: { recipient: 'partner', occasion: 'All', budget_max: '100000' },
  builderItems: { box: [], treat: [], beverage: [], keepsake: [], card: [] },
  builder: {
    step: 1,
    box: null,
    items: [],
    card: null,
    cardMessage: '',
    categoryTab: 'treat'
  },
  orders: []
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  await fetchLiveExchangeRates();
  fetchProducts();
  fetchBuilderItems();
  updateCartUI();
  updateWishlistBadges();
  loadTopAnnouncementBanner();

  const curSelector = document.getElementById('currency-selector');
  if (curSelector) curSelector.value = currentCurrency;
  
  const dateInput = document.getElementById('checkout-delivery-date');
  if (dateInput) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    dateInput.value = futureDate.toISOString().split('T')[0];
  }
});

// Navigation Engine
function switchTab(tabName) {
  document.querySelectorAll('.spa-view').forEach(view => view.classList.add('hidden'));
  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) targetView.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.remove('text-amber-500', 'font-bold');
    btn.classList.add('text-slate-300');
  });
  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.add('text-amber-500', 'font-bold');
    activeBtn.classList.remove('text-slate-300');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'dashboard') loadUserOrders();
  if (tabName === 'admin') loadAdminDashboard();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-600' : 'bg-amber-600';
  const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';

  toast.className = `toast-animate pointer-events-auto ${bgClass} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border border-white/20`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-base"></i><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ----------------- AUTHENTICATION -----------------
function initAuth() {
  if (state.token && state.user) {
    renderUserNav();
    if (state.user.role === 'admin') {
      document.getElementById('nav-admin')?.classList.remove('hidden');
      document.getElementById('mobile-nav-admin')?.classList.remove('hidden');
    }
  }
}

function renderUserNav() {
  const container = document.getElementById('user-nav-container');
  if (!container) return;

  if (state.user) {
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <button onclick="switchTab('dashboard')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition">
          <i class="fa-solid fa-user"></i>
          <span>${state.user.name}</span>
        </button>
        <button onclick="handleLogout()" class="p-2 text-slate-400 hover:text-rose-400 text-xs transition" title="Log Out">
          <i class="fa-solid fa-right-from-bracket text-base"></i>
        </button>
      </div>
    `;
    const dashEmail = document.getElementById('dash-user-email');
    if (dashEmail) dashEmail.innerText = `${state.user.name} (${state.user.email})`;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/10">
        <i class="fa-regular fa-user"></i>
        <span>Sign In</span>
      </button>
    `;
  }
}

function openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
}
function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('auth-tab-login').className = 'pb-3 text-base font-bold border-b-2 border-amber-500 text-amber-400';
    document.getElementById('auth-tab-signup').className = 'pb-3 text-base font-bold text-slate-400 hover:text-white';
  } else {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('auth-tab-signup').className = 'pb-3 text-base font-bold border-b-2 border-amber-500 text-amber-400';
    document.getElementById('auth-tab-login').className = 'pb-3 text-base font-bold text-slate-400 hover:text-white';
  }
}

function fillDemoAuth(role) {
  if (role === 'admin') {
    document.getElementById('login-email').value = 'admin@gifthampers.com';
    document.getElementById('login-password').value = 'admin123';
  } else {
    document.getElementById('login-email').value = 'sarah@example.com';
    document.getElementById('login-password').value = 'user123';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('gh_token', data.token);
    localStorage.setItem('gh_user', JSON.stringify(data.user));

    renderUserNav();
    closeAuthModal();
    showToast(`Welcome back, ${data.user.name}!`);

    if (data.user.role === 'admin') {
      document.getElementById('nav-admin').classList.remove('hidden');
      document.getElementById('mobile-nav-admin').classList.remove('hidden');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('gh_token', data.token);
    localStorage.setItem('gh_user', JSON.stringify(data.user));

    renderUserNav();
    closeAuthModal();
    showToast(`Welcome to GiftHampers, ${data.user.name}!`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_user');
  document.getElementById('nav-admin').classList.add('hidden');
  document.getElementById('mobile-nav-admin').classList.add('hidden');
  renderUserNav();
  showToast('Logged out successfully.');
  switchTab('home');
}


// ----------------- PRODUCTS & CATALOG -----------------
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    state.products = data;
    renderHomeProducts();
    renderCatalogProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderHomeProducts() {
  const container = document.getElementById('home-products-grid');
  if (!container) return;
  const topSix = state.products.slice(0, 6);
  container.innerHTML = topSix.map(p => createProductCardHTML(p)).join('');
}

function renderCatalogProducts() {
  const container = document.getElementById('catalog-products-grid');
  if (!container) return;
  container.innerHTML = state.products.map(p => createProductCardHTML(p)).join('');
}

function createProductCardHTML(product) {
  const imagesCount = product.images ? product.images.length : 1;
  const mainImage = (product.images && product.images.length > 0) ? product.images[0] : product.image;
  const isWishlisted = state.wishlist.some(w => (typeof w === 'object' ? w.id : w) === product.id);

  return `
    <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col group relative">
      <div class="relative overflow-hidden h-56">
        <img src="${mainImage}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ${product.tag ? `<span class="absolute top-3 left-3 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full shadow z-10">${product.tag}</span>` : ''}
        
        <!-- Wishlist Button -->
        <button onclick="toggleWishlist(${product.id})" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 flex items-center justify-center transition hover:scale-110 shadow-lg z-10" title="Add to Wishlist">
          <i class="${isWishlisted ? 'fa-solid text-rose-500' : 'fa-regular text-slate-300 hover:text-rose-400'} fa-heart text-sm"></i>
        </button>

        ${imagesCount > 1 ? `<span class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 font-bold text-[11px] px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1"><i class="fa-solid fa-images"></i> ${imagesCount} Photos</span>` : ''}

        <button onclick="quickViewProduct(${product.id})" class="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/90 text-slate-200 hover:text-amber-400 text-xs backdrop-blur-md border border-slate-700">
          <i class="fa-solid fa-eye mr-1"></i> Quick View
        </button>
      </div>
      <div class="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span class="text-amber-400 font-semibold uppercase">${product.category}</span>
            <span class="flex items-center gap-1"><i class="fa-solid fa-star text-amber-400"></i> ${product.rating} (${product.reviews_count || 12})</span>
          </div>
          <h3 class="font-bold text-base text-white group-hover:text-amber-400 transition leading-snug">${product.name}</h3>
          <p class="text-slate-400 text-xs mt-1 line-clamp-2">${product.description}</p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            <span class="text-xl font-extrabold text-white">${formatCurrency(product.price)}</span>
            ${product.original_price ? `<span class="text-xs text-slate-500 line-through ml-1.5">${formatCurrency(product.original_price)}</span>` : ''}
          </div>
          <button onclick="addToCart(${product.id})" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/10 flex items-center gap-1.5">
            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function filterCategory(category) {
  switchTab('catalog');
  const catSelect = document.getElementById('catalog-category');
  if (catSelect) {
    catSelect.value = category;
    applyCatalogFilters();
  }
}

async function applyCatalogFilters() {
  const search = document.getElementById('catalog-search')?.value || '';
  const category = document.getElementById('catalog-category')?.value || 'All';
  const sort = document.getElementById('catalog-sort')?.value || 'default';

  let url = `/api/products?1=1`;
  if (category !== 'All') url += `&category=${encodeURIComponent(category)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (sort !== 'default') url += `&sort=${encodeURIComponent(sort)}`;
  if (state.catalogMinPrice > 0) url += `&min_price=${state.catalogMinPrice}`;
  if (state.catalogMaxPrice < 999999) url += `&max_price=${state.catalogMaxPrice}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    state.products = data;
    renderCatalogProducts();
  } catch (err) {
    console.error(err);
  }
}

function setCatalogPriceFilter(minP, maxP, btnElem) {
  state.catalogMinPrice = minP;
  state.catalogMaxPrice = maxP;
  document.querySelectorAll('.catalog-price-chip').forEach(c => {
    c.className = 'catalog-price-chip px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex-shrink-0';
  });
  if (btnElem) btnElem.className = 'catalog-price-chip px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 border border-amber-400 flex-shrink-0';
  applyCatalogFilters();
}

// QUICK VIEW MODAL WITH THUMBNAIL GALLERY CAROUSEL FOR MULTIPLE PHOTOS!
function quickViewProduct(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const mainImage = images[0];

  const content = document.getElementById('product-detail-content');
  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      
      <!-- Photo Gallery Section -->
      <div class="md:col-span-6 space-y-4">
        <div class="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
          <img id="main-gallery-img" src="${mainImage}" alt="${product.name}" class="w-full h-80 object-cover transition-all duration-300" />
        </div>

        <!-- Thumbnails row if multiple photos exist -->
        ${images.length > 1 ? `
          <div class="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            ${images.map((imgUrl, idx) => `
              <button onclick="setGalleryMainImage('${imgUrl}', this)" class="gallery-thumb-btn border-2 ${idx === 0 ? 'border-amber-500' : 'border-slate-800'} rounded-xl overflow-hidden flex-shrink-0 focus:outline-none transition">
                <img src="${imgUrl}" alt="Photo ${idx+1}" class="w-16 h-16 object-cover" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Details Section -->
      <div class="md:col-span-6 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">${product.category}</span>
          <span class="text-xs text-slate-400 flex items-center gap-1"><i class="fa-solid fa-star text-amber-400"></i> ${product.rating}</span>
        </div>

        <h2 class="text-2xl font-bold text-white leading-snug">${product.name}</h2>
        <div class="text-2xl font-extrabold text-amber-400">${formatCurrency(product.price)}</div>
        <p class="text-xs text-slate-300 leading-relaxed">${product.description}</p>

        <div class="space-y-2 pt-3 border-t border-slate-800">
          <div class="text-xs font-bold text-slate-200">Included in this Gift Box:</div>
          <ul class="text-xs text-slate-400 space-y-1">
            ${product.items.map(item => `<li class="flex items-center gap-2"><i class="fa-solid fa-check text-amber-500 text-[10px]"></i> ${item}</li>`).join('')}
          </ul>
        </div>

        <button onclick="addToCart(${product.id}); closeProductDetailModal();" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-400 transition mt-4 flex items-center justify-center gap-2">
          <i class="fa-solid fa-bag-shopping"></i> Add to Shopping Cart
        </button>
      </div>

    </div>
  `;
  document.getElementById('product-detail-modal').classList.remove('hidden');
}

function setGalleryMainImage(imgUrl, btnElem) {
  document.getElementById('main-gallery-img').src = imgUrl;
  document.querySelectorAll('.gallery-thumb-btn').forEach(btn => btn.classList.replace('border-amber-500', 'border-slate-800'));
  btnElem.classList.replace('border-slate-800', 'border-amber-500');
}

function closeProductDetailModal() {
  document.getElementById('product-detail-modal').classList.add('hidden');
}


// ----------------- CUSTOM BUILDER STUDIO -----------------
async function fetchBuilderItems() {
  try {
    const res = await fetch('/api/custom-builder/items');
    const data = await res.json();
    state.builderItems = data;
    renderBuilderStep(1);
  } catch (err) {
    console.error('Failed to load builder items:', err);
  }
}

function setBuilderStep(stepNum) {
  state.builder.step = stepNum;

  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`step-btn-${i}`);
    const content = document.getElementById(`builder-step-${i}`);
    if (i === stepNum) {
      btn.className = 'cursor-pointer py-3 rounded-xl bg-amber-500 text-slate-950 font-bold border border-amber-400 shadow-md';
      content.classList.remove('hidden');
    } else {
      btn.className = 'cursor-pointer py-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700';
      content.classList.add('hidden');
    }
  }

  const prevBtn = document.getElementById('builder-prev-btn');
  const nextBtn = document.getElementById('builder-next-btn');
  if (stepNum === 1) {
    prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  if (stepNum === 4) {
    nextBtn.innerText = 'Review Completed ✓';
    renderBuilderStep(4);
  } else {
    nextBtn.innerHTML = `Next Step <i class="fa-solid fa-arrow-right ml-2"></i>`;
  }

  renderBuilderStep(stepNum);
}

function prevBuilderStep() {
  if (state.builder.step > 1) setBuilderStep(state.builder.step - 1);
}

function nextBuilderStep() {
  if (state.builder.step === 1 && !state.builder.box) {
    showToast('Please select a box style to proceed.', 'error');
    return;
  }
  if (state.builder.step < 4) setBuilderStep(state.builder.step + 1);
}

function renderBuilderStep(stepNum) {
  if (stepNum === 1) {
    const grid = document.getElementById('box-options-grid');
    grid.innerHTML = state.builderItems.box.map(item => `
      <div onclick="selectBuilderBox(${item.id})" class="glass-card p-4 rounded-xl border cursor-pointer ${state.builder.box?.id === item.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800'}">
        <img src="${item.image}" alt="${item.name}" class="w-full h-32 object-cover rounded-lg mb-3" />
        <div class="font-bold text-sm text-white">${item.name}</div>
        <div class="text-xs text-slate-400 mt-0.5">${item.description}</div>
        <div class="text-sm font-extrabold text-amber-400 mt-2">${formatCurrency(item.price)}</div>
      </div>
    `).join('');
  } else if (stepNum === 2) {
    renderBuilderItemsCategory();
  } else if (stepNum === 3) {
    const grid = document.getElementById('card-options-grid');
    grid.innerHTML = state.builderItems.card.map(item => `
      <div onclick="selectBuilderCard(${item.id})" class="glass-card p-4 rounded-xl border cursor-pointer ${state.builder.card?.id === item.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800'}">
        <img src="${item.image}" alt="${item.name}" class="w-full h-28 object-cover rounded-lg mb-2" />
        <div class="font-bold text-sm text-white">${item.name}</div>
        <div class="text-xs font-extrabold text-amber-400 mt-1">${formatCurrency(item.price)}</div>
      </div>
    `).join('');
  } else if (stepNum === 4) {
    const details = document.getElementById('builder-summary-details');
    details.innerHTML = `
      <div class="font-bold text-base text-amber-400 border-b border-slate-700 pb-2">Custom Hamper Summary</div>
      <div><strong>Packaging:</strong> ${state.builder.box ? state.builder.box.name : 'None'} (${formatCurrency(state.builder.box?.price || 0)})</div>
      <div><strong>Selected Items (${state.builder.items.length}):</strong>
        <ul class="list-disc list-inside text-xs text-slate-300 mt-1 space-y-1">
          ${state.builder.items.map(i => `<li>${i.name} - ${formatCurrency(i.price)}</li>`).join('')}
        </ul>
      </div>
      <div><strong>Greeting Card:</strong> ${state.builder.card ? state.builder.card.name : 'None'} (${formatCurrency(state.builder.card?.price || 0)})</div>
      <div><strong>Card Message:</strong> <em class="text-slate-300">"${state.builder.cardMessage || 'No personal message added'}"</em></div>
    `;
  }
  updateBuilderVisualStack();
}

function selectBuilderBox(id) {
  state.builder.box = state.builderItems.box.find(b => b.id === id);
  renderBuilderStep(1);
}

function switchBuilderCategory(cat) {
  state.builder.categoryTab = cat;
  document.querySelectorAll('.bcat-btn').forEach(b => {
    b.className = 'bcat-btn px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs';
  });
  const activeBtn = document.getElementById(`bcat-${cat}`);
  if (activeBtn) activeBtn.className = 'bcat-btn px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs';
  renderBuilderItemsCategory();
}

function renderBuilderItemsCategory() {
  const grid = document.getElementById('items-options-grid');
  const list = state.builderItems[state.builder.categoryTab] || [];

  grid.innerHTML = list.map(item => {
    const isSelected = state.builder.items.some(i => i.id === item.id);
    return `
      <div onclick="toggleBuilderItem(${item.id})" class="glass-card p-3 rounded-xl border cursor-pointer flex items-center gap-3 ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800'}">
        <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg" />
        <div class="flex-grow">
          <div class="font-bold text-xs text-white">${item.name}</div>
          <div class="text-[11px] text-amber-400 font-extrabold">${formatCurrency(item.price)}</div>
        </div>
        <div class="w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-slate-600 text-transparent'}">
          <i class="fa-solid fa-check text-xs"></i>
        </div>
      </div>
    `;
  }).join('');
}

function toggleBuilderItem(id) {
  const cat = state.builder.categoryTab;
  const item = state.builderItems[cat].find(i => i.id === id);
  if (!item) return;

  const idx = state.builder.items.findIndex(i => i.id === id);
  if (idx > -1) {
    state.builder.items.splice(idx, 1);
  } else {
    state.builder.items.push(item);
  }
  renderBuilderItemsCategory();
  updateBuilderVisualStack();
}

function selectBuilderCard(id) {
  state.builder.card = state.builderItems.card.find(c => c.id === id);
  renderBuilderStep(3);
  document.getElementById('card-live-preview-box').classList.remove('hidden');
}

function updateCardPreview() {
  const text = document.getElementById('builder-card-message').value;
  state.builder.cardMessage = text;
  const preview = document.getElementById('card-preview-text');
  if (preview) preview.innerText = text ? `"${text}"` : '"Your card message will appear here..."';
}

function updateBuilderVisualStack() {
  const container = document.getElementById('builder-visual-stack');
  const priceDisplay = document.getElementById('builder-total-price');

  let total = 0;
  let html = '';

  if (state.builder.box) {
    total += state.builder.box.price;
    html += `<div class="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-400">📦 ${state.builder.box.name}</div>`;
  } else {
    html = `<div class="text-slate-400 text-xs py-10">Select a box style on the left to begin...</div>`;
  }

  state.builder.items.forEach(item => {
    total += item.price;
    html += `<div class="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200 flex items-center justify-between"><span>✨ ${item.name}</span><span class="text-amber-400 font-bold">${formatCurrency(item.price)}</span></div>`;
  });

  if (state.builder.card) {
    total += state.builder.card.price;
    html += `<div class="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300">💌 ${state.builder.card.name}</div>`;
  }

  container.innerHTML = html;
  priceDisplay.innerText = formatCurrency(total);
}

function addCustomHamperToCart() {
  if (!state.builder.box) {
    showToast('Please select a box style first!', 'error');
    return;
  }

  const boxPrice = state.builder.box.price;
  const itemsPrice = state.builder.items.reduce((sum, i) => sum + i.price, 0);
  const cardPrice = state.builder.card ? state.builder.card.price : 0;
  const totalPrice = boxPrice + itemsPrice + cardPrice;

  const customProduct = {
    id: `custom_${Date.now()}`,
    name: `Custom ${state.builder.box.name}`,
    price: totalPrice,
    image: state.builder.box.image,
    images: [state.builder.box.image],
    items: state.builder.items.map(i => i.name),
    isCustom: true,
    cardMessage: state.builder.cardMessage
  };

  state.cart.push({ product: customProduct, quantity: 1 });
  saveCart();
  updateCartUI();
  showToast('Custom hamper added to cart!');
  toggleCartDrawer();
}


// ----------------- CART & CHECKOUT -----------------
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.product.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart!`);
}

function saveCart() {
  localStorage.setItem('gh_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const countBadge = document.getElementById('cart-count');
  const itemsContainer = document.getElementById('cart-items-container');
  const subtotalElem = document.getElementById('cart-subtotal');
  const discountElem = document.getElementById('cart-discount');
  const discountRow = document.getElementById('discount-row');
  const totalElem = document.getElementById('cart-total');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countBadge) countBadge.innerText = totalItems;

  if (!itemsContainer) return;

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="text-center py-16 space-y-3">
        <i class="fa-solid fa-bag-shopping text-4xl text-slate-600"></i>
        <div class="text-slate-400 text-sm font-semibold">Your cart is empty</div>
        <button onclick="switchTab('catalog'); toggleCartDrawer();" class="text-xs text-amber-400 hover:underline font-bold">Browse Gift Catalog</button>
      </div>
    `;
    subtotalElem.innerText = '$0.00';
    totalElem.innerText = '$0.00';
    return;
  }

  let subtotal = 0;
  itemsContainer.innerHTML = state.cart.map((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;
    const img = (item.product.images && item.product.images.length > 0) ? item.product.images[0] : item.product.image;
    return `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
        <img src="${img}" alt="${item.product.name}" class="w-16 h-16 object-cover rounded-lg" />
        <div class="flex-grow">
          <div class="font-bold text-xs text-white">${item.product.name}</div>
          <div class="text-amber-400 text-xs font-bold mt-0.5">${formatCurrency(item.product.price)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity(${index}, -1)" class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white flex items-center justify-center">-</button>
          <span class="text-xs font-bold text-white">${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)" class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white flex items-center justify-center">+</button>
        </div>
      </div>
    `;
  }).join('');

  subtotalElem.innerText = formatCurrency(subtotal);

  let discount = 0;
  if (state.discountAmountINR && state.discountAmountINR > 0) {
    discount = state.discountAmountINR;
  } else if (state.discountPercent > 0) {
    discount = subtotal * (state.discountPercent / 100);
  }

  if (discount > 0) {
    discountRow.classList.remove('hidden');
    discountElem.innerText = `-${formatCurrency(discount)}`;
  } else {
    discountRow.classList.add('hidden');
  }

  const grandTotal = Math.max(0, subtotal - discount);
  totalElem.innerText = formatCurrency(grandTotal);
}

function updateQuantity(index, change) {
  state.cart[index].quantity += change;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function toggleCartDrawer() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const drawer = document.getElementById('cart-drawer');

  backdrop.classList.toggle('hidden');
  if (drawer.classList.contains('translate-x-full')) {
    drawer.classList.remove('translate-x-full');
  } else {
    drawer.classList.add('translate-x-full');
  }
}

async function applyPromoCode() {
  const inputEl = document.getElementById('promo-input');
  const code = inputEl?.value.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a promo discount code.', 'error');
    return;
  }

  const subtotalINR = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const sampleCat = state.cart.length > 0 ? (state.cart[0].product.category || 'all') : 'all';

  try {
    const res = await fetch('/api/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        subtotal: subtotalINR,
        category: sampleCat
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid promo code');

    state.appliedPromoCode = data.code;
    state.discountAmountINR = data.discount_amount;
    state.discountPercent = data.discount_type === 'percentage' ? data.discount_value : 0;
    
    showToast(data.message || `Promo code '${data.code}' applied!`);
    updateCartUI();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Payment System Global State
let checkoutPaymentState = {
  activeTab: 'upi',
  paymentMethodName: 'UPI (Dynamic QR & Apps)',
  codFee: 0.0,
  giftCard: null,
  details: {}
};

function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  toggleCartDrawer();

  if (state.user) {
    document.getElementById('checkout-sender-name').value = state.user.name;
    document.getElementById('checkout-sender-email').value = state.user.email;
  }

  // Default to UPI tab
  switchCheckoutPayTab('upi');
  updateCheckoutTotals();
  const modalEl = document.getElementById('checkout-modal');
  if (modalEl) {
    modalEl.classList.remove('hidden');
    modalEl.scrollTop = 0;
    const modalInner = modalEl.firstElementChild;
    if (modalInner) modalInner.scrollTop = 0;
  }
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

function closeCheckoutModalOnBackdrop(e) {
  if (e.target && e.target.id === 'checkout-modal') {
    closeCheckoutModal();
  }
}

// Global ESC key listener to close checkout modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCheckoutModal();
  }
});

function removePromoCode() {
  state.discountPercent = 0;
  state.discountCode = null;
  const promoInput = document.getElementById('promo-input');
  if (promoInput) promoInput.value = '';
  showToast('Promo discount removed.');
  updateCartUI();
  updateCheckoutTotals();
}

function removeGiftCard() {
  checkoutPaymentState.giftCard = null;
  const gcInput = document.getElementById('checkout-giftcard-input');
  if (gcInput) gcInput.value = '';
  const statusDiv = document.getElementById('checkout-giftcard-status');
  if (statusDiv) statusDiv.classList.add('hidden');
  showToast('Gift card credit removed.');
  updateCheckoutTotals();
}

function resetSelectedPaymentMethod() {
  switchCheckoutPayTab('upi');
  showToast('Reset payment option to default UPI / Online payment.');
}

function fillTestCard() {
  document.getElementById('card-number').value = '4242 4242 4242 4242';
  document.getElementById('card-exp').value = '12/28';
  document.getElementById('card-cvc').value = '319';
  document.getElementById('card-name').value = state.user?.name || 'Sarah Jenkins';
  showToast('Auto-filled test card numbers!');
}

function switchCheckoutPayTab(mode) {
  const tabs = ['upi', 'card', 'netbanking', 'wallet', 'emi', 'bnpl', 'banktransfer', 'cod', 'international', 'giftcard'];
  
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`paytab-${t}`);
    const contentBlock = document.getElementById(`paycontent-${t}`);
    if (contentBlock) contentBlock.classList.add('hidden');
    if (tabBtn) {
      tabBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-slate-800 flex-shrink-0 flex items-center gap-1';
    }
  });

  const activeBtn = document.getElementById(`paytab-${mode}`);
  const activeContent = document.getElementById(`paycontent-${mode}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0 flex items-center gap-1';
  }

  checkoutPaymentState.activeTab = mode;
  
  if (mode === 'upi') {
    checkoutPaymentState.paymentMethodName = 'UPI (Dynamic QR & Apps)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'card') {
    checkoutPaymentState.paymentMethodName = 'Credit / Debit Card (Stripe)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'netbanking') {
    checkoutPaymentState.paymentMethodName = 'Net Banking (Razorpay)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'wallet') {
    checkoutPaymentState.paymentMethodName = 'Mobile Wallet (Paytm/Mobikwik)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'emi') {
    checkoutPaymentState.paymentMethodName = 'Easy EMI (No-Cost)';
    checkoutPaymentState.codFee = 0.0;
    updateEmiCalculation();
  } else if (mode === 'bnpl') {
    checkoutPaymentState.paymentMethodName = 'Buy Now Pay Later (BNPL)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'banktransfer') {
    checkoutPaymentState.paymentMethodName = 'Bank Transfer (NEFT/RTGS)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'cod') {
    checkoutPaymentState.paymentMethodName = 'Cash on Delivery (COD)';
    checkoutPaymentState.codFee = 49.0;
  } else if (mode === 'international') {
    checkoutPaymentState.paymentMethodName = 'International Gateway (Multi-Currency)';
    checkoutPaymentState.codFee = 0.0;
  } else if (mode === 'giftcard') {
    checkoutPaymentState.paymentMethodName = 'Gift Card / Store Credit';
    checkoutPaymentState.codFee = 0.0;
  }

  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const promoDiscount = subtotal * (state.discountPercent / 100);
  
  let giftCardDiscount = 0.0;
  if (checkoutPaymentState.giftCard) {
    const amountAfterPromo = Math.max(0, subtotal - promoDiscount);
    giftCardDiscount = Math.min(amountAfterPromo, checkoutPaymentState.giftCard.balance);
    checkoutPaymentState.giftCard.discountApplied = giftCardDiscount;
  }

  const codCharge = checkoutPaymentState.codFee;
  const grandTotal = Math.max(0, subtotal - promoDiscount - giftCardDiscount + codCharge);

  const subtotalElem = document.getElementById('checkout-subtotal-text');
  if (subtotalElem) subtotalElem.innerText = formatCurrency(subtotal);

  const promoRow = document.getElementById('checkout-promo-row');
  if (promoRow) {
    if (state.discountPercent > 0) {
      promoRow.classList.remove('hidden');
      document.getElementById('checkout-promo-code-name').innerText = state.discountCode || 'WELCOME10';
      document.getElementById('checkout-promo-discount-text').innerText = `-${formatCurrency(promoDiscount)}`;
    } else {
      promoRow.classList.add('hidden');
    }
  }

  const gcRow = document.getElementById('checkout-giftcard-row');
  if (gcRow) {
    if (giftCardDiscount > 0) {
      gcRow.classList.remove('hidden');
      document.getElementById('checkout-gc-code-name').innerText = checkoutPaymentState.giftCard.code;
      document.getElementById('checkout-giftcard-discount-text').innerText = `-${formatCurrency(giftCardDiscount)}`;
    } else {
      gcRow.classList.add('hidden');
    }
  }

  const codRow = document.getElementById('checkout-cod-row');
  if (codRow) {
    if (codCharge > 0) {
      codRow.classList.remove('hidden');
    } else {
      codRow.classList.add('hidden');
    }
  }

  const grandTotalElem = document.getElementById('checkout-grand-total-text');
  if (grandTotalElem) grandTotalElem.innerText = formatCurrency(grandTotal);

  const btnLabel = document.getElementById('pay-btn-label');
  if (btnLabel) {
    if (checkoutPaymentState.activeTab === 'cod') {
      btnLabel.innerText = `Confirm COD Order (${formatCurrency(grandTotal)})`;
    } else {
      btnLabel.innerText = `Pay & Confirm Order (${formatCurrency(grandTotal)})`;
    }
  }
}

async function applyGiftCardInCheckout() {
  const codeInput = document.getElementById('checkout-giftcard-input');
  const statusDiv = document.getElementById('checkout-giftcard-status');
  const code = codeInput ? codeInput.value.trim() : '';

  if (!code) {
    showToast('Please enter a gift card code.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/gift-cards/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    checkoutPaymentState.giftCard = {
      code: data.code,
      balance: data.current_balance,
      discountApplied: 0
    };

    if (statusDiv) {
      statusDiv.classList.remove('hidden', 'text-rose-400');
      statusDiv.classList.add('text-amber-400');
      statusDiv.innerText = `✓ Gift Card ${data.code} Applied! Available Balance: ${formatCurrency(data.current_balance)}`;
    }

    showToast(`Gift card '${data.code}' applied successfully!`);
    updateCheckoutTotals();
  } catch (err) {
    if (statusDiv) {
      statusDiv.classList.remove('hidden', 'text-amber-400');
      statusDiv.classList.add('text-rose-400');
      statusDiv.innerText = `✗ ${err.message}`;
    }
    showToast(err.message, 'error');
  }
}

function updateEmiCalculation() {
  const tenure = parseInt(document.getElementById('emi-tenure-select')?.value || '3');
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const promoDiscount = subtotal * (state.discountPercent / 100);
  const gcDiscount = checkoutPaymentState.giftCard ? checkoutPaymentState.giftCard.discountApplied : 0;
  const netAmount = Math.max(0, subtotal - promoDiscount - gcDiscount);

  const monthly = netAmount / tenure;
  const emiElem = document.getElementById('emi-monthly-amount');
  if (emiElem) emiElem.innerText = `${formatCurrency(monthly)} / month`;

  checkoutPaymentState.details = {
    bank: document.getElementById('emi-bank-select')?.value || 'HDFC Bank',
    tenure: `${tenure} Months`,
    monthly: formatCurrency(monthly)
  };
}

function selectBank(bankName) {
  checkoutPaymentState.details.selectedBank = bankName;
  showToast(`Selected Net Banking: ${bankName}`);
}

function selectWallet(walletName) {
  checkoutPaymentState.details.selectedWallet = walletName;
  showToast(`Selected Wallet: ${walletName}`);
}

function selectBnpl(provider) {
  checkoutPaymentState.details.selectedBnpl = provider;
  showToast(`Selected Pay Later: ${provider}`);
}

function selectInternationalGateway(gw) {
  checkoutPaymentState.details.selectedGateway = gw;
  showToast(`Selected International Gateway: ${gw}`);
}

function verifyUpiVpa() {
  const vpa = document.getElementById('upi-vpa-input')?.value || '';
  if (!vpa || !vpa.includes('@')) {
    showToast('Please enter a valid Virtual Payment Address (e.g. mobile@upi)', 'error');
    return;
  }
  showToast(`UPI VPA '${vpa}' verified successfully! ✓`);
  checkoutPaymentState.details.vpa = vpa;
}

function downloadProformaInvoice() {
  showToast('Downloading Pro-Forma Corporate Invoice...', 'info');
  window.open('/api/orders/0/proforma-invoice', '_blank');
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const payBtn = document.getElementById('pay-now-btn');
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing ${checkoutPaymentState.paymentMethodName}...`;

  const customerName = document.getElementById('checkout-sender-name').value;
  const customerEmail = document.getElementById('checkout-sender-email').value;
  const recipientName = document.getElementById('checkout-recipient-name').value;
  const recipientAddress = document.getElementById('checkout-address').value;
  const deliveryDate = document.getElementById('checkout-delivery-date').value;
  const deliveryTimeSlot = document.getElementById('checkout-delivery-slot')?.value || '10 AM - 1 PM Morning Express';
  const isSurpriseGift = document.getElementById('checkout-is-surprise')?.checked || false;
  const secretMessage = document.getElementById('checkout-secret-message')?.value || '';
  const giftMessage = document.getElementById('checkout-gift-message').value;

  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const promoDiscount = subtotal * (state.discountPercent / 100);
  const gcDiscount = checkoutPaymentState.giftCard ? checkoutPaymentState.giftCard.discountApplied : 0.0;
  const codFee = checkoutPaymentState.codFee;
  const totalAmount = Math.max(0, subtotal - promoDiscount - gcDiscount + codFee);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_name: customerName,
        customer_email: customerEmail,
        recipient_name: recipientName,
        recipient_address: recipientAddress,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        is_surprise_gift: isSurpriseGift,
        secret_message: secretMessage,
        gift_message: giftMessage,
        items: state.cart.map(i => ({ name: i.product.name, price: i.product.price, qty: i.quantity })),
        total_amount: totalAmount,
        payment_method: checkoutPaymentState.paymentMethodName,
        cod_fee: codFee,
        payment_details: checkoutPaymentState.details,
        promo_code: state.discountCode,
        gift_card_code: checkoutPaymentState.giftCard ? checkoutPaymentState.giftCard.code : null,
        gift_card_discount: gcDiscount
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    state.cart = [];
    saveCart();
    updateCartUI();

    closeCheckoutModal();

    if (window.confetti) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }

    const notify = data.email_notification;
    document.getElementById('rec-email').innerText = notify.to;
    document.getElementById('rec-ordernum').innerText = notify.order_number;
    document.getElementById('rec-tracking').innerText = notify.tracking_number;
    document.getElementById('rec-name').innerText = notify.recipient;
    document.getElementById('rec-address').innerText = recipientAddress;
    document.getElementById('email-receipt-modal').classList.remove('hidden');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    payBtn.disabled = false;
    updateCheckoutTotals();
  }
}

function closeEmailReceiptModal() {
  document.getElementById('email-receipt-modal').classList.add('hidden');
  switchTab('dashboard');
}


// ----------------- USER DASHBOARD & TRACKING -----------------
async function loadUserOrders() {
  const tbody = document.getElementById('user-orders-tbody');
  if (!tbody) return;

  if (!state.token) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="py-12 text-center text-slate-400">
        Please <button onclick="openAuthModal()" class="text-amber-400 font-bold hover:underline">Log In</button> to view your order history.
      </td></tr>
    `;
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const orders = await res.json();
    state.orders = orders;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400">No orders found. Place your first order today!</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr class="hover:bg-slate-800/50 transition">
        <td class="py-4 px-6 font-bold text-amber-400">${o.order_number}</td>
        <td class="py-4 px-6">${o.recipient_name}</td>
        <td class="py-4 px-6 text-xs text-slate-400">${o.delivery_date}</td>
        <td class="py-4 px-6 font-bold text-white">${formatCurrency(o.total_amount)}</td>
        <td class="py-4 px-6">${getStatusBadgeHTML(o.order_status)}</td>
        <td class="py-4 px-6 text-right">
          <button onclick="viewOrderTimeline(${o.id})" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold">
            Track Order
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function getStatusBadgeHTML(status) {
  let color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (status === 'Packed') color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (status === 'Dispatched') color = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  if (status === 'Delivered') color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  return `<span class="px-2.5 py-1 rounded-full border text-[11px] font-bold ${color}">${status}</span>`;
}

function viewOrderTimeline(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  showToast(`Order ${order.order_number} is currently ${order.order_status}!`);
}


// ----------------- ADMIN DASHBOARD & MULTI-PHOTO CREATION -----------------
async function loadAdminDashboard() {
  if (!state.user || state.user.role !== 'admin') return;

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const orders = await res.json();

    const totalRev = orders.reduce((sum, o) => sum + o.total_amount, 0);
    document.getElementById('kpi-revenue').innerText = formatCurrency(totalRev);
    document.getElementById('kpi-orders').innerText = orders.length;
    document.getElementById('kpi-products').innerText = state.products.length;

    renderAdminOrdersTable(orders);
    renderAdminProductsTable();
  } catch (err) {
    console.error(err);
  }
}

function switchAdminSubTab(tab) {
  const subtabOrders = document.getElementById('admin-subtab-orders');
  const subtabProducts = document.getElementById('admin-subtab-products');
  const subtabPromos = document.getElementById('admin-subtab-promos');
  const subtabCustomers = document.getElementById('admin-subtab-customers');
  const subtabPayments = document.getElementById('admin-subtab-payments');
  const subtabAnalytics = document.getElementById('admin-subtab-analytics');
  const subtabApidocs = document.getElementById('admin-subtab-apidocs');

  const tabOrders = document.getElementById('admin-tab-orders');
  const tabProducts = document.getElementById('admin-tab-products');
  const tabPromos = document.getElementById('admin-tab-promos');
  const tabCustomers = document.getElementById('admin-tab-customers');
  const tabPayments = document.getElementById('admin-tab-payments');
  const tabAnalytics = document.getElementById('admin-tab-analytics');
  const tabApidocs = document.getElementById('admin-tab-apidocs');

  subtabOrders?.classList.add('hidden');
  subtabProducts?.classList.add('hidden');
  subtabPromos?.classList.add('hidden');
  subtabCustomers?.classList.add('hidden');
  subtabPayments?.classList.add('hidden');
  subtabAnalytics?.classList.add('hidden');
  subtabApidocs?.classList.add('hidden');

  const activeClass = 'py-2.5 px-4 text-sm font-bold border-b-2 border-amber-500 text-amber-400';
  const inactiveClass = 'py-2.5 px-4 text-sm font-bold text-slate-400 hover:text-white';

  if (tabOrders) tabOrders.className = inactiveClass;
  if (tabProducts) tabProducts.className = inactiveClass;
  if (tabPromos) tabPromos.className = inactiveClass;
  if (tabCustomers) tabCustomers.className = inactiveClass;
  if (tabPayments) tabPayments.className = inactiveClass;
  if (tabAnalytics) tabAnalytics.className = inactiveClass;
  if (tabApidocs) tabApidocs.className = inactiveClass;

  if (tab === 'orders') {
    subtabOrders?.classList.remove('hidden');
    if (tabOrders) tabOrders.className = activeClass;
  } else if (tab === 'products') {
    subtabProducts?.classList.remove('hidden');
    if (tabProducts) tabProducts.className = activeClass;
  } else if (tab === 'promos') {
    subtabPromos?.classList.remove('hidden');
    if (tabPromos) tabPromos.className = activeClass;
    loadAdminPromos();
  } else if (tab === 'customers') {
    subtabCustomers?.classList.remove('hidden');
    if (tabCustomers) tabCustomers.className = activeClass;
    loadAdminCustomers();
  } else if (tab === 'payments') {
    subtabPayments?.classList.remove('hidden');
    if (tabPayments) tabPayments.className = activeClass;
    loadPaymentConfig();
  } else if (tab === 'analytics') {
    subtabAnalytics?.classList.remove('hidden');
    if (tabAnalytics) tabAnalytics.className = activeClass;
    loadAnalyticsOverview();
  } else if (tab === 'apidocs') {
    subtabApidocs?.classList.remove('hidden');
    if (tabApidocs) tabApidocs.className = activeClass;
    loadApiRouteMap();
  }
}

async function loadApiRouteMap() {
  const tbody = document.getElementById('admin-apidocs-tbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/docs/routes');
    const routes = await res.json();
    if (!res.ok) return;

    tbody.innerHTML = routes.map(r => {
      let verbBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      if (r.method === 'POST') verbBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      if (r.method === 'PUT') verbBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      if (r.method === 'DELETE') verbBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';

      let authBadge = r.auth.includes('Admin') ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : (r.auth.includes('Bearer') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700');

      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-3 px-5 font-mono">
            <span class="px-2.5 py-1 rounded text-[11px] font-extrabold border ${verbBadge}">${r.method}</span>
          </td>
          <td class="py-3 px-5 font-mono font-bold text-white">${r.path}</td>
          <td class="py-3 px-5">
            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${authBadge}">${r.auth}</span>
          </td>
          <td class="py-3 px-5 text-slate-300 text-xs">${r.desc}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load API route map:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-rose-400 font-medium">Failed to load API Reference Map.</td></tr>`;
  }
}

let allAdminCustomers = [];

async function loadAdminCustomers() {
  if (!state.token) return;
  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) return;

    allAdminCustomers = data;
    renderAdminCustomersTable(allAdminCustomers);
  } catch (err) {
    console.error(err);
  }
}

function renderAdminCustomersTable(list) {
  const tbody = document.getElementById('admin-customers-tbody');
  const badge = document.getElementById('admin-customers-count-badge');

  if (badge) badge.innerText = `Showing ${list.length} registered accounts`;

  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-500 font-medium">No matching customer records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(u => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="py-3 px-5 font-bold text-amber-400">#${u.id}</td>
      <td class="py-3 px-5 font-bold text-white flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-full ${u.role === 'admin' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'} flex items-center justify-center font-extrabold text-[11px] shadow-sm">
          ${u.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="block">${u.name}</span>
          <span class="text-[10px] text-slate-400 font-normal">Joined ${u.created_at ? u.created_at.split(' ')[0] : '2026-07-26'}</span>
        </div>
      </td>
      <td class="py-3 px-5 text-slate-300 font-mono">${u.email}</td>
      <td class="py-3 px-5 text-xs">
        <div class="font-mono text-cyan-400 text-[11px]">${u.password_hash || 'SHA-256 Encrypted'}</div>
        <div class="text-[10px] text-emerald-400 font-semibold mt-0.5">
          <i class="fa-solid fa-mobile-screen"></i> Mobile OTP Ready
        </div>
      </td>
      <td class="py-3 px-5">
        <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}">
          ${u.role === 'admin' ? '👑 Concierge Admin' : '🛍️ Customer'}
        </span>
      </td>
      <td class="py-3 px-5 font-semibold text-slate-200">${u.total_orders || 0} Orders</td>
      <td class="py-3 px-5 font-extrabold text-amber-400">${formatCurrency(u.total_spent || 0)}</td>
      <td class="py-3 px-5 text-right space-x-1">
        <button onclick="promptResetCustomerPassword(${u.id}, '${u.name}')" title="Reset Password" class="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs transition">
          <i class="fa-solid fa-key"></i>
        </button>
        <button onclick="toggleCustomerRole(${u.id}, '${u.role}')" title="Toggle Admin Role" class="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs transition">
          <i class="fa-solid fa-user-gear"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterAdminCustomersTable() {
  const q = document.getElementById('admin-customer-search').value.toLowerCase().trim();
  const filtered = allAdminCustomers.filter(u => 
    u.name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) ||
    (u.password_hash && u.password_hash.toLowerCase().includes(q))
  );
  renderAdminCustomersTable(filtered);
}

async function promptResetCustomerPassword(userId, userName) {
  const newPw = prompt(`Enter new secure password for customer '${userName}' (#${userId}):`);
  if (!newPw || newPw.trim().length < 4) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ new_password: newPw.trim() })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`Password for '${userName}' updated!`);
    loadAdminCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleCustomerRole(userId, currentRole) {
  const nextRole = currentRole === 'admin' ? 'user' : 'admin';
  if (!confirm(`Are you sure you want to change user #${userId} role to '${nextRole}'?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ role: nextRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`User #${userId} role changed to '${nextRole}'!`);
    loadAdminCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function autoGeneratePromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const el = document.getElementById('promo-code');
  if (el) el.value = `KAWAI-${rand}`;
}

async function handleCreateCustomPromo(e) {
  e.preventDefault();
  if (!state.token) {
    showToast('Concierge Admin login required to create promo codes.', 'error');
    return;
  }

  const code = document.getElementById('promo-code').value.trim().toUpperCase();
  const discount_type = document.getElementById('promo-type').value;
  const discount_value = parseFloat(document.getElementById('promo-value').value || 10);
  const min_spend = parseFloat(document.getElementById('promo-min-spend').value || 0);
  const max_uses = parseInt(document.getElementById('promo-max-uses').value || 0);
  const expiry_date = document.getElementById('promo-expiry').value || null;
  const applicable_category = document.getElementById('promo-category').value || 'all';

  try {
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        code,
        discount_type,
        discount_value,
        min_spend,
        max_uses,
        expiry_date,
        applicable_category
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`✨ Promo code '${data.code || code}' created successfully!`);
    loadAdminPromos();
    loadTopAnnouncementBanner();
    document.getElementById('promo-code').value = '';
    document.getElementById('promo-value').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminPromos() {
  if (!state.token) return;
  try {
    const res = await fetch('/api/admin/discounts', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const promos = await res.json();
    if (!res.ok) return;

    renderAdminPromosTable(promos);
  } catch (err) {
    console.error(err);
  }
}

function renderAdminPromosTable(promos) {
  const tbody = document.getElementById('admin-promos-tbody');
  const countBadge = document.getElementById('promos-count-badge');

  if (countBadge) countBadge.innerText = `${promos.length} Active Rules`;

  if (!tbody) return;

  if (promos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-500 font-medium">No custom promo codes generated yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = promos.map(p => {
    const discLabel = p.discount_type === 'fixed' ? `₹${p.discount_value} OFF` : `${p.discount_value || p.percentage}% OFF`;
    const minSpendText = p.min_spend > 0 ? `₹${p.min_spend}` : 'None';
    const usesText = p.max_uses > 0 ? `${p.times_used || 0}/${p.max_uses}` : `${p.times_used || 0} (∞)`;
    const expText = p.expiry_date ? p.expiry_date : 'Never';
    const isActive = p.is_active === 1;

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-3 px-3 font-mono font-bold text-amber-400 flex items-center gap-1.5">
          <i class="fa-solid fa-tag text-[10px]"></i>
          <span>${p.code}</span>
        </td>
        <td class="py-3 px-3 font-bold text-white">${discLabel}</td>
        <td class="py-3 px-3 text-slate-300 font-mono text-[11px]">${minSpendText}</td>
        <td class="py-3 px-3 text-slate-300 font-semibold text-[11px]">${usesText}</td>
        <td class="py-3 px-3 text-slate-400 text-[11px]">${expText}</td>
        <td class="py-3 px-3 text-right space-x-1">
          <button onclick="toggleDiscountStatus(${p.id}, ${isActive ? 1 : 0})" class="px-2 py-1 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-slate-700 text-slate-400 hover:text-white'}">
            ${isActive ? 'Active' : 'Inactive'}
          </button>
          <button onclick="deleteDiscountCode(${p.id})" class="p-1 text-slate-400 hover:text-rose-400 text-xs">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleDiscountStatus(discountId, currentActiveStatus) {
  if (!state.token) return;
  try {
    const nextStatus = currentActiveStatus === 1 ? 0 : 1;
    const res = await fetch(`/api/admin/discounts/${discountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ is_active: nextStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Promo code status updated!');
    loadAdminPromos();
    loadTopAnnouncementBanner();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteDiscountCode(discountId) {
  if (!confirm('Are you sure you want to delete this promo code rule?')) return;
  if (!state.token) return;

  try {
    const res = await fetch(`/api/admin/discounts/${discountId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Promo code deleted.');
    loadAdminPromos();
    loadTopAnnouncementBanner();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function quickAdjustStock(productId, delta) {
  if (!state.token) return;
  try {
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ delta })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast(data.message);
    loadAnalyticsOverview();
    fetchProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAnalyticsOverview() {
  if (!state.token) return;
  try {
    const res = await fetch('/api/admin/analytics/overview', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) return;

    // 1. Low Stock Alerts Table
    const lowStockTbody = document.getElementById('analytics-low-stock-tbody');
    const badgeEl = document.getElementById('low-stock-count-badge');

    if (badgeEl) badgeEl.innerText = `${data.low_stock_products.length} Low Stock | ${data.total_inventory_units} Total Units`;

    if (lowStockTbody) {
      if (data.low_stock_products.length === 0) {
        lowStockTbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500 font-medium">All hamper inventory levels are healthy! Total stock: ${data.total_inventory_units} units</td></tr>`;
      } else {
        lowStockTbody.innerHTML = data.low_stock_products.map(p => `
          <tr class="hover:bg-slate-800/40">
            <td class="py-2.5 px-3 font-bold text-white flex items-center gap-2">
              <img src="${p.image}" class="w-7 h-7 rounded-lg object-cover" />
              <span>${p.name}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-400">${p.category}</td>
            <td class="py-2.5 px-3 font-mono font-bold text-amber-400">${formatCurrency(p.price)}</td>
            <td class="py-2.5 px-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.stock <= 2 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                ⚠️ ${p.stock} units left
              </span>
            </td>
            <td class="py-2.5 px-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="quickAdjustStock(${p.id}, 5)" class="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-bold">
                  +5 Stock
                </button>
                <button onclick="quickAdjustStock(${p.id}, 20)" class="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-[10px] font-bold">
                  +20 Stock
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    }

    // 2. VIP Customers Leaderboard
    const vipTbody = document.getElementById('analytics-vip-tbody');
    if (vipTbody) {
      if (data.vip_customers.length === 0) {
        vipTbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-slate-500 font-medium">No customer spend records recorded yet.</td></tr>`;
      } else {
        vipTbody.innerHTML = data.vip_customers.map((c, idx) => `
          <tr class="hover:bg-slate-800/40">
            <td class="py-2.5 px-4 font-mono font-bold text-amber-400">#${idx + 1}</td>
            <td class="py-2.5 px-4 font-bold text-white flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-[10px]">
                ${c.name ? c.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>${c.name || 'Registered Customer'}</span>
            </td>
            <td class="py-2.5 px-4 text-slate-400 font-mono text-[11px]">${c.email || c.mobile || 'N/A'}</td>
            <td class="py-2.5 px-4 font-semibold text-slate-300">${c.order_count} Orders</td>
            <td class="py-2.5 px-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.is_verified === 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}">
                ${c.is_verified === 1 ? '✓ OTP Verified' : 'Guest'}
              </span>
            </td>
            <td class="py-2.5 px-4 font-extrabold text-amber-400 text-right">${formatCurrency(c.total_spent)}</td>
          </tr>
        `).join('');
      }
    }

    // 3. Category Distribution
    const catContainer = document.getElementById('analytics-category-dist-container');
    if (catContainer) {
      catContainer.innerHTML = data.category_dist.map(cd => `
        <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-white">${cd.category}</span>
            <span class="font-mono text-amber-400 font-bold">${cd.count} Hampers Listed</span>
          </div>
          <div class="text-[10px] text-slate-400">Catalog Inventory Value: ${formatCurrency(cd.est_value)}</div>
        </div>
      `).join('');
    }

    // 4. Verification Security Metrics
    const verifiedRatioEl = document.getElementById('analytics-verified-ratio');
    const verifiedBarEl = document.getElementById('analytics-verified-bar');
    const verifiedDetailEl = document.getElementById('analytics-verified-detail');
    const aovEl = document.getElementById('analytics-aov-val');

    if (data.user_metrics) {
      const totalU = data.user_metrics.total_users || 1;
      const verU = data.user_metrics.verified_users || 0;
      const pct = Math.round((verU / totalU) * 100);

      if (verifiedRatioEl) verifiedRatioEl.innerText = `${pct}% Verified`;
      if (verifiedBarEl) verifiedBarEl.style.width = `${pct}%`;
      if (verifiedDetailEl) verifiedDetailEl.innerText = `${verU} of ${totalU} accounts OTP verified`;
    }

    if (aovEl && data.order_stats) {
      aovEl.innerText = formatCurrency(data.order_stats.aov || 0);
    }

    // 5. Payment Gateway Distribution BI
    const payDistContainer = document.getElementById('analytics-payment-dist-container');
    const storeCreditEl = document.getElementById('analytics-active-store-credit');

    if (storeCreditEl && data.gift_card_stats) {
      storeCreditEl.innerText = `Active Store Credit: ${formatCurrency(data.gift_card_stats.total_store_credit || 0)}`;
    }

    if (payDistContainer && data.payment_dist) {
      if (data.payment_dist.length === 0) {
        payDistContainer.innerHTML = `<div class="text-[11px] text-slate-500 font-medium">No order payment methods recorded yet.</div>`;
      } else {
        payDistContainer.innerHTML = data.payment_dist.map(pm => `
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-300 font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ${pm.payment_method || 'Standard Card'}
            </span>
            <span class="font-mono text-emerald-400 font-bold">${formatCurrency(pm.total_revenue)} (${pm.count} orders)</span>
          </div>
        `).join('');
      }
    }

  } catch (err) {
    console.error(err);
  }
}

async function loadPaymentConfig() {
  if (!state.token) return;
  try {
    const res = await fetch('/api/admin/payment-config', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const config = await res.json();
    if (!res.ok) return;

    if (document.getElementById('pay-mode')) document.getElementById('pay-mode').value = config.payment_mode || 'sandbox';
    if (document.getElementById('pay-merchant-upi')) document.getElementById('pay-merchant-upi').value = config.merchant_upi_id || '7686008@ybl';
    if (document.getElementById('pay-stripe-pub')) document.getElementById('pay-stripe-pub').value = config.stripe_pub_key || '';
    if (document.getElementById('pay-stripe-secret')) document.getElementById('pay-stripe-secret').value = config.stripe_secret_key || '';
    if (document.getElementById('pay-razorpay-id')) document.getElementById('pay-razorpay-id').value = config.razorpay_key_id || '';
    if (document.getElementById('pay-razorpay-secret')) document.getElementById('pay-razorpay-secret').value = config.razorpay_key_secret || '';
  } catch (err) {
    console.error(err);
  }
}

async function handleSavePaymentConfig(e) {
  e.preventDefault();
  if (!state.token) return;

  const body = {
    payment_mode: document.getElementById('pay-mode').value,
    merchant_upi_id: document.getElementById('pay-merchant-upi').value.trim(),
    stripe_pub_key: document.getElementById('pay-stripe-pub').value.trim(),
    stripe_secret_key: document.getElementById('pay-stripe-secret').value.trim(),
    razorpay_key_id: document.getElementById('pay-razorpay-id').value.trim(),
    razorpay_key_secret: document.getElementById('pay-razorpay-secret').value.trim()
  };

  try {
    const res = await fetch('/api/admin/payment-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast(data.message || 'Live Payment Gateway Credentials saved successfully!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAdminOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => `
    <tr class="hover:bg-slate-800/50 transition">
      <td class="py-4 px-6 font-bold text-amber-400">${o.order_number}</td>
      <td class="py-4 px-6">
        <div class="font-bold text-white text-xs">${o.customer_name}</div>
        <div class="text-[11px] text-slate-400">${o.customer_email}</div>
      </td>
      <td class="py-4 px-6 text-xs">
        <div>${o.recipient_name}</div>
        <div class="text-slate-400 truncate max-w-xs">${o.recipient_address}</div>
      </td>
      <td class="py-4 px-6 font-bold text-white">${formatCurrency(o.total_amount)}</td>
      <td class="py-4 px-6">${getStatusBadgeHTML(o.order_status)}</td>
      <td class="py-4 px-6 text-right">
        <select onchange="updateOrderStatus(${o.id}, this.value)" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 focus:outline-none">
          <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Packed" ${o.order_status === 'Packed' ? 'selected' : ''}>Packed</option>
          <option value="Dispatched" ${o.order_status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
          <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`Order status changed to ${newStatus}!`);
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAdminProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.products.map(p => {
    const imagesCount = p.images ? p.images.length : 1;
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
    return `
      <tr class="hover:bg-slate-800/50 transition">
        <td class="py-4 px-6 flex items-center gap-3">
          <div class="relative">
            <img src="${mainImg}" alt="${p.name}" class="w-11 h-11 object-cover rounded-lg border border-slate-700" />
            ${imagesCount > 1 ? `<span class="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded-full shadow">+${imagesCount-1}</span>` : ''}
          </div>
          <div>
            <span class="font-bold text-white text-xs block">${p.name}</span>
            <span class="text-[10px] text-slate-400">${imagesCount} ${imagesCount === 1 ? 'Photo' : 'Photos'} attached</span>
          </div>
        </td>
        <td class="py-4 px-6 text-xs text-amber-400 font-semibold">${p.category}</td>
        <td class="py-4 px-6 font-bold text-white">${formatCurrency(p.price)}</td>
        <td class="py-4 px-6 text-xs text-slate-300">${p.stock || 50} pcs</td>
        <td class="py-4 px-6 text-right">
          <button onclick="deleteProduct(${p.id})" class="p-2 text-slate-400 hover:text-rose-400 text-xs">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// MULTI-PHOTO ADMIN CREATION MODAL LOGIC
function renderModalPhotoPreviews() {
  const grid = document.getElementById('modal-photo-previews-grid');
  if (!grid) return;

  const photoInputs = document.querySelectorAll('#photo-urls-container .prod-photo-input');
  const validPhotos = [];

  photoInputs.forEach((input, index) => {
    const url = input.value.trim();
    if (url) {
      validPhotos.push({ url, inputIndex: index });
    }
  });

  if (validPhotos.length === 0) {
    grid.innerHTML = `<span class="text-xs text-slate-500 font-medium">No photo uploaded or URL pasted yet.</span>`;
    return;
  }

  grid.innerHTML = validPhotos.map((item, idx) => {
    const isCover = idx === 0;
    return `
      <div class="relative group w-20 h-20 rounded-xl border border-slate-700 overflow-hidden shadow-md bg-slate-900 flex-shrink-0">
        <img src="${item.url}" alt="Preview ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';" />
        <span class="absolute top-1 left-1 ${isCover ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900/80 text-amber-400 font-bold'} text-[9px] px-1.5 py-0.5 rounded shadow">
          ${isCover ? 'Cover' : '#' + (idx + 1)}
        </span>
        <button type="button" onclick="removeModalPhoto(${item.inputIndex})" title="Remove photo" class="absolute top-1 right-1 bg-rose-500/90 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow transition">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }).join('');
}

function removeModalPhoto(inputIndex) {
  const photoInputs = document.querySelectorAll('#photo-urls-container .prod-photo-input');
  if (inputIndex >= 0 && inputIndex < photoInputs.length) {
    const input = photoInputs[inputIndex];
    const parentDiv = input.parentElement;
    if (photoInputs.length === 1) {
      input.value = '';
    } else {
      parentDiv.remove();
    }
  }
  renderModalPhotoPreviews();
}

function openAddProductModal() {
  document.getElementById('add-product-modal').classList.remove('hidden');
  renderModalPhotoPreviews();
}

function closeAddProductModal() {
  document.getElementById('add-product-modal').classList.add('hidden');
}

function addPhotoUrlField() {
  const container = document.getElementById('photo-urls-container');
  const count = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center';
  div.innerHTML = `
    <input type="text" name="prod_photo_url" oninput="renderModalPhotoPreviews()" placeholder="https://images.unsplash.com/... (Photo ${count})" class="prod-photo-input flex-grow bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500" />
    <button type="button" onclick="this.parentElement.remove(); renderModalPhotoPreviews();" class="text-slate-400 hover:text-rose-400 text-xs p-1">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(div);
  renderModalPhotoPreviews();
}

function triggerDevicePhotoUpload() {
  const fileInput = document.getElementById('modal-device-file-input');
  if (fileInput) fileInput.click();
}

async function uploadModalDevicePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!state.token) {
    showToast('Please log in as Concierge Admin to upload device photos.', 'error');
    return;
  }

  showToast('⏳ Uploading device photo to Cloudinary CDN...');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/admin/cloudinary/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Device photo upload failed');

    const cdnUrl = data.url;

    // Find first empty photo input or append a new photo input field
    const container = document.getElementById('photo-urls-container');
    const photoInputs = container.querySelectorAll('.prod-photo-input');
    let filled = false;

    photoInputs.forEach(input => {
      if (!input.value.trim() && !filled) {
        input.value = cdnUrl;
        filled = true;
      }
    });

    if (!filled) {
      const count = container.children.length + 1;
      const div = document.createElement('div');
      div.className = 'flex gap-2 items-center';
      div.innerHTML = `
        <input type="text" name="prod_photo_url" value="${cdnUrl}" oninput="renderModalPhotoPreviews()" class="prod-photo-input w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500 font-bold" />
        <button type="button" onclick="this.parentElement.remove(); renderModalPhotoPreviews();" class="text-slate-400 hover:text-rose-400 text-xs p-1">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      container.appendChild(div);
    }

    renderModalPhotoPreviews();
    showToast('✨ Device photo uploaded to Cloudinary & attached!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleCreateProduct(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value;
  const category = document.getElementById('prod-category').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const tag = document.getElementById('prod-tag').value;
  const stock = parseInt(document.getElementById('prod-stock').value || 50);
  const description = document.getElementById('prod-description').value;
  const itemsText = document.getElementById('prod-items').value;

  const items = itemsText ? itemsText.split(',').map(i => i.strip ? i.strip() : i.trim()) : ['Curated Gift Item'];

  // Collect all filled photo URL inputs
  const photoInputs = document.querySelectorAll('input[name="prod_photo_url"]');
  const images = [];
  photoInputs.forEach(input => {
    const val = input.value.trim();
    if (val) images.push(val);
  });

  if (images.length === 0) {
    showToast('Please provide at least one photo URL.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        name,
        category,
        price,
        tag,
        stock,
        description,
        items,
        images
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`New hamper "${name}" with ${images.length} photos added successfully!`);
    closeAddProductModal();
    document.getElementById('add-product-form').reset();
    fetchProducts();
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to remove this hamper from the store?')) return;

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Product deleted successfully.');
    fetchProducts();
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Real-Time Live Market Currency Converter Engine (Open ER API Integration)
const CURRENCY_RATES = {
  INR: { rate: 1.0, symbol: '₹', code: 'INR', locale: 'en-IN', name: 'India' },
  USD: { rate: 0.012, symbol: '$', code: 'USD', locale: 'en-US', name: 'United States' },
  EUR: { rate: 0.011, symbol: '€', code: 'EUR', locale: 'de-DE', name: 'Eurozone' },
  GBP: { rate: 0.0094, symbol: '£', code: 'GBP', locale: 'en-GB', name: 'United Kingdom' },
  AED: { rate: 0.044, symbol: 'AED ', code: 'AED', locale: 'ar-AE', name: 'UAE' },
  CAD: { rate: 0.016, symbol: 'C$', code: 'CAD', locale: 'en-CA', name: 'Canada' },
  AUD: { rate: 0.018, symbol: 'A$', code: 'AUD', locale: 'en-AU', name: 'Australia' },
  JPY: { rate: 1.82, symbol: '¥', code: 'JPY', locale: 'ja-JP', name: 'Japan' },
  SGD: { rate: 0.016, symbol: 'S$', code: 'SGD', locale: 'en-SG', name: 'Singapore' },
  SAR: { rate: 0.045, symbol: 'SAR ', code: 'SAR', locale: 'ar-SA', name: 'Saudi Arabia' }
};

let currentCurrency = localStorage.getItem('ko_currency') || 'INR';

async function fetchLiveExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR');
    if (!res.ok) return;
    const data = await res.json();

    if (data && data.rates) {
      Object.keys(CURRENCY_RATES).forEach(code => {
        if (data.rates[code]) {
          CURRENCY_RATES[code].rate = data.rates[code];
        }
      });
      console.log('⚡ Live Market Exchange Rates Synced via Open ER API!');
    }
  } catch (err) {
    console.log('Using baseline exchange rates:', err);
  }
}

function changeCurrency(newCurrency) {
  if (!CURRENCY_RATES[newCurrency]) return;
  currentCurrency = newCurrency;
  localStorage.setItem('ko_currency', newCurrency);

  const selector = document.getElementById('currency-selector');
  if (selector) selector.value = newCurrency;

  const rateVal = CURRENCY_RATES[newCurrency].rate;
  showToast(`Currency converted to ${newCurrency} (${CURRENCY_RATES[newCurrency].symbol}) | Live Rate: 1 INR = ${rateVal.toFixed(4)} ${newCurrency}`);

  renderHomeProducts();
  renderCatalogProducts();
  updateCartUI();
  if (state.user && state.user.role === 'admin') loadAdminDashboard();
}

function formatCurrency(amountInINR) {
  const curInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.INR;
  const converted = (amountInINR || 0) * curInfo.rate;

  if (curInfo.code === 'INR') {
    return `₹${Math.round(converted).toLocaleString('en-IN')}`;
  } else if (curInfo.code === 'AED' || curInfo.code === 'SAR') {
    return `${curInfo.symbol}${converted.toFixed(2)}`;
  } else if (curInfo.code === 'JPY') {
    return `¥${Math.round(converted).toLocaleString('ja-JP')}`;
  } else {
    return new Intl.NumberFormat(curInfo.locale, { style: 'currency', currency: curInfo.code }).format(converted);
  }
}

// ----------------- WISHLIST MANAGEMENT -----------------
async function toggleWishlist(productId) {
  const product = state.products.find(p => p.id === productId);
  
  if (state.token) {
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.wishlisted) {
        if (!state.wishlist.some(p => (typeof p === 'object' ? p.id : p) === productId)) {
          state.wishlist.push(product || productId);
        }
      } else {
        state.wishlist = state.wishlist.filter(p => (typeof p === 'object' ? p.id : p) !== productId);
      }
      showToast(data.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  } else {
    const idx = state.wishlist.findIndex(p => (typeof p === 'object' ? p.id : p) === productId);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast('Removed from Wishlist.');
    } else {
      state.wishlist.push(product || productId);
      showToast('❤️ Added to Wishlist!');
    }
  }

  localStorage.setItem('gh_wishlist', JSON.stringify(state.wishlist));
  updateWishlistBadges();
  renderHomeProducts();
  renderCatalogProducts();
}

function updateWishlistBadges() {
  const count = state.wishlist.length;
  const badge = document.getElementById('wishlist-count');
  if (badge) badge.innerText = count;
}

function openWishlistModal() {
  renderWishlistItems();
  document.getElementById('wishlist-modal').classList.remove('hidden');
}

function closeWishlistModal() {
  document.getElementById('wishlist-modal').classList.add('hidden');
}

function renderWishlistItems() {
  const grid = document.getElementById('wishlist-items-grid');
  const countEl = document.getElementById('wishlist-modal-count');
  if (countEl) countEl.innerText = `${state.wishlist.length} Items Saved`;

  if (!grid) return;

  if (state.wishlist.length === 0) {
    grid.innerHTML = `<div class="col-span-2 text-center py-12 text-slate-400 font-medium">Your Wishlist is empty. Click the ❤️ icon on any hamper to save it for later!</div>`;
    return;
  }

  grid.innerHTML = state.wishlist.map(item => {
    const prod = typeof item === 'object' ? item : state.products.find(p => p.id === item);
    if (!prod) return '';

    const img = (prod.images && prod.images.length > 0) ? prod.images[0] : prod.image;
    return `
      <div class="glass-card p-4 rounded-2xl border border-slate-800 flex gap-4 items-center">
        <img src="${img}" class="w-20 h-20 object-cover rounded-xl border border-slate-700" />
        <div class="flex-grow space-y-1">
          <div class="font-bold text-sm text-white">${prod.name}</div>
          <div class="text-xs text-amber-400 font-extrabold">${formatCurrency(prod.price)}</div>
          <div class="flex items-center gap-2 pt-1">
            <button onclick="addToCart(${prod.id}); closeWishlistModal();" class="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow">
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
            <button onclick="toggleWishlist(${prod.id}); renderWishlistItems();" class="text-slate-400 hover:text-rose-400 text-xs">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


// ----------------- AI GIFT RECOMMENDATION FINDER -----------------
function openAiGiftFinderModal() {
  document.getElementById('ai-gift-finder-modal').classList.remove('hidden');
}
function closeAiGiftFinderModal() {
  document.getElementById('ai-gift-finder-modal').classList.add('hidden');
}

function selectAiOption(type, val, btnElem) {
  if (type === 'recipient') {
    state.aiSelection.recipient = val;
    document.querySelectorAll('.ai-recip-btn').forEach(b => {
      b.className = 'ai-recip-btn p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:border-purple-500 transition';
    });
    btnElem.className = 'ai-recip-btn p-2.5 rounded-xl border border-purple-500 bg-purple-500/20 text-xs font-bold text-purple-300';
  } else if (type === 'budget') {
    state.aiSelection.budget_max = val;
    document.querySelectorAll('.ai-budget-btn').forEach(b => {
      b.className = 'ai-budget-btn p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:border-purple-500 transition';
    });
    btnElem.className = 'ai-budget-btn p-2.5 rounded-xl border border-purple-500 bg-purple-500/20 text-xs font-bold text-purple-300';
  }
}

async function submitAiGiftFinder() {
  const occSelect = document.getElementById('ai-occ-select');
  if (occSelect) state.aiSelection.occasion = occSelect.value;

  showToast('🤖 AI Assistant searching matching hampers...');

  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.aiSelection)
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to compute recommendations');

    const container = document.getElementById('ai-results-container');
    const grid = document.getElementById('ai-results-grid');
    container.classList.remove('hidden');

    if (data.recommendations.length === 0) {
      grid.innerHTML = `<div class="col-span-2 text-center text-xs text-slate-400 py-4">No matching hampers found for this budget. Try selecting 'Unlimited Luxury'!</div>`;
      return;
    }

    grid.innerHTML = data.recommendations.map(p => `
      <div class="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 flex gap-3 items-center">
        <img src="${p.image}" class="w-16 h-16 object-cover rounded-xl" />
        <div class="flex-grow space-y-1">
          <div class="font-bold text-xs text-white">${p.name}</div>
          <div class="text-xs text-amber-400 font-extrabold">${formatCurrency(p.price)}</div>
          <button onclick="addToCart(${p.id}); closeAiGiftFinderModal();" class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px]">
            + Add to Cart
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Dynamic Top Announcement Banner Updater
async function loadTopAnnouncementBanner() {
  const container = document.getElementById('top-announcement-bar-text');
  if (!container) return;

  try {
    const res = await fetch('/api/discounts/active');
    if (!res.ok) return;
    const activeDiscounts = await res.json();

    if (activeDiscounts && activeDiscounts.length > 0) {
      const topDisc = activeDiscounts[0];
      const discValStr = topDisc.discount_type === 'fixed'
        ? `₹${topDisc.discount_value || topDisc.percentage} Off`
        : `${topDisc.discount_value || topDisc.percentage}% Off`;

      container.innerHTML = `🌿 KAWAIORA Artisan Hampers | Nationwide Express Delivery | Code: <strong class="text-amber-300 font-bold">${topDisc.code}</strong> (${discValStr})`;
    } else {
      container.innerHTML = `🌿 KAWAIORA Artisan Hampers | Nationwide Express Delivery | Handcrafted Luxury Gift Hampers`;
    }
  } catch (err) {
    console.error('Failed to load top announcement promo:', err);
  }
}
