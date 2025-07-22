import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingComponent } from './landing';
import { Auth } from './auth/auth';
import { User } from './user/user';
import { Admin } from './admin/admin';
import { Courier } from './courier/courier';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [RouterModule, LandingComponent, Auth, User, Admin, Courier]
})
export class App {
  protected title = 'sendit-frontend';
}
