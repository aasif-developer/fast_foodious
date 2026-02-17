// app.js - full file with Firebase Realtime Database initialization + app logic
import { db } from "./firebase-config.js";
import {
  ref,
  push,
  set,
  onValue,
  runTransaction,
  get,
  update
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
console.log("🔥 app.js loaded");
console.log("🔥 db =", db);

  // ---- Meal Support System ----
  let supportMode = false;

  const supportBtn = document.getElementById("supportBtn");
  const supportSessionKey = "supportUsed";
    const donationCheckbox = document.getElementById("donationCheckbox");

  if (supportBtn) {

    // Disable if already used this session
    if (sessionStorage.getItem(supportSessionKey)) {
      supportBtn.disabled = true;
      supportBtn.textContent = "💛 Support Already Used";
      supportBtn.classList.remove("btn-warning");
      supportBtn.classList.add("btn-secondary");
    }

    supportBtn.addEventListener("click", async () => {

      if (sessionStorage.getItem(supportSessionKey)) {
        alert("Support already used in this session.");
        return;
      }

      supportMode = true;

      supportBtn.textContent = "💛 Support Mode Active";
      supportBtn.classList.remove("btn-warning");
      supportBtn.classList.add("btn-success");

      alert("Support Mode Activated. ₹30 will be deducted during checkout.");
    });
  }

  // Helpers
  const safeParse = s => { try { return JSON.parse(s); } catch(e){ return null; } };
  const sessionTokensKey = "myTokens"; // session-only info so user can view their orders

  // Elements
  const generateBtn = document.getElementById("generateBill");
  const tokenNumberEl = document.getElementById("tokenNumber");
  const modalBillItems = document.getElementById("modalBillItems");
  const modalGrandTotal = document.getElementById("modalGrandTotal");
  const screenshotBtn = document.getElementById("screenshotBill");
  const confirmBtn = document.getElementById("confirmOrder");
  const myOrdersBody = document.getElementById("myOrdersBody");

  // ---- plus/minus qty controls ----
  document.querySelectorAll(".single_menu").forEach(menu => {
    const plus = menu.querySelector(".plus");
    const minus = menu.querySelector(".minus");
    const qtyInput = menu.querySelector(".quantity");
    qtyInput.value = qtyInput.value ? qtyInput.value : 0;

    plus.addEventListener("click", () => {
      const v = parseInt(qtyInput.value) || 0;
      qtyInput.value = v + 1;
    });
    minus.addEventListener("click", () => {
      const v = parseInt(qtyInput.value) || 0;
      if (v > 0) qtyInput.value = v - 1;
    });
  });

  // ---- Generate Bill (modal content) ----
  if(generateBtn){
  generateBtn.addEventListener("click", () => {
    const items = document.querySelectorAll(".single_menu");
    modalBillItems.innerHTML = ""; // clear

    let total = 0;
    const ol = document.createElement("ol"); // ordered list

    items.forEach(item => {
      const name = item.querySelector("h4").childNodes[0].textContent.trim();
      const priceText = item.querySelector("h4 span").textContent.replace("₹", "").trim();
      const price = parseInt(priceText) || 0;
      const qty = parseInt(item.querySelector(".quantity").value) || 0;

      if (qty > 0) {
        const amount = qty * price;
        total += amount;

        const li = document.createElement("li");
        li.textContent = `${name} – Qty: ${qty} × ₹${price} = ₹${amount}`;
        ol.appendChild(li);
      }
    });

    if (total > 0) {
      let discount = 0;

      if (supportMode) {
        discount = Math.min(30, total);
        total = total - discount;
      }

      modalBillItems.appendChild(ol); // append the whole ordered list
      tokenNumberEl.textContent = `🎟️ Token (will be assigned when you confirm)`;
      if (discount > 0) {
        const discountLine = document.createElement("p");
        discountLine.style.color = "green";
        discountLine.style.fontWeight = "bold";
        discountLine.textContent = `💛 Meal Support Applied: -₹${discount}`;
        modalBillItems.appendChild(discountLine);
      }

      modalGrandTotal.textContent = `Grand Total: ₹${total}`;

      const billModal = new bootstrap.Modal(document.getElementById('billModal'));
      billModal.show();
    } else {
      alert("Please select at least one item!");
    }
  });
  }

  // ---- Screenshot ----
  if (screenshotBtn) {
    screenshotBtn.addEventListener("click", () => {
      const billContent = document.querySelector("#billModal .modal-content");
      html2canvas(billContent).then(canvas => {
        const link = document.createElement("a");
        link.download = "bill.png";
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  }

  // ---- Atomic token + push order to Firebase ----
  async function createOrderInFirebase(orderObj) {
    // Atomically increment counter
    const tokenRef = ref(db, "counters/nextToken");
    await runTransaction(tokenRef, current => (current || 0) + 1);
    const tokenSnap = await get(tokenRef);
    const token = tokenSnap.val();

    orderObj.token = token;
    orderObj.time = new Date().toLocaleString();
    orderObj.status = "Pending";

    const ordersRef = ref(db, "orders");
    const newRef = push(ordersRef); // create new record with unique key
    await set(newRef, orderObj);

    return { token, key: newRef.key };
  }

  // ---- Confirm Order ----
  if(confirmBtn){
    confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;

    // collect items
    const items = document.querySelectorAll(".single_menu");
    let orderItems = [];
    let total = 0;
    items.forEach(item => {
      const name = item.querySelector("h4").childNodes[0].textContent.trim();
      const priceText = item.querySelector("h4 span").textContent.replace("₹", "").trim();
      const price = parseInt(priceText) || 0;
      const qty = parseInt(item.querySelector(".quantity").value) || 0;
      if (qty > 0) {
        const amount = qty * price;
        total += amount;
        orderItems.push({ name, qty, price, amount });
      }
    });

    if (orderItems.length === 0) {
      alert("No items selected.");
      confirmBtn.disabled = false;
      return;
    }

let donationAmount = 0;

if (donationCheckbox && donationCheckbox.checked) {
  donationAmount = 5;
  total += 5;
}

const orderObj = {
  items: orderItems,
  total,
  donationAmount: donationAmount,
  supportUsed: supportMode,
  discountAmount: supportMode ? 30 : 0,
  paymentMethod: null,
  paymentStatus: "Unpaid"
};

    try {
      const { token } = await createOrderInFirebase(orderObj);

      // store token in session so the student can view their order(s) in this session
      const existing = safeParse(sessionStorage.getItem(sessionTokensKey)) || [];
      existing.push(token);
      sessionStorage.setItem(sessionTokensKey, JSON.stringify(existing));

      // hide modal
      const billModalInst = bootstrap.Modal.getInstance(document.getElementById('billModal'));
      if (billModalInst) billModalInst.hide();

      // reset quantities
      document.querySelectorAll(".quantity").forEach(i => i.value = 0);
      if (supportMode) {
  sessionStorage.setItem(supportSessionKey, true);
  supportMode = false;
}

if (donationCheckbox) {
  donationCheckbox.checked = false;
}

      // notify user
// Show payment modal instead of alert
const paymentModalEl = document.getElementById("paymentModal");
const paymentTokenInfo = document.getElementById("paymentTokenInfo");

if (paymentTokenInfo) {
  paymentTokenInfo.textContent = `Token #${token} - Select your payment method`;
}

const paymentModal = new bootstrap.Modal(paymentModalEl);
paymentModal.show();


      // start listening for updates for the new token
      listenForOrdersForSession();
    } catch (err) {
      console.error("Order error:", err);
      alert("Error placing order. Try again.");
    } finally {
      confirmBtn.disabled = false;
    }
  });
  }

  // ---- Render My Orders table using session tokens ----
  function renderMyOrdersFromSnapshot(allOrders) {
    if (!myOrdersBody) return;
    myOrdersBody.innerHTML = "";
    const sessionTokens = safeParse(sessionStorage.getItem(sessionTokensKey)) || [];

    // gather orders that match session tokens
    const matched = [];
    if (allOrders) {
      for (const key in allOrders) {
        const ord = allOrders[key];
        if (sessionTokens.includes(ord.token)) matched.push(ord);
      }
    }

    if (matched.length === 0) {
      myOrdersBody.innerHTML = `<tr><td colspan="5" class="text-muted">No orders yet.</td></tr>`;
      return;
    }

    // newest first
    matched.reverse().forEach(order => {
      const itemsHtml = (Array.isArray(order.items) ? order.items.map(i => `${i.name} (x${i.qty})`).join(", ") : "");
      const badgeClass = order.status === "Prepared" ? "info" :
                         order.status === "Served" ? "success" : "warning";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order.token}</td>
        <td>${itemsHtml}</td>
        <td>₹${order.total}</td>
        <td>${order.time || ""}</td>
        <td><span class="badge bg-${badgeClass}">${order.status}</span></td>
      `;
      myOrdersBody.appendChild(tr);
    });
  }

  // ---- global listener for all orders and update My Orders table ----
  function listenForOrdersForSession() {
    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snap) => {
      renderMyOrdersFromSnapshot(snap.val());
    });
  }

  // ---- Nav toggles: Menu <-> My Orders ----
  const navMenu = document.getElementById("navMenu");
  const navOrders = document.getElementById("navOrders");
  const menuSection = document.getElementById("menuSection");
  const ordersSection = document.getElementById("ordersSection");

  function showMenu(){
    menuSection.classList.remove("d-none");
    ordersSection.classList.add("d-none");
    navMenu.classList.add("active");
    navOrders.classList.remove("active");
  }
  function showOrders(){
    menuSection.classList.add("d-none");
    ordersSection.classList.remove("d-none");
    navMenu.classList.remove("active");
    navOrders.classList.add("active");
    // ensure orders are loaded
    listenForOrdersForSession();
  }
  if (navMenu && navOrders) {
    navMenu.addEventListener("click", e => { e.preventDefault(); showMenu(); });
    navOrders.addEventListener("click", e => { e.preventDefault(); showOrders(); });
  }

  // if orders page visible by default, load
  if (!ordersSection.classList.contains("d-none")) {
    listenForOrdersForSession();
  }
  // ---- Dietary Filter Logic ----
  const dietFilter = document.getElementById("dietFilter");
  const dietStatus = document.getElementById("dietStatus");

  if (dietFilter) {
    dietFilter.addEventListener("change", () => {
      const selected = dietFilter.value;
      const items = document.querySelectorAll(".single_menu");

      items.forEach(item => {
        const tags = item.dataset.tags ? item.dataset.tags.split(",") : [];

        let hide = false;

        if (selected === "vegan") {
          if (tags.includes("egg") || tags.includes("non-veg")) {
            hide = true;
          }
        }

        if (selected === "no-dairy") {
          if (tags.includes("dairy")) {
            hide = true;
          }
        }

        if (selected === "diabetic") {
          if (tags.includes("high-sugar")) {
            hide = true;
          }
        }

        if (selected === "none") {
          hide = false;
        }

        item.style.display = hide ? "none" : "";
        if (selected === "none") {
          dietStatus.textContent = "Showing all menu items.";
        }
        if (selected === "vegan") {
          dietStatus.textContent = "Showing Vegan Safe Items (No Egg / No Non-Veg).";
        }
        if (selected === "no-dairy") {
          dietStatus.textContent = "Showing Lactose-Free Items.";
        }
        if (selected === "diabetic") {
          dietStatus.textContent = "Showing Diabetic Friendly (Low Sugar) Items.";
        }

      });
    });
  }


  // ---- Payment Handling ----
const cashOption = document.getElementById("cashOption");
const upiOption = document.getElementById("upiOption");

let latestToken = null;

// Capture latest token when payment modal opens
const paymentModalEl = document.getElementById("paymentModal");
if (paymentModalEl) {
  paymentModalEl.addEventListener("shown.bs.modal", () => {
    const tokenText = document.getElementById("paymentTokenInfo")?.textContent;
    if (tokenText) {
      const match = tokenText.match(/Token #(\d+)/);
      if (match) {
        latestToken = parseInt(match[1]);
      }
    }
  });
}

// Function to update payment in Firebase
async function updatePaymentStatus(token, method, status) {
  const ordersRef = ref(db, "orders");

  onValue(ordersRef, (snapshot) => {
    const orders = snapshot.val();
    if (!orders) return;

    for (const key in orders) {
      if (orders[key].token === token) {
        update(ref(db, `orders/${key}`), {
          paymentMethod: method,
          paymentStatus: status
        });
        break;
      }
    }
  }, { onlyOnce: true });
}

// ---- Cash Option ----
if (cashOption) {
  cashOption.addEventListener("click", async () => {
    if (!latestToken) return;

    await updatePaymentStatus(latestToken, "Cash", "Pending Verification");

    const paymentModal = bootstrap.Modal.getInstance(paymentModalEl);
    paymentModal.hide();

    alert("Cash selected. Please pay at counter.");
  });
}

// ---- UPI Option ----
if (upiOption) {
  upiOption.addEventListener("click", async () => {
    if (!latestToken) return;

    await updatePaymentStatus(latestToken, "UPI", "Unpaid");

    const amountElement = document.getElementById("modalGrandTotal");
    const amountMatch = amountElement.textContent.match(/₹([\d.]+)/);

    const amount = amountMatch
      ? parseFloat(amountMatch[1]).toFixed(2)
      : "0.00";

    const upiID = "aasifmmd12345@oksbi";   // your test UPI
    const name = "FastFoodius";

    // 🔥 CLEAN LINK (NO TOKEN, NO MESSAGE)
    const upilink = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;

    console.log("UPI LINK:", upilink);

    window.location.href = upilink;
  });
}

});

// https://console.cloud.google.com/projectselector2/apis/dashboard?supportedpurview=project