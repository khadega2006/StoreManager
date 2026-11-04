import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import {CartService} from "../../service/cart.service"

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(public auth: AuthService, public cart: CartService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
