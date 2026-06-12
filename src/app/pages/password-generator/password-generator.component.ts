import { isPlatformBrowser } from '@angular/common';
import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const AMBIGUOUS_CHARS = 'il1Lo0O';

const STORAGE_KEY = 'snaptools.password-options';

type Strength = 'Faible' | 'Moyen' | 'Fort' | 'Très fort';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './password-generator.component.html',
  styleUrl: './password-generator.component.css'
})
export class PasswordGeneratorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    length: [16],
    uppercase: [true],
    lowercase: [true],
    numbers: [true],
    symbols: [true],
    excludeAmbiguous: [false]
  });

  password = '';
  strength: Strength = 'Moyen';
  entropyBits = 0;
  copyStatus = '';
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
      title: 'Générateur de Mot de Passe Sécurisé - SnapTools',
      description:
        'Générez des mots de passe aléatoires et sécurisés avec des options personnalisables : longueur, majuscules, chiffres, symboles. Fonctionne hors-ligne.',
      keywords: 'générateur mot de passe, mot de passe sécurisé, générateur aléatoire',
      path: '/generateur-mot-de-passe'
    });

    if (this.isBrowser) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          this.form.patchValue(JSON.parse(raw), { emitEvent: false });
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    this.generate();
  }

  generate(): void {
    const options = this.form.getRawValue();
    let pool = '';

    if (options.lowercase) pool += CHAR_SETS.lowercase;
    if (options.uppercase) pool += CHAR_SETS.uppercase;
    if (options.numbers) pool += CHAR_SETS.numbers;
    if (options.symbols) pool += CHAR_SETS.symbols;

    if (options.excludeAmbiguous) {
      pool = pool
        .split('')
        .filter((char) => !AMBIGUOUS_CHARS.includes(char))
        .join('');
    }

    if (!pool) {
      this.password = '';
      this.entropyBits = 0;
      this.strength = 'Faible';
      return;
    }

    const length = Math.min(Math.max(options.length ?? 16, 4), 128);
    const bytes = this.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += pool[bytes[i] % pool.length];
    }

    this.password = result;
    this.entropyBits = Math.round(length * Math.log2(pool.length));
    this.strength = this.computeStrength(this.entropyBits);

    this.history = [result, ...this.history].slice(0, 5);
    this.saveOptions();
  }

  async copy(): Promise<void> {
    if (!this.isBrowser || !this.password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.password);
      this.copyStatus = 'Copié !';
    } catch {
      this.copyStatus = 'Impossible de copier.';
    }

    setTimeout(() => (this.copyStatus = ''), 2000);
  }

  private randomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    if (this.isBrowser && 'crypto' in window) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  }

  private computeStrength(bits: number): Strength {
    if (bits < 40) return 'Faible';
    if (bits < 64) return 'Moyen';
    if (bits < 100) return 'Fort';
    return 'Très fort';
  }

  private saveOptions(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
  }
}
