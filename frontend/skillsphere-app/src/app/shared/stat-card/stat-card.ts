import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">{{ title() }}</span>
        <div class="stat-icon-wrapper" [ngClass]="iconClass()">
          <!-- Inline SVG or fallback simple indicator -->
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            @if (icon() === 'users') {
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            } @else if (icon() === 'award') {
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            } @else {
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            }
          </svg>
        </div>
      </div>
      <div class="stat-value">{{ value() }}</div>
      @if (trend()) {
        <div class="stat-footer">
          <span class="stat-trend" [ngClass]="trendColorClass()">{{ trend() }}</span>
          <span class="stat-desc"> vs last period</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: transform 0.3s ease, border-color 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        border-color: var(--primary-accent);
      }
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(234, 88, 12, 0.1);
      color: var(--primary-accent);
      
      &.icon-blue {
        background-color: rgba(2, 132, 199, 0.1);
        color: var(--secondary-light);
      }
    }
    .stat-icon {
      width: 18px;
      height: 18px;
    }
    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 8px;
    }
    .stat-footer {
      display: flex;
      align-items: center;
      font-size: 12px;
    }
    .stat-trend {
      font-weight: 600;
      margin-right: 4px;
      color: #34d399;
      
      &.trend-warning { color: #fbbf24; }
      &.trend-danger { color: #f87171; }
    }
    .stat-desc {
      color: var(--text-muted);
    }
  `]
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  icon = input<string>('activity');
  trend = input<string>();
  trendColor = input<string>('success');

  iconClass = computed(() => {
    return this.icon() === 'award' ? 'icon-blue' : '';
  });

  trendColorClass = computed(() => {
    const c = this.trendColor();
    if (c === 'warning') return 'trend-warning';
    if (c === 'danger') return 'trend-danger';
    return '';
  });
}
