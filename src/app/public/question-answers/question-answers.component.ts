// Angular
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PointSelectionTypes, PointSortTypes } from 'src/app/models/enums';

// Models
import { FilterCriteria } from 'src/app/models/filterCriteria.model';

// Services
import { LocalDataService } from 'src/app/services/local-data.service';
import { QuestionsService } from 'src/app/services/questions.service';

// Components
import { PointsListComponent } from '../points-list/points-list.component';

@Component({
  selector: 'app-question-answers',
  templateUrl: './question-answers.component.html',
  styleUrls: ['./question-answers.component.css']
})
export class QuestionAnswersComponent implements OnInit, AfterViewInit {
  @ViewChild('PointsList') pointsList!: PointsListComponent;

  public mode = 'answers'; // myPoints, newAnswer
  private savedMode = '';

  public filter = new FilterCriteria();
  public attachedToQuestion = false;
  public error = '';

  constructor(
    public localData: LocalDataService,
    private activeRoute: ActivatedRoute,
    private questionsService: QuestionsService
  ) {}

  ngOnInit(): void {
    this.filter.pointSelectionType = PointSelectionTypes.QuestionPoints;
    this.filter.slashTag = this.activeRoute.snapshot.params.tag;
    this.filter.questionSlug = this.activeRoute.snapshot.params.questionSlug; // Display points attached to question
    this.filter.sortType = PointSortTypes.Random;
    this.filter.sortAscending = true;
  }

  ngAfterViewInit(): void {
    this.viewAllAnswers();
  }

  get tagSelected(): string {
    return this.localData.PreviousSlashTagSelected; // Used in routerLink
  }

  public get QuestionSelected(): string {
    return this.localData.questionSelected;
  }

  viewAllAnswers(): void {
    this.error = '';
    this.mode = 'answers';
    this.attachedToQuestion = true;
    this.filter.myPoints = false;
    this.filter.unAttachedToQuestion = false;
    this.pointsList.SelectPoints();
  }

  viewMyPoints(): void {
    this.error = '';
    this.mode = 'myPoints';
    this.attachedToQuestion = true;
    this.filter.myPoints = true;
    this.filter.unAttachedToQuestion = false;
    this.pointsList.SelectPoints();
  }

  addAnswer(): void {
    this.error = '';
    this.savedMode = this.mode;
    this.mode = 'addAnswer';
    this.attachedToQuestion = false;
    this.filter.unAttachedToQuestion = true;
    this.pointsList.SelectPoints();
  }

  newAnswer(): void {
    this.error = '';
    this.savedMode = this.mode;
    this.mode = 'newAnswer';
  }

  cancelEdit(): void {
    this.error = '';
    this.mode = this.savedMode;
  }

  AddRemovePointFromAnswers(add: boolean, pointID: number): void {
    this.error = '';

    this.questionsService
      .QuestionPointAddRemove(
        this.filter.slashTag,
        add,
        this.filter.questionSlug,
        pointID
      )
      .subscribe({
        next: _ => this.viewMyPoints(),
        error: err => (this.error = err.error.detail)
      });
  }
}
