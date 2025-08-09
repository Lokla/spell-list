import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Data, Character } from '../services/data';

@Component({
  selector: 'app-spell-viewer',
  imports: [CommonModule, FormsModule],
  templateUrl: './spell-viewer.html',
  styleUrl: './spell-viewer.css'
})
export class SpellViewer implements OnInit {
  characters: Character[] = [];
  selectedCharacterId: string = '';
  selectedCharacter: Character | null = null;

  constructor(private dataService: Data) {}

  ngOnInit() {
    this.loadCharacters();
  }

  loadCharacters() {
    this.characters = this.dataService.getCharacters();
  }

  onCharacterChange() {
    if (this.selectedCharacterId) {
      this.selectedCharacter = this.dataService.getCharacter(this.selectedCharacterId) || null;
    } else {
      this.selectedCharacter = null;
    }
  }

  refreshCharacterSpells() {
    if (this.selectedCharacter) {
      this.dataService.updateCharacterSpells(this.selectedCharacter.id).subscribe({
        next: (updatedCharacter) => {
          if (updatedCharacter) {
            this.selectedCharacter = updatedCharacter;
            this.loadCharacters(); // Refresh the character list
          }
        },
        error: (error) => {
          console.error('Error refreshing spells:', error);
          alert('Failed to load spells. Please check if spell data is available.');
        }
      });
    }
  }
}
