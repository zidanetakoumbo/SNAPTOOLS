import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HapticsService } from '../haptics.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.bounce]="bounce()"
      (click)="cycle()"
      [attr.aria-label]="label()"
      [title]="label()"
    >
      <span class="theme-icon" aria-hidden="true">{{ icon() }}</span>
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid var(--color-border);
        border-radius: 50%;
        background: var(--color-surface);
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.12s ease;
      }

      .theme-toggle:hover {
        background: var(--color-bg);
      }

      .theme-toggle:active {
        transform: scale(0.9);
      }

      .theme-icon {
        font-size: 1.15rem;
        line-height: 1;
        display: inline-block;
      }

      .bounce .theme-icon {
        animation: theme-icon-pop 0.35s ease;
      }

      @keyframes theme-icon-pop {
        0% {
          transform: scale(0.4) rotate(-25deg);
          opacity: 0;
        }
        60% {
          transform: scale(1.15) rotate(8deg);
          opacity: 1;
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
    `
  ]
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeService);
  private readonly haptics = inject(HapticsService);

  readonly bounce = signal(false);

  readonly icon = computed(() => {
    switch (this.theme.mode()) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '🖥️';
    }
  });

  readonly label = computed(() => {
    switch (this.theme.mode()) {
      case 'light':
        return 'Thème clair — appuyer pour passer au thème sombre';
      case 'dark':
        return 'Thème sombre — appuyer pour suivre le thème du système';
      default:
        return 'Thème système — appuyer pour passer au thème clair';
    }
  });

  cycle(): void {
    this.haptics.tap();
    this.theme.cycle();
    this.bounce.set(false);
    requestAnimationFrame(() => this.bounce.set(true));
    setTimeout(() => this.bounce.set(false), 350);
  }
}
