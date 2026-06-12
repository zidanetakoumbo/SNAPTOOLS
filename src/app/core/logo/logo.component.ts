import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo SnapTools"
    >
      <defs>
        <linearGradient id="snaptools-logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0087e6" />
          <stop offset="1" stop-color="#7b2ff7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#snaptools-logo-gradient)" />
      <path
        d="M44 14H24c-1.5 0-2.8 1-3.3 2.4l-4 11.2c-.6 1.7.6 3.4 2.4 3.4h9.4l-4.9 16.6c-.5 1.6 1.5 2.7 2.6 1.4L46.9 27.8c1.3-1.5.2-3.8-1.8-3.8h-9.4l5.2-7.6c.8-1.2-.1-2.4-1.5-2.4z"
        fill="#ffffff"
      />
      <path
        d="M30 12c5 0 8 2.5 8 6.5S35 24 30 24h-4l1.5-6h2.5c1.8 0 2.8-.7 2.8-1.9 0-1.1-.9-1.8-2.6-1.8h-5.6L22 24"
        fill="none"
      />
    </svg>
  `
})
export class LogoComponent {
  @Input() size = 36;
}
