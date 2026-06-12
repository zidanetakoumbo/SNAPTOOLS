import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { AngleMode, evaluateExpression } from './calculator-engine';

interface HistoryEntry {
  expression: string;
  result: string;
}

interface CalcButton {
  label: string;
  value: string;
  type: 'digit' | 'operator' | 'function' | 'constant' | 'action';
  ariaLabel: string;
}

const HISTORY_KEY = 'snaptools.calculator-history';
const MAX_HISTORY = 20;

const BUTTON_ROWS: CalcButton[][] = [
  [
    { label: '(', value: '(', type: 'operator', ariaLabel: 'Parenthèse ouvrante' },
    { label: ')', value: ')', type: 'operator', ariaLabel: 'Parenthèse fermante' },
    { label: 'AC', value: 'AC', type: 'action', ariaLabel: 'Tout effacer' },
    { label: 'DEL', value: 'DEL', type: 'action', ariaLabel: 'Supprimer le dernier caractère' }
  ],
  [
    { label: 'sin', value: 'sin(', type: 'function', ariaLabel: 'Sinus' },
    { label: 'cos', value: 'cos(', type: 'function', ariaLabel: 'Cosinus' },
    { label: 'tan', value: 'tan(', type: 'function', ariaLabel: 'Tangente' },
    { label: 'xʸ', value: '^', type: 'operator', ariaLabel: 'Puissance' }
  ],
  [
    { label: 'asin', value: 'asin(', type: 'function', ariaLabel: 'Arc sinus' },
    { label: 'acos', value: 'acos(', type: 'function', ariaLabel: 'Arc cosinus' },
    { label: 'atan', value: 'atan(', type: 'function', ariaLabel: 'Arc tangente' },
    { label: '√', value: 'sqrt(', type: 'function', ariaLabel: 'Racine carrée' }
  ],
  [
    { label: 'log', value: 'log(', type: 'function', ariaLabel: 'Logarithme base 10' },
    { label: 'ln', value: 'ln(', type: 'function', ariaLabel: 'Logarithme naturel' },
    { label: 'π', value: 'pi', type: 'constant', ariaLabel: 'Pi' },
    { label: 'e', value: 'e', type: 'constant', ariaLabel: 'Constante e' }
  ],
  [
    { label: '7', value: '7', type: 'digit', ariaLabel: 'Sept' },
    { label: '8', value: '8', type: 'digit', ariaLabel: 'Huit' },
    { label: '9', value: '9', type: 'digit', ariaLabel: 'Neuf' },
    { label: '÷', value: '/', type: 'operator', ariaLabel: 'Division' }
  ],
  [
    { label: '4', value: '4', type: 'digit', ariaLabel: 'Quatre' },
    { label: '5', value: '5', type: 'digit', ariaLabel: 'Cinq' },
    { label: '6', value: '6', type: 'digit', ariaLabel: 'Six' },
    { label: '×', value: '*', type: 'operator', ariaLabel: 'Multiplication' }
  ],
  [
    { label: '1', value: '1', type: 'digit', ariaLabel: 'Un' },
    { label: '2', value: '2', type: 'digit', ariaLabel: 'Deux' },
    { label: '3', value: '3', type: 'digit', ariaLabel: 'Trois' },
    { label: '−', value: '-', type: 'operator', ariaLabel: 'Soustraction' }
  ],
  [
    { label: '0', value: '0', type: 'digit', ariaLabel: 'Zéro' },
    { label: '.', value: '.', type: 'digit', ariaLabel: 'Virgule décimale' },
    { label: '%', value: '%', type: 'operator', ariaLabel: 'Pourcentage' },
    { label: '+', value: '+', type: 'operator', ariaLabel: 'Addition' }
  ]
];

@Component({
  selector: 'app-scientific-calculator',
  standalone: true,
  imports: [],
  templateUrl: './scientific-calculator.component.html',
  styleUrl: './scientific-calculator.component.css'
})
export class ScientificCalculatorComponent implements OnInit {
  readonly buttonRows = BUTTON_ROWS;

  expression = '';
  display = '0';
  angleMode: AngleMode = 'deg';
  history: HistoryEntry[] = [];
  errorMessage = '';

  private readonly isBrowser: boolean;

  constructor(private readonly seo: SeoService, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Calculatrice Scientifique en Ligne Gratuite - SnapTools',
      description:
        'Calculatrice scientifique gratuite avec fonctions trigonométriques, logarithmes, puissances et historique des calculs. Fonctionne hors-ligne.',
      keywords: 'calculatrice scientifique, calculatrice en ligne, trigonométrie, logarithme',
      path: '/calculatrice-scientifique'
    });

    if (this.isBrowser) {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        try {
          this.history = JSON.parse(raw);
        } catch {
          this.history = [];
        }
      }
    }
  }

  press(button: CalcButton): void {
    this.errorMessage = '';

    switch (button.value) {
      case 'AC':
        this.expression = '';
        this.display = '0';
        return;
      case 'DEL':
        this.expression = this.expression.slice(0, -1);
        this.display = this.expression || '0';
        return;
    }

    this.expression += button.value;
    this.display = this.expression;
  }

  setAngleMode(mode: AngleMode): void {
    this.angleMode = mode;
  }

  evaluate(): void {
    if (!this.expression.trim()) {
      return;
    }

    try {
      const result = evaluateExpression(this.expression, this.angleMode);
      const formatted = this.formatResult(result);

      this.history.unshift({ expression: this.expression, result: formatted });
      this.history = this.history.slice(0, MAX_HISTORY);
      this.saveHistory();

      this.display = formatted;
      this.expression = formatted;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Erreur de calcul';
    }
  }

  useHistoryEntry(entry: HistoryEntry): void {
    this.expression = entry.result;
    this.display = entry.result;
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  private formatResult(value: number): string {
    if (Math.abs(value) < 1e-12) {
      return '0';
    }
    const rounded = Math.round(value * 1e10) / 1e10;
    return rounded.toString();
  }

  private saveHistory(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }
}
