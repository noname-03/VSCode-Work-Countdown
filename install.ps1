$extName = "work-countdown"
$extDir = "$env:USERPROFILE\.vscode\extensions\$extName"
$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Installing Work Countdown extension..." -ForegroundColor Cyan

if (Test-Path $extDir) {
    Write-Host "Removing existing extension..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $extDir
}

Copy-Item -Recurse -Path $sourceDir -Destination $extDir -Exclude @('.git', 'install.ps1', 'README.md', '.vscodeignore', '*.vsix')

Write-Host "Extension installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Restart VS Code or run 'Developer: Reload Window' to activate." -ForegroundColor Cyan
Write-Host "Click the watch icon in the Activity Bar or status bar clock to get started." -ForegroundColor Cyan