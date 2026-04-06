# Step 2: Initialize cron job
Write-Host "=== STEP 2: Initializing Cron Job ===" -ForegroundColor Cyan
$headers = @{Authorization = "Bearer my-todo-reminder-secret-key"}
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/init-cron" -Method POST -Headers $headers -UseBasicParsing
    Write-Host "✓ Cron Job Initialized:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Error:" $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== STEP 5: Manually Trigger Reminders ===" -ForegroundColor Cyan
# Step 5: Manually trigger reminder send
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/reminders" -Headers $headers -UseBasicParsing
    Write-Host "✓ Reminders Triggered:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Error:" $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== IMPORTANT REMINDERS ===" -ForegroundColor Yellow
Write-Host "⚠️  Step 3: You must manually log in with Google at http://localhost:3001"
Write-Host "⚠️  Step 4: You must create a test todo with due date within 6 hours"
Write-Host "⚠️  Step 6: Check the server logs in the 'npm run dev' terminal for details"
