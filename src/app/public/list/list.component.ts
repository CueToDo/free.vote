// Angular
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  addItem = false;
  addOnBlur = true;
  newItem = '';
  error = '';

  // 2 way binding
  @Input() ItemName = 'item';
  @Input() Items: string[] = [];
  @Output() ItemsChange = new EventEmitter(); // Still need to emit

  constructor() {}

  add(): void {
    console.log('ADDING TO', this.Items);

    this.check();

    if (!this.error) {
      const newItem = this.newItem.trim();
      if (!!newItem && newItem !== '/') {
        if (this.Items == null) {
          this.Items = [];
        }
        this.Items.push(newItem);
        this.ItemsChange.emit(this.Items);
      }
      // Reset the input value
      this.newItem = '';
    }
    this.addItem = false;
  }

  remove(item: string): void {
    const index = this.Items.indexOf(item);

    if (index >= 0) {
      this.Items.splice(index, 1);
    }
  }

  check() {
    // https://stackoverflow.com/questions/1981349/regex-to-replace-multiple-spaces-with-a-single-space
    this.newItem = (this.newItem || '').replace(/\s\s+/g, ' ');
  }
}
