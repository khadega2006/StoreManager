import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { ProductService } from '../../service/product.service';
import { ProductCardComponent } from './product-card/product-card';

@Component({
  selector: 'app-product-list',
  imports: [NgFor, NgIf, RouterLink, ProductCardComponent],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit {
  products = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // These come from the address bar (?category=...&search=...&sort=...)
  category = signal('');
  search = signal('');
  sort = signal('');

  // The text put in the search box when the page opens (never changes while typing)
  initialSearch = '';

  sortOptions = [
    { value: '', label: 'Default' },
    { value: 'newest', label: 'Newest first' },
    { value: 'rating', label: 'Top rated' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
  ];

  private typed$ = new Subject<string>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initialSearch = this.route.snapshot.queryParamMap.get('search') || '';

    // Wait until the user stops typing for a moment, then search
    this.typed$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((text) => this.updateQuery({ search: text.trim() || null }));

    // Runs every time the address bar changes
    this.route.queryParamMap
      .pipe(
        tap((params) => {
          this.category.set(params.get('category') || '');
          this.search.set(params.get('search') || '');
          this.sort.set(params.get('sort') || '');
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((params) =>
          this.productService
            .getProducts({
              category: params.get('category') || undefined,
              search: params.get('search') || undefined,
              sort: params.get('sort') || undefined,
            })
            .pipe(
              catchError(() => {
                this.errorMessage.set('Failed to load products. Please try again.');
                return of([]);
              })
            )
        )
      )
      .subscribe((data) => {
        this.products.set(data);
        this.loading.set(false);
      });
  }

  onSearchTyped(text: string) {
    this.typed$.next(text);
  }

  onSortChange(value: string) {
    this.updateQuery({ sort: value || null });
  }

  clearFilters(searchBox: HTMLInputElement) {
    searchBox.value = '';
    this.updateQuery({ search: null, sort: null }, false);
  }

  // Changes only the given parts of the address bar and keeps the rest (like the category)
  private updateQuery(queryParams: Params, replaceUrl = true) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  goToDetails(id: string) {
    this.router.navigate(['/products', id]);
  }
}