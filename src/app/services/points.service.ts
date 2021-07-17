// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Models, Enums
import { ID } from 'src/app/models/common';
import { PointTypesEnum, DraftStatusFilter } from 'src/app/models/enums';
import {
  PointSelectionResult,
  Point,
  PointEdit,
  PagePreviewMetaData
} from 'src/app/models/point.model';
import {
  PointFeedback,
  PointFeedbackFormData,
  PointWoWFormData
} from 'src/app/models/point.model';
import {
  PointSortTypes,
  PointSelectionTypes,
  PointSupportLevels,
  PointFlags,
  PointFeedbackFilter
} from 'src/app/models/enums';

// Services
import { HttpService } from './http.service';
import { AppDataService } from './app-data.service';

@Injectable({ providedIn: 'root' })
export class PointsService {
  // public PointsSelected = new Subject<any>();
  // public PointsSelectionError = new Subject<any>();

  public PointSelectionType = PointSelectionTypes.Point;

  private batchSize = 50;
  private pageSize = 10;

  // Pages retrieved from server
  pages: number[] = [];

  // Only get the WoWWeekInfo when voting for the first time - update after vote
  // Never trust the client to cache API values
  // public WoWWeekInfoVote: WoWWeekInfoVote;

  public Anon = false;

  constructor(
    private httpClientService: HttpService,
    private appDataService: AppDataService
  ) {
    // this.GetWoWWeekInfoVote();
  }

