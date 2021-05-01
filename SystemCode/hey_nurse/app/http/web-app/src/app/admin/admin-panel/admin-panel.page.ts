import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from 'src/app/shared/modal.component';
import { UserService } from '../../shared/user.service';
import { User } from '../../models/user';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { List } from 'immutable';
import { PaginationPage } from 'src/app/shared/pagination/pagination.component';
import * as _ from 'underscore';
import { SnackBarService } from 'src/app/shared/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
@Component({
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.scss']
})
export class AdminPanelPageComponent implements OnInit {
  @ViewChild('userModal', { static: true })
  public userModal: ModalComponent;
  addUserForm: FormGroup;
  users: User[];
  user: User;
  isLoading = false;
  isAdmin = false;
  pageSize = 10;
  offset = 0;
  pages = List<PaginationPage>();
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private userService: UserService,
    private snackBarService: SnackBarService,
    private router: Router,
    private route: ActivatedRoute) {
    }

  ngOnInit(): void {
    this.addUserForm = new FormGroup({
      user_name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required]),
      user_id: new FormControl('', [Validators.required]),
      isAdmin: new FormControl('', [Validators.required]),
    });

    merge(this.userService.onResourceCreated,
      this.userService.onResourceEdited).subscribe(newUser => {
      const index = this.users.findIndex(user => user._id === newUser._id);
      if (this.isAdmin === newUser.isAdmin) {
        if (index > -1) {
          this.users[index] = newUser;
        } else {
          this.users.push(newUser);
        }
      } else {
        if (index > -1) {
          this.users.splice(index, 1);
        }
      }
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.getUsers({where: `{"isAdmin":${this.isAdmin}}`, skip: this.offset, limit: this.pageSize});
  }

  getUsers(payload): void {
    this.isLoading = true;
    this.userService.getAllUsers(payload)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe(result => {
      this.pages = List(_.range(0, result.total, this.pageSize).map(i => ({
        number: (i / this.pageSize) + 1,
        start: i
      })));
      this.users = result.data;
    });
  }

  openModal(user?): void {
    if (user) {
      this.user = user;
      this.addUserForm.reset(user);
    } else {
      this.addUserForm.patchValue({isAdmin: this.isAdmin});
    }
    this.userModal.open();
  }

  submit(): void {
    const userData = this.addUserForm.value;
    let obs;
    if (!this.user) {
      obs = this.userService.createUser(userData);
    } else {
      userData._id = this.user._id;
      obs = this.userService.editUser(userData);
    }
    obs.subscribe((user) => {
      if (this.user) {
        this.snackBarService.pop('User edited successfuly', 'success');
        this.closeModal();
      } else {
        this.snackBarService.pop('User added successfuly', 'success');
        this.resendEmail(user);
        this.closeModal();
      }
    });
  }

  deleteUser(user): void {
    this.userService.deleteUser(user._id).subscribe(deletedUser => {
      const index = this.users.findIndex(existingUser => existingUser._id === deletedUser._id);
      if (index > -1) {
        this.users.splice(index, 1);
      }
      this.snackBarService.pop('User deleted successfuly', 'success');
    });
  }

  closeModal(): void {
    this.user = null;
    this.addUserForm.reset();
    this.userModal.close();
  }

  setStart(start: number): void {
    this.offset = start;
    this.loadUsers();
  }

  redirectToAnalytics(user): void {
    this.router.navigate([user._id, 'analytics'], {relativeTo: this.route});
  }

  resendEmail(user): void {
    const payload = {
      user_name: user.user_name,
      _id: user._id,
      isAdmin: user.isAdmin,
      url: `${this.document.location.origin}/verification`,
      to_email: user.email,
    };
    this.userService.sendVerificationEmail(payload).subscribe(() => {
      this.snackBarService.pop('Email sent successfully', 'success');
    }, err => {
      this.snackBarService.pop('Unable to send email', 'error');
      console.log('err', err);
    });
  }

}
