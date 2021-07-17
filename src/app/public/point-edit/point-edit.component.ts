// Angular
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef
} from '@angular/core';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';

// rxjs
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

// Lodash https://github.com/lodash/lodash/issues/3192
import { cloneDeep } from 'lodash-es';

// CKEditor
// import * as CKECustom from 'src/ckeditor.js';

// Models
import { Point } from 'src/app/models/point.model';
import { PointEdit } from 'src/app/models/point.model';
import { PointTypesEnum, PointSortTypes } from 'src/app/models/enums';
import { Kvp } from 'src/app/models/kvp.model';
import { Image } from 'src/app/models/Image.model';

// Services
import { LocalDataService } from 'src/app/services/local-data.service';
import { AppDataService } from 'src/app/services/app-data.service';
import { PointsService } from 'src/app/services/points.service';
import { HttpService } from 'src/app/services/http.service';
import { tap, map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-point-edit',
  templateUrl: './point-edit.component.html',
  styleUrls: ['./point-edit.component.css'],
  preserveWhitespaces: true
})
export class PointEditComponent implements OnInit {
  // Point must be cloned for 1-way binding, otherwise cancelled changes get reflected in parent
  @Input() point = new Point();
  @Output() pointChange = new EventEmitter(); // But manually controlling 2 way binding

  @Input() isPorQPoint = false;

  // public ckeditor = CKECustom;
  public pointClone = new PointEdit(); // manual control of 2 way binding (need to handle cancel edit)

  // Above banana in a box 2 way data binding works, but for some reason,
  // we must also emit new HTML to Point component after saving to database
  // Update: manual clone to save to databse then manual emit of updates from server

  @Output() CancelEdit = new EventEmitter();
  @Output() CompleteEdit = new EventEmitter();

  @ViewChild('imageSelect', { static: true }) imageSelect:
    | ElementRef
    | undefined;

  selectedPointType = PointTypesEnum.NotSelected;

  // pointTypes: Array<[number, string]>;
  // https://stackoverflow.com/questions/47079366/expression-has-changed-after-it-was-checked-during-iteration-by-map-keys-in-angu/50749898
  pointTypes: Kvp[] = [];
  hasMedia = false;
  hasLink = false;
  linkTextSave = '';
  imageFileForUpload: File | undefined;
  imageName = '';
  quoteOrLinkTextPlaceholder = 'quote or link text';
  showLinkBeforeVoteDisabled = false;

  userTouched = false;
  cancelled = false;
  saving = false;
  uploadingImage = false;
  imageUploadProgress = 0;
  error = '';

  // https://stackoverflow.com/questions/47079366/expression-has-changed-after-it-was-checked-during-iteration-by-map-keys-in-angu/50749898
  // pointKeys: IterableIterator<number>;

  imageUploadObservable: Observable<string> | undefined;

  constructor(
    private localData: LocalDataService,
    public appData: AppDataService,
    private pointsService: PointsService,
    private httpService: HttpService
  ) {
    // Must provide default values to bind before ngOnOnit
    // Host can override with Input value
  }

  ngOnInit(): void {
    let slashTag = '';

    if (!this.isPorQPoint) {
      slashTag = this.localData.PreviousSlashTagSelected;
    }

    if (!this.point) {
      this.NewPoint(slashTag);
    } else {
      this.pointClone = cloneDeep(this.point) as PointEdit;
    }

    this.appData
      .PointTypes()
      .subscribe(pointTypes => (this.pointTypes = pointTypes));

    if (this.pointClone) {
      this.autoShowLinkEdit(this.pointClone.pointTypeID);

      this.hasMedia =
        this.pointClone.youTubeID || this.pointClone.soundCloudTrackID
          ? true
          : false;
    }
  }

  onCKEBlur(): void {
    this.userTouched = !this.cancelled;
    this.cancelled = false;
  }

  addMedia(): void {
    this.hasMedia = true;
  }

  removeMedia(): void {
    if (this.pointClone) {
      this.pointClone.youTubeID = '';
      this.pointClone.soundCloudTrackID = '';
      this.hasMedia = false;
    }
  }

  imageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    this.imageFileForUpload = files ? files[0] : undefined;
    const name = this.imageFileForUpload?.name;
    if (name) {
      this.imageName = name;
    }
  }

  ImageUploadObservable(): Observable<string> {
    // Initialised each time before use to check whether there is an image to uplaod

    this.uploadingImage = true;
    this.imageUploadProgress = 0;

    if (this.imageFileForUpload) {
      return this.httpService.uploadImage(this.imageFileForUpload).pipe(
        tap(response => {
          // tap changes nothing in the pipe. What came in goes out

          switch (response.type) {
            case HttpEventType.Sent:
              console.log(
                `Uploading file "${this.imageName}" of size ${this.imageFileForUpload?.size}.`
              );
              break;

            case HttpEventType.UploadProgress:
              // Compute and show the % done:

              // Get round possibility of response.total being undefined
              const total = response.total
                ? response.total
                : 2 * response.loaded;

              const percentDone = Math.round((100 * response.loaded) / total);
              this.imageUploadProgress = percentDone;
              console.log(
                `File "${this.imageName}" is ${percentDone}% uploaded.`
              );
              break;

            case HttpEventType.Response:
              this.uploadingImage = false;
              const responseBody = (response as HttpResponse<Image>).body;

              console.log(`File "${this.imageName}" was completely uploaded!`);
              console.log(responseBody?.imageFileName, responseBody?.imageID);

              if (this.pointClone) {
                this.pointClone.pointHTML += `<img src="${responseBody?.imageFileName}">`;
              }
              this.imageName = '';
              this.imageFileForUpload = undefined;
              if (this.imageSelect) {
                this.imageSelect.nativeElement.value = '';
              }
              break;

            default:
              console.log(
                `File "${this.imageName}" surprising upload event: ${response.type}.`
              );
          }
        }),
        filter(response => response.type === HttpEventType.Response),
        map((response: HttpEvent<Image>) => {
          const x = response as HttpResponse<Image>;
          let id = x.body?.imageID;
          if (!id) {
            id = '';
          }
          return id;
        })
      );
    } else {
      // This is the important conditional "Do Nothing"
      return of('');
    }
  }

  // Upload Image before saving point to get a server filename and ImageID
  uploadImage(): void {
    this.error = '';

    if (this.pointClone) {
      // Must initialise before subscribing - may do nothing
      this.imageUploadObservable = this.ImageUploadObservable();

      this.imageUploadObservable.subscribe({
        next: imageID => {
          // Image now has a database ID, but is not yet attached to unsaved point
          // ... will be attached when point updated
          if (this.pointClone) {
            if (!this.pointClone.csvImageIDs) {
              this.pointClone.csvImageIDs = '';
            } // Don't want undefined
            this.pointClone.csvImageIDs += imageID + ',';
          }
        },
        error: serverError => (this.error = serverError.error.detail),
        complete: () => (this.uploadingImage = false)
      });
    }
  }

  imageRemove(): void {
    this.imageFileForUpload = undefined;
  }

  onSubmit(): void {
    // if the full url has been pasted get the id after the "="
    // What about tiny urls without the = but with the id?
    // console.log('SCTID: ', this.pointClone.soundCloudTrackID);

    if (!this.pointClone) {
      this.error = 'Missing: point to edit';
    } else {
      this.error = '';

      if (
        !this.isPorQPoint &&
        (!this.pointClone.slashTags || this.pointClone.slashTags.length === 0)
      ) {
        this.error = 'Points must have at least one slash tag';
      } else if (
        !(!!this.pointClone.pointTitle && !!this.pointClone.linkAddress) &&
        !(
          !!this.pointClone.pointHTML ||
          !!this.pointClone.youTubeID ||
          !!this.pointClone.soundCloudTrackID ||
          !!this.pointClone.csvImageIDs ||
          !!this.imageSelect?.nativeElement.value
        )
      ) {
        this.error =
          'Point title and text OR url OR image OR media link must be provided';
      } else {
        this.saving = true;

        const isNew = !this.pointClone.pointID || this.pointClone.pointID < 1;

        // Has voter removed SlashTagSelected?
        let returnToSlashTag = this.localData.PreviousSlashTagSelected;
        let tagChange = false;

        if (!this.pointClone.slashTags.includes(returnToSlashTag)) {
          returnToSlashTag = this.pointClone.slashTags[0];
          tagChange = true;
        }

        // Must always initialise before subscribing - may be nothing to upload
        this.imageUploadObservable = this.ImageUploadObservable();

        this.imageUploadObservable
          .pipe(
            map(imageID => {
              /// There may not be an image upload, in which case the imageID will be ''
              // There could be a situation where we've uploaded an image
              // and then attached another without uploading, but we're now saving
              if (this.pointClone) {
                if (!this.pointClone.csvImageIDs) {
                  this.pointClone.csvImageIDs = '';
                } // Don't want undefined
                this.pointClone.csvImageIDs += imageID + ',';
              }
            }),
            // but we'll always update point after any image upload
            concatMap(_ => {
              if (!this.pointClone) {
                return of(new Point());
              } else {
                return this.pointsService.PointUpdate(
                  this.pointClone,
                  this.isPorQPoint
                );
              }
            })
            // Don't get link meta data here from API - it slows user repsonse
            // but we will need to handle separately on new point and existing point edit
          )
          .subscribe({
            next: (response: Point) => {
              this.saving = false;
              this.userTouched = false;
              // this.point.csvImageIDs = ''; // Only needed for upload, now complete??

              if (isNew) {
                this.NewPoint(returnToSlashTag);
              } else {
                // pointID only needed for new points, but parent reselects - we're not dependent on 2 way binding
                // save response to point not pointClone, and manually emit
                this.point = cloneDeep(response);
                this.pointChange.emit(this.point);
              }

              this.localData.PreviousSlashTagSelected = returnToSlashTag;

              // Communicate the change to PointComponent (No subscriptions)
              // Emit to TagsPoints component for sort descending indication only
              // But don't get parent TagsPoints to trigger reselection in sibling points now

              if (response) {
                this.CompleteEdit.emit(response.pointID); // emit pointID for porq to attach
              }

              // Communicate change to sibling PointsComponent
              // where Points ReSelection Takes place:
              if (isNew || tagChange) {
                this.appData.SetSlashTag(
                  returnToSlashTag,
                  PointSortTypes.DateDescend
                );
              }
            },
            error: serverError => {
              this.saving = false;
              this.error = serverError.error.detail;
            },
            complete: () => {
              this.uploadingImage = false;
              this.hasMedia = false;
            }
          });
      }
    }
  }

  NewPoint(slashTag: string): void {
    // Clear old Values when edit complete
    this.pointClone = new Point();
    this.pointClone.pointID = -1;
    this.pointClone.pointHTML = '';
    this.pointClone.pointTypeID = PointTypesEnum.Opinion;
    this.showLinkBeforeVoteDisabled = false;

    if (!!slashTag) {
      this.pointClone.slashTags = [slashTag];
    } else {
      this.pointClone.slashTags = [];
    }

    this.error = '';
    this.userTouched = false;
  }

  Cancel(): void {
    // Delete any uploaded images from server
    if (this.pointClone?.csvImageIDs) {
      this.httpService
        .ImageUploadCancel(this.pointClone.csvImageIDs)
        .subscribe({
          next: () => {
            this.pointClone = new Point();
            this.cancelled = true;
            this.CancelEdit.next();
          },
          error: serverError => (this.error = serverError.error.detail)
        });
    } else {
      this.pointClone = new Point();
      this.cancelled = true;
      this.CancelEdit.next();
    }
  }

  autoShowLinkEdit(pointTypeID: PointTypesEnum): void {
    // Automatically show link input for certain point types
    if (this.appData.ShowSource(pointTypeID)) {
      this.showLinkEdit();
    } else {
      if (this.pointClone?.linkText || this.pointClone?.linkAddress) {
        this.showLinkEdit();
      } else {
        this.hideLinkEdit();
      }
    }
  }

  onPointTypeChange(pointTypeID: PointTypesEnum): void {
    this.autoShowLinkEdit(pointTypeID);

    // Automatically update default "show" if voter changes point type
    this.showLinkBeforeVoteDisabled = !this.appData.ShowSource(pointTypeID);

    if (this.pointClone) {
      this.pointClone.showLinkBeforeVote = false;
      this.pointClone.showLinkPreview = !this.showLinkBeforeVoteDisabled;
    }
  }

  showLinkEdit(): void {
    this.hasLink = true;
    this.showLinkBeforeVoteDisabled = false;
  }

  hideLinkEdit(): void {
    this.hasLink = false;
    if (this.pointClone) {
      this.pointClone.linkText = '';
      this.pointClone.linkAddress = '';
    }
  }

  showLinkPreview(show: boolean): void {
    if (this.pointClone) {
      if (show) {
        this.quoteOrLinkTextPlaceholder = 'quote or link text not required';
        this.linkTextSave = this.pointClone.linkText;
        this.pointClone.linkText = '';
      } else {
        this.quoteOrLinkTextPlaceholder = 'quote or link text';
        this.pointClone.linkText = this.linkTextSave;
      }
    }
  }

  // ngOnDestroy(): void {
  // When an Observable issues an OnError or OnComplete notification to its observers,
  // this ends the subscription.
  // Observers do not need to issue an Unsubscribe notification to end subscriptions
  // that are ended by the Observable in this way.
  /// No need to unsubscribe http calls which will end with completion or error
  // }
}
