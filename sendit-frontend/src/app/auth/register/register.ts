import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from '../../core/services/message.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  passwordMismatch = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['USER', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.messageService.showError('Please fill in all required fields correctly.');
      return;
    }
    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.passwordMismatch = true;
      this.messageService.showError('Passwords do not match.');
      return;
    }
    this.loading = true;
    this.passwordMismatch = false;

    const registrationData = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
      password: this.registerForm.value.password,
      role: this.registerForm.value.role
    };

    this.http.post<any>('http://localhost:3000/user/register', registrationData).subscribe({
      next: (res) => {
        this.loading = false;
        this.messageService.showSuccess('Registration successful! Redirecting to login...');
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
