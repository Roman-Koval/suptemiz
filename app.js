const firebaseConfig = {
    // ← ВСТАВЬ СВОЙ FIREBASE CONFIG
    apiKey: "AIzaSyDcsvkcECnkcIvJxa6FRpUurgIUgYwW4qg",
  authDomain: "suptemiz.firebaseapp.com",
  databaseURL: "https://suptemiz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "suptemiz",
  storageBucket: "suptemiz.firebasestorage.app",
  messagingSenderId: "399676923890",
  appId: "1:399676923890:web:44657bbb2870a7d76cd56b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = {name:"", phone:"", email:""};
let currentTotal = 650;

function showToast(msg, type='success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = type==='success' ? '#22c55e' : '#ef4444';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

function calculateTotal() {
    let total = 650;
    const rooms = +document.getElementById('rooms').value || 2;
    const area = +document.getElementById('area').value || 80;
    if (rooms >= 3) total += 300;
    if (area > 100) total += Math.floor((area-100)*5);
    document.querySelectorAll('.extra-cb:checked').forEach(el => total += +el.dataset.price);
    currentTotal = total;
    document.getElementById('totalPrice').textContent = total + ' ₺';
}

// Tabs
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
    });
});

// Render Services & Extras
const services = [{id:'standard',name:'Стандартная',price:650}, {id:'general',name:'Генеральная',price:1150}, {id:'after',name:'После ремонта',price:1950}];

function renderServices() {
    const container = document.getElementById('serviceGrid');
    container.innerHTML = services.map(s => `<div class="option" data-price="\( {s.price}"> \){s.name}<br><small>${s.price} ₺</small></div>`).join('');
    container.querySelectorAll('.option').forEach(el => el.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        calculateTotal();
    }));
}

function renderExtras() {
    const extras = [{name:'Кондиционеры',price:200},{name:'Окна',price:150},{name:'Холодильник',price:120}];
    const container = document.getElementById('extrasContainer');
    container.innerHTML = extras.map(ex => `
        <label><input type="checkbox" class="extra-cb" data-price="${ex.price}"> \( {ex.name} + \){ex.price}₺</label>
    `).join('');
    container.querySelectorAll('.extra-cb').forEach(cb => cb.addEventListener('change', calculateTotal));
}

// Order
document.getElementById('orderBtn').addEventListener('click', () => {
    const address = document.getElementById('address').value.trim();
    if (!address) return showToast('Укажите адрес', 'error');

    db.ref('orders').push({
        userName: currentUser.name || "Клиент",
        phone: currentUser.phone,
        address: address,
        total: currentTotal,
        date: document.getElementById('date').value,
        status: "new",
        createdAt: Date.now()
    }).then(() => {
        showToast('Заказ оформлен! Переходим к оплате...');
        setTimeout(() => window.open(`https://papara.com?amount=${currentTotal}`, '_blank'), 800);
    });
});

// Gallery
function renderGallery() {
    const items = [
        {before: "https://picsum.photos/id/1015/600/400", after: "https://picsum.photos/id/1016/600/400"},
        {before: "https://picsum.photos/id/133/600/400", after: "https://picsum.photos/id/201/600/400"}
    ];
    document.getElementById('galleryGrid').innerHTML = items.map(i => `
        <div class="gallery-item">
            <img src="${i.before}" alt="До">
            <img src="${i.after}" alt="После">
        </div>
    `).join('');
}

// Admin
document.getElementById('adminBtn').addEventListener('click', () => {
    document.getElementById('adminModal').style.display = 'flex';
    loadAdminOrders();
});

document.getElementById('closeAdmin').addEventListener('click', () => {
    document.getElementById('adminModal').style.display = 'none';
});

function loadAdminOrders() {
    const list = document.getElementById('adminOrdersList');
    db.ref('orders').orderByChild('createdAt').limitToLast(20).on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const o = child.val();
            html += `<div class="card"><strong>${o.userName}</strong> — \( {o.total}₺<br> \){o.address}<br><button onclick="updateOrderStatus('${child.key}', 'done')">Выполнен</button></div>`;
        });
        list.innerHTML = html || '<p>Заказов нет</p>';
    });
}

window.updateOrderStatus = (key, status) => {
    db.ref('orders/'+key).update({status});
    showToast('Статус обновлён');
};

// Init
function init() {
    // districts, times, etc.
    renderServices();
    renderExtras();
    renderGallery();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;

    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        currentUser.name = document.getElementById('userName').value;
        currentUser.phone = document.getElementById('userPhone').value;
        localStorage.setItem('user', JSON.stringify(currentUser));
        showToast('Профиль сохранён');
    });

    console.log('%cSupTemiz v3.0 Максимальная версия загружена 🚀', 'color:#22c55e;font-size:16px');
}

window.onload = init;
