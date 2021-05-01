import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../shared/user.service';
@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
    ) {
  }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('',[Validators.required]),
      password:new FormControl('',[Validators.required]),
    });
    this.userService.onUserLoggedIn.subscribe(val =>{
      if (val) {
        this.router.navigate(['../dashboard'],{relativeTo: this.route});
      }
    })
  }

  login() {
    this.userService.login(this.loginForm.value);
  }

  redirectToChangePassword() {
    this.router.navigate(['../password'],{relativeTo: this.route});
  }
}
