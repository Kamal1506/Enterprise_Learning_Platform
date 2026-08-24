import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ title() }}</h1>
      </div>
      <div class="header-right">
        <!-- Day and Night Toggle Switch -->
        <div class="toggle-cont">
          <input class="toggle-input" id="themeToggle" type="checkbox" [checked]="themeService.currentTheme() === 'dark'" (change)="toggleTheme()" />
          <label class="toggle-label" for="themeToggle">
            <div class="cont-icon">
              <span style="--width: 2; --deg: 25; --duration: 11" class="sparkle"></span>
              <span style="--width: 1; --deg: 100; --duration: 18" class="sparkle"></span>
              <span style="--width: 1; --deg: 280; --duration: 5" class="sparkle"></span>
              <span style="--width: 2; --deg: 200; --duration: 3" class="sparkle"></span>
              <span style="--width: 2; --deg: 30; --duration: 20" class="sparkle"></span>
              <span style="--width: 2; --deg: 300; --duration: 9" class="sparkle"></span>
              <span style="--width: 1; --deg: 250; --duration: 4" class="sparkle"></span>
              <span style="--width: 2; --deg: 210; --duration: 8" class="sparkle"></span>
              <span style="--width: 2; --deg: 100; --duration: 9" class="sparkle"></span>
              <span style="--width: 1; --deg: 15; --duration: 13" class="sparkle"></span>
              <span style="--width: 1; --deg: 75; --duration: 18" class="sparkle"></span>
              <span style="--width: 2; --deg: 65; --duration: 6" class="sparkle"></span>
              <span style="--width: 2; --deg: 50; --duration: 7" class="sparkle"></span>
              <span style="--width: 1; --deg: 320; --duration: 5" class="sparkle"></span>
              <span style="--width: 1; --deg: 220; --duration: 5" class="sparkle"></span>
              <span style="--width: 1; --deg: 215; --duration: 2" class="sparkle"></span>
              <span style="--width: 2; --deg: 135; --duration: 9" class="sparkle"></span>
              <span style="--width: 2; --deg: 45; --duration: 4" class="sparkle"></span>
              <span style="--width: 1; --deg: 78; --duration: 16" class="sparkle"></span>
              <span style="--width: 1; --deg: 89; --duration: 19" class="sparkle"></span>
              <span style="--width: 2; --deg: 65; --duration: 14" class="sparkle"></span>
              <span style="--width: 2; --deg: 97; --duration: 1" class="sparkle"></span>
              <span style="--width: 1; --deg: 174; --duration: 10" class="sparkle"></span>
              <span style="--width: 1; --deg: 236; --duration: 5" class="sparkle"></span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" class="icon">
                <path d="M0.96233 28.61C1.36043 29.0081 1.96007 29.1255 2.47555 28.8971L10.4256 25.3552C13.2236 24.11 16.4254 24.1425 19.2107 25.4401L27.4152 29.2747C27.476 29.3044 27.5418 29.3023 27.6047 29.32C27.6563 29.3348 27.7079 29.3497 27.761 29.3574C27.843 29.3687 27.9194 29.3758 28 29.3688C28.1273 29.3617 28.2531 29.3405 28.3726 29.2945C28.4447 29.262 28.5162 29.2287 28.5749 29.1842C28.6399 29.1446 28.6993 29.0994 28.7509 29.0477L28.9008 28.8582C28.9468 28.7995 28.9793 28.7274 29.0112 28.656C29.0599 28.5322 29.0811 28.4036 29.0882 28.2734C29.0939 28.1957 29.0868 28.1207 29.0769 28.0415C29.0705 27.9955 29.0585 27.9524 29.0472 27.9072C29.0295 27.8343 29.0302 27.7601 28.9984 27.6901L25.1638 19.4855C23.8592 16.7073 23.8273 13.5048 25.0726 10.7068L28.6145 2.75679C28.8429 2.24131 28.7318 1.63531 28.3337 1.2372C27.9165 0.820011 27.271 0.721743 26.7491 0.9961L19.8357 4.59596C16.8418 6.15442 13.2879 6.18696 10.2615 4.70062L1.80308 0.520214C1.7055 0.474959 1.60722 0.441742 1.50964 0.421943C1.44459 0.409215 1.37882 0.395769 1.3074 0.402133C1.14406 0.395769 0.981436 0.428275 0.818095 0.499692C0.77284 0.519491 0.719805 0.545671 0.67455 0.578198C0.596061 0.617088 0.524653 0.675786 0.4596 0.74084C0.394546 0.805894 0.335843 0.877306 0.296245 0.956502C0.263718 1.00176 0.237561 1.05477 0.217762 1.10003C0.152708 1.24286 0.126545 1.40058 0.120181 1.54978C0.120181 1.61483 0.126527 1.6735 0.132891 1.73219C0.15269 1.85664 0.178881 1.97332 0.237571 2.08434L4.41798 10.5427C5.91139 13.5621 5.8725 17.1238 4.3204 20.1099L0.720514 27.0233C0.440499 27.5536 0.545137 28.1928 0.96233 28.61Z"></path>
              </svg>
            </div>
          </label>
        </div>

        <div class="user-profile">
          <div class="header-avatar">{{ getInitials(email()) }}</div>
          <div class="user-profile-info">
            <span class="user-role-badge">{{ role() }}</span>
            <span class="user-email">{{ email() }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="onLogout()" aria-label="Sign out of system">
          <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="logout-label">Logout</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: var(--bg-card);
      border-bottom: 2px solid var(--border-color);
      height: 77px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .page-title {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 6px 14px 6px 8px;
      border-radius: 30px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(234, 88, 12, 0.25);
        box-shadow: 0 0 10px rgba(234, 88, 12, 0.15);
      }
    }
    .header-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-accent), var(--secondary-light));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      box-shadow: 0 0 8px rgba(234, 88, 12, 0.4);
      flex-shrink: 0;
    }
    .user-profile-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .user-role-badge {
      background-color: rgba(234, 88, 12, 0.15);
      color: var(--primary-light);
      border: 1px solid rgba(234, 88, 12, 0.3);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      line-height: 1.2;
    }
    .user-email {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      padding: 8px 14px;
      border-radius: 6px;
      color: #ef4444;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
        transform: translateY(-1px);
      }
    }
    .logout-icon {
      width: 16px;
      height: 16px;
    }
    
    /* Toggle switch styles */
    .toggle-cont {
      --primary: #ea580c;
      --light: #fff;
      --dark: #000;
      --gray: #9c9c9c;
      --gap: 0.15rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    .toggle-input {
      display: none;
    }
    .toggle-label {
      width: 4.2rem;
      height: 2.1rem;
      background-color: #1a1a1a;
      border-radius: 9999px;
      cursor: pointer;
      position: relative;
      box-sizing: border-box;
      border: 1px solid #333;
      transition: all 0.3s ease-in-out;
    }
    .toggle-label::before {
      content: "";
      position: absolute;
      top: 50%;
      left: var(--gap);
      width: calc(2.1rem - (var(--gap) * 2));
      height: calc(2.1rem - (var(--gap) * 2));
      background-color: #ffd6b3;
      border-radius: 9999px;
      transform: translateY(-50%);
      transition: all 0.3s ease-in-out;
      box-shadow: 0 0 10px rgba(234, 88, 12, 0.4);
    }
    .toggle-label .cont-icon {
      position: absolute;
      top: 50%;
      left: var(--gap);
      width: calc(2.1rem - (var(--gap) * 2));
      height: calc(2.1rem - (var(--gap) * 2));
      border-radius: 9999px;
      transform: translateY(-50%);
      transition: all 0.3s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
      border: 1px solid #16161600;
      background-image: radial-gradient(circle at 50% 0%, #ea580c 0%, #9a3412 100%);
    }
    .cont-icon .sparkle {
      position: absolute;
      top: 50%;
      left: 50%;
      display: block;
      width: calc(var(--width) * 1px);
      aspect-ratio: 1;
      background-color: var(--light);
      border-radius: 50%;
      transform-origin: 50% 50%;
      rotate: calc(1deg * var(--deg));
      transform: translate(-50%, -50%);
      animation: sparkle calc(30s / var(--duration)) linear calc(0s / var(--duration)) infinite;
    }
    @keyframes sparkle {
      to {
        width: calc(var(--width) * 0.5px);
        transform: translate(1000%, -50%);
      }
    }
    .cont-icon .icon {
      width: 0.9rem;
      height: 0.9rem;
      fill: var(--light);
      z-index: 5;
    }

    /* Checked state styles */
    .toggle-input:checked + .toggle-label {
      background-color: #0b0c10;
      border: 1px solid #ea580c;
    }
    .toggle-input:checked + .toggle-label::before {
      transform: translateY(-50%) translateX(2.1rem);
      background-color: #000;
      box-shadow: 0 0 12px rgba(234, 88, 12, 0.6);
    }
    .toggle-input:checked + .toggle-label .cont-icon {
      overflow: visible;
      background-image: radial-gradient(circle at 50% 0%, #1c1917 0%, #000000 100%);
      border: 1px solid #ea580c;
      transform: translateY(-50%) translateX(2.1rem) rotate(-225deg);
    }
    .toggle-input:checked + .toggle-label .cont-icon .sparkle {
      z-index: -10;
      width: calc(var(--width) * 1.2px);
      background-color: #ea580c;
      animation: sparkle calc(40s / var(--duration)) linear calc(2s / var(--duration)) infinite;
    }

    @media (max-width: 768px) {
      .header {
        padding: 0 16px;
        height: 60px;
      }
      .page-title {
        font-size: 16px;
      }
      .user-email {
        display: none;
      }
      .logout-label {
        display: none;
      }
      .logout-btn {
        padding: 8px;
      }
      .toggle-cont {
        margin-right: 8px;
      }
    }
  `]
})
export class HeaderComponent {
  title = input.required<string>();
  role = input<string>('EMPLOYEE');
  email = input<string>('');

  logout = output<void>();

  protected readonly themeService = inject(ThemeService);

  onLogout() {
    this.logout.emit();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  getInitials(email: string | undefined): string {
    if (!email) return 'EE';
    const namePart = email.split('@')[0];
    if (namePart.includes('.')) {
      return namePart.split('.')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return namePart.substring(0, 2).toUpperCase();
  }
}
