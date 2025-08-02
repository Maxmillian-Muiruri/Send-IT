import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateParcel } from './create-parcel';

describe('CreateParcel', () => {
  let component: CreateParcel;
  let fixture: ComponentFixture<CreateParcel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateParcel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateParcel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
