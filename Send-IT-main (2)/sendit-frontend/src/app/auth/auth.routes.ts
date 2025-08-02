import { Routes } from '@angular/router';
import { UserLoginComponent } from './login/login';
import { UserRegisterComponent } from './register/register';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: UserLoginComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
