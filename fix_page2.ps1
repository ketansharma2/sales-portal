$content = Get-Content 'D:\sales host\src\app\admin\morning-report\page.js' -Raw
$newContent = $content -replace '(\{row\.tracker_sent_by_tl \|\| 0\}\r?\n                                                                </td>\r?\n                                                                </td>)', '{row.tracker_sent_by_tl || 0}
                                                                </td>'
Set-Content -Path 'D:\sales host\src\app\admin\morning-report\page.js' -Value $newContent
