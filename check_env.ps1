$files = Get-ChildItem "D:\LOOP_COMPANY\LOOP\.env*"
foreach ($f in $files) {
    Write-Host "=== $($f.FullName) ==="
    $content = Get-Content $f.FullName -Raw
    if ($content -match "DATABASE_URL\s*=") {
        $match = [regex]::Match($content, 'DATABASE_URL\s*=\s*(.+)')
        if ($match.Success) {
            $val = $match.Groups[1].Value.Trim()
            Write-Host "DATABASE_URL=$val"
        }
    }
}
