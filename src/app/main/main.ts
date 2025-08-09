import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Data } from '../services/data';
import { CharacterManagement } from '../character-management/character-management';
import { SpellViewer } from '../spell-viewer/spell-viewer';
import { Header } from '../header/header';
import { SpellListComponent } from '../spell-list/spell-list';

@Component({
  selector: 'app-main',
  imports: [CommonModule, CharacterManagement, SpellViewer, Header, SpellListComponent],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main implements OnInit {
  characterCount = 0;
  showCharacterManagement = false;
  showSpellViewer = false;
  showSpellList = false;

  constructor(private dataService: Data) {}

  ngOnInit() {
    this.loadCharacterCount();
  }

  loadCharacterCount() {
    this.characterCount = this.dataService.getCharacters().length;
  }

  navigateToCharacters() {
    this.showCharacterManagement = true;
    this.showSpellViewer = false;
    this.showSpellList = false;
  }

  navigateToSpells() {
    this.showSpellList = true;
    this.showCharacterManagement = false;
    this.showSpellViewer = false;
  }

  showStats() {
    const characters = this.dataService.getCharacters();
    const totalSpells = characters.reduce((sum, char) => sum + char.spells.length, 0);
    alert(`You have ${characters.length} character(s) with a total of ${totalSpells} spells.`);
  }

  goBackToMain() {
    this.showCharacterManagement = false;
    this.showSpellViewer = false;
    this.showSpellList = false;
    this.loadCharacterCount(); // Refresh the count in case characters were added/deleted
  }
}
