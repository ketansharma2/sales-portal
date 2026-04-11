$content = Get-Content 'D:\sales host\src\app\admin\morning-report\page.js' -Raw
$newContent = $content -replace '\{row\.tracker_sent_by_tl \|\| 0\}', '<td className="p-2.5 border-r border-gray-200 text-center font-black text-indigo-700 bg-indigo-50/20 align-middle">
                                                                    {row.tracker_sent_by_tl || 0}
                                                                </td>'
Set-Content -Path 'D:\sales host\src\app\admin\morning-report\page.js' -Value $newContent
