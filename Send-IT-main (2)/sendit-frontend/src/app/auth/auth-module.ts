import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserLoginComponent } from './login/login';
import { UserRegisterComponent } from './register/register';
import { AuthRoutingModule } from './auth-routing-module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    UserLoginComponent,
    UserRegisterComponent
  ],
  exports: [UserLoginComponent, UserRegisterComponent]
})
export class AuthModule { }
