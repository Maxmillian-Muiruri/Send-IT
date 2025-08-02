import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourierLocation } from './courier-location';

describe('CourierLocation', () => {
  let component: CourierLocation;
  let fixture: ComponentFixture<CourierLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourierLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourierLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
