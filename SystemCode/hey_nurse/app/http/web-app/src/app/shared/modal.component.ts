import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import * as _ from 'underscore';

@Component({
  selector: 'modal-header',
  template: `
    <ng-content></ng-content>
  `,
})
export class ModalHeaderComponent {}

@Component({
  selector: 'modal-content',
  template: `
    <ng-content></ng-content>
  `,
})
export class ModalContentComponent {}

@Component({
  selector: 'modal-footer',
  template: `
    <ng-content></ng-content>
  `,
})
export class ModalFooterComponent {}

@Component({
  selector: 'modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.base.scss'],
})
export class ModalComponent implements OnDestroy {
  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  @Input()
  public modalClass: string;

  @Input()
  public closeOnEscape = true;

  @Input()
  public closeOnOutsideClick = false;

  @Input()
  public title: string;

  @Input()
  public hideCloseButton = false;

  @Input()
  public cancelButtonLabel: string;

  @Input()
  public submitButtonLabel: string;

  @Input()
  public backdrop = true;

  // -------------------------------------------------------------------------
  // Outputs
  // -------------------------------------------------------------------------

  @Output()
  public onOpen = new EventEmitter(false);

  @Output()
  public onClose = new EventEmitter(false);

  @Output()
  public onSubmit = new EventEmitter(false);

  // -------------------------------------------------------------------------
  // Public properties
  // -------------------------------------------------------------------------

  public isOpened = false;

  // -------------------------------------------------------------------------
  // Private properties
  // -------------------------------------------------------------------------

  @ViewChild('modalRoot', { static: true })
  public modalRoot: ElementRef;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor() {}

  // -------------------------------------------------------------------------
  // Lifecycle Methods
  // -------------------------------------------------------------------------

  ngOnDestroy() {
    document.body.className = document.body.className.replace(
      / modal-open\b/,
      ''
    );

    const mainContents = document.getElementsByClassName('main-content');
    if (mainContents.length > 0) {
      _.each(mainContents, (el: HTMLElement) => {
        el.className = el.className.replace(/ modal-open\b/, '');
      });
    }
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  open(...args: any[]) {
    if (this.isOpened) {
      return;
    }

    this.isOpened = true;
    this.onOpen.emit(args);
    window.setTimeout(() => this.modalRoot.nativeElement.focus(), 0);
    document.body.className += ' modal-open';

    const mainContents = document.getElementsByClassName('main-content');
    if (mainContents.length > 0) {
      _.each(
        mainContents,
        (el: HTMLElement) => (el.className += ' modal-open')
      );
    }
  }

  close(...args: any[]) {
    if (!this.isOpened) {
      return;
    }

    this.isOpened = false;
    this.onClose.emit(args);
    document.body.className = document.body.className.replace(
      / modal-open\b/,
      ''
    );

    const mainContents = document.getElementsByClassName('main-content');
    if (mainContents.length > 0) {
      _.each(mainContents, (el: HTMLElement) => {
        el.className = el.className.replace(/ modal-open\b/, '');
      });
    }
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  public preventClosing(event: MouseEvent) {
    event.stopPropagation();
  }
}
