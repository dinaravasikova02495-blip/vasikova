/**
 * ====================================================
 * ЕДИНЫЙ JS-ФАЙЛ ДЛЯ ВСЕХ СТРАНИЦ "Пассажирам.РФ"
 * ====================================================
 */

// ===== КОНСТАНТЫ ХРАНИЛИЩА =====
const STORAGE = {
    USERS: 'passazhiry_users',
    APPLICATIONS: 'passazhiry_applications',
    REVIEWS: 'passazhiry_reviews',
    CURRENT_USER: 'passazhiry_current_user'
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]');
}

function setUsers(users) {
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
}

function getApplications() {
    return JSON.parse(localStorage.getItem(STORAGE.APPLICATIONS) || '[]');
}

function setApplications(apps) {
    localStorage.setItem(STORAGE.APPLICATIONS, JSON.stringify(apps));
}

function getCurrentUser() {
    const data = localStorage.getItem(STORAGE.CURRENT_USER);
    return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE.CURRENT_USER, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE.CURRENT_USER);
}

function getPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename || 'index.html';
}

function getBasePath() {
    const page = getPageName();
    if (page === 'index.html') {
        return '';
    }
    // Для страниц в папке pages
    return '../../';
}

function getAssetPath(relativePath) {
    const page = getPageName();
    if (page === 'index.html') {
        return relativePath;
    }
    // Для страниц в папке pages
    return '../' + relativePath;
}

// ===== ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩА =====
function initStorage() {
    if (!localStorage.getItem(STORAGE.USERS)) {
        const admins = [{
            login: 'Admin26',
            password: 'Demo20',
            fullName: 'Администратор',
            birthDate: '2000-01-01',
            phone: '+7 (999) 000-00-00',
            email: 'admin@passazhiry.ru',
            isAdmin: true
        }];
        localStorage.setItem(STORAGE.USERS, JSON.stringify(admins));
    }
    if (!localStorage.getItem(STORAGE.APPLICATIONS)) {
        localStorage.setItem(STORAGE.APPLICATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE.REVIEWS)) {
        localStorage.setItem(STORAGE.REVIEWS, JSON.stringify([]));
    }
}

// ===== ПРОВЕРКА АВТОРИЗАЦИИ =====
function checkAuth() {
    const page = getPageName();
    const protectedPages = ['dashboard.html', 'application.html', 'admin.html'];
    if (protectedPages.includes(page)) {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = '../../index.html';
            return false;
        }
        if (page === 'admin.html' && !user.isAdmin) {
            window.location.href = '../../index.html';
            return false;
        }
        return user;
    }
    return null;
}

// ====================================================
// МОДУЛЬ 1: РЕГИСТРАЦИЯ И ВХОД
// ====================================================

function initAuth() {
    const page = getPageName();

    // --- Регистрация ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const login = document.getElementById('regLogin').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const fullName = document.getElementById('fullName').value.trim();
            const birthDate = document.getElementById('birthDate').value;
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();

            const loginError = document.getElementById('loginError');
            const passwordError = document.getElementById('passwordError');
            loginError.textContent = '';
            passwordError.textContent = '';

            let valid = true;

            const loginRegex = /^[a-zA-Z0-9]{6,}$/;
            if (!loginRegex.test(login)) {
                loginError.textContent = 'Логин должен содержать минимум 6 символов (латиница и цифры)';
                valid = false;
            } else {
                const users = getUsers();
                if (users.some(u => u.login === login)) {
                    loginError.textContent = 'Пользователь с таким логином уже существует';
                    valid = false;
                }
            }

            if (password.length < 8) {
                passwordError.textContent = 'Пароль должен содержать минимум 8 символов';
                valid = false;
            }

            if (!valid) return;

            const users = getUsers();
            users.push({
                login,
                password,
                fullName,
                birthDate,
                phone,
                email,
                isAdmin: false
            });
            setUsers(users);

            setCurrentUser({ login, fullName });
            window.location.href = '../../index.html';
        });
    }

    // --- Вход ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const login = document.getElementById('login').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorDiv = document.getElementById('loginError');

            const users = getUsers();
            const user = users.find(u => u.login === login && u.password === password);

            if (!user) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Неверный логин или пароль';
                return;
            }

            errorDiv.style.display = 'none';
            setCurrentUser({ login: user.login, fullName: user.fullName, isAdmin: user.isAdmin || false });

            if (user.isAdmin) {
                window.location.href = 'assets/pages/admin.html';
            } else {
                window.location.href = 'assets/pages/dashboard.html';
            }
        });
    }

    // --- Выход ---
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnApp, #adminLogout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCurrentUser();
            window.location.href = '../../index.html';
        });
    });

    // --- Отображение имени пользователя ---
    const user = checkAuth();
    if (user) {
        const nameEls = document.querySelectorAll('#userName, #userNameApp');
        nameEls.forEach(el => {
            if (el) el.textContent = user.fullName || user.login;
        });
    }
}

