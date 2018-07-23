export class Point {

    PointID: number;
    VoterIDPoint: number;

    PointTypeID: number;
    PointTypeIDVoter: number;

    PointText: string;

    Draft: boolean;
    Source: string;
    URL: string;
    Archived: boolean;
    DateTimeUpdated: string;

    Sequence: number;
    LastRowNumber: number;
    LastRow: boolean;

    FeedbackGiven: boolean;
    FeedbackID: number;
    SupportLevelID: number;
    Comment: string;
    FeedbackDate: string;
    FeedbackIsUpdatable: boolean;
    WoWVote: boolean;

    Attached: boolean;

    Adoptable: boolean;
    Unadoptable: boolean;

    TotalFeedback: number;
    NetSupport: number;
    PerCentInFavour: number;

    Support: number;
    Opposition: number;
    Abstentions: number;
    Reports: number;

    IsInOpenedSurvey: boolean;
    IsInClosedSurvey: boolean;
    IsQuestionAnswer: boolean;
  }


  export class PointSelectionResult {
    PointsSelected: number;
    FromDate: string;
    ToDate: string;
    Points: Point[];
  }