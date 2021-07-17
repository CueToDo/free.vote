import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// urls for YouTube and SoundCloud embeds in point.html are hard coded with API returning IDs only
// These urls can be trusted: we can bypass Angular security
@Pipe({ name: 'SafeURL' })
export class SafeURLPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
