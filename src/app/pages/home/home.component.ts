import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdBannerComponent } from '../../core/ads/ad-banner.component';
import { SeoService } from '../../core/seo.service';

interface ToolCard {
  route: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AdBannerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  readonly tools: ToolCard[] = [
    {
      route: '/salaire-brut-net',
      icon: '💶',
      title: 'Salaire Brut / Net',
      description: 'Calculez votre salaire net à partir du brut'
    },
    {
      route: '/calculatrice-scientifique',
      icon: '🧮',
      title: 'Calculatrice',
      description: 'Fonctions scientifiques et historique'
    },
    {
      route: '/rendement-bourse',
      icon: '📈',
      title: 'Rendement Bourse',
      description: 'Intérêts composés et projection'
    },
    {
      route: '/convertisseur-devises',
      icon: '💱',
      title: 'Devises',
      description: 'Convertisseur de devises hors-ligne'
    },
    {
      route: '/dictionnaire',
      icon: '📖',
      title: 'Dictionnaire',
      description: 'Recherche rapide de définitions'
    },
    {
      route: '/traducteur',
      icon: '🌐',
      title: 'Traducteur',
      description: 'Traduction et synthèse vocale'
    },
    {
      route: '/qr-code',
      icon: '🔳',
      title: 'QR Code',
      description: 'Scanner et générer des QR codes'
    },
    {
      route: '/generateur-mot-de-passe',
      icon: '🔐',
      title: 'Mots de passe',
      description: 'Générateur de mots de passe sûrs'
    },
    {
      route: '/minuteur-multiple',
      icon: '⏱️',
      title: 'Multi-Minuteur',
      description: 'Plusieurs comptes à rebours'
    },
    {
      route: '/selecteur-aleatoire',
      icon: '🎲',
      title: 'Sélecteur Aléatoire',
      description: 'Tirage au sort dans une liste'
    }
  ];

  readonly searchQuery = signal('');

  readonly filteredTools = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.tools;
    }
    return this.tools.filter(
      (tool) => tool.title.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query)
    );
  });

  constructor(private readonly seo: SeoService) {}

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'SnapTools — Boîte à outils gratuite hors-ligne (calculatrice, devises, traducteur)',
      description:
        'SnapTools regroupe 10 outils gratuits et rapides : calcul brut/net, calculatrice scientifique, rendement bourse, convertisseur de devises, dictionnaire, traducteur et plus, utilisables hors-ligne.',
      keywords: 'calculateur, brut net, rendement bourse, convertisseur devises, outils gratuits, pwa',
      path: '/'
    });
  }
}
