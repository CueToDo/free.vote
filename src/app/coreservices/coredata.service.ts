import { Injectable, OnInit } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Cookie } from 'ng2-cookies';

import { SignInStatuses } from '../models/enums';
import { SignInData } from '../models/signin.model';

import { Kvp } from '../models/kvp.model';

@Injectable()
export class CoreDataService {

  // All Pages?
  public PageTitle: string;
  public SlashTag: string;
  public TagDisplay: string;

  // http://jasonwatmore.com/post/2016/12/01/angular-2-communicating-between-components-with-observable-subject
  private tagDisplaySubject = new Subject<string>();
  private titleSubject = new Subject<string>();

  // Let the service handle the communication and the response data
  // Notify service users via Behavioursubject. (Use Behavioursubject to ensure initial value).
  // Could use Promise for sign-in component, but other components such as menu need to know sign-in status

  private SignInStatusChange$: BehaviorSubject<SignInStatuses>;

  // public PointTypes: Array<[number, string]>; // Tuple array
  public PointTypes: Kvp[];

  constructor(private httpClientService: HttpClientService) {
    // get actual SignInStatus from httpClientService (from cookie)
    this.SignInStatusChange$ = new BehaviorSubject<SignInStatuses>(this.httpClientService.SignInData.SignInStatus);
  }


  // SetTagRoute(tagRoute: string) {

  //   this.SlashTag = tagRoute;
  //   this.PageTitle = this.TagDisplay; /// where do we set TagDisplay?
  //   this.PageTitle = tagRoute;

  //   this.tagDisplaySubject.next(this.TagDisplay);
  //   this.titleSubject.next(this.TagDisplay);

  // }

  GetTagDisplay(): Observable<string> {
    return this.tagDisplaySubject.asObservable();
  }

  SetPageTitle(pageTitle: string) {
    this.PageTitle = pageTitle;
    this.titleSubject.next(pageTitle);
  }

  GetPageTitle(): Observable<string> {
    return this.titleSubject.asObservable();
  }

  // Consolidated Authentication Service and Core Data Service
  // Authentication Servce was just SignIn, SignOut and SignInStatus change detection
  // SignInStatus (SignedIn) needs to be part of CoreData Service

  public GetSignInStatusChange() {
    return this.SignInStatusChange$;
  }

  SignedIn(): boolean {
    const signedIn = this.httpClientService.SignInData.SignInStatus === SignInStatuses.SignInSuccess;
    return signedIn;
  }

  SignIn(website: string, email: string, password: string): void {

    let success = false;
    const data = { 'website': website, 'email': email, 'password': password };

    this.httpClientService
      .post('authentication/signin/', data)
      // .map(response => response.json()); //assumed - not needed
      .then(response => {

        const signInData = <SignInData>response;
        console.log('SignInStatus: ' + signInData.SignInStatus);


        // http://stackoverflow.com/questions/32896407/redirect-within-component-angular-2
        // Save SignInData with JWT as cookie, not in local storage
        if (signInData.SignInStatus === SignInStatuses.SignInSuccess) {
          Cookie.set('SignInData', JSON.stringify(signInData), 90);
          success = true;
        }

        // Notify any observers that didn't initiate the SignIn Request
        this.SignInStatusChange$.next(signInData.SignInStatus);
      },
        error => {
          console.log('Sign-In Error' + error);
        });
  }

  SignOut() {
    Cookie.delete('SignInData');

    const signInData = new SignInData();
    signInData.SignInStatus = SignInStatuses.SignedOut;
    Cookie.set('SignInData', JSON.stringify(signInData));

    this.SignInStatusChange$.next(SignInStatuses.SignedOut);
  }

  GetMapValue(obj, key): string {
    if (obj.hasOwnProperty(key)) {
      return obj[key];
    }
    throw new Error('Invalid map key.');
  }


  // DO NOT WORK WITH Map
  // https://stackoverflow.com/questions/48187362/how-to-iterate-using-ngfor-loop-map-containing-key-as-string-and-values-as-map-i
  GetPointTypes() {
    this.httpClientService
      .get('lookups/point-types')
      .then(response => {
        this.PointTypes = new Array<Kvp>();
        for (const kvp of response) {
          this.PointTypes.push(<Kvp>({ Key: kvp.Key, Value: kvp.Value }));
        }
        console.log('GOT EM', this.PointTypes);
      });
  }

  PointType(pointTypeID: number): string {
    return this.PointTypes.filter(pt => pt.Key === pointTypeID)[0].Value;
  }

  // Do Not Use map
  // ArrayFromMap(map: Map<number, string>): any[] {
  //   return Array.from(map.entries()).map(([key, val]) => ({ key, val }));
  // }


}
