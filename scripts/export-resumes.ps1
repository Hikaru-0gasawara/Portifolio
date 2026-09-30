$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskInput = Join-Path $taskRoot '.cache/resumes'
$taskOutput = Join-Path $taskRoot 'public/resume'
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskWord = New-Object -ComObject Word.Application
$taskWord.Visible = $false
$taskWord.DisplayAlerts = 0
try {
    foreach ($language in @('pt', 'en', 'ja')) {
        $source = Join-Path $taskInput "hikaru-$language.docx"
        $destination = Join-Path $taskOutput "hikaru-$language.pdf"
        $document = $taskWord.Documents.Open($source, $false, $true)
        try {
            $document.ExportAsFixedFormat($destination, 17)
            Write-Output "Exported hikaru-$language.pdf"
        } finally { $document.Close(0) }
    }
} finally {
    $taskWord.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($taskWord) | Out-Null
}
