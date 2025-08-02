import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AddressService } from '../../core/services/address';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  profileForm: FormGroup;
  addressForm: FormGroup;
  myAddresses: any[] = [];
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showAddressForm = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private addressService: AddressService
  ) {
    // Get current user
    const userStr = localStorage.getItem('sendit_user');
    this.currentUser = userStr ? JSON.parse(userStr) : null;

    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || '', Validators.required],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      phone: [this.currentUser?.phone || '', Validators.required]
    });

    this.addressForm = this.fb.group({
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: [''], // Make optional
      country: ['', Validators.required],
      addressType: ['HOME', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.addressService.getMyAddresses().subscribe({
      next: (addresses) => {
        this.myAddresses = addresses;
      },
      error: (error) => {
        console.error('Failed to load addresses:', error);
        this.myAddresses = [];
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    // Update user profile logic here
    // For now, just show success message
    setTimeout(() => {
      this.loading = false;
      this.successMessage = 'Profile updated successfully!';
      setTimeout(() => this.successMessage = null, 3000);
    }, 1000);
  }

  onAddressSubmit() {
    if (this.addressForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.addressService.createAddress(this.addressForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Address added successfully!';
        this.addressForm.reset({ addressType: 'HOME' });
        this.showAddressForm = false;
        this.loadAddresses();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to add address. Please try again.';
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  deleteAddress(addressId: string) {
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(addressId).subscribe({
        next: () => {
          this.successMessage = 'Address deleted successfully!';
          this.loadAddresses();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete address.';
          setTimeout(() => this.errorMessage = null, 5000);
        }
      });
    }
  }

  toggleAddressForm() {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      this.addressForm.reset({ addressType: 'HOME' });
    }
  }

  showNotification() { 
    this.router.navigate(['/user/notifications']); 
  }
  
  showProfileMenu() { 
    this.router.navigate(['/user/profile']); 
  }

  logout() {
    localStorage.removeItem('sendit_user');
    localStorage.removeItem('sendit_access_token');
    window.location.href = '/';
  }
} 