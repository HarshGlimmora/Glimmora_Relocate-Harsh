# Convert DOCUMENTATION.md -> DOCUMENTATION.docx using Microsoft Word COM automation.
# Word writes its own .docx, so the result is guaranteed to open in Word.

param(
    [string]$Src = "$PSScriptRoot\DOCUMENTATION.md",
    [string]$Dst = "$PSScriptRoot\DOCUMENTATION.docx"
)

$ErrorActionPreference = 'Stop'

Write-Host "Reading $Src"
$lines = Get-Content -Path $Src -Encoding UTF8

Write-Host "Starting Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0  # wdAlertsNone

# Constants
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4
$wdStyleHeading4 = -5
$wdStyleListBullet = -6
$wdStyleListNumber = -7
$wdAlignCenter = 1
$wdSaveFormatDocx = 16

try {
    $doc = $word.Documents.Add()
    $sel = $word.Selection

    # Title
    $sel.Font.Size = 22
    $sel.Font.Bold = $true
    $sel.ParagraphFormat.Alignment = $wdAlignCenter
    $sel.TypeText("Glimmora Relocate - Technical Documentation")
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0
    $sel.Font.Bold = $false
    $sel.Font.Size = 11
    $sel.TypeParagraph()

    function Add-InlineText {
        param([string]$text)
        $i = 0
        while ($i -lt $text.Length) {
            $m_bold = [regex]::Match($text.Substring($i), '\*\*([^*]+)\*\*')
            $m_code = [regex]::Match($text.Substring($i), '`([^`]+)`')
            $m_link = [regex]::Match($text.Substring($i), '\[([^\]]+)\]\(([^)]+)\)')
            $candidates = @()
            if ($m_bold.Success) { $candidates += @{m=$m_bold; type='bold'} }
            if ($m_code.Success) { $candidates += @{m=$m_code; type='code'} }
            if ($m_link.Success) { $candidates += @{m=$m_link; type='link'} }
            if ($candidates.Count -eq 0) {
                $sel.TypeText($text.Substring($i))
                return
            }
            $first = $candidates | Sort-Object { $_.m.Index } | Select-Object -First 1
            if ($first.m.Index -gt 0) {
                $sel.TypeText($text.Substring($i, $first.m.Index))
            }
            switch ($first.type) {
                'bold' {
                    $sel.Font.Bold = $true
                    $sel.TypeText($first.m.Groups[1].Value)
                    $sel.Font.Bold = $false
                }
                'code' {
                    $oldName = $sel.Font.Name
                    $sel.Font.Name = 'Consolas'
                    $sel.Font.Size = 10
                    $sel.TypeText($first.m.Groups[1].Value)
                    $sel.Font.Name = $oldName
                    $sel.Font.Size = 11
                }
                'link' {
                    $sel.Font.Color = 0x794E1F  # BGR for #1F4E79
                    $sel.Font.Underline = 1
                    $sel.TypeText($first.m.Groups[1].Value)
                    $sel.Font.Underline = 0
                    $sel.Font.Color = 0
                }
            }
            $i += $first.m.Index + $first.m.Length
        }
    }

    $i = 0
    $total = $lines.Count
    while ($i -lt $total) {
        $line = $lines[$i]
        if ($null -eq $line) { $i++; continue }

        # Skip the H1 we already rendered as title
        if ($line.StartsWith('# Glimmora Relocate')) { $i++; continue }

        # Fenced code block
        if ($line.StartsWith('```')) {
            $i++
            $codeLines = @()
            while ($i -lt $total -and -not $lines[$i].StartsWith('```')) {
                $codeLines += $lines[$i]
                $i++
            }
            $i++  # skip closing fence
            $sel.Font.Name = 'Consolas'
            $sel.Font.Size = 9
            $sel.ParagraphFormat.LeftIndent = 18
            foreach ($cl in $codeLines) {
                $sel.TypeText($cl)
                $sel.TypeParagraph()
            }
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.Font.Name = 'Calibri'
            $sel.Font.Size = 11
            continue
        }

        # Horizontal rule
        if ($line -eq '---' -or $line -eq '***') {
            $sel.TypeText(('-' * 40))
            $sel.TypeParagraph()
            $i++
            continue
        }

        # Table
        if ($line.StartsWith('|') -and $i + 1 -lt $total -and $lines[$i+1] -match '^\|[\s\-:|]+\|\s*$') {
            $header = ($line.Trim().TrimStart('|').TrimEnd('|') -split '\|') | ForEach-Object { $_.Trim() }
            $i += 2
            $rows = @()
            while ($i -lt $total -and $lines[$i].TrimStart().StartsWith('|')) {
                $row = ($lines[$i].Trim().TrimStart('|').TrimEnd('|') -split '\|') | ForEach-Object { $_.Trim() }
                $rows += ,$row
                $i++
            }
            $nCols = $header.Count
            $nRows = 1 + $rows.Count
            $range = $sel.Range
            $table = $doc.Tables.Add($range, $nRows, $nCols)
            $table.Borders.Enable = $true
            for ($c = 0; $c -lt $nCols; $c++) {
                $cell = $table.Cell(1, $c + 1)
                $cell.Range.Text = $header[$c]
                $cell.Range.Font.Bold = $true
            }
            for ($r = 0; $r -lt $rows.Count; $r++) {
                $row = $rows[$r]
                for ($c = 0; $c -lt [Math]::Min($nCols, $row.Count); $c++) {
                    $cell = $table.Cell($r + 2, $c + 1)
                    # Strip inline markdown for table cells (Word's table.Cell.Range.Text expects plain string)
                    $clean = $row[$c] -replace '\*\*([^*]+)\*\*', '$1' -replace '`([^`]+)`', '$1' -replace '\[([^\]]+)\]\(([^)]+)\)', '$1'
                    $cell.Range.Text = $clean
                }
            }
            $sel.EndKey(6) | Out-Null  # wdStory
            $sel.TypeParagraph()
            continue
        }

        # Headings
        if ($line.StartsWith('#### ')) {
            $sel.Style = $doc.Styles.Item('Heading 4')
            $sel.TypeText($line.Substring(5))
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }
        if ($line.StartsWith('### ')) {
            $sel.Style = $doc.Styles.Item('Heading 3')
            $sel.TypeText($line.Substring(4))
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }
        if ($line.StartsWith('## ')) {
            $sel.Style = $doc.Styles.Item('Heading 2')
            $sel.TypeText($line.Substring(3))
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }
        if ($line.StartsWith('# ')) {
            $sel.Style = $doc.Styles.Item('Heading 1')
            $sel.TypeText($line.Substring(2))
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }

        # Bullet list
        if ($line -match '^[\-\*]\s(.+)$') {
            $sel.Style = $doc.Styles.Item('List Bullet')
            Add-InlineText -text $matches[1]
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }

        # Numbered list
        if ($line -match '^\d+\.\s(.+)$') {
            $sel.Style = $doc.Styles.Item('List Number')
            Add-InlineText -text $matches[1]
            $sel.TypeParagraph()
            $sel.Style = $doc.Styles.Item('Normal')
            $i++; continue
        }

        # Blockquote
        if ($line.StartsWith('> ')) {
            $sel.Font.Italic = $true
            $sel.ParagraphFormat.LeftIndent = 18
            Add-InlineText -text $line.Substring(2)
            $sel.TypeParagraph()
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.Font.Italic = $false
            $i++; continue
        }

        # Blank line
        if ($line.Trim() -eq '') {
            $sel.TypeParagraph()
            $i++; continue
        }

        # Plain paragraph
        Add-InlineText -text $line
        $sel.TypeParagraph()
        $i++
    }

    Write-Host "Saving to $Dst"
    $doc.SaveAs([ref]$Dst, [ref]$wdSaveFormatDocx)
    $doc.Close()
    Write-Host "Done."
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
