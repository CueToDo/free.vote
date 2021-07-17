// Angular
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Material
// import { MatSlideToggle } from '@angular/material/slide-toggle';

// rxjs
import { Subscription } from 'rxjs';

// Model/Enums
import { TagCloudTypes, PointSortTypes } from 'src/app/models/enums';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { LocalDataService } from 'src/app/services/local-data.service';

// Components
import { PointsComponent } from 'src/app/public/points/points.component';
import { TagsComponent } from 'src/app/public/tags/tags.component';
import { PointEditComponent } from 'src/app/public//point-edit/point-edit.component';
import { QuestionEditComponent } from 'src/app/public/question-edit/question-edit.component';

enum tabs {
  trendingTags = 0,
  recentTags = 1,
  points = 2,
  newPoint = 3
}

@Component({
  templateUrl: './tags-points.component.html',
  styleUrls: ['./tags-points.component.css']
})
export class TagsPointsComponent implements OnInit, OnDestroy {
  // Subscriptions
  showPointsTab$: Subscription | undefined;
  reSelectPoints$: Subscription | undefined;
  pointsFilterRemove$: Subscription | undefined;
  width$: Subscription | undefined; // Viewport width monitoring
  widthBand = 4;

  externalTrigger = false; // Set on subscriptions
  applyingFilter = false; // prevent cascading trigger

  // Public variables for use in template
  public tabIndex = tabs.recentTags;

  public topicSelected = '';
  public get slashTagSelected(): string {
    return this.localData.TopicToSlashTag(this.topicSelected);
  }

  public TagCloudTypes = TagCloudTypes;
  public haveRecentSlashTags = false;
  refreshRecent = false;

  qp = 'question'; // bound to radio button value

  public get questions(): boolean {
    return this.qp === 'question';
  }

  showingFilter = false;
  public filterIcon = 'search';
  public filterText = 'search';
  public filterToolTip = 'not filtering point selection';

  public PointSortTypes = PointSortTypes; // enum - template
  pointSortType = PointSortTypes.TrendingActivity;
  sortAscending = false;
  sortDescending = true;
  savedSortDescending = true; // default
  public sortToolTip = '';
  public sortOrderIcon = '';

