import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'SnapTools — Outils gratuits hors-ligne'
  },
  {
    path: 'salaire-brut-net',
    loadComponent: () => import('./pages/salary/salary.component').then((m) => m.SalaryComponent),
    title: 'Calcul Salaire Brut en Net Précis et Rapide - SnapTools'
  },
  {
    path: 'calculatrice-scientifique',
    loadComponent: () =>
      import('./pages/scientific-calculator/scientific-calculator.component').then(
        (m) => m.ScientificCalculatorComponent
      ),
    title: 'Calculatrice Scientifique en Ligne Gratuite - SnapTools'
  },
  {
    path: 'rendement-bourse',
    loadComponent: () =>
      import('./pages/stock-returns/stock-returns.component').then((m) => m.StockReturnsComponent),
    title: 'Calcul Rendement Bourse et Intérêts Composés - SnapTools'
  },
  {
    path: 'convertisseur-devises',
    loadComponent: () =>
      import('./pages/currency-converter/currency-converter.component').then(
        (m) => m.CurrencyConverterComponent
      ),
    title: 'Convertisseur de Devises Gratuit et Hors-Ligne - SnapTools'
  },
  {
    path: 'dictionnaire',
    loadComponent: () =>
      import('./pages/dictionary/dictionary.component').then((m) => m.DictionaryComponent),
    title: 'Dictionnaire en Ligne Rapide - SnapTools'
  },
  {
    path: 'traducteur',
    loadComponent: () =>
      import('./pages/translator/translator.component').then((m) => m.TranslatorComponent),
    title: 'Traducteur de Texte avec Voix - SnapTools'
  },
  {
    path: 'qr-code',
    loadComponent: () => import('./pages/qr-code/qr-code.component').then((m) => m.QrCodeComponent),
    title: 'Générateur et Scanner de QR Code - SnapTools'
  },
  {
    path: 'generateur-mot-de-passe',
    loadComponent: () =>
      import('./pages/password-generator/password-generator.component').then(
        (m) => m.PasswordGeneratorComponent
      ),
    title: 'Générateur de Mot de Passe Sécurisé - SnapTools'
  },
  {
    path: 'minuteur-multiple',
    loadComponent: () =>
      import('./pages/multi-timer/multi-timer.component').then((m) => m.MultiTimerComponent),
    title: 'Minuteur Multiple en Ligne - SnapTools'
  },
  {
    path: 'selecteur-aleatoire',
    loadComponent: () =>
      import('./pages/random-picker/random-picker.component').then((m) => m.RandomPickerComponent),
    title: 'Sélecteur Aléatoire - Tirage au Sort - SnapTools'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
