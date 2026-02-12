# 🍔 FoodExpress — Online Food Ordering App

A fully functional online food ordering application hosted on GitHub Pages.

## Features

- **User Sign Up & Sign In** — No email confirmation required; instant account creation
- **Food Menu** — Browse a categorized menu with filtering by category
- **Shopping Cart** — Add, remove, and update quantities of items
- **Order Placement** — Checkout with delivery address and phone number
- **Admin Panel** — View all orders, manage order statuses, see notifications, and monitor users
- **Notifications** — Admin receives real-time notifications for every new order
- **Responsive Design** — Works on desktop, tablet, and mobile

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Home / Menu | `index.html` | Browse food menu and add items to cart |
| Sign Up | `signup.html` | Create a new account |
| Sign In | `login.html` | Sign in to your account |
| Cart | `cart.html` | View cart, checkout, and place orders |
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
3. **Add to Cart** — Click "Add to Cart" on any item (must be signed in)
4. **Checkout** — Go to cart, enter delivery details, and place the order
5. **Admin Panel** — Log in as admin to view orders, update statuses (Pending → Preparing → Delivered), and see notifications

## Tech Stack

- **HTML5 / CSS3 / JavaScript** — Pure frontend, no frameworks
- **localStorage** — Used as the client-side database for users, orders, cart, and notifications
- **GitHub Pages** — Static hosting

## Data Storage

All data is stored in the browser's `localStorage`. This means:
- Data persists across page refreshes within the same browser
- Each browser/device has its own independent data
- Clearing browser data will reset all accounts and orders