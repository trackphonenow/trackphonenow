$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$cryptoOut = "C:\Users\Anime\Desktop\location-tool.com\public\crypto-modal-screen.png"
$billingOut = "C:\Users\Anime\Desktop\location-tool.com\public\dashboard-crypto-screen.png"

# 1. Capture Crypto Checkout Modal on landing page
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,1100", "--screenshot=$cryptoOut", "http://localhost:3000/?crypto=1" -Wait

# 2. Capture Dashboard Billing Tab with Crypto Wallets
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,1100", "--screenshot=$billingOut", "http://localhost:3000/dashboard.html?tab=billing" -Wait

Write-Output "Captured both screenshots successfully!"
