/**
 * Notification Manager
 * Manages notifications and alerts
 */

// Type definitions
type NotificationType = 'success' | 'error' | 'warning';

// ============================================================================
// Notification Manager Class
// ============================================================================

export class NotificationManager {
  /**
   * Show notification
   */
  static showNotification(message: string, type: NotificationType = 'success'): void {
    const colors = {
      success: '#00ff00',
      error: '#ff6b6b',
      warning: '#ffaa00'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(42, 42, 42, 0.95);
      color: ${colors[type]};
      padding: 15px 20px;
      border-radius: 8px;
      border: 1px solid ${colors[type]};
      font-size: 14px;
      z-index: 10001;
      max-width: 400px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">
          ${this.getIcon(type)}
        </span>
        <span>${message}</span>
      </div>
    `;

    // Add slide animation if not already present
    this.addSlideAnimation();

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Show success notification
   */
  static showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  /**
   * Show error notification
   */
  static showError(message: string): void {
    this.showNotification(message, 'error');
  }

  /**
   * Show warning notification
   */
  static showWarning(message: string): void {
    this.showNotification(message, 'warning');
  }

  /**
   * Get icon for notification type
   */
  private static getIcon(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Add slide animation styles
   */
  private static addSlideAnimation(): void {
    if (document.getElementById('slideAnimation')) return;

    const style = document.createElement('style');
    style.id = 'slideAnimation';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ============================================================================
// Alert Manager
// ============================================================================

export class AlertManager {
  /**
   * Show alert with custom styling
   */
  static showAlert(message: string, title: string = 'Alert'): void {
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = `
      <div class="alert-content">
        <div class="alert-header">
          <h3>${title}</h3>
          <button class="alert-close" onclick="this.closest('.custom-alert').remove()">×</button>
        </div>
        <div class="alert-body">
          <p>${message}</p>
        </div>
        <div class="alert-footer">
          <button class="btn btn-primary" onclick="this.closest('.custom-alert').remove()">OK</button>
        </div>
      </div>
    `;

    // Add alert styles if not already present
    this.addAlertStyles();

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(alert)) {
        alert.remove();
      }
    }, 5000);
  }

  /**
   * Show confirmation dialog
   */
  static showConfirmation(message: string, title: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmation = document.createElement('div');
      confirmation.className = 'custom-confirmation';
      confirmation.innerHTML = `
        <div class="confirmation-content">
          <div class="confirmation-header">
            <h3>${title}</h3>
            <button class="confirmation-close" onclick="this.closest('.custom-confirmation').remove(); window.confirmationResult(false);">×</button>
          </div>
          <div class="confirmation-body">
            <p>${message}</p>
          </div>
          <div class="confirmation-footer">
            <button class="btn btn-secondary" onclick="this.closest('.custom-confirmation').remove(); window.confirmationResult(false);">Cancel</button>
            <button class="btn btn-primary" onclick="this.closest('.custom-confirmation').remove(); window.confirmationResult(true);">Confirm</button>
          </div>
        </div>
      `;

      // Add confirmation styles if not already present
      this.addConfirmationStyles();

      // Set up result handler
      (window as any).confirmationResult = (result: boolean) => {
        resolve(result);
        delete (window as any).confirmationResult;
      };

      document.body.appendChild(confirmation);
    });
  }

  /**
   * Add alert styles
   */
  private static addAlertStyles(): void {
    if (document.getElementById('alertStyles')) return;

    const style = document.createElement('style');
    style.id = 'alertStyles';
    style.textContent = `
      .custom-alert {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10002;
        animation: fadeIn 0.3s ease-out;
      }

      .alert-content {
        background: #1a1a1a;
        border: 2px solid #00d4ff;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 50px rgba(0, 212, 255, 0.3);
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #444;
      }

      .alert-header h3 {
        color: #00d4ff;
        margin: 0;
        font-size: 18px;
      }

      .alert-close {
        background: none;
        border: none;
        color: #aaa;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .alert-close:hover {
        color: #fff;
      }

      .alert-body {
        padding: 20px;
        color: #fff;
      }

      .alert-footer {
        padding: 20px;
        border-top: 1px solid #444;
        text-align: right;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add confirmation styles
   */
  private static addConfirmationStyles(): void {
    if (document.getElementById('confirmationStyles')) return;

    const style = document.createElement('style');
    style.id = 'confirmationStyles';
    style.textContent = `
      .custom-confirmation {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10002;
        animation: fadeIn 0.3s ease-out;
      }

      .confirmation-content {
        background: #1a1a1a;
        border: 2px solid #ffaa00;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 50px rgba(255, 170, 0, 0.3);
      }

      .confirmation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #444;
      }

      .confirmation-header h3 {
        color: #ffaa00;
        margin: 0;
        font-size: 18px;
      }

      .confirmation-close {
        background: none;
        border: none;
        color: #aaa;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .confirmation-close:hover {
        color: #fff;
      }

      .confirmation-body {
        padding: 20px;
        color: #fff;
      }

      .confirmation-footer {
        padding: 20px;
        border-top: 1px solid #444;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
    `;
    document.head.appendChild(style);
  }
}
