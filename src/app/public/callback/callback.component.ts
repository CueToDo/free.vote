import { Subscription } from 'rxjs';
// angular
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// auth0
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit, OnDestroy {

  private callback$: Subscription;

  handlingCallback = true;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router) { }

  ngOnInit(): void {

    // Don't call this.appDataService.PageTitleChangeSubject$.next
    // app.component subscribes to this and calls this.location.replaceState
    // This prevents completion of Auth0 login

    this.callback$ = this.auth.handleAuthCallback().subscribe(
      {
        next: targetRoute => {
          console.log('targetRoute', targetRoute);
          this.router.navigate([targetRoute]);
          console.log('navigated');
        },
        error: serverError => {
          this.handlingCallback = false;
          if (serverError.error.detail) {
            this.error = serverError.error.detail;
          } else if (serverError.error) {
            this.error = serverError.error;
          } else if (serverError) {
            this.error = serverError;
          }
        }
      }
    );

  }

  signOut(): void {
    this.auth.logout();
  }

  ngOnDestroy(): void {
    this.callback$.unsubscribe();
  }
}
