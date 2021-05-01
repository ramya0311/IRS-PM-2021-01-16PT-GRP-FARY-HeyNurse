import {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
  } from '@angular/router/router';
  import { Injectable } from '@angular/core';
  import { CanActivate, Router } from '@angular/router';
  
  import { UserService } from './user.service';
  
  @Injectable({ providedIn: 'root' })
  export class AdminGuard implements CanActivate {
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
          const user = this.userService.currentUser || JSON.parse(localStorage.getItem('currentUser'));
          if (user && user.isAdmin) {
            return resolve(true);
          } else {
            this.router.navigate(['../dashboard']);
          }
          return resolve(!authRequired);
        };
  
        return handle();
      });
    }
  }
  