import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { catchError, of, switchMap, tap } from 'rxjs';
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
  category = signal('');

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Runs every time the ?category=... in the URL changes
    this.route.queryParamMap
      .pipe(
        tap((params) => {
          this.category.set(params.get('category') || '');
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((params) =>
          this.productService.getProducts(params.get('category') || undefined).pipe(
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

  goToDetails(id: string) {
    this.router.navigate(['/products', id]);
  }
}
