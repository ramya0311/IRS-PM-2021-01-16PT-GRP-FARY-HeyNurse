import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NursedashboardComponent } from './nursedashboard.component';

describe('NursedashboardComponent', () => {
  let component: NursedashboardComponent;
  let fixture: ComponentFixture<NursedashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NursedashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NursedashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
