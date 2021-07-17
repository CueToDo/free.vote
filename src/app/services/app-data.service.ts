// Angular
import { PorQTypes, PointTypesEnum } from './../models/enums';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

// rxjs
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { filter, map, mergeMap, tap } from 'rxjs/operators';

// Models
import { ID } from '../models/common';
import { PointSortTypes, GeographicalExtentID } from '../models/enums';
import { Kvp } from '../models/kvp.model';
import { FreeVoteProfile } from '../models/FreeVoteProfile';
import { PagePreviewMetaData } from '../models/point.model';

// Services
import { HttpService } from './http.service';
import { LocalDataService } from './local-data.service';

@Injectable({ providedIn: 'root' })
export class AppDataService {
  // http://jasonwatmore.com/post/2016/12/01/angular-2-communicating-between-components-with-observable-subject
  public Route = '';

  // Can I make a function available in every controller in angular?
  // https://stackoverflow.com/questions/15025979/can-i-make-a-function-available-in-every-controller-in-angular
  // 0 to 11
  months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  // tslint:disable-next-line: deprecation
  public promptEvent: BeforeInstallPromptEvent | undefined;

  public initialPageRendered = false;

  // Any subscriptions to the following must be unsubscribed (except in app.component)
  public PagePreview$ = new Subject<PagePreviewMetaData>(); // SSR Universal PagePreview
  public RouteParamChange$ = new Subject<string>(); // next url with route parameters
  public PageName$ = new Subject<string>();
  public TagsPointsActive$ = new Subject<boolean>(); // Point Selection
  public ShowPointsTab$ = new Subject();
  public ReSelectPoints$ = new Subject<PointSortTypes>();
  public PointsSelected$ = new Subject();

  // Change of Point SortOrder or Filter demands a reselect without change of selection parameters
  public PointSortType$ = new Subject<PointSortTypes>();
  public PointSortAscending$ = new Subject<boolean>();
  public PointsFiltered$ = new Subject<boolean>();
  public PointsFilterRemove$ = new Subject();

  // For responsive viewing
  public DisplayWidth$ = new BehaviorSubject<number>(5); // Viewport width monitoring
  public InputSlashTagOnMobile$ = new BehaviorSubject<boolean>(false);
  public ShowBurger$ = new BehaviorSubject<boolean>(false);

  // Let the service handle the communication and the response data
  // Notify service users via Behavioursubject. (Use Behavioursubject to ensure initial value).
  // Could use Promise for sign-in component, but other components such as menu need to know sign-in status

  // public ckeConfig = {
  //   toolbar: {
  //     items: ['Bold', 'Italic', 'Underline',
  //       '|', 'bulletedList', 'numberedList',
  //       '|', 'indent', 'outdent',
  //       '|', 'heading', 'fontSize',
  //       '|', 'fontColor', 'fontBackgroundColor',
  //       '|', 'link', 'image', 'insertTable', 'horizontalLine',
  //       '|', 'undo', 'redo'],
  //     shouldNotGroupWhenFull: true
  //   },
  //   // htmlEncodeOutput: false
  //   allowedContent: true
  // };

  // Not looked up in database - static types
  public porQTypes = [
    { key: 'Proposal', value: 1 },
    { key: 'Question', value: 2 },
    { key: 'Perspective', value: 3 }
  ] as Kvp[];

  // Lookup - could add more
  private pointTypes: Kvp[] = [];
  private extents: Kvp[] = []; // GeographicalExtent of group

  public PointTypes(): Observable<Kvp[]> {
    if (!!this.pointTypes && this.pointTypes.length > 0) {
      return of(this.pointTypes);
    } else {
      return this.httpService.get('lookups/point-types').pipe(
        map(types => types as Kvp[]),
        tap(types => (this.pointTypes = types))
      );
    }
  }

  // Database returns a List of Lookup values - a mumerical database ID and a string display Value
  GeographicalExtents(): Observable<Kvp[]> {
    if (this.extents) {
      return of(this.extents);
    } else {
      return this.httpService.get('lookups/geographicalExtents').pipe(
        map(value => value as Kvp[]),
        tap(extents => (this.extents = extents))
      );
    }
  }

  constructor(
    private httpService: HttpService,
    private localData: LocalDataService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // PWA installation - browser only
    if (isPlatformBrowser(this.platformId)) {
      // PWA https://love2dev.com/blog/beforeinstallprompt/
      window.addEventListener('beforeinstallprompt', event => {
        // tslint:disable-next-line: deprecation
        this.promptEvent = event as BeforeInstallPromptEvent;
      });
    }
  }

