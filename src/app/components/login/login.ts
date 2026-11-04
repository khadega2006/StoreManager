import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  credentials = { email: '', password: '' };
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  login() {
    this.errorMessage = '';
    this.loading = true;

    this.auth.login(this.credentials).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed, please try again';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
