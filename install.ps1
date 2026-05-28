$extName = "work-countdown"
$extDir = "$env:USERPROFILE\.vscode\extensions\$extName"
$sourceDir = "C:\laragon\www\ExtentionsVscode\builtin"

Write-Host "Installing Work Countdown extension..." -ForegroundColor Cyan

if (Test-Path $extDir) {
    Write-Host "Removing existing extension..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $extDir
}

Copy-Item -Recurse -Path $sourceDir -Destination $extDir

Write-Host "Extension installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Restart VS Code to activate the extension." -ForegroundColor Cyan
Write-Host "After restart, click the clock icon in the status bar (bottom-right) to set your start time." -ForegroundColor Cyan