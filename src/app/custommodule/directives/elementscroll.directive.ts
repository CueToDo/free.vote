import {
  Directive,
  ElementRef,
  NgZone,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';

import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';

@Directive({
  selector: '[appElementScrollEnd]'
})
export class ElementScrollDirective implements OnDestroy {
  @Output() scrollEnd = new EventEmitter();

  private elmentScroll$: Subscription;

  constructor(private ngZone: NgZone, private el: ElementRef<any>) {
    const native = el.nativeElement;

    this.elmentScroll$ = fromEvent(native, 'scroll')
      .pipe(debounceTime(300))
      .subscribe(() => {
        if (
          native.offsetHeight + native.scrollTop >=
          0.99 * native.scrollHeight
        ) {
          // https://angular.io/api/core/NgZone#runy
          this.ngZone.run(() => {
            this.scrollEnd.emit();
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.elmentScroll$.unsubscribe();
  }
}
