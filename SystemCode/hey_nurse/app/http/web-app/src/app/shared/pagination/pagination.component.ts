import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { List } from 'immutable';
import * as _ from 'underscore';

export interface PaginationPage {
  number: number;
  start: number;
}

interface PageItem extends PaginationPage {
  isEllipsis: boolean;
}

interface Unit {
  singular: string;
  plural: string;
}

@Component({
  selector: 'pagination',
  templateUrl: 'pagination.component.html',
  styleUrls: [ './pagination.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PaginationComponent implements OnChanges {
  @Input() pages: List<PaginationPage>;
  @Input() offset: number;
  @Input() pageSize: number;
  @Input() showSummary = false;
  @Input() totalSize: number;
  @Output() change = new EventEmitter<number>();

  _unit: Unit = { singular: 'item', plural: 'items' };
  pageItems = List<PageItem>();
  pageNumber = 1;

  @Input('unit')
  set unit(value: string|Unit) {
    if (_.isString(value)) {
      this._unit = {
        singular: <string>value,
        plural: value + 's'
      };
    } else if (!!value) {
      this._unit = <Unit>value;
    }
  }

  get unit(): string|Unit {
    return this._unit;
  }

  get end(): number {
    return Math.min(this.offset + this.pageSize, this.totalSize);
  }

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pages']) {
      if (changes['pages'].currentValue) {
        this.pages = <List<PaginationPage>>changes['pages'].currentValue;
        this.pageNumber = Math.floor(this.offset / this.pageSize);
        this.updatePageItems();
      } else {
        this.pageItems = this.pageItems.clear();
      }
    } else if (changes['offset']
      && _.isNumber(changes['offset'].currentValue)) {
      this.pageNumber = Math.floor(this.offset / this.pageSize);
      this.updatePageItems();
    }
  }

  updatePageItems() {
    this.pageItems = this.pages.reduce((items, p, i) => {
      const lastItem = <PageItem>items.last()
      if (this.pages.size <= 7
        || i === 0
        || i === (this.pages.size - 1)
        || (i >= (this.pageNumber - 2) && (i <= (this.pageNumber + 2)))
      ) {
        items = items.push(_.extend(p, { isEllipsis: false }));
      } else if (!lastItem.isEllipsis) {
        items = items.push({ number: null, start: null, isEllipsis: true });
      }

      return items;
    }, List<PageItem>());
  }
}
