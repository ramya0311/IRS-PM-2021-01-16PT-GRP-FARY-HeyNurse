import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { User } from '../models/user';
import { UserService } from './user.service';

@Component({
  selector: 'nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnDestroy {
    currentUser: User;
    constructor(
      private userService: UserService,
      private router: Router,
      private route: ActivatedRoute,
      private cookieService: CookieService) {
        this.userService.onUserLoggedIn.subscribe(val => {
          if (val) {
            this.currentUser = this.userService.currentUser || JSON.parse(localStorage.getItem('currentUser'));
          }
        });

    }

    ngOnInit() {
      this.currentUser = this.userService.currentUser || JSON.parse(localStorage.getItem('currentUser'));
    }

    logout() {
      this.userService.logout().subscribe(() => {
        localStorage.clear();
        this.cookieService.deleteAll();
        this.currentUser = null;
        this.router.navigate(['../login'], {relativeTo: this.route});
      });
    }

    redirectToPage(page: string) {
      this.router.navigate(['..', page], {relativeTo: this.route});
    }

    ngOnDestroy(): void{

    }
}
