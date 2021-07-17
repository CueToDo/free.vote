// Angular
import { Component, Input } from '@angular/core';

// Model
import { Organisation } from 'src/app/models/organisation.model';

// Services
import { AppDataService } from '../../services/app-data.service';
import { OrganisationsService } from 'src/app/services/groups.service';

@Component({
  selector: 'app-organisation-list',
  templateUrl: './organisation-list.component.html',
  styleUrls: ['./organisation-list.component.css']
})
export class OrganisationListComponent {
  @Input() CurrentMembership = false;

  public organisations: Organisation[] = [];
  public organisationCount = 0;
  public organisationFilter = '';
  public waiting = false;
  public message = '';
  public error = '';

  constructor(
    public appData: AppDataService,
    private groupsService: OrganisationsService
  ) {}

  @Input() Refresh(): void {
    this.organisations = [];
    this.waiting = true;
    this.message = '';
    this.error = '';

    if (this.CurrentMembership) {
      this.groupsService
        .OrganisationMembership(this.organisationFilter)
        .subscribe({
          next: groups => {
            this.organisations = groups;
            this.organisationCount = groups.length;
            if (this.organisationCount === 0) {
              if (this.organisationFilter) {
                this.message =
                  'You are not a member of any groups that match the search';
              } else {
                this.message = 'You are not a member of any groups';
              }
            }
          },
          error: serverError => (this.error = serverError.error.detail),
          complete: () => (this.waiting = false)
        });
    } else {
      this.groupsService
        .OrganisationsAvailable(this.organisationFilter)
        .subscribe({
          next: groups => {
            this.organisations = groups;
            this.organisationCount = groups.length;
            if (this.organisationCount === 0) {
              if (this.organisationFilter) {
                this.message =
                  'No organisations are available to join that match the search';
              } else {
                this.message = 'No more organisations are available to join';
              }
            }
          },
          error: serverError => (this.error = serverError.error.detail),
          complete: () => (this.waiting = false)
        });
    }
  }
}
