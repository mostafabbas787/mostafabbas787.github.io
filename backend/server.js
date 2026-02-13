/* ================================================
   server.js  –  FoodExpress Backend API Server
   ================================================ */
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());

/* Serve static frontend files from the parent directory */
app.use(express.static(path.join(__dirname, "..")));

/* ---------- In-memory data store ---------- */
const store = {
  users: [],
  orders: [],
  notifications: [],
};

/* Seed admin account */
const adminPasswordHash = bcrypt.hashSync("admin123", 10);
store.users.push({
  id: uuidv4(),
  username: "admin",
  password: adminPasswordHash,
  name: "Administrator",
  role: "admin",
  createdAt: new Date().toISOString(),
});

/* ---------- Auth Helpers ---------- */
function findUserByUsername(username) {
  return store.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

/* ================================================
   API Routes
   ================================================ */

/* ---------- Auth ---------- */
app.post("/api/auth/signup", (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Password must be at least 4 characters" });
  }
  if (findUserByUsername(username)) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(),
    username,
    password: hash,
    name,
    role: "customer",
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);

  res.status(201).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  res.json({ user: sanitizeUser(user) });
});

/* ---------- Menu ---------- */
app.get("/api/menu", (_req, res) => {
  const MENU = require("./menu.json");
  res.json(MENU);
});

/* ---------- Orders ---------- */
app.get("/api/orders", (req, res) => {
  const { username } = req.query;
  let orders = store.orders;
  if (username) {
    orders = orders.filter((o) => o.username === username);
  }
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { username, customerName, items, address, phone, notes } = req.body;

  if (!username || !customerName || !items || !address || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = 2.99;

  const order = {
    id: "ORD-" + Date.now(),
    username,
    customerName,
    items: items.map((i) => ({
      name: String(i.name),
      qty: Number(i.qty),
      price: Number(i.price),
    })),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    address: String(address),
    phone: String(phone),
    notes: notes ? String(notes) : "",
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  store.orders.push(order);

  /* Add admin notification */
  store.notifications.unshift({
    id: "NOTE-" + Date.now(),
    text: `New order ${order.id} from ${order.customerName} — $${order.total.toFixed(2)}`,
    orderId: order.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(order);
});

app.patch("/api/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Preparing", "Delivered", "Cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const order = store.orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = status;
  res.json(order);
});

/* ---------- Users (admin) ---------- */
app.get("/api/users", (_req, res) => {
  const users = store.users
    .filter((u) => u.role !== "admin")
    .map(sanitizeUser);
  res.json(users);
});

/* ---------- Notifications (admin) ---------- */
app.get("/api/notifications", (_req, res) => {
  res.json(store.notifications);
});

app.patch("/api/notifications/:noteId", (req, res) => {
  const { noteId } = req.params;
  const note = store.notifications.find((n) => n.id === noteId);
  if (!note) {
    return res.status(404).json({ error: "Notification not found" });
  }
  note.read = true;
  res.json(note);
});

/* ---------- Dashboard stats (admin) ---------- */
app.get("/api/stats", (_req, res) => {
  const orders = store.orders;
  const users = store.users.filter((u) => u.role !== "admin");

  res.json({
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
    totalUsers: users.length,
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
  });
});

/* ---------- Start Server ---------- */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FoodExpress API server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
