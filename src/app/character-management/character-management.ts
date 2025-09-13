import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Data, Character } from '../services/data';

@Component({
  selector: 'app-character-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-management.html',
  styleUrl: './character-management.css'
})
export class CharacterManagement implements OnInit {
  characters: Character[] = [];
  showCreateForm = false;
  showImportForm = false;
  isEditMode = false;
  editingCharacterId: string | null = null;
  newCharacter = {
    name: '',
    class: '',
    level: 1
  };

  constructor(private dataService: Data, private router: Router) {}

  ngOnInit() {
    this.loadCharacters();
  }

  loadCharacters() {
    this.characters = this.dataService.getCharacters();
  }

  editCharacter(character: Character) {
    this.isEditMode = true;
    this.editingCharacterId = character.id;
    this.showCreateForm = true;
    this.newCharacter = {
      name: character.name,
      class: character.class,
      level: character.level
    };
  }

  createCharacter() {
    if (this.newCharacter.name && this.newCharacter.class && this.newCharacter.level) {
      let character: Character;
      
      if (this.isEditMode && this.editingCharacterId) {
        // Get existing character
        const existingCharacter = this.dataService.getCharacter(this.editingCharacterId);
        if (!existingCharacter) {
          console.error('Character not found for editing');
          return;
        }
        
        // Update existing character
        character = {
          ...existingCharacter,
          name: this.newCharacter.name,
          class: this.newCharacter.class,
          level: this.newCharacter.level,
          updatedAt: new Date()
        };
      } else {
        // Create new character
        character = {
          id: this.dataService.generateId(),
          name: this.newCharacter.name,
          class: this.newCharacter.class,
          level: this.newCharacter.level,
          spells: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Save character first
      this.dataService.saveCharacter(character);
      
      // Then update with appropriate spells based on class and level
      this.dataService.updateCharacterSpells(character.id).subscribe({
        next: (updatedCharacter) => {
          console.log('Character created with spells:', updatedCharacter);
          this.loadCharacters();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error loading spells for character:', error);
          // Character is still saved, just without spells
          this.loadCharacters();
          this.resetForm();
        }
      });
    }
  }

  deleteCharacter(characterId: string) {
    if (confirm('Are you sure you want to delete this character?')) {
      this.dataService.deleteCharacter(characterId);
      this.loadCharacters();
    }
  }

  viewCharacterSpells(character: Character) {
    // Navigate to spell list with character class filter and level highlighting
    this.router.navigate(['/spells'], { 
      queryParams: { 
        class: character.class,
        characterLevel: character.level,
        characterName: character.name,
        characterId: character.id
      }
    });
  }

  applyNoQualitySettings(character: Character) {
    if (confirm(`Apply No Quality settings to ${character.name}? This will set appropriate spells to "None" quality based on the class data files.`)) {
      this.dataService.applyNoQualitySettings(character.id).subscribe({
        next: (updatedCharacter) => {
          console.log('Applied No Quality settings to character:', updatedCharacter);
          this.loadCharacters();
          alert(`No Quality settings applied to ${character.name} successfully!`);
        },
        error: (error) => {
          console.error('Error applying No Quality settings:', error);
          alert('Error applying No Quality settings. Please try again.');
        }
      });
    }
  }

  exportCharacter(character: Character) {
    const exportData = {
      character: character,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_character.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileContent = e.target?.result as string;
          const importData = JSON.parse(fileContent);
          this.importCharacter(importData);
        } catch (error) {
          alert('Invalid JSON file. Please select a valid character export file.');
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a JSON file.');
    }
    
    // Reset the file input
    event.target.value = '';
  }

  importCharacter(importData: any) {
    try {
      // Validate the import data structure
      if (!importData.character || !importData.character.name || !importData.character.class) {
        alert('Invalid character data. The file does not contain valid character information.');
        return;
      }

      const characterData = importData.character;
      
      // Check if character with same name already exists
      const existingCharacter = this.characters.find(c => c.name === characterData.name);
      if (existingCharacter) {
        if (!confirm(`A character named "${characterData.name}" already exists. Do you want to overwrite it?`)) {
          return;
        }
        // Delete existing character
        this.dataService.deleteCharacter(existingCharacter.id);
      }

      // Create new character with imported data
      const newCharacter: Character = {
        id: this.dataService.generateId(),
        name: characterData.name,
        class: characterData.class,
        level: characterData.level || 1,
        spells: characterData.spells || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.dataService.saveCharacter(newCharacter);
      this.loadCharacters();
      this.showImportForm = false;
      alert(`Character "${newCharacter.name}" imported successfully!`);
      
    } catch (error) {
      alert('Error importing character. Please check the file format.');
      console.error('Import error:', error);
    }
  }

  levelUpCharacter(character: Character) {
    if (character.level < 125) { // Maximum level in EQ2
      const updatedCharacter: Character = {
        ...character,
        level: character.level + 1,
        updatedAt: new Date()
      };
      
      this.dataService.saveCharacter(updatedCharacter);
      
      // Update spells for the new level
      this.dataService.updateCharacterSpells(character.id).subscribe({
        next: (result) => {
          console.log('Character leveled up:', result);
          this.loadCharacters();
        },
        error: (error) => {
          console.error('Error updating spells after level up:', error);
          this.loadCharacters(); // Still refresh the list to show new level
        }
      });
    }
  }

  resetForm() {
    this.newCharacter = {
      name: '',
      class: '',
      level: 1
    };
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingCharacterId = null;
  }
}
