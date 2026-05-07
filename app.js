// ====================== FIREBASE CONFIG ======================
const firebaseConfig = {
    apiKey: "AIzaSyD...твой_ключ...",           // ← ОБЯЗАТЕЛЬНО ЗАМЕНИ
    authDomain: "suptemiz.firebaseapp.com",
    databaseURL: "https://suptemiz-default-rtdb.firebaseio.com",
    projectId: "suptemiz",
    storageBucket: "suptemiz.appspot.com",
    messagingSenderId: "XXXXXXXXXX",
    appId: "1:XXXXXXXXXX:web:XXXXXXXXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ====================== TRANSLATIONS ======================
const translations = {
    ru: {
        nav_order: "Заказ",
        nav_history: "История",
        nav_profile: "Профиль",
        location_title: "📍 Ваш район",
        service_title: "🧹 Тип уборки",
        extras_title: "✨ Дополнительно",
        date_title: "📅 Дата и время"
    },
    tr: {
        nav_order: "Sipariş",
        nav_history: "Geçmiş",
        nav_profile: "Profil",
        location_title: "📍 Bölgeniz",
        service_title: "🧹 Temizlik tipi",
        extras_title: "✨ Ekstra hizmetler",
        date_title: "📅 Tarih ve saat"
    },
    en: {
        nav_order: "Order",
        nav_history: "History",
        nav_profile: "Profile",
        location_title: "📍 Your District",
        service_title: "🧹 Service Type",
        extras_title: "✨ Extras",
        date_title: "📅 Date & Time"
    }
};

let currentLang = localStorage.getItem('lang') || 'ru';

// ====================== STATE ======================
let currentUser = {
    role: "client",
    name: "",
    phone: "",
    email: ""
};

let currentTotal = 650;

// ====================== DOM ELEMENTS ======================
const toast = document.getElementById('toast');
const totalPriceEl = document.getElementById('totalPrice');
const orderBtn = document.getElementById('orderBtn');
const themeToggle = document.getElementById('themeToggle');
const langSelect = document.getElementById('langSelect');
const adminFab = document.getElementById('adminFab');

// ====================== UTILS ======================
function t(key) {
    return translations[currentLang]?.[key] || key;
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function calculateTotal() {
    let base = 650;

    const rooms = parseInt(document.getElementById('rooms').value) || 2;
    const area = parseInt(document.getElementById('area').value) || 80;

    if (rooms === 3) base += 250;
    if (rooms >= 4) base += 450;
    if (area > 100) base += Math.floor((area - 100) * 4);

    // Extras
    document.querySelectorAll('.extra-checkbox:checked').forEach(ch => {
        base += parseInt(ch.dataset.price) || 0;
    });

    currentTotal = base;
    totalPriceEl.textContent = currentTotal + ' ₺';
}

// ====================== TABS ======================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
    });
});

// ====================== SERVICES & EXTRAS ======================
const services = [
    { id: "standard", name: "Стандартная", price: 650, ru: "Стандартная", tr: "Standart", en: "Standard" },
    { id: "general", name: "Генеральная", price: 1150, ru: "Генеральная", tr: "Genel", en: "General" },
    { id: "after_repair", name: "После ремонта", price: 1950, ru: "После ремонта", tr: "Tadilat sonrası", en: "After Repair" },
    { id: "office", name: "Офис", price: 850, ru: "Офис", tr: "Ofis", en: "Office" }
];

const extrasList = [
    { id: "ac", name: "Чистка кондиционеров", price: 200 },
    { id: "windows", name: "Мойка окон", price: 150 },
    { id: "fridge", name: "Холодильник", price: 120 },
    { id: "balcony", name: "Балкон/лоджия", price: 180 }
];

function renderServices() {
    const container = document.getElementById('serviceGrid');
    container.innerHTML = '';
    services.forEach(service => {
        const div = document.createElement('div');
        div.className = 'option';
        div.dataset.id = service.id;
        div.innerHTML = `
            <strong>${service.name}</strong><br>
            <small>${service.price} ₺</small>
        `;
        div.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
            div.classList.add('active');
            calculateTotal();
        });
        container.appendChild(div);
    });
}

function renderExtras() {
    const container = document.getElementById('extrasContainer');
    container.innerHTML = '';
    extrasList.forEach(extra => {
        const label = document.createElement('label');
        label.className = 'extra-option';
        label.innerHTML = `
            <input type="checkbox" class="extra-checkbox" data-price="${extra.price}">
            <span>\( {extra.name} <strong>+ \){extra.price} ₺</strong></span>
        `;
        container.appendChild(label);
    });

    document.querySelectorAll('.extra-checkbox').forEach(cb => {
        cb.addEventListener('change', calculateTotal);
    });
}

