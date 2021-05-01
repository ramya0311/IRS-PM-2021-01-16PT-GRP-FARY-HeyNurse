import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { List } from 'immutable';
import { PaginationPage } from 'src/app/shared/pagination/pagination.component';
import * as _ from 'underscore';
import { SnackBarService } from 'src/app/shared/snackbar.service';
import { RequestService } from 'src/app/shared/request.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { UserService } from 'src/app/shared/user.service';
import { User } from 'src/app/models/user';
@Component({
  templateUrl: './admin-analytics.page.html',
  styleUrls: ['./admin-analytics.page.scss']
})
export class AdminAnalyticsPageComponent implements OnInit {
    filterBy = 'today';
    multi = [];
    results: any[] ;
    pagedItems: any[] ;
    view: any[] = [700, 300];
    isLoading = false;
    // options
    legend = false;
    showLabels = true;
    animations = false;
    xAxis = true;
    yAxis = true;
    showYAxisLabel = true;
    showXAxisLabel = true;
    yAxisLabel = 'No. of Request';
    xAxisLabel = 'Timeline';
    timeline = false;
    selectedUser: User;
    colorScheme = {
        domain: ['#5AA454']
    };
    pageSize = 10;
    offset = 0;
    pages = List<PaginationPage>();

    constructor(
        private requestService: RequestService,
        private userService: UserService,
        private route: ActivatedRoute){}

    ngOnInit(): void {
        this.isLoading = true;
        this.route.params.subscribe(param => {
            this.query(param.id);
        });
    }

    // tslint:disable-next-line:variable-name
    query(_id: string): void {
        this.userService.getUserByID(_id).subscribe(user => {
            this.selectedUser = user;
            this.offset = 0;
            this.getStats();
        });

    }

    getStats(): void {
        this.isLoading = true;
        const query = this.getQueryParams(this.selectedUser.user_id);
        this.requestService.getAnalytics(query).subscribe(results => {
            this.multi = [];
            this.results = results.data;
            const allValues = this.getAllValues();
            this.pages = List(_.range(0, this.results.length, this.pageSize).map(i => ({
                number: (i / this.pageSize) + 1,
                start: i
            })));
            this.pagedItems = this.results.slice(this.offset, this.pageSize);
            const series = {
                name: 'Count',
                series: allValues.map(res => {
                    const index = this.filterBy === 'today' ? results.data.findIndex(result => moment.utc(result.name).local().format('DD/MM/YYYY hh:mm a') ===
                    moment(res.name).format('DD/MM/YYYY hh:mm a')) : results.data.findIndex(result => result.name === res.name);
                    if (index > -1) {
                        return {
                            name: this.filterBy === 'today' ? moment.utc(results.data[index].name).local().format('hh:mm a') :
                            moment(res.name).format('DD/MM/YYYY'),
                            value: results.data[index].value
                        };
                    } else {
                        return {
                            name: this.filterBy === 'today' ? moment(res.name).format('hh:mm a') :
                            moment(res.name).format('DD/MM/YYYY'),
                            value: res.value
                        };
                    }


                })
            };
            this.multi.push(series);
            this.isLoading = false;
        });
    }

    exportToExcel(): void {
        const query = this.getQueryParams(this.selectedUser.user_id);
        const fileName = `${this.selectedUser.user_name}_statistics_${moment().format('DDMMYY')}.xlsx`;
        this.requestService.exportToExcel(query, fileName).subscribe(result => {
        }, err => {
            console.log('err', err);
        });
    }

    // tslint:disable-next-line:typedef
    getAllValues() {
        const values = [];
        const currentDate = moment().set({hour: 0, minute: 0, second: 0, millisecond: 0 });
        switch (this.filterBy) {
            case 'week':
                for (let i = 0 ; i <= 7 ; i++) {
                    values.push({
                        name: moment(currentDate).subtract(i, 'd').format('YYYY-MM-DD HH:mm:ss'),
                        value: 0
                    });
                }
                break;
            case 'month':
               for (let i = 0 ; i < 30; i++) {
                    values.push({
                        name: moment(currentDate).subtract(i, 'd').format('YYYY-MM-DD HH:mm:ss'),
                        value: 0
                    });
                }
               break;
            default:
                for (let i = 0 ; i < 24; i++) {
                    values.push({
                        name: moment(currentDate).add(i, 'hours'),
                        value: 0
                    });
                }
        }
        print;
        return this.filterBy === 'today' ? values : values.reverse();
    }



    getQueryParams(userID): object {
        let query;
        switch (this.filterBy) {
            case 'week':
                query = {
                    req_nurse_id: userID,
                    day: moment().format('DD'),
                    month: moment().format('MM'),
                    year: moment().format('YYYY'),
                    days_before: 7
                };
                break;
            case 'month':
                query = {
                    req_nurse_id: userID,
                    month: moment().format('MM'),
                    year: moment().format('YYYY'),
                };
                break;
            default:
                query = {
                    req_nurse_id: userID,
                    day: moment().format('DD'),
                    month: moment().format('MM'),
                    year: moment().format('YYYY'),
                };
        }
        return query;
    }

    setStart(start: number): void {
        this.offset = start;
        this.pagedItems = this.results.slice(this.offset, this.offset + this.pageSize);
    }

}
