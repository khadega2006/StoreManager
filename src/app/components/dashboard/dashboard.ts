import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { OrderService } from '../../service/order.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Donut segments (the site's palette)
const COLORS = ['#A96F78', '#D8C2BD', '#7F4F58', '#C75B83', '#B8A9A5'];
// Avatar circles (white letters, so only the darker colors of the palette)
const AVATAR_COLORS = ['#A96F78', '#7F4F58', '#B8838B', '#C75B83', '#8E3A5D'];

// Line chart size (SVG units, the chart scales to the card width)
const W = 640;
const H = 260;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;

// Donut chart
const DONUT_R = 70;
const DONUT_C = 2 * Math.PI * DONUT_R;

interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

// Admin only: delivered orders shown as a dashboard (stats + charts), built with plain SVG (no libraries)
@Component({
  selector: 'app-dashboard',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  year = signal(new Date().getFullYear());

  donutRadius = DONUT_R;

  constructor(
    public auth: AuthService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderService.getDeliveredOrders().subscribe({
      next: (res: any) => {
        this.orders.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Failed to load the dashboard');
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Header ----------

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  // ---------- Stat cards ----------

  stats = computed(() => {
    const list = this.orders();
    const now = new Date();
    const thisMonth = { revenue: 0, count: 0 };
    const lastMonth = { revenue: 0, count: 0 };
    let revenue = 0;

    for (const o of list) {
      revenue += o.totalPrice;
      const d = this.dateOf(o);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();

      if (monthsAgo === 0) {
        thisMonth.revenue += o.totalPrice;
        thisMonth.count++;
      } else if (monthsAgo === 1) {
        lastMonth.revenue += o.totalPrice;
        lastMonth.count++;
      }
    }

    return {
      count: list.length,
      revenue: this.round(revenue),
      average: list.length ? this.round(revenue / list.length) : 0,
      revenueChange: this.change(thisMonth.revenue, lastMonth.revenue),
      countChange: this.change(thisMonth.count, lastMonth.count),
    };
  });

  // "+4.6%" / "-2.0%" / "New" (when last month had no sales)
  changeText(value: number | null): string {
    if (value === null) return 'New';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  // ---------- Products ----------

  // Every product with the quantity sold (best seller first)
  private productTotals = computed(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const o of this.orders()) {
      for (const i of o.items) {
        const row = map.get(i.name) ?? { name: i.name, quantity: 0, revenue: 0 };
        row.quantity += i.quantity;
        row.revenue += i.price * i.quantity;
        map.set(i.name, row);
      }
    }

    return [...map.values()].sort((a, b) => b.quantity - a.quantity);
  });

  // "Trending item" card: top 3
  trending = computed(() => this.productTotals().slice(0, 3));

  // "Sale's insights" bars: top 5 (percent = bar height)
  topProducts = computed(() => {
    const top = this.productTotals().slice(0, 5);
    const max = top.length ? top[0].quantity : 1;
    return top.map((p) => ({ ...p, percent: Math.max(8, (p.quantity / max) * 100) }));
  });

  // ---------- Line chart: revenue per month (selected year vs the year before) ----------

  years = computed(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    for (const o of this.orders()) set.add(this.dateOf(o).getFullYear());
    return [...set].sort((a, b) => b - a);
  });

  setYear(event: Event) {
    this.year.set(Number((event.target as HTMLSelectElement).value));
  }

  chart = computed(() => {
    const year = this.year();
    const now = new Date();
    const current = new Array(12).fill(0);
    const previous = new Array(12).fill(0);

    for (const o of this.orders()) {
      const d = this.dateOf(o);
      if (d.getFullYear() === year) current[d.getMonth()] += o.totalPrice;
      else if (d.getFullYear() === year - 1) previous[d.getMonth()] += o.totalPrice;
    }

    // The current year stops at the current month
    const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;

    const max = this.niceMax(Math.max(...current, ...previous));
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const bottom = PAD_T + plotH;

    const x = (i: number) => PAD_L + (plotW * i) / 11;
    const y = (v: number) => PAD_T + plotH - (v / max) * plotH;

    const toPoints = (values: number[], upTo: number): ChartPoint[] =>
      values.slice(0, upTo + 1).map((v, i) => ({
        x: x(i),
        y: y(v),
        label: MONTHS[i],
        value: this.round(v),
      }));

    const currentPoints = toPoints(current, lastMonth);
    const previousPoints = toPoints(previous, 11);
    const currentLine = this.smooth(currentPoints, PAD_T, bottom);

    return {
      width: W,
      height: H,
      left: PAD_L,
      right: W - PAD_R,
      yTicks: [0, 1, 2, 3, 4].map((i) => ({
        y: y((max * i) / 4),
        label: this.shortMoney((max * i) / 4),
      })),
      months: MONTHS.map((label, i) => ({ label, x: x(i) })),
      currentLine,
      currentArea: currentPoints.length
        ? `${currentLine} L ${currentPoints[currentPoints.length - 1].x} ${bottom} L ${currentPoints[0].x} ${bottom} Z`
        : '',
      previousLine: this.smooth(previousPoints, PAD_T, bottom),
      currentPoints,
      previousPoints,
    };
  });

  // ---------- Donut: revenue share by governorate ----------

  donut = computed(() => {
    const map = new Map<string, number>();

    for (const o of this.orders()) {
      const name = o.shippingAddress?.governorate || 'Unknown';
      map.set(name, (map.get(name) || 0) + o.totalPrice);
    }

    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const rows = sorted.slice(0, 4);
    const others = sorted.slice(4).reduce((sum, [, v]) => sum + v, 0);
    if (others > 0) rows.push(['Others', others]);

    const total = rows.reduce((sum, [, v]) => sum + v, 0);
    let offset = 0;

    return rows.map(([name, value], i) => {
      const share = total ? value / total : 0;
      const length = share * DONUT_C;
      const segment = {
        name,
        value: this.round(value),
        percent: (share * 100).toFixed(1),
        dash: `${length} ${DONUT_C - length}`,
        offset: -offset,
        color: COLORS[i],
      };
      offset += length;
      return segment;
    });
  });

  // ---------- Lists ----------

  recent = computed(() =>
    [...this.orders()]
      .sort((a, b) => this.dateOf(b).getTime() - this.dateOf(a).getTime())
      .slice(0, 6)
      .map((o, i) => {
        const name = this.customerName(o);
        return {
          id: o._id,
          name,
          initial: name.charAt(0).toUpperCase(),
          amount: o.totalPrice,
          date: this.dateOf(o),
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        };
      })
  );

  topCustomers = computed(() => {
    const map = new Map<string, { name: string; orders: number; spent: number }>();

    for (const o of this.orders()) {
      const key = o.user?._id || o.user?.email || this.customerName(o);
      const row = map.get(key) ?? { name: this.customerName(o), orders: 0, spent: 0 };
      row.orders++;
      row.spent += o.totalPrice;
      map.set(key, row);
    }

    return [...map.values()]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((c, i) => ({
        ...c,
        spent: this.round(c.spent),
        initial: c.name.charAt(0).toUpperCase(),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
  });

  // ---------- Export ----------

  exportCsv() {
    const rows: string[][] = [
      ['Order', 'Customer', 'Email', 'Governorate', 'City', 'Items', 'Total', 'Delivered at'],
    ];

    for (const o of this.orders()) {
      rows.push([
        o._id.slice(-6),
        this.customerName(o),
        o.user?.email || '',
        o.shippingAddress?.governorate || '',
        o.shippingAddress?.city || '',
        o.items.map((i: any) => `${i.name} x${i.quantity}`).join(' | '),
        String(o.totalPrice),
        this.dateOf(o).toLocaleString('en-US'),
      ]);
    }

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + rows.map((r) => r.map(escape).join(',')).join('\r\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `delivered-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Helpers ----------

  private dateOf(order: any): Date {
    return new Date(order.deliveredAt || order.updatedAt);
  }

  private customerName(order: any): string {
    return order.user?.name || order.shippingAddress?.fullName || 'Customer';
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // % change compared with last month (null = last month had nothing to compare with)
  private change(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return ((current - previous) / previous) * 100;
  }

  // Top of the chart: a round number that splits nicely into 4 steps (1, 2, 4, 6, 8, 10 x 10^n)
  private niceMax(value: number): number {
    if (value <= 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const steps = [1, 2, 4, 6, 8, 10];
    return (steps.find((s) => value <= s * magnitude) ?? 10) * magnitude;
  }

  private shortMoney(value: number): string {
    if (value >= 1000) {
      const k = value / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return `$${Math.round(value)}`;
  }

  // Smooth curve through the points (Catmull-Rom converted to bezier curves)
  private smooth(points: ChartPoint[], top: number, bottom: number): string {
    if (!points.length) return '';

    const clamp = (v: number) => Math.min(bottom, Math.max(top, v));
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;

      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = clamp(p2.y - (p3.y - p1.y) / 6);

      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  }
}