import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // Converts the backend product to the shape the components already use
  private toView(p: any) {
    return { ...p, id: p._id, image_link: p.image || '/Hair care.png' };
  }

  // All products. Optional: one category, a search text, and a sort (newest | rating | price-asc | price-desc)
  getProducts(options: { category?: string; search?: string; sort?: string } = {}): Observable<any[]> {
    let params = new HttpParams();
    if (options.category) params = params.set('category', options.category);
    if (options.search) params = params.set('search', options.search);
    if (options.sort) params = params.set('sort', options.sort);

    return this.http
      .get<any>(this.url, { params })
      .pipe(map((res) => res.data.map((p: any) => this.toView(p))));
  }

  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map((res) => this.toView(res.data)));
  }

  // Admin only (the backend checks the token). Takes FormData because of the image upload.
  addProduct(formData: FormData): Observable<any> {
    return this.http.post<any>(this.url, formData);
  }

  updateProduct(id: string, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}`, formData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

    // Reviews of one product (public)
  getReviews(productId: string): Observable<any[]> {
    return this.http.get<any>(`${this.url}/${productId}/reviews`).pipe(map((res) => res.data));
  }

  // A user can review a product only after it was delivered to him
  addReview(productId: string, body: { rating: number; comment: string }): Observable<any> {
    return this.http.post<any>(`${this.url}/${productId}/reviews`, body);
  }
}
