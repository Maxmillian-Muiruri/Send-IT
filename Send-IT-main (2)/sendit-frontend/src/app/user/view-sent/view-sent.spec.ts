import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSent } from './view-sent';

describe('ViewSent', () => {
  let component: ViewSent;
  let fixture: ComponentFixture<ViewSent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewSent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
