import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/seo.service';

interface YearlyPoint {
  year: number;
  invested: number;
  value: number;
}

interface ProjectionResult {
  finalValue: number;
  totalInvested: number;
  totalInterest: number;
  points: YearlyPoint[];
}

@Component({
  selector: 'app-stock-returns',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './stock-returns.component.html',
  styleUrl: './stock-returns.component.css'
})
export class StockReturnsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);

  readonly form = this.fb.group({
    initialCapital: [1000, [Validators.required, Validators.min(0)]],
    monthlyContribution: [100, [Validators.required, Validators.min(0)]],
    annualRate: [7, [Validators.required, Validators.min(-50), Validators.max(100)]],
    years: [10, [Validators.required, Validators.min(1), Validators.max(60)]]
  });

  result: ProjectionResult | null = null;

  readonly chartWidth = 320;
  readonly chartHeight = 160;

  chartPath = '';
  chartAreaPath = '';
  chartInvestedPath = '';


  ngOnInit(): void {
    this.seo.update({
      title: 'Calcul Rendement Bourse et Intérêts Composés - SnapTools',
      description:
        'Simulez le rendement de vos investissements en bourse avec les intérêts composés : capital initial, versements mensuels, taux annuel et durée. Graphique de projection inclus.',
      keywords: 'rendement bourse, intérêts composés, simulateur investissement, calcul placement',
      path: '/rendement-bourse'
    });

    this.calculate();
  }

  calculate(): void {
    if (this.form.invalid) {
      this.result = null;
      return;
    }

    const { initialCapital, monthlyContribution, annualRate, years } = this.form.getRawValue();

    const monthlyRate = Number(annualRate) / 100 / 12;
    const points: YearlyPoint[] = [];

    let value = Number(initialCapital);
    let invested = Number(initialCapital);

    points.push({ year: 0, invested, value });

    for (let year = 1; year <= Number(years); year++) {
      for (let month = 0; month < 12; month++) {
        value = value * (1 + monthlyRate) + Number(monthlyContribution);
        invested += Number(monthlyContribution);
      }
      points.push({ year, invested, value });
    }

    const finalValue = value;

    this.result = {
      finalValue,
      totalInvested: invested,
      totalInterest: finalValue - invested,
      points
    };

    this.buildChart(points);
  }

  private buildChart(points: YearlyPoint[]): void {
    const maxValue = Math.max(...points.map((p) => Math.max(p.value, p.invested)), 1);
    const w = this.chartWidth;
    const h = this.chartHeight;
    const stepX = points.length > 1 ? w / (points.length - 1) : 0;

    const toXY = (point: YearlyPoint) => {
      const x = point.year * stepX;
      const yValue = h - (point.value / maxValue) * h;
      const yInvested = h - (point.invested / maxValue) * h;
      return { x, yValue, yInvested };
    };

    const valueCoords = points.map(toXY);

    this.chartPath = valueCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yValue.toFixed(2)}`)
      .join(' ');

    this.chartInvestedPath = valueCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yInvested.toFixed(2)}`)
      .join(' ');

    const areaPoints = valueCoords.map((c) => `${c.x.toFixed(2)} ${c.yValue.toFixed(2)}`).join(' L ');
    this.chartAreaPath = `M 0 ${h} L ${areaPoints} L ${w} ${h} Z`;
  }
}
