import sys
import requests
from bs4 import BeautifulSoup
import json
import os

def parse_spell_table(url, output_path=None):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the first table in the page
    table = soup.find('table')
    if not table:
        print('No table found on the page.')
        sys.exit(1)

    spells = []
    for row in table.find_all('tr')[1:]:  # skip header
        cells = row.find_all(['td', 'th'])
        if len(cells) < 3:
            continue
        line_name = cells[0].get_text(strip=True)
        spell_names = [n.strip() for n in cells[1].get_text().split(',') if n.strip()]
        spell_levels = [l.strip() for l in cells[2].get_text().split(',') if l.strip()]
        if len(spell_names) != len(spell_levels):
            print(f"Error: Spell line '{line_name}' has {len(spell_names)} names but {len(spell_levels)} levels.")
            for i in range(max(len(spell_names), len(spell_levels))):
                name = spell_names[i] if i < len(spell_names) else '(missing)'
                level = spell_levels[i] if i < len(spell_levels) else '(missing)'
                # Replace 'No change' with line name
                if name.strip().lower() == 'no change':
                    name = line_name
                spells.append({
                    'name': f"{name} (unknown)",
                    'line': line_name,
                    'level': level
                })
            continue
        for name, level in zip(spell_names, spell_levels):
            # Replace 'No change' with line name
            if name.strip().lower() == 'no change':
                name = line_name
            spells.append({
                'name': name,
                'line': line_name,
                'level': level
            })

    # Extract class name from above the table
    class_name = None
    for tag in table.find_all_previous(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong', 'p']):
        text = tag.get_text(strip=True)
        if text and len(text) < 50 and 'Spell' not in text and 'Level' not in text and 'Name' not in text:
            class_name = text
            break
    if not class_name:
        class_name = url.split('/')[-1].split('.')[0].lower()

    # Sort spells by level (as int if possible)
    def level_key(spell):
        try:
            return int(spell['level'])
        except Exception:
            return 9999
    spells_sorted = sorted(spells, key=level_key)

    data = {
        'class': class_name,
        'spells': spells_sorted
    }
    if not output_path:
        output_path = os.path.join('public', 'assets', f"{class_name}.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"Wrote {len(spells_sorted)} spells to {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python create_spell_json.py <url> [output_path]')
        sys.exit(1)
    url = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    parse_spell_table(url, output_path)
