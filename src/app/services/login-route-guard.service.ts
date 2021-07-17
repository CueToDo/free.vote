import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { LocalDataService } from './local-data.service';

@Injectable({ providedIn: 'root' })
export class LoginRouteGuardService implements CanActivate {
  currentDate = new Date();

  constructor(private localData: LocalDataService) {}

  canActivate(): boolean {
    this.currentDate = new Date();
    return this.localData.LoggedInToAuth0;
  }

  requiresLogin(url: string): boolean {
    return url.includes('/profile') || url.includes('/my/');
  }
}
