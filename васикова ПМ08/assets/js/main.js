// ===== Хранилище =====
let applications = JSON.parse(localStorage.getItem('applications')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// ============================================================
// 1. РЕГИСТРАЦИЯ
// ============================================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value.trim();
        const fullname = document.getElementById('fullname').value.trim();
        const birthdate = document.getElementById('birthdate').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        let valid = true;
        document.querySelectorAll('.error-hint').forEach(el => el.textContent = '');

        if (!/^[A-Za-z0-9]{6,}$/.test(login)) {
            document.getElementById('loginError').textContent = 'Логин: только латиница и цифры, мин. 6 симв.';
            valid = false;
        } else if (users.find(u => u.login === login)) {
            document.getElementById('loginError').textContent = 'Этот логин уже занят';
            valid = false;
        }

        if (password.length < 8) {
            document.getElementById('passwordError').textContent = 'Пароль должен быть не менее 8 символов';
            valid = false;
        }

        if (!fullname) {
            document.getElementById('fullnameError').textContent = 'Укажите ФИО';
            valid = false;
        }

        if (!birthdate) {
            document.getElementById('birthdateError').textContent = 'Укажите дату рождения';
            valid = false;
        }

        if (!phone) {
            document.getElementById('phoneError').textContent = 'Укажите телефон';
            valid = false;
        }

        if (!email || !email.includes('@')) {
            document.getElementById('emailError').textContent = 'Введите корректный E-mail';
            valid = false;
        }

        if (valid) {
            const newUser = { login, password, fullname, birthdate, phone, email };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            alert('Регистрация успешна! Теперь войдите.');
            window.location.href = 'login.html';
        }
    });
}

// ============================================================
// 2. ВХОД
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const login = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('passwordUser').value.trim();

        document.getElementById('loginUserError').textContent = '';
        document.getElementById('passwordUserError').textContent = '';

        const user = users.find(u => u.login === login && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('loginUserError').textContent = 'Неверный логин или пароль';
            document.getElementById('passwordUserError').textContent = 'Попробуйте снова';
        }
    });
}

// ============================================================
// 3. ВЫХОД
// ============================================================
document.querySelectorAll('#logoutBtn, #logoutBtn2, #adminLogout').forEach(btn => {
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('adminAuth');
            window.location.href = 'login.html';
        });
    }
});

// ============================================================
// 4. ЗАЩИТА СТРАНИЦ
// ============================================================
if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('application.html')) {
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

// ============================================================
// 5. ЛИЧНЫЙ КАБИНЕТ — ОТОБРАЖЕНИЕ ЗАЯВОК
// ============================================================
function renderApplications() {
    const container = document.getElementById('applicationsList');
    if (!container) return;

    const userApps = applications.filter(app => app.userLogin === currentUser?.login);
    if (userApps.length === 0) {
        container.innerHTML = '<p>У вас пока нет заявок.</p>';
        return;
    }

    container.innerHTML = userApps.map((app, idx) => {
        let statusClass = 'status-new';
        if (app.status === 'Идет обучение') statusClass = 'status-learning';
        if (app.status === 'Обучение завершено') statusClass = 'status-done';
        return `<div class="application-item">
            <strong>${app.transport}</strong> — ${app.date}
            <span class="status ${statusClass}">${app.status}</span>
            ${app.review ? `<p>Отзыв: ${app.review}</p>` : ''}
        </div>`;
    }).join('');
}
renderApplications();

// ============================================================
// 6. ЛИЧНЫЙ КАБИНЕТ — ОТЗЫВ
// ============================================================
const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const text = document.getElementById('reviewText').value.trim();
        if (!text) return alert('Напишите текст отзыва');

        const userApps = applications.filter(app => app.userLogin === currentUser?.login && app.status === 'Обучение завершено');
        if (userApps.length === 0) {
            document.getElementById('reviewStatus').textContent = '❌ Вы можете оставить отзыв только для заявок со статусом "Обучение завершено"';
            return;
        }

        // прикрепим отзыв к последней завершённой заявке
        const lastDone = userApps[userApps.length - 1];
        const index = applications.findIndex(a => a.id === lastDone.id);
        if (index !== -1) {
            applications[index].review = text;
            localStorage.setItem('applications', JSON.stringify(applications));
            document.getElementById('reviewStatus').textContent = '✅ Отзыв сохранён!';
            renderApplications();
        }
    });
}

// ============================================================
// 7. СЛАЙДЕР (автопереключение каждые 3 сек, 6 изображений)
// ============================================================
function initSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    const slides = slider.querySelector('.slides');
    const slideItems = slides.querySelectorAll('.slide');
    let current = 0;
    let interval;

    function goTo(index) {
        if (index < 0) index = slideItems.length - 1;
        if (index >= slideItems.length) index = 0;
        current = index;
        slides.style.transform = `translateX(-${current * 100}%)`;
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    slider.querySelector('.next')?.addEventListener('click', () => { 
        clearInterval(interval); 
        next(); 
        startAuto(); 
    });
    slider.querySelector('.prev')?.addEventListener('click', () => { 
        clearInterval(interval); 
        prev(); 
        startAuto(); 
    });

    function startAuto() {
        interval = setInterval(next, 3000);
    }
    startAuto();
}
initSlider();

