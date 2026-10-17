Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\phone-no-hand-perfect.png")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# The phone body is strictly between X: 379 and 646.
# The Google Maps icon is at X: 582 to 705, Y: 35 to 160.
# The Thomas card is at X: 188 to 444, Y: 285 to 434.
# Everything outside these 3 exact shapes is fake background and should be 100% transparent:
# 1. Right side of phone below maps icon: X > 646
# 2. Left side of phone above Thomas card: X < 379 and Y < 285
# 3. Left side of phone below Thomas card: X < 379 and Y > 434
# 4. Top above phone and maps icon: Y < 35
# 5. Bottom below phone: Y > 550

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)

        $isRightOutside = ($x -gt 646 -and $y -gt 160)
        $isTopRightOutside = ($x -gt 705)
        $isTopOutside = ($y -lt 34)
        $isBottomOutside = ($y -gt 550)
        $isLeftTopOutside = ($x -lt 379 -and $y -lt 285)
        $isLeftBottomOutside = ($x -lt 379 -and $y -gt 434)
        $isFarLeft = ($x -lt 188)

        if ($isRightOutside -or $isTopRightOutside -or $isTopOutside -or $isBottomOutside -or $isLeftTopOutside -or $isLeftBottomOutside -or $isFarLeft) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-handless-ultimate.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Ultimate clean cutout without hand finished!"
