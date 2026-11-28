$targetZip = "..\honey-website-client.zip"
if (Test-Path $targetZip) {
    Remove-Item -Force $targetZip
}

$excludeItems = @(
    'node_modules',
    '.next',
    '.git',
    'test-results',
    'full-code.txt',
    'folder-structure.txt',
    'tsconfig.tsbuildinfo'
)

$items = Get-ChildItem -Force | Where-Object { $excludeItems -notcontains $_.Name }

Write-Host "Creating zip package..."
Compress-Archive -Path $items.FullName -DestinationPath $targetZip -CompressionLevel Optimal
Write-Host "Zip created successfully."
Get-Item $targetZip | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | Format-Table -AutoSize
