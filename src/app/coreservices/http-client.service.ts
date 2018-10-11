import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Cookie } from 'ng2-cookies';
import { SignInStatuses } from '../models/enums';
import { SignInData } from '../models/signin.model';

import { } from 'rxjs/add/operator/map';


@Injectable()
export class HttpClientService {

  private website: string;
  private serviceUrl: string;

  private sessionID(): string {
    const id: string = Cookie.get('SessionID').valueOf();
    return id === '' ? '0' : id;
  }

  public get SignInData(): SignInData {

    let signInData = new SignInData();

    if (Cookie.get('SignInData') !== '') {
      signInData = JSON.parse(Cookie.get('SignInData').valueOf());
    }

    return signInData;
  }

  constructor(private httpClient: HttpClient) {

    // check if running locally to determine service url
    const spaDomain = window.location.origin.split('//')[1].split(':')[0].replace('api.', '');

    if (spaDomain === 'localhost') {
      this.website = 'free.vote';
      this.serviceUrl = 'http://localhost:56529/';
      // this.serviceUrl = 'https://api.free.vote/';
    } else {
      this.website = spaDomain;
      this.serviceUrl = 'https://api.free.vote/';
    }

    console.log({ Website: this.website, ServiceUrl: this.serviceUrl });

    if (!this.SignInData.JWT) {
      console.log('NO JWT - renew SessionID in constructor');
      this.SessionKeepAlive();
    }
  }

  SessionKeepAlive() {
    // If there's no JWT then must get SessionID
    this.SessionIDRenew()
      .then(sessionID => {
        Cookie.set('SessionID', sessionID);
      });
  }

  SessionIDRenew(): Promise<string> {
    return this.get('authentication/sessionidrenew/' + this.sessionID())
      .then(response => response.SessionID);
  }


  RequestHeaders() {



    // https://stackoverflow.com/questions/45286764/angular-4-3-httpclient-doesnt-send-header/45286959#45286959
    // The instances of the new HttpHeader class are immutable objects.
    // state cannot be changed after creation

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('Website', this.website)
      .set('SessionID', this.sessionID())
      .set('JWT', this.SignInData.JWT);

    return { headers: headers };
  }


  get(url): Promise<any> {
    if (!url.includes('sessionidrenew')) { this.SessionKeepAlive(); }
    return this.httpClient.get(this.serviceUrl + url, this.RequestHeaders()).toPromise();
  }


  post(url, data): Promise<any> {

    this.SessionKeepAlive();

    return this.httpClient
      .post(this.serviceUrl + url,
        JSON.stringify(data),
        this.RequestHeaders())
      .toPromise();
  }

}
