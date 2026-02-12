/* ================================================
   app.js  –  main application logic
   ================================================ */

/* ---------- Toast system ---------- */
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---------- Navigation helpers ---------- */
function updateNav() {
  const session = DB.getSession();
  const authNav = document.getElementById("authNav");
  const cartCount = document.getElementById("cartCount");

  if (!authNav) return;

  if (session) {
    authNav.innerHTML =
      '<span>Hi, ' +
      escapeHtml(session.name.split(" ")[0]) +
      '</span> <a href="#" onclick="logout()">Logout</a>';
  } else {
    authNav.innerHTML =
      '<a href="login.html">Sign In</a> <a href="signup.html">Sign Up</a>';
  }

  if (cartCount) {
    const cart = DB.getCart();
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = total;
    cartCount.style.display = total > 0 ? "flex" : "none";
  }
}

function logout() {
  DB.clearSession();
  DB.clearCart();
  showToast("Logged out successfully");
  setTimeout(() => (window.location.href = "index.html"), 500);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ---------- Menu rendering ---------- */
function renderMenu(category) {
  const grid = document.getElementById("foodGrid");
  if (!grid) return;

  const items =
    category === "All"
      ? MENU
      : MENU.filter((m) => m.category === category);

  grid.innerHTML = items
    .map(
      (item) =>
        '<div class="food-card">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy">' +
        '<div class="food-card-body">' +
        "<h3>" + escapeHtml(item.name) + "</h3>" +
        '<p class="description">' + escapeHtml(item.description) + "</p>" +
        '<div class="card-footer">' +
        '<span class="price">$' + item.price.toFixed(2) + "</span>" +
        '<button class="btn btn-primary btn-sm" onclick="addToCart(' +
        item.id +
        ')">Add to Cart</button>' +
        "</div></div></div>"
    )
    .join("");
}

function initCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  if (!container) return;

  const categories = ["All", ...new Set(MENU.map((m) => m.category))];
  container.innerHTML = categories
    .map(
      (c) =>
        '<button class="category-btn' +
        (c === "All" ? " active" : "") +
        '" onclick="filterCategory(this, \'' +
        c +
        "')\">" +
        c +
        "</button>"
    )
    .join("");
}

function filterCategory(btn, category) {
  document
    .querySelectorAll(".category-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderMenu(category);
}

/* ---------- Cart ---------- */
function addToCart(itemId) {
  const session = DB.getSession();
  if (!session) {
    showToast("Please sign in to add items to cart", "error");
    setTimeout(() => (window.location.href = "login.html"), 1000);
    return;
  }

  const item = MENU.find((m) => m.id === itemId);
  if (!item) return;

  const cart = DB.getCart();
  const existing = cart.find((c) => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      qty: 1,
    });
  }
  DB.saveCart(cart);
  updateNav();
  showToast(item.name + " added to cart!");
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  if (!container) return;

  const cart = DB.getCart();

  if (cart.length === 0) {
    container.innerHTML =
      '<div class="empty-cart"><div class="icon">🛒</div>' +
      "<h3>Your cart is empty</h3>" +
      '<p>Browse our menu and add some delicious food!</p>' +
      '<a href="index.html" class="btn btn-primary mt-1">Browse Menu</a></div>';
    if (summaryEl) summaryEl.innerHTML = "";
    return;
  }

  container.innerHTML = cart
    .map(
      (item) =>
        '<div class="cart-item">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' +
        '<div class="cart-item-info">' +
        "<h4>" + escapeHtml(item.name) + "</h4>" +
        '<span class="price">$' + item.price.toFixed(2) + "</span></div>" +
        '<div class="qty-controls">' +
        '<button onclick="changeQty(' + item.id + ',-1)">−</button>' +
        "<span>" + item.qty + "</span>" +
        '<button onclick="changeQty(' + item.id + ',1)">+</button></div>' +
        '<button class="btn btn-danger btn-sm" onclick="removeFromCart(' +
        item.id +
        ')">✕</button></div>'
    )
    .join("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = 2.99;
  const total = subtotal + delivery;

  if (summaryEl) {
    summaryEl.innerHTML =
      '<div class="cart-summary">' +
      '<div class="row"><span>Subtotal</span><span>$' +
      subtotal.toFixed(2) +
      "</span></div>" +
      '<div class="row"><span>Delivery Fee</span><span>$' +
      delivery.toFixed(2) +
      "</span></div>" +
      '<div class="row total"><span>Total</span><span>$' +
      total.toFixed(2) +
      "</span></div>" +
      '<button class="btn btn-primary btn-block mt-1" onclick="openCheckout()">Proceed to Checkout</button></div>';
  }
}

