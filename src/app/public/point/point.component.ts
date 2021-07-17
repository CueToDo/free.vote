import { AppDataService } from 'src/app/services/app-data.service';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

// Models & enums
import { Point, PointFeedback } from '../../models/point.model';
import {
  PointSupportLevels,
  PointFlags,
  PointTypesEnum
} from '../../models/enums';

// Services
import { PointsService } from '../../services/points.service';
import { LocalDataService } from '../../services/local-data.service';

@Component({
  selector: 'app-point',
  templateUrl: './point.component.html',
  styleUrls: ['./point.component.css'],
  preserveWhitespaces: true
})
export class PointComponent implements OnInit {
  @Input() point = new Point();
  @Input() pointCount = 0;
  @Input() isPorQPoint = false;
  @Input() possibleAnswer = false;
  @Input() isMyAnswer = false;

  @Output() PointDeleted = new EventEmitter();
  @Output() AddPointToAnswers = new EventEmitter();
  @Output() RemovePointFromAnswers = new EventEmitter();

  // bind to point slashtags (not topic)
  slashTags: string[] = []; // = [<Tag>{ SlashTag: '/slash' }, <Tag>{ SlashTag: '/hash' }];
  youTubeIDs: string[] = [];
  vimeoIDs: string[] = [];
  soundCloudTrackIDs: string[] = [];
  pointHTMLwithoutEmbed = '';

  editing = false;
  justUpdated = false;
  updatingPreview = false;

  public PointSupportLevels = PointSupportLevels;

  get showLink(): boolean {
    if (!this.point) {
      this.error = 'Missing: point';
      return false;
    } else {
      return this.appData.ShowSource(this.point.pointTypeID);
    }
  }

  error = '';

  public linkShare = '';

  // https://stackoverflow.com/questions/37277527/how-to-use-enum-in-angular-2-templates
  // https://stackoverflow.com/questions/35923744/pass-enums-in-angular2-view-templates
  public PointTypesEnum = PointTypesEnum;

  constructor(
    public localData: LocalDataService, // public - used in template
    private appData: AppDataService,
    private pointsService: PointsService
  ) {}

  ngOnInit(): void {
    // Angular Workshop filter is not a function

    // this.tags = this.tags.filter(x => x.SlashTag !== '/hash');

    // this.tags = this.point.Tags;

    // this.tags = this.point.Tags.filter((tag: Tag) => tag.SlashTag !== this.router.url);
    // this.tags = this.point.Tags.filter((tag, index, arr) => tag.SlashTag !== this.router.url);

    // function notThisRoute (element: Tag, index, array) { return element.SlashTag !== this.router.url; }
    // this.tags = this.point.Tags.filter(notThisRoute);

    // this.tags = this.point.Tags.filter(x => true);

    // No subscriptions

    this.AssignTags();

    if (this.point?.isNewSource) {
      // Will not be newSource if not showLinkPreview - so no redundant check
      // A new point has been added to the list but meta data has not been retrieved yet for source
      this.FetchMetaData();
    }

    this.extractMediaEmbeds();

    this.linkShare =
      this.localData.websiteUrl +
      'slash-tag' +
      this.localData.PreviousSlashTagSelected +
      '/' +
      this.SelectSingleTitle;
  }

