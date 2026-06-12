import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { SeoService } from '../../core/seo.service';

interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
}

const CACHE_KEY = 'snaptools.dictionary-cache';
const RECENT_KEY = 'snaptools.dictionary-recent';
const MAX_CACHE = 30;
const MAX_RECENT = 10;
const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries';

@Component({
  selector: 'app-dictionary',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dictionary.component.html',
  styleUrl: './dictionary.component.css'
})
export class DictionaryComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly languages: { code: string; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'Anglais' },
    { code: 'es', label: 'Espagnol' }
  ];
  readonly languageControl = new FormControl('fr', { nonNullable: true });

  entries: DictionaryEntry[] = [];
  recentSearches: string[] = [];
  isLoading = false;
  errorMessage = '';
  hasSearched = false;

  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;
  private cache: Record<string, DictionaryEntry[]> = {};

  constructor(
    private readonly http: HttpClient,
    private readonly seo: SeoService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Dictionnaire en Ligne Rapide - SnapTools',
      description:
        'Recherchez instantanément la définition, la prononciation et les synonymes d\'un mot en français, anglais ou espagnol. Historique conservé hors-ligne.',
      keywords: 'dictionnaire en ligne, définition mot, synonymes, recherche mot',
      path: '/dictionnaire'
    });

    if (this.isBrowser) {
      this.loadCache();
      this.loadRecent();
    }

    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => this.search(term)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.languageControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.searchControl.value.trim()) {
        this.search(this.searchControl.value).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchRecent(term: string): void {
    this.searchControl.setValue(term);
  }

  private search(term: string) {
    const word = term.trim().toLowerCase();

    if (!word) {
      this.entries = [];
      this.errorMessage = '';
      this.hasSearched = false;
      return of(null);
    }

    this.hasSearched = true;
    this.errorMessage = '';

    const cacheKey = `${this.languageControl.value}:${word}`;
    const cached = this.cache[cacheKey];

    if (cached) {
      this.entries = cached;
      this.isLoading = false;
      this.saveRecent(word);
      return of(cached);
    }

    this.isLoading = true;

    return this.http.get<DictionaryEntry[]>(`${API_BASE}/${this.languageControl.value}/${encodeURIComponent(word)}`).pipe(
      catchError(() => of(null)),
      switchMap((response) => {
        this.isLoading = false;

        if (!response) {
          this.entries = [];
          this.errorMessage = this.isBrowser && !navigator.onLine
            ? 'Vous êtes hors-ligne et ce mot n\'est pas en cache.'
            : `Aucune définition trouvée pour « ${word} ».`;
          return of(null);
        }

        this.entries = response;
        this.cacheResult(cacheKey, response);
        this.saveRecent(word);
        return of(response);
      })
    );
  }

  private cacheResult(key: string, entries: DictionaryEntry[]): void {
    if (!this.isBrowser) {
      return;
    }

    this.cache[key] = entries;
    const keys = Object.keys(this.cache);
    if (keys.length > MAX_CACHE) {
      delete this.cache[keys[0]];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
  }

  private loadCache(): void {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return;
    }
    try {
      this.cache = JSON.parse(raw);
    } catch {
      this.cache = {};
    }
  }

  private saveRecent(word: string): void {
    if (!this.isBrowser) {
      return;
    }

    this.recentSearches = [word, ...this.recentSearches.filter((w) => w !== word)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentSearches));
  }

  private loadRecent(): void {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return;
    }
    try {
      this.recentSearches = JSON.parse(raw);
    } catch {
      this.recentSearches = [];
    }
  }
}
