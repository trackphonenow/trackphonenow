Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Anime\Desktop\location-tool.com\public\google-maps-phone-tracker.jpeg"
$dstPath = "C:\Users\Anime\Desktop\location-tool.com\public\phone-tracker-cutout.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

$dst = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# The background is a blue gradient from ~RGB(45, 120, 240) to ~RGB(20, 70, 180) with a faint Eyezy watermark on left.
# The phone, hand, google maps logo, and Thomas card have very distinct colors (hand is skin tones, phone bezel is dark, maps is white/yellow/red, thomas card has white text).
# Let's inspect or do threshold based flood/color detection, or detect the blue background.

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        $r = [int]$pixel.R
        $g = [int]$pixel.G
        $b = [int]$pixel.B

        # Blue background characteristic: B is high, B > R + 40, G is medium, and it's mostly blue/cyan.
        # But we must NOT cut:
        # - The blue dot on the phone (center of map)
        # - The Google Maps icon blue part
        # - The Thomas A card (which is bluish glass!)
        # - The hand (skin tones: R is high, G medium, B low)
        # - The phone screen (maps: white, light gray, yellow roads, orange roads, red pin)
        
        $dst.SetPixel($x, $y, $pixel)
    }
}

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Done"
