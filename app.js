// ==================== CONFIG ====================
const firebaseConfig = { /* ТВОЙ CONFIG */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentLang = 'ru';
let currentUser = { role: "client", name: "", phone: "" };

// ==================== TRANSLATIONS + UTILS ====================
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function calculateTotal() { /* как в предыдущей версии */ }

// ==================== TABS ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
    });
});

// ==================== GALLERY ====================
const galleryItems = [
    {before: "https://picsum.photos/id/1015/600/400", after: "https://picsum.photos/id/1016/600/400"},
    {before: "https://picsum.photos/id/133/600/400", after: "https://picsum.photos/id/201/600/400"},
    {before: "https://picsum.photos/id/251/600/400", after: "https://picsum.photos/id/274/600/400"}
];

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = galleryItems.map(item => `
        <div class="gallery-item">
            <img src="${item.before}" alt="До">
            <img src="${item.after}" alt="После">
        </div>
    `).join('');
}

// ==================== ADMIN PANEL ====================
function loadAdminPanel() {
    const container = document.getElementById('adminOrdersList');
    db.ref('orders').orderByChild('createdAt').limitToLast(30).on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const o = child.val();
            html += `
                <div class="card">
                    <strong>${o.userName}</strong> — ${o.total}₺<br>
                    <small>${o.address} | ${o.date}</small><br>
                    <button onclick="updateStatus('${child.key}', 'done')">✅ Выполнен</button>
                </div>`;
        });
        container.innerHTML = html || '<p>Заказов пока нет</p>';
    });
}

window.updateStatus = (key, status) => {
    db.ref('orders/' + key).update({status});
    showToast('Статус обновлён');
};

// ==================== ORDER + PAYMENT ====================
document.getElementById('orderBtn').addEventListener('click', () => {
    // ... (сбор данных как раньше)

    const orderData = { /* ... */ };

    db.ref('orders').push(orderData).then(() => {
        showToast('Заказ оформлен! Переходим к оплате...');
        setTimeout(() => {
            // Papara пример
            window.location.href = `https://www.papara.com/transfer?amount=${currentTotal}&note=SupTemiz`;
        }, 1500);
    });
});

// ==================== INIT ====================
function init() {
    renderGallery();
    loadHistory();
    loadAdminPanel();

    document.getElementById('adminBtn').addEventListener('click', () => {
        document.getElementById('adminModal').style.display = 'flex';
    });
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminModal').style.display = 'none';
    });

    console.log('%cSupTemiz v3.0 — Максимальная версия загружена', 'color:#22c55e;font-size:16px');
}

window.onload = init;
