(function () {
    const STORAGE_KEY = 'gamebridge_cookie_consent';

    if (localStorage.getItem(STORAGE_KEY)) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'gamebridge-cookie-styles';
    style.textContent = `
    .cookie-banner-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 420px;
      width: calc(100% - 48px);
      background: rgba(30, 38, 37, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(239, 233, 244, 0.12);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(95, 191, 249, 0.08);
      z-index: 9999;
      transform: translateY(120%);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-sizing: border-box;
    }

    .cookie-banner-wrapper * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .cookie-banner-wrapper.show {
      transform: translateY(0);
      opacity: 1;
    }

    .cookie-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 0.75rem;
    }

    .cookie-icon {
      width: 24px;
      height: 24px;
      color: #5FBFF9;
      flex-shrink: 0;
    }

    .cookie-header h3 {
      color: #EFE9F4;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .cookie-body {
      color: rgba(239, 233, 244, 0.7);
      font-size: 0.88rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }

    .cookie-body a {
      color: #5FBFF9;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .cookie-body a:hover {
      text-decoration: underline;
    }

    .cookie-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cookie-btn {
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      flex: 1;
      text-align: center;
    }

    .cookie-btn-primary {
      background-color: #5FBFF9;
      color: #171D1C;
      box-shadow: 0 4px 15px rgba(95, 191, 249, 0.25);
    }

    .cookie-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(95, 191, 249, 0.4);
    }

    .cookie-btn-secondary {
      background-color: #283331;
      color: #EFE9F4;
      border-color: rgba(239, 233, 244, 0.12);
    }

    .cookie-btn-secondary:hover {
      border-color: #5FBFF9;
      color: #5FBFF9;
    }

    @media (max-width: 480px) {
      .cookie-banner-wrapper {
        bottom: 16px;
        right: 16px;
        left: 16px;
        width: auto;
      }
      .cookie-actions {
        flex-direction: column-reverse;
      }
      .cookie-btn {
        width: 100%;
      }
    }
  `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'cookie-banner-wrapper';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
    <div class="cookie-header">
      <svg class="cookie-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
        <path d="M8.5 8.5v.01"></path>
        <path d="M16 15.5v.01"></path>
        <path d="M12 12v.01"></path>
        <path d="M11 17v.01"></path>
        <path d="M7 13v.01"></path>
      </svg>
      <h3>Cookie Preferences</h3>
    </div>
    <div class="cookie-body">
      We use cookies to keep your dashboard session authenticated, and to remember you have accepted this; only what is useful to you.
    </div>
    <div class="cookie-actions">
      <button class="cookie-btn cookie-btn-primary" id="cookieAccept">Accept All</button>
    </div>
  `;
    document.body.appendChild(banner);

    setTimeout(() => {
        banner.classList.add('show');
    }, 600);

    const dismissBanner = (preference) => {
        localStorage.setItem(STORAGE_KEY, preference);
        banner.classList.remove('show');
        setTimeout(() => {
            banner.remove();
        }, 400);
    };

    document.getElementById('cookieAccept').addEventListener('click', () => {
        dismissBanner('all');
    });

    window.resetCookies = function () {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    };
})();