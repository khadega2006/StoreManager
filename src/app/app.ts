import { Component } from '@angular/core';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private auth: AuthService) {
    // If the user was logged in before, re-check the saved token with the backend
    if (this.auth.isLoggedIn()) {
      this.auth.refreshUser().subscribe();
    }
  }
}
