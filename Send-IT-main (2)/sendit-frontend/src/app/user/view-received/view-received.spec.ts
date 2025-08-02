import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewReceived } from './view-received';

describe('ViewReceived', () => {
  let component: ViewReceived;
  let fixture: ComponentFixture<ViewReceived>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewReceived]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewReceived);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
