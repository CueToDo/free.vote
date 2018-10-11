import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Point } from '../../models/point.model';
import { PointSupportLevels } from '../../models/enums';

// import { PointEditComponent } from '../point-edit/point-edit.component';

import { CoreDataService } from '../../coreservices/coredata.service';
import { PointsService } from '../../coreservices/points.service';

@Component({
  selector: 'app-point',
  templateUrl: './point.component.html',
  styleUrls: ['./point.component.css'],
  preserveWhitespaces: true
})
export class PointComponent implements OnInit {

  @Input() point: Point;

  tags: string[];  // = [<Tag>{ SlashTag: '/slash' }, <Tag>{ SlashTag: '/hash' }];

  signedIn = false;
  editing = false;
  error: string;

  constructor(private router: Router, private coreDataService: CoreDataService, private pointsService: PointsService) {
    this.coreDataService.SetPageTitle(this.router.url);
  }

  ngOnInit() {
    // Angular Workshop filter is not a function

    // this.tags = this.tags.filter(x => x.SlashTag !== '/hash');

    // this.tags = this.point.Tags;

    // this.tags = this.point.Tags.filter((tag: Tag) => tag.SlashTag !== this.router.url);
    // this.tags = this.point.Tags.filter((tag, index, arr) => tag.SlashTag !== this.router.url);

    // function notThisRoute (element: Tag, index, array) { return element.SlashTag !== this.router.url; }
    // this.tags = this.point.Tags.filter(notThisRoute);

    // this.tags = this.point.Tags.filter(x => true);

    this.tags = this.point.SlashTags.filter(tag => tag !== this.router.url);

    this.signedIn = this.coreDataService.SignedIn();

    console.log(this.point);
  }

  PointFeedback(pointSupportLevel: PointSupportLevels): Promise<boolean> {

    return new Promise((resolve, reject) => {

      if (!this.point.PointFeedback.FeedbackIsUpdatable) {

        alert('Feedback is not updatable');
        return reject(false);
      } else {

        if (this.point.PointFeedback.SupportLevelID === pointSupportLevel) {
          // If clicked on the current support level then delete it
          if (confirm('Are you sure you wish to delete your feedback?')) {
            pointSupportLevel = PointSupportLevels.None;
          } else { return reject(false); } // Cancel feedback delete
        }

        this.pointsService.PointFeedback(this.point.PointID, pointSupportLevel, '', false)
          .then(response => {
            console.log('FEEDBACK API RESPONSE', response);
            this.point.PointFeedback = response;
            // this.point.PointFeedback.SupportLevelID = pointSupportLevel;
            console.log('CLIENT DATA UPDATED PointSupportlevel: ', this.point.PointFeedback.SupportLevelID);
            return resolve(true); // Angular workshop - NOT Promise.resolve
          })
          .catch(serverError => {
            console.log('PointFeedback Error', serverError);
            this.error = serverError.error.error;
            return reject(false);
          });
      }
    });
  }

  WoW() {

    console.log('BEGIN WoW');

    // ToDo Angular Workshop: Cannot read property 'name' of undefined
    // point.SupportLevelID was a number. Loosely typed

    // This is the conditional first step, mandatory second step conundrum
    // Now no recursion - allow business layer to handle

    // Allow business layer to handle support if WoWing
    // if (!this.point.PointFeedback.WoWVote && this.point.PointFeedback.SupportLevelID !== PointSupportLevels.Support) {
    //   console.log('10-6: ', this.point.PointFeedback.SupportLevelID);
    //   this.PointFeedback(PointSupportLevels.Support).then(
    //     success => {
    //       console.log(success, 'Success PointSupportlevel: ', this.point.PointFeedback.SupportLevelID);
    //       this.WoW();
    //     },
    //     fail => console.log('fail: ', fail));
    // } else {

    // Update WoW
    console.log('CAN now WoW');
    this.pointsService.PointWoWVote(this.point.PointID, !this.point.PointFeedback.WoWVote)
      .then(
        pointFeedback => {
          this.point.PointFeedback = pointFeedback; // Toggle the WoW vote
        });
  }

  Support() {
    this.PointFeedback(PointSupportLevels.Support);
  }

  Neutral() {
    this.point.PointFeedback.WoWVote = false;
    this.PointFeedback(PointSupportLevels.StandAside);
  }

  Oppose() {
    this.point.PointFeedback.WoWVote = false;
    this.PointFeedback(PointSupportLevels.Oppose);
  }

  Report() {
    this.point.PointFeedback.WoWVote = false;
    this.PointFeedback(PointSupportLevels.Report);
  }



  edit() { this.editing = true; }

  delete() {
    if (confirm('Are you sure you wish to delete this point?')) {
      alert('Go delete');
    }
  }

  favourite() { alert('favourite'); }

  addRemoveTags() { alert('add remove tags'); }

  onCancel() { this.editing = false; }

}
