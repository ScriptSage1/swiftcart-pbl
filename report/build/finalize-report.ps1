# Opens the generated report in Word, fills in the page numbers of the table of contents
# (as single pages or ranges such as 7-13), saves it and exports a PDF.
param(
  [Parameter(Mandatory = $true)][string]$Docx,
  [Parameter(Mandatory = $true)][string]$Pdf
)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx, $false, $false)
  $doc.Repaginate()
  $doc.Fields.Update() | Out-Null

  # The contents table is the one whose first cell reads "S.No.".
  $toc = $null
  foreach ($t in $doc.Tables) {
    if (($t.Cell(1, 1).Range.Text -replace '[\r\a]', '').Trim() -eq 'S.No.') { $toc = $t; break }
  }
  if ($null -eq $toc) { throw 'table of contents not found' }

  # Each entry ends on the page before the next entry starts (or on its own start page if two share a page).
  $rows = $toc.Rows.Count
  $starts = @()
  for ($r = 2; $r -le $rows; $r++) { $starts += [int](($toc.Cell($r, 3).Range.Text -replace '[^\d]', '')) }
  $last = [int]$doc.Content.Information(1)   # wdActiveEndAdjustedPageNumber: last page number of the body
  $toc.Range.Fields.Unlink()
  for ($i = 0; $i -lt $starts.Count; $i++) {
    $start = $starts[$i]
    if ($i -lt $starts.Count - 1) { $end = [Math]::Max($start, $starts[$i + 1] - 1) } else { $end = [Math]::Max($start, $last) }
    $text = if ($end -gt $start) { "$start-$end" } else { "$start" }
    $toc.Cell($i + 2, 3).Range.Text = $text
  }

  $doc.Save()
  $doc.ExportAsFixedFormat($Pdf, 17)
  Write-Output ("pages: " + $doc.ComputeStatistics(2))
  Write-Output ("contents: " + (($starts | ForEach-Object { $_ }) -join ', ') + " | last body page: $last")
  $doc.Close($false)
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
