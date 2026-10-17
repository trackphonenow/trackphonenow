Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\phone-no-hand-clean.png")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# The remaining checkerboard is strictly in two rectangular areas:
# 1. Right side below Google Maps icon: x >= 632, y from 270 to 485
# 2. Bottom left corner: x <= 370, y >= 845

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        
        $inRightChecker = ($x -ge 631 -and $y -ge 272 -and $y -le 510)
        $inBottomLeftChecker = ($x -le 371 -and $y -ge 840)

        if ($inRightChecker -or $inBottomLeftChecker) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-isolated-final.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Perfect cutout created!"
