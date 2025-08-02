import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from '../../core/services/message.service';
import { environment } from '../../../environments/environment';

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

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.messageService.showError('Please fill in all required fields correctly.');
      return;
    }
    this.loading = true;
    const { email, password } = this.loginForm.value;
    this.http.post<any>(`${environment.apiUrl}/auth/login`, { 
      email: email.trim(), 
      password: password.trim() 
    }).subscribe({
      next: (res) => {
        // Fix: Save token with the correct key that the interceptor expects
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('sendit_user', JSON.stringify(res.user));
        this.messageService.showSuccess('Login successful! Redirecting to dashboard...');
        this.loading = false;
        setTimeout(() => {
          switch (res.user.role) {
            case 'ADMIN':
              this.router.navigate(['/admin']);
              break;
            case 'COURIER':
              this.router.navigate(['/courier']);
              break;
            case 'USER':
            default:
              this.router.navigate(['/user']);
              break;
          }
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.showError(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }
} 