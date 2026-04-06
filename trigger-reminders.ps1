$headers = @{Authorization = "Bearer my-todo-reminder-secret-key"}
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/reminders" -Headers $headers -UseBasicParsing
    Write-Host "Response Status: $($response.StatusCode)"
    Write-Host "Response Content:"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
