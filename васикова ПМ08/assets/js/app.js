(function() {
  // Единое хранилище в localStorage
  const StorageKeys = {
    USERS: 'portal_users',
    CURRENT_USER: 'portal_current_user',
    REQUESTS: 'portal_requests',
    ADMIN_AUTH: 'admin_authenticated'
  };

  // Инициализация тестового администратора, если нужно
  if (!localStorage.getItem(StorageKeys.ADMIN_AUTH)) {
    localStorage.setItem(StorageKeys.ADMIN_AUTH, JSON.stringify(false));
  }

  // Вспомогательные функции
  function getUsers() {
    return JSON.parse(localStorage.getItem(StorageKeys.USERS)) || [];
  }
  function saveUsers(users) {
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
  }
  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(StorageKeys.CURRENT_USER));
  }
  function setCurrentUser(user) {
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
  }
  function clearCurrentUser() {
    localStorage.removeItem(StorageKeys.CURRENT_USER);
  }
  function getRequests() {
    return JSON.parse(localStorage.getItem(StorageKeys.REQUESTS)) || [];
  }
  function saveRequests(requests) {
    localStorage.setItem(StorageKeys.REQUESTS, JSON.stringify(requests));
  }

  // Проверка авторизации и редирект
  function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  // Регистрация
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const login = document.getElementById('regLogin').value.trim();
      const password = document.getElementById('regPassword').value;
      const fullName = document.getElementById('fullName').value.trim();
      const birthDate = document.getElementById('birthDate').value;
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const msg = document.getElementById('regMessage');

      if (!/^[a-zA-Z0-9]{6,}$/.test(login)) {
        msg.textContent = 'Логин: латинские буквы/цифры, минимум 6 символов.';
        msg.style.color = 'red';
        return;
      }
      if (password.length < 8) {
        msg.textContent = 'Пароль должен быть не менее 8 символов.';
        msg.style.color = 'red';
        return;
      }
      const users = getUsers();
      if (users.some(u => u.login === login)) {
        msg.textContent = 'Логин уже занят. Выберите другой.';
        msg.style.color = 'red';
        return;
      }
      users.push({ login, password, fullName, birthDate, phone, email });
      saveUsers(users);
      msg.textContent = 'Регистрация успешна! Перенаправление...';
      msg.style.color = 'green';
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });
  }

  // Вход
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const login = document.getElementById('login').value.trim();
      const password = document.getElementById('password').value;
      const msg = document.getElementById('loginMessage');

      const users = getUsers();
      const user = users.find(u => u.login === login && u.password === password);
      if (user) {
        setCurrentUser({ login: user.login, fullName: user.fullName });
        window.location.href = 'dashboard.html';
      } else {
        msg.textContent = 'Неверный логин или пароль.';
        msg.style.color = 'red';
      }
    });
  }

  // Выход пользователя
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearCurrentUser();
      window.location.href = 'login.html';
    });
  }

  // Личный кабинет: приветствие и заявки
  const userGreeting = document.getElementById('userGreeting');
  if (userGreeting) {
    const user = requireAuth();
    if (user) {
      userGreeting.textContent = `Добро пожаловать, ${user.fullName || user.login}!`;
      renderUserRequests();
    }
  }

  function renderUserRequests() {
    const container = document.getElementById('userRequestsContainer');
    if (!container) return;
    const user = getCurrentUser();
    const allRequests = getRequests();
    const userReqs = allRequests.filter(r => r.userLogin === user.login);
    if (userReqs.length === 0) {
      container.innerHTML = '<p>Заявок пока нет.</p>';
      return;
    }
    container.innerHTML = userReqs.map(req => `
      <div class="request-item">
        <div><strong>${req.transport}</strong> с ${req.startDate}</div>
        <div>Оплата: ${req.payment}</div>
        <span class="status-badge status-${req.status.replace(/\s/g, '.')}">${req.status}</span>
      </div>
    `).join('');
  }

  // Отправка отзыва
  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const text = document.getElementById('feedbackText').value.trim();
      const msg = document.getElementById('feedbackMessage');
      if (!text) {
        msg.textContent = 'Введите текст отзыва.';
        return;
      }
      msg.textContent = 'Спасибо за отзыв!';
      msg.style.color = 'green';
      feedbackForm.reset();
    });
  }

  // Оформление заявки
  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    requestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const user = requireAuth();
      if (!user) return;
      const transport = document.getElementById('transportType').value;
      const startDate = document.getElementById('startDate').value;
      const payment = document.getElementById('paymentMethod').value;
      const msg = document.getElementById('requestMessage');
      if (!transport || !startDate || !payment) {
        msg.textContent = 'Заполните все поля.';
        msg.style.color = 'red';
        return;
      }
      const requests = getRequests();
      requests.push({
        id: Date.now(),
        userLogin: user.login,
        transport,
        startDate,
        payment,
        status: 'Новая'
      });
      saveRequests(requests);
      msg.textContent = 'Заявка отправлена!';
      msg.style.color = 'green';
      requestForm.reset();
    });
  }

  // Администраторская панель (доступ по логину Admin26 / Demo20)
  const adminContainer = document.getElementById('adminRequestsContainer');
  if (adminContainer) {
    if (!localStorage.getItem('admin_logged')) {
      const login = prompt('Вход для администратора. Логин:');
      const pass = prompt('Пароль:');
      if (login === 'Admin26' && pass === 'Demo20') {
        localStorage.setItem('admin_logged', '1');
      } else {
        alert('Неверные данные администратора.');
        window.location.href = '../index.html';
        return;
      }
    }
    renderAdminPanel();
  }

  const adminLogout = document.getElementById('adminLogout');
  if (adminLogout) {
    adminLogout.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('admin_logged');
      window.location.href = '../index.html';
    });
  }

  function renderAdminPanel() {
    const container = document.getElementById('adminRequestsContainer');
    if (!container) return;
    const requests = getRequests();
    if (requests.length === 0) {
      container.innerHTML = '<p>Нет заявок.</p>';
      return;
    }
    container.innerHTML = requests.map(req => `
      <div class="request-item" data-id="${req.id}">
        <div><strong>${req.userLogin}</strong> – ${req.transport} (${req.startDate})</div>
        <div>Оплата: ${req.payment}</div>
        <select class="admin-select status-select">
          <option value="Новая" ${req.status === 'Новая' ? 'selected' : ''}>Новая</option>
          <option value="Идет обучение" ${req.status === 'Идет обучение' ? 'selected' : ''}>Идет обучение</option>
          <option value="Обучение завершено" ${req.status === 'Обучение завершено' ? 'selected' : ''}>Обучение завершено</option>
        </select>
      </div>
    `).join('');

    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', function(e) {
        const item = this.closest('.request-item');
        const id = Number(item.dataset.id);
        const newStatus = this.value;
        const allRequests = getRequests();
        const updated = allRequests.map(r => r.id === id ? { ...r, status: newStatus } : r);
        saveRequests(updated);
      });
    });
  }
})();