  // Unambiguous Date Format
  // https://css-tricks.com/everything-you-need-to-know-about-date-in-javascript/
  public UDF(date: Date): string {
    let udf = '';
    if (date) {
      udf =
        date.getDate().toString() +
        ' ' +
        this.months[date.getMonth()] +
        ' ' +
        date.getFullYear().toString();
    }
    return udf;
  }

  // Unambiguous DateTime Format
  public UDTF(date: Date): string {
    let udtf = '';
    if (date) {
      udtf =
        date.getDate().toString() +
        ' ' +
        this.months[date.getMonth()] +
        ' ' +
        date.getFullYear().toString() +
        ' ' +
        date.getHours().toString().padStart(2, '0') +
        ':' +
        date.getMinutes().toString().padStart(2, '0');
    }
    return udtf;
  }

  public addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  // Name cannot include reserved characters
  isUrlNameUnSafe(input: string): boolean {
    return (
      input.includes('\\') ||
      input.includes(
        '-'
      ) /* hyphen not allowed as spaces will be represented by hyphens */ ||
      input.includes('?') ||
      input.includes('!') ||
      input.includes(`'`) ||
      input.includes(`,`) ||
      input.includes(':') ||
      input.includes(';') ||
      input.includes('*') ||
      input.includes('/') ||
      input.includes('+') ||
      input.includes('=') ||
      input.includes('@') ||
      input.includes('&') ||
      input.includes('#') ||
      input.includes('$')
    );
  }

  urlSafeName(input: string): string {
    let output = input
      .split('\\')
      .filter(item => item)
      .join(''); // no back-slashes
    output = output
      .split('-')
      .filter(item => item)
      .join(
        ' '
      ); /* hyphen not allowed as spaces will be represented by hyphens */
    output = output
      .split('?')
      .filter(item => item)
      .join('');
    output = output
      .split('!')
      .filter(item => item)
      .join('');
    output = output
      .split(`'`)
      .filter(item => item)
      .join('');
    output = output
      .split(',')
      .filter(item => item)
      .join('');
    output = output
      .split(':')
      .filter(item => item)
      .join('');
    output = output
      .split(';')
      .filter(item => item)
      .join('');
    output = output
      .split('*')
      .filter(item => item)
      .join('');
    output = output
      .split('/')
      .filter(item => item)
      .join('');
    output = output
      .split('+')
      .filter(item => item)
      .join('');
    output = output
      .split('=')
      .filter(item => item)
      .join('');
    output = output
      .split('@')
      .filter(item => item)
      .join('');
    output = output
      .split('&')
      .filter(item => item)
      .join('');
    output = output
      .split('#')
      .filter(item => item)
      .join('');
    output = output
      .split('$')
      .filter(item => item)
      .join('');

    return output;
  }

  // For groupnames in urls. replace spaces first, then encode
  kebabUri(input: string): string {
    // But not converted to lower case
    // filter - an empty string evaluates to boolean false. It works with all falsy values like 0, false, null, undefined
    let output = '';
    if (input) {
      input
        .split(' ')
        .filter(item => item)
        .join('-'); // remove double spaces, replace spaces with dash
      output = output
        .split('-')
        .filter(item => item)
        .join('-'); // remove double-dashes, no dash start or end
      output = encodeURIComponent(output);
    }
    return output;
  }

  unKebabUri(input: string): string {
    return input
      ?.split('-')
      .filter(item => item)
      .join(' ');
  }

  public removeBookEnds(withEnds: string, removeEnd: string): string {
    // filter - an empty string evaluates to boolean false. It works with all falsy values like 0, false, null, undefined
    return withEnds
      .split(removeEnd)
      .filter(item => item)
      .join(removeEnd);
  }

  public Date1IsLessThanDate2(dateFrom: string, dateTo: string): boolean {
    if (!dateFrom || !dateTo) {
      return false;
    }
    const date1 = new Date(dateFrom);
    const date2 = new Date(dateTo);
    return date1.getTime() < date2.getTime();
  }

  // arguably should be in http.service
  SaveProfile(profile: FreeVoteProfile): Observable<boolean> {
    return this.httpService.post('profile/profilesave', profile);
  }

  profilePictureOptionUpdate(
    profilePictureOptionID: string
  ): Observable<string> {
    const url = `profile/profilePictureOption/${profilePictureOptionID}`;
    return this.httpService.get(url);
  }

