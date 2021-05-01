import {
    Component,
    
  } from '@angular/core';
  import * as _ from 'underscore';
  
  @Component({
    selector: 'spinner',
    template: `<div class="loader-wrapper">
               <div class="loader"></div>
                </div>`,
    styleUrls: ['./spinner.component.scss'],
  })
  export class SpinnerComponent{

  }