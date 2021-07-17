// Angular
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Location, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

// rxjs
import { fromEvent } from 'rxjs';

// ngx-bootstrap
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';

// Auth0
import { AuthService } from './services/auth.service';

// FreeVote Models, Services
import { LocalDataService } from './services/local-data.service';
import { AppDataService } from './services/app-data.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { filter, debounceTime } from 'rxjs/operators';
import { PagePreviewMetaData } from './models/point.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: BsDropdownConfig,
      useValue: { isAnimated: false, autoClose: true }
    }
  ]
})
export class AppComponent implements OnInit, AfterViewInit {
  // App Component is instantiated once only and we don't need to manage unsubscribe for Subscriptions
  // https://medium.com/angular-in-depth/the-best-way-to-unsubscribe-rxjs-observable-in-the-angular-applications-d8f9aa42f6a0

  home = false;
  pageTitle = '';
  pageTitleToolTip = '';

  localAPI = '';

  widthBand = 4; // 0 400, 1 550, 2 700, 3 800, 4 900

  public showBurger = false;
  public showVulcan = true;
  public imgVulcan = '../assets/Vulcan.png';
  public altVulcan = 'Vulcan';
  public under500 = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    public localData: LocalDataService /* inject to ensure constructed and values Loaded */,
    public appData: AppDataService,
    private breakpointObserver: BreakpointObserver,
    private location: Location,
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private htmlDocument: HTMLDocument,
    // https://stackoverflow.com/questions/39085632/localstorage-is-not-defined-angular-universal
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    // https://stackoverflow.com/questions/39845082/angular-2-change-favicon-icon-as-per-configuration/45753615
    let favicon = 'favicon.ico';
    switch (this.localData.website) {
      case 'break-out.group':
        favicon = 'lightbulb-idea.ico';
        this.imgVulcan = '../assets/lightbulb-idea.png';
        this.altVulcan = 'lightbulb idea';
        break;
    }

    this.htmlDocument
      .getElementById('appFavicon')
      ?.setAttribute('href', `/assets/${favicon}?d=${Date.now()}`);

    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.auth.localAuthSetup();
    this.appData.InitialiseStrapline();

    // The app component is initialised when we come back from Auth0 login
    // Wait until we have a pukka free.vote jwt before doing the following
    this.localData.GotFreeVoteJwt$.subscribe({
      next: _ => this.appData.InitialisePreviousSlashTagSelected()
    });

    // SSR First Page Meta Data for Social Media
    this.appData.PagePreview$.subscribe({
      next: preview => this.setInitialMetaData(preview)
    });

    // Route and Route Parameters: Setup and subscribe to changes
    this.RouteOrParamsUpdated(this.router.url);

    // Angular Workshop https://stackoverflow.com/questions/33520043/how-to-detect-a-route-change-in-angular
    // The app component is the main route change detector.
    // It can then dispense this throughout the app via coredata service
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(_ => {
        // broadcast showing tags
        this.RouteOrParamsUpdated(this.router.url);
      });

    // app.compnent responds to child component changes
    // ie route parameters changes that it can't detect itself
    this.appData.RouteParamChange$.subscribe((url: string) => {
      this.RouteOrParamsUpdated(url);
    });

    // Viewport Width: Setup and subscribe to changes on browser only - not for Universla SSR

    if (isPlatformBrowser(this.platformId)) {
      this.SetVPW();

      // app component monitors width and broadcasts changes via appDataService
      fromEvent(window, 'resize')
        .pipe(debounceTime(200))
        .subscribe(() => {
          this.SetVPW();
        });
    }

    // Observer breakpoints

    // https://alligator.io/angular/breakpoints-angular-cdk/
    this.breakpointObserver
      .observe(['(max-width: 600px)'])
      .subscribe((state: BreakpointState) => {
        this.showBurger = state.matches;
        this.appData.ShowBurger$.next(this.showBurger);
      });

    this.breakpointObserver
      .observe(['(max-width: 500px)'])
      .subscribe((state: BreakpointState) => {
        this.under500 = state.matches;
      });