// ====================== ORDER ======================
orderBtn.addEventListener('click', () => {
    const address = document.getElementById('address').value.trim();
    const dateVal = document.getElementById('date').value;
    const timeVal = document.getElementById('time').value;

    if (!address || !dateVal) {
        showToast('Пожалуйста, укажите адрес и дату', 'error');
        return;
    }

    const orderData = {
        userId: currentUser.uid || 'guest_' + Date.now(),
        userName: currentUser.name || "Клиент",
        phone: currentUser.phone,
        district: document.getElementById('district').value,
        address: address,
        rooms: document.getElementById('rooms').value,
        area: document.getElementById('area').value,
        service: document.querySelector('.option.active')?.dataset.id || 'standard',
        date: dateVal,
        time: timeVal,
        extras: Array.from(document.querySelectorAll('.extra-checkbox:checked')).map(c => c.parentElement.textContent.trim()),
        total: currentTotal,
        status: "new",
        createdAt: new Date().toISOString()
    };

    db.ref('orders').push(orderData)
        .then(() => {
            showToast('✅ Заказ успешно оформлен! Ожидайте звонка в течение часа.');
            document.getElementById('address').value = '';
        })
        .catch(err => {
            console.error(err);
            showToast('Ошибка при отправке заказа', 'error');
        });
});

// ====================== HISTORY ======================
function loadHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">Загрузка истории...</p>';

    db.ref('orders').orderByChild('createdAt').limitToLast(15).on('value', snapshot => {
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p style="text-align:center;padding:60px;">Пока нет заказов</p>';
            return;
        }

        snapshot.forEach(child => {
            const order = child.val();
            const div = document.createElement('div');
            div.className = 'history-item card glass';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between">
                    <strong>${order.service || 'Уборка'}</strong>
                    <span style="color:#22c55e;font-weight:700">${order.total} ₺</span>
                </div>
                <p>${order.address}</p>
                <small>${new Date(order.date).toLocaleDateString('ru-RU')} • ${order.time}</small>
                <div style="margin-top:8px">
                    <span style="padding:4px 12px;border-radius:999px;background:#eab308;color:white;font-size:13px">
                        ${order.status === 'new' ? 'Новый' : 'Выполнен'}
                    </span>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

// ====================== PROFILE ======================
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    currentUser.name = document.getElementById('userName').value.trim();
    currentUser.phone = document.getElementById('userPhone').value.trim();
    currentUser.email = document.getElementById('userEmail').value.trim();

    if (currentUser.name && currentUser.phone) {
        localStorage.setItem('userProfile', JSON.stringify(currentUser));
        showToast('Профиль успешно сохранён');
    } else {
        showToast('Имя и телефон обязательны', 'error');
    }
});

// ====================== THEME & LANGUAGE ======================
function initTheme() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});

langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    document.documentElement.lang = currentLang;
    showToast(`Язык изменён на ${currentLang.toUpperCase()}`);
});

// ====================== INIT ======================
function init() {
    // Загрузка профиля
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        currentUser = JSON.parse(savedProfile);
        document.getElementById('userName').value = currentUser.name || '';
        document.getElementById('userPhone').value = currentUser.phone || '';
        document.getElementById('userEmail').value = currentUser.email || '';
    }

    // Минимальная дата
    const dateInput = document.getElementById('date');
    dateInput.min = new Date().toISOString().split('T')[0];

    // Заполнение районов
    const districts = ["Гирне", "Лефкоша", "Газимагуса", "Искеле", "Гюзельюрт", "Агирна"];
    const districtSelect = document.getElementById('district');
    districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        districtSelect.appendChild(opt);
    });

    // Заполнение времени
    const times = ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00"];
    const timeSelect = document.getElementById('time');
    times.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        timeSelect.appendChild(opt);
    });

    renderServices();
    renderExtras();
    initTheme();
    calculateTotal();
    loadHistory();

    // Показать админ кнопку для теста (можно скрыть)
    // adminFab.style.display = currentUser.role === 'admin' ? 'flex' : 'none';

    console.log('%c🚀 SupTemiz — Максимальная версия 2.0 успешно загружена', 'color:#22c55e;font-size:15px;font-weight:bold');
}

window.onload = init;
