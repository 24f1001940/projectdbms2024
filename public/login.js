// public/login.js
// UNIVERSAL LOGIN HANDLER FOR ALL LOGIN PAGES

async function performLogin(email, password, loginRole = 'user') {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, loginRole })
    });

    const data = await res.json();

    if (!res.ok) {
      if (typeof App !== 'undefined') App.showToast(data.message || "Invalid credentials", "error");
      else alert(data.message || "Invalid credentials");
      return null;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (typeof App !== 'undefined') App.showToast("Welcome back!", "success");

    setTimeout(() => {
      switch (data.user.role) {
        case "admin": window.location.href = "/admin.html"; break;
        case "owner": window.location.href = "/owner.html"; break;
        default: window.location.href = "/explore.html"; break;
      }
    }, 800);

    return data;
  } catch (err) {
    console.error("Login error:", err);
    if (typeof App !== 'undefined') App.showToast("Network error", "error");
    return null;
  }
}
