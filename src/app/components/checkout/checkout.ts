import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { CartService } from '../../service/cart.service';
import { OrderService } from '../../service/order.service';
import { PAYMENT_METHODS, TRANSFER_ACCOUNT } from '../../constants/payment-methods';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, NgIf, NgFor, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  form = { fullName: '', phone: '', governorate: '', city: '', street: '', notes: '' };
  paymentMethod = 'cash_on_delivery';
  methods = PAYMENT_METHODS;
  account = TRANSFER_ACCOUNT;

  ready = signal(false);
  hasSavedAddress = signal(false);
  errorMessage = signal('');
  submitting = signal(false);
  copied = signal(false);

  // Screenshot of the transfer (Vodafone Cash / InstaPay)
  proofFile: File | null = null;
  proofPreview = '';
  proofError = '';

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

  // The method the customer picked (to show the transfer details)
  get selectedMethod() {
    return this.methods.find((m) => m.value === this.paymentMethod);
  }

  // Copy the transfer number (the button shows "Copied" for 2 seconds)
  copyNumber() {
    const number = this.account.number;

    const done = () => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(number).then(done).catch(() => this.fallbackCopy(number, done));
    } else {
      this.fallbackCopy(number, done);
    }
  }

  // For pages where the clipboard API is not available (e.g. plain http)
  private fallbackCopy(text: string, done: () => void) {
    const box = document.createElement('textarea');
    box.value = text;
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();

    try {
      if (document.execCommand('copy')) done();
    } finally {
      document.body.removeChild(box);
    }
  }

  // ---------- Payment screenshot ----------

  onProofSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.proofError = '';

    if (!file.type.startsWith('image/')) {
      this.proofError = 'Please choose an image file';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.proofError = 'The image is too large (max 5 MB)';
      input.value = '';
      return;
    }

    this.proofFile = file;

    // Show a small preview
    const reader = new FileReader();
    reader.onload = () => {
      this.proofPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeProof(input: HTMLInputElement) {
    this.proofFile = null;
    this.proofPreview = '';
    this.proofError = '';
    input.value = '';
  }

  placeOrder() {
    this.errorMessage.set('');

    // Transfer methods: the screenshot is required
    if (this.selectedMethod?.transfer && !this.proofFile) {
      this.errorMessage.set('Please upload a screenshot of your payment');
      return;
    }

    this.submitting.set(true);

    const items = this.cart.items().map((i) => ({ product: i.id, quantity: i.quantity }));

    this.orderService
      .placeOrder({ items, shippingAddress: this.form, paymentMethod: this.paymentMethod })
      .subscribe({
        next: (res: any) => {
          // The order is saved. Now send the screenshot (if the customer is paying by transfer)
          const finish = (proofFailed: boolean) => {
            this.cart.clear();
            this.auth.refreshUser().subscribe(); // the address is now saved for the next order
            this.router.navigate(['/orders'], {
              queryParams: proofFailed ? { placed: 'true', proof: 'failed' } : { placed: 'true' },
            });
          };

          if (this.selectedMethod?.transfer && this.proofFile) {
            this.orderService.uploadPaymentProof(res.data._id, this.proofFile).subscribe({
              next: () => finish(false),
              error: () => finish(true),
            });
          } else {
            finish(false);
          }
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Could not place the order, please try again');
          this.submitting.set(false);
          this.cdr.detectChanges();
        },
      });
  }
}