/* ================================================
   admin.js  –  Admin Panel Logic
   ================================================ */

document.addEventListener("DOMContentLoaded", function () {
  /* Guard: only admin may access */
  const session = DB.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }
  const user = DB.findUser(session.username);
  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  renderDashboard();
  renderOrders();
  renderUsers();
  renderNotifications();
  updateNotificationCount();

  /* Poll for new orders every 5 seconds */
  setInterval(function () {
    renderDashboard();
    renderOrders();
    updateNotificationCount();
  }, 5000);
});

/* ---------- Sidebar navigation ---------- */
function showSection(sectionId, el) {
  document
    .querySelectorAll(".admin-section")
    .forEach(function (s) { s.classList.remove("active"); });
  document
    .querySelectorAll(".admin-sidebar nav a")
    .forEach(function (a) { a.classList.remove("active"); });

  var section = document.getElementById(sectionId);
  if (section) section.classList.add("active");
  if (el) el.classList.add("active");

  if (sectionId === "ordersSection") renderOrders();
  if (sectionId === "usersSection") renderUsers();
  if (sectionId === "dashboardSection") renderDashboard();
}

/* ---------- Dashboard stats ---------- */
function renderDashboard() {
  var orders = DB.getOrders();
  var users = DB.getUsers().filter(function (u) { return u.role !== "admin"; });

  var totalRevenue = orders.reduce(function (s, o) { return s + o.total; }, 0);
  var pendingCount = orders.filter(function (o) { return o.status === "Pending"; }).length;

  var el;
  el = document.getElementById("statOrders");
  if (el) el.textContent = orders.length;
  el = document.getElementById("statRevenue");
  if (el) el.textContent = "$" + totalRevenue.toFixed(2);
  el = document.getElementById("statUsers");
  if (el) el.textContent = users.length;
  el = document.getElementById("statPending");
  if (el) el.textContent = pendingCount;

  /* Recent orders on dashboard */
  var recentEl = document.getElementById("recentOrders");
  if (!recentEl) return;

  var recent = orders.slice().reverse().slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = '<p class="text-center" style="padding:2rem;color:#999;">No orders yet.</p>';
    return;
  }

  recentEl.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    "<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Time</th>" +
    "</tr></thead><tbody>" +
    recent
      .map(function (o) {
        return (
          "<tr><td>" + escapeHtml(o.id) +
          "</td><td>" + escapeHtml(o.customerName) +
          "</td><td>$" + o.total.toFixed(2) +
          "</td><td>" + statusBadge(o.status) +
          "</td><td>" + timeAgo(o.createdAt) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table>";
}

/* ---------- Orders table ---------- */
function renderOrders() {
  var tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  var orders = DB.getOrders().slice().reverse();

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#999;">No orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map(function (o) {
      return (
        "<tr>" +
        "<td>" + escapeHtml(o.id) + "</td>" +
        "<td>" + escapeHtml(o.customerName) + "</td>" +
        "<td>" +
        o.items
          .map(function (i) { return escapeHtml(i.name) + " x" + i.qty; })
          .join(", ") +
        "</td>" +
        "<td>$" + o.total.toFixed(2) + "</td>" +
        "<td>" + statusBadge(o.status) + "</td>" +
        "<td>" + timeAgo(o.createdAt) + "</td>" +
        "<td>" + orderActions(o) + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function orderActions(order) {
  if (order.status === "Delivered" || order.status === "Cancelled") {
    return '<button class="btn btn-sm btn-secondary" onclick="viewOrder(\'' + order.id + '\')">View</button>';
  }

  var nextStatus = "";
  var btnClass = "";
  if (order.status === "Pending") {
    nextStatus = "Preparing";
    btnClass = "btn-primary";
  } else if (order.status === "Preparing") {
    nextStatus = "Delivered";
    btnClass = "btn-success";
  }

  return (
    '<button class="btn btn-sm ' + btnClass + '" onclick="updateOrderStatus(\'' +
    order.id + "','" + nextStatus +
    "')\">" + nextStatus + "</button> " +
    '<button class="btn btn-sm btn-danger" onclick="updateOrderStatus(\'' +
    order.id +
    "','Cancelled')\">Cancel</button> " +
    '<button class="btn btn-sm btn-secondary" onclick="viewOrder(\'' +
    order.id +
    '\')">View</button>'
  );
}

function updateOrderStatus(orderId, newStatus) {
  DB.updateOrder(orderId, { status: newStatus });
  renderOrders();
  renderDashboard();
  showToast("Order " + orderId + " updated to " + newStatus);
}

function viewOrder(orderId) {
  var orders = DB.getOrders();
  var order = orders.find(function (o) { return o.id === orderId; });
  if (!order) return;

  var modal = document.getElementById("orderDetailModal");
  var content = document.getElementById("orderDetailContent");
  if (!modal || !content) return;

  content.innerHTML =
    "<h3>Order " + escapeHtml(order.id) + "</h3>" +
    '<div class="order-details-box">' +
    "<p><strong>Customer:</strong> " + escapeHtml(order.customerName) + "</p>" +
    "<p><strong>Phone:</strong> " + escapeHtml(order.phone) + "</p>" +
    "<p><strong>Address:</strong> " + escapeHtml(order.address) + "</p>" +
    (order.notes ? "<p><strong>Notes:</strong> " + escapeHtml(order.notes) + "</p>" : "") +
    "<p><strong>Status:</strong> " + statusBadge(order.status) + "</p>" +
    "<p><strong>Ordered:</strong> " + new Date(order.createdAt).toLocaleString() + "</p>" +
    "<hr style='margin:.75rem 0'>" +
    '<ul class="order-items-list">' +
    order.items
      .map(function (i) {
        return (
          "<li><span>" + escapeHtml(i.name) + " x" + i.qty +
          "</span><span>$" + (i.price * i.qty).toFixed(2) + "</span></li>"
        );
      })
      .join("") +
    "</ul>" +
    "<hr style='margin:.75rem 0'>" +
    '<div class="row" style="display:flex;justify-content:space-between"><span>Subtotal</span><span>$' +
    order.subtotal.toFixed(2) + "</span></div>" +
    '<div class="row" style="display:flex;justify-content:space-between"><span>Delivery</span><span>$' +
    order.deliveryFee.toFixed(2) + "</span></div>" +
    '<div class="row total" style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;border-top:2px solid #dee2e6;padding-top:.5rem;margin-top:.5rem"><span>Total</span><span>$' +
    order.total.toFixed(2) + "</span></div></div>";

  modal.classList.add("active");
}

function closeOrderDetail() {
  var modal = document.getElementById("orderDetailModal");
  if (modal) modal.classList.remove("active");
}

/* ---------- Users table ---------- */
function renderUsers() {
  var tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  var users = DB.getUsers().filter(function (u) { return u.role !== "admin"; });

  if (users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#999;">No registered users.</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map(function (u) {
      var userOrders = DB.getOrders().filter(function (o) { return o.username === u.username; });
      return (
        "<tr><td>" + escapeHtml(u.name) +
        "</td><td>" + escapeHtml(u.username) +
        "</td><td>" + userOrders.length +
        "</td><td>" + new Date(u.createdAt).toLocaleDateString() +
        "</td></tr>"
      );
    })
    .join("");
}

/* ---------- Notifications ---------- */
function renderNotifications() {
  var container = document.getElementById("notificationList");
  if (!container) return;

  var notes = DB.getNotifications();
  if (notes.length === 0) {
    container.innerHTML =
      '<div class="note-item" style="text-align:center;color:#999;">No notifications</div>';
    return;
  }

  container.innerHTML = notes
    .slice(0, 20)
    .map(function (n) {
      return (
        '<div class="note-item' +
        (n.read ? "" : " unread") +
        '" onclick="onNotificationClick(\'' + n.id + "','" + (n.orderId || "") + "')\">" +
        '<div class="note-text">' + escapeHtml(n.text) + "</div>" +
        '<div class="note-time">' + timeAgo(n.createdAt) + "</div></div>"
      );
    })
    .join("");
}

function updateNotificationCount() {
  var el = document.getElementById("notifCount");
  if (!el) return;
  var unread = DB.getNotifications().filter(function (n) { return !n.read; }).length;
  el.textContent = unread;
  el.style.display = unread > 0 ? "flex" : "none";
}

function toggleNotifications() {
  var dd = document.getElementById("notificationDropdown");
  if (!dd) return;
  dd.classList.toggle("show");
  renderNotifications();
}

function onNotificationClick(noteId, orderId) {
  DB.markNotificationRead(noteId);
  updateNotificationCount();
  renderNotifications();
  if (orderId) viewOrder(orderId);
}

function adminLogout() {
  DB.clearSession();
  window.location.href = "login.html";
}

/* ---------- Helpers ---------- */
function statusBadge(status) {
  var cls = "badge-pending";
  if (status === "Preparing") cls = "badge-preparing";
  else if (status === "Delivered") cls = "badge-delivered";
  else if (status === "Cancelled") cls = "badge-cancelled";
  return '<span class="badge ' + cls + '">' + status + "</span>";
}

function timeAgo(dateStr) {
  var diff = Date.now() - new Date(dateStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  var days = Math.floor(hrs / 24);
  return days + "d ago";
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showToast(message, type) {
  type = type || "success";
  var container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}
