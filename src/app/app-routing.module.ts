import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard,authGuard , guestGuard } from './guards/auth.guards';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home').then(c => c.Home)
  },

  {
    path: 'products',
    loadChildren: () =>
      import('./components/product-list/products.module')
        .then(m => m.ProductsModule)
  },

    // Logged in users only
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/cart/cart').then(c => c.Cart)
  },
  
    // Logged in users only
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/checkout/checkout').then(c => c.Checkout)
  },

  // Logged in users only (admin sees all orders, user sees his own)
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/orders/orders').then(c => c.Orders)
  },

  // Admin only
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/dashboard/dashboard').then(c => c.Dashboard)
  },

  // Admin only
  {
    path: 'add-product',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/add-product/add-product').then(c => c.AddProduct)
  },

  // Admin only
  {
    path: 'edit-product/:id',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/add-product/add-product').then(c => c.AddProduct)
  },

  // Visitors only (logged in users are sent to home)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/login/login').then(c => c.Login)
  },

  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/register/register').then(c => c.Register)
  },

  {
    path: '**',
    loadComponent: () =>
      import('./components/not-found/not-found').then(c => c.NotFound)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}