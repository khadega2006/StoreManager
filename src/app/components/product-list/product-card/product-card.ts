import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CurrencyPipe, NgClass, NgIf, UpperCasePipe } from '@angular/common';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { AuthService } from '../../../service/auth.service';
import { CartService } from '../../../service/cart.service';

@Component({
  selector: 'app-product-card',
  imports: [NgClass, NgIf, UpperCasePipe, CurrencyPipe, TruncatePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product: any;
  @Output() viewDetails = new EventEmitter<string>();

  quantity = signal(1);
  added = signal(false);

  constructor(public auth: AuthService, private cart: CartService) {}

  increase() {
    this.quantity.update((q) => q + 1);
  }

  decrease() {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart() {
    this.cart.add(this.product, this.quantity());
    this.quantity.set(1);

    this.added.set(true);
    setTimeout(() => this.added.set(false), 1500);
  }

  onViewDetails() {
    this.viewDetails.emit(this.product.id);
  }
}