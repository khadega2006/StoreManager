import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  data = { name: '', email: '', password: '', confirmPassword: '' };
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  register() {
    this.errorMessage = '';

    if (this.data.password !== this.data.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;

    // Only name / email / password are sent (the role is always "user", decided by the backend)
    const { name, email, password } = this.data;

    this.auth.register({ name, email, password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Registration failed, please try again';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
