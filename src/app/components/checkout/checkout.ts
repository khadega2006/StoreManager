import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { CartService } from '../../service/cart.service';
import { OrderService } from '../../service/order.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, NgIf, NgFor, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  form = { fullName: '', phone: '', governorate: '', city: '', street: '', notes: '' };
  paymentMethod = 'cash_on_delivery';

  ready = signal(false);
  hasSavedAddress = signal(false);
  errorMessage = signal('');
  submitting = signal(false);

    constructor(
    public auth: AuthService,
    public cart: CartService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.cart.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Get the latest saved address from the backend, then fill the form
    this.auth.refreshUser().subscribe(() => {
      const user = this.auth.user();

      this.form.fullName = user?.name || '';
      this.form.phone = user?.phone || '';
      this.form.governorate = user?.address?.governorate || '';
      this.form.city = user?.address?.city || '';
      this.form.street = user?.address?.street || '';

      this.hasSavedAddress.set(!!user?.address?.street);
      this.ready.set(true);
    });
  }

  placeOrder() {
    this.errorMessage.set('');
    this.submitting.set(true);

    const items = this.cart.items().map((i) => ({ product: i.id, quantity: i.quantity }));

    this.orderService
      .placeOrder({ items, shippingAddress: this.form, paymentMethod: this.paymentMethod })
      .subscribe({
        next: () => {
          this.cart.clear();
          this.auth.refreshUser().subscribe(); // the address is now saved for the next order
          this.router.navigate(['/orders'], { queryParams: { placed: 'true' } });
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Could not place the order, please try again');
          this.submitting.set(false);
          this.cdr.detectChanges();
        },
      });
  }
}