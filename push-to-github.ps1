# Run from repo root: .\push-to-github.ps1
$ghDir = "C:\Program Files\GitHub CLI"
$gh = Join-Path $ghDir "gh.exe"

if (-not (Test-Path $gh)) {
  Write-Host "GitHub CLI not found. Install with:"
  Write-Host "  winget install GitHub.cli"
  exit 1
}

$env:Path = "$ghDir;$env:Path"

Set-Location $PSScriptRoot

& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Sign in to GitHub (browser will open)..."
  & $gh auth login -h github.com -p https -w
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$repoName = "shoe-dev"
Write-Host "Creating github.com/$repoName and pushing main..."
& $gh repo create $repoName --public --source=. --remote=origin --push
if ($LASTEXITCODE -ne 0) {
  Write-Host "If the name is taken, edit `$repoName in this script and run again."
  exit $LASTEXITCODE
}

Write-Host "Done."