  GetFirstBatchQuestionPoints(
    slashTag: string,
    questionSlug: string,
    myPointsOnly: boolean,
    unAttached: boolean,
    pointSortOrder: PointSortTypes,
    sortAscending: boolean
  ): Observable<PointSelectionResult> {
    const apiUrl =
      `points/getFirstBatchQuestionPoints/${slashTag.replace(
        '/',
        ''
      )}/${questionSlug}/${myPointsOnly ? 'Y' : 'N'}` +
      `/${unAttached ? 'Y' : 'N'}/${pointSortOrder}/${sortAscending}/${
        this.batchSize
      }/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  // The standard selections for a Tag:
  // 1) First batch
  // 2) Subsequent batch (very similar to above, can these be consolidated?)
  // 3) Page of points for all selection methods
  GetFirstBatchForTag(
    slashTag: string,
    pointSortOrder: PointSortTypes,
    sortAscending: boolean
  ): Observable<PointSelectionResult> {
    // No Filters + infinite scroll on DateOrder desc
    const apiUrl =
      `points/getFirstBatchForTag/${slashTag.replace(
        '/',
        ''
      )}/${pointSortOrder}` +
      `/${sortAscending}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  // ToDo this is what needs to change for new selection methods
  GetFirstBatchFiltered(
    myPoints: boolean,
    byAlias: string,
    onTopic: string,
    draftStatusFilter: DraftStatusFilter,
    feedbackFilter: PointFeedbackFilter,
    pointFlag: PointFlags,
    pointTextFilter: string,
    pointTypeID: PointTypesEnum,
    from: Date,
    to: Date,
    pointSortOrder: PointSortTypes,
    sortAscending: boolean
  ): Observable<PointSelectionResult> {
    const fromDate = this.appDataService.UDF(from);
    const toDate = this.appDataService.UDF(to);

    // myPoints is not an optional flag added by the user
    const apiUrl = 'points/getFirstBatchFiltered';

    const postData = {
      myPoints,
      byAlias,
      onTopic,
      draftStatusFilter,
      feedbackFilter,
      pointFlag,
      pointTextFilter,
      pointTypeID,
      fromDate,
      toDate,
      pointSortOrder,
      sortAscending,
      batchSize: this.batchSize,
      pageSize: this.pageSize
    };

    return this.httpClientService
      .post(apiUrl, postData)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  GetSpecificPoint(
    slashTag: string,
    pointTitle: string
  ): Observable<PointSelectionResult> {
    const apiUrl = `points/point/${slashTag}/${pointTitle}`;

    console.log('GET SPECIFIC', apiUrl);

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  PorQPoints(porQID: number): Observable<PointSelectionResult> {
    const apiUrl = `points/getFirstBatchForPorQ/${porQID}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  NewPointSelectionOrder(
    pointSortOrder: PointSortTypes,
    reversalOnly: boolean
  ): Observable<PointSelectionResult> {
    const apiUrl = `points/pointsSelectedReOrder/${pointSortOrder}/${
      reversalOnly ? 'Y' : 'N'
    }`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  GetNextBatch(
    pointSortOrder: PointSortTypes,
    fromRow: number
  ): Observable<PointSelectionResult> {
    const apiUrl = `points/getNextBatch/${pointSortOrder}/${fromRow}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPointSelectionResult(returnData)));
  }

  // returns a batch of points based on a list of IDs peviously returned to the client
  GetPage(pointIDs: ID[]): Observable<PointSelectionResult> {
    if (!pointIDs || pointIDs.length === 0) {
      console.log('No points to select');
      return of(new PointSelectionResult());
    } else {
      const apiUrl = 'points/getPage';

      // ToDo Removed 03/01/2021 const ids not used???
      // https://stackoverflow.com/questions/16553561/passing-list-of-keyvaluepair-or-idictionary-to-web-api-controller-from-javascrip
      // construct an object from an array
      // const ids = {}; // a const where you can add new properties with values

      // pointIDs.forEach(item =>
      //   ids[item.rowNumber] = item.id);

      return this.httpClientService
        .post(apiUrl, pointIDs)
        .pipe(map(returnData => returnData as PointSelectionResult));
    }
  }

  CastToPointSelectionResult(sourceData: any): PointSelectionResult {
    const PSR = new PointSelectionResult();

    PSR.pointCount = sourceData.pointCount;
    PSR.fromDate = sourceData.fromDate;
    PSR.toDate = sourceData.toDate;

    // construct an Array of objects from an object
    PSR.pointIDs = this.appDataService.CastObjectToIDs(sourceData.pointIDs);
    PSR.points = sourceData.points;
    PSR.tagID = sourceData.tagID;

    return PSR;
  }

  PointUpdate(point: PointEdit, isPorQPoint: boolean): Observable<Point> {
    // Input parameter is Point not PointEdit
    // construct a new PointEdit (all that's needed)

    const postData = {
      pointID: point.pointID,
      pointTitle: point.pointTitle, // pointLink constructed in API
      pointHTML: point.pointHTML,
      csvImageIDs: point.csvImageIDs,
      pointTypeID: point.pointTypeID,
      isPorQPoint, // not a point property
      linkText: point.linkText,
      linkAddress: point.linkAddress,
      showLinkBeforeVote: point.showLinkBeforeVote,
      showLinkPreview: point.showLinkPreview,
      youTubeID: point.youTubeID,
      soundCloudTrackID: point.soundCloudTrackID,
      slashTags: point.slashTags,
      draft: point.draft
    } as PointEdit;

    return this.httpClientService
      .post('points/pointUpdate', postData)
      .pipe(map(result => result as Point));
  }

  PointSourceMetaDataUpdate(
    pointID: number,
    link: string
  ): Observable<PagePreviewMetaData> {
    const postData = { pointID, link };

    return this.httpClientService
      .post('points/pointSourceMetaDataUpdate', postData)
      .pipe(map(result => result as PagePreviewMetaData));
  }

  // Not really needed: when we update an existing point,
  // we get the updated point back from the API along with YouTubeID
  YouTubeID(youTubeLink: string): Observable<string> {
    youTubeLink = encodeURI(youTubeLink);

    return this.httpClientService
      .get(`points/youTubeID/${youTubeLink}`)
      .pipe(map(result => result));
  }

  PointDelete(pointID: number): Observable<boolean> {
    return this.httpClientService
      .get('points/pointDelete/' + pointID)
      .pipe(map(result => result as boolean));
  }

  PointFeedback(
    pointID: number,
    pointSupportLevel: PointSupportLevels,
    comment: string,
    feedbackAnon: boolean
  ): Observable<PointFeedback> {
    const postData: PointFeedbackFormData = {
      pointID,
      pointSupportLevel,
      comment,
      feedbackAnon
    };

    return this.httpClientService.post('points/PointFeedback', postData).pipe(
      tap(result => console.log('PointFeedback result:', result)),
      map(result => result as PointFeedback)
    );
  }

  PointFlag(
    deleteFlag: boolean,
    pointID: number,
    pointFlagType: PointFlags
  ): Observable<boolean> {
    let apiUrl = 'points/PointFlag';
    if (deleteFlag) {
      apiUrl += 'Delete';
    }

    apiUrl += `/${pointID}/${pointFlagType}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(result => result as boolean));
  }

  PointWoWVote(pointID: number, wow: boolean): Observable<PointFeedback> {
    // standard construction of post data
    const postData: PointWoWFormData = {
      // 'WeekID': this.WoWWeekInfoVote.WoWWeekID, 'WeekEndingDate': this.WoWWeekInfoVote.WoWWeekEndingDate,
      pointID,
      wow,
      feedbackAnon: this.Anon
    };

    console.log('PointWoWVote postData:', postData);

    // return PointFeedback as confirmed by API
    return this.httpClientService
      .post('points/PointWoWVote', postData)
      .pipe(map(result => result as PointFeedback));
    // this.WoWWeekInfoVote.WoWWeekID = pointFeedback.WoWWeekID; // always update regardless
    // this.WoWWeekInfoVote.WoWWeekEndingDate = pointFeedback.WoWWeekEndingDate; // always update regardless
  }

  // SelectedPoints(pageNumber: number): Promise<PointSelectionResult> {

  //   const apiUrl = 'points/selected';

  //   const postData = {
  //     'pageSize': 10,
  //     'pageNumber': pageNumber
  //   };

  //   return this.httpClientService
  //     .post(apiUrl, postData)
  //     .then(returnData => {
  //       return returnData as PointSelectionResult;
  //     });
  // }

  // GetNextBatchForTagID(tagID: number, sortRevision: number, pointCount: number,
  //   mostRecentFirst: boolean, fromRow: number): Promise<PointSelectionResult> {

  //   const apiUrl = `points/getNextBatchForTagID/${tagID}/${sortRevision}/${pointCount}/${mostRecentFirst ? 'Y' : 'N'}/${fromRow}`;

  //   return this.httpClientService
  //     .get(apiUrl)
  //     .then(returnData => {
  //       const PSR = new PointSelectionResult();

  //       PSR.pointCount = returnData.pointCount;

  //       // construct an Array of objects from an object
  //       PSR.pointIDs = Object.keys(returnData.pointIDs).map(key => {
  //         return { rowNumber: Number(key), pointID: returnData.pointIDs[key] };
  //       });

  //       PSR.points = returnData.points;

  //       return PSR;
  //     });
  // }

  // Service Returns Full PointFeedback for just the WoWWeekID and WoWWeekEndingDate to be saved in WoWWeekInfoVote
  // GetWoWWeekInfoVote(): Promise<WoWWeekInfoVote> {
  //   if (this.WoWWeekInfoVote) {
  //     console.log('WoWWeekInfoVoteClient:', this.WoWWeekInfoVote);
  //     return Promise.resolve(this.WoWWeekInfoVote);
  //   } else {
  //     return this.httpClientService
  //       .get('points/WoWWeekInfoVote')
  //       .then(result => {
  //         console.log('GetWoWWeekInfoVote:', result);
  //         this.WoWWeekInfoVote = result as WoWWeekInfoVote;
  //         console.log('WoWWeekInfoVoteService:', this.WoWWeekInfoVote);
  //         return this.WoWWeekInfoVote;
  //       });
  //   }
  // }
}