  // App start only - get previous Alias and Topic Selected from Local Storage or database
  // But NOT on return from sign out
  InitialisePreviousSlashTagSelected(): void {
    // LocalData LoadValues (called from its constructor) handles initial set up

    if (!this.localData.PreviousSlashTagSelected) {
      this.TagLatestActivity().subscribe({
        next: previousSlashTagSelected => {
          this.localData.PreviousSlashTagSelected = previousSlashTagSelected;
        },
        error: error =>
          console.log('Server Error on getting trending topics', error)
      });
    } else if (this.localData.PreviousTopicSelected === 'SignedOut') {
      this.localData.PreviousSlashTagSelected = '';
    }
  }

  TagLatestActivity(): Observable<string> {
    return this.httpService.get('tags/tagLatestActivity');
  }

  InitialiseStrapline(): void {
    // this.localData.strapline = localStorage.getItem('strapline');
    // strapline is not saved to localStorage, just to localData (in-memory)
    // '' | null is the string 'null', not an empty string
    // string value 'null' is truthy

    if (!this.localData.strapline) {
      this.httpService
        .get(`lookups/website-strapline/${this.localData.website}`)
        .subscribe(strapline => {
          this.localData.strapline = strapline.value;
        });
    }
  }

  //   // Following not necessary on INITIALISE??
  // // BehaviourSubjects already initialised with empty topic
  // this.SetByOnTopic(this.previousAliasSelected, this.PreviousTopicSelected);

  // // Following not necessary on INITIALISE??
  // this.RouteParamChange$.next(this.PreviousSlashTagSelected);

  // else {
  //   // Following not necessary on INITIALISE??
  //   // BehaviourSubjects already initialised with empty topic
  //   this.SetByOnTopic(this.previousAliasSelected, this.PreviousTopicSelected);
  //   this.RouteParamChange$.next(this.PreviousSlashTagSelected);
  // }

  SetSlashTag(slashTag: string, pointSortType: PointSortTypes): void {
    this.localData.PreviousSlashTagSelected = slashTag;
    this.localData.ActiveAliasForFilter = '';

    // We're not changing the route- just the tab selected
    // all routes handled by TagsPointsComponent
    this.PointsFiltered$.next(false); // Tell PointsComponent to hide filters - don't SelectPoints here
    this.PointsFilterRemove$.next(); // Tell TagsPointsComponent - PointsFiltered$ is raised by TagsPointsComponent
    this.ReSelectPoints$.next(pointSortType); // Tell Points Component to reselect points for new slash tag
    this.RouteParamChange$.next(slashTag); // Keep separate (this is for the App Component)
  }

  GetCountries(): Observable<Kvp[]> {
    return this.httpService
      .get('lookups/countries')
      .pipe(map(value => value as Kvp[]));
  }

  GetCities(countryID: string): Observable<Kvp[]> {
    return this.httpService
      .get('lookups/cities/' + countryID)
      .pipe(map(value => value as Kvp[]));
  }

  CountrySave(country: string): Observable<number> {
    return this.httpService
      .get(`lookups/countrySave/${country}`)
      .pipe(map(value => +value));
  }

  CitySave(countryID: string, city: string): Observable<number> {
    return this.httpService
      .get(`lookups/citySave/${countryID}/${city}`)
      .pipe(map(value => +value));
  }

  ShowCountries(geographicalExtentID: string): boolean {
    switch (geographicalExtentID) {
      // Don't Show Countries if:
      case GeographicalExtentID.GlobalOrganisation.toString():
      case GeographicalExtentID.PrivateOrganisation.toString():
        return false;
      default:
        return true;
    }
  }

  ShowRegions(geographicalExtentID: string): boolean {
    switch (geographicalExtentID) {
      // Don't Show Regions if:
      case GeographicalExtentID.GlobalOrganisation.toString():
      case GeographicalExtentID.National.toString():
      case GeographicalExtentID.City.toString():
      case GeographicalExtentID.PrivateOrganisation.toString():
        return false;
      default:
        return true;
    }
  }

  ShowCities(geographicalExtentID: string): boolean {
    switch (geographicalExtentID) {
      // Don't Show Cities if:
      case GeographicalExtentID.GlobalOrganisation.toString():
      case GeographicalExtentID.National.toString():
      case GeographicalExtentID.Regional.toString():
      case GeographicalExtentID.PrivateOrganisation.toString():
        return false;
      default:
        return true;
    }
  }

  GetMapValue(obj: any, key: string): string {
    if (obj.hasOwnProperty(key)) {
      return obj[key];
    }
    throw new Error('Invalid map key.');
  }

  // DO NOT WORK WITH Map
  // https://stackoverflow.com/questions/48187362/how-to-iterate-using-ngfor-loop-map-containing-key-as-string-and-values-as-map-i

