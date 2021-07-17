import { ProposalStatuses } from './../models/enums';

// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Models, Enums
import { PorQTypes } from '../models/enums';
import { PorQSelectionResult, PorQEdit } from '../models/porq.model';

// Services
import { HttpService } from './http.service';
import { AppDataService } from './app-data.service';

@Injectable({
  providedIn: 'root'
})
export class PsandQsService {
  // You should keep the template related logic into your component,
  // and the business related logic in your service.

  constructor(
    private httpClientService: HttpService,
    private appDataService: AppDataService
  ) {}

  PorQDescription(porQTypeID: PorQTypes): string {
    switch (porQTypeID) {
      case PorQTypes.Question:
        return 'question';
      case PorQTypes.Perspective:
        return 'perspective';
      case PorQTypes.Proposal:
        return 'proposal';
      default:
        return 'unknown';
    }
  }

  // Standard selections:
  // 1) First batch
  // 2) Subsequent batch (very similar to above, can these be consolidated?)
  // 3) Page of points for all selection methods
  PsAndQsSelectIssue(
    subGroupID: number,
    issueID: number,
    porQTypeID: PorQTypes,
    proposalStatusID: ProposalStatuses,
    myPorQsOnly: boolean
  ): Observable<PorQSelectionResult> {
    const batchSize = 50;
    const pageSize = 10;
    const sort = 1;

    // No Filters + infinite scroll on DateOrder desc
    const apiUrl = `issues/PsAndQsSelectIssue/${subGroupID}/${issueID}/${porQTypeID}/${proposalStatusID}/${myPorQsOnly}/${sort}/${batchSize}/${pageSize}`;

    return this.httpClientService
      .get(apiUrl)
      .pipe(map(returnData => this.CastToPorQSelectionResult(returnData)));
  }

  PsAndQsSelectGroup(
    groupID: number,
    proposalStatusID: ProposalStatuses,
    myPorQsOnly: boolean
  ): Observable<PorQSelectionResult> {
    const batchSize = 50;
    const pageSize = 10;
    const sort = 1;

    // No Filters + infinite scroll on ...
    const apiUrl = `issues/PsAndQsSelectGroup/${groupID}/${proposalStatusID}/${myPorQsOnly}/${sort}/${batchSize}/${pageSize}`;

    return this.httpClientService.get(apiUrl).pipe(
      tap(returnData => console.log('RETURN DATA', returnData)),
      map(returnData => this.CastToPorQSelectionResult(returnData))
    );
  }

  PorQSelectSpecific(porQId: number): Observable<PorQSelectionResult> {
    const apiUrl = `issues/PorQSelectSpecific/${porQId}`;

    return this.httpClientService.get(apiUrl).pipe(
      tap(returnData => console.log('FFS', returnData)),
      map(returnData => this.CastToPorQSelectionResult(returnData))
    );
  }

  CastToPorQSelectionResult(sourceData: any): PorQSelectionResult {
    const PQSR = new PorQSelectionResult();

    PQSR.porQCount = sourceData.porQCount;
    PQSR.fromDate = sourceData.fromDate;
    PQSR.toDate = sourceData.toDate;

    // construct an Array of objects from an object
    PQSR.porQIDs = this.appDataService.CastObjectToIDs(sourceData.porQIDs);

    PQSR.psOrQs = sourceData.psOrQs;

    return PQSR;
  }

  PorQUpdate(porQ: PorQEdit): Observable<number> {
    // construct a new PorQEdit
    const postData = {
      issueID: porQ.issueID,
      porQID: porQ.porQID,
      porQTypeID: porQ.porQTypeID,
      title: porQ.title,
      porQ: porQ.porQ,
      draft: porQ.draft
    } as PorQEdit;

    return this.httpClientService.post('issues/porQUpdate', postData);
  }

  PorQDelete(issueID: number, porQID: number): Observable<any> {
    return this.httpClientService.get(`issues/porQDelete/${issueID}/${porQID}`);
  }

  PointAttachToPorQ(pointID: number, porQID: number): Observable<boolean> {
    return this.httpClientService.get(
      `issues/pointAttachToPorQ/${pointID}/${porQID}`
    );
  }
}
