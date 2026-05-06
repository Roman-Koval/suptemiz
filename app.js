// ========== ПЕРЕВОДЫ ==========
const translations = {
    ru: {
        promo: "🎉 Первая уборка со скидкой 20%",
        nav_order: "Заказ",
        nav_history: "История",
        nav_profile: "Профиль",
        location_title: "Ваш район",
        service_title: "Тип уборки",
        service_standard: "Стандартная",
        service_general: "Генеральная",
        service_after: "После ремонта",
        service_office: "Офисная",
        extras_title: "Дополнительно",
        extra_ac: "Чистка кондиционера (до 2 шт.)",
        extra_window: "Мойка окон (до 6 шт.)",
        extra_fridge: "Чистка холодильника",
        date_title: "Дата и время",
        total_title: "Итого:",
        no_orders: "У вас пока нет заказов",
        order_confirmed: "✅ Заказ подтверждён! Мы свяжемся с вами в ближайшее время.",
        profile_saved: "✅ Профиль сохранён!",
        fill_name_phone: "Пожалуйста, заполните имя и телефон",
        fill_address: "Пожалуйста, укажите адрес",
        no_orders_history: "Нет заказов"
    },
    en: {
        promo: "🎉 First cleaning 20% off",
        nav_order: "Order",
        nav_history: "History",
        nav_profile: "Profile",
        location_title: "Your district",
        service_title: "Cleaning type",
        service_standard: "Standard",
        service_general: "General",
        service_after: "After renovation",
        service_office: "Office",
        extras_title: "Extras",
        extra_ac: "AC cleaning (up to 2 units)",
        extra_window: "Window cleaning (up to 6)",
        extra_fridge: "Fridge cleaning",
        date_title: "Date & time",
        total_title: "Total:",
        no_orders: "No orders yet",
        order_confirmed: "✅ Order confirmed! We'll contact you soon.",
        profile_saved: "✅ Profile saved!",
        fill_name_phone: "Please fill in name and phone",
        fill_address: "Please enter your address",
        no_orders_history: "No orders"
    },
    tr: {
        promo: "🎉 İlk temizlikte %20 indirim",
        nav_order: "Sipariş",
        nav_history: "Geçmiş",
        nav_profile: "Profil",
        location_title: "Bölgeniz",
        service_title: "Temizlik türü",
        service_standard: "Standart",
        service_general: "Genel",
        service_after: "Tadilat sonrası",
        service_office: "Ofis",
        extras_title: "Ekstralar",
        extra_ac: "Klima temizliği (2'ye kadar)",
        extra_window: "Cam temizliği (6'ya kadar)",
        extra_fridge: "Buzdolabı temizliği",
        date_title: "Tarih ve saat",
        total_title: "Toplam:",
        no_orders: "Henüz sipariş yok",
        order_confirmed: "✅ Sipariş onaylandı! En kısa sürede size ulaşacağız.",
        profile_saved: "✅ Profil kaydedildi!",
        fill_name_phone: "Lütfen ad ve telefon girin",
        fill_address: "Lütfen adres girin",
        no_orders_history: "Sipariş yok"
    }
};

let currentLang = 'ru';

// ========== РАСЧЁТ ЦЕНЫ ==========
function calculateTotal() {
    let total = 0;
    
    // Выбор услуги
    const selectedService = document.querySelector('input[name="service"]:checked').value;
    const prices = {
        standard: 500,
        general: 950,
        after_repair: 1800,
        office: 700
    };
    total = prices[selectedService] || 500;
    
    // Дополнительно
    if (document.getElementById('extra_ac').checked) total += 200;
    if (document.getElementById('extra_window').checked) total += 150;
    if (document.getElementById('extra_fridge').checked) total += 100;
    
    document.getElementById('totalPrice').innerHTML = total.toLocaleString('tr-TR') + ' ₺';
    return total;
}

