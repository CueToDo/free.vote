import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PipeTransform, Pipe } from '@angular/core';

// https://stackoverflow.com/questions/39628007/angular2-innerhtml-binding-remove-style-attribute/39630507
// <script> is removed in the API, so we can trust the HTML provided, including style
// IF any script were to find its way into the HTML, it would be executed
// "in most situations this method should not be used" https://angular.io/api/platform-browser/DomSanitizer
// The CKEditor may also provide input sanitisation (tbc)
@Pipe({ name: 'SafeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) {}
  transform(value: string): SafeHtml {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}
