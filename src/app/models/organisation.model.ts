import { GeographicalExtentID } from './enums';

export class Organisation {
  organisationID = 0;
  organisationName = '';
  groups: string[] = [];
  organisationWebsite = '';
  description = '';
  active = false;
  geographicalExtentID = GeographicalExtentID.National.toString(); // for html binding use string
  // AND API must return string otherwise javascript overrides specified type making it a number
  geographicalExtent = '';
  invitationOnly = false; // Only private groups can be invitation only
  Sections: string[] = []; // database sorts
  defaultSection = '';
  countries: string[] = []; // database sorts
  regions: string[] = [];
  cities: string[] = [];
  members = 0;
  issues = 0; // Topics
  organisationOwner = false;
  organisationAdministrator = false;
  organisationMember = false;
  canInviteMembers = false;
  row = 0;
}
