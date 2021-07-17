// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Lodash https://github.com/lodash/lodash/issues/3192
import { cloneDeep } from 'lodash-es';

// Models, Enums
import { IssueStatuses, ProposalStatuses } from './../models/enums';
import {
  IssueSelectionResult,
  Issue,
  IssueEdit,
  IssuePrioritisationVote,
  IssuePorQCounts
} from '../models/issue.model';
import { GroupIssueCounts } from './../models/issue.model';

// Services
import { HttpService } from './http.service';
import { AppDataService } from './app-data.service';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private batchSize = 50;
  private pageSize = 10;

  constructor(
    private httpClientService: HttpService,
    private appDataService: AppDataService
  ) {}

  // Standard selections:
  // 1) First batch
  // 2) Subsequent batch (very similar to above, can these be consolidated?)
  // 3) Page of points for all selection methods
  GetIssuesForGroup(
    groupID: number,
    statusID: IssueStatuses
  ): Observable<IssueSelectionResult> {
    // No Filters + infinite scroll on DateOrder desc
    const apiUrl = `issues/getFirstBatchForGroup/${groupID}/${statusID}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToIssuesSelectionResult(returnData)));
  }

  CastToIssuesSelectionResult(sourceData: any): IssueSelectionResult {
    const ISR = new IssueSelectionResult();

    ISR.issueCount = sourceData.pointCount;
    ISR.fromDate = sourceData.fromDate;
    ISR.toDate = sourceData.toDate;

    // construct an Array of objects from an object
    ISR.issueIDs = this.appDataService.CastObjectToIDs(sourceData.issueIDs);

    ISR.issues = sourceData.issues;

    console.log(sourceData);

    ISR.groupIssueCounts = cloneDeep(
      sourceData.groupIssueCounts
    ) as GroupIssueCounts;

    return ISR;
  }

  GetIssue(
    groupName: string,
    subGroupName: string,
    issueTitle: string
  ): Observable<Issue> {
    const apiUrl = `issues/issueSelectByTitle/${groupName}/${subGroupName}/${issueTitle}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => returnData.issues[0] as Issue));
  }

  IssuePorQCounts(issueID: number): Observable<IssuePorQCounts> {
    const apiUrl = `issues/PorQCounts/${issueID}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => returnData as IssuePorQCounts));
  }

  IssueUpdate(issue: Issue): Observable<number> {
    // Input parameter is Point not PointEdit
    // construct a new PointEdit (all that's needed)

    const postData = {
      // Ownership
      groupIDOwner: issue.organisationID,
      subGroupID: issue.groupID,

      // Issue Details
      issueID: issue.issueID,
      title: issue.title,
      context: issue.context,

      // Prioritisation
      publish: issue.publish,
      selectionDateEarliest: issue.selectionDateEarliest,
      selectionDateLatest: issue.selectionDateLatest
    } as IssueEdit;

    return this.httpClientService.post('issues/issueUpdate', postData);
  }

  IssuePublish(issueID: number, publish: boolean): Observable<boolean> {
    return this.httpClientService.get(`issues/publish/${issueID}/${publish}`);
  }

  IssueDelete(subGroupID: number, issueID: number): Observable<boolean> {
    return this.httpClientService.get(`issues/delete/${subGroupID}/${issueID}`);
  }

  VoteToDiscuss(
    issueID: number,
    priority: number
  ): Observable<IssuePrioritisationVote> {
    return this.httpClientService
      .get(`issues/voteToDiscuss/${issueID}/${priority}`)
      .pipe(map(ipv => ipv as IssuePrioritisationVote));
  }

  DefaultProposalStatus(issueStatus: IssueStatuses): ProposalStatuses {
    switch (issueStatus) {
      case IssueStatuses.ProposalVoting:
        return ProposalStatuses.VotingInProgress;
      case IssueStatuses.Closed:
        return ProposalStatuses.ProposalAccepted;
      default:
        return ProposalStatuses.VotingYetToStart;
    }
  }
}
