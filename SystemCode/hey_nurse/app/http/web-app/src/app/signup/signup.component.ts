import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackBarService } from '../shared/snackbar.service';
import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  passwordForm:FormGroup;

  constructor(
    private userService: UserService, 
    private snackBarService: SnackBarService,
    private router: Router,
    private route: ActivatedRoute
    ) {
  }

  ngOnInit() {
    this.passwordForm = new FormGroup({
      email: new FormControl('',[Validators.required]),
      password: new FormControl('',[Validators.required]),
      confirmPassword: new FormControl('',[Validators.required]),
    });
  }

  updatePassword() {
    const userData = this.passwordForm.value;
    this.userService.changePassword(userData).subscribe(() => {
      this.snackBarService.pop('User password changed successfuly', 'success');
      this.redirectToLogin();
    }, err => {
      console.log('err', err);
    });
  }

  redirectToLogin() {
    this.router.navigate(['../login'],{relativeTo: this.route});
  }
}
