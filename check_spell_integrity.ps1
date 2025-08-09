# Script to check spell line integrity across all class JSON files
$jsonFiles = Get-ChildItem "public\assets\*.json"
$issuesFound = @()

foreach ($file in $jsonFiles) {
    Write-Host "`n=== Checking $($file.Name) ===" -ForegroundColor Cyan
    
    try {
        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
        $spells = $content.spells
        
        # Check for spells with '(unknown)' in the name
        $unknownSpells = $spells | Where-Object { $_.name -match '\(unknown\)' }
        if ($unknownSpells) {
            foreach ($unk in $unknownSpells) {
                Write-Host "  UNKNOWN SPELL: '$($unk.name)' in line '$($unk.line)' at level $($unk.level)" -ForegroundColor Yellow
                $issuesFound += [PSCustomObject]@{
                    File = $file.Name
                    Issue = "Unknown Spell Name"
                    SpellLine = $unk.line
                    SpellName = $unk.name
                    Levels = $unk.level
                }
            }
        }

        # Group spells by spell line
        $spellLines = $spells | Group-Object -Property line

        foreach ($line in $spellLines) {
            if ($line.Count -gt 1) {
                $lineName = $line.Name
                $spellsInLine = $line.Group | Sort-Object {[int]$_.level}
                
                # Check for duplicate spell names in the same line
                $spellNames = $spellsInLine | Group-Object -Property name
                $duplicates = $spellNames | Where-Object {$_.Count -gt 1}
                
                if ($duplicates) {
                    foreach ($dup in $duplicates) {
                        Write-Host "  DUPLICATE SPELL NAME: '$($dup.Name)' appears $($dup.Count) times in line '$lineName'" -ForegroundColor Red
                        $levels = ($dup.Group | ForEach-Object {$_.level}) -join ", "
                        Write-Host "    Levels: $levels" -ForegroundColor Red
                        
                        $issuesFound += [PSCustomObject]@{
                            File = $file.Name
                            Issue = "Duplicate Spell Name"
                            SpellLine = $lineName
                            SpellName = $dup.Name
                            Levels = $levels
                        }
                    }
                }
                
                # Check for level progression gaps (might indicate missing spells)
                $levels = $spellsInLine | ForEach-Object {[int]$_.level}
                $minLevel = ($levels | Measure-Object -Minimum).Minimum
                $maxLevel = ($levels | Measure-Object -Maximum).Maximum
                
                # Look for significant gaps in level progression (>20 levels)
                for ($i = 0; $i -lt ($levels.Count - 1); $i++) {
                    $currentLevel = $levels[$i]
                    $nextLevel = $levels[$i + 1]
                    $gap = $nextLevel - $currentLevel
                    
                    if ($gap -gt 20) {
                        Write-Host "  LARGE LEVEL GAP: $gap levels between $currentLevel and $nextLevel in line '$lineName'" -ForegroundColor Yellow
                        $issuesFound += [PSCustomObject]@{
                            File = $file.Name
                            Issue = "Large Level Gap"
                            SpellLine = $lineName
                            SpellName = "Gap between levels $currentLevel and $nextLevel"
                            Levels = "$currentLevel -> $nextLevel (gap: $gap)"
                        }
                    }
                }
            }
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Total issues found: $($issuesFound.Count)" -ForegroundColor Magenta

if ($issuesFound.Count -gt 0) {
    $issuesFound | Format-Table -AutoSize
}
