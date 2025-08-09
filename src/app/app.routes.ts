import { Routes } from '@angular/router';
import { SpellListComponent } from './spell-list/spell-list';
import { CharacterManagement } from './character-management/character-management';

export const routes: Routes = [
  { path: '', redirectTo: '/spells', pathMatch: 'full' },
  { path: 'spells', component: SpellListComponent },
  { path: 'characters', component: CharacterManagement },
  { path: '**', redirectTo: '/spells' }
];
