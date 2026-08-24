import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (confirmationService.state(); as state) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-dialog" [ngClass]="['type-' + (state.options.type || 'primary')]">
          <div class="modal-header">
            <div class="modal-icon-wrapper">
              @if (state.options.type === 'danger') {
                <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              } @else if (state.options.type === 'warning') {
                <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              } @else if (state.options.type === 'info') {
                <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              } @else {
                <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              }
            </div>
            <h3 class="modal-title">{{ state.options.title }}</h3>
          </div>
          
          <div class="modal-body">
            <p>{{ state.options.message }}</p>
            
            @if (state.options.showInput) {
              <div class="modal-input-group">
                <input 
                  type="text" 
                  class="modal-input" 
                  [(ngModel)]="inputValue" 
                  [placeholder]="state.options.inputPlaceholder || 'Type value here...'" 
                  (keyup.enter)="confirm(state)"
                  autofocus
                />
              </div>
            }
          </div>
          
          <div class="modal-footer">
            @if (state.options.cancelText) {
              <button class="btn btn-cancel" (click)="cancel()">
                {{ state.options.cancelText }}
              </button>
            }
            <button class="btn" [ngClass]="['btn-' + (state.options.type || 'primary')]" (click)="confirm(state)">
              {{ state.options.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease forwards;
    }

    .modal-dialog {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      width: 460px;
      max-width: calc(100% - 32px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px 24px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .modal-icon {
      width: 20px;
      height: 20px;
    }

    .modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-body {
      padding: 0 24px 20px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .modal-input-group {
      margin-top: 16px;
    }

    .modal-input {
      width: 100%;
      padding: 10px 14px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .modal-input:focus {
      border-color: var(--primary-accent);
    }

    .modal-footer {
      padding: 16px 24px 20px;
      background-color: rgba(0, 0, 0, 0.15);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .btn-cancel:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    /* Button Variants */
    .btn-primary {
      background-color: var(--primary-accent);
      border: 1px solid var(--primary-accent);
      color: white;
    }
    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    .btn-danger {
      background-color: var(--status-danger);
      border: 1px solid var(--status-danger);
      color: white;
    }
    .btn-danger:hover {
      background-color: #dc2626;
    }

    .btn-warning {
      background-color: var(--status-warning);
      border: 1px solid var(--status-warning);
      color: white;
    }
    .btn-warning:hover {
      background-color: #d97706;
    }

    .btn-info {
      background-color: #3b82f6;
      border: 1px solid #3b82f6;
      color: white;
    }
    .btn-info:hover {
      background-color: #2563eb;
    }

    /* Icons styling by type */
    .type-danger .modal-icon-wrapper {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--status-danger);
    }
    .type-warning .modal-icon-wrapper {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--status-warning);
    }
    .type-info .modal-icon-wrapper {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    .type-primary .modal-icon-wrapper {
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
    }
  `]
})
export class ConfirmationModalComponent {
  confirmationService = inject(ConfirmationService);
  inputValue = '';

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }

  cancel() {
    this.inputValue = '';
    this.confirmationService.dismiss();
  }

  confirm(state: any) {
    if (state.options.showInput) {
      const val = this.inputValue;
      this.inputValue = '';
      this.confirmationService.resolve(val);
    } else {
      this.confirmationService.resolve(true);
    }
  }
}
