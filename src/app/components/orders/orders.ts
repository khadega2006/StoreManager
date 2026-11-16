import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf, formatDate } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { OrderService } from '../../service/order.service';
import { ProductService } from '../../service/product.service';
import { TRANSFER_ACCOUNT, isTransfer, paymentLabel } from '../../constants/payment-methods';

const DAY = 24 * 60 * 60 * 1000;
const CANCEL_WINDOW_MS = DAY; // 24 hours

interface ReviewDraft {
  rating: number;
  comment: string;
  submitting: boolean;
  error: string;
}

// Normal user: his own orders (can cancel, and rate delivered products). Admin: all orders + can change the status.
@Component({
  selector: 'app-orders',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  placed = signal(false);
  movedMessage = signal('');
  account = TRANSFER_ACCOUNT;
  proofFailed = signal(false);
  uploadingId = signal(''); // the order whose screenshot is being uploaded

  statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  steps = ['pending', 'confirmed', 'shipped', 'delivered'];

  // The review being written for each product (key = product id)
  drafts = signal<Record<string, ReviewDraft>>({});

  constructor(
    public auth: AuthService,
    private orderService: OrderService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.placed.set(this.route.snapshot.queryParamMap.get('placed') === 'true');
    this.proofFailed.set(this.route.snapshot.queryParamMap.get('proof') === 'failed');

    const request = this.auth.isAdmin()
      ? this.orderService.getAllOrders()
      : this.orderService.getMyOrders();

    request.subscribe({
      next: (res: any) => {
        this.orders.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Failed to load orders');
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Payment ----------

  paymentName(order: any): string {
    return paymentLabel(order.paymentMethod);
  }

  // A transfer order that is still waiting: remind the customer where to send the money
  needsTransfer(order: any): boolean {
    return !this.auth.isAdmin() && isTransfer(order.paymentMethod) && order.status === 'pending';
  }

  // User: send (or replace) the screenshot of the transfer
  uploadProof(order: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please choose an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('The image is too large (max 5 MB)');
      return;
    }

    this.errorMessage.set('');
    this.proofFailed.set(false);
    this.uploadingId.set(order._id);

    this.orderService.uploadPaymentProof(order._id, file).subscribe({
      next: (res: any) => {
        this.orders.update((list) =>
          list.map((o) => (o._id === order._id ? { ...o, paymentProof: res.data.paymentProof } : o))
        );
        this.uploadingId.set('');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Could not upload the image, please try again');
        this.uploadingId.set('');
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Tracking ----------

  statusIndex(order: any): number {
    return this.steps.indexOf(order.status);
  }

  // The sentence under the order: it changes with the status
  trackingMessage(order: any): string {
    switch (order.status) {
      case 'pending':
        return `We received your order and it is waiting for confirmation. Expected delivery ${this.etaText(order)}.`;
      case 'confirmed':
        return `Your order is confirmed and being prepared. Expected delivery ${this.etaText(order)}.`;
      case 'shipped':
        return `Your order is on its way! Expected delivery ${this.etaText(order)}.`;
      case 'delivered':
        return order.deliveredAt
          ? `Delivered on ${formatDate(order.deliveredAt, "EEEE, d MMMM y 'at' h:mm a", 'en-US')}.`
          : 'Delivered.';
      default:
        return 'This order was cancelled.';
    }
  }

  private etaText(order: any): string {
    if (!order.estimatedDelivery) return 'soon';

    const eta = new Date(order.estimatedDelivery);
    const days = Math.ceil((eta.getTime() - Date.now()) / DAY);
    const date = formatDate(eta, 'EEEE, d MMMM', 'en-US');

    if (days <= 0) return `very soon (${date})`;
    return `within ${days} ${days === 1 ? 'day' : 'days'} (by ${date})`;
  }

  // ---------- Admin ----------

  changeStatus(order: any, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.movedMessage.set('');

    this.orderService.updateStatus(order._id, status).subscribe({
      next: (res: any) => {
        if (res.data.status === 'delivered') {
          // Delivered: remove it from the list, it now lives in the dashboard
          this.orders.update((list) => list.filter((o) => o._id !== order._id));
          this.movedMessage.set(`Order #${order._id.slice(-6)} was delivered and moved to the Dashboard.`);
        } else {
          this.replaceOrder(order._id, res.data);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to update the status');
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Cancel (user) ----------

  // The button is shown only if the order is not shipped yet and is less than 24 hours old.
  // (The backend checks the same rules, this is just to hide the button.)
  canCancel(order: any): boolean {
    const isNew = Date.now() - new Date(order.createdAt).getTime() < CANCEL_WINDOW_MS;
    return isNew && (order.status === 'pending' || order.status === 'confirmed');
  }

  cancelOrder(order: any) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.errorMessage.set('');

    this.orderService.cancelOrder(order._id).subscribe({
      next: (res: any) => {
        this.replaceOrder(order._id, res.data);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Could not cancel the order');
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Reviews (user, delivered orders only) ----------

  draft(productId: string): ReviewDraft {
    return this.drafts()[productId] ?? { rating: 0, comment: '', submitting: false, error: '' };
  }

  private setDraft(productId: string, changes: Partial<ReviewDraft>) {
    this.drafts.update((all) => ({ ...all, [productId]: { ...this.draft(productId), ...changes } }));
  }

  setRating(productId: string, rating: number) {
    this.setDraft(productId, { rating });
  }

  setComment(productId: string, comment: string) {
    this.setDraft(productId, { comment });
  }

  submitReview(productId: string) {
    const { rating, comment } = this.draft(productId);
    if (!rating) return;

    this.setDraft(productId, { submitting: true, error: '' });

    this.productService.addReview(productId, { rating, comment }).subscribe({
      next: () => {
        // Show the rating on every item of this product
        this.orders.update((list) =>
          list.map((o) => ({
            ...o,
            items: o.items.map((i: any) => (i.product === productId ? { ...i, myRating: rating } : i)),
          }))
        );
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.setDraft(productId, {
          submitting: false,
          error: err.error?.message || 'Could not send your review, please try again',
        });
        this.cdr.detectChanges();
      },
    });
  }

  // Updates the status / dates of one order (keeps the rest, like the customer info)
  private replaceOrder(id: string, fresh: any) {
    this.orders.update((list) =>
      list.map((o) =>
        o._id === id
          ? {
              ...o,
              status: fresh.status,
              estimatedDelivery: fresh.estimatedDelivery,
              deliveredAt: fresh.deliveredAt,
              statusHistory: fresh.statusHistory,
            }
          : o
      )
    );
  }
}