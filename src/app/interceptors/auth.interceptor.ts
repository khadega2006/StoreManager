import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';

// Adds the login token to every request, and logs the user out if the token is rejected
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error) => {
      if (token && error.status === 401) {
        auth.logout();

        if (router.url.startsWith('/add-product') || router.url.startsWith('/edit-product')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
