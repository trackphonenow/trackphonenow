Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\user-phone-cutout.jpg")
$w = $src.Width
$h = $src.Height

$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Simple threshold for checkerboard pixels:
# The checkerboard in this image is made of gray squares:
# Squares are neutral gray where |R-G| <= 8 and |G-B| <= 8 and |R-B| <= 8.
# And their brightness is between 105 and 215.
# On the phone screen, the map has yellow/orange roads (strong color difference), red pin (R > G+50), green parks (G > R+20), blue dot (B > R+40), blue Thomas card (B > R+40), blue phone rim (B > R+20).
# The only part of the phone that is gray is the phone notch/top speaker (x: 400-600, y: 50-100) and some road text.
# If we only remove neutral gray pixels that are OUTSIDE the phone and cards:
# Phone bounding box: x between 365 and 635, y between 60 and 940
# Thomas card bounding box: x between 180 and 445, y between 490 and 745
# Google maps icon bounding box: x between 560 and 705, y between 35 and 280

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        $r = [int]$p.R
        $g = [int]$p.G
        $b = [int]$p.B

        $diff = [Math]::Max([Math]::Abs($r - $g), [Math]::Max([Math]::Abs($g - $b), [Math]::Abs($r - $b)))
        
        # Check if inside any protected foreground area
        $inPhone = ($x -ge 368 -and $x -le 632 -and $y -ge 62 -and $y -le 944)
        $inCard = ($x -ge 184 -and $x -le 444 -and $y -ge 492 -and $y -le 748)
        $inGmaps = ($x -ge 565 -and $x -le 703 -and $y -ge 34 -and $y -le 280)

        if (-not ($inPhone -or $inCard -or $inGmaps)) {
            # Outside foreground: pure transparency
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Inside bounding boxes: check if it's the corner background outside rounded corners
            # If it's near neutral gray AND has low saturation outside the actual screen
            if ($diff -le 12 -and (($r -ge 105 -and $r -le 145) -or ($r -ge 185 -and $r -le 215))) {
                # Could be checkerboard bleed
                # Let's check if it's outside the phone frame curved corners
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $dst.SetPixel($x, $y, $p)
            }
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-clean-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Created clean transparent phone mockup"
