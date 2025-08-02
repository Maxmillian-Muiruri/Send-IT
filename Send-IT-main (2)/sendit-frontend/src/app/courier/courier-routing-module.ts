import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Courier } from './courier';

const routes: Routes = [{ path: '', component: Courier }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourierRoutingModule { }
