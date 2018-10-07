import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'nbsp'
})
export class NbspPipe implements PipeTransform {
  transform(value: string): string {
    if (value) {
      return value.split(' ').join('&nbsp;');
    } else {
      return '';
    }
  }
}

// @Pipe({
//   name: 'datetime'
// })
// export class DateTimePipe extends DatePipe implements PipeTransform {
//   transform(value: Date): string {
//     if (value) {
//       let date = super.transform(value, 'dd MMM yyyy HH:mm:ss');
//       if (date.substring(17) === ':00') { date = date.substring(0, 17); }
//       return date.split(' ').join('&nbsp;');
//     } else {
//       return '';
//     }

//   }
// }
