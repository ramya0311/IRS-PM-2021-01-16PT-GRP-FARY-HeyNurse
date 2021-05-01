import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router/router';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    let authRequired: boolean;
    if (route.data && 'authRequired' in route.data) {
      authRequired = route.data.authRequired;
    } else {
      authRequired = true;
    }

    return new Promise(resolve => {
      const handle = () => {
        if (this.userService.currentUser || localStorage.getItem('currentUser')) {
          return resolve(true);
        }

        if (authRequired) {
          this.router.navigate(['../login'], {
            queryParams: { r: state.url.toString() },
          });
        }
        return resolve(!authRequired);
      };

      return handle();
    });
  }
}
