import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../service/product.service';
import { CATEGORIES } from '../../constants/categories';

// Used for both "Add Product" and "Edit Product" (admin only)
@Component({
  selector: 'app-add-product',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css',
})
export class AddProduct implements OnInit {
  categories = [...CATEGORIES];
  product = { name: '', brand: '', price: 0, category: '', description: '' };
  imageFile: File | null = null;
  currentImage = '';

  editId: string | null = null;
  errorMessage = '';
  submitting = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');

    if (this.editId) {
      this.productService.getProductById(this.editId).subscribe({
        next: (p) => {
          const match = this.categories.find((c) => c.toLowerCase() === (p.category || '').toLowerCase());
          if (!match && p.category) this.categories.push(p.category);

          this.product = {
            name: p.name,
            brand: p.brand || '',
            price: p.price,
            category: match ?? p.category,
            description: p.description,
          };
          this.currentImage = p.image || '';
          this.cdr.detectChanges(); // refresh the form with the loaded product
        },
        error: () => {
          this.errorMessage = 'Failed to load the product';
          this.cdr.detectChanges();
        },
      });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imageFile = input.files?.[0] ?? null;
  }

  submit() {
    this.errorMessage = '';
    this.submitting = true;

    const formData = new FormData();
    formData.append('name', this.product.name);
    formData.append('brand', this.product.brand || '');
    formData.append('price', String(this.product.price));
    formData.append('category', this.product.category);
    formData.append('description', this.product.description);
    if (this.imageFile) formData.append('image', this.imageFile);

    const request = this.editId
      ? this.productService.updateProduct(this.editId, formData)
      : this.productService.addProduct(formData);

    request.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Something went wrong, please try again';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }
}