function changeQty(itemId, delta) {
  const cart = DB.getCart();
  const item = cart.find((c) => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) item.qty = 1;
  DB.saveCart(cart);
  renderCart();
  updateNav();
}

function removeFromCart(itemId) {
  const cart = DB.getCart().filter((c) => c.id !== itemId);
  DB.saveCart(cart);
  renderCart();
  updateNav();
  showToast("Item removed from cart");
}

/* ---------- Checkout ---------- */
function openCheckout() {
  const session = DB.getSession();
  if (!session) {
    showToast("Please sign in first", "error");
    return;
  }
  const overlay = document.getElementById("checkoutModal");
  if (overlay) overlay.classList.add("active");
}

function closeCheckout() {
  const overlay = document.getElementById("checkoutModal");
  if (overlay) overlay.classList.remove("active");
}

function placeOrder(event) {
  event.preventDefault();
  const session = DB.getSession();
  if (!session) return;

  const cart = DB.getCart();
  if (cart.length === 0) {
    showToast("Cart is empty", "error");
    return;
  }

  const address = document.getElementById("address").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const notes = document.getElementById("notes")
    ? document.getElementById("notes").value.trim()
    : "";

  if (!address || !phone) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = 2.99;

  const order = {
    id: "ORD-" + Date.now(),
    username: session.username,
    customerName: session.name,
    items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
    subtotal: subtotal,
    deliveryFee: delivery,
    total: subtotal + delivery,
    address: address,
    phone: phone,
    notes: notes,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  DB.addOrder(order);

  /* Add admin notification */
  DB.addNotification({
    id: "NOTE-" + Date.now(),
    text:
      "New order " +
      order.id +
      " from " +
      order.customerName +
      " — $" +
      order.total.toFixed(2),
    orderId: order.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  DB.clearCart();
  closeCheckout();

  /* Show confirmation */
  const main = document.querySelector(".cart-container") || document.querySelector("main");
  if (main) {
    main.innerHTML =
      '<div class="order-confirmation">' +
      '<div class="check-icon">✅</div>' +
      "<h2>Order Placed Successfully!</h2>" +
      '<p>Thank you for your order, ' + escapeHtml(session.name) + "!</p>" +
      '<div class="order-details-box">' +
      "<p><strong>Order ID:</strong> " + order.id + "</p>" +
      "<p><strong>Total:</strong> $" + order.total.toFixed(2) + "</p>" +
      "<p><strong>Delivery to:</strong> " + escapeHtml(order.address) + "</p>" +
      "<p><strong>Status:</strong> " + order.status + "</p></div>" +
      '<a href="index.html" class="btn btn-primary mt-1">Continue Shopping</a></div>';
  }

  updateNav();
}

/* ---------- Auth ---------- */
function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!name || !username || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }
  if (password.length < 4) {
    showToast("Password must be at least 4 characters", "error");
    return;
  }
  if (password !== confirm) {
    showToast("Passwords do not match", "error");
    return;
  }
  if (DB.findUser(username)) {
    showToast("Username already taken", "error");
    return;
  }

  DB.addUser({
    username: username,
    password: password,
    name: name,
    role: "customer",
    createdAt: new Date().toISOString(),
  });

  DB.setSession({ username: username, name: name });
  showToast("Account created! Welcome, " + name + "!");
  setTimeout(() => (window.location.href = "index.html"), 800);
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const user = DB.findUser(username);
  if (!user || user.password !== password) {
    showToast("Invalid username or password", "error");
    return;
  }

  DB.setSession({ username: user.username, name: user.name });
  showToast("Welcome back, " + user.name + "!");

  if (user.role === "admin") {
    setTimeout(() => (window.location.href = "admin.html"), 800);
  } else {
    setTimeout(() => (window.location.href = "index.html"), 800);
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", function () {
  updateNav();

  if (document.getElementById("foodGrid")) {
    initCategoryFilters();
    renderMenu("All");
  }

  if (document.getElementById("cartItems")) {
    renderCart();
  }
});
