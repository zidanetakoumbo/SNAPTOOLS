import { isPlatformBrowser } from '@angular/common';
import { Component, inject, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/seo.service';

interface TimerItem {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: 'idle' | 'running' | 'paused' | 'finished';
}

const STORAGE_KEY = 'snaptools.multi-timers';

@Component({
  selector: 'app-multi-timer',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './multi-timer.component.html',
  styleUrl: './multi-timer.component.css'
})
export class MultiTimerComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    label: ['Minuteur', Validators.required],
    minutes: [5, [Validators.required, Validators.min(0), Validators.max(180)]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59)]]
  });

  timers: TimerItem[] = [];

  private readonly isBrowser: boolean;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private audioContext: AudioContext | null = null;

  constructor(
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Minuteur Multiple en Ligne - SnapTools',
      description:
        'Lancez plusieurs comptes à rebours en même temps : cuisine, sport, pauses. Alerte sonore à la fin de chaque minuteur.',
      keywords: 'minuteur en ligne, compte à rebours, multi-minuteur, chronomètre',
      path: '/minuteur-multiple'
    });

    if (this.isBrowser) {
      this.restore();
      this.intervalId = setInterval(() => this.tick(), 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  addTimer(): void {
    if (this.form.invalid) {
      return;
    }

    const { label, minutes, seconds } = this.form.getRawValue();
    const totalSeconds = Number(minutes) * 60 + Number(seconds);

    if (totalSeconds <= 0) {
      return;
    }

    this.timers = [
      ...this.timers,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: label || 'Minuteur',
        totalSeconds,
        remainingSeconds: totalSeconds,
        status: 'idle'
      }
    ];

    this.save();
  }

  start(timer: TimerItem): void {
    timer.status = 'running';
    this.save();
  }

  pause(timer: TimerItem): void {
    timer.status = 'paused';
    this.save();
  }

  reset(timer: TimerItem): void {
    timer.remainingSeconds = timer.totalSeconds;
    timer.status = 'idle';
    this.save();
  }

  remove(timer: TimerItem): void {
    this.timers = this.timers.filter((t) => t.id !== timer.id);
    this.save();
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  progress(timer: TimerItem): number {
    if (timer.totalSeconds === 0) {
      return 0;
    }
    return Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100);
  }

  private tick(): void {
    let changed = false;

    for (const timer of this.timers) {
      if (timer.status === 'running' && timer.remainingSeconds > 0) {
        timer.remainingSeconds--;
        changed = true;

        if (timer.remainingSeconds === 0) {
          timer.status = 'finished';
          this.playAlert();
        }
      }
    }

    if (changed) {
      this.save();
    }
  }

  private playAlert(): void {
    if (!this.isBrowser) {
      return;
    }

    if (!this.audioContext) {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextCtor();
    }

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
  }

  private save(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.timers));
  }

  private restore(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const saved: TimerItem[] = JSON.parse(raw);
      this.timers = saved.map((timer) => ({
        ...timer,
        status: timer.status === 'running' ? 'paused' : timer.status
      }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