// ====================================================
// МОДУЛЬ 2: СЛАЙДЕР
// ====================================================

function initSlider() {
    const track = document.getElementById('sliderTrack');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const dotsContainer = document.getElementById('sliderDots');

    if (!track) return;

    const slides = track.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoInterval = null;

    function createDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.dataset.index = i;
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', function() {
                goToSlide(parseInt(this.dataset.index));
            });
            dotsContainer.appendChild(dot);
        }
    }

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        track.style.transform = 'translateX(-' + currentIndex * 100 + '%)';

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('span');
            dots.forEach(function(dot, i) {
                if (i === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startAutoSlide() {
        if (autoInterval) clearInterval(autoInterval);
        autoInterval = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            stopAutoSlide();
            setTimeout(startAutoSlide, 5000);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            stopAutoSlide();
            setTimeout(startAutoSlide, 5000);
        });
    }

    const container = track.closest('.slider-container');
    if (container) {
        container.addEventListener('mouseenter', stopAutoSlide);
        container.addEventListener('mouseleave', startAutoSlide);
    }

    createDots();
    goToSlide(0);
    startAutoSlide();
}

// ====================================================
// МОДУЛЬ 3: ЛИЧНЫЙ КАБИНЕТ
// ====================================================

function initDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    // --- Рендер заявок ---
    function renderApplications() {
        const apps = getApplications();
        const userApps = apps.filter(function(a) { return a.userLogin === user.login; });
        const container = document.getElementById('applicationsList');

        if (!container) return;

        if (userApps.length === 0) {
            container.innerHTML = '<p class="empty-msg">У вас пока нет заявок.</p>';
            return;
        }

        var html = '<ul style="list-style:none;padding:0;">';
        userApps.forEach(function(app) {
            var statusColors = {
                'Новая': '#ffc107',
                'Идет обучение': '#007bff',
                'Обучение завершено': '#28a745'
            };
            var color = statusColors[app.status] || '#6c757d';
            html += '<li style="background:#f8f9fa;padding:12px 16px;border-radius:6px;margin-bottom:8px;border-left:4px solid ' + color + ';">';
            html += '<strong>' + app.transport + '</strong> — ' + app.startDate + '<br>';
            html += '<span style="font-size:14px;color:#6c757d;">Оплата: ' + app.payment + ' | Статус: <span style="color:' + color + ';font-weight:700;">' + app.status + '</span></span>';
            if (app.review) {
                html += '<br><span style="font-size:14px;color:#0d47a1;">⭐ Отзыв: "' + app.review + '"</span>';
            }
            html += '</li>';
        });
        html += '</ul>';
        container.innerHTML = html;
    }

    // --- Обновление списка заявок для отзыва ---
    function updateReviewSelect() {
        var apps = getApplications();
        var userApps = apps.filter(function(a) { return a.userLogin === user.login && a.status === 'Обучение завершено'; });
        var select = document.getElementById('reviewSelect');
        if (!select) return;

        var currentValue = select.value;
        select.innerHTML = '<option value="">— выберите —</option>';
        userApps.forEach(function(app, idx) {
            var option = document.createElement('option');
            option.value = idx;
            option.textContent = app.transport + ' — ' + app.startDate;
            select.appendChild(option);
        });
        if (currentValue && select.querySelector('option[value="' + currentValue + '"]')) {
            select.value = currentValue;
        }
    }

    renderApplications();
    updateReviewSelect();

    // --- Отправка отзыва ---
    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var select = document.getElementById('reviewSelect');
            var text = document.getElementById('reviewText').value.trim();
            var index = parseInt(select.value);

            if (isNaN(index) || index < 0) {
                alert('Пожалуйста, выберите заявку.');
                return;
            }
            if (!text) {
                alert('Напишите текст отзыва.');
                return;
            }

            var apps = getApplications();
            var completedApps = apps.filter(function(a) { return a.userLogin === user.login && a.status === 'Обучение завершено'; });
            if (index >= completedApps.length) {
                alert('Ошибка: заявка не найдена.');
                return;
            }
            var targetApp = completedApps[index];
            var originalIndex = apps.findIndex(function(a) { return a.id === targetApp.id; });
            if (originalIndex !== -1) {
                apps[originalIndex].review = text;
                setApplications(apps);
            }

            var msg = document.getElementById('reviewMessage');
            if (msg) {
                msg.style.display = 'block';
                setTimeout(function() { msg.style.display = 'none'; }, 5000);
            }
            document.getElementById('reviewText').value = '';
            updateReviewSelect();
            renderApplications();
        });
    }

    // --- Обновление при изменении хранилища ---
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE.APPLICATIONS) {
            renderApplications();
            updateReviewSelect();
        }
    });
}

