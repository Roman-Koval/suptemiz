// ================== FIREBASE ==================
const firebaseConfig = {
    // ← Замени на свой!
    databaseURL: "https://suptemiz-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================== STATE ==================
let totalPrice = 650;

// ================== HELPERS ==================
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function calculateTotal() {
    totalPrice = 650;
    document.querySelectorAll('.extra-cb:checked').forEach(cb => {
        totalPrice += +cb.dataset.price;
    });
    document.getElementById('totalPrice').textContent = totalPrice + ' ₺';
}

// ================== RENDER EXTRAS ==================
function renderExtras() {
    const container = document.getElementById('extrasContainer');
    const items = [
        {name: "Чистка кондиционера", price: 200},
        {name: "Мойка окон", price: 150},
        {name: "Холодильник", price: 120}
    ];

    container.innerHTML = items.map(item => `
        <div class="extra-item">
            <label>
                <input type="checkbox" class="extra-cb" data-price="${item.price}">
                \( {item.name} <span>+ \){item.price} ₺</span>
            </label>
        </div>
    `).join('');

    document.querySelectorAll('.extra-cb').forEach(cb => cb.addEventListener('change', calculateTotal));
}

// ================== ORDER SUBMIT ==================
document.getElementById('submitOrder').addEventListener('click', () => {
    const phone = document.getElementById('userPhone').value.trim();
    if (!phone) {
        showToast('Укажите телефон!');
        return;
    }

    const order = {
        name: document.getElementById('userName').value || "Клиент",
        phone: phone,
        address: document.getElementById('address').value,
        total: totalPrice,
        date: document.getElementById('date').value,
        createdAt: Date.now()
    };

    db.ref('orders').push(order).then(() => {
        showToast('✅ Заказ оформлен! Скоро свяжемся с вами.');
    });
});

// ================== INIT ==================
function init() {
    renderExtras();
    calculateTotal();

    // Заполняем select'ы
    const districts = ["Гирне", "Лефкоша", "Газимагуса", "Искеле"];
    const districtSelect = document.getElementById('district');
    districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        districtSelect.appendChild(opt);
    });

    const times = ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00"];
    const timeSelect = document.getElementById('time');
    times.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        timeSelect.appendChild(opt);
    });

    document.getElementById('date').min = new Date().toISOString().split('T')[0];

    // Save profile
    document.getElementById('saveProfile').addEventListener('click', () => showToast('Профиль сохранён'));

    // Admin button
    document.getElementById('adminFab').addEventListener('click', () => showToast('Админ-панель открыта (в разработке)'));

    console.log('%cSupTemiz — полностью готов к работе 🚀', 'color:#22c55e; font-size:16px');
}

window.onload = init;
