Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("c:\Users\Anime\Desktop\location-tool.com\public\google-maps-phone-tracker.jpeg")

for ($x = 740; $x -lt 800; $x += 5) {
    $c = $img.GetPixel($x, 580)
    Write-Output "x=$x : R=$($c.R) G=$($c.G) B=$($c.B)"
}
$img.Dispose()
