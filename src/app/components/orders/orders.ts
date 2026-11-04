import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { OrderService } from '../../service/order.service';

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Normal user: his own orders (can cancel). Admin: all orders + can change the status.
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

  statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  constructor(
    public auth: AuthService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.placed.set(this.route.snapshot.queryParamMap.get('placed') === 'true');

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

  changeStatus(order: any, event: Event) {
    const status = (event.target as HTMLSelectElement).value;

    this.orderService.updateStatus(order._id, status).subscribe({
      next: (res: any) => {
        this.replaceOrder(order._id, res.data.status);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to update the status');
        this.cdr.detectChanges();
      },
    });
  }

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
        this.replaceOrder(order._id, res.data.status);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Could not cancel the order');
        this.cdr.detectChanges();
      },
    });
  }

  private replaceOrder(id: string, status: string) {
    this.orders.update((list) => list.map((o) => (o._id === id ? { ...o, status } : o)));
  }
}