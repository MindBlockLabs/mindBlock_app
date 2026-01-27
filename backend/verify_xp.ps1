$baseUrl = "http://localhost:3000"

Write-Host "1. Creating User..." -ForegroundColor Cyan
$userBody = @{
    email = "tester_$(Get-Random)@example.com"
    password = "Password123!"
    fullname = "XP Tester"
    userRole = "user"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Method Post -Uri "$baseUrl/users" -Body $userBody -ContentType "application/json"
    $userId = $user.id
    Write-Host "   User Created: $userId" -ForegroundColor Green
} catch {
    Write-Host "   Failed to create user. Ensure server is running." -ForegroundColor Red
    Write-Error $_
    exit
}

Write-Host "`n2. Finding Category..." -ForegroundColor Cyan
try {
    $categories = Invoke-RestMethod -Method Get -Uri "$baseUrl/categories"
    # Inspect structure - if pagination, data might be in .data
    if ($categories.data -and $categories.data.Count -gt 0) {
         $categoryId = $categories.data[0].id
    } elseif ($categories.Count -gt 0 -and $categories[0].id) {
         $categoryId = $categories[0].id
    } else {
         Write-Host "   No categories found. Cannot create puzzle." -ForegroundColor Red
         exit
    }
    Write-Host "   Using Category: $categoryId" -ForegroundColor Green
} catch {
    Write-Host "   Failed to fetch categories. Server error?" -ForegroundColor Red
    Write-Error $_
    exit
}

Write-Host "`n3. Creating Test Puzzle (Points: 600)..." -ForegroundColor Cyan
$puzzleBody = @{
    title = "Test Puzzle $(Get-Random)"
    description = "Test Description"
    content = "What is 2+2?"
    correctAnswer = "4"
    options = @("1", "2", "3", "4")
    points = 600
    timeLimit = 60
    categoryId = $categoryId
    difficulty = "easy"
    type = "logical"
} | ConvertTo-Json

try {
    $puzzle = Invoke-RestMethod -Method Post -Uri "$baseUrl/puzzles" -Body $puzzleBody -ContentType "application/json"
    $puzzleId = $puzzle.id
    Write-Host "   Puzzle Created: $puzzleId" -ForegroundColor Green
} catch {
    Write-Host "   Failed to create puzzle." -ForegroundColor Red
    Write-Error $_
    exit
}

Write-Host "`n4. Checking Initial XP..." -ForegroundColor Cyan
$xp = Invoke-RestMethod -Method Get -Uri "$baseUrl/users/$userId/xp-level"
Write-Host "   Level: $($xp.level) | XP: $($xp.xp)" -ForegroundColor Gray

Write-Host "`n5. Submitting Correct Answer..." -ForegroundColor Cyan
$submitBody = @{
    userId = $userId
    puzzleId = $puzzleId
    categoryId = $categoryId
    userAnswer = "4"
    timeSpent = 10
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Method Post -Uri "$baseUrl/progress/submit" -Body $submitBody -ContentType "application/json"
    Write-Host "   Answer Correct. Points: $($result.validation.pointsEarned)" -ForegroundColor Green
} catch {
    Write-Host "   Failed to submit answer." -ForegroundColor Red
    Write-Error $_
    exit
}

Write-Host "`n6. Verifying NEW XP and Level..." -ForegroundColor Cyan
$xpNew = Invoke-RestMethod -Method Get -Uri "$baseUrl/users/$userId/xp-level"
Write-Host "   Level: $($xpNew.level) | XP: $($xpNew.xp)" -ForegroundColor Green
if ($xpNew.level -gt $xp.level) {
    Write-Host "`n   SUCCESS: User Leveled Up!" -ForegroundColor Magenta
} else {
    Write-Host "`n   User did not level up." -ForegroundColor Yellow
}
