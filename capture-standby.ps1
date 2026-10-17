$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out = "C:\Users\Anime\.gemini\antigravity\brain\5dfda555-aae2-4486-aa06-f1f7eda53eb4\dashboard-standby-terminal.png"
$url = "http://localhost:3000/dashboard.html"

Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,900", "--virtual-time-budget=4000", "--screenshot=$out", $url -Wait

if (Test-Path $out) {
    Write-Output "SUCCESS: Generated $out ($( (Get-Item $out).Length ) bytes)"
} else {
    Write-Output "FAILED"
}
