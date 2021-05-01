import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ModalComponent,
  ModalContentComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
} from './modal.component';
import { NavBarComponent } from './nav-bar.component';
import { RouteModalComponent } from './route-modal.component';
import { PaginationComponent } from './pagination/pagination.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
  ],

  declarations: [
    ModalComponent,
    RouteModalComponent,
    ModalHeaderComponent,
    ModalContentComponent,
    ModalFooterComponent,
    NavBarComponent,
    PaginationComponent
  ],

  exports: [
    ModalComponent,
    RouteModalComponent,
    ModalHeaderComponent,
    ModalContentComponent,
    ModalFooterComponent,
    NavBarComponent,
    PaginationComponent
  ],

  providers: [],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [

      ],
    };
  }
}
