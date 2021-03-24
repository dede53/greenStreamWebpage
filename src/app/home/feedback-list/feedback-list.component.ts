import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginService } from 'src/app/login.service';
import { LoginRequestService } from 'src/app/loginRequest.service';
import { environment } from 'src/environments/environment';
import { Feedback } from 'src/typings';

@Component({
    selector: 'app-feedback-list',
    templateUrl: './feedback-list.component.html',
    styleUrls: ['./feedback-list.component.css']
})
export class FeedbackListComponent implements OnInit {
    feedbacks:Feedback[] = [];
    searchText: string = "";
    loading: boolean = true;
    moreAvailable: boolean = true;
    constructor(private http: HttpClient,
        public loginService: LoginService,
        private loginRequestService: LoginRequestService,
        private router: Router) { }

    ngOnInit(): void {
        this.load([], 20, 0);
    }

    loadMore(topics: number[] = [], limit: number = 10, start: number = 0) {
        this.loadFeedbacks(topics, limit, start).subscribe({
            next: (data:Feedback[]) => {
                this.feedbacks.concat(data);
            },
            error:(err) => {
                console.log(err);
                if(!this.loginService.isLoggedIn){
                    return this.loginRequestService.requestLogin().then((user) => {
                        this.loadMore(topics, limit, start)
                    }).catch(() => {
                        this.router.navigate(['list', 'all']);
                    });
                }
            }
        });
    }

    load(topics: number[] = [], limit: number = 10, start: number = 0) {
        console.log("FeedbackService.load");
        this.loadFeedbacks(topics, limit, start).subscribe({
            next: (data: Feedback[])=> {
                this.feedbacks = data;
            },
            error: (err) => {
                console.log(err);
                if(!this.loginService.isLoggedIn){
                    return this.loginRequestService.requestLogin().then((user) => {
                        this.load(topics, limit, start)
                    }).catch(() => {
                        this.router.navigate(['list', 'all']);
                    });
                }
            }
        });
    }

    loadFeedbacks(topics: number[] = [], limit: number = 10, start: number = 0): Observable<Feedback[]> {
        const url = `${environment.apiMainUrl}/${environment.feedbacksPath}/${limit + 1}/${start}?topics=${topics}`;
        console.log("FeedbackService.loadFeedbacks");
        return this.http.get<Feedback[]>(url).pipe(
            tap((data: Feedback[]) => {
                console.log('fetched items')
                if (data.length > 0) {
                    if (data.length > limit) {
                        data.pop();
                        this.moreAvailable = true;
                    } else {
                        this.moreAvailable = false;
                    }
                } else {
                    this.moreAvailable = false;
                }
                this.loading = false;
                return data;
            })
        );
    }

    deleteFeedback(id: number, index: number) {
        this.http.delete(`${environment.apiMainUrl}/${environment.deleteFeedbackPath}/${id}`).subscribe();
        this.feedbacks.splice(index, 1);
    }
}
