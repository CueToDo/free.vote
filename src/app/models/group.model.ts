export class Group {
  organisationID = 0;

  groupID = 0;
  groupName = '';
  groupOwner = false;
  open = false;

  // Decision basis
  decisionBasisOptionID = ''; // for binding
  superMajority = 0;

  // Meeting Interval
  meetingIntervalID = ''; // for binding
  selectionWeekOfMonth = 0;
  selectionDayOfWeek = 0;
  selectionDayOfMonth = 0;
  selectionTimeOfDay = '';

  // Actual selection date
  nextIssueSelectionDate = new Date();
  nextIssueSelectionTime = '';

  // Issues
  issuesNotInPrioritisation = 0;
  issuesInPrioritisation = 0;
  issuesInDiscussion = 0;
  issuesInProposalVoting = 0;
  issuesClosed = 0;
  issuesTotal = 0;

  // Proposals
  proposalsVotingInProgress = 0;
  proposalsAccepted = 0;
  proposalsRejected = 0;
}

export class GroupUpdate {
  organisationID = 0;
  groupID = 0;
  groupName = '';
  groupOwner = false;
  open = false;

  // Decision Basis
  decisionBasisOptionID = '';
  superMajority = 0;

  // Meeting Interval
  meetingIntervalID = '';
  selectionWeekOfMonth = ''; // first, second, third
  selectionDayOfWeek = ''; // thursday
  selectionDayOfMonth = ''; // 21st
  selectionTimeOfDay = '';

  // Actual selection date
  nextIssueSelectionDate = '';
  nextIssueSelectionTime = '';
}
