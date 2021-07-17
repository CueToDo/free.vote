// Angular
import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// rxjs
import { concatMap } from 'rxjs/operators';

// Models and Enums
import { Group } from 'src/app/models/group.model';
import { Issue } from 'src/app/models/issue.model';
import { PorQ } from 'src/app/models/porq.model';
import { DecisionBasisOption, IssueStatuses } from 'src/app/models/enums';
import { ProposalStatuses } from 'src/app/models/enums';
import { IssueSelectionResult } from 'src/app/models/issue.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { OrganisationsService } from 'src/app/services/groups.service';
import { IssuesService } from 'src/app/services/issues.service';
import { PsandQsService } from 'src/app/services/psandqs.service';

// Components
import { ProgressComponent } from '../progress/progress.component';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit, AfterViewInit {
  // Not currently used - may do if resurrect GroupsComponent
  @Output() groupUpdated = new EventEmitter();
  @Output() groupDeleted = new EventEmitter();

  @ViewChild('progress') progressComponent = new ProgressComponent();

  organisationName = '';

  groupName = '';
  public group = new Group();

  public get organisationNameKebab(): string {
    return this.appData.kebabUri(this.organisationName);
  }

  public DecisionBasisOption = DecisionBasisOption;

  groupEdit = false;

  public issues: Issue[] = [];
  public IssueStatuses = IssueStatuses;

  issueStatusID = IssueStatuses.None;
  proposalStatusID = ProposalStatuses.None;

  public newIssue = false;
  public newIssueEdit = new Issue();

  public psOrQs: PorQ[] = [];
  public showPsAndQs = false;

  startingDiscussion = false;
  startedMessage = '';

  error = '';

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    public appData: AppDataService,
    private groupsService: OrganisationsService,
    private issuesService: IssuesService,
    private psandQsService: PsandQsService
  ) {}

  ngOnInit(): void {
    const routeParams = this.activeRoute.snapshot.params;
    this.organisationName = this.appData.unKebabUri(
      routeParams.organisationName
    );
    this.groupName = this.appData.unKebabUri(routeParams.groupName);

    this.getGroup(this.organisationName, this.groupName);
  }

  getGroup(organisationName: string, groupName: string): void {
    this.error = '';

    this.groupsService.GroupByName(organisationName, groupName).subscribe({
      next: group => {
        this.group = group as Group;
        // this.SelectSubGroup();
      },
      error: serverError => (this.error = serverError.error.detail)
    });
  }

  ngAfterViewInit(): void {
    this.reInitialise();
  }

  reInitialise(): void {
    // ToDo Draft Issues, Proposals
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';
      if (this.group.issuesInProposalVoting > 0) {
        this.issueStatusID = IssueStatuses.ProposalVoting;
      } else if (this.group.issuesInDiscussion > 0) {
        this.issueStatusID = IssueStatuses.Discussion;
      } else if (this.group.issuesInPrioritisation > 0) {
        this.issueStatusID = IssueStatuses.Prioritisation;
      } else if (this.group.issuesClosed > 0) {
        this.issueStatusID = IssueStatuses.Closed;
        // } else if (this.subGroupDisplay.proposalsRejected > 0) {
        //   issueStatusID = IssueStages.ProposalRejected;
        // } else {
        //   issueStatusID = IssueStages.Draft;
      } else {
        this.issueStatusID = IssueStatuses.PrioritisationYetToStart;
      }

      this.proposalStatusID = ProposalStatuses.None;

      this.initialiseIssueProgressDisplay();
      this.getIssues(this.issueStatusID);
    }
  }

  edit(): void {
    this.error = '';
    this.groupEdit = true;
  }

  delete(): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';
      if (
        confirm(
          `Are you sure you wish to delete the subgroup "${this.group.groupName}"?`
        )
      ) {
        this.groupsService
          .GroupDelete(this.group.organisationID, this.group.groupID)
          .subscribe({
            next: _ => {
              // this.subGroupDeleted.emit();
              this.router.navigateByUrl(
                '/groups/' + this.appData.kebabUri(this.organisationName)
              );
            },
            error: serverError => (this.error = serverError.error.detail)
          });
      }
    }
  }

  editCompleted(): void {
    this.groupEdit = false;
    // this.subGroupUpdated.emit();
    // this.getIssues(IssueStatuses.Prioritisation);
  }

  editCancelled(): void {
    this.groupEdit = false;
  }

  // After submit new issue or delete issue, update counts
  refreshSubGroup(): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';

      this.groupsService.Group(this.group.groupID).subscribe({
        next: group => (this.group = group),
        error: serverError => {
          console.log(serverError);
          this.error = serverError.error.detail;
        }
      });
    }
  }

  getIssues(issueStatusID: IssueStatuses): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';
      this.newIssue = false;

      this.issuesService
        .GetIssuesForGroup(this.group.groupID, issueStatusID)
        .subscribe({
          next: isr => {
            this.issues = isr.issues;
            this.showPsAndQs = false;
            this.updateIssueCountsAfterFetch(isr);
          },
          error: serverError => {
            console.log(serverError);
            this.error = serverError.error.detail;
          }
        });
    }
  }

  // If there was an auto count update, refresh counts in progress component
  updateIssueCountsAfterFetch(isr: IssueSelectionResult): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else if (!isr?.groupIssueCounts || !isr.groupIssueCounts) {
      this.error = 'Group issue count unknown';
    } else {
      this.error = '';
      if (isr.groupIssueCounts.countsUpdated) {
        // subGroup is already bound to progress component
        this.group.issuesNotInPrioritisation =
          isr.groupIssueCounts.issuesNotInPrioritisation;
        this.group.issuesInPrioritisation =
          isr.groupIssueCounts.issuesInPrioritisation;
        this.group.issuesInDiscussion = isr.groupIssueCounts.issuesInDiscussion;
        this.group.issuesInProposalVoting =
          isr.groupIssueCounts.issuesInProposalVoting;
        this.group.issuesClosed = isr.groupIssueCounts.issuesClosed;
      }
    }
  }

  refreshIssueCount(statusID: IssueStatuses, count: number): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';

      switch (statusID) {
        case IssueStatuses.PrioritisationYetToStart:
          this.group.issuesNotInPrioritisation = count;
          break;
        case IssueStatuses.Prioritisation:
          this.group.issuesNotInPrioritisation = count;
          break;
        case IssueStatuses.Discussion:
          this.group.issuesInDiscussion = count;
          break;
        case IssueStatuses.ProposalVoting:
          this.group.issuesInProposalVoting = count;
          break;
        case IssueStatuses.Closed:
          this.group.issuesClosed = count;
          break;
      }
    }
  }

  createNewIssue(): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';

      this.newIssue = true;
      this.newIssueEdit = new Issue();
      this.newIssueEdit.organisationID = this.group.organisationID;
      this.newIssueEdit.groupID = this.group.groupID;
      this.newIssueEdit.issueID = -1;
      this.newIssueEdit.publish = true;
      const earliest = new Date();
      const latest = this.appData.addMonths(earliest, 3);
      this.newIssueEdit.selectionDateEarliest = earliest; // this.appData.UDTF(earliest);
      this.newIssueEdit.selectionDateLatest = latest; // this.appData.UDTF(latest);
    }
  }

  // Highlight selected status
  initialiseIssueProgressDisplay(): void {
    if (this.progressComponent) {
      this.progressComponent.issueStatusID = this.issueStatusID;
      this.progressComponent.proposalStatusID = this.proposalStatusID;
    }
  }

  issueCreated(statusID: IssueStatuses): void {
    this.newIssue = false;
    this.refreshSubGroup();
    this.getIssues(statusID);
    if (this.progressComponent) {
      this.progressComponent.issueStatusID = statusID;
    }
  }

  newIssueCancelled(): void {
    this.newIssue = false;
    this.reInitialise();
  }

  issueDeleted(): void {
    this.refreshSubGroup();
  }

  getPsOrQs(proposalStatus: ProposalStatuses): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';
      this.newIssue = false;

      this.psandQsService
        .PsAndQsSelectGroup(this.group.groupID, proposalStatus, false)
        .subscribe({
          next: proposals => {
            console.log(proposals);
            this.psOrQs = proposals.psOrQs;
            this.showPsAndQs = true;
          },
          error: serverError => (this.error = serverError.error.detail)
        });
    }
  }

  selectIssueNow(): void {
    if (!this.group) {
      this.error = 'Group not selected';
    } else {
      this.error = '';
      if (confirm('Select issue for discussion now?')) {
        this.startingDiscussion = true;
        this.groupsService
          .GroupStartDiscussionNow(this.group.groupID)
          .pipe(
            // Discussion is started - boolean value back from service call is irrelevant
            // Refresh the Group
            concatMap(() => {
              console.log('STARTED');
              return this.groupsService.Group(
                this.group?.groupID ? this.group.groupID : 0
              );
            }),
            concatMap((subGroup: Group) => {
              console.log('We got a subgroup', subGroup);
              this.group = subGroup as Group;
              // Now update issues and return the observable
              return this.issuesService.GetIssuesForGroup(
                this.group.groupID,
                IssueStatuses.Discussion
              );
            })
          )
          .subscribe({
            next: (isr: IssueSelectionResult) => {
              console.log('AND some issues', isr);
              // GetIssuesForSubGroup returns an IssueSelectionResult
              this.issues = isr.issues;
              this.showPsAndQs = false;
              this.updateIssueCountsAfterFetch(isr);
              if (this.progressComponent) {
                this.progressComponent.issueStatusID = IssueStatuses.Discussion;
              }
              // Oh and we've started the discussion
              this.startingDiscussion = false;
              this.startedMessage = 'started';
            },
            error: serverError => {
              console.log(serverError);
              this.error = serverError.error.detail;
            }
          });
      }
    }
  }
}
