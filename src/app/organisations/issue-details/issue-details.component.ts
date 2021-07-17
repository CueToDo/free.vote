// Angular
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// rxjs
import { concatMap } from 'rxjs/operators';

// Models, Enums
import { ProposalStatuses, IssueStatuses } from 'src/app/models/enums';
import { Issue, IssuePorQCounts } from 'src/app/models/issue.model';
import { PorQTypes } from 'src/app/models/enums';
import { PorQEdit, PorQ, PorQSelectionResult } from 'src/app/models/porq.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { IssuesService } from 'src/app/services/issues.service';
import { PsandQsService } from 'src/app/services/psandqs.service';

@Component({
  selector: 'app-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.css', '../issue/issue.component.css']
})
export class IssueDetailsComponent implements OnInit {
  organisationName = '';
  groupName = '';
  issueTitle = '';
  issue = new Issue();

  public IssueStatuses = IssueStatuses;
  public ProposalStatuses = ProposalStatuses;
  public PorQTypes = PorQTypes;

  public get issueStatusID(): IssueStatuses {
    if (!this.issue || !this.issue.statusID) {
      return IssueStatuses.None;
    }
    return this.issue.statusID;
  }

  psOrQs: PorQ[] = [];

  porQTypeID = PorQTypes.Question;
  proposalStatusID = ProposalStatuses.VotingYetToStart;

  get porQType(): string {
    return this.psandQsService.PorQDescription(this.porQTypeID);
  }

  newPorQ = false;
  newPorQTemplate = new PorQEdit();

  error = '';

  constructor(
    private activeRoute: ActivatedRoute,
    public appData: AppDataService,
    private issuesService: IssuesService,
    private psandQsService: PsandQsService
  ) {}

  ngOnInit(): void {
    const routeParams = this.activeRoute.snapshot.params;
    this.organisationName = this.appData.unKebabUri(
      routeParams.organisationName
    );
    this.groupName = this.appData.unKebabUri(routeParams.groupName);
    this.issueTitle = this.appData.unKebabUri(routeParams.issue);

    this.issuesService
      .GetIssue(this.organisationName, this.groupName, this.issueTitle)
      .pipe(
        concatMap(issue => {
          this.issue = issue;
          const proposalStatusID = this.issuesService.DefaultProposalStatus(
            issue?.statusID ? issue.statusID : IssueStatuses.None
          );
          return this.psandQsService.PsAndQsSelectIssue(
            this.issue.groupID,
            this.issue.issueID,
            this.porQTypeID,
            proposalStatusID,
            false
          );
        })
      )
      .subscribe({
        next: (PSR: PorQSelectionResult) => (this.psOrQs = PSR.psOrQs),
        error: serverError => (this.error = serverError.error.detail)
      });
  }

  NewPorQ(): void {
    this.newPorQTemplate = new PorQEdit();
    this.newPorQTemplate.issueID = this.issue?.issueID ? this.issue.issueID : 0;
    this.newPorQTemplate.porQID = -1;
    this.newPorQTemplate.porQTypeID = this.porQTypeID;
    this.newPorQ = true;
  }

  cancelNewPorQ(): void {
    this.newPorQ = false;
  }

  completeNewPorQ(): void {
    this.newPorQ = false;
    this.getPsOrQs();
    this.getCounts();
  }

  setPorQType(porQTypeID: PorQTypes): void {
    // If switching from question to perspective or proposal, set proposalStatusID
    if (
      this.porQTypeID === PorQTypes.Question &&
      porQTypeID !== PorQTypes.Question
    ) {
      switch (this.issueStatusID) {
        case IssueStatuses.Discussion:
          this.proposalStatusID = ProposalStatuses.VotingYetToStart;
          break;
        case IssueStatuses.ProposalVoting:
          this.proposalStatusID = ProposalStatuses.VotingInProgress;
          break;
        default:
          this.proposalStatusID = ProposalStatuses.ProposalAccepted;
          break;
      }
    }

    this.porQTypeID = porQTypeID;
    if (porQTypeID === PorQTypes.Question) {
      this.proposalStatusID = ProposalStatuses.Question;
    }
    this.getPsOrQs();
  }

  setProposalStatus(proposalStatusID: ProposalStatuses): void {
    if (this.porQTypeID !== PorQTypes.Question) {
      // Proposal Status is not relevant to Questions
      this.proposalStatusID = proposalStatusID;
      this.getPsOrQs();
    }
  }

  getPsOrQs(): void {
    if (!this.issue) {
      this.error = 'No issue selected';
    } else {
      this.error = '';

      this.psandQsService
        .PsAndQsSelectIssue(
          this.issue.groupID,
          this.issue.issueID,
          this.porQTypeID,
          this.proposalStatusID,
          false
        )
        .subscribe({
          next: (psr: PorQSelectionResult) => (this.psOrQs = psr.psOrQs),
          error: serverError => (this.error = serverError.error.detail)
        });
    }
  }

  getCounts(): void {
    if (!this.issue) {
      this.error = 'No issue selected';
    } else {
      this.error = '';

      this.issuesService.IssuePorQCounts(this.issue.issueID).subscribe({
        next: (ipq: IssuePorQCounts) => {
          if (this.issue) {
            this.issue.questions = ipq.questions;
            this.issue.perspectives = ipq.perspectives;
            this.issue.proposals = ipq.proposals;

            this.issue.perspectivesInDiscussion = ipq.perspectivesInDiscussion;
            this.issue.perspectivesAccepted = ipq.perspectivesAccepted;
            this.issue.perspectivesRejected = ipq.perspectivesRejected;

            this.issue.proposalsInDiscussion = ipq.proposalsInDiscussion;
            this.issue.proposalsAccepted = ipq.proposalsAccepted;
            this.issue.proposalsRejected = ipq.proposalsRejected;
          }
        },
        error: serverError => (this.error = serverError.error.detail)
      });
    }
  }

  PorQDeleted(): void {
    this.getCounts();
  }
}
