Add-Type -AssemblyName System.Drawing

$cols = @(5240, 5241, 5242)
$rows = @(12666, 12667, 12668, 12669, 12670)

$width = $cols.Length * 256   # 768
$height = $rows.Length * 256  # 1280

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

for ($r = 0; $r -lt $rows.Length; $r++) {
    for ($c = 0; $c -lt $cols.Length; $c++) {
        $x = $cols[$c]
        $y = $rows[$r]
        $px = $c * 256
        $py = $r * 256
        $url = "https://mt1.google.com/vt/lyrs=m&x=$x&y=$y&z=15"
        $tmpFile = "public/gtile-$x-$y.png"
        Write-Output "Fetching Google tile x=$x, y=$y (row $r, col $c)..."
        curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o $tmpFile $url
        if (Test-Path $tmpFile) {
            $tileImg = [System.Drawing.Bitmap]::FromFile((Resolve-Path $tmpFile).Path)
            $g.DrawImage($tileImg, $px, $py, 256, 256)
            $tileImg.Dispose()
            Remove-Item $tmpFile -ErrorAction SilentlyContinue
        }
    }
}

$g.Dispose()
$outPath = "c:\Users\Anime\Desktop\location-tool.com\public\google-map-full.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Successfully generated full-bleed Google Map: $outPath ($width x $height)!"
