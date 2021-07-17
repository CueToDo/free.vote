// Angular
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';

// rxjs
import { Subject } from 'rxjs';
import { Observable, of, throwError } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';

// Models/enums
import { ContentType } from '../models/enums';
import { Image, ProfilePicture } from 'src/app/models/Image.model';

// Services
import { LocalDataService } from './local-data.service';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private jwtFetched$ = new Subject<boolean>();

  constructor(
    private httpClient: HttpClient,
    private localData: LocalDataService
  ) {}

  // The API JWT is the FreeVote user profile
  getApiJwt(): Observable<boolean | undefined> {
    // It doesn't matter if you're logged in with Auth0, you still need a FreeVote JWT
    // For Anon or authenticated

    // getApiJwt calls get, but get calls getApiJwt - need to prevent endless loop
    // Anon users have a jwt

    if (this.localData.GotFreeVoteJwt) {
      // Already have jwt - no need to do anything
      return of(true);
    } else if (
      this.localData.LoggingInToAuth0 ||
      this.localData.GettingFreeVoteJwt
    ) {
      // Don't issue request yet - now's not the time,
      // or must wait for existing request to complete
      return this.jwtFetched$;
    } else {
      // Only the first jwt request comes down here

      this.localData.GettingFreeVoteJwt = true; // prevent infinite loop - and communicate

      // Don't add jwt in headers when we're getting jwt
      // This is the observable which will return a boolean
      return this.httpClient
        .get(
          this.localData.apiUrl + 'profile/getApiJwt/' + this.localData.website
        )
        .pipe(
          tap(response => {
            this.localData.AssignServerValues(response); /// but new sessionid is not returned so can't be assigned (that's OK)
            this.localData.SaveValues();
          }),
          map(_ => {
            // we don't return the jwt, we return a boolean
            if (!this.localData.GotFreeVoteJwt) {
              throwError('No JWT'); // must be handled by the subscriber
            }
            this.jwtFetched$.next(true); // Any subsequently queued requests are now unlocked
            this.jwtFetched$.complete();
            return true; // now fulfil the original (promise) which DIDN'T return jwtFetched$
            // the jwt request is complete, should now be able to make the actual queued request
          })
        );
    }
  }

  // Just headers - used within request options
  private RequestHeaders(type: ContentType): HttpHeaders {
    let httpHeaders: HttpHeaders;

    switch (type) {
      case ContentType.json:
        httpHeaders = new HttpHeaders().set(
          'Content-Type',
          'application/json; charset=utf-8'
        );
        break;
      case ContentType.form:
        httpHeaders = new HttpHeaders();
        // https://stackoverflow.com/questions/61602744/contenttype-for-httpheaders-when-uploading-file-in-formdata
        // .set('Content-Type', 'multipart/form-data'); does not work
        // .set('Content-Type', 'multipart/form-data;boundary=SOME_BOUNDARY'); let the automagic happen
        break;
    }

    if (this.localData.GotFreeVoteJwt) {
      httpHeaders = httpHeaders.append('jwt', this.localData.JWT);
    }

    return httpHeaders;
  }

  private RequestOptions(type: ContentType): any {
    // https://stackoverflow.com/questions/45286764/angular-4-3-httpclient-doesnt-send-header/45286959#45286959
    // The instances of the new HttpHeader class are immutable objects.
    // state cannot be changed after creation

    // but you can create a new variable by append
    // https://stackoverflow.com/questions/45286764/angular-httpclient-doesnt-send-header/45286959#45286959
    // Do not set an empty string to a header - it becomes undefined and the post fails

    // Full request options consists of headers only
    return { headers: this.RequestHeaders(type) };
  }

  private getWithJwt(url: string): Observable<any> {
    // Always await a response before making the API call
    // always check we have a valid jwt first whether logged in with Auth0 or not

    console.log('Calling the FreeVote API', this.localData.apiUrl + url);

    return this.httpClient // call the free vote api
      .get(
        this.localData.apiUrl + url,
        this.RequestOptions(ContentType.json) // The request is constructed without a jwt before we receive it
      );
  }

  private postWithJwt(url: string, data: any): Observable<any> {
    return this.httpClient // call the free vote api
      .post(
        this.localData.apiUrl + url,
        JSON.stringify(data),
        this.RequestOptions(ContentType.json)
      );
  }

  private postFormWithJwt(url: string, data: FormData): Observable<any> {
    return this.httpClient // call the free vote api
      .post(
        this.localData.apiUrl + url,
        JSON.stringify(data),
        this.RequestOptions(ContentType.form)
      );
  }

  private postFormWithJwtType<T>(
    url: string,
    formData: FormData
  ): Observable<any> {
    return this.httpClient // call the free vote api
      .post<T>(
        this.localData.apiUrl + url,
        formData,
        this.RequestOptions(ContentType.form)
      );
  }

  get(url: string): Observable<any> {
    // always check we have a valid jwt first whether logged in with Auth0 or not
    // ignore output of getApiJwt - it's passed in the headers of the post
    return this.getApiJwt().pipe(switchMap(_ => this.getWithJwt(url)));
  }

  post(url: string, data: any): Observable<any> {
    // always check we have a valid jwt first whether logged in with Auth0 or not
    // ignore output of getApiJwt - it's passed in the headers of the post
    return this.getApiJwt().pipe(switchMap(_ => this.postWithJwt(url, data)));
  }

  postForm(url: string, form: FormData): Observable<any> {
    // always check we have a valid jwt first whether logged in with Auth0 or not
    // ignore output of getApiJwt - it's passed in the headers of the post
    return this.getApiJwt().pipe(
      switchMap(_ => this.postFormWithJwt(url, form))
    );
  }

  postFormType<T>(url: string, formData: FormData): Observable<any> {
    // always check we have a valid jwt first whether logged in with Auth0 or not
    // ignore output of getApiJwt - it's passed in the headers of the post

    return this.getApiJwt().pipe(
      switchMap(_ => this.postFormWithJwtType<T>(url, formData))
    );
  }

  // These methods use httpClient directly - unwrapped
  uploadImage(imageUpload: File): Observable<HttpEvent<Image>> {
    const fd = new FormData();
    fd.append('image', imageUpload, imageUpload.name);

    const url = this.localData.apiUrl + 'points/imageUpload';

    // Max Shwartzmuller https://www.youtube.com/watch?v=YkvqLNcJz3Y
    return this.getApiJwt().pipe(
      switchMap(_ =>
        this.httpClient.post<Image>(url, fd, {
          reportProgress: true,
          observe: 'events',
          headers: this.RequestHeaders(ContentType.form)
        })
      )
    );
  }

  uploadProfilePicture(
    pictureUpload: File
  ): Observable<HttpEvent<ProfilePicture>> {
    const fd = new FormData();
    fd.append('file', pictureUpload, pictureUpload.name);

    const url = this.localData.apiUrl + 'profile/pictureUpload';

    // Max Shwartzmuller https://www.youtube.com/watch?v=YkvqLNcJz3Y
    return this.getApiJwt().pipe(
      switchMap(_ =>
        this.httpClient.post<ProfilePicture>(url, fd, {
          reportProgress: true,
          observe: 'events',
          headers: this.RequestHeaders(ContentType.form)
        })
      )
    );
  }

  profilePictureDelete(): Observable<string> {
    const url = 'profile/pictureDelete';

    return this.get(url);
  }

  ImageUploadCancel(csvImageIDs: string): Observable<boolean> {
    // https://rules.sonarsource.com/typescript/RSPEC-3498
    // When an already-defined variable is given the same name within a new object,
    // object-shorthand syntax is preferred as being more compact.
    // Similarly, object-shorthand is also preferred for the definition of functions in object literals.
    const ImagesUploadCancel = { csvImageIDs };
    const url = 'points/imagesUploadCancel';

    return this.post(url, ImagesUploadCancel).pipe(map(_ => true));
  }
}
