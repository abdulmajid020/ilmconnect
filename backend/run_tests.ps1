# Zoq Backend Automated Test Suite Runner

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ZOQ / ILMCONNECT BACKEND TEST SUITE     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$packages = @(
    "internal/config",
    "internal/domain",
    "internal/middleware",
    "internal/handler"
)

$failed = 0
$passed = 0

foreach ($pkg in $packages) {
    Write-Host "`n--> Testing: $pkg" -ForegroundColor Yellow
    Push-Location $pkg
    go test -v .
    if ($LASTEXITCODE -eq 0) {
        $passed++
        Write-Host " [PASS] $pkg" -ForegroundColor Green
    } else {
        $failed++
        Write-Host " [FAIL] $pkg" -ForegroundColor Red
    }
    Pop-Location
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "  Passed: $passed / $($packages.Count)" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "  Failed: $failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ALL TESTS PASSED WITH ZERO ERRORS!" -ForegroundColor Green
    exit 0
}

