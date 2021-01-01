
// Angular
import { Component, OnInit, Input } from '@angular/core';

// Models, enums
import { ID } from 'src/app/models/common';
import { FilterCriteria } from 'src/app/models/filterCriteria.model';
import { Point, PointSelectionResult } from 'src/app/models/point.model';
import { PointSelectionTypes, PointTypesEnum, PointSortTypes, DraftStatusFilter, PointFeedbackFilter } from 'src/app/models/enums';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { LocalDataService } from 'src/app/services/local-data.service';
import { PointsService } from 'src/app/services/points.service';


@Component({
  selector: 'app-points-list',
  templateUrl: './points-list.component.html',
  styleUrls: ['./points-list.component.css']
})
export class PointsListComponent implements OnInit {

  @Input() public filter: FilterCriteria;

  public pointCount: number;
  public IDs: ID[] = [];
  public points: Point[] = [];

  public error: string;
  public alreadyFetchingPointsFromDB = false;
  public allPointsDisplayed = false;

  private get lastBatchRow(): number {
    let lastRow = 0;
    if (this.IDs && this.IDs.length > 0) {
      lastRow = this.IDs[this.IDs.length - 1].rowNumber;
    }
    return lastRow;
  }

  private get lastPageRow(): number {
    let lastRow = 0;
    if (this.points && this.points.length > 0) {
      lastRow = this.points[this.points.length - 1].rowNumber;
    }
    if (this.points.length > lastRow) { lastRow = this.points.length; } // Defensive if point count from databsae is wrong
    return lastRow;
  }

  public nextPagePointsCount(): number {
    return this.IDs
      .filter(val => val.rowNumber > this.lastPageRow)
      .slice(0, 10).length;
  }


  constructor(
    private appData: AppDataService,
    public localData: LocalDataService,
    private pointsService: PointsService
  ) { }

  ngOnInit(): void {
  }

  OnTopicSearch(): string {
    let onTopic = '';
    if (!this.filter.anyTag) {
      if (!!this.filter.slashTag) { this.filter.slashTag = this.localData.PreviousSlashTagSelected; }
      onTopic = this.localData.SlashTagToTopic(this.filter.slashTag);
    }
    return onTopic;
  }

  SelectPointsByVoter() {

    this.localData.ActiveAliasForFilter = this.filter.byAlias;

    if (!!this.filter.slashTag) { this.localData.PreviousSlashTagSelected = this.filter.slashTag; }

    // Communicate Change to App Component

    this.SelectPoints();
  }

  SelectPoints() {

    if (!this.alreadyFetchingPointsFromDB) {

      this.alreadyFetchingPointsFromDB = true;
      this.pointCount = 0;
      this.points = [];
      this.error = '';

      switch (this.filter.pointSelectionType) {
        case PointSelectionTypes.Filtered:

          let aliasFilter = '';
          if (this.filter.applyAliasFilter) {
            aliasFilter = this.filter.byAlias;
          }

          let textFilter = '';
          if (this.filter.applyTextFilter) { textFilter = this.filter.text; }

          let pointTypeID = PointTypesEnum.NotSelected;
          if (this.filter.applyTypeFilter) { pointTypeID = this.filter.pointTypeID; }

          let dateFrom: Date;
          let dateTo: Date;

          // Switch dates if dateFrom > dateTo
          if (this.filter.applyDateFilter) {
            dateFrom = this.filter.dateFrom;
            dateTo = this.filter.dateTo;
            if (this.appData.Date1IsLessThanDate2(dateTo, dateFrom)) {
              const dateSwitch = dateFrom;
              dateFrom = dateTo;
              dateTo = dateSwitch;
              this.filter.dateFrom = dateFrom;
              this.filter.dateTo = dateTo;
            }
          }

          this.pointsService.GetFirstBatchFiltered(
            this.filter.myPoints, aliasFilter, this.OnTopicSearch(),
            this.filter.draftStatus, this.filter.feedbackFilter, this.filter.pointFlag, textFilter,
            pointTypeID, dateFrom, dateTo,
            this.filter.sortType, this.filter.sortAscending)
            .subscribe(
              {
                next: psr => this.DisplayPoints(psr),
                error: err => {
                  this.error = err.error.detail;
                  this.alreadyFetchingPointsFromDB = false;
                }
              });
          break;
        default:
          // Infinite Scroll: Get points in batches
          this.filter.slashTag = this.localData.PreviousSlashTagSelected; // how does this relate to getting from route param?
          if (this.filter.slashTag) {
            this.pointsService.GetFirstBatchForTag(this.filter.slashTag, this.filter.sortType, this.filter.sortAscending)
              .subscribe(
                {
                  next: psr => this.DisplayPoints(psr),
                  error: err => {
                    this.error = err.error.detail;
                    this.alreadyFetchingPointsFromDB = false;
                  }
                });
          }
          break;
      }

    }
  }


