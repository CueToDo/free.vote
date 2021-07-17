// Angular
import { Component, Input, EventEmitter, Output } from '@angular/core';

// Models, enums
import { Question } from 'src/app/models/question.model';
import { PointSupportLevels } from 'src/app/models/enums';

// Services
import { LocalDataService } from 'src/app/services/local-data.service';
import { AppDataService } from 'src/app/services/app-data.service';
import { QuestionsService } from 'src/app/services/questions.service';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent {
  @Input() public question = new Question();
  @Input() questionCount = 0;

  @Output() QuestionDeleted = new EventEmitter();

  editing = false;

  error = '';

  constructor(
    public localData: LocalDataService, // public - used in template
    public appData: AppDataService,
    private questionsService: QuestionsService
  ) {}

  edit(): void {
    this.editing = true;
  }

  delete(): void {
    this.error = '';
    const questionID = this.question?.questionID;

    if (questionID) {
      if (confirm('Are you sure you wish to delete this question?')) {
        this.questionsService.QuestionDelete(questionID).subscribe({
          next: () => this.QuestionDeleted.emit(questionID),
          // not looking at any result <<<
          error: serverError => {
            this.error = serverError.error.detail;
          }
        });
      }
    } else {
      this.error = 'Unknown question id - cannot be deleted';
    }
  }

  onCompleteEdit(): void {
    this.editing = false;
  }

  onCancelEdit(): void {
    this.editing = false;
  }

  QuestionFeedback(supportLevelID: PointSupportLevels): void {
    if (!this.question?.voteIsUpdatable) {
      alert('Question vote up/down is not updatable');
    } else {
      if (
        this.question.supportLevelID === supportLevelID &&
        !this.question.questionModified
      ) {
        // If clicked on the current support level then delete it
        if (confirm('Are you sure you wish to delete your vote?')) {
          supportLevelID = PointSupportLevels.None;
        } else {
          return; // Cancel feedback delete
        }
      }

      this.questionsService
        .QuestionVote(this.question.questionID, supportLevelID, false)
        .subscribe({
          next: response => {
            if (this.question) {
              this.question.supportLevelID = supportLevelID;
              this.question.votedDate = response;
            }
          },
          error: serverError => {
            this.error = serverError.error.detail;
          }
        });
    }
  }

  Support(): void {
    this.QuestionFeedback(PointSupportLevels.Support);
  }

  Neutral(): void {
    // this.point.pointFeedback.woWVote = false;
    this.QuestionFeedback(PointSupportLevels.StandAside);
  }

  Oppose(): void {
    // this.point.pointFeedback.woWVote = false;
    this.QuestionFeedback(PointSupportLevels.Oppose);
  }

  Report(): void {
    // this.point.pointFeedback.woWVote = false;
    this.QuestionFeedback(PointSupportLevels.Report);
  }

  QuestionLink(): string {
    return `${this.localData.PreviousSlashTagSelected}/question/${this.question?.slug}`;
  }

  SelectQuestion(): void {
    if (this.question) {
      this.localData.questionSelected = this.question.question;
    }
  }

  anon(): void {
    alert('ToDo');
  }
}
