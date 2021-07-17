import {
  Component,
  OnInit,
  Inject,
  Renderer2,
  PLATFORM_ID,
  Input,
  EventEmitter
} from '@angular/core';
import { isPlatformServer, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Output } from '@angular/core';

@Component({
  selector: 'app-cke-universal',
  templateUrl: './cke-universal.component.html',
  styleUrls: ['./cke-universal.component.css']
})
export class CkeUniversalComponent implements OnInit {
  // https://www.lavalamp.biz/blogs/how-to-use-ckeditor-5-in-angular-with-server-side-rendering-support/
  // https://stackoverflow.com/questions/62076412/angular-universal-ckeditor5-window-is-not-defined

  @Input() textToEdit = '';
  @Output() textToEditChange = new EventEmitter();

  public ckeConfig = {
    toolbar: {
      items: [
        'Bold',
        'Italic',
        'Underline',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'indent',
        'outdent',
        '|',
        'heading',
        'fontSize',
        '|',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'link',
        'image',
        'insertTable',
        'horizontalLine',
        '|',
        'undo',
        'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    // htmlEncodeOutput: false
    allowedContent: true
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private htmlDocument: HTMLDocument,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCkEditor();
    } else if (isPlatformServer(this.platformId)) {
      //  server mode detected
    }
  }

  loadCkEditor(): void {
    // Append script to document body

    const script = this.renderer2.createElement('script');

    script.type = 'application/javascript';

    // script.src = 'https://cdn.ckeditor.com/ckeditor5/12.4.0/classic/ckeditor.js';
    // Use my custom build
    script.src = 'https://free.vote/ckeditor.js';

    script.text = `
    ${(script.onload = async () => {
      const CKEditor = (window as any).ClassicEditor;

      const editor = await CKEditor.create(
        document.querySelector('#editor'),
        this.ckeConfig
      );

      editor.model.document.on('change', () => {
        this.textToEdit = JSON.stringify(editor.getData());
        this.textToEditChange.emit(editor.getData());
      });
    })}
    `;

    this.renderer2.appendChild(this.htmlDocument.body, script);
  }
}
