import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, firstValueFrom, of } from 'rxjs';
import { SeoService } from '../../core/seo.service';

interface RatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface TimeseriesResponse {
  base: string;
  rates: Record<string, Record<string, number>>;
}

interface CachedRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const STORAGE_KEY = 'snaptools.currency-rates';
const FORM_STORAGE_KEY = 'snaptools.currency-form';
const API_BASE = 'https://api.frankfurter.app';

const CURRENCY_NAMES: Partial<Record<string, string>> = {
  EUR: 'Euro',
  USD: 'Dollar américain',
  GBP: 'Livre sterling',
  JPY: 'Yen japonais',
  CHF: 'Franc suisse',
  CAD: 'Dollar canadien',
  AUD: 'Dollar australien',
  CNY: 'Yuan chinois',
  SEK: 'Couronne suédoise',
  NOK: 'Couronne norvégienne',
  PLN: 'Zloty polonais',
  MAD: 'Dirham marocain'
};

@Component({
  selector: 'app-currency-converter',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './currency-converter.component.html',
  styleUrl: './currency-converter.component.css'
})
export class CurrencyConverterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    amount: [1000, [Validators.required, Validators.min(0)]],
    from: ['EUR', Validators.required],
    to: ['USD', Validators.required]
  });

  currencies: string[] = ['EUR'];
  readonly currencyNames: Partial<Record<string, string>> = CURRENCY_NAMES;
  convertedAmount: number | null = null;
  rate: number | null = null;
  rateDate = '';
  isOffline = false;
  isLoading = false;
  errorMessage = '';

  sparklinePath = '';
  sparklineMin = 0;
  sparklineMax = 0;
  readonly chartWidth = 280;
  readonly chartHeight = 60;

  private cachedRates: CachedRates | null = null;
  private readonly isBrowser: boolean;

  constructor(
    private readonly http: HttpClient,
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    this.seo.update({
      title: 'Convertisseur de Devises Gratuit et Hors-Ligne - SnapTools',
      description:
        'Convertissez instantanément entre plus de 10 devises avec les derniers taux de change. Le dernier taux récupéré est conservé pour une utilisation hors-ligne.',
      keywords: 'convertisseur devises, taux de change, conversion monnaie, devises en ligne',
      path: '/convertisseur-devises'
    });

    if (this.isBrowser) {
      this.isOffline = !navigator.onLine;
      window.addEventListener('online', () => (this.isOffline = false));
      window.addEventListener('offline', () => (this.isOffline = true));

      this.restoreForm();
      this.loadCachedRates();
    }

    if (this.cachedRates) {
      this.currencies = this.buildCurrencyList(this.cachedRates.rates);
      this.convert();
    } else {
      this.currencies = this.buildCurrencyList({ USD: 1, GBP: 1, JPY: 1, CHF: 1, CAD: 1, AUD: 1, CNY: 1 });
    }

    if (this.isBrowser && navigator.onLine) {
      await this.updateRates();
    }
  }

  async updateRates(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const response = await firstValueFrom(
      this.http.get<RatesResponse>(`${API_BASE}/latest?from=EUR`).pipe(catchError(() => of(null)))
    );

    if (!response) {
      this.isLoading = false;
      if (!this.cachedRates) {
        this.errorMessage = 'Impossible de récupérer les taux de change. Vérifiez votre connexion.';
      }
      return;
    }

    const rates = { ...response.rates, EUR: 1 };
    this.cachedRates = { base: 'EUR', date: response.date, rates };
    this.currencies = this.buildCurrencyList(rates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedRates));

    this.convert();
    await this.loadSparkline();
    this.isLoading = false;
  }

  convert(): void {
    if (this.form.invalid || !this.cachedRates) {
      this.convertedAmount = null;
      this.rate = null;
      return;
    }

    const { amount, from, to } = this.form.getRawValue();
    const rates = this.cachedRates.rates;

    if (!(from! in rates) || !(to! in rates)) {
      this.convertedAmount = null;
      this.rate = null;
      return;
    }

    const rateFromTo = rates[to!] / rates[from!];
    this.rate = rateFromTo;
    this.convertedAmount = Number(amount) * rateFromTo;
    this.rateDate = this.cachedRates.date;
    this.saveForm();
  }

  swap(): void {
    const { from, to } = this.form.getRawValue();
    this.form.patchValue({ from: to, to: from });
    this.convert();
    if (this.isBrowser && navigator.onLine) {
      void this.loadSparkline();
    }
  }

  private buildCurrencyList(rates: Record<string, number>): string[] {
    const keys = new Set(['EUR', ...Object.keys(rates)]);
    return Array.from(keys).sort();
  }

  private restoreForm(): void {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const saved = JSON.parse(raw);
      this.form.patchValue(saved, { emitEvent: false });
    } catch {
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }

  private saveForm(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
  }

  private loadCachedRates(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      this.cachedRates = JSON.parse(raw);
      this.rateDate = this.cachedRates?.date ?? '';
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private async loadSparkline(): Promise<void> {
    if (!this.isBrowser || !navigator.onLine) {
      return;
    }

    const { from, to } = this.form.getRawValue();
    if (from === to) {
      this.sparklinePath = '';
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const response = await firstValueFrom(
      this.http
        .get<TimeseriesResponse>(`${API_BASE}/${startStr}..${endStr}?from=${from}&to=${to}`)
        .pipe(catchError(() => of(null)))
    );

    if (!response) {
      this.sparklinePath = '';
      return;
    }

    const values = Object.keys(response.rates)
      .sort()
      .map((date) => response.rates[date][to!])
      .filter((v) => typeof v === 'number');

    if (values.length < 2) {
      this.sparklinePath = '';
      return;
    }

    this.buildSparkline(values);
  }

  private buildSparkline(values: number[]): void {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = this.chartWidth;
    const h = this.chartHeight;
    const stepX = w / (values.length - 1);

    this.sparklineMin = min;
    this.sparklineMax = max;

    this.sparklinePath = values
      .map((v, i) => {
        const x = i * stepX;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }
}
