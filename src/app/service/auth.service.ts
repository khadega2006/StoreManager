import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: { governorate: string; city: string; street: string };
}

interface AuthResponse {
  data: { token: string; user: User };
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // The current user (null = not logged in)
  user = signal<User | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.user());
  isAdmin = computed(() => this.user()?.role === 'admin');

  constructor(private http: HttpClient) {}

  private loadUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  register(body: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, body)
      .pipe(tap((res) => this.saveSession(res.data.token, res.data.user)));
  }

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, body)
      .pipe(tap((res) => this.saveSession(res.data.token, res.data.user)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  // Re-checks the saved token with the backend (so a changed role / expired token is detected)
  refreshUser(): Observable<unknown> {
    return this.http.get<{ data: { user: User } }>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        this.user.set(res.data.user);
      }),
      catchError(() => of(null))
    );
  }
}
