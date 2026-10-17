Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Anime\Desktop\location-tool.com\public\hero-hand-mockup.png"
$dstPath = "C:\Users\Anime\Desktop\location-tool.com\public\hero-hand-clean.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

$dst = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background color in the original image corners is around RGB(238, 242, 250) and top-right circle is RGB(202, 206, 255)
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        $r = [int]$pixel.R
        $g = [int]$pixel.G
        $b = [int]$pixel.B
        $a = [int]$pixel.A
        
        # Check if this pixel is the light-blueish background:
        # 1. Very light grayish/blue: R > 225, G > 230, B > 240
        $isLightBg = ($r -gt 220) -and ($g -gt 225) -and ($b -gt 235) -and ([Math]::Abs($r - $g) -lt 15)
        # 2. Top-right purple/violet circle: R around 190-215, G around 195-220, B around 240-255
        $isVioletCircle = ($r -gt 180) -and ($r -lt 220) -and ($g -gt 185) -and ($g -lt 225) -and ($b -gt 240)
        # 3. Corner check
        $isCorner = ($x -lt 80 -and $y -lt 80) -or ($x -gt ($width - 80) -and $y -lt 80)
        
        if ($isLightBg -or $isVioletCircle) {
            # Transparent
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $pixel)
        }
    }
}

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Successfully created clean mockup"
