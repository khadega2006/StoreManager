import { Injectable, computed, effect, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_link: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);

  // Total number of pieces (shown next to "Cart" in the navbar)
  count = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));

  // Total price
  total = computed(
    () => Math.round(this.items().reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100
  );

  constructor(private auth: AuthService) {
    // Every user has his own cart: reload it when someone logs in / logs out
    effect(() => {
      const user = this.auth.user();
      this.items.set(user ? this.load(user.id) : []);
    });
  }

  private load(userId: string): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(`cart_${userId}`) || '[]');
    } catch {
      return [];
    }
  }

  private save(items: CartItem[]) {
    this.items.set(items);

    const user = this.auth.user();
    if (user) localStorage.setItem(`cart_${user.id}`, JSON.stringify(items));
  }

  add(product: any, quantity = 1) {
    const exists = this.items().some((i) => i.id === product.id);

    const items = exists
      ? this.items().map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      : [
          ...this.items(),
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image_link: product.image_link,
            quantity,
          },
        ];

    this.save(items);
  }

  increase(id: string) {
    this.save(this.items().map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)));
  }

  decrease(id: string) {
    this.save(
      this.items().map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
    );
  }

  remove(id: string) {
    this.save(this.items().filter((i) => i.id !== id));
  }

  clear() {
    this.save([]);
  }
}