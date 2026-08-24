import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hex-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hex-gauge-wrapper">
      <svg class="hex-gauge-svg" viewBox="0 0 70 70" aria-label="Skill level gauge">
        <defs>
          <!-- Unique gradient per instance is safer, but global works since it has a static ID -->
          <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--secondary-light)" /> <!-- Sky blue -->
            <stop offset="100%" stop-color="var(--primary-accent)" /> <!-- Violet -->
          </linearGradient>
        </defs>
        
        <!-- Background Track -->
        <circle 
          cx="35" 
          cy="35" 
          r="28" 
          fill="none" 
          stroke="var(--border-color)" 
          stroke-width="3.5" 
        />
        
        <!-- Active Progress Ring -->
        <circle 
          cx="35" 
          cy="35" 
          r="28" 
          fill="none" 
          stroke="url(#gaugeGradient)" 
          stroke-width="3.5" 
          [attr.stroke-dasharray]="circumference" 
          [attr.stroke-dashoffset]="dashOffset()" 
          stroke-linecap="round"
          transform="rotate(-90 35 35)"
          class="progress-circle"
        />
        
        <!-- Hexagon Badge in center -->
        <!-- Center = (35, 35). R = 18. Coordinates for flat-topped hexagon -->
        <polygon 
          points="35,16 51,25 51,45 35,54 19,45 19,25" 
          fill="var(--bg-card)" 
          stroke="var(--border-color)" 
          stroke-width="1.5" 
          class="center-hex"
        />
        
        <!-- Level Text inside -->
        <text 
          x="35" 
          y="39" 
          text-anchor="middle" 
          class="level-text"
        >
          L{{ value() }}
        </text>
      </svg>
      <span class="sr-only">Level {{ value() }} of 10</span>
    </div>
  `,
  styles: [`
    .hex-gauge-wrapper {
      display: inline-block;
      position: relative;
      width: 60px;
      height: 60px;
    }
    .hex-gauge-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .progress-circle {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .center-hex {
      transition: fill 0.3s ease, stroke 0.3s ease;
      
      &:hover {
        fill: var(--bg-hover);
        stroke: var(--primary-accent);
      }
    }
    .level-text {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      fill: var(--text-primary);
      pointer-events: none;
      letter-spacing: -0.02em;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class HexGaugeComponent {
  value = input.required<number>(); // 0 to 10 scale
  
  readonly circumference = 2 * Math.PI * 28; // ~175.93

  dashOffset = computed(() => {
    const val = Math.min(Math.max(this.value(), 0), 10);
    return this.circumference * (1 - val / 10);
  });
}
