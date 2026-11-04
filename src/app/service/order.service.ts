import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private url = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // Only ids + quantities are sent. The server calculates the prices and the total.
  placeOrder(body: any): Observable<any> {
    return this.http.post<any>(this.url, body);
  }

  getMyOrders(): Observable<any> {
    return this.http.get<any>(`${this.url}/my`);
  }

  // Admin
  getAllOrders(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  // Admin
  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/status`, { status });
  }

  // User
  cancelOrder(id: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/cancel`, {});
  }
}