$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Capture dashboard billing section
$dashOut = "C:\Users\Anime\Desktop\location-tool.com\public\dashboard-crypto-screen.png"
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,1100", "--screenshot=$dashOut", "http://localhost:3000/dashboard.html" -Wait

Write-Output "Screenshot script completed."
