import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Spell {
  name: string;
  line: string;
  level: string;
}

export interface CharacterSpell extends Spell {
  quality: SpellQuality;
}

export interface SpellQuality {
  name: string;
  displayName: string;
  color?: string;
}

export interface ClassSpells {
  class: string;
  spells: Spell[];
  noquality?: string[];
}

export interface SpellWithReplacement extends Spell {
  replacedAtLevel?: number;
}

export type SpellData = ClassSpells[];

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  spells: CharacterSpell[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Data {
  private readonly STORAGE_KEY = 'eq2-spell-planner-data';
  private spellData: SpellData | null = null;
  private classDataCache: Map<string, ClassSpells> = new Map();

  constructor(private http: HttpClient) { }

  // Get available spell qualities
  getSpellQualities(): SpellQuality[] {
    return [
      { name: 'none', displayName: 'None', color: '#6c757d' },
      { name: 'apprentice', displayName: 'Apprentice', color: '#007bff' },
      { name: 'apprentice4', displayName: 'Apprentice IV', color: '#007bff' },
      { name: 'adept1', displayName: 'Adept I', color: '#ffc107' },
      { name: 'expert', displayName: 'Expert', color: '#28a745' },
      { name: 'master1', displayName: 'Master I', color: '#ffc107' },
      { name: 'grandmaster', displayName: 'Grandmaster', color: '#fd7e14' }
    ];
  }

  // Get default spell quality
  getDefaultSpellQuality(): SpellQuality {
    return { name: 'apprentice', displayName: 'Apprentice', color: '#007bff' };
  }

  // Get quality color
  getQualityColor(qualityName: string): string {
    const quality = this.getSpellQualities().find(q => q.name === qualityName);
    return quality?.color || '#6c757d';
  }

  // Get list of available classes
  getAvailableClasses(): string[] {
    return [
      'assassin', 'berserker', 'brigand', 'bruiser', 'coercer', 'conjuror', 
      'defiler', 'dirge', 'fury', 'guardian', 'illusionist', 'inquisitor', 
      'monk', 'mystic', 'necromancer', 'paladin', 'ranger', 'shadowknight', 
      'swashbuckler', 'templar', 'troubador', 'warden', 'warlock', 'wizard'
    ];
  }

  // Load spells for a specific class from individual JSON file
  loadClassSpells(className: string): Observable<ClassSpells> {
    const cacheKey = className.toLowerCase();
    
    // Return cached data if available
    if (this.classDataCache.has(cacheKey)) {
      return of(this.classDataCache.get(cacheKey)!);
    }
    
    return this.http.get<ClassSpells>(`assets/${className.toLowerCase()}.json`).pipe(
      tap((classData: ClassSpells) => {
        // Cache the loaded data
        this.classDataCache.set(cacheKey, classData);
      }),
      catchError(error => {
        console.error(`Failed to load spells for class ${className}:`, error);
        const fallbackData = { class: className, spells: [] };
        this.classDataCache.set(cacheKey, fallbackData);
        return of(fallbackData);
      })
    );
  }

  // Get spells with replacement level information
  getSpellsWithReplacementInfo(className: string): Observable<SpellWithReplacement[]> {
    return this.loadClassSpells(className).pipe(
      map(classData => {
        const spells = classData.spells;
        const spellsByLine = new Map<string, Spell[]>();
        
        // Group spells by line
        spells.forEach(spell => {
          if (!spellsByLine.has(spell.line)) {
            spellsByLine.set(spell.line, []);
          }
          spellsByLine.get(spell.line)!.push(spell);
        });
        
        // Sort spells in each line by level and calculate replacement levels
        const result: SpellWithReplacement[] = [];
        
        spells.forEach(spell => {
          const lineSpells = spellsByLine.get(spell.line)!
            .sort((a, b) => parseInt(a.level) - parseInt(b.level));
          
          const currentIndex = lineSpells.findIndex(s => 
            s.name === spell.name && s.level === spell.level
          );
          const nextSpell = lineSpells[currentIndex + 1];
          
          result.push({
            ...spell,
            replacedAtLevel: nextSpell ? parseInt(nextSpell.level) : undefined
          });
        });
        
        return result.sort((a, b) => parseInt(a.level) - parseInt(b.level));
      })
    );
  }

  // Load spell data from JSON file
  loadSpellData(): Observable<SpellData> {
    if (this.spellData) {
      return of(this.spellData);
    }

    return this.http.get<SpellData>('assets/spells.json').pipe(
      map(data => {
        this.spellData = data;
        return data;
      }),
      catchError(error => {
        console.error('Failed to load spell data:', error);
        return of([]);
      })
    );
  }

  // Get available spells for a specific class
  getSpellsForClass(className: string): Observable<Spell[]> {
    return this.loadClassSpells(className).pipe(
      map(classData => classData.spells)
    );
  }

  // Get spells available at a specific level for a class
  getSpellsAtLevel(className: string, level: number): Observable<Spell[]> {
    return this.getSpellsForClass(className).pipe(
      map(spells => {
        return spells.filter(spell => parseInt(spell.level) <= level)
                    .sort((a, b) => parseInt(a.level) - parseInt(b.level));
      })
    );
  }

  // Get the highest level spell in each spell line for a character
  getCharacterSpells(className: string, level: number): Observable<CharacterSpell[]> {
    return this.loadClassSpells(className).pipe(
      map(classData => {
        const spells = classData.spells;
        const spellsByLine = new Map<string, Spell>();
        
        // Group spells by line and find highest level spell per line
        spells.forEach(spell => {
          if (parseInt(spell.level) <= level) {
            const currentSpell = spellsByLine.get(spell.line);
            if (!currentSpell || parseInt(spell.level) > parseInt(currentSpell.level)) {
              spellsByLine.set(spell.line, spell);
            }
          }
        });
        
        // Convert to CharacterSpell with appropriate quality
        const defaultQuality = this.getDefaultSpellQuality();
        const noneQuality = this.getSpellQualities().find(q => q.name === 'none')!;
        
        return Array.from(spellsByLine.values())
                   .map(spell => {
                     // Check if spell should have "None" quality
                     const shouldBeNone = classData.noquality?.includes(spell.name) || false;
                     const quality = shouldBeNone ? noneQuality : defaultQuality;
                     return { ...spell, quality };
                   })
                   .sort((a, b) => parseInt(a.level) - parseInt(b.level));
      })
    );
  }

  // Get all characters from localStorage
  getCharacters(): Character[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((char: any) => ({
        ...char,
        createdAt: new Date(char.createdAt),
        updatedAt: new Date(char.updatedAt)
      }));
    }
    return [];
  }

  // Save a character (create or update)
  saveCharacter(character: Character): void {
    const characters = this.getCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);
    
    character.updatedAt = new Date();
    
    if (existingIndex >= 0) {
      characters[existingIndex] = character;
    } else {
      character.createdAt = new Date();
      characters.push(character);
    }
    
    this.saveCharacters(characters);
  }

  // Update character spells based on their class and level
  updateCharacterSpells(characterId: string): Observable<Character | null> {
    const character = this.getCharacter(characterId);
    if (!character) {
      return of(null);
    }

    return this.getCharacterSpells(character.class, character.level).pipe(
      map(spells => {
        // Preserve existing spell qualities if they exist
        const existingQualities = new Map<string, SpellQuality>();
        character.spells.forEach(existingSpell => {
          existingQualities.set(existingSpell.name, existingSpell.quality);
        });

        // Update spells while preserving qualities
        character.spells = spells.map(spell => ({
          ...spell,
          quality: existingQualities.get(spell.name) || spell.quality
        }));

        this.saveCharacter(character);
        return character;
      })
    );
  }

  // Update spell quality for a specific spell of a character
  updateSpellQuality(characterId: string, spellName: string, quality: SpellQuality): void {
    const character = this.getCharacter(characterId);
    if (!character) return;

    // Find existing spell in character's spells
    const spellIndex = character.spells.findIndex(s => s.name === spellName);
    if (spellIndex >= 0) {
      character.spells[spellIndex].quality = quality;
    } else {
      // If spell doesn't exist in character's spells, we need to find it from the class spells
      this.loadClassSpells(character.class).subscribe(classData => {
        const spell = classData.spells.find(s => s.name === spellName);
        if (spell) {
          // Add the spell to character's spells with the selected quality
          character.spells.push({ ...spell, quality });
          this.saveCharacter(character);
        }
      });
      return; // Exit early since we're handling this asynchronously
    }
    
    this.saveCharacter(character);
  }

  // Apply noquality settings to an existing character
  applyNoQualitySettings(characterId: string): Observable<Character> {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    return this.loadClassSpells(character.class).pipe(
      map(classData => {
        if (classData.noquality && classData.noquality.length > 0) {
          const noneQuality = this.getSpellQualities().find(q => q.name === 'none')!;
          
          // Update existing spells that should have "None" quality
          character.spells.forEach(spell => {
            if (classData.noquality!.includes(spell.name)) {
              spell.quality = noneQuality;
            }
          });

          // Save the updated character
          this.saveCharacter(character);
        }
        
        return character;
      })
    );
  }

  // Delete a character
  deleteCharacter(characterId: string): void {
    const characters = this.getCharacters().filter(c => c.id !== characterId);
    this.saveCharacters(characters);
  }

  // Get a specific character by ID
  getCharacter(characterId: string): Character | undefined {
    return this.getCharacters().find(c => c.id === characterId);
  }

  // Private method to save characters to localStorage
  private saveCharacters(characters: Character[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
  }

  // Generate a unique ID
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get spell quality for a character, creating entry if it doesn't exist
  getSpellQualityForCharacter(characterId: string, spellName: string): SpellQuality {
    const character = this.getCharacter(characterId);
    if (!character) return this.getDefaultSpellQuality();

    const characterSpell = character.spells.find(s => s.name === spellName);
    return characterSpell ? characterSpell.quality : this.getDefaultSpellQuality();
  }

  // Clear all data (for testing/reset purposes)
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
