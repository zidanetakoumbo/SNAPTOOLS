import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/seo.service';

type SalaryStatus = 'non-cadre' | 'cadre' | 'fonction-publique' | 'independant';
type SalaryDirection = 'brutToNet' | 'netToBrut';
type SalaryPeriod = 'mensuel' | 'annuel';

interface SalaryRates {
  salarial: number;
  patronal: number;
  label: string;
}

interface SalaryResult {
  brutMensuel: number;
  netMensuel: number;
  brutAnnuel: number;
  netAnnuel: number;
  chargesSalariales: number;
  chargesPatronales: number;
  coutEmployeurMensuel: number;
}

const STORAGE_KEY = 'snaptools.salary-form';

const STATUS_RATES: Record<SalaryStatus, SalaryRates> = {
  'non-cadre': { salarial: 0.22, patronal: 0.42, label: 'Salarié non-cadre (privé)' },
  cadre: { salarial: 0.25, patronal: 0.45, label: 'Salarié cadre (privé)' },
  'fonction-publique': { salarial: 0.15, patronal: 0.4, label: 'Fonction publique' },
  independant: { salarial: 0.3, patronal: 0, label: 'Travailleur indépendant (TNS)' }
};

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './salary.component.html',
  styleUrl: './salary.component.css'
})
export class SalaryComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly statusOptions = Object.entries(STATUS_RATES).map(([value, rates]) => ({
    value: value as SalaryStatus,
    label: rates.label
  }));

  readonly form = this.fb.group({
    amount: [2500, [Validators.required, Validators.min(0)]],
    direction: ['brutToNet' as SalaryDirection, Validators.required],
    status: ['non-cadre' as SalaryStatus, Validators.required],
    period: ['mensuel' as SalaryPeriod, Validators.required]
  });

  result: SalaryResult | null = null;
  private readonly isBrowser: boolean;

  constructor(
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Calcul Salaire Brut en Net Précis et Rapide - SnapTools',
      description:
        'Convertissez votre salaire brut en net (ou inversement) selon votre statut : non-cadre, cadre, fonction publique ou indépendant. Calcul instantané et hors-ligne.',
      keywords: 'calcul salaire, brut net, conversion salaire, cotisations sociales, salaire net',
      path: '/salaire-brut-net'
    });

    this.restoreFromStorage();
    this.calculate();
  }

  calculate(): void {
    if (this.form.invalid) {
      this.result = null;
      return;
    }

    const { amount, direction, status, period } = this.form.getRawValue();
    const rates = STATUS_RATES[status as SalaryStatus];
    const value = Number(amount);

    const monthlyValue = period === 'annuel' ? value / 12 : value;

    let brutMensuel: number;
    let netMensuel: number;

    if (direction === 'brutToNet') {
      brutMensuel = monthlyValue;
      netMensuel = brutMensuel * (1 - rates.salarial);
    } else {
      netMensuel = monthlyValue;
      brutMensuel = netMensuel / (1 - rates.salarial);
    }

    const chargesSalariales = brutMensuel - netMensuel;
    const chargesPatronales = brutMensuel * rates.patronal;
    const coutEmployeurMensuel = brutMensuel + chargesPatronales;

    this.result = {
      brutMensuel,
      netMensuel,
      brutAnnuel: brutMensuel * 12,
      netAnnuel: netMensuel * 12,
      chargesSalariales,
      chargesPatronales,
      coutEmployeurMensuel
    };

    this.saveToStorage();
  }

  private restoreFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw);
      this.form.patchValue(saved, { emitEvent: false });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private saveToStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
  }
}
