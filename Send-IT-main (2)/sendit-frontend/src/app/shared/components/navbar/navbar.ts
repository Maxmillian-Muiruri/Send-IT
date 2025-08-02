import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class Navbar {
  // Simulate authentication state
  isLoggedIn = false;

  // In a real app, use an AuthService and subscribe to auth state
  // Example:
  // constructor(private authService: AuthService) {
  //   this.authService.isLoggedIn$.subscribe(val => this.isLoggedIn = val);
  // }

  // For demo: toggle login state
  toggleLogin() {
    this.isLoggedIn = !this.isLoggedIn;
  }
}
