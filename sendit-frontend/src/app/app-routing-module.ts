import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { LandingComponent } from './landing';
import { authGuard } from './core/guards/auth-guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },
  { path: 'user', loadChildren: () => import('./user/user-module').then(m => m.UserModule), canActivate: [authGuard], data: { role: 'user' } },
  { path: 'admin', loadChildren: () => import('./admin/admin-module').then(m => m.AdminModule), canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'courier', loadChildren: () => import('./courier/courier-module').then(m => m.CourierModule), canActivate: [authGuard], data: { role: 'courier' } },
  { path: '**', redirectTo: '' }
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollOffset: [0, 64] // adjust if you have a fixed header
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
