import { isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { SeoService } from '../../core/seo.service';

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
  };
}

interface LanguageOption {
  code: string;
  label: string;
  locale: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
  { code: 'en', label: 'Anglais', locale: 'en-US' },
  { code: 'es', label: 'Espagnol', locale: 'es-ES' },
  { code: 'de', label: 'Allemand', locale: 'de-DE' },
  { code: 'it', label: 'Italien', locale: 'it-IT' },
  { code: 'pt', label: 'Portugais', locale: 'pt-PT' },
  { code: 'ar', label: 'Arabe', locale: 'ar-SA' }
];

const API_BASE = 'https://api.mymemory.translated.net/get';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [ReactiveFormsModule, UpperCasePipe],
  templateUrl: './translator.component.html',
  styleUrl: './translator.component.css'
})
export class TranslatorComponent implements OnInit, OnDestroy {
  readonly languages = LANGUAGES;

  readonly sourceLang = new FormControl('fr', { nonNullable: true });
  readonly targetLang = new FormControl('en', { nonNullable: true });
  readonly inputText = new FormControl('', { nonNullable: true });

  outputText = '';
  isTranslating = false;
  errorMessage = '';
  copyStatus = '';
  isListening = false;
  speechSupported = false;
  recognitionSupported = false;

  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  constructor(
    private readonly http: HttpClient,
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Traducteur de Texte avec Voix - SnapTools',
      description:
        'Traduisez du texte entre plusieurs langues, écoutez la traduction grâce à la synthèse vocale et copiez le résultat en un clic.',
      keywords: 'traducteur en ligne, traduction texte, synthèse vocale, traduction gratuite',
      path: '/traducteur'
    });

    if (this.isBrowser) {
      this.speechSupported = 'speechSynthesis' in window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognitionSupported = !!SpeechRecognitionCtor;

      if (this.recognitionSupported) {
        this.recognition = new SpeechRecognitionCtor();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.inputText.setValue(transcript);
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };

        this.recognition.onerror = () => {
          this.isListening = false;
        };
      }
    }

    this.inputText.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((text) => this.translate(text)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.sourceLang.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.retranslate());
    this.targetLang.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.retranslate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  retranslate(): void {
    const text = this.inputText.value;
    if (text.trim()) {
      this.translate(text).subscribe();
    }
  }

  translate(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      this.outputText = '';
      this.errorMessage = '';
      return of(null);
    }

    if (this.sourceLang.value === this.targetLang.value) {
      this.outputText = trimmed;
      return of(null);
    }

    this.isTranslating = true;
    this.errorMessage = '';

    const langpair = `${this.sourceLang.value}|${this.targetLang.value}`;
    const url = `${API_BASE}?q=${encodeURIComponent(trimmed.slice(0, 500))}&langpair=${langpair}`;

    return this.http.get<MyMemoryResponse>(url).pipe(
      catchError(() => of(null)),
      switchMap((response) => {
        this.isTranslating = false;

        if (!response) {
          this.errorMessage = this.isBrowser && !navigator.onLine
            ? 'Traduction indisponible hors-ligne.'
            : 'Le service de traduction est momentanément indisponible.';
          return of(null);
        }

        this.outputText = response.responseData.translatedText;
        return of(response);
      })
    );
  }

  swapLanguages(): void {
    const source = this.sourceLang.value;
    const target = this.targetLang.value;
    this.sourceLang.setValue(target);
    this.targetLang.setValue(source);

    if (this.outputText) {
      this.inputText.setValue(this.outputText, { emitEvent: false });
      this.outputText = '';
      this.retranslate();
    }
  }

  async copyOutput(): Promise<void> {
    if (!this.isBrowser || !this.outputText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.outputText);
      this.copyStatus = 'Copié !';
    } catch {
      this.copyStatus = 'Impossible de copier.';
    }

    setTimeout(() => (this.copyStatus = ''), 2000);
  }

  speakOutput(): void {
    if (!this.isBrowser || !this.speechSupported || !this.outputText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(this.outputText);
    const lang = this.languages.find((l) => l.code === this.targetLang.value);
    utterance.lang = lang?.locale ?? 'en-US';

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  toggleListening(): void {
    if (!this.recognitionSupported || !this.recognition) {
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      return;
    }

    const lang = this.languages.find((l) => l.code === this.sourceLang.value);
    this.recognition.lang = lang?.locale ?? 'fr-FR';
    this.isListening = true;
    this.recognition.start();
  }
}
