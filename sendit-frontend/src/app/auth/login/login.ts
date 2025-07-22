import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class UserLoginComponent {
  loginForm: FormGroup;
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;
    const { email, password, remember } = this.loginForm.value;
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      if (email === 'demo@example.com' && password === 'password') {
        this.successMessage = 'Login successful! Redirecting to dashboard...';
        setTimeout(() => {
          this.successMessage = null;
          this.router.navigate(['/user/dashboard']);
        }, 1500);
      } else {
        this.errorMessage = 'Invalid credentials. Try demo@example.com / password';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    }, 1500);
  }
} 