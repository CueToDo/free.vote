import { PorQTypes } from './enums';

// Always use camelCase properties
// https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_CamelCasePropertyNamesContractResolver.htm

import { ID } from './common';

export class PorQ {
  issueID = 0;
  porQID = 0;
  public porQTypeID = PorQTypes.Perspective;
  porQ = '';
  title = '';
  porQOwner = false;

  points = 0;
  feedback = 0;
  voteCount = 0;

  dateTime = '';
  latestActivity = '';

  supportLevel = 0;
  adoptYNS = '';
  adopted = false;

  // Cannot access this as property or function even on deep copy cast as PorQ - WHY?
  // Use appData PorQType
  public get porQTypeDescription(): string {
    switch (this.porQTypeID) {
      case PorQTypes.Question:
        return 'Question';
      case PorQTypes.Perspective:
        return 'Perspective';
      case PorQTypes.Proposal:
        return 'Proposal';
    }
    return '';
  }
}

export class PorQSelectionResult {
  porQCount = 0;

  porQIDs: ID[] = [];
  fromDate = '';
  toDate = '';

  psOrQs: PorQ[] = [];
}

export class PorQEdit {
  public issueID = 0;
  public porQID = 0;
  public porQTypeID = PorQTypes.Perspective;
  public title = '';
  public porQ = '';
  public draft = false;
}
