Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\user-phone-cutout.jpg")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background checkerboard is neutral gray with near zero chroma:
# Max(|R-G|, |G-B|, |R-B|) <= 12
# And brightness is not black (R > 80)
# Inside the phone, we have:
# - Blue phone metallic bezel (B is noticeably higher than R and G by > 12)
# - Screen map (yellow roads, red pin, green parks, black road lines, white roads)
# - White roads have high brightness (> 230)
# - Gray roads in the map have specific location inside screen: x from 375 to 625, y from 115 to 925
# - Thomas A card: blue gradient with B > 140 and B > R + 30
# - Google Maps icon: colorful (red, yellow, green, blue) on white pill (R>240, G>240, B>240)

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        $r = [int]$p.R
        $g = [int]$p.G
        $b = [int]$p.B

        # Bounding box of phone screen
        $inPhoneScreen = ($x -ge 385 -and $x -le 618 -and $y -ge 120 -and $y -le 920)
        # Bounding box of Thomas card content
        $inThomasCard = ($x -ge 184 -and $x -le 444 -and $y -ge 492 -and $y -le 746)
        # Bounding box of Google Maps pill icon
        $inGmapsIcon = ($x -ge 566 -and $x -le 702 -and $y -ge 36 -and $y -le 280)

        if ($inPhoneScreen -or $inThomasCard -or $inGmapsIcon) {
            # Definitely keep
            $dst.SetPixel($x, $y, $p)
        } else {
            # Outside screen/cards: check if it's the phone bezel or checkerboard
            $diff = [Math]::Max([Math]::Abs($r - $g), [Math]::Max([Math]::Abs($g - $b), [Math]::Abs($r - $b)))
            
            # Checkerboard has very low diff (<= 14) and brightness between 90 and 225
            $isCheckerboard = ($diff -le 14) -and ($r -ge 90) -and ($r -le 230)

            if ($isCheckerboard) {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $dst.SetPixel($x, $y, $p)
            }
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-no-hand-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Phone without hand cleanly saved!"