  public SelectSpecificPoint(slashTag: string, pointTitle: string) {

    this.alreadyFetchingPointsFromDB = true;

    this.pointsService.GetSpecificPoint(slashTag, pointTitle)
      .subscribe(
        {
          next: psr => this.DisplayPoints(psr),
          error: err => {
            this.error = err.error.detail;
            this.alreadyFetchingPointsFromDB = false;
          }
        }
      );
  }

  newSortType(pointSortType: PointSortTypes) {

    if (this.pointCount > 1) {
      // Don't go to server to re-sort if only 1 point selected

      // ReversalOnly means we can allow the database to update rownumbers on previously selected points
      const reversalOnly = this.filter.sortType === pointSortType;
      this.filter.sortType = pointSortType;
      this.alreadyFetchingPointsFromDB = true;

      this.pointsService.NewPointSelectionOrder(pointSortType, reversalOnly)
        .subscribe(
          response => {
            this.alreadyFetchingPointsFromDB = false;

            // pointCount is not updated for re-ordering
            this.IDs = response.pointIDs;
            this.points = response.points;
            this.NewPointsDisplayed();
          });
    }
  }

  DisplayPoints(psr: PointSelectionResult) {

    this.alreadyFetchingPointsFromDB = false;


    if (psr.pointCount > 0) {
      // If we don't have dateFrom and fromDate is returned, OR
      // returned date is LESS than original, use returned date
      if (!this.filter.dateFrom && psr.fromDate || this.appData.Date1IsLessThanDate2(psr.fromDate, this.filter.dateFrom)) {
        this.filter.dateFrom = new Date(psr.fromDate);
      }

      // If we don't have dateTo and toDate is returned, OR
      // returned date is GREATER than original, use returned date
      if (!this.filter.dateTo && psr.toDate || this.appData.Date1IsLessThanDate2(this.filter.dateTo, psr.toDate)) {
        this.filter.dateTo = new Date(psr.toDate);
      }
    }

    // Batch
    this.pointCount = psr.pointCount;
    this.IDs = psr.pointIDs;
    this.points = psr.points;

    this.NewPointsDisplayed();

  }

  // https://stackblitz.com/edit/free-vote-infinite-scroll
  fetchMorePoints() {

    if (!this.alreadyFetchingPointsFromDB) {

      // ToDo infinite scroll for MyPoints this.SelectedPoints();

      // https://stackoverflow.com/questions/38824349/how-to-convert-an-object-to-an-array-of-key-value-pairs-in-javascript
      // Construct array of next 10 points ids to be selected
      const pids: ID[] = this.IDs
        .filter(val => val.rowNumber > this.lastPageRow)
        .slice(0, 10); // excludes end index;

      // Pass back next 10 PointIDs to be fetched for display
      // already filtered above - this is what we need to fetch now
      if (pids && pids.length > 0) {

        // Get new PAGE of points
        this.alreadyFetchingPointsFromDB = true;
        this.allPointsDisplayed = false;

        this.pointsService.GetPage(pids).subscribe(response => {
          this.points = this.points.concat(response.points);
          this.NewPointsDisplayed();
        });

      } else if (this.lastBatchRow < this.pointCount && this.lastPageRow < this.pointCount) {
        // More defensive coding if DB givesd incorrect page count

        // Get another BATCH of points

        this.alreadyFetchingPointsFromDB = true;
        this.allPointsDisplayed = false;

        this.pointsService.GetNextBatch(this.filter.sortType, this.lastBatchRow + 1)
          .subscribe(
            response => {

              // New Batch
              this.IDs = response.pointIDs;
              this.points = this.points.concat(response.points);
              this.NewPointsDisplayed();
            }
          );
        // }

      }
    }
  }

  NewPointsDisplayed() {
    this.alreadyFetchingPointsFromDB = false;
    this.allPointsDisplayed = (this.points.length >= this.pointCount);
    this.appData.PointsSelected$.next();
  }

  onPointDeleted(id: number) {
    // this.SelectPoints(); No need to reselect.
    // Already deleted from server, now remove from the array
    // https://love2dev.com/blog/javascript-remove-from-array/
    this.points = this.points.filter(value => {
      return value.pointID !== id;
    });
    this.pointCount--; // decrement before calling NewPointsDisplayed which updates allPointsDisplayed
    this.NewPointsDisplayed();
  }



}