import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs/internal/Subscription';

// FreeVote Models, Services
import { LocalDataService } from 'src/app/services/local-data.service';
import { AppDataService } from 'src/app/services/app-data.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  PageName$: Subscription | undefined;
  LoggedIn$: Subscription | undefined;
  tagsPointsActive$: Subscription | undefined;
  showBurger$: Subscription | undefined;

  public loggedInToAuth0 = false;
  public tabSelected = '';
  public showBurger = false;
  public error = '';

  constructor(
    public localData: LocalDataService,
    private appDataService: AppDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // https://medium.com/@tomastrajan/how-to-get-route-path-parameters-in-non-routed-angular-components-32fc90d9cb52
    // menu.component is a non-routed component - it does not have it's own path
    // and never appears in router-outlet.
    // Use injected service to communicate between components

    // Following used to highlight slash tags menu item when clicking on tag in voter tag cloud
    this.tagsPointsActive$ = this.appDataService.TagsPointsActive$.subscribe(
      tagsPointsActive => {
        if (tagsPointsActive) {
          this.tabSelected = 'slashTags';
        }
      } // simply return boolean value to template
    );

    this.showBurger$ = this.appDataService.ShowBurger$.subscribe(
      (showBurger: boolean) => {
        this.showBurger = showBurger;
      }
    );

    this.PageName$ = this.appDataService.PageName$.subscribe({
      next: pageName => (this.tabSelected = pageName)
    });

    this.LoggedIn$ = this.localData.LoggedInToAuth0$.subscribe({
      // subscribe to a changing value and allow component to handle change detection internally (?)
      next: loggedIn => (this.loggedInToAuth0 = loggedIn),
      error: err => (this.error = err)
    });
  }

  ngOnDestroy(): void {
    this.PageName$?.unsubscribe();
    this.LoggedIn$?.unsubscribe();
    this.tagsPointsActive$?.unsubscribe();
    this.showBurger$?.unsubscribe();
  }
}
