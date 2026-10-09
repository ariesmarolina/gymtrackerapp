// IronTrack PWA, iOS 15 Safari Home Screen & Offline Manager

class PWAManager {
  constructor() {
    this.isStandalone = false;
    this.isIos = false;
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    this.detectEnvironment();
    this.registerServiceWorker();
    this.initNetworkListeners();
    this.checkAiStatus();
  }

  detectEnvironment() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIos = /iphone|ipad|ipod/.test(userAgent);

    // iOS Safari standalone flag or standard display-mode
    this.isStandalone = (window.navigator.standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Show iOS Install Banner if in Safari and not already added to home screen
    const installBanner = document.getElementById('iosInstallBanner');
    const dismissed = localStorage.getItem('irontrack_ios_banner_dismissed');

    if (this.isIos && !this.isStandalone && !dismissed && installBanner) {
      installBanner.style.display = 'block';
    }

    // Android / Desktop beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const genericInstallBtn = document.getElementById('genericInstallBtn');
      if (genericInstallBtn) genericInstallBtn.style.display = 'inline-flex';
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }

  initNetworkListeners() {
    const offlineIndicator = document.getElementById('offlineIndicator');

    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        if (offlineIndicator) offlineIndicator.style.display = 'flex';
        if (window.app) window.app.showToast('Offline mode active. Data saves locally.', 'info');
      } else {
        if (offlineIndicator) offlineIndicator.style.display = 'none';
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  async checkAiStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        const badge = document.getElementById('aiStatusBadge');
        if (badge) {
          if (data.aiConfigured) {
            badge.className = 'status-badge-pill green';
            badge.textContent = `AI Vision Active (${data.provider.toUpperCase()})`;
          } else {
            badge.className = 'status-badge-pill amber';
            badge.textContent = 'AI Key Missing (.env)';
          }
        }
      }
    } catch (e) {
      // Offline or network error
      const badge = document.getElementById('aiStatusBadge');
      if (badge) {
        badge.className = 'status-badge-pill gray';
        badge.textContent = 'Server Unreachable / Offline';
      }
    }
  }

  dismissIosBanner() {
    const installBanner = document.getElementById('iosInstallBanner');
    if (installBanner) installBanner.style.display = 'none';
    localStorage.setItem('irontrack_ios_banner_dismissed', 'true');
  }

  openIosGuideModal() {
    const modal = document.getElementById('iosGuideModal');
    if (modal) modal.style.display = 'flex';
  }

  closeIosGuideModal() {
    const modal = document.getElementById('iosGuideModal');
    if (modal) modal.style.display = 'none';
  }

  async triggerGenericInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      }
      this.deferredPrompt = null;
      const btn = document.getElementById('genericInstallBtn');
      if (btn) btn.style.display = 'none';
    }
  }
}

// Global instance
window.pwaManager = new PWAManager();
