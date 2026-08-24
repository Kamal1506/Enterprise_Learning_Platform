import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-overlay">
      @for (toast of notificationService.notifications(); track toast.id) {
        <div class="notification-toast" [ngClass]="['toast-' + toast.type, toast.isDismissing ? 'dismissing' : '']">
          <div class="notification-icon-wrapper">
            @if (toast.type === 'success') {
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            } @else {
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            }
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ toast.title }}</div>
            <div class="notification-message">{{ toast.message }}</div>
          </div>
          
          <button class="notification-close-btn" (click)="notificationService.dismiss(toast.id)" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 380px;
      max-width: calc(100vw - 40px);
      pointer-events: none;
    }

    .notification-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      border-radius: 10px;
      background-color: rgba(17, 19, 26, 0.9);
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
      transform-origin: top right;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .notification-toast.dismissing {
      animation: fadeOut 0.3s ease forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(120%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateX(50%) scale(0.9);
        opacity: 0;
      }
    }

    .notification-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .notification-icon {
      width: 20px;
      height: 20px;
    }

    .notification-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notification-title {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .notification-message {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .notification-close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 2px;
      margin-top: -2px;
      margin-right: -2px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: color 0.2s ease, background-color 0.2s ease;
    }

    .notification-close-btn:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.08);
    }

    /* Status variants */
    .toast-success {
      border-left: 4px solid var(--status-success);
    }
    .toast-success .notification-icon {
      color: var(--status-success);
    }

    .toast-error {
      border-left: 4px solid var(--status-danger);
    }
    .toast-error .notification-icon {
      color: var(--status-danger);
    }

    .toast-warning {
      border-left: 4px solid var(--status-warning);
    }
    .toast-warning .notification-icon {
      color: var(--status-warning);
    }

    .toast-info {
      border-left: 4px solid #3b82f6;
    }
    .toast-info .notification-icon {
      color: #3b82f6;
    }

    /* Responsiveness */
    @media (max-width: 480px) {
      .notification-overlay {
        top: auto;
        bottom: 20px;
        right: 10px;
        left: 10px;
        width: auto;
        max-width: none;
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(120%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(120%);
          opacity: 0;
        }
      }
    }
  `]
})
export class NotificationContainerComponent {
  notificationService = inject(NotificationService);
}
