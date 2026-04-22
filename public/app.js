// public/app.js
// CENTRAL FRONTEND UTILITIES

const App = {
  // 1. Theme Management
  initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  },

  // 2. Auth & Token Management
  async fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem('token');
    
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let response = await fetch(url, options);

    if (response.status === 401) {
      // Attempt token refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        token = localStorage.getItem('token');
        options.headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, options);
      } else {
        this.logout();
      }
    }

    return response;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  },

  logout() {
    localStorage.clear();
    window.location.href = '/mainpage.html';
  },

  // 3. UI Helpers
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-modern ${type} animate-fade-in`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  },

  // 4. Command Palette (Ctrl + K)
  initCommandPalette() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
    });
  },

  toggleCommandPalette() {
    let cp = document.getElementById('command-palette');
    if (!cp) {
      cp = document.createElement('div');
      cp.id = 'command-palette';
      cp.className = 'cmd-palette glass-card p-4';
      cp.innerHTML = `
        <input type="text" class="form-control mb-3" placeholder="Search pages or items (e.g. /admin, /orders, Biryani)..." id="cmd-input">
        <div id="cmd-results" class="list-group"></div>
      `;
      document.body.appendChild(cp);
      cp.querySelector('#cmd-input').focus();
    }
    cp.classList.toggle('active');
  }
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  App.initTheme();
  App.initCommandPalette();
});

// CSS for Dynamic Elements
const style = document.createElement('style');
style.textContent = `
  .toast-modern {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 1rem 2rem; border-radius: 12px; background: rgba(0,0,0,0.8);
    color: white; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; align-items: center;
  }
  .toast-modern.success { border-left: 4px solid #28a745; }
  .toast-modern.error { border-left: 4px solid #dc3545; }
  .toast-modern.fade-out { opacity: 0; transform: translateY(-20px); transition: all 0.5s ease; }
  .cmd-palette { position: fixed; top: 20%; left: 50%; transform: translateX(-50%); width: 90%; max-width: 600px; display: none; }
  .cmd-palette.active { display: block; animation: fadeIn 0.3s ease; }
`;
document.head.appendChild(style);
