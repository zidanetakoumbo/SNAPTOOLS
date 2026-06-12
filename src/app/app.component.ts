import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker'; // ⭐️ Import du Service Worker
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
export class AppComponent implements OnInit { // ⭐️ Ajout de OnInit ici
  // Eagerly instantiated so the theme effect (data-theme attribute) runs as soon as the app boots.
  private readonly theme = inject(ThemeService);
  private readonly swUpdate = inject(SwUpdate); // ⭐️ Injection du service de mise à jour

  readonly year = new Date().getFullYear();

  ngOnInit() {
    // ⭐️ Logique de détection de mise à jour de la PWA
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(evt => {
        if (evt.type === 'VERSION_READY') {
          if (confirm('Une nouvelle version de SnapTools est disponible. Souhaitez-vous actualiser ?')) {
            window.location.reload();
          }
        }
      });
    }
  }
}