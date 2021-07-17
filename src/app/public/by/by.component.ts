// Angular
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

// rxJs
import { Subscription } from 'rxjs';

// Model
import { ByOn } from '../../models/ByOn.model';

// Services
import { LocalDataService } from 'src/app/services/local-data.service';
import { AppDataService } from './../../services/app-data.service';
import { TagsService } from '../../services/tags.service';

@Component({
  selector: 'app-by',
  templateUrl: './by.component.html',
  styleUrls: ['./by.component.css'],
  preserveWhitespaces: true
})
export class ByComponent implements OnInit, OnDestroy {
  // Subscriptions
  private aliases$: Subscription | undefined;

  byAliases: ByOn[] = [];
  onTopics: ByOn[] = [];
  byAlias = '';

  // https://stackoverflow.com/questions/37891752/angular2-add-class-to-item-on-click/37891984
  highlightStatus: Array<boolean> = [];

  waitingVoters = true;
  waitingTopics = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private localData: LocalDataService,
    public appData: AppDataService,
    private tagsService: TagsService
  ) {}

  ngOnInit(): void {
    // Get Aliases
    this.aliases$ = this.tagsService
      .ByAliases('1 jan 2000', '31 dec 2050')
      .subscribe(response => {
        this.byAliases = response;
        this.waitingVoters = false;
      });

    // The ActivatedRoute dies with the routed component and so
    // the subscription dies with it.
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const alias = params.get('alias');
      if (alias) {
        this.ListTopicsByAlias(alias);
      }
    });
  }

  FontSize(Weight: number): string {
    return 100 + Weight * 50 + '%'; // perCent
  }

  highlight(byAlias: string): void {
    for (let i = 0; i < this.byAliases.length; i++) {
      this.highlightStatus[i] = this.byAliases[i].byOn === byAlias;
    }
  }

  ListTopicsByAlias(byAlias: string): void {
    if (byAlias) {
      this.highlight(byAlias);

      this.byAlias = byAlias;

      // Save to Current and to Previous value - used after setting Current to empty string in Tags Component
      this.localData.ActiveAliasForFilter = byAlias;
      this.localData.PreviousAliasSelected = byAlias;

      // Communicate the change to app component
      this.appData.RouteParamChange$.next(`/by/${byAlias}`);

      this.waitingTopics = true;

      this.tagsService
        .TopicsByAlias(byAlias, '1 Jan 2000', '31 Dec 2030')
        .subscribe(response => {
          this.onTopics = response;
          this.waitingTopics = false;
        });
    }
  }

  ngOnDestroy(): void {
    this.aliases$?.unsubscribe();
  }
}
