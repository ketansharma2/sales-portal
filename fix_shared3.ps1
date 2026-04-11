$lines = Get-Content 'D:\sales host\src\app\admin\morning-report\page.js'
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*-$' -and $i -gt 0 -and $lines[$i-1] -match 'text-indigo-600 bg-indigo-50/30 align-middle') {
        $lines[$i] = "                                                                    {row.tracker_shared_to_client || 0}"
    }
}
Set-Content -Path 'D:\sales host\src\app\admin\morning-report\page.js' -Value $lines
