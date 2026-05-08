// ========== FIREBASE ==========
const firebaseConfig = {
  apiKey: "AIzaSyDcsvkCEcnkCivJxa6FRoUurgIUgYwW4qg",
  authDomain: "suptemiz.firebaseapp.com",
  databaseURL: "https://suptemiz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "suptemiz",
  storageBucket: "suptemiz.firebasestorage.app",
  messagingSenderId: "399676923890",
  appId: "1:399676923890:web:44657bb2870a7d76cd56b"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const ordersRef = database.ref('orders');

// ========== НАСТРОЙКИ ==========
const ADMIN_PHONES = ['0852159181', '+905338888888'];
const CLEANER_PHONES = ['05331234567', '+905331234567'];
let allOrders = [];
let currentRole = 'client';
let currentLang = 'ru';

// ========== ПЕРЕВОДЫ ==========
const translations = {
  ru: { cancel: "Отменить", review_placeholder: "Ваш отзыв...", send_review: "Отправить отзыв", add_photo: "Добавить фото", order_btn: "Оформить + Оплатить", save_profile: "Сохранить профиль" },
  en: { cancel: "Cancel", review_placeholder: "Your review...", send_review: "Submit review", add_photo: "Add photo", order_btn: "Order + Pay", save_profile: "Save profile" },
  tr: { cancel: "İptal", review_placeholder: "Yorumunuz...", send_review: "Yorum gönder", add_photo: "Fotoğraf ekle", order_btn: "Sipariş + Öde", save_profile: "Profili kaydet" }
};
function t(key) { return translations[currentLang][key] || key; }

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function phoneMask(input) {
  let num = input.value.replace(/\D/g, '').slice(0, 10);
  let formatted = '+90';
  if (num.length > 0) formatted += ' ' + num.slice(0,3);
  if (num.length >= 3) formatted += ' ' + num.slice(3,6);
  if (num.length >= 6) formatted += ' ' + num.slice(6,8);
  if (num.length >= 8) formatted += ' ' + num.slice(8,10);
  input.value = formatted;
}

// ========== РАСЧЁТ ЦЕНЫ ==========
function calculateTotal() {
  const service = document.querySelector('input[name="service"]:checked')?.value || 'standard';
  let total = { standard:500, general:950, after_repair:1800, office:700 }[service] || 500;
  if (document.getElementById('extra_ac')?.checked) total += 200;
  if (document.getElementById('extra_window')?.checked) total += 150;
  if (document.getElementById('extra_fridge')?.checked) total += 100;
  const phone = localStorage.getItem('suptemiz_userPhone');
  const userHasOrders = allOrders.some(o => o.userPhone === phone);
  const discount = (!userHasOrders && phone && phone.replace(/\D/g,'').length >= 10) ? 0.25 : 0;
  const finalTotal = Math.round(total * (1 - discount));
  document.getElementById('totalPrice').innerHTML = finalTotal + ' ₺';
  const discountInfo = document.getElementById('discountInfo');
  if (discountInfo) discountInfo.innerHTML = discount > 0 ? `✨ Скидка 25%: -${Math.round(total*0.25)} ₺` : '';
  return finalTotal;
}

function getSelectedServiceText() {
  const v = document.querySelector('input[name="service"]:checked')?.value || 'standard';
  const map = { standard:'Стандартная', general:'Генеральная', after_repair:'После ремонта', office:'Офисная' };
  return map[v];
}

function getExtras() {
  const e = [];
  if (document.getElementById('extra_ac')?.checked) e.push('Кондиционер');
  if (document.getElementById('extra_window')?.checked) e.push('Окна');
  if (document.getElementById('extra_fridge')?.checked) e.push('Холодильник');
  return e.join(', ') || 'Нет';
}

function getStatusConfig(status) {
  const map = {
    'Ожидает подтверждения': { label:'⏳ Ожидает', color:'#999' },
    'Подтверждён': { label:'✅ Подтверждён', color:'#2196F3' },
    'Клинер выехал': { label:'🚗 Выехал', color:'#FF9800' },
    'Уборка началась': { label:'🧹 Уборка', color:'#FF5722' },
    'Уборка завершена': { label:'✅ Готово', color:'#4CAF50' },
    'Завершён': { label:'⭐ Завершён', color:'#2E7D32' },
    'Отменён': { label:'❌ Отменён', color:'#f44336' }
  };
  return map[status] || { label:status, color:'#999' };
}

// ========== FIREBASE ОПЕРАЦИИ ==========
function listenToOrders() {
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    allOrders = data ? Object.entries(data).map(([k,o])=>({...o, firebaseKey:k})).sort((a,b)=>b.id - a.id) : [];
    calculateTotal();
    loadHistory();
  });
}

