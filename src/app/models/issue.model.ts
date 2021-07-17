// Always use camelCase properties
// https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_CamelCasePropertyNamesContractResolver.htm

import { IssuePhases, IssueStatuses } from './enums';
import { ID } from './common';

export class GroupIssueCounts {
  countsUpdated = 0;
  issuesNotInPrioritisation = 0;
  issuesInPrioritisation = 0;
  issuesInDiscussion = 0;
  issuesInProposalVoting = 0;
  issuesClosed = 0;
}

export class IssueSelectionResult {
  issueCount = 0; // number of issues selected

  issueIDs: ID[] = [];
  fromDate = '';
  toDate = '';

  issues: Issue[] = [];

  groupIssueCounts = new GroupIssueCounts(); // Group totals
}

export class Issue {
  // Ownership
  organisationID = 0;
  groupID = 0;
  isIssueOwner = false;

  // Issue details
  issueID = 0;
  title = '';
  context = '';
  publish = false;
  dateTimeCreated = '';

  // Prioritisation
  selectionDateEarliest = new Date();
  selectionDateLatest = new Date();
  prioritisationVotes = 0;
  prioritisationPoints = 0;
  prioritisationRank = 0;

  // Voter's Prioritisation
  voterPrioritised = false;
  voterPrioritisedAnon = false;
  voterPriority = 0;
  voteCastDateTime = '';

  // Selection and Progress
  selectedDateTime = '';
  proposalVotingStarts = '';
  decisionDeadline = '';
  jumpStarted = false;

  phaseID = IssuePhases.Prioritise;
  statusID = IssueStatuses.None;

  progress = '';
  phase = '';
  stage = '';
  status = '';

  // PorQ Count
  perspectivesInDiscussion = 0;
  perspectivesAccepted = 0;
  perspectivesRejected = 0;

  proposalsInDiscussion = 0;
  proposalsAccepted = 0;
  proposalsRejected = 0;

  questions = 0;
  perspectives = 0;
  proposals = 0;
  porQTotal = 0;
  points = 0;
  feedback = 0;
}

export class IssueEdit {
  // Ownership
  public groupIDOwner = 0;
  public subGroupID = 0;

  // Issue Details
  public issueID = 0;
  public title = '';
  public context = '';

  // Prioritisation
  public publish = false;
  public selectionDateEarliest = new Date();
  public selectionDateLatest = new Date();
}

export class IssuePrioritisationVote {
  public prioritisationVotes = 0;
  public voteCastDateTime = '';
}

export class IssuePorQCounts {
  questions = 0;
  perspectives = 0;
  proposals = 0;

  perspectivesInDiscussion = 0;
  perspectivesAccepted = 0;
  perspectivesRejected = 0;

  proposalsInDiscussion = 0;
  proposalsAccepted = 0;
  proposalsRejected = 0;
}
