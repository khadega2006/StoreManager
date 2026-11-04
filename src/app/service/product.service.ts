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

  // All products, or only one category (e.g. 'Lipstick')
  getProducts(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);

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
}
