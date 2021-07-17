// Angular
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Router } from '@angular/router';

// Auth0
import { AuthService } from 'src/app/services/auth.service';

// Other
import { DeviceDetectorService } from 'ngx-device-detector';

// FreeVote
import { LocalDataService } from './../../services/local-data.service';
import { AppDataService } from '../../services/app-data.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // https://medium.com/better-programming/angular-manipulate-properly-the-dom-with-renderer-16a756508cba
  @ViewChild('tvSlashTag', { static: false }) tvSlashTag:
    | ElementRef
    | undefined;

  public slashTag = '';

  tabIndex = 0;

  survey = false;
  justice = false;
  ballot = false;

  anonimity = false;
  threats = false;
  threads = false;

  isMobile = false;

  privacyUrl = this.localData.websiteUrl + 'policy.html';

  constructor(
    private router: Router,
    private deviceService: DeviceDetectorService,
    public localData: LocalDataService,
    public appData: AppDataService,
    public auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.epicFunction();
  }

  ngOnInit(): void {
    // Don't emit InputSlashTagOnMobile$ here as it triggers error in app.component
    // ExpressionChangedAfterItHasBeenCheckedError
    this.restartSearch();
  }

  epicFunction(): void {
    this.isMobile = this.deviceService.isMobile();
  }

  installPwa(): void {
    this.appData?.promptEvent?.prompt();
  }

  beginInput(): void {
    // Only update if we are on mobile
    if (this.isMobile) {
      this.appData.InputSlashTagOnMobile$.next(true);
    }
  }

  endInput(): void {
    // Only update if we are on mobile
    if (this.isMobile) {
      this.appData.InputSlashTagOnMobile$.next(false);
    }
  }

  restartSearch(): void {
    // Client side only

    if (isPlatformBrowser(this.platformId)) {
      this.slashTag = '/';

      // Don't start off with focus on input on mobile (Vulcan will never be shown)
      if (!this.isMobile) {
        window.setTimeout(() => {
          const el = this.tvSlashTag?.nativeElement;
          el?.focus();

          // Place cursor at end
          if (typeof el.selectionStart === 'number') {
            el.selectionStart = el.selectionEnd = el.value.length;
          } else if (typeof el.createTextRange !== 'undefined') {
            const range = el.createTextRange();
            range.collapse(false);
            range.select();
          }
        }, 500);
      }
    }
  }

  slashTagChanged(): void {
    // can't use same kebab function as kebabUri - we need to allow ending "-" while typing
    // .filter - an empty string evaluates to boolean false. It works with all falsy values like 0, false, null, undefined

    if (!this.slashTag) {
      this.restartSearch();
    }

    if (this.slashTag && this.slashTag.length > 1) {
      let lastChar = this.slashTag.charAt(this.slashTag.length - 1);

      const regx = /^[-A-Za-z0-9\s]+$/;

      if (!regx.test(lastChar)) {
        lastChar = '';
        this.slashTag = this.slashTag.slice(0, -1);
      }

      if (lastChar === ' ') {
        lastChar = '-';
      }
      if (lastChar !== '-') {
        lastChar = '';
      }

      let output = this.slashTag
        .split(' ')
        .filter(item => item)
        .join('-'); // remove double spaces, replace spaces with dash
      output = output
        .split('-')
        .filter(item => item)
        .join('-'); // remove double-dashes, no dash start or end

      this.slashTag = output + lastChar; // preserve trailing dash while typing
    }
  }

  showTagPoints(): void {
    if (!this.slashTag || this.slashTag === '/') {
      this.restartSearch();
    } else {
      // Remove trailing dash after user finished typing
      let value = this.slashTag;
      if (value[value.length - 1] === '-') {
        value = value.substr(0, value.length - 1);
      }
      this.slashTag = value;

      this.localData.PreviousSlashTagSelected = this.slashTag;

      this.router.navigateByUrl('/' + this.slashTag);
      this.slashTag = '';
    }
  }
}
