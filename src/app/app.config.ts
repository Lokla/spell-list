import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';

// Function to determine if we're running on GitHub Pages
function isGitHubPages(): boolean {
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withFetch()),
    { provide: APP_BASE_HREF, useValue: isGitHubPages() ? '/spell-list/' : '/' }
  ]
};