  AssignTags(): void {
    // Filter out current tag
    // SlashTagSelected updated as soon as tag clicked
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      this.slashTags = this.point.slashTags.filter(
        tag =>
          tag.toLowerCase() !==
          this.localData.PreviousSlashTagSelected.toLowerCase()
      );
    }
  }

  // PointTitle or PointID to be able to select single point
  get SelectSingleTitle(): string {
    if (!this.point) {
      this.error = 'Missing: point';
      return '';
    } else {
      if (!!this.point.pointLink) {
        return this.point.pointLink;
      } else {
        return this.point.pointID.toString();
      }
    }
  }

  extractMediaEmbeds(): void {
    // https://ckeditor.com/docs/ckeditor5/latest/features/media-embed.html

    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      this.youTubeIDs = [];
      if (this.point.youTubeID) {
        this.youTubeIDs.push(this.point.youTubeID);
      }

      this.soundCloudTrackIDs = [];
      if (this.point.soundCloudTrackID) {
        this.soundCloudTrackIDs.push(this.point.soundCloudTrackID);
      }

      this.vimeoIDs = [];

      const split = this.point.pointHTML.split('<figure class="media">');

      if (split.length > 0) {
        let i: number;
        let oembedPlus: string[];
        let url: string;
        let id = '';
        let urlParts = [];

        for (i = 1; i < split.length; i++) {
          oembedPlus = split[i].split('</figure>');
          url = oembedPlus[0].split('"')[1];
          urlParts = url.split('/');

          if (url.includes('youtu.be')) {
            id = urlParts[urlParts.length - 1];
            this.youTubeIDs.push(id);
          } else if (url.includes('youtube.com')) {
            id = urlParts[urlParts.length - 1].split('v=')[1];
            this.youTubeIDs.push(id);
          } else if (url.includes('vimeo.com')) {
            id = urlParts[urlParts.length - 1];
            this.vimeoIDs.push(id);
          } else if (url.includes('soundcloud')) {
          }
          split[i] = oembedPlus[1]; // Use only what's after the figure element
        }
      }

      this.pointHTMLwithoutEmbed = split.join(''); // pointHTML stripped of <figure> elements added by ckEditor for media embed
    }
  }

  PointFeedback(pointSupportLevel: PointSupportLevels): void {
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      if (!this.point.pointFeedback.feedbackIsUpdatable) {
        alert('Feedback is not updatable');
      } else {
        if (
          this.point.pointFeedback.supportLevelID === pointSupportLevel &&
          !this.point.pointFeedback.pointModified
        ) {
          // If clicked on the current support level then delete it
          if (confirm('Are you sure you wish to delete your feedback?')) {
            pointSupportLevel = PointSupportLevels.None;
          } else {
            return; // Cancel feedback delete
          }
        }

        this.pointsService
          .PointFeedback(this.point.pointID, pointSupportLevel, '', false)
          .subscribe({
            next: response => {
              console.log('FEEDBACK API RESPONSE', response);
              if (this.point) {
                this.point.pointFeedback = response as PointFeedback;
              }
              console.log(
                'CLIENT DATA UPDATED PointSupportlevel: ',
                this.point?.pointFeedback?.supportLevelID
              );
            },
            error: serverError => {
              console.log('PointFeedback Error', serverError);
              this.error = serverError.error.detail;
            }
          });
      }
    }
  }

  PointTypeVote(pointTypesEnum: PointTypesEnum): void {}

  AddToAnswers(pointID: number): void {
    this.AddPointToAnswers.emit(pointID);
  }

  RemoveFromAnswers(pointID: number): void {
    this.RemovePointFromAnswers.emit(pointID);
  }

  favoriteIcon(): string {
    if (!this.point) {
      this.error = 'Missing: point';
      return '';
    } else {
      return this.point.isFavourite ? 'favorite' : 'favorite_border';
    }
  }

  WoW(): void {
    console.log('BEGIN WoW');

    // ToDo Angular Workshop: Cannot read property 'name' of undefined
    // point.SupportLevelID was a number. Loosely typed

    // This is the conditional first step, mandatory second step conundrum
    // Now no recursion - allow business layer to handle

    // Allow business layer to handle support if WoWing
    // if (!this.point.PointFeedback.WoWVote && this.point.PointFeedback.SupportLevelID !== PointSupportLevels.Support) {
    //   console.log('10-6: ', this.point.PointFeedback.SupportLevelID);
    //   this.PointFeedback(PointSupportLevels.Support).then(
    //     success => {
    //       console.log(success, 'Success PointSupportlevel: ', this.point.PointFeedback.SupportLevelID);
    //       this.WoW();
    //     },
    //     fail => console.log('fail: ', fail));
    // } else {

    // Update WoW

    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      this.pointsService
        .PointWoWVote(this.point.pointID, !this.point.pointFeedback.woWVote)
        .subscribe(pointFeedback => {
          if (this.point) {
            this.point.pointFeedback = pointFeedback; // Toggle the WoW vote
          }
        });
    }
  }

  Support(): void {
    this.PointFeedback(PointSupportLevels.Support);
  }

  Neutral(): void {
    // this.point.pointFeedback.woWVote = false;
    this.PointFeedback(PointSupportLevels.StandAside);
  }

  Oppose(): void {
    // this.point.pointFeedback.woWVote = false;
    this.PointFeedback(PointSupportLevels.Oppose);
  }

  Report(): void {
    // this.point.pointFeedback.woWVote = false;
    this.PointFeedback(PointSupportLevels.Report);
  }

  anon(): void {
    alert('ToDo');
  }

  edit(): void {
    this.editing = true;
  }

  delete(): void {
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      if (confirm('Are you sure you wish to delete this point?')) {
        this.pointsService.PointDelete(this.point.pointID).subscribe({
          next: _ => {
            if (this.point) {
              this.PointDeleted.emit(this.point.pointID);
            }
          },
          // not looking at any result <<<
          error: serverError => {
            this.error = serverError.error.detail;
            console.log(this.error);
          }
        });
      }
    }
  }

  favourite(): void {
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      const deleteFavourite = this.point.isFavourite;

      this.pointsService
        .PointFlag(deleteFavourite, this.point.pointID, PointFlags.Favourite)
        .subscribe(_ => {
          if (this.point) {
            this.point.isFavourite = !deleteFavourite;
          }
        });
    }
  }

  onCancelEdit(): void {
    this.editing = false;
  }

  onCompleteEdit(): void {
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      this.AssignTags();
      this.extractMediaEmbeds();

      if (this.point.pointFeedback.supportLevelID !== PointSupportLevels.None) {
        this.point.pointFeedback.pointModified = true;
      }

      this.justUpdated = true;

      this.FetchMetaData();

      this.editing = false;
    }
  }

  FetchMetaData(): void {
    if (!this.point) {
      this.error = 'Missing: point';
    } else {
      // If it's a newSource, it will be showLinkPreview
      // but could be called from point update where isNew is false and showLinkPreview is true
      if (this.point.linkAddress && this.point.showLinkPreview) {
        // Get Link metadata for preview
        // Also handled in new point in tags-points component
        this.updatingPreview = true;
        this.pointsService
          .PointSourceMetaDataUpdate(this.point.pointID, this.point.linkAddress)
          .subscribe(metaData => {
            if (this.point) {
              this.point.linkTitle = metaData.title;
              this.point.linkDescription = metaData.preview;
              this.point.linkImage = metaData.previewImage;
            }
          });
        this.updatingPreview = false;
      }
    }
  }

  OccupyHandSignals(): void {
    window.open(
      'https://en.m.wikipedia.org/wiki/Occupy_movement_hand_signals',
      '_blank'
    );
  }
}
