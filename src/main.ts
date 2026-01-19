import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Patch canvas getContext to set willReadFrequently for better performance
// This fixes the Canvas2D warning for multiple readback operations
const originalGetContext = HTMLCanvasElement.prototype.getContext;
(HTMLCanvasElement.prototype.getContext as any) = function (
  this: HTMLCanvasElement,
  contextType: string,
  contextAttributes?: any
): RenderingContext | null {
  if (contextType === '2d') {
    // Merge willReadFrequently: true with any existing attributes
    contextAttributes = { ...contextAttributes, willReadFrequently: true };
  }
  return originalGetContext.call(this, contextType as any, contextAttributes);
};

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