// ============================================================
// 8. ОФОРМЛЕНИЕ ЗАЯВКИ
// ============================================================
const appForm = document.getElementById('applicationForm');
if (appForm) {
    appForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const transport = document.getElementById('transportType').value;
        const date = document.getElementById('startDate').value.trim();
        const payment = document.getElementById('paymentMethod').value;

        document.getElementById('dateError').textContent = '';

        if (!transport) return alert('Выберите вид транспорта');
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
            document.getElementById('dateError').textContent = 'Введите дату в формате ДД.ММ.ГГГГ';
            return;
        }
        if (!payment) return alert('Выберите способ оплаты');

        const newApp = {
            id: Date.now(),
            userLogin: currentUser?.login || 'anonymous',
            transport,
            date,
            payment,
            status: 'Новая',
            review: ''
        };
        applications.push(newApp);
        localStorage.setItem('applications', JSON.stringify(applications));
        document.getElementById('appStatus').textContent = '✅ Заявка отправлена на согласование!';
        appForm.reset();
    });
}

// ============================================================
// 9. АДМИН-ПАНЕЛЬ
// ============================================================
const adminLogin = 'Admin26';
const adminPass = 'Demo20';

function checkAdmin() {
    const saved = sessionStorage.getItem('adminAuth');
    if (!saved && window.location.pathname.includes('admin.html')) {
        const login = prompt('Введите логин администратора:');
        const pass = prompt('Введите пароль:');
        if (login !== adminLogin || pass !== adminPass) {
            alert('Неверные данные!');
            window.location.href = 'login.html';
        } else {
            sessionStorage.setItem('adminAuth', 'true');
        }
    }
}
checkAdmin();

let currentPage = 1;
const perPage = 3;

function renderAdminTable(filter = '') {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    let filtered = applications.filter(app => 
        app.status.toLowerCase().includes(filter.toLowerCase())
    );

    const sortKey = sessionStorage.getItem('adminSortKey') || 'id';
    const sortDir = sessionStorage.getItem('adminSortDir') || 'asc';
    filtered.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        if (sortKey === 'id') { valA = Number(valA); valB = Number(valB); }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(filtered.length / perPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Нет заявок</td></tr>';
    } else {
        tbody.innerHTML = pageItems.map(app => `
            <tr>
                <td>${app.id}</td>
                <td>${app.userLogin}</td>
                <td>${app.transport}</td>
                <td>${app.date}</td>
                <td>
                    <select class="status-select" data-id="${app.id}">
                        <option value="Новая" ${app.status === 'Новая' ? 'selected' : ''}>Новая</option>
                        <option value="Идет обучение" ${app.status === 'Идет обучение' ? 'selected' : ''}>Идет обучение</option>
                        <option value="Обучение завершено" ${app.status === 'Обучение завершено' ? 'selected' : ''}>Обучение завершено</option>
                    </select>
                </td>
                <td><button class="btn btn-secondary apply-status" data-id="${app.id}">Применить</button></td>
            </tr>
        `).join('');
    }

    document.getElementById('pageInfo').textContent = `${currentPage} / ${totalPages}`;
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.disabled = false;
        if (btn.dataset.page === 'prev' && currentPage <= 1) btn.disabled = true;
        if (btn.dataset.page === 'next' && currentPage >= totalPages) btn.disabled = true;
    });

    // Обработчики смены статуса
    document.querySelectorAll('.apply-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = Number(this.dataset.id);
            const select = document.querySelector(`.status-select[data-id="${id}"]`);
            const newStatus = select.value;
            const app = applications.find(a => a.id === id);
            if (app) {
                app.status = newStatus;
                localStorage.setItem('applications', JSON.stringify(applications));
                showNotification(`Статус заявки #${id} изменён на "${newStatus}"`);
                renderAdminTable(document.getElementById('filterStatus').value);
            }
        });
    });

    // Сортировка
    document.querySelectorAll('[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const key = this.dataset.sort;
            const current = sessionStorage.getItem('adminSortKey');
            let dir = 'asc';
            if (current === key) {
                dir = sessionStorage.getItem('adminSortDir') === 'asc' ? 'desc' : 'asc';
            }
            sessionStorage.setItem('adminSortKey', key);
            sessionStorage.setItem('adminSortDir', dir);
            renderAdminTable(document.getElementById('filterStatus').value);
        });
    });
}

function showNotification(msg) {
    const el = document.getElementById('adminNotification');
    if (el) {
        el.textContent = '📢 ' + msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
}

document.getElementById('applyFilter')?.addEventListener('click', function() {
    const val = document.getElementById('filterStatus').value.trim();
    currentPage = 1;
    renderAdminTable(val);
});

document.getElementById('resetFilter')?.addEventListener('click', function() {
    document.getElementById('filterStatus').value = '';
    currentPage = 1;
    renderAdminTable('');
});

document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const filter = document.getElementById('filterStatus').value;
        const filtered = applications.filter(app => 
            app.status.toLowerCase().includes(filter.toLowerCase())
        );
        const total = Math.ceil(filtered.length / perPage) || 1;
        if (this.dataset.page === 'prev' && currentPage > 1) currentPage--;
        if (this.dataset.page === 'next' && currentPage < total) currentPage++;
        renderAdminTable(filter);
    });
});

// Инициализация админки, если мы на странице admin.html
if (window.location.pathname.includes('admin.html')) {
    renderAdminTable('');
}