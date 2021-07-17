import { ID } from './common';
import { PointSupportLevels, PointTypesEnum } from './enums';

export class PointEdit {
  // However the user inputs them, pass them to the server to decode

  pointID = 0;
  pointTitle = ''; // pointLink constructed in API
  pointHTML = '';
  csvImageIDs = '';
  pointTypeID = PointTypesEnum.NotSelected;

  // Link meta data update is handled in the server API
  linkText = ''; // May not be a link, could just be a name
  linkAddress = ''; // link url to the source if any
  showLinkBeforeVote = false;
  showLinkPreview = false;

  youTubeID = '';
  soundCloudTrackID = '';
  slashTags: string[] = [];
  draft = false;
}

// Always use camelCase properties
// https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_CamelCasePropertyNamesContractResolver.htm
export class PointSelectionResult {
  // My server and client code agreed these should be capitalised,
  // but after updating to VS Angular project, framework intervenes and insists lower case
  tagID = 0;
  pointCount = 0;

  pointIDs: ID[] = [];
  fromDate = '';
  toDate = '';

  points: Point[] = [];
}

export class PointFeedback {
  woWWeekEndingDate = new Date(); // Does not need to be formatted
  feedbackDate = ''; // Date pipe eugh!
  feedbackGiven = false;
  feedbackID = 0;
  supportLevelID = PointSupportLevels.None;
  pointModified = false; // has the point been modified after feedback was given?
  woWVote = false;
  comment = '';
  feedbackIsUpdatable = false;
  isFavourite = false;
}

export class PointFeedbackFormData {
  pointID = 0;
  pointSupportLevel = PointSupportLevels.None;
  comment = '';
  feedbackAnon = false;
}

export class PointWoWFormData {
  pointID = 0;
  wow = false;
  feedbackAnon = false;
}

export class WoWWeekInfoVoteNotNeeded {
  woWWeekID = 0;
  woWWeekEndingDate = new Date(); //  Does not need to be formatted
}

// Don't even think of making public properties Pascal Case

export class Point {
  pointID = 0;
  voterIDPoint = 0;
  isPointOwner = false;

  pointTitle = '';
  pointLink = '';
  pointHTML = '';
  preview = '';
  previewImage = '';
  csvImageIDs = '';
  draft = false;

  pointTypeID = PointTypesEnum.Opinion;
  pointTypeIDVoter = 0;

  dateTimeCreated = '';
  dateTimeUpdated = ''; // How many times am I going to attempt to make this a Date to use DateTime Pipe
  youTubeID = '';
  soundCloudTrackID = '';
  slashTags: string[] = [];

  // Manually added link info
  linkText = '';
  linkAddress = '';
  showLinkBeforeVote = false;
  showLinkPreview = false;
  // Additional link info from site meta data
  linkTitle = '';
  linkDescription = '';
  linkImage = '';
  isNewSource = false;

  archived = false;

  rowNumber = 0;
  lastRowNumber = 0;
  lastRow = false;

  pointFeedback = new PointFeedback();

  isFavourite = false;

  attached = false;
  adoptable = false;
  unadoptable = false;

  totalFeedback = 0;
  netSupport = 0;
  perCentInFavour = 0;

  support = 0;
  opposition = 0;
  abstentions = 0;
  reports = 0;

  isInOpenedSurvey = false;
  isInClosedSurvey = false;
  isQuestionAnswer = false;
}

export class PagePreviewMetaData {
  title = '';
  preview = '';
  previewImage = '';
  url = '';
}
