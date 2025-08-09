import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Data, SpellWithReplacement, Character, CharacterSpell, SpellQuality } from '../services/data';
import { DialogService } from '../services/dialog.service';
import { SpellQualityDialogData } from '../spell-quality-dialog/spell-quality-dialog';

@Component({
  selector: 'app-spell-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spell-list.html',
  styleUrls: ['./spell-list.css']
})
export class SpellListComponent implements OnInit {
  availableClasses: string[] = [];
  selectedClass: string = '';
  spells: SpellWithReplacement[] = [];
  loading: boolean = false;
  copiedSpells: Set<string> = new Set();
  characterLevel: number | null = null;
  characterName: string | null = null;
  characterId: string | null = null;
  currentCharacter: Character | null = null;
  isCharacterView = false;
  private isSettingFromRoute = false;

  // Filter options
  hiddenQualities: Set<string> = new Set();
  hideSpellsAboveLevel70 = true;
  hideOutlevelledSpells = false;
  filteredSpells: SpellWithReplacement[] = [];
  showFilters = false;

    constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataService: Data,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {}

  // Getter for spell qualities to use in template
  get spellQualities(): SpellQuality[] {
    return this.dataService.getSpellQualities();
  }

  ngOnInit() {
    this.availableClasses = this.dataService.getAvailableClasses();
    
    // Check for query parameters from character spell viewing
    this.route.queryParams.subscribe(params => {
      if (params['class']) {
        // Ensure the class name matches exactly with available classes (case-sensitive)
        const paramClass = params['class'].toLowerCase();
        const matchingClass = this.availableClasses.find(cls => cls.toLowerCase() === paramClass);
        
        if (matchingClass) {
          this.isSettingFromRoute = true;
          this.selectedClass = matchingClass;
          this.characterLevel = params['characterLevel'] ? parseInt(params['characterLevel']) : null;
          this.characterName = params['characterName'] || null;
          this.characterId = params['characterId'] || null;
          
          // Check if this is a character-specific view
          if (this.characterId) {
            this.isCharacterView = true;
            this.currentCharacter = this.dataService.getCharacter(this.characterId) || null;
          } else {
            this.isCharacterView = false;
            this.currentCharacter = null;
          }
          
          console.log('Setting selectedClass to:', this.selectedClass);
          console.log('Available classes:', this.availableClasses);
          console.log('Character view:', this.isCharacterView);
          
          // Force change detection to update the dropdown
          this.cdr.detectChanges();
          
          this.loadSpellsForCharacterContext();
          this.isSettingFromRoute = false;
        } else {
          console.warn(`Class "${params['class']}" not found in available classes`);
        }
      }
    });
  }

  private loadSpellsForCharacterContext() {
    if (!this.selectedClass) return;

    this.loading = true;
    this.dataService.getSpellsWithReplacementInfo(this.selectedClass).subscribe({
      next: (spells) => {
        this.spells = spells;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading spells:', error);
        this.spells = [];
        this.filteredSpells = [];
        this.loading = false;
      }
    });
  }

  // Apply all filters to the spell list
  applyFilters() {
    let filtered = [...this.spells];

    // Filter by hidden qualities (only in character view)
    if (this.isCharacterView && this.hiddenQualities.size > 0) {
      filtered = filtered.filter(spell => {
        const quality = this.getSpellQuality(spell.name);
        const qualityName = quality ? quality.name : this.dataService.getDefaultSpellQuality().name;
        return !this.hiddenQualities.has(qualityName);
      });
    }

    // Filter spells above level 70
    if (this.hideSpellsAboveLevel70) {
      filtered = filtered.filter(spell => parseInt(spell.level) <= 70);
    }

    // Filter outlevelled spells (only in character view)
    if (this.hideOutlevelledSpells && this.isCharacterView && this.characterLevel) {
      filtered = filtered.filter(spell => {
        return !this.isSpellOutlevelled(spell);
      });
    }

    this.filteredSpells = filtered;
  }

  // Check if a spell is outlevelled (has a higher level replacement available)
  isSpellOutlevelled(spell: SpellWithReplacement): boolean {
    if (!this.characterLevel || !spell.replacedAtLevel) return false;
    
    // Spell is outlevelled if character's level is >= replacement level
    return this.characterLevel >= spell.replacedAtLevel;
  }

  // Toggle quality filter
  toggleQualityFilter(qualityName: string) {
    if (this.hiddenQualities.has(qualityName)) {
      this.hiddenQualities.delete(qualityName);
    } else {
      this.hiddenQualities.add(qualityName);
    }
    this.applyFilters();
  }