// ========== СОХРАНЕНИЕ ЗАКАЗА ==========
function saveOrder() {
    const name = localStorage.getItem('userName') || '';
    const phone = localStorage.getItem('userPhone') || '';
    
    if (!name || !phone) {
        showToast(translations[currentLang].fill_name_phone);
        return false;
    }
    
    const address = document.getElementById('address').value;
    if (!address) {
        showToast(translations[currentLang].fill_address);
        return false;
    }
    
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        district: document.getElementById('district').options[document.getElementById('district').selectedIndex].text,
        address: address,
        service: document.querySelector('input[name="service"]:checked').parentElement.querySelector('strong').innerText,
        extras: getExtras(),
        orderDate: document.getElementById('date').value,
        orderTime: document.getElementById('time').options[document.getElementById('time').selectedIndex].text,
        total: calculateTotal(),
        status: 'Ожидает подтверждения',
        userName: name,
        userPhone: phone
    };
    
    // Сохраняем в localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Отправляем в Telegram (для быстрого оповещения)
    sendToTelegram(order);
    
    showToast(translations[currentLang].order_confirmed);
    
    // Очищаем форму
    document.getElementById('address').value = '';
    document.getElementById('extra_ac').checked = false;
    document.getElementById('extra_window').checked = false;
    document.getElementById('extra_fridge').checked = false;
    
    loadHistory();
    return true;
}

function getExtras() {
    const extras = [];
    if (document.getElementById('extra_ac').checked) extras.push('Чистка кондиционера');
    if (document.getElementById('extra_window').checked) extras.push('Мойка окон');
    if (document.getElementById('extra_fridge').checked) extras.push('Чистка холодильника');
    return extras.join(', ') || 'Нет';
}

// ========== TELEGRAM ОПОВЕЩЕНИЕ ==========
// ВАЖНО: замените BOT_TOKEN и CHAT_ID на свои!
const BOT_TOKEN = 'ВАШ_ТОКЕН_ТЕЛЕГРАМ_БОТА';
const CHAT_ID = 'ВАШ_CHAT_ID';

async function sendToTelegram(order) {
    const message = `
🚨 НОВЫЙ ЗАКАЗ!
━━━━━━━━━━━━━━━━
👤 Клиент: ${order.userName}
📞 Телефон: ${order.userPhone}
📍 Район: ${order.district}
🏠 Адрес: ${order.address}
🧹 Услуга: ${order.service}
✨ Дополнительно: ${order.extras}
📅 Дата: ${order.orderDate}
⏰ Время: ${order.orderTime}
💰 Сумма: ${order.total} ₺
🆔 ID: ${order.id}
━━━━━━━━━━━━━━━━
    `;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch(e) {
        console.log('Telegram error:', e);
    }
}

