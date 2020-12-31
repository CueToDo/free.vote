// Angular
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Models
import { GeographicalExtentID, MeetingIntervals } from 'src/app/models/enums';
import { Organisation } from 'src/app/models/group.model';
import { SubGroup } from 'src/app/models/sub-group.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { OrganisationsService } from 'src/app/services/groups.service';


@Component({
  selector: 'app-group',
  templateUrl: 'group.component.html',
  styleUrls: ['group.component.css']
})
export class GroupComponent implements OnInit, OnDestroy {

  public OrganisationDisplay: Organisation;
  @Output() Refresh = new EventEmitter();

  public GeographicalExtentID = GeographicalExtentID;

  groupCopy: Organisation;
  groupEdit = false;
  membershipMessage = '';

  newSubGroupTemplate: SubGroup;
  creatingNewSubGroup = false;

  error: string;

  get showCountries(): boolean {
    return this.appData.ShowCountries(this.OrganisationDisplay.geographicalExtentID);
  }

  get showRegions(): boolean {
    return this.appData.ShowRegions(this.OrganisationDisplay.geographicalExtentID);
  }

  get showCities(): boolean {
    return this.appData.ShowCities(this.OrganisationDisplay.geographicalExtentID);
  }

  issuesLink(subGroup: string): string {
    return `/group/${this.appData.kebabUri(this.OrganisationDisplay.organisationName)}/${this.appData.kebabUri(subGroup)}`;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appData: AppDataService,
    private groupsService: OrganisationsService
  ) {
    console.log('constructor');
  }

  ngOnInit(): void {
    console.log('witzend');
    this.getGroup();
  }

  getGroup() {

    let organisationName = this.activatedRoute.snapshot.params['groupName'];
    organisationName = this.appData.unKebabUri(organisationName);

    this.groupsService.Organisation(organisationName, true).subscribe(
      {
        next: (group: Organisation) => {
          console.log('Jezuz', group.organisationName);
          this.OrganisationDisplay = group;
        },
        error: serverError => {
          console.log('WTF', this.error);
          this.error = serverError.error.detail;
        }
      }
    );
  }

  Join() {

    this.error = '';
    this.membershipMessage = '';

    this.groupsService.Join(this.OrganisationDisplay.organisationID).subscribe(
      {
        next: members => {
          this.OrganisationDisplay.groupMember = true;
          this.OrganisationDisplay.members = members;
          this.membershipMessage = 'you have joined the group';
        },
        error: serverError => this.error = serverError.error.detail
      }
    );
  }

  Leave() {

    this.error = '';
    this.membershipMessage = '';

    this.groupsService.Leave(this.OrganisationDisplay.organisationID).subscribe(
      {
        next: members => {
          this.OrganisationDisplay.groupMember = false;
          this.OrganisationDisplay.members = members;
          this.membershipMessage = 'you have left the group';
        },
        error: serverError => this.error = serverError.error.detail
      }
    );
  }

  Activate() {

    this.error = '';

    this.groupsService.Activate(this.OrganisationDisplay.organisationID, true).subscribe(
      {
        next: _ => this.OrganisationDisplay.active = true,
        error: serverError => this.error = serverError.error.detail
      }
    );
  }

  DeActivate() {

    this.error = '';

    this.groupsService.Activate(this.OrganisationDisplay.organisationID, false).subscribe(
      {
        next: _ => this.OrganisationDisplay.active = false,
        error: serverError => this.error = serverError.error.detail
      }
    );
  }

  Edit() {
    this.groupCopy = <Organisation>this.appData.deep(this.OrganisationDisplay); // If we decide to cancel
    this.groupEdit = true;
  }

  Delete() {
    this.error = '';
    if (confirm(`Are you sure you wish to permanently delete this group?
This cannot be undone.`)) {
      this.groupsService.Delete(this.OrganisationDisplay.organisationID)
        .subscribe(
          {
            next: _ => this.router.navigate(['/groups', 'membership']), // this.Refresh.emit(),
            error: serverError => this.error = serverError.error.detail
          }
        );
    }
  }

  Cancel() {
    this.OrganisationDisplay = <Organisation>this.appData.deep(this.groupCopy);
    this.groupEdit = false;
  }

  Complete(group: Organisation) {
    this.OrganisationDisplay = group;
    this.groupEdit = false;
  }

  newSubGroup() {
    this.newSubGroupTemplate = new SubGroup();
    this.newSubGroupTemplate.groupID = this.OrganisationDisplay.organisationID;
    this.newSubGroupTemplate.open = true;
    this.newSubGroupTemplate.meetingIntervalID = MeetingIntervals.Weekly.toString();
    this.newSubGroupTemplate.selectionDayOfWeek = '1';
    this.newSubGroupTemplate.selectionTimeOfDay = '19:00';
    this.newSubGroupTemplate.nextIssueSelectionDate = this.appData.NextMonday();
    this.newSubGroupTemplate.nextIssueSelectionTime = '19:00';
    this.creatingNewSubGroup = true;
  }


  newSubgroupCreated(newSubGroup: string) {
    this.creatingNewSubGroup = false;
    this.getGroup();
  }


  ngOnDestroy() {

  }
}
