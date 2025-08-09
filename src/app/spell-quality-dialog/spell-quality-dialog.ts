import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Data, SpellQuality } from '../services/data';

export interface SpellQualityDialogData {
  spellName: string;
  currentQuality: SpellQuality;
  characterId: string;
}

@Component({
  selector: 'app-spell-quality-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spell-quality-dialog.html',
  styleUrl: './spell-quality-dialog.css'
})
export class SpellQualityDialog {
  availableQualities: SpellQuality[] = [];
  selectedQuality: SpellQuality;
  data!: SpellQualityDialogData;
  dialogRef: any;

  constructor(private dataService: Data) {
    this.availableQualities = this.dataService.getSpellQualities();
    this.selectedQuality = this.dataService.getDefaultSpellQuality();
  }

  ngOnInit() {
    if (this.data) {
      this.selectedQuality = this.data.currentQuality;
    }
  }

  onQualityChange(quality: SpellQuality) {
    this.selectedQuality = quality;
    // Immediately save and close dialog
    console.log('Saving quality:', quality, 'for spell:', this.data.spellName, 'character:', this.data.characterId);
    this.dataService.updateSpellQuality(
      this.data.characterId,
      this.data.spellName,
      this.selectedQuality
    );
    this.dialogRef.close(this.selectedQuality);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    // This method is no longer needed but kept for compatibility
    this.dataService.updateSpellQuality(
      this.data.characterId,
      this.data.spellName,
      this.selectedQuality
    );
    this.dialogRef.close(this.selectedQuality);
  }
}
