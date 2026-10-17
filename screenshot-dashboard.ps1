$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$authOut = "C:\Users\Anime\Desktop\location-tool.com\public\auth-screen.png"
$dashOut = "C:\Users\Anime\Desktop\location-tool.com\public\dashboard-screen.png"

# Capture auth page
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,1000", "--screenshot=$authOut", "http://localhost:3000/auth.html" -Wait

# For dashboard, we need token in localStorage or pass token in URL so checkAuth passes
# Let's see if we can open dashboard with demoId
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,900", "--screenshot=$dashOut", "http://localhost:3000/dashboard.html" -Wait

Write-Output "Captured screenshots."