async function createOrder() {
  const name = localStorage.getItem('suptemiz_userName');
  let phone = localStorage.getItem('suptemiz_userPhone');
  const address = document.getElementById('address')?.value.trim();
  if (!address) { showToast('Укажите адрес'); return; }
  if (!name || !phone) { showRegisterModal(() => createOrder()); return; }
  phone = phone.replace(/\s/g, '');
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = document.getElementById('date')?.value || today;
  if (selectedDate < today) { showToast('Нельзя выбрать прошедшую дату'); return; }
  const rooms = parseInt(document.getElementById('rooms')?.value) || 1;
  const area = parseInt(document.getElementById('area')?.value) || 50;
  const order = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    orderDate: selectedDate,
    orderTime: document.getElementById('time')?.value || '09:00 - 12:00',
    address, district: document.getElementById('district')?.options[document.getElementById('district').selectedIndex]?.text || '',
    rooms, area, service: getSelectedServiceText(), extrasList: getExtras(),
    total: calculateTotal(), status: 'Ожидает подтверждения',
    userName: name, userPhone: phone, userEmail: document.getElementById('userEmail')?.value || '',
    review: null
  };
  await ordersRef.push(order);
  showToast('✅ Заказ оформлен!');
  document.getElementById('address').value = '';
  document.getElementById('extra_ac').checked = false;
  document.getElementById('extra_window').checked = false;
  document.getElementById('extra_fridge').checked = false;
  document.getElementById('rooms').value = 1;
  document.getElementById('area').value = 50;
}

window.updateOrderStatus = async function(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if(order && order.firebaseKey) {
    await ordersRef.child(order.firebaseKey).update({ status: newStatus });
    showToast(`✅ Статус #${orderId} → ${newStatus}`);
  }
};

// ========== ОТЗЫВЫ ==========
window.reviewFiles = {};
window.previewPhoto = function(orderId, input) {
  const file = input.files[0];
  if (file) {
    window.reviewFiles[orderId] = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDiv = document.getElementById(`photo-preview-${orderId}`);
      if (previewDiv) previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width:100%; border-radius:16px; max-height:150px;">`;
    };
    reader.readAsDataURL(file);
  }
};
window.submitReview = async function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order || order.status !== 'Завершён') { showToast('Отзыв можно оставить только для завершённого заказа'); return; }
  const starsContainer = document.getElementById(`stars-${orderId}`);
  const stars = starsContainer ? parseInt(starsContainer.dataset.rating || 0) : 0;
  const text = document.getElementById(`review-text-${orderId}`)?.value || '';
  if (stars === 0) { showToast('Оцените уборку звёздами'); return; }
  let photoUrl = null;
  const file = window.reviewFiles[orderId];
  if (file) {
    const storageRef = firebase.storage().ref(`reviews/${orderId}/${Date.now()}_${file.name}`);
    showToast('📤 Загрузка фото...');
    await storageRef.put(file);
    photoUrl = await storageRef.getDownloadURL();
    delete window.reviewFiles[orderId];
  }
  await ordersRef.child(order.firebaseKey).update({ review: { rating: stars, text, photoUrl, date: new Date().toISOString() } });
  showToast('Спасибо за отзыв!');
  loadHistory();
};
window.setRating = function(orderId, rating) {
  const container = document.getElementById(`stars-${orderId}`);
  if (!container) return;
  container.dataset.rating = rating;
  const stars = container.querySelectorAll('.star');
  stars.forEach((star, idx) => { if (idx < rating) star.classList.add('active'); else star.classList.remove('active'); });
};

