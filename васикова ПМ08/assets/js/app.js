/* assets/js/app.js (полный) */
(function () {
  const StorageKeys = {
    USERS: "portal_users",
    CURRENT_USER: "portal_current_user",
    REQUESTS: "portal_requests",
  };
  function getUsers() {
    return JSON.parse(localStorage.getItem(StorageKeys.USERS)) || [];
  }
  function saveUsers(u) {
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(u));
  }
  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(StorageKeys.CURRENT_USER));
  }
  function setCurrentUser(u) {
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(u));
  }
  function clearCurrentUser() {
    localStorage.removeItem(StorageKeys.CURRENT_USER);
  }
  function getRequests() {
    return JSON.parse(localStorage.getItem(StorageKeys.REQUESTS)) || [];
  }
  function saveRequests(r) {
    localStorage.setItem(StorageKeys.REQUESTS, JSON.stringify(r));
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("toast--show");
    setTimeout(() => t.classList.remove("toast--show"), 2200);
  }
  function requireAuth() {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "login.html";
      return null;
    }
    return u;
  }

  // Слайдер
  const sliderTrack = document.querySelector("[data-slider-track]");
  if (sliderTrack) {
    const slides = sliderTrack.children;
    let idx = 0;
    function move(i) {
      idx = (i + slides.length) % slides.length;
      sliderTrack.style.transform = `translateX(-${idx * 100}%)`;
    }
    document
      .querySelector("[data-slider-prev]")
      ?.addEventListener("click", () => {
        move(idx - 1);
        resetAuto();
      });
    document
      .querySelector("[data-slider-next]")
      ?.addEventListener("click", () => {
        move(idx + 1);
        resetAuto();
      });
    let auto = setInterval(() => move(idx + 1), 3000);
    function resetAuto() {
      clearInterval(auto);
      auto = setInterval(() => move(idx + 1), 3000);
    }
  }

  // Регистрация
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const login = document.getElementById("regLogin").value.trim();
      const pass = document.getElementById("regPassword").value;
      const name = document.getElementById("fullName").value.trim();
      const birth = document.getElementById("birthDate").value;
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const hints = { regLogin: "", regPassword: "", fullName: "" };
      let valid = true;
      if (!/^[a-zA-Z0-9]{6,}$/.test(login)) {
        hints.regLogin = "Латинские буквы/цифры, минимум 6.";
        valid = false;
      }
      if (pass.length < 8) {
        hints.regPassword = "Минимум 8 символов.";
        valid = false;
      }
      if (!name) {
        hints.fullName = "Введите ФИО.";
        valid = false;
      }
      Object.keys(hints).forEach((k) => {
        const el = document.querySelector(`[data-hint="${k}"]`);
        if (el) {
          el.textContent = hints[k];
          el.style.display = hints[k] ? "block" : "none";
        }
      });
      if (!valid) return;
      const users = getUsers();
      if (users.some((u) => u.login === login)) {
        document.getElementById("regMessage").textContent = "Логин занят.";
        return;
      }
      users.push({
        login,
        password: pass,
        fullName: name,
        birthDate: birth,
        phone,
        email,
      });
      saveUsers(users);
      document.getElementById("regMessage").textContent =
        "Успешно! Идёт вход...";
      setTimeout(() => {
        setCurrentUser({ login, fullName: name });
        window.location.href = "dashboard.html";
      }, 1000);
    });
  }

  // Вход
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const login = document.getElementById("login").value.trim();
      const pass = document.getElementById("password").value;
      const u = getUsers().find(
        (x) => x.login === login && x.password === pass,
      );
      if (u) {
        setCurrentUser({ login: u.login, fullName: u.fullName });
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("loginMessage").textContent =
          "Неверный логин или пароль.";
        document.getElementById("loginMessage").style.color = "red";
      }
    });
  }

  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    clearCurrentUser();
    window.location.href = "login.html";
  });

  // Личный кабинет
  if (document.getElementById("userGreeting")) {
    const user = requireAuth();
    if (!user) return;
    document.getElementById("userGreeting").textContent =
      `Добро пожаловать, ${user.fullName || user.login}!`;
    renderUserRequests();
  }
  function renderUserRequests() {
    const container = document.getElementById("userRequestsContainer");
    if (!container) return;
    const user = getCurrentUser();
    const reqs = getRequests().filter((r) => r.userLogin === user.login);
    if (!reqs.length) {
      container.innerHTML = "<p>Заявок пока нет.</p>";
      toggleFeedback(false);
      return;
    }
    container.innerHTML = reqs
      .map(
        (r) =>
          `<div class="request-item"><div><strong>${r.transport}</strong> с ${r.startDate}</div><span class="status-badge status-${r.status.replace(/\s/g, ".")}">${r.status}</span></div>`,
      )
      .join("");
    toggleFeedback(reqs.some((r) => r.status === "Обучение завершено"));
  }
  function toggleFeedback(allow) {
    const form = document.getElementById("feedbackForm");
    const msg = document.getElementById("feedbackLockMessage");
    if (allow) {
      form.style.display = "block";
      msg.textContent = "";
    } else {
      form.style.display = "none";
      msg.textContent = "Отзыв доступен после завершения обучения.";
    }
  }
  document
    .getElementById("feedbackForm")
    ?.addEventListener("submit", function (e) {
      e.preventDefault();
      document.getElementById("feedbackMessage").textContent =
        "Спасибо за отзыв!";
      this.reset();
    });

  // Заявка (дата ДД.ММ.ГГГГ)
  const reqForm = document.getElementById("requestForm");
  if (reqForm) {
    reqForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const user = requireAuth();
      if (!user) return;
      const transport = document.getElementById("transportType").value;
      const dateRaw = document.getElementById("startDate").value.trim();
      const payment = document.getElementById("paymentMethod").value;
      const hintEl = document.querySelector('[data-hint="startDate"]');
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateRaw)) {
        hintEl.textContent = "Формат ДД.ММ.ГГГГ";
        hintEl.style.display = "block";
        return;
      } else hintEl.style.display = "none";
      const reqs = getRequests();
      reqs.push({
        id: Date.now(),
        userLogin: user.login,
        transport,
        startDate: dateRaw,
        payment,
        status: "Новая",
      });
      saveRequests(reqs);
      document.getElementById("requestMessage").textContent =
        "Заявка отправлена!";
      reqForm.reset();
      toast("Заявка отправлена администратору");
    });
  }

  // Админка
  if (document.getElementById("adminRequestsContainer")) {
    if (!localStorage.getItem("admin_logged")) {
      const l = prompt("Логин администратора:"),
        p = prompt("Пароль:");
      if (l === "Admin26" && p === "Demo20")
        localStorage.setItem("admin_logged", "1");
      else {
        alert("Неверно");
        window.location.href = "../index.html";
      }
    }
    renderAdmin();
  }
  document.getElementById("adminLogout")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("admin_logged");
    window.location.href = "../index.html";
  });

  let adminPage = 1,
    adminPerPage = 4;
  function renderAdmin() {
    const container = document.getElementById("adminRequestsContainer");
    const pagination = document.getElementById("adminPagination");
    if (!container) return;
    const search =
      document.getElementById("adminSearch")?.value.toLowerCase() || "";
    const sort = document.getElementById("adminSort")?.value;
    let reqs = getRequests();
    if (search)
      reqs = reqs.filter(
        (r) =>
          r.userLogin.toLowerCase().includes(search) ||
          r.transport.toLowerCase().includes(search),
      );
    reqs.sort((a, b) => (sort === "oldest" ? a.id - b.id : b.id - a.id));
    const totalPages = Math.ceil(reqs.length / adminPerPage) || 1;
    const start = (adminPage - 1) * adminPerPage;
    const pageItems = reqs.slice(start, start + adminPerPage);
    container.innerHTML = pageItems.length
      ? pageItems
          .map(
            (r) => `<div class="request-item" data-id="${r.id}">
      <div><strong>${r.userLogin}</strong> – ${r.transport} (${r.startDate})</div>
      <select class="admin-select status-select"><option value="Новая" ${r.status === "Новая" ? "selected" : ""}>Новая</option><option value="Идет обучение" ${r.status === "Идет обучение" ? "selected" : ""}>Идет обучение</option><option value="Обучение завершено" ${r.status === "Обучение завершено" ? "selected" : ""}>Обучение завершено</option></select>
    </div>`,
          )
          .join("")
      : "<p>Нет заявок.</p>";
    pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === adminPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        adminPage = i;
        renderAdmin();
      });
      pagination.appendChild(btn);
    }
    document.querySelectorAll(".status-select").forEach((s) => {
      s.addEventListener("change", function (e) {
        const id = Number(this.closest(".request-item").dataset.id);
        const all = getRequests().map((r) =>
          r.id === id ? { ...r, status: this.value } : r,
        );
        saveRequests(all);
        toast(`Статус изменён на «${this.value}»`);
        renderAdmin();
      });
    });
  }
  document.getElementById("adminSearch")?.addEventListener("input", () => {
    adminPage = 1;
    renderAdmin();
  });
  document.getElementById("adminSort")?.addEventListener("change", () => {
    adminPage = 1;
    renderAdmin();
  });
})();
