import { isPlatformServer } from '@angular/common';
// angular
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import {
  makeStateKey,
  StateKey,
  TransferState
} from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

// rxjs
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, catchError, tap } from 'rxjs/operators';

// auth0
import { AuthService } from './auth.service';

// FreeVote
import { LocalDataService } from './local-data.service';
import { _MatSlideToggleRequiredValidatorModule } from '@angular/material/slide-toggle';

@Injectable({ providedIn: 'root' })
export class InterceptorService implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private localData: LocalDataService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  // input parameters are both the request and the handler
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // https://stackoverflow.com/questions/48683476/how-to-add-multiple-headers-in-angular-5-httpinterceptor
    // To add headers rather than override
    // const authReq = req.clone({ setHeaders: { Authorization: authToken } });

    // There's getting a user and there's getting a token
    // Login gets the user but does not get the token ???

    const key: StateKey<string> = makeStateKey<string>(request.url);

    if (isPlatformServer(this.platformId)) {
      // https://www.twilio.com/blog/faster-javascript-web-apps-angular-universal-transferstate-api-watchdog
      // Save the state on the server
      return next.handle(request).pipe(
        tap((event: any) => {
          const body = (event as HttpResponse<any>).body;
          this.transferState.set(key, body);
        })
      );
    } else {
      // Check if we already have this response
      const storedResponse = this.transferState.get<any>(key, null);

      if (storedResponse) {
        this.transferState.remove(key);
        const response = new HttpResponse({
          body: storedResponse,
          status: 200
        });
        return of(response);
      } else if (this.localData.LoggedInToAuth0) {
        return this.auth.getTokenSilently$().pipe(
          mergeMap(token => {
            this.localData.SetItem('Access-Token', token);

            const tokenReq = request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });

            return next.handle(tokenReq);
          }),
          // https://stackoverflow.com/questions/43115390/type-void-is-not-assignable-to-type-observableinput
          catchError(err => this.handleError(err))
        );
      } else {
        return next.handle(request);
      }
    }
  }

  handleError(error: Response | HttpErrorResponse): Observable<HttpEvent<any>> {
    // Handle 404's or throw original server error

    // https://stackoverflow.com/questions/45464852/rxjs-observable-throw-is-not-a-function-angular4

    if (error instanceof HttpErrorResponse && error.status === 404) {
      console.log('404 Error', error);
      const error404 = { error: { detail: error.message } };
      return throwError(error404);
    } else {
      return throwError(error);
    }
  }
}
