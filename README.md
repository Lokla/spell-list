# EverQuest 2 Spell Planner

A comprehensive Angular application for managing and planning EverQuest 2 spells across all classes. This tool helps players track spell progression, manage character builds, and organize spell quality upgrades.

## 🌐 Live Demo

Visit the live application: [https://lokla.github.io/spell-list/](https://lokla.github.io/spell-list/)

## ✨ Features

### 📋 Spell Management
- **Complete Spell Database** - All EQ2 classes with full spell progression
- **Spell Line Organization** - View spells grouped by upgrade paths
- **Replacement Information** - See when spells get replaced by higher tiers
- **Quick Copy** - Click any spell name to copy it to clipboard

### 👤 Character Management
- **Multiple Characters** - Create and manage multiple characters
- **Persistent Storage** - Character data saved in browser localStorage
- **Character Context** - View spells specific to character level and class
- **Import/Export** - Download characters as JSON files or import existing ones

### 🎯 Quality System
- **6-Tier Quality Levels** - None, Apprentice, Apprentice IV, Adept I, Expert, Master I, Grandmaster
- **Color Coding** - Visual quality indicators with distinct colors
- **Batch Copy** - Export all "None" quality spells for shopping lists
- **Auto-Assignment** - NoQuality arrays automatically set appropriate spell qualities

### 🔧 Advanced Filtering
- **Level Filtering** - Hide spells above level 70 or character level
- **Quality Filtering** - Hide/show spells by quality tier
- **Outlevelled Detection** - Identify spells the character has outgrown
- **Toggle Interface** - Collapsible filter controls for clean UI

### 📱 Modern Interface
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Polished transitions and interactions
- **Clean Layout** - Intuitive navigation and organization
- **Accessibility** - Keyboard navigation and screen reader support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lokla/spell-list.git
   cd spell-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Building for Production

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── character-management/    # Character CRUD operations
│   ├── spell-list/             # Main spell viewing interface
│   ├── spell-quality-dialog/   # Quality selection modal
│   ├── services/               # Data and dialog services
│   └── ...
├── assets/                     # Static assets
└── public/assets/              # JSON spell data files
```

## 📊 Data Files

Spell data is organized in JSON files located in `public/assets/`:
- One file per class (e.g., `illusionist.json`, `wizard.json`)
- Contains spells, spell lines, and noquality arrays
- Automatically loaded based on class selection

## 🔄 GitHub Actions

The project includes automatic deployment to GitHub Pages:
- **Trigger**: Push to main branch
- **Build**: Angular production build with proper base href
- **Deploy**: Automatic deployment to GitHub Pages
- **URL**: https://lokla.github.io/spell-list/

## 🛠️ Technologies Used

- **Angular 20+** - Modern TypeScript framework
- **Standalone Components** - New Angular architecture
- **CSS Grid/Flexbox** - Responsive layout system
- **LocalStorage API** - Client-side data persistence
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Static site hosting

## 📖 Usage Guide

### Creating Characters
1. Navigate to Character Management
2. Click "Create New Character"
3. Fill in name, class, and level
4. Character spells auto-populate with appropriate qualities

### Managing Spell Qualities
1. Select a character from the dropdown
2. Click any quality button to change spell tier
3. Use filters to hide/show specific qualities
4. Export "None" quality spells for shopping

### Importing/Exporting Characters
1. **Export**: Click the 📤 icon on any character card
2. **Import**: Click "Import Character" and select a JSON file
3. **Apply NoQuality**: Click 🔄 to apply default qualities to existing characters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎮 EverQuest 2

This tool is designed for players of EverQuest 2, an MMORPG by Daybreak Game Company. All spell data and class information belongs to their respective owners.

## 🐛 Issues & Support

If you encounter any issues or have suggestions:
1. Check existing [GitHub Issues](https://github.com/Lokla/spell-list/issues)
2. Create a new issue with detailed description
3. Include browser and OS information for bug reports
