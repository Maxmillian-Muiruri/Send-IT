import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Auth } from './auth';
import { UserLoginComponent } from './login/login';
import { RegisterComponent } from './register/register';

const routes: Routes = [
  { path: '', component: Auth },
  { path: 'login', component: UserLoginComponent },
  { path: 'register', component: RegisterComponent }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