  // Do Not Use map
  // ArrayFromMap(map: Map<number, string>): any[] {
  //   return Array.from(map.entries()).map(([key, val]) => ({ key, val }));
  // }

  MeetingInterval(intervalID: number): string {
    switch (intervalID) {
      case 1:
        return 'Weekly';
      case 2:
        return 'Monthly Date';
      case 3:
        return 'Variable';
      case 4:
        return 'Monthly';
      default:
        return '';
    }
  }

  public DayName(day: number): string {
    switch (day) {
      case 1:
        return 'Monday';
      case 2:
        return 'Tuesday';
      case 3:
        return 'Wednesday';
      case 4:
        return 'Thursday';
      case 5:
        return 'Friday';
      case 6:
        return 'Saturday';
      case 7:
        return 'Sunday';
      default:
        return '';
    }
  }

  public ordinal(i: number): string {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
      return i + 'st';
    }
    if (j === 2 && k !== 12) {
      return i + 'nd';
    }
    if (j === 3 && k !== 13) {
      return i + 'rd';
    }
    return i + 'th';
  }

  public plural(i: number): string {
    switch (i) {
      case 1:
        return '';
      default:
        return 's';
    }
  }

  public NextMonday(): Date {
    const nextMon = new Date();
    nextMon.setDate(nextMon.getDate() - nextMon.getDay() + 8);
    return nextMon;
  }

  PointType(pointTypeID: number): Observable<string> {
    // Don't subscribe, just return map within pipe
    return this.PointTypes().pipe(
      map(response => response.filter(pt => pt.value === pointTypeID)[0].key)
    );
  }

  ShowSource(pointTypeID: PointTypesEnum): boolean {
    switch (pointTypeID) {
      // It doesn't matter WHO said it - should not sway vote
      case PointTypesEnum.Quote:
      case PointTypesEnum.Fact:
      case PointTypesEnum.RecommendedReading:
      case PointTypesEnum.RecommendedListening:
      case PointTypesEnum.RecommendedViewing:
      case PointTypesEnum.ReportOrSurvey:
      case PointTypesEnum.Petition:
        return true;
      default:
        return false;
    }
  }

  PorQType(porQTypeID: PorQTypes): string {
    return this.porQTypes.filter(pt => pt.value === (porQTypeID as number))[0]
      .key;
  }

  // https://stackoverflow.com/questions/52419658/efficient-way-to-get-route-parameter-in-angular
  onNavigationEndReadParamByKey(
    route: ActivatedRoute,
    key: string
  ): Observable<string> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      mergeMap(() => {
        /* flatMap deprecated - is this a direct replacement? */
        return route.params.pipe(
          filter(params => params[key]),
          map(params => params[key])
        );
      })
    );
  }

  CastObjectToIDs(sourceObject: any): ID[] {
    // construct an Array of objects from an object
    return Object.keys(sourceObject).map(key => {
      return { rowNumber: Number(key), id: sourceObject[key] };
    });
  }

  ArrayOfKVP(source: any): Array<Kvp> {
    const output = new Array<Kvp>();
    for (const kvp of source) {
      output.push({ key: kvp.key, value: kvp.value } as Kvp);
    }
    return output;
  }

  // Value ID is a number
  GetKVPValue(source: Array<Kvp>, key: string): number {
    const kvp = source.find(element => element.key === key);
    if (kvp) {
      return kvp.value;
    } else {
      return -1;
    }
  }

  /// Key Display is a string
  GetKVPKey(source: Array<Kvp>, value: number): string {
    const kvp = source.find(element => element.value === value);
    if (kvp) {
      return kvp.key;
    } else {
      return '';
    }
  }

  // https://blog.logrocket.com/4-different-techniques-for-copying-objects-in-javascript-511e422ceb1e/
  // We call the copy shallow because the properties in the target object
  // can still hold references to those in the source object. WTF

  // Now using lodash for deep copy and potentially other methods to manuipulate objects and arrays

  // deep<T>(value: T): T | any[] {
  //   if (typeof value !== 'object' || value === null) {
  //     return value;
  //   }
  //   if (Array.isArray(value)) {
  //     return this.deepArray(value as any[]);
  //   }
  //   return this.deepObject(value);
  // }

  // deepArray<T extends any[]>(collection: T): any[] {
  //   return collection.map((value) => {
  //     return this.deep(value);
  //   });
  // }

  // deepObject<T>(source: T): T {
  //   const result = {};
  //   Object.keys(source).forEach((key) => {
  //     const value = source[key];
  //     result[key] = this.deep(value);
  //   }, {});
  //   return result as T;
  // }
}
