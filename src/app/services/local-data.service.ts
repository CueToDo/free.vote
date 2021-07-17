// Angular
import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

// rxjs
import { Subject } from 'rxjs';

// Models
import { FreeVoteProfile } from '../models/FreeVoteProfile';

@Injectable({ providedIn: 'root' })
export class LocalDataService {
  public website = '';
  public strapline = '';
  public websiteUrl = '';
  public apiUrl = '';

  // Subscribe to these in components rather than reference static values in localData
  public LoggingInToAuth0$ = new Subject<boolean>();
  public LoggedInToAuth0$ = new Subject<boolean>();
  public GotFreeVoteJwt$ = new Subject<boolean>();

  public auth0Profile: any; // Auth0 Profile Data saved to app on login

  public freeVoteProfile = new FreeVoteProfile(); // For client updates to API
  public updatingProfile = false; // on all backend interactions we get jwt and assignservervalues - don't reassign before backend update

  public questionSelected = '';

  // Auth0 and FreeVote Profile - Following static values not to be used in component initialisation where a change subscription is needed
  public get LoggingInToAuth0(): boolean {
    return this.GetItem('loggingInToAuth0') === 'true';
  }
  public set LoggingInToAuth0(loggingInToAuth0: boolean) {
    // Save
    this.SetItem('loggingInToAuth0', String(loggingInToAuth0));
    this.SetItem('loggedInToAuth0', String(false));
    // Communicate
    this.LoggingInToAuth0$.next(loggingInToAuth0);
    this.LoggedInToAuth0$.next(false);
  }

  public get LoggedInToAuth0(): boolean {
    return this.GetItem('loggedInToAuth0') === 'true';
  }
  public set LoggedInToAuth0(loggedIn: boolean) {
    console.log('Now logged in:', loggedIn);
    // Save
    this.SetItem('loggingInToAuth0', String(false));
    this.SetItem('loggedInToAuth0', String(loggedIn));
    // Communicate
    this.LoggingInToAuth0$.next(false);
    this.LoggedInToAuth0$.next(loggedIn);
  }

  // Need in-memory value for server side tasks (no local storage)
  private gettingFreevoteJwt = false;
  public get GettingFreeVoteJwt(): boolean {
    return this.gettingFreevoteJwt;
  }
  public set GettingFreeVoteJwt(getting: boolean) {
    if (getting) {
      // Clear existing
      this.ClearExistingJwt();
    }
    // Save Status
    this.gettingFreevoteJwt = getting; // no need to save to local storage

    // Communicate
    this.GotFreeVoteJwt$.next(false); // Getting, haven't yet got
  }

  // We have a jwt - signed in or not - unless just signed out or never signed in
  public get GotFreeVoteJwt(): boolean {
    // actually have a jwt
    return !!this.JWT;
  }

  // Where an anon user selects items by sessionID, so does signed in user
  // Anon sessionIDs should be renewed opportunistically and returned if updated?

  // jwt contains All claims
  // SessionID is baked into jwt for anon or signed-in users
  // jwt must be in-memory for server side rendering
  private jwt = '';
  public get JWT(): string {
    return this.jwt;
  }
  public set JWT(jwt: string) {
    if (jwt === null || jwt === undefined) {
      jwt = '';
    }
    this.jwt = jwt;
    // Communicate
    this.GotFreeVoteJwt$.next(!!jwt);
  }

  public ClearExistingJwt(): void {
    this.JWT = '';
    // Communicate
    this.GotFreeVoteJwt$.next(false);
  }

  public get roles(): string[] {
    const roleString = this.GetItem('roles');
    if (!!roleString) {
      return roleString.split(',');
    } else {
      return [''];
    }
  }
  public set roles(roles: string[]) {
    let roleString = '';
    if (roles) {
      roleString = roles.join(',');
    }
    this.SetItem('roles', roleString);
  }

  // Depending on already being sanitised - straight conversion between values as would be saved in database
  TopicToSlashTag(topic: string): string {
    if (!topic) {
      return '';
    }
    return '/' + topic.split(' ').join('-');
  }

  // Depending on already being sanitised - straight conversion between values as would be saved in database
  SlashTagToTopic(slashTag: string): string {
    const topic = slashTag.replace('/', '').split('-').join(' ');
    return topic;
  }

  constructor(
    // https://stackoverflow.com/questions/39085632/localstorage-is-not-defined-angular-universal
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Lifecycle hooks, like OnInit() work with Directives and Components.
    // They do not work with other types, like a service.

    this.SetServiceURL();

    this.LoadValues();
  }

  SetItem(name: string, value: string): void {
    // localStorage not available in Universal SSR
    if (isPlatformBrowser(this.platformId)) {
      if (value === 'null') {
        value = '';
      }
      localStorage.setItem(name, value);
    }
  }

  GetItem(name: string): string {
    let value: string | null = '';

    // localStorage not available in Universal SSR
    if (isPlatformBrowser(this.platformId)) {
      value = localStorage.getItem(name);
    }
    if (value === 'null') {
      value = null;
    }
    return value ? value : '';
  }

  public SetServiceURL(): void {
    // Defaults
    this.website = 'free.vote';
    this.websiteUrl = 'https://free.vote/';
    this.apiUrl = 'https://api.free.vote/';

    if (isPlatformBrowser(this.platformId)) {
      // window not available on server
      this.websiteUrl = window.location.origin + '/';

      // API: Always use live unless there is a local manual override
      const localAPI: boolean = this.GetItem('localAPI') === 'true';
      if (localAPI) {
        this.apiUrl = 'http://localhost:54357/';
      }
    }
  }

