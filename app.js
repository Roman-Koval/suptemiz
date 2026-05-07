// ====================== CONFIG ======================
const firebaseConfig = {
    apiKey: "AIzaSyD...твой_ключ...", // ← замени
    authDomain: "suptemiz.firebaseapp.com",
    databaseURL: "https://suptemiz-default-rtdb.firebaseio.com",
    projectId: "suptemiz",
    storageBucket: "suptemiz.appspot.com",
    messagingSenderId: "XXXXXXXXX",
    appId: "1:XXXXXXXXX:web:XXXXXXXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ====================== VARIABLES ======================
let currentUser = {
    role: "client",
    name: "",
    phone: "",
    uid: null
};

let currentOrder = {};

// ====================== DOM ELEMENTS ======================
const tabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

const orderBtn = document.getElementById('orderBtn');
const totalPriceEl = document.getElementById('totalPrice');
const themeToggle = document.getElementById('themeToggle');
const roleBadge = document.getElementById('roleBadge');

// ====================== UTILS ======================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#2E7D32' : '#d32f2f';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function calculateTotal() {
    let total = 500; // базовая стандартная уборка

    const selectedService = document.querySelector('input[name="service"]:checked');
    if (selectedService) {
        const prices = { standard: 500, general: 950, after_repair: 1800, office: 700 };
        total = prices[selectedService.value] || 500;
    }

    if (document.getElementById('extra_ac').checked) total += 200;
    if (document.getElementById('extra_window').checked) total += 150;
    if (document.getElementById('extra_fridge').checked) total += 100;

    totalPriceEl.textContent = total + ' ₺';
}

// ====================== TAB SWITCH ======================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
    });
});

// ====================== ORDER LOGIC ======================
orderBtn.addEventListener('click', () => {
    const district = document.getElementById('district').value;
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const service = document.querySelector('input[name="service"]:checked').value;

    if (!address || !date) {
        showToast('Пожалуйста, заполните адрес и дату', 'error');
        return;
    }

    const orderData = {
        userId: currentUser.uid || 'guest_' + Date.now(),
        userName: currentUser.name || 'Клиент',
        userPhone: currentUser.phone,
        district,
        address,
        service,
        date,
        time,
        extras: {
            ac: document.getElementById('extra_ac').checked,
            window: document.getElementById('extra_window').checked,
            fridge: document.getElementById('extra_fridge').checked
        },
        total: parseInt(totalPriceEl.textContent),
        status: 'new',
        createdAt: new Date().toISOString()
    };

    db.ref('orders').push(orderData)
        .then(() => {
            showToast('✅ Заказ успешно оформлен! Ожидайте звонка.');
            // Очистка формы
            document.getElementById('address').value = '';
            document.getElementById('date').value = '';
        })
        .catch(err => {
            console.error(err);
            showToast('Ошибка при отправке заказа', 'error');
        });
});

// ====================== PRICE CALCULATOR ======================
document.querySelectorAll('input[name="service"], #extra_ac, #extra_window, #extra_fridge')
    .forEach(el => el.addEventListener('change', calculateTotal));

// ====================== THEME ======================
function initTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});

// ====================== PROFILE ======================
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    currentUser.name = document.getElementById('userName').value.trim();
    currentUser.phone = document.getElementById('userPhone').value.trim();

    if (currentUser.name && currentUser.phone) {
        localStorage.setItem('userProfile', JSON.stringify(currentUser));
        showToast('Профиль сохранён');
        roleBadge.textContent = `👤 ${currentUser.name}`;
    } else {
        showToast('Заполните имя и телефон', 'error');
    }
});

// ====================== HISTORY ======================
function loadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Загрузка истории...</p>';

    db.ref('orders').orderByChild('createdAt').limitToLast(10).on('value', snapshot => {
        historyList.innerHTML = '';

        if (!snapshot.exists()) {
            historyList.innerHTML = '<p style="text-align:center; padding:40px;">История заказов пуста</p>';
            return;
        }

        snapshot.forEach(child => {
            const order = child.val();
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <strong>${order.service === 'standard' ? 'Стандартная' : 
                         order.service === 'general' ? 'Генеральная' : 'После ремонта'}</strong><br>
                ${order.address}<br>
                <small>${new Date(order.date).toLocaleDateString('ru-RU')} • ${order.time}</small><br>
                <strong style="color:var(--primary)">${order.total} ₺</strong> — 
                <span style="color:${order.status === 'new' ? '#f59e0b' : '#10b981'}">
                    ${order.status === 'new' ? 'Новый' : 'Выполнен'}
                </span>
            `;
            historyList.appendChild(div);
        });
    });
}

// ====================== INIT ======================
function init() {
    // Загрузка профиля
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        currentUser = JSON.parse(savedProfile);
        document.getElementById('userName').value = currentUser.name || '';
        document.getElementById('userPhone').value = currentUser.phone || '';
        roleBadge.textContent = `👤 ${currentUser.name || 'Клиент'}`;
    }

    // Минимальная дата = сегодня
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;

    initTheme();
    calculateTotal();
    loadHistory();

    // PWA install prompt (опционально)
    console.log('%cSupTemiz успешно инициализирован 🚀', 'color:#2E7D32; font-size:14px;');
}

window.onload = init;
