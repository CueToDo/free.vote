// Angular
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef
} from '@angular/core';

// Lodash https://github.com/lodash/lodash/issues/3192
import { cloneDeep } from 'lodash-es';

// Services
import { AppDataService } from '../../services/app-data.service';
import { OrganisationsService } from 'src/app/services/groups.service';

// Models and Enums
import { GroupDecisionBasisOption } from '../../models/enums';
import { Group, GroupUpdate } from 'src/app/models/group.model';

@Component({
  selector: 'app-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: ['./group-edit.component.css']
})
export class GroupEditComponent implements OnInit {
  @Input() group = new Group();
  @Output() groupChange = new EventEmitter(); // Still need to emit

  // ToDo Following renamed
  @Output() editCompleted = new EventEmitter();
  @Output() editCancelled = new EventEmitter();

  @ViewChild('groupName', { static: true }) elSubGroupName:
    | ElementRef
    | undefined;

  groupCopy = new Group();

  saving = false;
  error = '';

  constructor(
    private appData: AppDataService,
    private groupsService: OrganisationsService
  ) {}

  ngOnInit(): void {
    this.groupCopy = cloneDeep(this.group) as Group;
    this.elSubGroupName?.nativeElement.focus();

    if (this.group) {
      if (!this.group.groupID || this.group.groupID < 1) {
        this.group.decisionBasisOptionID =
          GroupDecisionBasisOption.SimpleMajority.toString();
      }
    }
  }

  superMajorityCheck(): boolean {
    this.error = '';

    if (
      this.group?.decisionBasisOptionID !==
      GroupDecisionBasisOption.SuperMajority.toString()
    ) {
      return true;
    } else if (this.group.superMajority < 52 || this.group.superMajority > 99) {
      this.error = 'super majority must be a value between 52 and 99';
      return false;
    } else {
      return true;
    }
  }

  update(): void {
    if (!this.group) {
      this.error = 'No group to update';
    } else {
      this.error = '';

      if (this.appData.isUrlNameUnSafe(this.group.groupName)) {
        if (
          confirm(
            'Sub Group name contains invalid characters. Remove them now?'
          )
        ) {
          this.group.groupName = this.appData.urlSafeName(this.group.groupName);
        } else {
          return;
        }
      }

      if (!this.group.nextIssueSelectionDate) {
        this.error = 'Next discussion start date is required';
        return;
      }

      if (this.superMajorityCheck()) {
        this.saving = true;
        this.error = '';

        this.groupsService
          .GroupUpdate(this.group as any as GroupUpdate)
          .subscribe({
            next: subGroup => {
              this.group = cloneDeep(subGroup) as Group;
              this.groupChange.emit(this.group);
              this.editCompleted.emit(this.group.groupName);
            },
            error: serverError => {
              this.error = serverError.error.detail;
              this.saving = false;
            },
            complete: () => (this.saving = false) // error means complete!
          });
      }
    }
  }

  cancel(): void {
    this.group = cloneDeep(this.groupCopy) as Group;
    this.groupChange.emit(this.group);
    this.editCancelled.emit();
  }
}
