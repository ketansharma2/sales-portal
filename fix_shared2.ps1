$content = Get-Content 'D:\sales host\src\app\admin\morning-report\page.js' -Raw
$newContent = $content -replace '\? -', '? {row.tracker_shared_to_client || 0}'
Set-Content -Path 'D:\sales host\src\app\admin\morning-report\page.js' -Value $newContent
