# 🍔 FoodExpress — Online Food Ordering App

A fully functional online food ordering application hosted on GitHub Pages, with an optional Node.js/Express backend API.

## Features

- **User Sign Up & Sign In** — No email confirmation required; instant account creation
- **Food Menu** — Browse a categorized menu with filtering by category
- **Menu Search** — Search for food items by name or description
- **Shopping Cart** — Add, remove, and update quantities of items (login required)
- **Order Placement** — Checkout with delivery address and validated phone number
- **Order History** — Customers can view their past orders and track status
- **Contact Page** — Restaurant info and contact form
- **Admin Panel** — View all orders, manage order statuses, see notifications, and monitor users
- **Notifications** — Admin receives real-time notifications for every new order
- **Responsive Design** — Works on desktop, tablet, and mobile with hamburger menu
- **Backend API** — Optional Node.js/Express server with hashed passwords and REST API

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Home / Menu | `index.html` | Browse food menu, search, and add items to cart |
| Sign Up | `signup.html` | Create a new account |
| Sign In | `login.html` | Sign in to your account |
| Cart | `cart.html` | View cart, checkout, and place orders |
| My Orders | `orders.html` | View order history and track status |
| Contact | `contact.html` | Restaurant information and contact form |
| Admin Panel | `admin.html` | Admin dashboard with orders, users, and notifications |

## Admin Panel Credentials

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

> To access the admin panel, go to the **Sign In** page (`login.html`) and enter the credentials above. You will be redirected to the admin dashboard automatically.

## How It Works

1. **Sign Up** — Create an account with a username and password (no email needed)
2. **Browse Menu** — View food items by category (Burgers, Pizza, Salads, Sides, Drinks)
3. **Search** — Use the search bar to find specific food items
4. **Add to Cart** — Click "Add to Cart" on any item (must be signed in)
5. **Checkout** — Go to cart, enter delivery details, and place the order
6. **Track Orders** — View your order history on the "My Orders" page
7. **Admin Panel** — Log in as admin to view orders, update statuses (Pending → Preparing → Delivered), and see notifications

## Tech Stack

### Frontend
- **HTML5 / CSS3 / JavaScript** — Pure frontend, no frameworks
- **localStorage** — Used as the client-side database for users, orders, cart, and notifications
- **GitHub Pages** — Static hosting

### Backend (Optional)
- **Node.js / Express** — REST API server
- **bcryptjs** — Password hashing
- **cors** — Cross-origin resource sharing
- **uuid** — Unique identifier generation

## Running the Backend

```bash
cd backend
npm install
npm start
```

The server starts at `http://localhost:3000` and serves the frontend files along with the API.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/menu` | Get all menu items |
| GET | `/api/orders` | Get all orders (filter by `?username=`) |
| POST | `/api/orders` | Create a new order |
| PATCH | `/api/orders/:id` | Update order status |
| GET | `/api/users` | Get all non-admin users |
| GET | `/api/notifications` | Get all notifications |
| PATCH | `/api/notifications/:id` | Mark notification as read |
| GET | `/api/stats` | Get dashboard statistics |

### Running Tests

```bash
cd backend
npm test
```

## Data Storage

### Frontend (GitHub Pages)
All data is stored in the browser's `localStorage`. This means:
- Data persists across page refreshes within the same browser
- Each browser/device has its own independent data
- Clearing browser data will reset all accounts and orders

### Backend
Data is stored in-memory while the server is running. For production use, replace with a database like MongoDB or PostgreSQL.

## ⚠️ Security Notice

This is a **demo/prototype** application. It has the following limitations that make it unsuitable for production use:

- **Frontend-only mode:** Passwords are stored in plain text in `localStorage`
- **Backend mode:** Passwords are properly hashed with bcrypt
- **No server-side validation in frontend mode** — all logic runs in the browser
- **Admin credentials are public** — the default admin account is documented in this README for demo purposes

For a production food ordering application, use a proper backend with secure authentication, encrypted storage, and server-side order processing.