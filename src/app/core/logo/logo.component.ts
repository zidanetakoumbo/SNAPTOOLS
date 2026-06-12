import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      [attr.width]="size"
      [attr.height]="size"
      [style.border-radius.%]="22"
      src="icons/icon-192x192.png"
      alt="Logo SnapTools"
    />
  `
})
export class LogoComponent {
  @Input() size = 36;
}
