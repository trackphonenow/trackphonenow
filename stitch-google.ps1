Add-Type -AssemblyName System.Drawing

$tiles = @(
    @{ x=5240; y=12667; px=0; py=0 },
    @{ x=5241; y=12667; px=256; py=0 },
    @{ x=5242; y=12667; px=512; py=0 },
    @{ x=5240; y=12668; px=0; py=256 },
    @{ x=5241; y=12668; px=256; py=256 },
    @{ x=5242; y=12668; px=512; py=256 },
    @{ x=5240; y=12669; px=0; py=512 },
    @{ x=5241; y=12669; px=256; py=512 },
    @{ x=5242; y=12669; px=512; py=512 }
)

$bmp = New-Object System.Drawing.Bitmap(768, 768)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

foreach ($t in $tiles) {
    $url = "https://mt1.google.com/vt/lyrs=m&x=$($t.x)&y=$($t.y)&z=15"
    $tmpFile = "public/gtile-$($t.x)-$($t.y).png"
    Write-Output "Fetching Google tile $($t.x), $($t.y)..."
    curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o $tmpFile $url
    $tileImg = [System.Drawing.Bitmap]::FromFile((Resolve-Path $tmpFile).Path)
    $g.DrawImage($tileImg, $t.px, $t.py, 256, 256)
    $tileImg.Dispose()
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
}

$g.Dispose()
$outPath = "c:\Users\Anime\Desktop\location-tool.com\public\google-map-real.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Successfully saved Google Map to $outPath!"
