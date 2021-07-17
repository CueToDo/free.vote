import { OnDestroy } from '@angular/core';
// Angular
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

// RxJs
import { Subscription } from 'rxjs';

// Models
import { Tag } from '../../models/tag.model';
import { TagCloudTypes, PointSortTypes } from './../../models/enums';

// Services
import { AppDataService } from '../../services/app-data.service';
import { TagsService } from '../../services/tags.service';

@Component({
  selector: 'app-tags', // is used as both a regular component and a router-outlet
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css'],
  providers: [], //  Need HttpClientService as well as TagsService. NO: do not decorate components with service providers.
  preserveWhitespaces: true
  // animations: [SlideInOutAnimation]
})
export class TagsComponent implements OnInit, OnDestroy {
  tagCloudType = TagCloudTypes.Trending;
  tags: Tag[] = [];

  @Output() haveTags = new EventEmitter<boolean>();
  @Output() NewSlashTagSelected = new EventEmitter<string>();

  waiting = true;
  hideTags = false;
  toggleText = 'hide tags';

  pointsSelected$?: Subscription;
  tags$?: Subscription;

  // Viewport width monitoring
  width$?: Subscription;
  widthBand = 4;

  @Input()
  set TagCloudType(value: TagCloudTypes) {
    this.tagCloudType = value;
  }

  error = '';

  constructor(
    private appDataService: AppDataService,
    private tagsService: TagsService
  ) {}

  ngOnInit(): void {
    this.fetchTags();

    if (this.tagCloudType === TagCloudTypes.Recent) {
      this.pointsSelected$ = this.appDataService.PointsSelected$.subscribe(() =>
        this.fetchTags()
      );
    }

    // appComponent monitors width and broadcasts via appDataService
    this.width$ = this.appDataService.DisplayWidth$.subscribe(
      (widthBand: number) => {
        this.widthBand = widthBand;
      }
    );
  }

  public fetchTags(): void {
    this.tags$ = this.tagsService.TagCloud(this.tagCloudType).subscribe({
      next: response => {
        this.tags = response;
        this.waiting = false;
        this.haveTags.emit(response && response.length > 0);
      },
      error: serverError => {
        this.error = serverError.error.detail;
      }
    });
  }

  FontSize(Weight: number): string {
    // Restict Weight and font-size for smaller screens

    if (this.widthBand < 1 && Weight > 0) {
      Weight = 0;
    } else if (this.widthBand < 2 && Weight > 1) {
      Weight = 1;
    } else if (this.widthBand < 3 && Weight > 2) {
      Weight = 2;
    } else if (this.widthBand < 4 && Weight > 3) {
      Weight = 3;
    } else if (this.widthBand < 5 && Weight > 4) {
      Weight = 4;
    } else if (Weight > 5) {
      Weight = 5;
    }

    return 100 + Weight * 50 + '%'; // perCent
  }

  setSlashTag(slashTag: string): void {
    // Get appDataService to broadcast (method shared by PointEditComponent)
    this.appDataService.SetSlashTag(slashTag, PointSortTypes.NoChange);

    this.NewSlashTagSelected.emit(slashTag);
  }

  ngOnDestroy(): void {
    if (this.pointsSelected$) {
      this.pointsSelected$.unsubscribe();
    } // Not set for Trending
    this.tags$?.unsubscribe();
    this.width$?.unsubscribe();
  }
}
