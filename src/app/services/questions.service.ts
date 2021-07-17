// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable } from 'rxjs/internal/Observable';
import { map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

// Models, enums
import { PointSortTypes, PointSupportLevels } from '../models/enums';
import {
  QuestionSelectionResult,
  QuestionEdit
} from '../models/question.model';
import { ID } from '../models/common';

// Services
import { HttpService } from './http.service';
import { AppDataService } from './app-data.service';

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private batchSize = 50;
  private pageSize = 10;

  constructor(
    private httpClientService: HttpService,
    private appDataService: AppDataService
  ) {
    // this.GetWoWWeekInfoVote();
  }
  GetFirstBatchForTag(
    slashTag: string,
    pointSortOrder: PointSortTypes,
    sortAscending: boolean
  ): Observable<QuestionSelectionResult> {
    // No Filters + infinite scroll on DateOrder desc
    const apiUrl =
      `questions/getFirstBatchForTag/${slashTag.replace(
        '/',
        ''
      )}/${pointSortOrder}` +
      `/${sortAscending}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToQuestionSelectionResult(returnData)));
  }

  CastToQuestionSelectionResult(sourceData: any): QuestionSelectionResult {
    const QSR = new QuestionSelectionResult();

    QSR.questionCount = sourceData.questionCount;

    // construct an Array of objects from an object
    QSR.questionIDs = this.appDataService.CastObjectToIDs(
      sourceData.questionIDs
    );
    QSR.questions = sourceData.questions;
    QSR.tagID = sourceData.tagID;

    return QSR;
  }

  GetNextBatch(
    pointSortOrder: PointSortTypes,
    fromRow: number
  ): Observable<QuestionSelectionResult> {
    const apiUrl = `questions/getNextBatch/${pointSortOrder}/${fromRow}/${this.batchSize}/${this.pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToQuestionSelectionResult(returnData)));
  }

  // returns a batch of points based on a list of IDs peviously returned to the client
  GetPage(pointIDs: ID[]): Observable<QuestionSelectionResult> {
    if (!pointIDs || pointIDs.length === 0) {
      console.log('No points to select');
      return of(new QuestionSelectionResult());
    } else {
      const apiUrl = 'points/getPage';

      // ToDo Removed 03/01/2021 ids not used
      // https://stackoverflow.com/questions/16553561/passing-list-of-keyvaluepair-or-idictionary-to-web-api-controller-from-javascrip
      // construct an object from an array
      // const ids = {}; // a const where you can add new properties with values

      // pointIDs.forEach(item =>
      //   ids[item.rowNumber] = item.id);

      return this.httpClientService
        .post(apiUrl, pointIDs)
        .pipe(map(returnData => returnData as QuestionSelectionResult));
    }
  }

  NewQuestionSelectionOrder(
    sortOrder: PointSortTypes,
    reversalOnly: boolean
  ): Observable<QuestionSelectionResult> {
    const apiUrl = `questions/questionsSelectedReOrder/${sortOrder}/${
      reversalOnly ? 'Y' : 'N'
    }`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToQuestionSelectionResult(returnData)));
  }

  QuestionUpdate(questionEdit: QuestionEdit): Observable<number> {
    const apiUrl = 'questions/questionUpdate';

    const postData = {
      questionID: questionEdit.questionID,
      question: questionEdit.question,
      draft: questionEdit.draft,
      slashTag: questionEdit.slashTag
    } as QuestionEdit;

    return this.httpClientService.post(apiUrl, postData);
  }

  QuestionDelete(questionID: number): Observable<boolean> {
    return this.httpClientService
      .get(`questions/questionDelete/${questionID}`)
      .pipe(map(result => result as boolean));
  }

  QuestionVote(
    questionID: number,
    supportLevelID: PointSupportLevels,
    voteAnon: boolean
  ): Observable<string> {
    return this.httpClientService
      .get(
        `questions/questionFeedbackUpdate/${questionID}/${supportLevelID}/${voteAnon}`
      )
      .pipe(map(result => result.value)); // JSON Object : handling
  }

  QuestionPointAddRemove(
    tag: string,
    add: boolean,
    questionSlug: string,
    pointID: number
  ): Observable<boolean> {
    return this.httpClientService.get(
      `questions/${tag}/questionPoint/${
        add ? 'add' : 'remove'
      }/${questionSlug}/${pointID}`
    );
  }
}
