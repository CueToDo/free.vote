// Angular
import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Models
import { PointSelectionTypes, PointFlags } from 'src/app/models/enums';
import { Point } from 'src/app/models/point.model';

// Services
import { AppDataService } from 'src/app/services/app-data.service';

@Component({
  selector: 'app-points-menu',
  templateUrl: './voters-menu.component.html'
  // styleUrls: ['./voters-menu.component.css']
})
export class VotersMenuComponent {
  selectedIndex = 0;
  PointSelectionTypes = PointSelectionTypes;
  PointFlags = PointFlags;

  point = new Point();

  constructor(private router: Router, private appDataService: AppDataService) {}

  newTopic(summat: Event): void {}
}
