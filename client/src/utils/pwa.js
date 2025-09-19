/**
 * Progressive Web App utilities
 * Handles service worker registration, offline detection, and PWA features
 */

import React from 'react';

class PWAUtils {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.registration = null;

    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupNetworkListeners();
    this.setupInstallPrompt();
    this.setupVisibilityChange();
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('[PWA] Service Worker registered:', this.registration.scope);

        // Handle updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

        return this.registration;
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        return null;
      }
    } else {
      console.warn('[PWA] Service Workers not supported');
      return null;
    }
  }

  // Network status monitoring
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkChange(false);
    });
  }

  handleNetworkChange(isOnline) {
    // Dispatch custom event for React components
    const event = new CustomEvent('networkChange', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);

    // Show notification
    if (isOnline) {
      this.showNotification('Back online! Syncing your changes...', 'success');
      this.syncOfflineData();
    } else {
      this.showNotification('You\'re offline. Changes will sync when back online.', 'warning');
    }
  }

  // Install prompt handling
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;

      // Show install button
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.hideInstallPrompt();
      this.trackEvent('app_installed');
    });
  }

  showInstallPrompt() {
    const event = new CustomEvent('showInstallPrompt', {
      detail: { prompt: this.deferredPrompt }
    });
    window.dispatchEvent(event);
  }

  hideInstallPrompt() {
    const event = new CustomEvent('hideInstallPrompt');
    window.dispatchEvent(event);
  }

  async installApp() {
    if (!this.deferredPrompt) return false;

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        this.trackEvent('install_prompt_accepted');
      } else {
        console.log('[PWA] User dismissed install prompt');
        this.trackEvent('install_prompt_dismissed');
      }

      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  // Visibility change handling
  setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppHidden();
      } else {
        this.handleAppVisible();
      }
    });
  }

  handleAppHidden() {
    // Save any pending changes
    this.savePendingChanges();
  }

  handleAppVisible() {
    // Sync data and refresh if needed
    if (this.isOnline) {
      this.syncOfflineData();
    }
  }

  // Offline data management
  async savePendingChanges() {
    try {
      const pendingData = this.getPendingChanges();
      if (pendingData && pendingData.length > 0) {
        localStorage.setItem('pendingChanges', JSON.stringify(pendingData));
        console.log('[PWA] Pending changes saved');
      }
    } catch (error) {
      console.error('[PWA] Failed to save pending changes:', error);
    }
  }

  async syncOfflineData() {
    try {
      const pendingChanges = localStorage.getItem('pendingChanges');
      if (pendingChanges) {
        const changes = JSON.parse(pendingChanges);

        // Sync each change
        for (const change of changes) {
          await this.syncChange(change);
        }

        // Clear pending changes
        localStorage.removeItem('pendingChanges');
        console.log('[PWA] Offline data synced successfully');

        this.showNotification('All changes synced successfully!', 'success');
      }
    } catch (error) {
      console.error('[PWA] Failed to sync offline data:', error);
      this.showNotification('Failed to sync some changes. Please try again.', 'error');
    }
  }

  async syncChange(change) {
    // Implement sync logic based on change type
    switch (change.type) {
      case 'project':
        return this.syncProjectChange(change);
      case 'circuit':
        return this.syncCircuitChange(change);
      case 'code':
        return this.syncCodeChange(change);
      default:
        console.warn('[PWA] Unknown change type:', change.type);
    }
  }

  // Background sync registration
  async registerBackgroundSync(tag, data = {}) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.registration.sync.register(tag, {
          data: data
        });
        console.log(`[PWA] Background sync registered: ${tag}`);
      } catch (error) {
        console.error(`[PWA] Background sync registration failed: ${tag}`, error);
      }
    }
  }

  // Push notifications
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async showNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        ...options
      };

      if (this.registration) {
        this.registration.showNotification(title, {
          body,
          ...notificationOptions
        });
      } else {
        new Notification(title, {
          body,
          ...notificationOptions
        });
      }
    }
  }

  // Service worker message handling
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        this.showNotification('Sync complete!', 'Your offline changes have been saved.', 'success');
        break;
      case 'CACHE_UPDATED':
        this.showNotification('App updated', 'A new version is available. Refresh to update.', 'info');
        break;
      case 'OFFLINE_READY':
        this.showNotification('Offline ready', 'You can now work offline!', 'success');
        break;
      default:
        console.log('[PWA] Service worker message:', type, data);
    }
  }

  // Update handling
  showUpdateNotification() {
    const event = new CustomEvent('appUpdateAvailable');
    window.dispatchEvent(event);
  }

  async updateApp() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Analytics and tracking
  trackEvent(eventName, data = {}) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }

    // Log for debugging
    console.log('[PWA] Event tracked:', eventName, data);
  }

  // Utility methods
  getPendingChanges() {
    // Get pending changes from various sources
    const changes = [];

    // Add logic to collect pending changes from different parts of the app
    // This would be implemented based on the specific data structures used

    return changes;
  }

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 0,
      rtt: navigator.connection?.rtt || 0
    };
  }

  // Storage management
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usageDetails: estimate.usageDetails
        };
      } catch (error) {
        console.error('[PWA] Storage estimate failed:', error);
      }
    }
    return null;
  }

  // Cleanup
  cleanup() {
    // Remove event listeners
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// Create singleton instance
const pwaUtils = new PWAUtils();

// Export for use in React components
export default pwaUtils;

// React hook for PWA functionality
export const usePWA = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = React.useState(pwaUtils.isInstalled());
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    const handleNetworkChange = (event) => {
      setIsOnline(event.detail.isOnline);
    };

    const handleInstallPrompt = () => {
      setShowInstallPrompt(true);
    };

    const handleHideInstallPrompt = () => {
      setShowInstallPrompt(false);
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('networkChange', handleNetworkChange);
    window.addEventListener('showInstallPrompt', handleInstallPrompt);
    window.addEventListener('hideInstallPrompt', handleHideInstallPrompt);
    window.addEventListener('appUpdateAvailable', handleUpdateAvailable);

    return () => {
      window.removeEventListener('networkChange', handleNetworkChange);
      window.removeEventListener('showInstallPrompt', handleInstallPrompt);
      window.removeEventListener('hideInstallPrompt', handleHideInstallPrompt);
      window.removeEventListener('appUpdateAvailable', handleUpdateAvailable);
    };
  }, []);

  return {
    isOnline,
    isInstalled,
    showInstallPrompt,
    updateAvailable,
    installApp: () => pwaUtils.installApp(),
    updateApp: () => pwaUtils.updateApp(),
    networkStatus: pwaUtils.getNetworkStatus(),
    storageEstimate: pwaUtils.getStorageEstimate()
  };
};