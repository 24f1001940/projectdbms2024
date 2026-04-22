function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

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
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

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
      canteenId: canteen,
      items: cart
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Order placed!");
    localStorage.removeItem("cart");
    window.location.href = "/receipt.html?order=" + data.order.id;
  } else {
    alert(data.message);
  }
}

loadCart();
