import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import * as QRCode from 'qrcode';
import { SeoService } from '../../core/seo.service';

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
    };
  }
}

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css'
})
export class QrCodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  readonly textControl = new FormControl('https://snaptools.app', { nonNullable: true });

  qrDataUrl = '';
  errorMessage = '';

  scannerSupported = false;
  isScanning = false;
  scanResult = '';
  scanError = '';

  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;
  private mediaStream: MediaStream | null = null;
  private scanIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly seo: SeoService, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Générateur et Scanner de QR Code - SnapTools',
      description:
        'Générez un QR code à partir de texte ou d\'un lien et téléchargez-le en image. Scannez un QR code directement avec la caméra de votre appareil.',
      keywords: 'qr code, générateur qr code, scanner qr code, lecteur qr code',
      path: '/qr-code'
    });

    if (this.isBrowser) {
      this.scannerSupported = 'BarcodeDetector' in window;

      this.textControl.valueChanges
        .pipe(debounceTime(300), takeUntil(this.destroy$))
        .subscribe(() => this.generate());
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.generate();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScanning();
  }

  async generate(): Promise<void> {
    const text = this.textControl.value.trim();

    if (!text) {
      this.qrDataUrl = '';
      this.errorMessage = '';
      return;
    }

    try {
      this.qrDataUrl = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: { dark: '#1a1d29', light: '#ffffff' }
      });
      this.errorMessage = '';
    } catch {
      this.errorMessage = 'Texte trop long pour générer un QR code.';
      this.qrDataUrl = '';
    }
  }

  async toggleScanning(): Promise<void> {
    if (this.isScanning) {
      this.stopScanning();
      return;
    }

    if (!this.scannerSupported || !this.isBrowser) {
      this.scanError = 'La détection de QR code n\'est pas prise en charge par ce navigateur.';
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (this.videoRef) {
        this.videoRef.nativeElement.srcObject = this.mediaStream;
        await this.videoRef.nativeElement.play();
      }

      this.isScanning = true;
      this.scanError = '';
      this.scanResult = '';

      const Detector = window.BarcodeDetector!;
      const detector = new Detector({ formats: ['qr_code'] });

      this.scanIntervalId = setInterval(async () => {
        if (!this.videoRef) {
          return;
        }
        try {
          const codes = await detector.detect(this.videoRef.nativeElement);
          if (codes.length > 0) {
            this.scanResult = codes[0].rawValue;
            this.stopScanning();
          }
        } catch {
          /* detection frame failed, retry on next interval */
        }
      }, 300);
    } catch {
      this.scanError = 'Impossible d\'accéder à la caméra. Vérifiez les autorisations.';
    }
  }

  private stopScanning(): void {
    this.isScanning = false;

    if (this.scanIntervalId !== null) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}
