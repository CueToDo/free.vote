// angular
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

// rxjs
import { from, of, Observable, combineLatest, throwError, Subject } from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';

// auth0
import createAuth0Client, { RedirectLoginResult } from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

// https://mariusschulz.com/blog/importing-json-modules-in-typescript
const config = require('../../auth_config.json');

// Services
import { LocalDataService } from './local-data.service';
import { HttpService } from './http.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Create an observable of Auth0 instance of client
  auth0Client$: Observable<Auth0Client> | undefined;

  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  // tap/do https://www.learnrxjs.io/operators/utility/do.html
  isAuthenticated$: Observable<boolean> | undefined;

  handleRedirectCallback$: Observable<RedirectLoginResult> | undefined;

  constructor(
    private localData: LocalDataService,
    private httpService: HttpService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Auth setup on client only
    if (isPlatformBrowser(this.platformId)) {
      // Platform: Browser Client or Server
      this.auth0Client$ = (
        from(
          createAuth0Client({
            domain: config.domain,
            client_id: config.clientId,
            redirect_uri: `${window.location.origin}/callback`,
            audience: config.audience
          })
        ) as Observable<Auth0Client>
      ).pipe(
        shareReplay(1), // Every subscription receives the same shared value
        catchError(err => throwError(err))
      );

      this.isAuthenticated$ = this.auth0Client$.pipe(
        concatMap((client: Auth0Client) => from(client.isAuthenticated())),
        tap(res => this.localData.LoggedInToAuth0$.next(res))
      );

      console.log('Client only: setup handleRedirectCallback$');
      this.handleRedirectCallback$ = this.auth0Client$.pipe(
        concatMap((client: Auth0Client) =>
          from(client.handleRedirectCallback())
        )
      );
    }
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?: any): Observable<any> {
    if (this.auth0Client$) {
      return this.auth0Client$.pipe(
        concatMap((client: Auth0Client) => from(client.getUser(options)))
      );
    } else {
      return of([]);
    }
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#gettokensilently
  getTokenSilently$(options?: any): Observable<string> {
    if (this.auth0Client$) {
      return this.auth0Client$.pipe(
        concatMap((client: Auth0Client) =>
          from(client.getTokenSilently(options))
        )
      );
    } else {
      return of('');
    }
  }

  localAuthSetup(): void {
    // This should only be called on app initialization

    // Set up local authentication streams
    if (this.isAuthenticated$) {
      const checkAuth$ = this.isAuthenticated$.pipe(
        concatMap((loggedIn: boolean) => {
          if (loggedIn) {
            // If authenticated, get user and set in app
            // NOTE: you could pass options here if needed
            return this.getUser$();
          }
          // If not authenticated, return stream that emits 'false'
          return of(loggedIn);
        })
      );

      checkAuth$.subscribe({
        next: (response: { [key: string]: any } | boolean) => {
          // If authenticated, response will be user object
          // If not authenticated, response will be 'false'
          this.localData.auth0Profile = response;
          this.localData.LoggedInToAuth0 = !!response; // bang bang you're boolean
        },
        error: error => console.log('ERROR: localAuthSetup', error)
      });
    }
  }

  login(redirectPath: string = '/slash-tags/trending'): void {
    if (this.auth0Client$) {
      // Clear session and start afresh
      this.localData.SignedOut(); // Clears local storage and communicates state change

      // A desired redirect path can be passed to login method
      // (e.g., from a route guard)
      // Ensure Auth0 client instance exists
      this.auth0Client$.subscribe((client: Auth0Client) => {
        // Call method to log in

        client.loginWithRedirect({
          appState: { target: redirectPath }
        });
      });
    }
  }

  handleAuthCallback(): Observable<string> {
    if (this.handleRedirectCallback$) {
      console.log('auth service: handleAuthCallback');

      // Only the callback component should call this method
      // Call when app reloads after user logs in with Auth0

      // anti-pattern to have this outside of subscription,
      // maybe so, but the alternative is way too clunky to pass value several steps downstream
      let targetRoute: string; // Path to redirect to after login processsed

      // This service is instantiated once. It's OK to just subscribe
      // https://blog.angularindepth.com/the-best-way-to-unsubscribe-rxjs-observable-in-the-angular-applications-d8f9aa42f6a0

      // Observables do not "like" being inside Observables.
      // https://medium.com/@paynoattn/3-common-mistakes-i-see-people-use-in-rx-and-the-observable-pattern-ba55fee3d031

      // Observables are not that intuitive with single return values from http calls
      // merge switch or concat is all irrelevant, any will do - the outer observable is simply one value?
      // https://medium.com/@luukgruijs/understanding-rxjs-map-mergemap-switchmap-and-concatmap-833fc1fb09ff
      return this.handleRedirectCallback$.pipe(
        concatMap(cbRes => {
          // Get and set target redirect route from callback results
          targetRoute =
            cbRes.appState && cbRes.appState.target
              ? cbRes.appState.target
              : '/';

          console.log('callback targetroute:', targetRoute);
          // Redirect callback complete;
          // Go back to Auth0 for user details and login status
          // combineLatest will not emit an initial value until each observable emits at least one value
          // we must have user and authentication status
          return this.getUser$(); // this.isAuthenticated$
        }),
        concatMap(user => {
          this.localData.auth0Profile = user;
          this.localData.LoggedInToAuth0 = !!user;

          // get new ApiJwt for signed in user BEFORE redirecting in callback component
          // MUST clear first
          this.localData.ClearExistingJwt();

          console.log('Get new jwt for user:', user);
          return this.httpService.getApiJwt();
        }),
        concatMap(_ => of(targetRoute))
      );
    } else {
      return of('');
    }
  }

  logout(): void {
    // Ensure Auth0 client instance exists
    this.auth0Client$?.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        client_id: config.clientId,
        returnTo: window.location.origin // window reference: Manual logout - No SSR issue
      });
    });

    this.localData.SignedOut(); // And Communicate
  }
}
