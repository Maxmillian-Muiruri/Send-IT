import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth-interceptor';
import { LandingComponent } from './app/landing';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', loadChildren: () => import('./app/auth/auth-module').then(m => m.AuthModule) },
  { path: 'user', loadChildren: () => import('./app/user/user-module').then(m => m.UserModule) },
  { path: 'admin', loadChildren: () => import('./app/admin/admin-module').then(m => m.AdminModule) },
  { path: 'courier', loadChildren: () => import('./app/courier/courier-module').then(m => m.CourierModule) },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
})
  .catch(err => console.error(err));
