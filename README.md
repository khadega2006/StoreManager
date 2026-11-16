# Store Manager

An Angular e-commerce product management app with a Node.js / Express / MongoDB backend (`/api`).

- **Visitor** (not logged in): sees Home, Products and product details only.
- **User**: same as a visitor, can register / login / logout.
- **Admin**: can also add, edit and delete products.

Products come from the backend (MongoDB). Home categories open the products of that category (`/products?category=Lipstick`).

## Features
- Feature Module (ProductsModule) and AppRoutingModule
- Routing with route parameters, wildcard route, routerLink and routerLinkActive
- Component communication with @Input and @Output
- Data binding (interpolation, property, event, two-way)
- Directives: *ngFor, *ngIf, [ngClass]
- Built-in pipes and a custom truncate pipe
- ProductService / AuthService with Dependency Injection and HttpClient
- Loading and error handling
- Authentication (JWT), roles (user / admin), route guards and an HTTP interceptor

## Setup

### Backend (`/api`)
1. `cd api && npm install`
2. Copy `.env.example` to `.env` and fill it (Mongo URI, JWT secret, admin email/password, Cloudinary keys)
3. `npm run seed` (adds the starter products, only if the collection is empty)
4. `npm start` (or `npm run nodemon`) - the admin account is created automatically from `.env`

### Frontend
1. `npm install`
2. `ng serve`
3. Open http://localhost:4200

For production, put your deployed backend URL in `src/environments/environment.prod.ts`.

## Build
```bash
ng build
```




//تعديل التقييم أو مسحه من صاحبه، ومسح تقييم مسىء من الأدمن.
منتجات مشابهة (من نفس التصنيف) أسفل صفحة التفاصيل.
المخزون: “Out of stock” وخصم الكمية عند الطلب وإرجاعها عند الإلغاء. محتاج حقل Stock فى فورم الإضافة.
مصاريف الشحن حسب المحافظة وتتضاف للمجموع.
قايمة المفضلة (Wishlist) بالقلب على كل منتج.
إيميل تأكيد عند الطلب وعند تغيير الحالة.
Rate limiting على اللوجين، وده الأهم قبل النشر الفعلى، عشان محدش يخمّن الباسورد.