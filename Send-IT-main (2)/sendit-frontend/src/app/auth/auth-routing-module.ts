import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoginComponent } from './login/login';
import { UserRegisterComponent } from './register/register';

const routes: Routes = [
  { path: 'login', component: UserLoginComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