// ========== ИСТОРИЯ ==========
function loadHistory() {
  const container = document.getElementById('historyList');
  const userPhone = localStorage.getItem('suptemiz_userPhone');
  let display = (currentRole === 'client' && userPhone) ? allOrders.filter(o => o.userPhone === userPhone) : allOrders;
  if (!display.length) { container.innerHTML = '<div class="empty-state">📭 Нет заказов</div>'; return; }
  container.innerHTML = display.map(order => {
    const cfg = getStatusConfig(order.status);
    const canCancel = (currentRole === 'client' && order.status === 'Ожидает подтверждения');
    const canReview = (currentRole === 'client' && order.status === 'Завершён' && !order.review);
    const showReview = order.review;
    const isStaff = (currentRole === 'admin' || currentRole === 'cleaner');
    return `
      <div class="history-item">
        <div class="history-header"><strong>${order.orderDate}</strong><span style="font-weight:700;">${order.total} ₺</span></div>
        <div>${order.service} • ${order.rooms} комн. • ${order.area} м²</div>
        <div><small>📍 ${order.address}</small></div>
        <div><span class="status-badge" style="background:${cfg.color}">${cfg.label}</span></div>
        ${isStaff ? `
          <div class="compact-status-actions">
            <button class="compact-status-btn confirm" onclick="updateOrderStatus(${order.id}, 'Подтверждён')">✅</button>
            <button class="compact-status-btn arrive" onclick="updateOrderStatus(${order.id}, 'Клинер выехал')">🚗</button>
            <button class="compact-status-btn start" onclick="updateOrderStatus(${order.id}, 'Уборка началась')">🧹</button>
            <button class="compact-status-btn complete" onclick="updateOrderStatus(${order.id}, 'Уборка завершена')">✔️</button>
            <button class="compact-status-btn finish" onclick="updateOrderStatus(${order.id}, 'Завершён')">⭐</button>
            <button class="compact-status-btn cancel" onclick="updateOrderStatus(${order.id}, 'Отменен')">❌</button>
          </div>
        ` : (canCancel ? `<div><button class="btn-small" onclick="updateOrderStatus(${order.id}, 'Отменен')">❌ ${t('cancel')}</button></div>` : '')}
        ${canReview ? `
          <div class="review-section">
            <div class="review-stars" id="stars-${order.id}" data-rating="0">
              ${[1,2,3,4,5].map(s => `<span class="star" onclick="setRating(${order.id}, ${s})">★</span>`).join('')}
            </div>
            <textarea id="review-text-${order.id}" class="review-text" placeholder="${t('review_placeholder')}" rows="2"></textarea>
            <div><label class="btn-small" style="background:#2196F3; display:inline-block;">📷 ${t('add_photo')}<input type="file" accept="image/*" onchange="previewPhoto(${order.id}, this)" style="display:none;"></label>
            <div id="photo-preview-${order.id}" class="review-photo"></div></div>
            <button class="btn-small" onclick="submitReview(${order.id})">⭐ ${t('send_review')}</button>
          </div>
        ` : (showReview ? `
          <div class="review-section">
            <strong>⭐ ${order.review.rating}/5</strong>
            <p>${order.review.text}</p>
            ${order.review.photoUrl ? `<img src="${order.review.photoUrl}" style="max-width:100%; border-radius:16px;">` : ''}
            <small>${new Date(order.review.date).toLocaleDateString()}</small>
          </div>
        ` : '')}
        <div class="order-id">🆔 #${order.id}</div>
      </div>
    `;
  }).join('');
}

// ========== ПРОФИЛЬ И РОЛИ ==========
function loadProfile() {
  document.getElementById('userName').value = localStorage.getItem('suptemiz_userName') || '';
  let phone = localStorage.getItem('suptemiz_userPhone') || '';
  if (phone && !phone.startsWith('+90')) phone = '+90 ' + phone;
  document.getElementById('userPhone').value = phone;
  document.getElementById('userEmail').value = localStorage.getItem('suptemiz_userEmail') || '';
  checkRole();
}
function saveProfile() {
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  if (name && phone) {
    localStorage.setItem('suptemiz_userName', name);
    localStorage.setItem('suptemiz_userPhone', phone);
    localStorage.setItem('suptemiz_userEmail', email);
    checkRole(); calculateTotal(); showToast('✅ Профиль сохранён!');
  } else showToast('Заполните имя и телефон');
}
function checkRole() {
  const phone = localStorage.getItem('suptemiz_userPhone');
  if (ADMIN_PHONES.includes(phone)) { currentRole='admin'; document.getElementById('roleBadge').innerHTML='👑 Администратор'; document.getElementById('adminFab').style.display='flex'; }
  else if (CLEANER_PHONES.includes(phone)) { currentRole='cleaner'; document.getElementById('roleBadge').innerHTML='🧹 Клинер'; document.getElementById('adminFab').style.display='flex'; }
  else { currentRole='client'; document.getElementById('roleBadge').innerHTML='👤 Клиент'; document.getElementById('adminFab').style.display='none'; }
  loadHistory();
}
function showRegisterModal(callback) {
  const modal = document.getElementById('registerModal');
  document.getElementById('modalName').value = localStorage.getItem('suptemiz_userName') || '';
  document.getElementById('modalPhone').value = localStorage.getItem('suptemiz_userPhone') || '';
  document.getElementById('modalEmail').value = localStorage.getItem('suptemiz_userEmail') || '';
  modal.classList.add('active');
  document.getElementById('modalSaveBtn').onclick = () => {
    const name = document.getElementById('modalName').value.trim();
    let phone = document.getElementById('modalPhone').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    if (name && phone) {
      localStorage.setItem('suptemiz_userName', name);
      localStorage.setItem('suptemiz_userPhone', phone);
      localStorage.setItem('suptemiz_userEmail', email);
      modal.classList.remove('active');
      if(callback) callback();
    } else showToast('Заполните имя и телефон');
  };
  document.getElementById('modalCloseBtn').onclick = () => modal.classList.remove('active');
}

// ========== ВКЛАДКИ ==========
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      document.getElementById(btn.dataset.tab+'-tab').classList.add('active');
      if(btn.dataset.tab==='history') loadHistory();
      if(btn.dataset.tab==='profile') loadProfile();
    });
  });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  // тема
  if (localStorage.getItem('suptemiz_theme') === 'dark') document.body.classList.add('dark');
  document.getElementById('themeToggle').onclick = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('suptemiz_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  };
  // язык
  const savedLang = localStorage.getItem('suptemiz_lang');
  if (savedLang) { currentLang = savedLang; document.getElementById('langSelect').value = currentLang; }
  document.getElementById('langSelect').onchange = (e) => {
    currentLang = e.target.value;
    localStorage.setItem('suptemiz_lang', currentLang);
    document.getElementById('orderBtn').innerHTML = '📞 ' + t('order_btn');
    document.getElementById('saveProfileBtn').innerHTML = '💾 ' + t('save_profile');
    calculateTotal(); loadHistory();
  };
  // дата
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('date');
  if (dateInput) { dateInput.min = today; dateInput.value = today; }
  // кнопки
  document.getElementById('orderBtn').addEventListener('click', createOrder);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('userPhone')?.addEventListener('input', e => phoneMask(e.target));
  document.getElementById('adminFab')?.addEventListener('click', () => document.getElementById('adminModal').classList.add('active'));
  document.getElementById('closeAdminModalBtn')?.addEventListener('click', () => document.getElementById('adminModal').classList.remove('active'));
  document.getElementById('adminModal')?.addEventListener('click', (e) => { if(e.target === document.getElementById('adminModal')) document.getElementById('adminModal').classList.remove('active'); });
  // изменение цены
  document.querySelectorAll('input[name="service"], #extra_ac, #extra_window, #extra_fridge, #rooms, #area').forEach(el => el.addEventListener('change', calculateTotal));
  loadProfile();
  listenToOrders();
});
