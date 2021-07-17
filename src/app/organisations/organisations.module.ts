// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

// Material
import { MaterialModule } from 'src/app/material.module';

// CKEditor
// import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

// Modules
import { PublicModule } from 'src/app/public/public.module';
import { CustomModule } from 'src/app/custommodule/custom.module';

// Components not declared here
import { TagsPointsComponent } from '../public/tags-points/tags-points.component';

// This module Components
import { ProgressComponent } from './progress/progress.component';

import { PorqEditComponent } from './porq-edit/porq-edit.component';
import { PorqComponent } from './porq/porq.component';
import { PorqDetailsComponent } from './porq-details/porq-details.component';

import { IssueEditComponent } from './issue-edit/issue-edit.component';
import { IssueComponent } from './issue/issue.component';
import { IssueDetailsComponent } from './issue-details/issue-details.component';

import { GroupEditComponent } from './group-edit/group-edit.component';
import { GroupComponent } from './group/group.component';
import { GroupsComponent } from './groups/groups.component';

import { OrganisationEditComponent } from './organisation-edit/organisation-edit.component';
import { OrganisationComponent } from './organisation/organisation.component';
import { OrganisationListComponent } from './organisation-list/organisation-list.component';
import { OrganisationsComponent } from './organisations/organisations.component';

const routes: Routes = [
  { path: 'membership', component: OrganisationsComponent },
  { path: 'available', component: OrganisationsComponent },
  { path: 'new', component: OrganisationsComponent },
  { path: ':organisationName', component: OrganisationComponent },
  { path: ':organisationName/:groupName', component: GroupComponent },
  {
    path: ':organisationName/:groupName/:issue',
    component: IssueDetailsComponent
  },
  {
    path: ':organisationName/:groupName/:issue/:porqId',
    component: PorqDetailsComponent
  },
  // This can't work
  { path: ':group/:tag', component: TagsPointsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    FlexLayoutModule,
    MaterialModule,
    // CKEditorModule,
    PublicModule,
    CustomModule
  ],
  declarations: [
    ProgressComponent,

    PorqEditComponent,
    PorqComponent,
    PorqDetailsComponent,

    IssueEditComponent,
    IssueComponent,
    IssueDetailsComponent,

    GroupEditComponent,
    GroupComponent,
    GroupsComponent,

    OrganisationEditComponent,
    OrganisationComponent,
    OrganisationListComponent,
    OrganisationsComponent
  ]
})
export class OrganisationsModule {}
