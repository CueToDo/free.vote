// Angular
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Model
import { Organisation } from 'src/app/models/organisation.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';

// Components
import { OrganisationListComponent } from 'src/app/organisations/organisation-list/organisation-list.component';
import { OrganisationEditComponent } from 'src/app/organisations/organisation-edit/organisation-edit.component';

@Component({
  selector: 'app-organisations',
  templateUrl: './organisations.component.html',
  styleUrls: ['./organisations.component.css']
})
export class OrganisationsComponent implements OnInit, AfterViewInit {
  @ViewChild('OrganisationMembership')
  organisationMembership!: OrganisationListComponent;

  @ViewChild('OrganisationsAvailable')
  groupsAvailable!: OrganisationListComponent;

  @ViewChild('NewGroupComponent')
  newGroupComponent!: OrganisationEditComponent;

  public tabIndex = 0;
  private tabSelected = '';
  public NewOrganisation = new Organisation();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appDataService: AppDataService
  ) {}

  ngOnInit(): void {
    this.StartNewGroup(); // For GroupEdit, do this early

    // tab is not a route parameter, but a route segment
    // this.tabSelected = this.activatedRoute.snapshot.params['tab'];

    // https://stackoverflow.com/questions/49684409/how-to-get-angular-5-route-segments-from-activatedroute
    this.tabSelected = this.activatedRoute.snapshot.url[0].path;

    if (!this.tabSelected) {
      this.tabSelected = 'membership';
    }

    switch (this.tabSelected) {
      case 'membership':
        this.tabIndex = 0;
        break;
      case 'available':
        this.tabIndex = 1;
        break;
      case 'new':
        this.tabIndex = 2;
        break;
    }
  }

  ngAfterViewInit(): void {
    this.organisationMembership?.Refresh();
    this.groupsAvailable?.Refresh();
    this.newGroupComponent?.ClearError();
  }

  ChangeTab(tabIndex: number): void {
    this.tabIndex = tabIndex;

    switch (tabIndex) {
      case 0:
        this.organisationMembership?.Refresh();
        this.appDataService.RouteParamChange$.next('/groups/membership');
        break;
      case 1:
        this.groupsAvailable?.Refresh();
        this.appDataService.RouteParamChange$.next('/groups/available');
        break;
      case 2:
        this.StartNewGroup();
        this.newGroupComponent?.ClearError();
        this.appDataService.RouteParamChange$.next('/groups/new');
        break;
    }
  }

  CancelNew(): void {
    this.ChangeTab(0);
  }

  CompleteNew(group: Organisation): void {
    this.router.navigate(['/groups', group.organisationName]);
  }

  StartNewGroup(): void {
    this.NewOrganisation = new Organisation();
    this.NewOrganisation.countries = ['UK'];
  }
}
