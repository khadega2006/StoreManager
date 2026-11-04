import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, NgIf, TitleCasePipe } from '@angular/common';
import { ProductService } from '../../../service/product.service';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-product-details',
  imports: [NgIf, CurrencyPipe, TitleCasePipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  product = signal<any>(null);
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.status === 404 || err.status === 400 ? 'Product not found' : 'Failed to load product');
        this.loading.set(false);
      }
    });
  }

  editProduct() {
    this.router.navigate(['/edit-product', this.product().id]);
  }

  deleteProduct() {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.productService.deleteProduct(this.product().id).subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to delete product')
    });
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