  // Toggle level 70 filter
  toggleLevel70Filter() {
    this.hideSpellsAboveLevel70 = !this.hideSpellsAboveLevel70;
    this.applyFilters();
  }

  // Toggle outlevelled spells filter
  toggleOutlevelledFilter() {
    this.hideOutlevelledSpells = !this.hideOutlevelledSpells;
    this.applyFilters();
  }

  // Check if quality is hidden
  isQualityHidden(qualityName: string): boolean {
    return this.hiddenQualities.has(qualityName);
  }

  // Toggle filter visibility
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Get spells with "None" quality
  getSpellsWithNoneQuality(): string[] {
    if (!this.isCharacterView || !this.currentCharacter) return [];
    
    return this.spells
      .filter(spell => {
        const quality = this.getSpellQuality(spell.name);
        return quality && quality.name === 'none';
      })
      .map(spell => spell.name);
  }

  // Copy "None" quality spells to clipboard
  async copyNoneQualitySpells() {
    const spellsWithNone = this.getSpellsWithNoneQuality();
    
    if (spellsWithNone.length === 0) {
      alert('No spells with "None" quality found.');
      return;
    }

    const formattedList = JSON.stringify(spellsWithNone);
    
    try {
      await navigator.clipboard.writeText(formattedList);
      // Show temporary success message
      const button = document.querySelector('.copy-none-btn') as HTMLElement;
      if (button) {
        const originalText = button.title;
        button.title = `Copied ${spellsWithNone.length} spells!`;
        button.style.color = '#28a745';
        setTimeout(() => {
          button.title = originalText;
          button.style.color = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  }

  onClassChange() {
    // Don't reset character context if this change is from route parameters
    if (!this.isSettingFromRoute) {
      // Reset character context if class is manually changed
      if (this.characterName && this.characterLevel) {
        this.characterLevel = null;
        this.characterName = null;
        this.characterId = null;
        this.currentCharacter = null;
        this.isCharacterView = false;
      }
    }

    if (!this.selectedClass) {
      this.spells = [];
      return;
    }

    this.loading = true;
    this.dataService.getSpellsWithReplacementInfo(this.selectedClass).subscribe({
      next: (spells) => {
        this.spells = spells;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading spells:', error);
        this.spells = [];
        this.loading = false;
      }
    });
  }

  async copySpellName(spellName: string) {
    try {
      await navigator.clipboard.writeText(spellName);
      this.copiedSpells.add(spellName);
      
      // Remove the checkmark after 2 seconds
      setTimeout(() => {
        this.copiedSpells.delete(spellName);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy spell name:', error);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(spellName);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.copiedSpells.add(text);
        setTimeout(() => {
          this.copiedSpells.delete(text);
        }, 2000);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  isCopied(spellName: string): boolean {
    return this.copiedSpells.has(spellName);
  }

  isSpellAboveCharacterLevel(spell: SpellWithReplacement): boolean {
    if (this.characterLevel === null) return false;
    const spellLevel = parseInt(spell.level.toString());
    return spellLevel > this.characterLevel;
  }

  formatClassName(className: string): string {
    return className.charAt(0).toUpperCase() + className.slice(1);
  }

  // Get the quality for a specific spell if in character view
  getSpellQuality(spellName: string): SpellQuality | null {
    if (!this.isCharacterView || !this.currentCharacter) return null;
    
    return this.dataService.getSpellQualityForCharacter(this.currentCharacter.id, spellName);
  }

  // Get the display quality for a spell (including "None" when no quality is set)
  getSpellDisplayQuality(spellName: string): SpellQuality {
    const quality = this.getSpellQuality(spellName);
    return quality || this.dataService.getDefaultSpellQuality();
  }

  // Get quality color for a spell
  getSpellQualityColor(spellName: string): string {
    const quality = this.getSpellDisplayQuality(spellName);
    return quality.color || '#6c757d';
  }

  // Open spell quality dialog
  async openSpellQualityDialog(spellName: string) {
    if (!this.isCharacterView || !this.currentCharacter) return;
    
    const currentQuality = this.getSpellQuality(spellName) || this.dataService.getDefaultSpellQuality();
    
    const dialogData: SpellQualityDialogData = {
      spellName,
      currentQuality,
      characterId: this.currentCharacter.id
    };

    try {
      const result = await this.dialogService.openSpellQualityDialog(dialogData);
      if (result) {
        // Refresh character data to show updated quality
        this.currentCharacter = this.dataService.getCharacter(this.currentCharacter.id) || null;
        // Force change detection to update the UI
        this.cdr.detectChanges();
        console.log('Quality updated to:', result);
      }
    } catch (error) {
      console.error('Error opening spell quality dialog:', error);
    }
  }
}
