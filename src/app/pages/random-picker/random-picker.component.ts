import { isPlatformBrowser } from '@angular/common';
import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';

const STORAGE_KEY = 'snaptools.random-picker';
const SPIN_DURATION_MS = 900;
const SPIN_INTERVAL_MS = 70;

@Component({
  selector: 'app-random-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './random-picker.component.html',
  styleUrl: './random-picker.component.css'
})
export class RandomPickerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    items: ['Pizza\nSushi\nBurger\nSalade\nTacos'],
    removeAfterPick: [false]
  });

  result: string | null = null;
  spinningLabel = '';
  isSpinning = false;
  history: string[] = [];

  private readonly isBrowser: boolean;

  constructor(
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Sélecteur Aléatoire - Tirage au Sort - SnapTools',
      description:
        'Effectuez un tirage au sort équitable parmi une liste d\'options : repas, idées, équipes, prénoms. Historique des tirages conservé.',
      keywords: 'tirage au sort, sélecteur aléatoire, roue de la fortune, choix aléatoire',
      path: '/selecteur-aleatoire'
    });

    if (this.isBrowser) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          this.form.patchValue(saved.form ?? {}, { emitEvent: false });
          this.history = saved.history ?? [];
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }

  get items(): string[] {
    return (this.form.value.items ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  pick(): void {
    const items = this.items;

    if (items.length === 0 || this.isSpinning) {
      return;
    }

    this.isSpinning = true;
    this.result = null;

    let elapsed = 0;
    const interval = setInterval(() => {
      this.spinningLabel = items[Math.floor(Math.random() * items.length)];
      elapsed += SPIN_INTERVAL_MS;

      if (elapsed >= SPIN_DURATION_MS) {
        clearInterval(interval);
        const winner = items[Math.floor(Math.random() * items.length)];
        this.result = winner;
        this.spinningLabel = '';
        this.isSpinning = false;
        this.history = [winner, ...this.history].slice(0, 10);

        if (this.form.value.removeAfterPick) {
          const remaining = items.filter((item) => item !== winner);
          this.form.patchValue({ items: remaining.join('\n') });
        }

        this.save();
      }
    }, SPIN_INTERVAL_MS);
  }

  clearHistory(): void {
    this.history = [];
    this.save();
  }

  onItemsChange(): void {
    this.save();
  }

  private save(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form: this.form.getRawValue(), history: this.history })
    );
  }
}
