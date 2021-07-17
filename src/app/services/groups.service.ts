// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Model
import { Organisation } from '../models/organisation.model';
import { Group, GroupUpdate } from '../models/group.model';

// Base Services
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class OrganisationsService {
  constructor(private httpClientService: HttpService) {}

  organisationsSelected: Organisation[] = [];

  OrganisationMembership(searchTerms: string): Observable<Organisation[]> {
    const postData = {
      SearchTerms: searchTerms
    };

    return this.httpClientService
      .post('organisations/membership', postData)
      .pipe(
        // save copy to look up groupID in group-issues.component
        tap(
          returnData =>
            (this.organisationsSelected = returnData as Organisation[])
        ),
        map(returnData => returnData as Organisation[])
      );
  }

  OrganisationsAvailable(searchTerms: string): Observable<Organisation[]> {
    const postData = {
      SearchTerms: searchTerms
    };

    return this.httpClientService
      .post('organisations/available', postData)
      .pipe(
        // save copy to look up groupID in group-issues.component
        tap(
          returnData =>
            (this.organisationsSelected = returnData as Organisation[])
        ),
        map(returnData => returnData as Organisation[])
      );
  }

  OrganisationSearchByName(organisationName: string): Observable<Organisation> {
    const postData = {
      SearchTerms: organisationName
    };

    return this.httpClientService.post('organisations/search', postData).pipe(
      // add group to saved groups
      tap(returnData => {
        if (!this.organisationsSelected) {
          this.organisationsSelected = [returnData as Organisation];
        } else if (
          !this.organisationsSelected.includes(returnData as Organisation)
        ) {
          this.organisationsSelected.push(returnData as Organisation);
        }
      }),
      map(returnData => returnData as Organisation)
    );
  }

  Organisation(
    organisationName: string,
    refresh: boolean
  ): Observable<Organisation> {
    let organisationsFiltered: Organisation[];
    let organisationChosen: Organisation;

    if (!refresh && !!this.organisationsSelected) {
      organisationsFiltered = this.organisationsSelected.filter(
        organisation => organisation.organisationName === organisationName
      );
      if (!!organisationsFiltered && organisationsFiltered.length === 1) {
        organisationChosen = organisationsFiltered[0];
        return of(organisationChosen!); // No need to search
      }
    }

    return this.OrganisationSearchByName(organisationName);
  }

  Join(groupID: number): Observable<number> {
    return this.httpClientService.get(`organisation/join/${groupID}`);
  }

  Leave(groupID: number): Observable<number> {
    return this.httpClientService.get(`organisation/leave/${groupID}`);
  }

  Activate(groupID: number, active: boolean): Observable<boolean> {
    return this.httpClientService.get(
      `organisation/activate/${groupID}/${active ? 'Y' : 'N'}`
    );
  }

  Update(group: Organisation): Observable<Organisation> {
    return this.httpClientService.post('organisation/update', group);
  }

  Delete(groupID: number): Observable<boolean> {
    return this.httpClientService.get(`organisation/delete/${groupID}`);
  }

  Groups(groupID: number): Observable<Group[]> {
    return this.httpClientService.get(`organisation/groups/${groupID}`);
  }

  Group(subGroupID: number): Observable<Group> {
    return this.httpClientService.get(`organisation/group/${subGroupID}`);
  }

  GroupByName(organisationName: string, groupName: string): Observable<Group> {
    return this.httpClientService.get(
      `organisation/groupByName/${organisationName}/${groupName}`
    );
  }

  GroupID(groupName: string): number {
    // if (!this.groupsSelected || this.groupsSelected.length === 0) {
    //     return 0;
    // }

    const groupChosen = this.organisationsSelected.filter(
      group => group.organisationName === groupName
    );

    if (!!groupChosen && groupChosen.length === 1) {
      const groupID = groupChosen[0].organisationID;
      return groupID;
    } else {
      return 0;
    }
  }

  GroupUpdate(subGroup: GroupUpdate): Observable<Group> {
    return this.httpClientService.post('organisation/group/update', subGroup);
  }

  GroupStartDiscussionNow(subGroupID: number): Observable<boolean> {
    return this.httpClientService.get(
      `organisation/group/${subGroupID}/startDiscussion`
    );
  }

  GroupDelete(groupID: number, subGroupID: number): Observable<boolean> {
    return this.httpClientService.get(
      `organisation/${groupID}/group/${subGroupID}/delete`
    );
  }
}
