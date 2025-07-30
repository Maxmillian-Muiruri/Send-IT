import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Navbar } from './shared/components/navbar/navbar';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    AppRoutingModule,
    Navbar,
    RouterModule,
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [App]
})
export class AppModule { }
