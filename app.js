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
        order_confirmed: "✅ Заказ подтверждён! Мы свяжемся с вами",
        profile_saved: "✅ Профиль сохранён!",
        fill_name_phone: "Пожалуйста, заполните имя и телефон",
        fill_address: "Пожалуйста, укажите адрес"
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
        extra_ac: "AC cleaning",
        extra_window: "Window cleaning",
        extra_fridge: "Fridge cleaning",
        date_title: "Date & time",
        total_title: "Total:",
        no_orders: "No orders yet",
        order_confirmed: "✅ Order confirmed! We'll contact you",
        profile_saved: "✅ Profile saved!",
        fill_name_phone: "Please fill name and phone",
        fill_address: "Please enter address"
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
        extra_ac: "Klima temizliği",
        extra_window: "Cam temizliği",
        extra_fridge: "Buzdolabı temizliği",
        date_title: "Tarih ve saat",
        total_title: "Toplam:",
        no_orders: "Henüz sipariş yok",
        order_confirmed: "✅ Sipariş onaylandı! Size ulaşacağız",
        profile_saved: "✅ Profil kaydedildi!",
        fill_name_phone: "Lütfen ad ve telefon girin",
        fill_address: "Lütfen adres girin"
    }
};

let currentLang = 'ru';

// ========== ТЕЛЕГРАМ НАСТРОЙКИ (ВСТАВЬТЕ НОВЫЙ ТОКЕН) ==========
const BOT_TOKEN = '8776328263:AAFW4TPDyi1CwnbprZ-S1I2Mj9bXUDL0vv8';
const CHAT_ID = '897174464';

// ========== РАСЧЁТ ЦЕНЫ ==========
function calculateTotal() {
    let total = 0;
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (!selectedService) return 500;
    
    const prices = {
        standard: 500,
        general: 950,
        after_repair: 1800,
        office: 700
    };
    total = prices[selectedService.value] || 500;
    
    if (document.getElementById('extra_ac')?.checked) total += 200;
    if (document.getElementById('extra_window')?.checked) total += 150;
    if (document.getElementById('extra_fridge')?.checked) total += 100;
    
    const totalEl = document.getElementById('totalPrice');
    if (totalEl) totalEl.innerHTML = total.toLocaleString('tr-TR') + ' ₺';
    return total;
}

function getSelectedServiceText() {
    const selected = document.querySelector('input[name="service"]:checked');
    if (!selected) return 'Стандартная';
    const parent = selected.closest('.service-option');
    const strong = parent?.querySelector('strong');
    return strong ? strong.innerText : 'Стандартная';
}

function getExtras() {
    const extras = [];
    if (document.getElementById('extra_ac')?.checked) extras.push('Чистка кондиционера');
    if (document.getElementById('extra_window')?.checked) extras.push('Мойка окон');
    if (document.getElementById('extra_fridge')?.checked) extras.push('Чистка холодильника');
    return extras.join(', ') || 'Нет';
}

function clearForm() {
    const addressInput = document.getElementById('address');
    if (addressInput) addressInput.value = '';
    
    const acCheck = document.getElementById('extra_ac');
    const windowCheck = document.getElementById('extra_window');
    const fridgeCheck = document.getElementById('extra_fridge');
    if (acCheck) acCheck.checked = false;
    if (windowCheck) windowCheck.checked = false;
    if (fridgeCheck) fridgeCheck.checked = false;
    
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function sendToTelegram(order) {
    const message = `🚨 НОВЫЙ ЗАКАЗ SUP TEMIZ!
━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('ru-RU')}`;

    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            console.log('✅ Уведомление отправлено в Telegram');
        } else {
            console.log('❌ Ошибка Telegram:', data.description);
        }
    })
    .catch(err => console.log('❌ Ошибка отправки:', err));
}

