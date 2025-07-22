import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Courier } from './courier';

describe('Courier', () => {
  let component: Courier;
  let fixture: ComponentFixture<Courier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Courier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Courier);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
