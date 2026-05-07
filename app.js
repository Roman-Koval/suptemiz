// ==================== CONFIG ====================
const firebaseConfig = {
    // ← ВСТАВЬ СВОЙ CONFIG
    apiKey: "YOUR_API_KEY",
    authDomain: "suptemiz.firebaseapp.com",
    databaseURL: "https://suptemiz-default-rtdb.firebaseio.com",
    projectId: "suptemiz",
    storageBucket: "suptemiz.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== TRANSLATIONS ====================
const translations = {
    ru: {
        district: "📍 Ваш район",
        rooms: "🏠 Комнаты и площадь",
        service_type: "🧹 Тип уборки",
        extras: "✨ Дополнительно",
        datetime: "📅 Дата и время"
    },
    tr: {
        district: "📍 Bölgeniz",
        rooms: "🏠 Oda ve metrekare",
        service_type: "🧹 Temizlik tipi",
        extras: "✨ Ek hizmetler",
        datetime: "📅 Tarih ve saat"
    },
    en: {
        district: "📍 Your District",
        rooms: "🏠 Rooms & Area",
        service_type: "🧹 Service Type",
        extras: "✨ Extras",
        datetime: "📅 Date & Time"
    }
};

let currentLang = 'ru';

// ==================== STATE ====================
let currentUser = { role: "client", name: "", phone: "" };
let currentTotal = 650;

// ==================== DOM ====================
const tabs = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

const totalPriceEl = document.getElementById('totalPrice');
const orderBtn = document.getElementById('orderBtn');
const themeToggle = document.getElementById('themeToggle');
const langSelect = document.getElementById('langSelect');

// ==================== UTILS ====================
function t(key) {
    return translations[currentLang][key] || key;
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}

function calculateTotal() {
    let base = 650;
    const rooms = parseInt(document.getElementById('rooms')?.value) || 2;
    const area = parseInt(document.getElementById('area')?.value) || 80;

    if (area > 120) base += 400;
    if (rooms >= 4) base += 300;

    // Дополнительно (добавь свои чекбоксы)
    currentTotal = base;
    totalPriceEl.textContent = currentTotal + ' ₺';
}

// ==================== TABS ====================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
    });
});

// ==================== ORDER ====================
orderBtn.addEventListener('click', () => {
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('date').value;

    if (!address || !date) {
        showToast('Заполните адрес и дату!', 'error');
        return;
    }

    const orderData = {
        userName: currentUser.name || "Клиент",
        phone: currentUser.phone,
        district: document.getElementById('district').value,
        address: address,
        rooms: document.getElementById('rooms').value,
        area: document.getElementById('area').value,
        date: date,
        time: document.getElementById('time').value,
        total: currentTotal,
        status: "new",
        createdAt: new Date().toISOString()
    };

    db.ref('orders').push(orderData)
        .then(() => {
            showToast('✅ Заказ успешно создан! Скоро свяжемся с вами.');
            document.getElementById('address').value = '';
        })
        .catch(() => showToast('Ошибка отправки', 'error'));
});

// ==================== THEME & LANG ====================
function initTheme() {
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', dark);
    themeToggle.textContent = dark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});

langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    document.documentElement.lang = currentLang;
    // Обновить все data-lang элементы при необходимости
});

// ==================== INIT ====================
function init() {
    // Минимальная дата
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.min = today;

    initTheme();
    calculateTotal();

    // Загрузка профиля из localStorage
    const saved = localStorage.getItem('userProfile');
    if (saved) currentUser = JSON.parse(saved);

    console.log('%cSupTemiz v2.0 — Максимальная версия загружена 🚀', 'color:#22c55e; font-weight:bold');
}

window.onload = init;