    this.appData.InputSlashTagOnMobile$.subscribe(istom => {
      // InputSlashTagOnMobile
      // Triggered by HomeComponent (only) on begin or end input
      this.showVulcan = !istom;
    });
  }

  ngAfterViewInit(): void {
    if (this.localData.GetItem('localAPI') === 'true') {
      this.localAPI = 'Local API';
    }
  }

  setDocTitle(title: string): void {
    // https://blog.bitsrc.io/dynamic-page-titles-in-angular-98ce20b5c334
    this.titleService.setTitle(title);
  }

  setMetaData(
    title: string,
    preview: string,
    csvKeywords: string,
    pagePath: string,
    previewImage: string
  ): void {
    const websiteUrl = this.localData.websiteUrl;
    const url = websiteUrl + this.appData.removeBookEnds(pagePath, '/');

    // https://css-tricks.com/essential-meta-tags-social-media/
    // https://www.tektutorialshub.com/angular/meta-service-in-angular-add-update-meta-tags-example/
    this.metaService.removeTag(`name='keywords'`);

    // Requires Angular Universal Server Side Rendering
    // https://stackoverflow.com/questions/45262719/angular-4-update-meta-tags-dynamically-for-facebook-open-graph
    this.metaService.addTags([
      {
        name: 'keywords',
        content: `Free Vote, voting, democracy, ${csvKeywords}`
      }
    ]);

    // Remove and title meta
    this.metaService.removeTag(`property='og:title'`);
    this.metaService.removeTag(`name='twitter:title'`);

    if (title) {
      this.metaService.addTags([
        { property: 'og:title', content: title },
        { name: 'twitter:title', content: title }
      ]);
    }

    // Remove and add url meta
    this.metaService.removeTag(`property='og:url'`);

    if (url) {
      this.metaService.addTags([{ property: 'og:url', content: url }]);
    }

    // card type: “summary”, “summary_large_image”, “app”, or “player”.
    this.metaService.removeTag(`property='og:type'`);
    this.metaService.removeTag(`name='twitter:card'`);

    this.metaService.addTags([{ property: 'og:type', content: 'article' }]);

    if (preview && previewImage) {
      this.metaService.addTags([
        { name: 'twitter:card', content: 'summary_large_image' }
      ]);
    } else if (preview) {
      this.metaService.addTags([
        {
          name: 'twitter:card',
          content: 'summary'
        }
      ]);
    }

    // Remove and add preview meta
    this.metaService.removeTag(`name='description'`);
    this.metaService.removeTag(`property='og:description'`);
    this.metaService.removeTag(`name='twitter:description'`);

    if (preview) {
      this.metaService.addTags([
        { name: 'description', content: preview },
        { property: 'og:description', content: preview },
        { name: 'twitter:description', content: preview }
      ]);
    }

    // Remove and add previewImage meta
    this.metaService.removeTag(`property='og:image'`);
    this.metaService.removeTag(`property='og:image:width'`);
    this.metaService.removeTag(`property='og:image:height'`);
    this.metaService.removeTag(`name='twitter:image'`);

    if (previewImage) {
      // Requires Angular Universal Server Side Rendering
      // https://stackoverflow.com/questions/45262719/angular-4-update-meta-tags-dynamically-for-facebook-open-graph
      this.metaService.addTags([
        { property: 'og:image', content: previewImage },
        { name: 'twitter:image', content: previewImage }
      ]);
    } else {
      this.metaService.addTags([
        { property: 'og:image', content: websiteUrl + 'assets/vulcan-384.png' },
        { property: 'og:image:width', content: websiteUrl + '384' },
        { property: 'og:image:height', content: websiteUrl + '384' },
        { name: 'twitter:image', content: websiteUrl + 'assets/vulcan-384.png' }
      ]);
    }

    // facebook app_id
    this.metaService.removeTag(`property='fb:app_id'`);
    this.metaService.addTags([
      { property: 'fb:app_id', content: '802708376543547' }
    ]);
  }

  public setInitialMetaData(metaData: PagePreviewMetaData): void {
    console.log(
      'SET INITIAL META DATA',
      metaData.title,
      metaData.preview,
      metaData.previewImage
    );

    this.setMetaData(
      metaData.title,
      metaData.preview,
      'Free Vote, Free, Vote, anonymous, voting, platform' /* keywords */,
      '',
      metaData.previewImage
    ); /* pagePath, imagePath */

    this.appData.initialPageRendered = true;
  }

  public RouteOrParamsUpdated(url: string): void {
    this.appData.Route = url;

    if (url === '/' || url === '' || url.indexOf('/callback') === 0) {
      // Home page
      this.home = true;
      this.pageTitle = '';
      this.setDocTitle(this.localData.website);

      console.log('>>>>>>>>> Set Meta on Route Change <<<<<<<<<<');
      // Setting meta data on route change useful to Google and social media previews
      // Runs after app component init in SSR for FCP (First Contentful Paint)
      this.setMetaData(
        `${this.localData.website} Route Change Title` /* title */,
        'Free Vote anonymous voting platform' /* preview */,
        'Free Vote, Free, Vote, anonymous, voting, platform' /* keywords */,
        this.localData.website,
        `${this.localData.website}/assets/Vulcan.png`
      ); /* pagePath, imagePath */

      // Setting meta data on SSR app.component init will be of use to
      // social media sites as well as Google
      // , 'free vote voter profile', 'assets/Vulcan.png', 'free, vote, voter, profile'
      //   , `points on ${topic}`, 'assets/Slash Tag Cloud.PNG', `${topic}, slash, tag`

      // Set ShowVulcan to true on route change to home page
      // If home page emits InputSlashTagOnMobile in ngOnInit, get error
      // ExpressionChangedAfterItHasBeenCheckedError
      this.showVulcan = true;
    } else {
      this.home = false;

      if (url.indexOf('?') > 0) {
        url = url.split('?')[0]; // #176 discard query string for facebook shares
      }

      this.pageTitle = url;

      this.pageTitleToolTip =
        url === this.localData.PreviousSlashTagSelected
          ? 'SlashTag/' + this.localData.PreviousTopicSelected
          : url.substr(1);

      if (url.indexOf('slash-tags') > -1) {
        this.appData.PageName$.next('slashTags');
        this.setDocTitle('Slash Tags');
        console.log('slash tags');
      } else if (url.indexOf('/my/details') > -1) {
        this.appData.PageName$.next('profile');
        this.setDocTitle('Voter Profile');
        console.log('my details');
      } else {
        const topic = this.localData.SlashTagToTopic(this.pageTitle);
        this.setDocTitle(topic);
        console.log('Set Doc Title on route change: none of the above');
      }

      // https://angular.io/api/common/Location#!#replaceState-anchor
      // change url in browser's address bar

      // When app is reloaded on callback, do not replaceState
      if (url) {
        this.location.replaceState(url);
      }

      // Only show Vulcan on home page
      // this will be updated on begin or end input on home page
      this.showVulcan = this.home;
    }
  }

  SetVPW(): void {
    if (isPlatformBrowser(this.platformId)) {
      // No window object on SSR - no need to set ViewwPort width

      const vpw = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      );

      let band: number;

      // Restict Weight and font-size for smaller screens
      if (vpw < 400) {
        band = 0;
      } else if (vpw < 550) {
        band = 1;
      } else if (vpw < 700) {
        band = 2;
      } else if (vpw < 800) {
        band = 3;
      } else if (vpw < 900) {
        band = 4;
      } else {
        band = 5;
      }

      if (this.widthBand !== band) {
        this.widthBand = band;
        this.appData.DisplayWidth$.next(band);
      }
    }
  }

  toggleLocalAPI(): void {
    if (this.localData.GetItem('localAPI') === 'true') {
      this.localData.SetItem('localAPI', 'false');
      this.localAPI = '';
    } else {
      this.localData.SetItem('localAPI', 'true');
      this.localAPI = 'Local API';
    }

    this.localData.SetServiceURL();
  }

  // ngOnDestroy(): void {
  // No need to create subscriptions to unsubscribe in app.component
  // }
}
