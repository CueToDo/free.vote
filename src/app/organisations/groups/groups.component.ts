// Angular
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Model
// import { Group } from 'src/app/models/group.model';

// Services
// import { AppDataService } from 'src/app/services/app-data.service';
// import { GroupsService } from 'src/app/services/groups.service';

@Component({
  selector: 'app-groups', // Router-outlet
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  // Parent organisation
  organisationName = '';
  organisationID = 0;

  // groups: Group[];
  // groupsFiltered: Group[];
  groupSelected = '';
  // newGroupTemplate: Group;
  creatingNewGroup = false;

  error = '';

  constructor(private activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    const routeParams = this.activeRoute.snapshot.params;

    // Parent organisation
    // this.organisationName = this.appData.unKebab(routeParams.organisationName);
    // this.organisationID = this.groupsService.OrganisationID(this.organisationName);

    // Selected Group
    // this.groupSelected = this.appData.unKebab(routeParams.groupName);

    this.getGroups();
  }

  getGroups(): void {
    this.error = '';

    // this.groupsService.Groups(this.groupID).subscribe(
    //   {
    //     next: groups => {
    //       this.groups = groups as Group[];
    //       this.SelectGroup();
    //     },
    //     error: serverError => this.error = serverError.error.detail
    //   }
    // );
  }

  SelectGroup(): void {
    // this.groupsFiltered = this.groups.filter(group => group['groupName'] === this.groupSelected);
  }

  // groupUpdated() {
  //   this.getGroups();
  //   this.creatingNewGroup = false;
  // }

  // newGroupCreated(newGroup: string) {
  //   this.groupSelected = newGroup;
  //   this.groupUpdated();
  // }

  // groupDeleted() {
  //   this.getGroups(); // could just remove from local groups array
  //   if (this.groups.length > 0) {
  //     this.groupSelected = this.groups[0].groupName;
  //   }
  // }

  // get groupID(): number {
  //   return this.groupsFiltered[0].groupID;
  // }
}

// <div fxFill fxLayout="column">

//     <div fxLayout="column" class="tabContainer">

//         <div class="tabContent scroller">

//             <div class="centerStage">

//                 <div fxLayoutAlign="center">

//                     <div class="content" fxLayout="column">

//                         <!-- Return to organisation -->
//                         <div fxLayout="row wrap" fxLayoutAlign="start center">
//                             Back to <a [routerLink]="['/organisationss', organisationName]">{{ organisationName }}</a>
//                             <div fxFlex></div>
//                         </div>

//                         <!-- List groups -->
//                         <ng-container *ngIf="!creatingNewGroup">
//                             <div *ngFor="let group of groupsFiltered">
//                                 <app-group [group]="group" [groupName]="groupName" (groupUpdated)="groupUpdated()"
//                                     (groupDeleted)="groupDeleted()">
//                                 </app-group>
//                             </div>
//                         </ng-container>

//                         <!-- New Group -->
//                         <app-group-edit *ngIf="creatingNewGroup" [group]="newGroupTemplate"
//                             (complete)="newGroupCreated($event)" (cancelled)="creatingNewGroup=false">
//                         </app-group-edit>

//                         <div *ngIf="!!error" class="alert alert-danger mt-3">
//                             {{ error }}
//                         </div>

//                     </div>

//                 </div>

//             </div>

//         </div>

//     </div>

// </div>