// ====================================================
// МОДУЛЬ 4: ОФОРМЛЕНИЕ ЗАЯВКИ
// ====================================================

function initApplication() {
    var user = getCurrentUser();
    if (!user) return;

    var form = document.getElementById('applicationForm');
    var dateInput = document.getElementById('startDate');

    if (dateInput) {
        dateInput.addEventListener('input', function(e) {
            var value = this.value.replace(/[^0-9]/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            var formatted = '';
            for (var i = 0; i < value.length; i++) {
                if (i === 2 || i === 4) formatted += '.';
                formatted += value[i];
            }
            this.value = formatted;
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var transport = document.getElementById('transportType').value;
            var startDate = document.getElementById('startDate').value.trim();
            var payment = document.getElementById('paymentMethod').value;

            var dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
            if (!dateRegex.test(startDate)) {
                alert('Введите дату в формате ДД.ММ.ГГГГ');
                return;
            }

            var parts = startDate.split('.');
            var day = parseInt(parts[0], 10);
            var month = parseInt(parts[1], 10);
            var year = parseInt(parts[2], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2024 || year > 2030) {
                alert('Пожалуйста, введите корректную дату (день 01-31, месяц 01-12, год 2024-2030)');
                return;
            }

            var apps = getApplications();
            var newApp = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                userLogin: user.login,
                transport: transport,
                startDate: startDate,
                payment: payment,
                status: 'Новая',
                review: null,
                createdAt: new Date().toISOString()
            };
            apps.push(newApp);
            setApplications(apps);

            var msg = document.getElementById('appMessage');
            if (msg) {
                msg.style.display = 'block';
                setTimeout(function() { msg.style.display = 'none'; }, 5000);
            }
            form.reset();
        });
    }
}

// ====================================================
// МОДУЛЬ 5: ПАНЕЛЬ АДМИНИСТРАТОРА
// ====================================================

function initAdmin() {
    var user = getCurrentUser();
    if (!user || !user.isAdmin) return;

    var allApplications = [];
    var filteredApplications = [];
    var currentPage = 1;
    var pageSize = 5;
    var currentFilter = 'all';
    var currentSort = 'date-asc';

    function loadApplications() {
        allApplications = getApplications();
        applyFiltersAndSort();
    }

    function applyFiltersAndSort() {
        var apps = allApplications.slice();

        if (currentFilter !== 'all') {
            apps = apps.filter(function(a) { return a.status === currentFilter; });
        }

        switch(currentSort) {
            case 'date-asc':
                apps.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
                break;
            case 'date-desc':
                apps.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
                break;
            case 'status':
                var order = { 'Новая': 1, 'Идет обучение': 2, 'Обучение завершено': 3 };
                apps.sort(function(a, b) { return order[a.status] - order[b.status]; });
                break;
            default:
                apps.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        }

        filteredApplications = apps;
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        var tbody = document.getElementById('applicationsBody');
        if (!tbody) return;

        var totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        var start = (currentPage - 1) * pageSize;
        var end = Math.min(start + pageSize, filteredApplications.length);
        var pageApps = filteredApplications.slice(start, end);

        if (pageApps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6c757d;padding:20px;">Нет заявок</td></tr>';
        } else {
            var html = '';
            pageApps.forEach(function(app, idx) {
                var users = getUsers();
                var usr = users.find(function(u) { return u.login === app.userLogin; });
                var userName = usr ? usr.fullName || usr.login : app.userLogin;

                var statusColors = {
                    'Новая': '#ffc107',
                    'Идет обучение': '#007bff',
                    'Обучение завершено': '#28a745'
                };
                var color = statusColors[app.status] || '#6c757d';

                html += '<tr>';
                html += '<td>' + (start + idx + 1) + '</td>';
                html += '<td>' + userName + '</td>';
                html += '<td>' + app.transport + '</td>';
                html += '<td>' + app.startDate + '</td>';
                html += '<td>' + app.payment + '</td>';
                html += '<td><span style="color:' + color + ';font-weight:700;">' + app.status + '</span></td>';
                html += '<td>';
                html += '<select class="status-change" data-id="' + app.id + '" style="padding:4px 8px;border-radius:4px;border:1px solid #ced4da;font-size:14px;">';
                html += '<option value="Новая" ' + (app.status === 'Новая' ? 'selected' : '') + '>Новая</option>';
                html += '<option value="Идет обучение" ' + (app.status === 'Идет обучение' ? 'selected' : '') + '>Идет обучение</option>';
                html += '<option value="Обучение завершено" ' + (app.status === 'Обучение завершено' ? 'selected' : '') + '>Обучение завершено</option>';
                html += '</select>';
                html += '</td>';
                html += '</tr>';
            });
            tbody.innerHTML = html;
        }

        var pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = 'Страница ' + currentPage + ' из ' + totalPages;
        }
        var prevBtn = document.getElementById('prevPage');
        var nextBtn = document.getElementById('nextPage');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

        var statusSelects = document.querySelectorAll('.status-change');
        statusSelects.forEach(function(select) {
            select.addEventListener('change', function() {
                var appId = this.dataset.id;
                var newStatus = this.value;
                var app = allApplications.find(function(a) { return a.id === appId; });
                if (app) {
                    app.status = newStatus;
                    setApplications(allApplications);
                    showNotification('Статус заявки изменён на "' + newStatus + '"');
                    loadApplications();
                    try {
                        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE.APPLICATIONS }));
                    } catch(e) {
                        // Fallback для старых браузеров
                    }
                }
            });
        });
    }

    function showNotification(message) {
        var notif = document.getElementById('notification');
        if (!notif) return;
        notif.textContent = message;
        notif.style.display = 'block';
        clearTimeout(notif._timeout);
        notif._timeout = setTimeout(function() {
            notif.style.display = 'none';
        }, 4000);
    }

    var filterSelect = document.getElementById('filterStatus');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentFilter = this.value;
            loadApplications();
        });
    }

    var sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            loadApplications();
        });
    }

    var prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    var nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            var totalPages = Math.ceil(filteredApplications.length / pageSize);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    loadApplications();
}

// ====================================================
// ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация хранилища
    initStorage();

    // Определение страницы
    var page = getPageName();

    // Всегда инициализируем авторизацию
    initAuth();

    // Инициализация слайдера (только на страницах, где он есть)
    if (document.getElementById('sliderTrack')) {
        initSlider();
    }

    // Инициализация модулей в зависимости от страницы
    switch(page) {
        case 'dashboard.html':
            initDashboard();
            break;
        case 'application.html':
            initApplication();
            break;
        case 'admin.html':
            initAdmin();
            break;
        case 'index.html':
            // Ничего дополнительного не нужно
            break;
        case 'register.html':
            // Ничего дополнительного не нужно
            break;
        default:
            // Для других страниц
            break;
    }

    // Проверка авторизации для защищённых страниц
    checkAuth();
});