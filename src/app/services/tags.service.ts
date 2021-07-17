// Angular
import { Injectable } from '@angular/core';

// rxjs
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Models
import { TagCloudTypes } from '../models/enums';
import { Tag } from '../models/tag.model';
import { ByOn } from '../models/ByOn.model';

// Services
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class TagsService {
  constructor(private httpClientService: HttpService) {}

  // OnInit() works with Directives and Components.
  // It does not work with other types, like a service

  TagCloud(type: TagCloudTypes): Observable<Tag[]> {
    let WebAPIUrl = '';

    switch (type) {
      case TagCloudTypes.Recent:
        WebAPIUrl = 'tags/cloud/recent';
        break;
      default:
        WebAPIUrl = 'tags/cloud/trending';
        break;
    }

    return this.httpClientService
      .get(WebAPIUrl)
      .pipe(map(data => data as Tag[]));
  }

  ByAliases(dateFrom: string, dateTo: string): Observable<ByOn[]> {
    const WebAPIUrl = 'tags/byaliases';

    const postData = { dateFrom, dateTo };

    return this.httpClientService
      .post(WebAPIUrl, postData)
      .pipe(map(data => data as ByOn[])); // A "ByOn" cloud
  }

  TopicsByAlias(
    byAlias: string,
    dateFrom: string,
    dateTo: string
  ): Observable<ByOn[]> {
    const WebAPIUrl = 'tags/byalias';

    const postData = { byAlias: byAlias, dateFrom: dateFrom, dateTo: dateTo };

    return this.httpClientService
      .post(WebAPIUrl, postData)
      .pipe(map(data => data as ByOn[])); // A "ByOn" cloud
  }
}
