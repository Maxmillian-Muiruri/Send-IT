import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing-module';
import { Auth } from './auth';
import { UserLoginComponent } from './login/login';
import { RegisterComponent } from './register/register';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    Auth,
    UserLoginComponent,
    RegisterComponent
  ],
  exports: []
})
export class AuthModule { }
