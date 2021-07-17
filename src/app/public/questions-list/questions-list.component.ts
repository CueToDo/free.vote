// Angular
import { Component, Input } from '@angular/core';

// Models, enums
import { PointSortTypes } from 'src/app/models/enums';
import { ID } from 'src/app/models/common';
import {
  Question,
  QuestionSelectionResult
} from 'src/app/models/question.model';
import { FilterCriteria } from 'src/app/models/filterCriteria.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';
import { QuestionsService } from 'src/app/services/questions.service';

@Component({
  selector: 'app-questions-list',
  templateUrl: './questions-list.component.html',
  styleUrls: ['./questions-list.component.css']
})
export class QuestionsListComponent {
  @Input() public filter!: FilterCriteria;

  public questions: Question[] = [];
  public IDs: ID[] = [];
  public questionCount = 0;

  public error = '';
  public alreadyFetchingFromDB = false;
  public allQuestionsDisplayed = false;

  private get lastBatchRow(): number {
    let lastRow = 0;
    if (this.IDs && this.IDs.length > 0) {
      lastRow = this.IDs[this.IDs.length - 1].rowNumber;
    }
    return lastRow;
  }

  private get lastPageRow(): number {
    let lastRow = 0;
    if (this.questions && this.questions.length > 0) {
      lastRow = this.questions[this.questions.length - 1].rowNumber;
    }
    if (this.questions.length > lastRow) {
      lastRow = this.questions.length;
    } // Defensive if point count from databsae is wrong
    return lastRow;
  }

  public nextPageQuestionsCount(): number {
    return this.IDs.filter(val => val.rowNumber > this.lastPageRow).slice(0, 10)
      .length;
  }

  constructor(
    private questionsService: QuestionsService,
    public appData: AppDataService
  ) {}

  SelectQuestions(): void {
    if (!this.alreadyFetchingFromDB) {
      this.alreadyFetchingFromDB = true;
      this.questionCount = 0;
      this.questions = [];
      this.error = '';

      // Infinite Scroll: Get questions in batches
      this.questionsService
        .GetFirstBatchForTag(
          this.filter.slashTag,
          this.filter.sortType,
          this.filter.sortAscending
        )
        .subscribe({
          next: psr => this.DisplayQuestions(psr),
          error: err => {
            this.error = err.error.detail;
            this.alreadyFetchingFromDB = false;
          }
        });
    }
  }

  newSortType(pointSortType: PointSortTypes): void {
    if (this.questionCount > 1) {
      // Don't go to server to re-sort if only 1 point selected

      // ReversalOnly means we can allow the database to update rownumbers on previously selected points
      const reversalOnly = this.filter.sortType === pointSortType;
      this.filter.sortType = pointSortType;
      this.alreadyFetchingFromDB = true;

      this.questionsService
        .NewQuestionSelectionOrder(pointSortType, reversalOnly)
        .subscribe(response => {
          this.alreadyFetchingFromDB = false;

          // pointCount is not updated for re-ordering
          this.IDs = response.questionIDs;
          this.questions = response.questions;
          this.NewQuestionsDisplayed();
        });
    }
  }

  DisplayQuestions(qsr: QuestionSelectionResult): void {
    this.alreadyFetchingFromDB = false;

    // Batch
    this.questionCount = qsr.questionCount;
    this.IDs = qsr.questionIDs;
    this.questions = qsr.questions;

    this.NewQuestionsDisplayed();
  }

  // https://stackblitz.com/edit/free-vote-infinite-scroll
  fetchMoreQuestions(): void {
    if (!this.alreadyFetchingFromDB) {
      // ToDo infinite scroll for MyPoints this.SelectedPoints();

      // https://stackoverflow.com/questions/38824349/how-to-convert-an-object-to-an-array-of-key-value-pairs-in-javascript
      // Construct array of next 10 points ids to be selected
      const pids: ID[] = this.IDs.filter(
        val => val.rowNumber > this.lastPageRow
      ).slice(0, 10); // excludes end index;

      // Pass back next 10 PointIDs to be fetched for display
      // already filtered above - this is what we need to fetch now
      if (pids && pids.length > 0) {
        // Get new PAGE of points
        this.alreadyFetchingFromDB = true;
        this.allQuestionsDisplayed = false;

        this.questionsService.GetPage(pids).subscribe(response => {
          this.questions = this.questions.concat(response.questions);
          this.NewQuestionsDisplayed();
        });
      } else if (
        this.lastBatchRow < this.questionCount &&
        this.lastPageRow < this.questionCount
      ) {
        // More defensive coding if DB givesd incorrect page count

        // Get another BATCH of points

        this.alreadyFetchingFromDB = true;
        this.allQuestionsDisplayed = false;

        this.questionsService
          .GetNextBatch(this.filter.sortType, this.lastBatchRow + 1)
          .subscribe(response => {
            // New Batch
            this.IDs = response.questionIDs;
            this.questions = this.questions.concat(response.questions);
            this.NewQuestionsDisplayed();
          });
        // }
      }
    }
  }

  NewQuestionsDisplayed(): void {
    this.alreadyFetchingFromDB = false;
    this.allQuestionsDisplayed = this.questions.length >= this.questionCount;
    this.appData.PointsSelected$.next();
  }

  onQuestionDeleted(id: number): void {
    // this.SelectPoints(); No need to reselect.
    // Already deleted from server, now remove from the array
    // https://love2dev.com/blog/javascript-remove-from-array/
    this.questions = this.questions.filter(value => {
      return value.questionID !== id;
    });
    this.questionCount--; // decrement before calling NewPointsDisplayed which updates allPointsDisplayed
    this.NewQuestionsDisplayed();
  }
}
