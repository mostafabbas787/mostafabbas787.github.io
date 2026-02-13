/* ================================================
   api.test.js  –  Backend API Tests (Node.js test runner)
   ================================================ */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../server");

let server;
let baseUrl;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { "Content-Type": "application/json" },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("FoodExpress API", () => {
  before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe("GET /api/menu", () => {
    it("should return the menu items", async () => {
      const res = await request("GET", "/api/menu");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length > 0);
      assert.ok(res.body[0].name);
      assert.ok(res.body[0].price);
    });
  });

  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const res = await request("POST", "/api/auth/signup", {
        username: "testuser",
        password: "test1234",
        name: "Test User",
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.username, "testuser");
      assert.equal(res.body.user.role, "customer");
      assert.ok(!res.body.user.password); // password should not be returned
    });

    it("should reject duplicate username", async () => {
      const res = await request("POST", "/api/auth/signup", {
        username: "testuser",
        password: "test1234",
        name: "Test User 2",
      });
      assert.equal(res.status, 409);
    });

    it("should reject short passwords", async () => {
      const res = await request("POST", "/api/auth/signup", {
        username: "shortpw",
        password: "ab",
        name: "Short PW",
      });
      assert.equal(res.status, 400);
    });

    it("should reject missing fields", async () => {
      const res = await request("POST", "/api/auth/signup", {
        username: "noname",
      });
      assert.equal(res.status, 400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login an existing user", async () => {
      const res = await request("POST", "/api/auth/login", {
        username: "testuser",
        password: "test1234",
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.username, "testuser");
    });

    it("should reject wrong password", async () => {
      const res = await request("POST", "/api/auth/login", {
        username: "testuser",
        password: "wrong",
      });
      assert.equal(res.status, 401);
    });

    it("should login as admin", async () => {
      const res = await request("POST", "/api/auth/login", {
        username: "admin",
        password: "admin123",
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, "admin");
    });
  });

  describe("POST /api/orders", () => {
    it("should create a new order", async () => {
      const res = await request("POST", "/api/orders", {
        username: "testuser",
        customerName: "Test User",
        items: [{ name: "Classic Burger", qty: 2, price: 8.99 }],
        address: "123 Test St",
        phone: "+1234567890",
        notes: "No onions",
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.id.startsWith("ORD-"));
      assert.equal(res.body.status, "Pending");
      assert.equal(res.body.items.length, 1);
    });

    it("should reject empty cart", async () => {
      const res = await request("POST", "/api/orders", {
        username: "testuser",
        customerName: "Test User",
        items: [],
        address: "123 Test St",
        phone: "+1234567890",
      });
      assert.equal(res.status, 400);
    });
  });

  describe("GET /api/orders", () => {
    it("should return all orders", async () => {
      const res = await request("GET", "/api/orders");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length > 0);
    });

    it("should filter orders by username", async () => {
      const res = await request("GET", "/api/orders?username=testuser");
      assert.equal(res.status, 200);
      res.body.forEach((order) => {
        assert.equal(order.username, "testuser");
      });
    });
  });

  describe("PATCH /api/orders/:orderId", () => {
    it("should update order status", async () => {
      const ordersRes = await request("GET", "/api/orders");
      const orderId = ordersRes.body[0].id;

      const res = await request("PATCH", `/api/orders/${orderId}`, {
        status: "Preparing",
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "Preparing");
    });

    it("should reject invalid status", async () => {
      const ordersRes = await request("GET", "/api/orders");
      const orderId = ordersRes.body[0].id;

      const res = await request("PATCH", `/api/orders/${orderId}`, {
        status: "InvalidStatus",
      });
      assert.equal(res.status, 400);
    });
  });

  describe("GET /api/users", () => {
    it("should return non-admin users", async () => {
      const res = await request("GET", "/api/users");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      res.body.forEach((user) => {
        assert.notEqual(user.role, "admin");
        assert.ok(!user.password);
      });
    });
  });

  describe("GET /api/stats", () => {
    it("should return dashboard stats", async () => {
      const res = await request("GET", "/api/stats");
      assert.equal(res.status, 200);
      assert.ok(typeof res.body.totalOrders === "number");
      assert.ok(typeof res.body.totalRevenue === "number");
      assert.ok(typeof res.body.totalUsers === "number");
      assert.ok(typeof res.body.pendingOrders === "number");
    });
  });

  describe("Notifications", () => {
    it("should return notifications", async () => {
      const res = await request("GET", "/api/notifications");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
    });

    it("should mark notification as read", async () => {
      const notifRes = await request("GET", "/api/notifications");
      if (notifRes.body.length > 0) {
        const noteId = notifRes.body[0].id;
        const res = await request("PATCH", `/api/notifications/${noteId}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.read, true);
      }
    });
  });
});
