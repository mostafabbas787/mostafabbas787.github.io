/* ================================================
   db.js  –  lightweight localStorage wrapper
   ================================================ */
const DB = (() => {
  function _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }
  function _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---- Users ---- */
  function getUsers() {
    return _get("fo_users") || [];
  }
  function saveUsers(users) {
    _set("fo_users", users);
  }
  function findUser(username) {
    return getUsers().find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }
  function addUser(user) {
    const users = getUsers();
    users.push(user);
    saveUsers(users);
  }

  /* ---- Session ---- */
  function setSession(user) {
    _set("fo_session", { username: user.username, name: user.name });
  }
  function getSession() {
    return _get("fo_session");
  }
  function clearSession() {
    localStorage.removeItem("fo_session");
  }

  /* ---- Orders ---- */
  function getOrders() {
    return _get("fo_orders") || [];
  }
  function addOrder(order) {
    const orders = getOrders();
    orders.push(order);
    _set("fo_orders", orders);
  }
  function updateOrder(orderId, updates) {
    const orders = getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      Object.assign(orders[idx], updates);
      _set("fo_orders", orders);
    }
  }

  /* ---- Cart ---- */
  function getCart() {
    return _get("fo_cart") || [];
  }
  function saveCart(cart) {
    _set("fo_cart", cart);
  }
  function clearCart() {
    localStorage.removeItem("fo_cart");
  }

  /* ---- Notifications (for admin) ---- */
  function getNotifications() {
    return _get("fo_notifications") || [];
  }
  function addNotification(note) {
    const notes = getNotifications();
    notes.unshift(note);
    _set("fo_notifications", notes);
  }
  function markNotificationRead(id) {
    const notes = getNotifications();
    const n = notes.find((x) => x.id === id);
    if (n) {
      n.read = true;
      _set("fo_notifications", notes);
    }
  }
  function clearNotifications() {
    _set("fo_notifications", []);
  }

  /* ---- Admin credentials (seeded on first load) ---- */
  function seedAdmin() {
    if (!findUser("admin")) {
      addUser({
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "admin",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    getUsers,
    saveUsers,
    findUser,
    addUser,
    setSession,
    getSession,
    clearSession,
    getOrders,
    addOrder,
    updateOrder,
    getCart,
    saveCart,
    clearCart,
    getNotifications,
    addNotification,
    markNotificationRead,
    clearNotifications,
    seedAdmin,
  };
})();

/* Seed admin on first load */
DB.seedAdmin();
