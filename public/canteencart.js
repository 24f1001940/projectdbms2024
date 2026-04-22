function loadCart() {
  let cart = JSON.parse(localStorage.getItem("canteen_cart") || "[]");

  let total = 0;
  let html = "";

  cart.forEach((item, i) => {
    total += item.price * item.qty;

    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>₹${item.price}</td>
        <td>₹${item.qty * item.price}</td>
      </tr>
    `;
  });

  document.getElementById("cartBody").innerHTML = html;
  document.getElementById("totalAmt").innerText = total;
}

async function placeOrder() {
  const token = localStorage.getItem("token");
  let cart = JSON.parse(localStorage.getItem("canteen_cart") || "[]");

  if (!cart.length) return alert("Cart is empty!");

  const params = new URLSearchParams(window.location.search);
  const canteen = params.get("canteen");

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      canteen_id: Number(canteen),
      items: cart.map((item) => ({ item_id: item.item_id || item.id, quantity: item.qty || item.quantity || 1 })),
      payment_method: 'cash'
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Order placed!");
    localStorage.removeItem("canteen_cart");
    window.location.href = "/receipt.html?order=" + data.orderId;
  } else {
    alert(data.message);
  }
}

loadCart();
