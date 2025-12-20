import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslatePipe } from '@pipes/translate.pipe';
import { MarkdownPipe } from '@pipes/markdown.pipe';

@Component({
  selector: 'app-about-me',
  imports: [TranslatePipe, MarkdownPipe],
  templateUrl: './about-me.html',
  styleUrl: './about-me.css',
})
export class AboutMe implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    setTimeout(() => {
      const section = document.querySelector('.about-section');
      if (section) this.observer?.observe(section);
    }, 100);
  }
}
