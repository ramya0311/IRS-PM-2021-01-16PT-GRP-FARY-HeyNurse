import { Component, OnInit, ViewChild } from '@angular/core';
import { User } from '../models/user';
import { UserService } from '../shared/user.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalComponent } from '../shared/modal.component';
import { SnackBarService } from '../shared/snackbar.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('userModal', { static: true })
  public userModal: ModalComponent;
  addUserForm:FormGroup;
  passwordForm:FormGroup;
  isLoading = false;
  user: User;
  isEditing = false;

  constructor(private userService: UserService, private snackBarService: SnackBarService){}

  ngOnInit() {
    this.addUserForm = new FormGroup({
      user_name: new FormControl('',[Validators.required]),
      email: new FormControl('',[Validators.required]),
      user_id: new FormControl('',[Validators.required]),
      isAdmin:new FormControl(false,[Validators.required]),
    });
    this.passwordForm = new FormGroup({
      old_password: new FormControl('',[Validators.required]),
      password: new FormControl('',[Validators.required])
    });
    this.user = this.userService.currentUser || JSON.parse(localStorage.getItem('currentUser'));
    this.userService.onResourceEdited.subscribe(newUser=>{
      this.user = newUser;  
    });
  }

  openModal() {
    this.addUserForm.reset(this.user);
    if (!this.user.isAdmin) {
      this.addUserForm.disable();
      this.addUserForm.get('user_name').enable();
    }
    this.userModal.open();
  }

  submit() {
    const userData = this.addUserForm.value;
    userData._id = this.user._id;
    this.userService.editUser(userData).subscribe((userInfo) => {
      this.snackBarService.pop('User edited successfuly', 'success');
      this.userService.currentUser = userInfo;
      localStorage.setItem('currentUser', userInfo.toString());
      this.closeModal();
    });
  }

  closeModal() {
    this.addUserForm.reset();
    this.userModal.close();
  }

  updatePassword() {
    const userData = this.passwordForm.value;
    userData._id = this.user._id;
    this.userService.changePassword(userData).subscribe(() => {
      this.snackBarService.pop('User password changed successfuly', 'success');
    }, err => {
      console.log('err', err);
    });
  }
}