// ========== ИСТОРИЯ ЗАКАЗОВ ==========
function loadHistory() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const container = document.getElementById('historyList');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <p data-i18n="no_orders">${translations[currentLang].no_orders}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="history-item">
            <strong>${new Date(order.date).toLocaleDateString('ru-RU')}</strong><br>
            ${order.service} • ${order.total} ₺<br>
            <small>${order.address} • ${order.status}</small>
            <button class="btn-small" onclick="repeatOrder(${order.id})">🔄 Повторить</button>
        </div>
    `).join('');
}

function repeatOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        document.getElementById('district').value = order.district;
        document.getElementById('address').value = order.address;
        // Переключаем таб на заказ
        document.querySelector('.nav-tab[data-tab="order"]').click();
        showToast('Данные из прошлого заказа заполнены');
    }
}

// ========== ПРОФИЛЬ ==========
function loadProfile() {
    document.getElementById('userName').value = localStorage.getItem('userName') || '';
    document.getElementById('userPhone').value = localStorage.getItem('userPhone') || '';
}

function saveProfile() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    if (name && phone) {
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        showToast(translations[currentLang].profile_saved);
    } else {
        showToast(translations[currentLang].fill_name_phone);
    }
}

// ========== ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА ==========
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    calculateTotal();
    loadHistory();
}

// ========== UI КОМПОНЕНТЫ ==========
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== ТАБЫ ==========
function initTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadProfile();
    loadHistory();
    calculateTotal();
    
    // Слушатели
    document.querySelectorAll('input[name="service"], #extra_ac, #extra_window, #extra_fridge').forEach(el => {
        el.addEventListener('change', calculateTotal);
    });
    
    document.getElementById('orderBtn').addEventListener('click', saveOrder);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setLanguage(btn.dataset.lang);
        });
    });
});
// ========== ОНЛАЙН ОПЛАТА ЧЕРЕЗ PAYTR ==========
// ВАЖНО: замените на свои данные после регистрации в PayTR
const PAYTR_MERCHANT_ID = 'YOUR_MERCHANT_ID';
const PAYTR_MERCHANT_KEY = 'YOUR_MERCHANT_KEY';
const PAYTR_MERCHANT_SALT = 'YOUR_MERCHANT_SALT';

async function processPayment(order) {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (paymentMethod === 'cash') {
        // Наличными - просто сохраняем заказ
        saveOrderToLocal(order);
        showToast(translations[currentLang].order_confirmed);
        sendToTelegram(order);
        return true;
    }
    
    // Онлайн оплата через PayTR
    showToast('🔄 Перенаправление на оплату...');
    
    const paymentData = {
        merchant_id: PAYTR_MERCHANT_ID,
        user_ip: await getUserIP(),
        merchant_oid: order.id.toString(),
        email: localStorage.getItem('userEmail') || '',
        payment_amount: order.total,
        currency: 'TRY',
        test_mode: '1', // 1 = тестовый режим
        non_3d: '0',
        timeout_limit: '30',
        lang: currentLang === 'tr' ? 'tr' : 'en',
        success_url: window.location.origin + '/payment-success.html?order_id=' + order.id,
        fail_url: window.location.origin + '/payment-cancel.html',
        merchant_ok_url: window.location.origin + '/payment-success.html',
        merchant_fail_url: window.location.origin + '/payment-cancel.html',
        user_name: localStorage.getItem('userName') || '',
        user_phone: localStorage.getItem('userPhone') || ''
    };
    
    // Генерируем подпись
    const hashStr = `${PAYTR_MERCHANT_ID}${paymentData.user_ip}${paymentData.merchant_oid}${paymentData.email}${paymentData.payment_amount}${paymentData.currency}${paymentData.test_mode}${paymentData.non_3d}${paymentData.timeout_limit}${PAYTR_MERCHANT_KEY}`;
    const token = await sha256(hashStr);
    paymentData.paytr_token = token;
    
    // Отправляем запрос на PayTR
    try {
        const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Сохраняем заказ во временное хранилище
            localStorage.setItem(`pending_order_${order.id}`, JSON.stringify(order));
            // Перенаправляем на страницу оплаты
            window.location.href = result.secure_url;
        } else {
            showToast('Ошибка оплаты: ' + result.reason);
            return false;
        }
    } catch(e) {
        showToast('Ошибка подключения к платёжной системе');
        return false;
    }
}

// Вспомогательная функция для получения IP
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch(e) {
        return '127.0.0.1';
    }
}

// SHA256 хеш для подписи PayTR
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Обновляем функцию оформления заказа
async function submitOrder() {
    const name = localStorage.getItem('userName') || '';
    const phone = localStorage.getItem('userPhone') || '';
    
    if (!name || !phone) {
        showToast(translations[currentLang].fill_name_phone);
        return false;
    }
    
    const address = document.getElementById('address').value;
    if (!address) {
        showToast(translations[currentLang].fill_address);
        return false;
    }
    
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        district: document.getElementById('district').options[document.getElementById('district').selectedIndex].text,
        address: address,
        service: document.querySelector('input[name="service"]:checked').parentElement.querySelector('strong').innerText,
        extras: getExtras(),
        orderDate: document.getElementById('date').value || new Date().toISOString().split('T')[0],
        orderTime: document.getElementById('time').options[document.getElementById('time').selectedIndex].text,
        total: calculateTotal(),
        status: 'Ожидает оплаты',
        userName: name,
        userPhone: phone,
        userEmail: localStorage.getItem('userEmail') || '',
        paymentMethod: document.querySelector('input[name="payment"]:checked').value
    };
    
    // Если наличные - сразу сохраняем
    if (order.paymentMethod === 'cash') {
        order.status = 'Ожидает подтверждения';
        saveOrderToLocal(order);
        showToast(translations[currentLang].order_confirmed);
        sendToTelegram(order);
        clearForm();
        return true;
    }
    
    // Если карта - идём в оплату
    await processPayment(order);
}

function saveOrderToLocal(order) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    loadHistory();
}

function clearForm() {
    document.getElementById('address').value = '';
    document.getElementById('extra_ac').checked = false;
    document.getElementById('extra_window').checked = false;
    document.getElementById('extra_fridge').checked = false;
    document.getElementById('date').value = '';
}

// Обновляем слушатель кнопки
document.addEventListener('DOMContentLoaded', () => {
    // существующий код...
    document.getElementById('orderBtn').addEventListener('click', submitOrder);
});
