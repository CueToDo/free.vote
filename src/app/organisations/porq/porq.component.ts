// Angular
import { Component, Input, Output, EventEmitter } from '@angular/core';

// Lodash https://github.com/lodash/lodash/issues/3192
import { cloneDeep } from 'lodash-es';

// Models, Enums
import { PorQ, PorQEdit } from 'src/app/models/porq.model';
import { PorQTypes } from 'src/app/models/enums';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { PsandQsService } from 'src/app/services/psandqs.service';

@Component({
  selector: 'app-porq',
  templateUrl: './porq.component.html',
  styleUrls: ['./porq.component.css']
})
export class PorqComponent {
  @Input() public porQ = new PorQ();
  @Output() Deleted = new EventEmitter();

  public get porQEdit(): PorQEdit {
    return this.porQ as any as PorQEdit;
  }

  public PorQTypes = PorQTypes;

  @Input() inFocus = false;
  editing = false;
  deleted = false;
  error = '';

  public get detailsLink(): string {
    return `/groups/Compass-Manchester/Build-Back-Better/Making-Things-Happen-In-Manchester/${this.porQ?.porQID}`;
  }

  constructor(
    private psAndQs: PsandQsService,
    private appData: AppDataService
  ) {}

  edit(): void {
    this.editing = true;
  }

  completeEdit(porQUpdated: PorQ): void {
    this.porQ = cloneDeep(porQUpdated);
    this.editing = false;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  delete(): void {
    // CANNOT use public property on PorQ - WHY?
    // const pq = new PorQ; // : PorQ = <PorQ>this.appData.deep(this.porQ);
    // const pq: PorQ = <PorQ>this.appData.deep(this.porQ);
    // console.log(pq.porQTypeDescription);

    if (!this.porQ) {
      this.error = 'No persective or question selected';
    } else {
      if (
        confirm(
          `Are you sure you wish to delete this ${this.appData.PorQType(
            this.porQ.porQTypeID
          )}?`
        )
      ) {
        this.error = '';

        this.psAndQs.PorQDelete(this.porQ.issueID, this.porQ.porQID).subscribe({
          next: _ => {
            this.deleted = true;
            this.Deleted.emit();
          },
          error: serverError => (this.error = serverError.error.detail)
        });
      }
    }
  }
}
