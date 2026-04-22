// public/login.js
// UNIVERSAL LOGIN HANDLER FOR ALL LOGIN PAGES

async function performLogin(email, password) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await res.json();

    // If login failed (wrong password/email)
    if (!res.ok || !data.user) {
      alert(data.message || "Invalid credentials");
      return null;
    }

    // Store token
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);

    // ROLE-BASED REDIRECT
    switch (data.user.role) {
      case "admin":
        window.location.href = "/admin.html";
        break;

      case "owner":
        window.location.href = "/owner.html";
        break;

      case "user":
      default:
        window.location.href = "/explore.html";
        break;
    }

    return data;

  } catch (err) {
    console.error("Login error:", err);
    alert("Network or server error");
    return null;
  }
}
