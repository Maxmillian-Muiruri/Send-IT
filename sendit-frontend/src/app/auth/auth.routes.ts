import { Routes } from '@angular/router';
import { Auth } from './auth';
import { UserLoginComponent } from './login/login';
import { RegisterComponent } from './register/register';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: UserLoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  }
];
