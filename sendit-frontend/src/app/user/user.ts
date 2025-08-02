import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user',
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  standalone: true,
  imports: [RouterModule]
})
export class User {
  logout() {
    localStorage.removeItem('sendit_user');
    localStorage.removeItem('sendit_access_token');
    window.location.href = '/';
  }
}
