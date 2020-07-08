
// Always use camelCase properties
// https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_CamelCasePropertyNamesContractResolver.htm

import { IssuePhases, IssueStatuses } from './enums';
import { ID } from './common';

export class SubGroupIssueCounts {
  countsUpdated: number;
  issuesNotInPrioritisation: number;
  issuesInPrioritisation: number;
  issuesInDiscussion: number;
  issuesInProposalVoting: number;
  issuesClosed: number;
}

export class IssueSelectionResult {

  issueCount: number; // number of issues selcted

  issueIDs: ID[];
  fromDate: string;
  toDate: string;

  issues: Issue[];

  subGroupIssueCounts: SubGroupIssueCounts; // subGroup totals
}

export class Issue {

  // Ownership
  groupIDOwner: number;
  subGroupID: number;
  isIssueOwner: boolean;

  // Issue details
  issueID: number;
  title: string;
  context: string;
  publish: boolean;
  dateTimeCreated: string;

  // Prioritisation
  selectionDateEarliest: string;
  selectionDateLatest: string;
  prioritisationVotes: number;
  prioritisationPoints: number;
  prioritisationRank: number;

  // Voter's Prioritisation
  voterPrioritised: boolean;
  voterPrioritisedAnon: boolean;
  voterPriority: number;
  voteCastDateTime: string;

  // Selection and Progress
  selectedDateTime: string;
  proposalVotingStarts: string;
  decisionDeadline: string;
  jumpStarted: boolean;

  phaseID: IssuePhases;
  statusID: IssueStatuses;

  progress: string;
  phase: string;
  stage: string;
  status: string;

  // PorQ Count
  perspectivesInDiscussion: number;
  perspectivesAccepted: number;
  perspectivesRejected: number;

  proposalsInDiscussion: number;
  proposalsAccepted: number;
  proposalsRejected: number;

  questions: number;
  perspectives: number;
  proposals: number;
  porQTotal: number;
  points: number;
  feedback: number;
}

export class IssueEdit {

  // Ownership
  public groupIDOwner: number;
  public subGroupID: number;

  // Issue Details
  public issueID: number;
  public title: string;
  public context: string;

  // Prioritisation
  public publish: boolean;
  public selectionDateEarliest: string;
  public selectionDateLatest: string;
}

export class IssuePrioritisationVote {
  public prioritisationVotes: number;
  public voteCastDateTime: string;
}

export class IssuePorQCounts {

  questions: number;
  perspectives: number;
  proposals: number;

  perspectivesInDiscussion: number;
  perspectivesAccepted: number;
  perspectivesRejected: number;

  proposalsInDiscussion: number;
  proposalsAccepted: number;
  proposalsRejected: number;
}