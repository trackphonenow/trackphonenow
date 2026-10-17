Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\phone-isolated-final.png")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# The phone right edge is at x: 629
# Everything with x > 628 and y > 270 is outside phone and maps icon!
# Everything with x < 373 and y > 745 is outside phone and Thomas card!

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        
        $outsideRight = ($x -gt 628 -and $y -gt 270)
        $outsideBottomLeft = ($x -lt 372 -and $y -gt 745)

        if ($outsideRight -or $outsideBottomLeft) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-transparent-master.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Master clean cutout complete!"
