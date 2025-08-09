import { Injectable, ComponentRef, ViewContainerRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { SpellQualityDialog, SpellQualityDialogData } from '../spell-quality-dialog/spell-quality-dialog';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogRef: ComponentRef<SpellQualityDialog> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  openSpellQualityDialog(data: SpellQualityDialogData): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create dialog component
      this.dialogRef = createComponent(SpellQualityDialog, {
        environmentInjector: this.injector,
        elementInjector: this.injector
      });

      // Provide data and dialog reference
      (this.dialogRef.instance as any).data = data;
      (this.dialogRef.instance as any).dialogRef = {
        close: (result?: any) => {
          this.closeDialog();
          resolve(result);
        }
      };

      // Attach to DOM
      this.appRef.attachView(this.dialogRef.hostView);
      document.body.appendChild(this.dialogRef.location.nativeElement);
    });
  }

  private closeDialog() {
    if (this.dialogRef) {
      this.appRef.detachView(this.dialogRef.hostView);
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }
}
