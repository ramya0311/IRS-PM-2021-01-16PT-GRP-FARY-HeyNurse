import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import * as _ from 'underscore';

@Component({
  selector: 'route-modal',
  templateUrl: './route-modal.component.html',
  styleUrls: ['./modal.base.scss'],
})
export class RouteModalComponent implements OnInit, OnDestroy {
  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  @Input()
  public cancelUrl: any[];

  @Input()
  public cancelUrlExtras: { relative: boolean } & NavigationExtras;

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

  @Input()
  public showClose = true;

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
  // Private properties
  // -------------------------------------------------------------------------

  @ViewChild('modalRoot', { static: true })
  public modalRoot: ElementRef;

  public isOpened = false;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private activatedRoute: ActivatedRoute
  ) {}

  // -------------------------------------------------------------------------
  // Lifecycle Methods
  // -------------------------------------------------------------------------

  ngOnInit() {
    this.open();
  }

  ngOnDestroy() {
    document.body.className = document.body.className.replace(
      /\smodal-open\b/,
      ''
    );

    const mainContents = document.getElementsByClassName('main-content');
    if (mainContents.length > 0) {
      _.each(mainContents, (el: HTMLElement) => {
        el.className = el.className.replace(/\smodal-open\b/, '');
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
      /\smodal-open\b/,
      ''
    );

    const mainContents = document.getElementsByClassName('main-content');
    if (mainContents.length > 0) {
      _.each(mainContents, (el: HTMLElement) => {
        el.className = el.className.replace(/\smodal-open\b/, '');
      });
    }

    if (this.cancelUrl) {
      let navigationExtras: NavigationExtras = {};
      if (this.cancelUrlExtras) {
        if (this.cancelUrlExtras.relative) {
          navigationExtras.relativeTo = this.activatedRoute;
        }
        navigationExtras = (Object as any).assign(
          navigationExtras,
          this.cancelUrlExtras
        );
      }
      this.router.navigate(this.cancelUrl, navigationExtras);
    } else {
      // window.history.back();
      this.router.navigate(['./'], { relativeTo: this.route.parent });
    }
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  public preventClosing(event: MouseEvent) {
    event.stopPropagation();
  }
}
