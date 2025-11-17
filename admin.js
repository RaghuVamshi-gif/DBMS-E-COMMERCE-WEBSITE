// frontend/admin.js
const API = "http://localhost:5000";

function tokenHeader() {
  const token = localStorage.getItem("admin_token");
  return token ? { "Authorization": "Bearer " + token } : {};
}

// redirect to login if not logged in
(function init() {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("You must login as admin first.");
    location.href = "login.html";
    return;
  }
  loadStats();
  loadProducts();
})();

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("admin_token");
  location.href = "login.html";
};

// STATS
function loadStats() {
  fetch(API + "/admin/stats", { headers: { ...tokenHeader() } })
    .then(r => r.json())
    .then(data => {
      document.getElementById("stat-products").innerText = data.products;
      document.getElementById("stat-customers").innerText = data.customers;
      document.getElementById("stat-orders").innerText = data.orders;
      document.getElementById("stat-revenue").innerText = "₹" + Number(data.revenue || 0).toFixed(2);
    })
    .catch(e => {
      console.error(e);
      if (e && e.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        location.href = "login.html";
      }
    });
}

// PRODUCTS
function loadProducts() {
  fetch(API + "/admin/products", { headers: { ...tokenHeader() } })
    .then(r => {
      if (!r.ok) throw new Error("Auth error");
      return r.json();
    })
    .then(rows => {
      const tbody = document.getElementById("admin-products");
      tbody.innerHTML = "";
      rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.product_id}</td>
          <td>${r.product_name}</td>
          <td>${r.category}</td>
          <td>₹${r.price}</td>
          <td>${r.stock}</td>
          <td>
            <button class="btn btn-sm btn-primary edit" data-id="${r.product_id}">Edit</button>
            <button class="btn btn-sm btn-danger delete ms-1" data-id="${r.product_id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // attach listeners
      document.querySelectorAll(".edit").forEach(b => b.onclick = e => {
        const id = e.target.dataset.id;
        fetch(API + "/admin/products", { headers: { ...tokenHeader() } })
          .then(r => r.json()).then(list => {
            const p = list.find(x => x.product_id == id);
            if (!p) return alert("Product not found");
            document.getElementById("prod-id").value = p.product_id;
            document.getElementById("prod-name").value = p.product_name;
            document.getElementById("prod-category").value = p.category;
            document.getElementById("prod-price").value = p.price;
            document.getElementById("prod-stock").value = p.stock;
          });
      });

      document.querySelectorAll(".delete").forEach(b => b.onclick = e => {
        if (!confirm("Delete product?")) return;
        fetch(API + "/admin/products/" + e.target.dataset.id, {
          method: "DELETE",
          headers: { ...tokenHeader() }
        }).then(r => {
          if (!r.ok) return r.text().then(txt => alert(txt || "Delete failed"));
          loadProducts();
          loadStats();
        });
      });
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load products. Check your token.");
      localStorage.removeItem("admin_token");
      location.href = "login.html";
    });
}

// Save (create/update) product
document.getElementById("save-product").onclick = () => {
  const id = document.getElementById("prod-id").value;
  const payload = {
    product_name: document.getElementById("prod-name").value,
    category: document.getElementById("prod-category").value,
    price: Number(document.getElementById("prod-price").value) || 0,
    stock: Number(document.getElementById("prod-stock").value) || 0
  };

  if (!payload.product_name) return alert("Name required");

  if (id) {
    // update
    fetch(API + "/admin/products/" + id, {
      method: "PUT",
      headers: { "Content-Type":"application/json", ...tokenHeader() },
      body: JSON.stringify(payload)
    }).then(r => {
      if (!r.ok) return r.text().then(txt => alert(txt || "Update failed"));
      alert("Updated");
      loadProducts();
      loadStats();
      clearProductForm();
    });
  } else {
    // create
    fetch(API + "/admin/products", {
      method: "POST",
      headers: { "Content-Type":"application/json", ...tokenHeader() },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(res => {
      alert("Created (id " + res.product_id + ")");
      loadProducts();
      loadStats();
      clearProductForm();
    });
  }
};

document.getElementById("clear-product").onclick = clearProductForm;

function clearProductForm() {
  document.getElementById("prod-id").value = "";
  document.getElementById("prod-name").value = "";
  document.getElementById("prod-category").value = "";
  document.getElementById("prod-price").value = "";
  document.getElementById("prod-stock").value = "";
}
