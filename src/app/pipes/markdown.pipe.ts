import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    const markdown = value ?? '';
    const html = marked.parse(markdown, { gfm: true, breaks: true }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
