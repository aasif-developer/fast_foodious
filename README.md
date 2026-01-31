# 🍔 Fast & Foodious – Realtime Canteen Ordering System

Fast & Foodious is a realtime, token-based canteen ordering web application that allows students to place food orders and staff to manage them live without page refreshes.

---

## 🚀 Live Demo
🔗 https://fastfoodius-81742.web.app

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap  
- **Backend:** Firebase Realtime Database  
- **Hosting:** Firebase Hosting  
- **Other Tools:** html2canvas (bill screenshot)

---

## ✨ Features & Logic Overview

### 1️⃣ Landing Page (Home)
**Feature:**  
Shows app branding and entry point to ordering.

**Logic:**  
Firebase Hosting loads `index.html` by default as the homepage.

---

### 2️⃣ Student Ordering Page
**Feature:**  
Students can browse food items and select quantities.

**Logic:**  
`+ / -` buttons update quantity inputs using JavaScript event listeners.

---

### 3️⃣ Category Tabs (Snacks / Juices / Lunch)
**Feature:**  
Switch between food categories without page reload.

**Logic:**  
Bootstrap tab components show/hide sections dynamically.

---

### 4️⃣ Generate Bill
**Feature:**  
Creates a bill summary for selected items.

**Logic:**  
JavaScript loops through all menu items, calculates `price × quantity`, and builds the bill dynamically.

---

### 5️⃣ Bill Modal
**Feature:**  
Displays selected items, total amount, and confirmation options.

**Logic:**  
Bootstrap modal is triggered programmatically after validation.

---

### 6️⃣ Screenshot Bill
**Feature:**  
Users can download a screenshot of the bill.

**Logic:**  
`html2canvas` converts the modal DOM into an image and downloads it.

---

### 7️⃣ Confirm Order
**Feature:**  
Finalizes and submits the order.

**Logic:**  
Order details are sent to Firebase Realtime Database.

---

### 8️⃣ Atomic Token System
**Feature:**  
Every order receives a unique, increasing token number.

**Logic:**  
Firebase `runTransaction()` safely increments a `nextToken` counter.

---

### 9️⃣ Realtime Order Storage
**Feature:**  
Stores items, total, time, token, and status.

**Logic:**  
Orders are pushed into `/orders` using Firebase `push()`.

---

### 🔟 Order Status Tracking
**Feature:**  
Tracks order status: Pending → Prepared → Served.

**Logic:**  
Staff updates modify the `status` field in Firebase.

---

### 1️⃣1️⃣ My Orders (Student)
**Feature:**  
Students can see only their own orders.

**Logic:**  
Order tokens are saved in `sessionStorage` and matched with Firebase data.

---

### 1️⃣2️⃣ Session-Based Memory
**Feature:**  
Orders persist during the browser session.

**Logic:**  
Tokens are stored using `sessionStorage` (no authentication required).

---

### 1️⃣3️⃣ Staff Dashboard
**Feature:**  
Staff can view and manage orders live.

**Logic:**  
Realtime listeners (`onValue`) fetch orders from Firebase.

---

### 1️⃣4️⃣ Prepare Order
**Feature:**  
Marks an order as prepared.

**Logic:**  
Firebase `update()` modifies only the status field.

---

### 1️⃣5️⃣ Serve Order
**Feature:**  
Moves order to served history.

**Logic:**  
Order is copied to `/servedOrders` and removed from `/orders`.

---

### 1️⃣6️⃣ Clear Served History
**Feature:**  
Deletes all served orders.

**Logic:**  
Firebase `remove()` clears the `/servedOrders` node.

---

### 1️⃣7️⃣ Realtime Sync
**Feature:**  
Updates appear instantly on all screens.

**Logic:**  
Firebase Realtime Database pushes changes automatically.

---

### 1️⃣8️⃣ No Authentication (Development Mode)
**Feature:**  
Quick testing without login.

**Logic:**  
Firebase rules allow public read/write (can be locked later).

---

### 1️⃣9️⃣ Firebase Hosting
**Feature:**  
App is deployed live on the web.

**Logic:**  
Static files in `public/` are deployed using `firebase deploy`.

---

### 2️⃣0️⃣ SPA Routing Support
**Feature:**  
Direct URLs work after deployment.

**Logic:**  
Firebase Hosting rewrites all routes to `index.html`.

---


---

## 🔐 Security Note
- Firebase rules are currently open for demo/testing.
- Authentication and rule locking can be added later.

---

## 🧾 Summary
Fast & Foodious is a realtime canteen ordering system built using Firebase that demonstrates atomic transactions, realtime syncing, and a clean frontend workflow without authentication.

---

## 👤 Author
**Mohammed Nabeel T**

---
