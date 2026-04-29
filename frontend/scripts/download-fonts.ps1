<#
.SYNOPSIS
  Download Inter + Noto Sans SC variable TTF files for offline deployment.
  Run this on a machine with internet access, then the fonts are ready for next/font/local.

.DESCRIPTION
  Downloads the full variable-font TTF files (covering all weights) from Google Fonts'
  GitHub repository and places them under public/fonts/.

  Files downloaded:
    - Inter-VariableFont.ttf     (Latin, variable weight 100–900)
    - NotoSansSC-Variable.ttf    (CJK, variable weight 400–900)
#>

$ErrorActionPreference = "Stop"
$PublicFonts = Join-Path $PSScriptRoot "..\public\fonts"
New-Item -ItemType Directory -Path $PublicFonts -Force | Out-Null

Write-Host "=== Downloading Inter (variable TTF) ===" -ForegroundColor Cyan
$interUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"
$interOut = Join-Path $PublicFonts "Inter-VariableFont.ttf"
try {
  Invoke-WebRequest -Uri $interUrl -OutFile $interOut -ErrorAction Stop
  Write-Host "  Downloaded Inter-VariableFont.ttf ($((Get-Item $interOut).Length / 1MB -as [int]) MB)" -ForegroundColor Green
} catch {
  Write-Host "  Google Fonts raw.githubusercontent failed: $_" -ForegroundColor Red
  Write-Host "  Falling back to rsms/inter release zip…" -ForegroundColor Yellow
  $zipUrl = "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip"
  $zipOut = Join-Path $PublicFonts "inter-tmp.zip"
  try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipOut -ErrorAction Stop
    Expand-Archive -Path $zipOut -DestinationPath (Join-Path $PublicFonts "inter-tmp") -Force
    $extracted = Get-ChildItem -Recurse (Join-Path $PublicFonts "inter-tmp") -Filter "Inter-VariableFont_slnt,wght.ttf" | Select-Object -First 1
    if ($extracted) {
      Copy-Item $extracted.FullName $interOut -Force
      Write-Host "  Extracted Inter-VariableFont.ttf from release zip" -ForegroundColor Green
    }
    Remove-Item $zipOut -Force
    Remove-Item (Join-Path $PublicFonts "inter-tmp") -Recurse -Force
  } catch {
    Write-Host "  All download methods exhausted. Please manually download Inter from https://github.com/rsms/inter/releases" -ForegroundColor Red
  }
}

Write-Host "=== Downloading Noto Sans SC (variable TTF) ===" -ForegroundColor Cyan
$notoUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
$notoOut = Join-Path $PublicFonts "NotoSansSC-Variable.ttf"
try {
  Invoke-WebRequest -Uri $notoUrl -OutFile $notoOut -ErrorAction Stop
  Write-Host "  Downloaded NotoSansSC-Variable.ttf ($((Get-Item $notoOut).Length / 1MB -as [int]) MB)" -ForegroundColor Green
} catch {
  Write-Host "  Download failed: $_" -ForegroundColor Red
  Write-Host "  Please manually download Noto Sans SC from https://fonts.google.com/noto/specimen/Noto+Sans+SC" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download complete." -ForegroundColor Green
Write-Host "Files saved to: $PublicFonts" -ForegroundColor Green
Write-Host ""
Write-Host "app-fonts.ts is already configured to use next/font/local" -ForegroundColor Yellow
Write-Host "pointing to the variable TTF files in /fonts/ directory." -ForegroundColor Yellow