  // use TRV in parent template https://stackblitz.com/edit/angular-vjbf4s?file=src%2Fapp%2Fcart-table-modal.component.ts
  // use child component type in parent component https://stackoverflow.com/questions/31013461/call-a-method-of-the-child-component
  @ViewChild(PointsComponent, { static: false }) appPoints!: PointsComponent;
  @ViewChild('tagsRecent') tagsRecent!: TagsComponent;
  @ViewChild('newPoint') newPointComponent!: PointEditComponent;
  @ViewChild('newQuestion') newQuestionComponent!: QuestionEditComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private appData: AppDataService,
    public localData: LocalDataService
  ) {}

  ngOnInit(): void {
    this.appData.TagsPointsActive$.next(true);

    this.SetSortTypeIcon(PointSortTypes.TrendingActivity);

    // EXTERNAL ROUTECHANGE (not tab change): Need to subscribe to route change to get route params
    // https://angular-2-training-book.rangle.io/handout/routing/routeparams.html

    const routeparts = this.appData.Route.split('/');

    if (routeparts && routeparts.length === 3) {
      // {0}/slash-tags/trending - length = 3

      this.topicSelected = this.localData.PreviousTopicSelected;

      switch (routeparts[2]) {
        // may have separate tab for following
        case 'recent':
          this.tabIndex = tabs.recentTags;
          break;
        case 'trending':
          this.tabIndex = tabs.trendingTags;
          break;
        default:
          this.tabIndex = tabs.points;
      }
    } else {
      // Route is Topic By Alias
      // {0}/{slashTag}/by/{Alias} - length = 4
      this.topicSelected = this.localData.SlashTagToTopic(routeparts[1]);
      this.tabIndex = 2;
      this.displayFilter(true);
    }

    if (!this.topicSelected || this.topicSelected === 'null') {
      this.appData.TagLatestActivity().subscribe({
        next: slashTag => {
          this.localData.PreviousSlashTagSelected = slashTag;
          this.topicSelected = this.localData.PreviousTopicSelected;
        },
        error: error =>
          console.log('Server Error on getting last slash tag', error)
      });
    }

    // ==========   Subscriptions   ==========

    // Just switch to Points Tab if ByOn hasn't changed
    this.showPointsTab$ = this.appData.ShowPointsTab$.subscribe(() => {
      this.externalTrigger = true;
      this.ChangeTab(tabs.points);
      this.externalTrigger = false;
    });

    this.reSelectPoints$ = this.appData.ReSelectPoints$.subscribe(
      (pointSortType: PointSortTypes) => {
        this.externalTrigger = true;

        this.topicSelected = this.localData.PreviousTopicSelected;

        if (pointSortType !== PointSortTypes.NoChange) {
          this.pointSortType = pointSortType;
        }

        this.SetSortTypeIcon(pointSortType);
        this.ChangeTab(tabs.points);

        this.externalTrigger = false;
      }
    );

    this.pointsFilterRemove$ = this.appData.PointsFilterRemove$.subscribe(
      () => {
        this.externalTrigger = true;
        this.displayFilter(false);
        this.externalTrigger = false;
      }
    );

    // appComponent monitors width and broadcasts via appDataService
    this.width$ = this.appData.DisplayWidth$.subscribe((widthBand: number) => {
      this.widthBand = widthBand;
    });

    // Route does not change if link clicked in tag cloud
    // So need to detect route parameter change
    // This can't be done in app component as this component is already handling the route
    // app component does not detect route parameter change

    // https://angular-2-training-book.rangle.io/handout/routing/routeparams.html
    // https://stackoverflow.com/questions/37144999/angular2-get-router-params-outside-of-router-outlet

    // Also, there’s no need to unsubscribe from the paramMap.
    // The ActivatedRoute dies with the routed component and so
    // the subscription dies with it.
    this.activatedRoute.paramMap.subscribe(params => {
      const titleParam = params.get('title');
      if (titleParam) {
        this.qp = 'point';
      }

      const tag = params.get('tag');
      if (tag) {
        this.localData.PreviousSlashTagSelected = tag;
        // Commnicate change to app component ???

        // if (!this.externalTrigger) {
        //   this.appDataService.RouteParamChange$.next(this.slashTagSelected); // Don't roll into the above
        // }
      }
    });
  }

  NewSlashTagSelected(slashTag: string): void {
    this.topicSelected = this.localData.SlashTagToTopic(slashTag);
  }

  haveRecentTags(haveTags: boolean): void {
    this.haveRecentSlashTags = haveTags;
  }

  /// Change Tab and notify app component in TabChangeComplete
  ChangeTab(tabIndex: tabs): void {
    // Actual tab change, or just title change (due to voter filters)
    const tabChanged = this.tabIndex !== tabIndex;

    this.tabIndex = tabIndex;

    switch (tabIndex) {
      case tabs.trendingTags:
        this.TabChangeComplete(tabChanged, '/slash-tags/trending');
        break;

      case tabs.recentTags:
        if (this.refreshRecent) {
          this.tagsRecent.fetchTags(); // always update on switching to tagsRecent tab
          this.refreshRecent = false;
        }
        this.TabChangeComplete(tabChanged, '/slash-tags/recent');
        break;

      case tabs.points:
        // ActiveAliasForFilter update by the "By" Component (sibling),
        // AND child Tags and Points Components
        const alias = this.localData.ActiveAliasForFilter;
        if (alias) {
          if (!this.externalTrigger) {
            // Communicate the change - it's just a tab change, not a previous alias or topic change
          }

          if (!this.applyingFilter) {
            this.displayFilter(true);
          }
          // Filter on Alias
          this.TabChangeComplete(
            tabChanged,
            `/${this.topicSelected}/by/${alias}`
          );
        } else if (!this.externalTrigger) {
          this.TabChangeComplete(tabChanged, this.slashTagSelected); // Tell the app component
        }
        break;
      case tabs.newPoint:
        if (this.qp === 'question') {
          this.newQuestionComponent.NewQuestion(this.slashTagSelected);
        } else {
          this.newPointComponent.NewPoint(this.slashTagSelected);
        }

        this.TabChangeComplete(tabChanged, '/new-point');
        break;
    }
  }

  // Tell the App Component that the route has changed
  TabChangeComplete(hasChanged: boolean, switchedTo: string): void {
    if (hasChanged && !this.externalTrigger) {
      this.appData.RouteParamChange$.next(switchedTo);
    }
  }

  changeQP(): void {
    const filterQuestions = this.qp === 'question';

    // Switch to points display if on trending or recent
    switch (this.tabIndex) {
      case tabs.trendingTags:
      case tabs.recentTags:
        this.ChangeTab(tabs.points);
    }

    this.appPoints.FilterQuestions(filterQuestions);
  }

  // From the template filter button and directly from child Points Component
  applyFilter(filter: boolean): void {
    this.displayFilter(filter); /// may be recalled in ChangeTab

    this.applyingFilter = true;
    this.ChangeTab(tabs.points);
    this.applyingFilter = false;
  }

  // init, subscription, ChangeTab, applyFilter
  displayFilter(filter: boolean): void {
    this.showingFilter = filter;

    if (this.showingFilter) {
      this.filterIcon = 'manage_search';
      this.filterText = 'searching';
      this.filterToolTip = 'filtering point selection';
    } else {
      this.filterIcon = 'search';
      this.filterText = 'search';
      this.filterToolTip = 'not filtering point selection';
    }

    if (!this.externalTrigger) {
      // Only get Points component to reselect points if there is a change of filter criteria
      let filterChange = false;
      if (!this.appPoints) {
        filterChange = true;
      } else if (filter) {
        filterChange = this.appPoints.HasSavedFilter(); // Will a filter be applied?
      } else {
        filterChange = this.appPoints.HasFilter(); // Will a filter be removed?
      }

      // Get point component to show/hide filter criteria
      this.appData.PointsFiltered$.next(this.showingFilter);

      if (filterChange) {
        // #97 reselect points if filter changes
        this.appData.ReSelectPoints$.next(PointSortTypes.NoChange); // ToDo Communicate directly with child
      }
    }
    this.tabIndex = tabs.points;
  }

  // From child Points Component
  pointSortTypeChanged(pointSortType: PointSortTypes): void {
    this.externalTrigger = true;
    this.SetSortTypeIcon(pointSortType);
    this.externalTrigger = false;
  }

  SetSortTypeIcon(pointSortType: PointSortTypes): void {
    if (pointSortType !== PointSortTypes.NoChange) {
      if (pointSortType === PointSortTypes.DateDescend) {
        pointSortType = PointSortTypes.DateCreated;
      }

      this.pointSortType = pointSortType;

      switch (pointSortType) {
        case PointSortTypes.TrendingActivity:
          this.sortOrderIcon = 'trending_up';
          this.sortToolTip = 'showing points trending now';
          break;
        case PointSortTypes.AllTimePopularity:
          this.sortOrderIcon = 'favorite_border';
          this.sortToolTip = 'showing most popular first (all time)';
          break;
        case PointSortTypes.Random:
          this.sortOrderIcon = 'gesture';
          this.sortToolTip = 'showing in random order';
          break;
        default:
          this.sortOrderIcon = 'calendar_today';
          this.sortToolTip = 'showing most recent first';
          break;
      }
    }
  }

  SetSortDescending(descending: boolean): void {
    this.sortDescending = descending;
    this.savedSortDescending = descending;
    this.sortAscending = !descending;

    // Can't reverse random, so default to TrendingActivity
    if (this.pointSortType === PointSortTypes.Random) {
      this.pointSortType = PointSortTypes.TrendingActivity;
    }

    if (!this.externalTrigger) {
      this.appData.PointSortAscending$.next(this.sortAscending);
    }

    this.SetSortTypeIcon(this.pointSortType);
  }

  sortBy(pointSortType: PointSortTypes): void {
    if (
      this.pointSortType !== pointSortType ||
      pointSortType === PointSortTypes.Random
    ) {
      // New sort order or user clicked random again

      // Communicate to PointsComponent - is a child could/should use Input?
      if (!this.externalTrigger) {
        this.appData.PointSortType$.next(pointSortType); // New random order or sort type
      }

      this.tabIndex = tabs.points;
      this.ChangeTab(this.tabIndex);

      if (pointSortType === PointSortTypes.Random) {
        // Save old values and set to false
        this.savedSortDescending = this.sortDescending;
        this.sortDescending = false;
        this.sortAscending = false;
      } else {
        // restore old values if switch to non-random sort
        this.sortDescending = this.savedSortDescending;
        this.sortAscending = !this.savedSortDescending;
      }

      this.SetSortTypeIcon(pointSortType);
    }
  }

  refresh(): void {
    this.externalTrigger = true; // prevent further communication to points component
    this.appData.PointSortAscending$.next(this.sortAscending); // This communicates to points component
    this.externalTrigger = false;
  }

  onCancelNew(): void {
    this.tabIndex = tabs.points;
  }

  onCompleteNew(): void {
    // Do nothing, this component also handles subscriptions
    // this.NewSlashTagSelected(this.appDataService.PreviousSlashTagSelected); // Set in PointEdit
    // this.tabIndex = tabs.points;
    // this.pointSortType = PointSortTypes.DateUpdated;
    // this.setSortIcon(this.pointSortType);

    this.externalTrigger = true;
    this.SetSortDescending(true);
    this.externalTrigger = false;
  }

  ngOnDestroy(): void {
    this.showPointsTab$?.unsubscribe();
    this.reSelectPoints$?.unsubscribe();
    this.pointsFilterRemove$?.unsubscribe();
    this.width$?.unsubscribe();
  }
}
