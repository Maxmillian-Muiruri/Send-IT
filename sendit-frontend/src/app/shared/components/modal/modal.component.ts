import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="close()"></div>
    <div class="modal-content">
      <ng-content></ng-content>
      <button class="close-btn" (click)="close()">Close</button>
    </div>
  `,
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
} 