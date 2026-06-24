(function() {
  const StorageKeys = {
    USERS: 'portal_users',
    CURRENT_USER: 'portal_current_user',
    REQUESTS: 'portal_requests'
  };

  function getUsers() { return JSON.parse(localStorage.getItem(StorageKeys.USERS)) || []; }
  function saveUsers(u) { localStorage.setItem(StorageKeys.USERS, JSON.stringify(u)); }
  function getCurrentUser() { return JSON.parse(localStorage.getItem(StorageKeys.CURRENT_USER)); }
  function setCurrentUser(u) { localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(u)); }
  function clearCurrentUser() { localStorage.removeItem(StorageKeys.CURRENT_USER); }
  function getRequests() { return JSON.parse(localStorage.getItem(StorageKeys.REQUESTS)) || []; }
  function saveRequests(r) { localStorage.setItem(StorageKeys.REQUESTS, JSON.stringify(r)); }

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('toast--show');
    setTimeout(() => t.classList.remove('toast--show'), 2200);
  }

  function requireAuth() {
    const u = getCurrentUser();
    if (!u) {
      alert('Вы не авторизованы. Сейчас перейдёте на страницу входа.');
      window.location.href = 'login.html';
      return null;
    }
    return u;
  }

  // ========== СЛАЙДЕР ==========
  const sliderTrack = document.querySelector('[data-slider-track]');
  if (sliderTrack) {
    const slides = sliderTrack.children;
    let idx = 0;
    function move(i) {
      idx = (i + slides.length) % slides.length;
      sliderTrack.style.transform = `translateX(-${idx * 100}%)`;
    }
    document.querySelector('[data-slider-prev]')?.addEventListener('click', () => { move(idx - 1); resetAuto(); });
    document.querySelector('[data-slider-next]')?.addEventListener('click', () => { move(idx + 1); resetAuto(); });
    let auto = setInterval(() => move(idx + 1), 3000);
    function resetAuto() { clearInterval(auto); auto = setInterval(() => move(idx + 1), 3000); }
  }

  // ========== РЕГИСТРАЦИЯ ==========
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const login = document.getElementById('regLogin').value.trim();
      const pass = document.getElementById('regPassword').value;
      const name = document.getElementById('fullName').value.trim();
      const birth = document.getElementById('birthDate').value;
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const msgEl = document.getElementById('regMessage');

      if (!/^[a-zA-Z0-9]{6,}$/.test(login)) {
        msgEl.textContent = 'Логин: латинские буквы/цифры, минимум 6.';
        msgEl.style.color = 'red';
        return;
      }
      if (pass.length < 8) {
        msgEl.textContent = 'Пароль: минимум 8 символов.';
        msgEl.style.color = 'red';
        return;
      }
      if (!name || !birth || !phone || !email) {
        msgEl.textContent = 'Заполните все поля.';
        msgEl.style.color = 'red';
        return;
      }

      const users = getUsers();
      if (users.some(u => u.login === login)) {
        msgEl.textContent = 'Логин уже занят.';
        msgEl.style.color = 'red';
        return;
      }

      users.push({ login, password: pass, fullName: name, birthDate: birth, phone, email });
      saveUsers(users);
      setCurrentUser({ login, fullName: name });

      msgEl.textContent = 'Регистрация успешна! Переходим в кабинет...';
      msgEl.style.color = 'green';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    });
  }

  // ========== ВХОД ==========
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const login = document.getElementById('login').value.trim();
      const pass = document.getElementById('password').value;
      const msgEl = document.getElementById('loginMessage');
      const u = getUsers().find(x => x.login === login && x.password === pass);
      if (u) {
        setCurrentUser({ login: u.login, fullName: u.fullName });
        window.location.href = 'dashboard.html';
      } else {
        msgEl.textContent = 'Неверный логин или пароль.';
        msgEl.style.color = 'red';
      }
    });
  }

  // ========== ВЫХОД ИЗ КАБИНЕТА ==========
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearCurrentUser();
      window.location.href = 'login.html';
    });
  }

  // ========== ЛИЧНЫЙ КАБИНЕТ ==========
  if (document.getElementById('userGreeting')) {
    const user = requireAuth();
    if (!user) return;
    document.getElementById('userGreeting').textContent = `Добро пожаловать, ${user.fullName || user.login}!`;
    renderUserRequests();
  }

  function renderUserRequests() {
    const container = document.getElementById('userRequestsContainer');
    if (!container) return;
    const user = getCurrentUser();
    if (!user) return;
    const reqs = getRequests().filter(r => r.userLogin === user.login);
    if (!reqs.length) {
      container.innerHTML = '<p>Заявок пока нет.</p>';
      toggleFeedback(false);
      return;
    }
    container.innerHTML = reqs.map(r =>
      `<div class="request-item">
        <div><strong>${r.transport}</strong> с ${r.startDate}</div>
        <span class="status-badge status-${r.status.replace(/\s/g, '.')}">${r.status}</span>
      </div>`
    ).join('');
    toggleFeedback(reqs.some(r => r.status === 'Обучение завершено'));
  }

  function toggleFeedback(allow) {
    const form = document.getElementById('feedbackForm');
    const msg = document.getElementById('feedbackLockMessage');
    if (!form || !msg) return;
    if (allow) {
      form.style.display = 'block';
      msg.textContent = '';
    } else {
      form.style.display = 'none';
      msg.textContent = 'Отзыв доступен после завершения обучения.';
    }
  }

  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('feedbackMessage').textContent = 'Спасибо за отзыв!';
      this.reset();
    });
  }

  // ========== ОФОРМЛЕНИЕ ЗАЯВКИ ==========
  const reqForm = document.getElementById('requestForm');
  if (reqForm) {
    reqForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const user = requireAuth();
      if (!user) return;
      const transport = document.getElementById('transportType').value;
      const dateValue = document.getElementById('startDate').value;
      const payment = document.getElementById('paymentMethod').value;
      const msgEl = document.getElementById('requestMessage');

      if (!transport || !dateValue || !payment) {
        msgEl.textContent = 'Заполните все поля.';
        msgEl.style.color = 'red';
        return;
      }

      const parts = dateValue.split('-');
      const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;

      const reqs = getRequests();
      reqs.push({
        id: Date.now(),
        userLogin: user.login,
        transport,
        startDate: formattedDate,
        payment,
        status: 'Новая'
      });
      saveRequests(reqs);

      msgEl.textContent = '✅ Заявка успешно отправлена!';
      msgEl.style.color = 'green';
      reqForm.reset();
      toast('Заявка отправлена администратору');
    });
  }

  // ========== АДМИН-ПАНЕЛЬ ==========
  let adminPage = 1;
  const adminPerPage = 4;

  const adminContainer = document.getElementById('adminRequestsContainer');
  const adminLogout = document.getElementById('adminLogout');

  // Кнопка «Выйти из админки»
  if (adminLogout) {
    adminLogout.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('admin_logged');
      window.location.href = '../index.html';
    });
  }

  // Если мы на странице админа
  if (adminContainer) {
    // Проверка авторизации админа
    if (!localStorage.getItem('admin_logged')) {
      const l = prompt('Логин администратора:');
      const p = prompt('Пароль:');
      if (l === 'Admin26' && p === 'Demo20') {
        localStorage.setItem('admin_logged', '1');
      } else {
        alert('Неверные данные администратора.');
        window.location.href = '../index.html';
        return;
      }
    }
    renderAdmin();
  }

  function renderAdmin() {
    const container = document.getElementById('adminRequestsContainer');
    const pagination = document.getElementById('adminPagination');
    if (!container) return;

    const search = document.getElementById('adminSearch')?.value.toLowerCase() || '';
    const sort = document.getElementById('adminSort')?.value;

    let reqs = getRequests();

    if (search) {
      reqs = reqs.filter(r =>
        r.userLogin.toLowerCase().includes(search) ||
        r.transport.toLowerCase().includes(search)
      );
    }

    reqs.sort((a, b) => sort === 'oldest' ? a.id - b.id : b.id - a.id);

    const totalPages = Math.ceil(reqs.length / adminPerPage) || 1;
    if (adminPage > totalPages) adminPage = totalPages;
    const start = (adminPage - 1) * adminPerPage;
    const pageItems = reqs.slice(start, start + adminPerPage);

    if (pageItems.length === 0) {
      container.innerHTML = '<p>Нет заявок.</p>';
    } else {
      container.innerHTML = pageItems.map(r =>
        `<div class="request-item" data-id="${r.id}">
          <div><strong>${r.userLogin}</strong> — ${r.transport} (${r.startDate})</div>
          <div>${r.payment}</div>
          <select class="admin-select status-select">
            <option value="Новая" ${r.status === 'Новая' ? 'selected' : ''}>Новая</option>
            <option value="Идет обучение" ${r.status === 'Идет обучение' ? 'selected' : ''}>Идет обучение</option>
            <option value="Обучение завершено" ${r.status === 'Обучение завершено' ? 'selected' : ''}>Обучение завершено</option>
          </select>
        </div>`
      ).join('');
    }

    // Пагинация
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === adminPage) btn.classList.add('active');
      btn.addEventListener('click', function() {
        adminPage = i;
        renderAdmin();
      });
      pagination.appendChild(btn);
    }

    // Смена статуса
    document.querySelectorAll('.status-select').forEach(select => {
      select.onchange = function() {
        const id = Number(this.closest('.request-item').dataset.id);
        const newStatus = this.value;
        const all = getRequests().map(r => r.id === id ? { ...r, status: newStatus } : r);
        saveRequests(all);
        toast(`Статус изменён на «${newStatus}»`);
        renderAdmin();
      };
    });
  }

  // Поиск и сортировка в админке
  document.getElementById('adminSearch')?.addEventListener('input', function() {
    adminPage = 1;
    renderAdmin();
  });

  document.getElementById('adminSort')?.addEventListener('change', function() {
    adminPage = 1;
    renderAdmin();
  });

})();