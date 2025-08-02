import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from '../../core/services/message.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class UserRegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone: ['', Validators.required],
      role: ['USER', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.messageService.showError('Please fill in all required fields correctly.');
      return;
    }

    this.loading = true;
    const registrationData = {
      fullName: this.registerForm.value.fullName, // Send fullName to match backend DTO
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone,
      role: this.registerForm.value.role
    };

    this.http.post<any>(`${environment.apiUrl}/user/register`, registrationData).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Registration successful! Please log in.');
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.showError(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
