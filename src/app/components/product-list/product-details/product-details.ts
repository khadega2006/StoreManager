import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ProductService } from '../../../service/product.service';
import { AuthService } from '../../../service/auth.service';
import { CartService } from '../../../service/cart.service';

@Component({
  selector: 'app-product-details',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, TitleCasePipe, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  product = signal<any>(null);
  reviews = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  quantity = signal(1);
  added = signal(false);

  // Average rating as a percentage of 5 stars (used to colour the stars)
  ratingPercent = computed(() => ((this.product()?.ratingAverage || 0) / 5) * 100);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public auth: AuthService,
    private cart: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') as string;

    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.status === 404 || err.status === 400 ? 'Product not found' : 'Failed to load product');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });

    this.productService.getReviews(id).subscribe({
      next: (list) => {
        this.reviews.set(list);
        this.cdr.detectChanges();
      },
      error: () => {} // the page still works without the reviews
    });
  }

  increase() {
    this.quantity.update((q) => q + 1);
  }

  decrease() {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart() {
    this.cart.add(this.product(), this.quantity());
    this.quantity.set(1);

    this.added.set(true);
    setTimeout(() => this.added.set(false), 1500);
  }

  buyNow() {
    this.cart.add(this.product(), this.quantity());
    this.router.navigate(['/checkout']);
  }

  editProduct() {
    this.router.navigate(['/edit-product', this.product().id]);
  }

  deleteProduct() {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.productService.deleteProduct(this.product().id).subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete product');
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}