  public LoadValues(): void {
    this.jwt = this.GetItem('jwt');

    // client side values - user may update and post to API
    this.freeVoteProfile.alias = this.GetItem('alias');
    this.freeVoteProfile.country = this.GetItem('country');
    this.freeVoteProfile.city = this.GetItem('city');
    this.freeVoteProfile.countryId = this.GetItem('countryId');
    this.freeVoteProfile.cityId = this.GetItem('cityId');
    this.freeVoteProfile.profilePictureOptionID = this.GetItem(
      'profilePictureOptionID'
    );
    this.freeVoteProfile.profilePicture = this.GetItem('profilePicture');

    this.ActiveAliasForFilter = this.PreviousAliasSelected; // may be ''
  }

  public SaveValues(): void {
    this.SetItem('jwt', this.JWT);

    if (this.freeVoteProfile) {
      if (this.freeVoteProfile.alias) {
        this.SetItem('alias', this.freeVoteProfile.alias);
      }
      if (this.freeVoteProfile.country) {
        this.SetItem('country', this.freeVoteProfile.country);
      }
      if (this.freeVoteProfile.city) {
        this.SetItem('city', this.freeVoteProfile.city);
      }
      if (this.freeVoteProfile.countryId) {
        this.SetItem('countryId', this.freeVoteProfile.countryId.toString());
      }
      if (this.freeVoteProfile.cityId) {
        this.SetItem('cityId', this.freeVoteProfile.cityId.toString());
      }
      if (this.freeVoteProfile.profilePictureOptionID) {
        this.SetItem(
          'profilePictureOptionID',
          this.freeVoteProfile.profilePictureOptionID
        );
      }
      if (this.freeVoteProfile.profilePicture) {
        this.SetItem('profilePicture', this.freeVoteProfile.profilePicture);
      }
    }
  }

  // DIY rather than Object.Assign
  public AssignServerValues(values: any): void {
    if (values && !this.updatingProfile) {
      if (!!values.jwt) {
        // Set
        this.JWT = values.jwt;
        this.GettingFreeVoteJwt = false;
        console.log('Your new jwt sir:', values.jwt);
      }

      if (values.roles) {
        this.roles = values.roles.toString().split(',');
      }

      if (values.alias) {
        this.freeVoteProfile.alias = values.alias;
      }
      if (values.country) {
        this.freeVoteProfile.country = values.country;
      }
      if (values.city) {
        this.freeVoteProfile.city = values.city;
      }
      if (values.countryId) {
        this.freeVoteProfile.countryId = values.countryId;
      }
      if (values.cityId) {
        this.freeVoteProfile.cityId = values.cityId;
      }
      if (values.profilePictureOptionID) {
        this.freeVoteProfile.profilePictureOptionID =
          values.profilePictureOptionID.toString();
      }
      if (values.profilePicture) {
        this.freeVoteProfile.profilePicture = values.profilePicture;
      }

      // (Don't save Last Alias Selected to database)
      // Last SlashTag selected by Voter
      if (values.lastTag) {
        this.PreviousTopicSelected = this.SlashTagToTopic(values.lastTag);
      }
    }
  }

  // Saved Topic/SlashTag
  public get PreviousTopicSelected(): string {
    return this.GetItem('previousTopicSelected');
  }
  public set PreviousTopicSelected(topic: string) {
    let previousTopicSelected = '';
    if (topic.charAt(0) === '/') {
      // Expecting a slash, but we got a topic - no need to convert slashTag to topic - it is a topic
      previousTopicSelected = this.SlashTagToTopic(topic);
    } else {
      previousTopicSelected = topic;
    }

    this.SetItem('previousTopicSelected', previousTopicSelected);
  }

  public get PreviousSlashTagSelected(): string {
    return this.TopicToSlashTag(this.PreviousTopicSelected);
  }
  public set PreviousSlashTagSelected(slashTag: string) {
    if (!!slashTag) {
      if (slashTag.charAt(0) !== '/') {
        // Expecting a slash, but we got a topic - no need to convert slashTag to topic - it is a topic
        this.PreviousTopicSelected = slashTag;
      } else {
        this.PreviousTopicSelected = this.SlashTagToTopic(slashTag);
      }
    }
  }

  // Saved Alias
  public get PreviousAliasSelected(): string {
    return this.GetItem('previousAliasSelected');
  }
  public set PreviousAliasSelected(alias: string) {
    this.SetItem('previousAliasSelected', alias);
  }

  public get ActiveAliasForFilter(): string {
    return this.GetItem('activeAliasForFilter');
  }
  public set ActiveAliasForFilter(activeAliasForFilter: string) {
    this.SetItem('activeAliasForFilter', activeAliasForFilter);
  }

  public ClearAliasFilter(): void {
    this.ActiveAliasForFilter = '';
  }
  public RestoreAliasFilter(): void {
    this.ActiveAliasForFilter = this.PreviousAliasSelected;
  }

  public SignedOut(): void {
    // Save signed out state
    this.LoggingInToAuth0 = false;
    this.LoggedInToAuth0 = false;

    this.ClearExistingJwt();

    // Communicate
    this.LoggedInToAuth0$.next(false);

    // client side values - user may update and post to API
    this.freeVoteProfile.alias = '';
    this.freeVoteProfile.country = '';
    this.freeVoteProfile.city = '';
    this.freeVoteProfile.countryId = '0';
    this.freeVoteProfile.cityId = '0';
    this.freeVoteProfile.profilePictureOptionID = '';
    this.freeVoteProfile.profilePicture = '';

    // Preserve use of localAPI after sign out/sign in
    const localAPI = this.GetItem('localAPI');

    // clear all local storage
    localStorage.clear();

    this.SetItem('localAPI', localAPI);
    this.SetItem('previousTopicSelected', 'SignedOut'); // Used in AppDataService InitialisePreviousAliasAndTopic
  }

  onDestroy(): void {
    this.SaveValues();
  }
}
