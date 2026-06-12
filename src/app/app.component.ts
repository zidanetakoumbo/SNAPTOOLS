import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from './core/logo/logo.component';
import { ThemeToggleComponent } from './core/theme/theme-toggle.component';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LogoComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Eagerly instantiated so the theme effect (data-theme attribute) runs as soon as the app boots.
  private readonly theme = inject(ThemeService);

  readonly year = new Date().getFullYear();
}
