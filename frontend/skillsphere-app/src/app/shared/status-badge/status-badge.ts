import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass()">
      <svg class="badge-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        @if (statusVal() === 'valid' || statusVal() === 'good' || statusVal() === 'true') {
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.8-11.2a1 1 0 00-1.4-1.4L9 8.6 7.6 7.2a1 1 0 00-1.4 1.4l2.1 2.1a1 1 0 001.4 0l3.8-3.8z" clip-rule="evenodd" />
        } @else if (statusVal() === 'expiring' || statusVal() === 'warning') {
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        } @else {
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        }
      </svg>
      <span class="badge-text">{{ label() }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border: 1px solid transparent;
    }
    .badge-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .badge-valid {
      background-color: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.2);
    }
    .badge-warning {
      background-color: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.2);
    }
    .badge-danger {
      background-color: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.2);
    }
  `]
})
export class StatusBadgeComponent {
  status = input.required<string | boolean>();

  statusVal = computed(() => {
    const raw = this.status();
    return String(raw).toLowerCase().trim();
  });

  badgeClass = computed(() => {
    const s = this.statusVal();
    if (s === 'valid' || s === 'good' || s === 'true') return 'badge-valid';
    if (s === 'expiring' || s === 'warning') return 'badge-warning';
    return 'badge-danger';
  });

  label = computed(() => {
    const s = this.statusVal();
    if (s === 'valid' || s === 'good' || s === 'true') return 'Valid';
    if (s === 'expiring' || s === 'warning') return 'Expiring';
    return 'Expired / Gap';
  });
}
