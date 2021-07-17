// Angular
import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

// Lodash https://github.com/lodash/lodash/issues/3192
import { cloneDeep } from 'lodash-es';

// CKEditor
// import * as CKECustom from 'src/ckeditor.js';

// Models
import { Issue } from 'src/app/models/issue.model';

// Services
import { IssueStatuses } from 'src/app/models/enums';
import { IssuesService } from 'src/app/services/issues.service';
import { AppDataService } from 'src/app/services/app-data.service';

@Component({
  selector: 'app-issue-edit',
  templateUrl: './issue-edit.component.html',
  styleUrls: ['./issue-edit.component.css']
})
export class IssueEditComponent implements OnInit {
  // Originally had notionally one-way databinding but was getting 2-way with NO Output() issueChange
  // and no banana in a box on parent ... WHY?
  // Now need to do manual update to prevent the 2 way binding on cancel edit
  // clone and manual 2 way introduced
  @Input() issue = new Issue();
  @Output() issueChange = new EventEmitter();

  // public ckeditor = CKECustom;
  public issueClone = new Issue();

  @Output() CancelEdit = new EventEmitter();
  @Output() CompleteEdit = new EventEmitter();

  public saving = false;
  public error = '';

  // https://stackoverflow.com/questions/47079366/expression-has-changed-after-it-was-checked-during-iteration-by-map-keys-in-angu/50749898
  // pointKeys: IterableIterator<number>;

  constructor(
    private issuesService: IssuesService,
    public appData: AppDataService
  ) {}

  ngOnInit(): void {
    // For some reason need to cast to any before cast to issue ???
    this.issueClone = cloneDeep(this.issue) as Issue;
  }

  // https://stackoverflow.com/questions/44012321/meaning-of-var-ngmodel

  onCKEBlur(): void {}

  onSubmit(): void {
    this.error = '';

    if (!this.issueClone) {
      this.error = 'Nothing to save';
    } else {
      this.saving = true;
      this.issuesService.IssueUpdate(this.issueClone).subscribe({
        next: (statusID: IssueStatuses) => {
          this.issueChange.emit(this.issueClone);
          this.CompleteEdit.emit(statusID);
        },
        error: serverError => {
          this.saving = false;
          this.error = serverError.error.detail;
        },
        complete: () => {
          this.saving = false;
        }
      });
    }
  }

  Cancel(): void {
    this.CancelEdit.next();
  }
}
