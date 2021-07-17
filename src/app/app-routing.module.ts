// Angular
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { CallbackComponent } from './public/callback/callback.component';
import { HomeComponent } from './public/home/home.component';
import { CardComponent } from './public/card/card.component';
import { PointOfTheWeekComponent } from './public/point-of-the-week/point-of-the-week.component';
import { ScrollerComponent } from './public/scroller/scroller.component';
import { VotersMenuComponent } from './public/voters-menu/voters-menu.component';
import { TagsPointsComponent } from './public/tags-points/tags-points.component';
import { QuestionAnswersComponent } from './public/question-answers/question-answers.component';

// Services: if decorated with "providedIn", no need to import and must NOT add to providers
// Only need to import LoginRouteGuardService as it's used in appRoots declaration
import { LoginRouteGuardService } from './services/login-route-guard.service';

const appRoutes: Routes = [
  // Refresh in browser fails - when route is specified
  // Make a web.config file in the root directory.
  // https://stackoverflow.com/questions/35284988/angular-2-404-error-occur-when-i-refresh-through-the-browser

  // https://stackoverflow.com/questions/49566446/how-can-i-have-iis-properly-serve-webmanifest-files-on-my-web-site
  // Map the .webmanifest file extension to its appropriate MIME type.

  // route order must avoid ambiguities between route and parameters (alias, tag, tab)
  { path: 'scroller', component: ScrollerComponent }, // a test component

  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'card', component: CardComponent },

  { path: 'callback', component: CallbackComponent },

  {
    path: 'voters',
    component: VotersMenuComponent,
    canActivate: [LoginRouteGuardService]
  },
  {
    path: 'voters/:alias',
    component: VotersMenuComponent,
    canActivate: [LoginRouteGuardService]
  },
  { path: 'by/:alias', component: TagsPointsComponent },
  {
    path: 'point-of-the-week',
    component: PointOfTheWeekComponent,
    canActivate: [LoginRouteGuardService]
  },

  // organisations, groups and profile
  {
    path: 'organisations',
    loadChildren: () =>
      import('./organisations/organisations.module').then(
        m => m.OrganisationsModule
      ),
    canActivate: [LoginRouteGuardService]
  },
  {
    path: 'my/:tab',
    loadChildren: () => import('./my/my.module').then(m => m.MyModule),
    canActivate: [LoginRouteGuardService]
  },

  // slashtags is the "internal" link to TagsPointsComponent from which all TABS are accessible
  { path: 'slash-tags', component: TagsPointsComponent }, // TAGS: TagsPointsComponent can handle tags, people or points

  // following are "external" links - need to be tested from url, not tab links
  { path: 'slash-tags/trending', component: TagsPointsComponent }, // TAGS
  { path: 'slash-tags/recent', component: TagsPointsComponent }, // TAGS personal - recent selection - works on anon?
  { path: 'new-point', component: TagsPointsComponent },
  { path: 'slash-tag/:tag/:title', component: TagsPointsComponent },
  { path: ':tag/by/:alias', component: TagsPointsComponent },
  { path: ':tag/question/:questionSlug', component: QuestionAnswersComponent },
  { path: ':tag/:pointId', component: TagsPointsComponent },
  { path: ':tag', component: TagsPointsComponent }, // POINTS: still like the SlashTag
  // Azure only:https://bossprogrammer.medium.com/how-to-deploy-an-angular-10-universal-app-with-server-side-rendering-to-azure-a2b90df9ca64
  { path: '**', redirectTo: '' } // Add a wildcard route to app-routing.module.ts )
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
      initialNavigation: 'enabled' // Client Side Browser refresh
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
