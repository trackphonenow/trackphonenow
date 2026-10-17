$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out = "C:\Users\Anime\Desktop\location-tool.com\public\homepage-screen.png"
$url = "http://localhost:3000/"

Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,4200", "--screenshot=$out", $url -Wait
if (Test-Path $out) {
    Write-Output "SUCCESS: Generated $out ($( (Get-Item $out).Length ) bytes)"
} else {
    Write-Output "NOT FOUND: Trying Chrome..."
    $chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,4200", "--screenshot=$out", $url -Wait
    if (Test-Path $out) {
        Write-Output "CHROME SUCCESS: Generated $out ($( (Get-Item $out).Length ) bytes)"
    } else {
        Write-Output "CHROME FAILED"
    }
}
