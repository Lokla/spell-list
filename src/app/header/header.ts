
import { Component, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() spellDatabaseClicked = new EventEmitter<void>();
  @Output() characterClicked = new EventEmitter<void>();
}
