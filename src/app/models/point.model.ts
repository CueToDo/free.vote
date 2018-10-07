import { PointSupportLevels, PointTypesEnum } from './enums';

export class Point {

  PointID: number;
  VoterIDPoint: number;
  IsPointOwner: boolean;

  PointTypeID: PointTypesEnum;
  PointTypeIDVoter: number;

  PointHTML: string;

  Draft: boolean;
  Source: string;
  URL: string;
  Archived: boolean;

  DateTimeUpdated: string; // How many times am I going to attempt to make this a Date to use DateTime Pipe
  // get DateTimeUpdated(): string {
  //   return this.dateTimeUpdated;
  // }
  // set DateTimeUpdated(dateTimeUpdated: string) {

  // }

  Sequence: number;
  LastRowNumber: number;
  LastRow: boolean;

  PointFeedback: PointFeedback;

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

  SlashTags: string[];
}

export class PointEdit {
  PointID: number;
  PointHTML: string;
  SlashTags: string; // However the use inputs them, pass them to the server to decode
  Draft: boolean;
}

export class PointSelectionResult {
  PointsSelected: number;
  FromDate: string;
  ToDate: string;
  Points: Point[];
}

export class PointFeedback {
  WoWWeekID: number;
  WoWWeekEndingDate: Date; //  Does not need to be formatted

  FeedbackGiven: boolean;
  FeedbackID: number;
  SupportLevelID: PointSupportLevels;
  WoWVote: boolean;
  Comment: string;
  FeedbackDate: string; // Date pipe eugh!
  FeedbackIsUpdatable: boolean;
}

export class WoWWeekInfoVote {
  WoWWeekID: number;
  WoWWeekEndingDate: Date; //  Does not need to be formatted
}
