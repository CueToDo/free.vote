import { Component } from '@angular/core';

import { AppDataService } from '../../services/app-data.service';

@Component({
  selector: 'app-point-of-the-week-vote',
  templateUrl: './point-of-the-week-vote.component.html',
  styleUrls: ['./point-of-the-week-vote.component.css']
})
export class PointOfTheWeekVoteComponent {
  constructor(private appDataService: AppDataService) {}
}
