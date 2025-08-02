import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class LandingComponent {
  userRole: string | null = null;

  constructor() {
    const userStr = localStorage.getItem('sendit_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userRole = user.role;
    }
  }

  logout() {
    localStorage.removeItem('sendit_user');
    this.userRole = null;
    window.location.href = '/';
  }

  scrollToFeatures(event: Event): void {
    event.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToSection(id: string, event: Event) {
    if (window.location.pathname === '/') {
      event.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
