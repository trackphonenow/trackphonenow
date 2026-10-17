Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\user-phone-cutout.jpg")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

Write-Host "Width: $w, Height: $h"

# In this 1024x580 image:
# Phone top: ~36 to ~550
# Phone center X: ~512 (left edge: ~380, right edge: ~645)
# Google Maps icon: x from ~580 to ~720, y from ~20 to ~165
# Thomas A card: x from ~188 to ~455, y from ~285 to ~435

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        $r = [int]$p.R
        $g = [int]$p.G
        $b = [int]$p.B

        # Bounding boxes for 1024 x 580:
        # Phone: x between 380 and 648, y between 35 and 550
        $inPhone = ($x -ge 378 -and $x -le 650 -and $y -ge 35 -and $y -le 555)
        # Thomas A card: x between 188 and 455, y between 282 and 436
        $inCard = ($x -ge 188 -and $x -le 455 -and $y -ge 282 -and $y -le 436)
        # Google Maps icon: x between 580 and 722, y between 20 and 165
        $inIcon = ($x -ge 580 -and $x -le 722 -and $y -ge 20 -and $y -le 165)

        if ($inPhone -or $inCard -or $inIcon) {
            # Check if this pixel is inside the bounding box but is part of the checkerboard (corners of cards/phone)
            $diff = [Math]::Max([Math]::Abs($r - $g), [Math]::Max([Math]::Abs($g - $b), [Math]::Abs($r - $b)))
            # If outside screen area and is neutral gray, make transparent
            $inScreen = ($x -ge 394 -and $x -le 635 -and $y -ge 72 -and $y -le 535)
            
            if (-not $inScreen) {
                # Could be checkerboard outside rounded corners
                if ($diff -le 14 -and (($r -ge 105 -and $r -le 155) -or ($r -ge 185 -and $r -le 225))) {
                    $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } else {
                    $dst.SetPixel($x, $y, $p)
                }
            } else {
                $dst.SetPixel($x, $y, $p)
            }
        } else {
            # Outside all foreground elements: 100% transparent
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-no-hand-perfect.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Perfect 1024x580 cutout created!"