function saveOrder() {
    const name = localStorage.getItem('userName') || document.getElementById('userName')?.value || '';
    const phone = localStorage.getItem('userPhone') || document.getElementById('userPhone')?.value || '';
    
    if (!name || !phone) {
        showToast(translations[currentLang].fill_name_phone);
        return false;
    }
    
    const address = document.getElementById('address')?.value;
    if (!address) {
        showToast(translations[currentLang].fill_address);
        return false;
    }
    
    const districtSelect = document.getElementById('district');
    const timeSelect = document.getElementById('time');
    
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        district: districtSelect?.options[districtSelect.selectedIndex]?.text || '',
        address: address,
        service: getSelectedServiceText(),
        extras: getExtras(),
        orderDate: document.getElementById('date')?.value || new Date().toISOString().split('T')[0],
        orderTime: timeSelect?.options[timeSelect.selectedIndex]?.text || '',
        total: calculateTotal(),
        status: 'Ожидает подтверждения',
        userName: name,
        userPhone: phone,
        userEmail: document.getElementById('userEmail')?.value || '',
        paymentMethod: 'Наличные'
    };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    sendToTelegram(order);
    
    showToast(translations[currentLang].order_confirmed);
    loadHistory();
    clearForm();
    return true;
}

function loadHistory() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `<div class="empty-state"><span>📭</span><p>${translations[currentLang].no_orders}</p></div>`;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="history-item">
            <strong>${new Date(order.date).toLocaleDateString('ru-RU')}</strong><br>
            ${order.service} • ${order.total} ₺<br>
            <small>${order.address.substring(0, 30)} • ${order.status}</small>
            <button class="btn-small" onclick="repeatOrder(${order.id})">🔄 Повторить</button>
        </div>
    `).join('');
}

function repeatOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const addressInput = document.getElementById('address');
        if (addressInput) addressInput.value = order.address;
        
        const districtSelect = document.getElementById('district');
        if (districtSelect) {
            for (let i = 0; i < districtSelect.options.length; i++) {
                if (districtSelect.options[i].text === order.district) {
                    districtSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        document.querySelector('.nav-tab[data-tab="order"]')?.click();
        showToast('📋 Данные из прошлого заказа заполнены');
    }
}

function loadProfile() {
    const nameInput = document.getElementById('userName');
    const phoneInput = document.getElementById('userPhone');
    const emailInput = document.getElementById('userEmail');
    
    if (nameInput) nameInput.value = localStorage.getItem('userName') || '';
    if (phoneInput) phoneInput.value = localStorage.getItem('userPhone') || '';
    if (emailInput) emailInput.value = localStorage.getItem('userEmail') || '';
}

function saveProfile() {
    const name = document.getElementById('userName')?.value || '';
    const phone = document.getElementById('userPhone')?.value || '';
    const email = document.getElementById('userEmail')?.value || '';
    
    if (name && phone) {
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('userEmail', email);
        showToast(translations[currentLang].profile_saved);
    } else {
        showToast(translations[currentLang].fill_name_phone);
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            contents.forEach(content => content.classList.remove('active'));
            
            const activeContent = document.getElementById(`${tabId}-tab`);
            if (activeContent) activeContent.classList.add('active');
            
            if (tabId === 'history') loadHistory();
            if (tabId === 'profile') loadProfile();
        });
    });
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    calculateTotal();
    if (document.getElementById('history-tab')?.classList.contains('active')) {
        loadHistory();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SupTemiz загружен!');
    
    initTabs();
    loadProfile();
    loadHistory();
    calculateTotal();
    
    const serviceRadios = document.querySelectorAll('input[name="service"]');
    serviceRadios.forEach(el => el.addEventListener('change', calculateTotal));
    
    const extraChecks = ['extra_ac', 'extra_window', 'extra_fridge'];
    extraChecks.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calculateTotal);
    });
    
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) orderBtn.addEventListener('click', saveOrder);
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setLanguage(btn.dataset.lang);
        });
    });
    
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
});
