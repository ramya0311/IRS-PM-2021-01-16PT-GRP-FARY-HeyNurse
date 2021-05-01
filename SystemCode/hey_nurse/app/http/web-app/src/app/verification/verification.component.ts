import { Component, OnInit } from '@angular/core';
import { User } from '../models/user';
import { UserService } from '../shared/user.service';
import { SnackBarService } from '../shared/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.scss']
})
export class VerificationComponent implements OnInit {
    verified = false;
    isLoading = false;
    user: User;
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private snackbarService: SnackBarService){}

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
           if (params._id) {
               const payload  = {
                verification_code: params._id
               };
               this.userService.verifyEmail(payload).subscribe(() => {
                this.verified = true;
                this.snackbarService.pop('Email verification succefull', 'success');
                setTimeout(() => {
                    this.router.navigate(['../password'], {relativeTo: this.route});
                }, 1000);

            });
           }

        });
    }
}
