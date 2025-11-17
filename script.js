// ------------------------------------------------------
// GLOBAL SETTINGS
// ------------------------------------------------------
const API = "http://localhost:5000";
const PATH = location.pathname.split("/").pop() || "index.html";

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  document.querySelectorAll("#cart-count").forEach(el => {
    el.innerText = cart.length;
  });
}

function fetchJSON(url, opts = {}) {
  return fetch(url, opts).then(r => r.json());
}

// ------------------------------------------------------
// Show Order Alert (Fix for [object Object])
// ------------------------------------------------------
function showOrderAlert(res) {
  if (res.error) {
    alert("❌ Error: " + res.error);
    return;
  }

  alert(
    "✅ Order Placed Successfully!\n\n" +
    "🧾 Order ID: " + res.order_id + "\n" +
    "💰 Total: ₹" + res.total +
    "\n\nThank you for your purchase!"
  );
}

// ------------------------------------------------------
// PRODUCTS PAGE (index.html)
// ------------------------------------------------------
if (PATH === "index.html") {
  fetchJSON(API + "/products").then(data => {
    const list = document.getElementById("product-list");
    if (!list) return;

    list.innerHTML = "";

    data.forEach(p => {
      const col = document.createElement("div");
      col.className = "col-md-4 col-lg-3";

      col.innerHTML = `
        <div class="product-card">
          <img src="https://via.placeholder.com/250?text=${encodeURIComponent(
            p.product_name
          )}" class="product-img">

          <h5>${p.product_name}</h5>
          <p class="text-muted">${p.category}</p>
          <p class="price-tag">₹${p.price}</p>

          <div class="d-flex gap-2">
            <input type="number" min="1" value="1" id="qty-${p.product_id}" 
              class="form-control qty-box">

            <button class="btn btn-primary btn-sm"
              onclick="addToCart(${p.product_id}, '${p.product_name.replace(/'/g, "\\'")}', ${p.price})">
              Add
            </button>

            <button class="btn btn-success btn-sm"
              onclick="buyNow(${p.product_id})">
              Buy
            </button>
          </div>
        </div>
      `;

      list.appendChild(col);
    });
  });
}

// ------------------------------------------------------
// ADD TO CART
// ------------------------------------------------------
window.addToCart = function (product_id, name, price) {
  const qty = parseInt(document.getElementById("qty-" + product_id).value) || 1;

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const index = cart.findIndex(c => c.product_id == product_id);

  if (index >= 0) cart[index].quantity += qty;
  else cart.push({ product_id, name, price, quantity: qty });

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  alert("✔ Added to cart!");
};

// ------------------------------------------------------
// BUY NOW
// ------------------------------------------------------
window.buyNow = function (product_id) {
  const customer_id = prompt("Enter customer ID:");

  if (!customer_id) return alert("Customer ID is required.");

  const items = [{ product_id, quantity: 1 }];

  fetch(API + "/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id, items })
  })
    .then(r => r.json())
    .then(showOrderAlert);
};

// ------------------------------------------------------
// CART PAGE
// ------------------------------------------------------
if (PATH === "cart.html") {
  updateCartCount();
  renderCart();

  document.getElementById("place-order").onclick = () => {
    const customer_id = document.getElementById("cust-id").value;

    if (!customer_id) return alert("Enter customer ID");

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!cart.length) return alert("Your cart is empty");

    const items = cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity
    }));

    fetch(API + "/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id, items })
    })
      .then(r => r.json())
      .then(res => {
        showOrderAlert(res);
        localStorage.removeItem("cart");
        updateCartCount();
        window.location = "orders.html";
      });
  };
}

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("cart-container");

  if (!cart.length) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("summary-items").innerText = 0;
    document.getElementById("summary-total").innerText = "₹0";
    return;
  }

  let total = 0;

  let html = `
    <table class="table">
      <thead>
        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>
  `;

  cart.forEach((item, i) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    html += `
      <tr>
        <td>${item.name}</td>
        <td>
          <input type="number" min="1" value="${item.quantity}"
            data-index="${i}" class="update-q form-control" style="width:80px">
        </td>
        <td>₹${item.price}</td>
        <td>₹${subtotal.toFixed(2)}</td>
        <td><button class="btn btn-danger btn-sm remove" data-index="${i}">X</button></td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  container.innerHTML = html;

  document.getElementById("summary-items").innerText = cart.length;
  document.getElementById("summary-total").innerText = "₹" + total.toFixed(2);

  document.querySelectorAll(".remove").forEach(btn => {
    btn.onclick = e => {
      const i = e.target.dataset.index;
      cart.splice(i, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateCartCount();
    };
  });

  document.querySelectorAll(".update-q").forEach(inp => {
    inp.onchange = e => {
      const i = e.target.dataset.index;
      cart[i].quantity = parseInt(e.target.value) || 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateCartCount();
    };
  });
}

// ------------------------------------------------------
// CUSTOMERS PAGE
// ------------------------------------------------------
if (PATH === "customers.html") {
  updateCartCount();

  const tableBody = document.querySelector("#customers-table tbody");

  function loadCustomers() {
    fetchJSON(API + "/customers").then(data => {
      tableBody.innerHTML = "";

      data.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${c.customer_id}</td>
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td>${c.address}</td>
          <td>
            <button class="btn btn-primary btn-sm edit" data-id="${c.customer_id}">Edit</button>
            <button class="btn btn-danger btn-sm delete" data-id="${c.customer_id}">Delete</button>
          </td>
        `;

        tableBody.appendChild(tr);
      });

      document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = e => {
          const id = e.target.dataset.id;
          fetchJSON(API + "/customers/" + id).then(c => {
            document.getElementById("cust-id").value = c.customer_id;
            document.getElementById("cust-name").value = c.name;
            document.getElementById("cust-email").value = c.email;
            document.getElementById("cust-phone").value = c.phone;
            document.getElementById("cust-address").value = c.address;
          });
        };
      });

      document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = e => {
          if (confirm("Delete customer?")) {
            fetch(API + "/customers/" + e.target.dataset.id, {
              method: "DELETE"
            }).then(loadCustomers);
          }
        };
      });
    });
  }

  loadCustomers();

  document.getElementById("save-cust").onclick = () => {
    const id = document.getElementById("cust-id").value;

    const payload = {
      name: document.getElementById("cust-name").value,
      email: document.getElementById("cust-email").value,
      phone: document.getElementById("cust-phone").value,
      address: document.getElementById("cust-address").value
    };

    if (!payload.name) return alert("Name is required");

    if (id) {
      fetch(API + "/customers/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(loadCustomers);
    } else {
      fetch(API + "/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(loadCustomers);
    }
  };

  document.getElementById("clear-form").onclick = () => {
    ["cust-id", "cust-name", "cust-email", "cust-phone", "cust-address"].forEach(id => {
      document.getElementById(id).value = "";
    });
  };
}

// ------------------------------------------------------
// ORDERS PAGE
// ------------------------------------------------------
if (PATH === "orders.html") {
  updateCartCount();

  const tbody = document.querySelector("#orders-table tbody");

  fetchJSON(API + "/orders").then(data => {
    tbody.innerHTML = "";

    data.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.order_id}</td>
        <td>${o.customer}</td>
        <td>₹${o.total_amount}</td>
        <td>${new Date(o.order_date).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

updateCartCount();
