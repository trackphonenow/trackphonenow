Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\Anime\Desktop\location-tool.com\public\phone-handless-ultimate.png")
$w = $src.Width
$h = $src.Height
$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# The phone boundary:
# Left phone frame: x is 382
# Right phone frame: x is 640
# Maps icon is at top-right (x: 580 to 705, y: 35 to 160)
# Thomas card is at bottom-left (x: 188 to 445, y: 285 to 435)

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)

        # Remove the tiny checkerboard fringe on top edge of phone
        $topChecker = ($y -lt 40 -and ($x -lt 580 -or $x -gt 705))
        # Remove fringe below bottom edge of phone
        $bottomChecker = ($y -gt 548)
        # Remove fringe on right of phone (below maps icon)
        $rightChecker = ($x -gt 640 -and $y -gt 155)
        # Remove fringe on left of phone (above and below Thomas card)
        $leftCheckerTop = ($x -lt 382 -and $y -lt 285)
        $leftCheckerBottom = ($x -lt 382 -and $y -gt 435)
        $leftOuter = ($x -lt 188)

        if ($topChecker -or $bottomChecker -or $rightChecker -or $leftCheckerTop -or $leftCheckerBottom -or $leftOuter) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save("C:\Users\Anime\Desktop\location-tool.com\public\phone-clean-final.png", [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Pixel-perfect transparent PNG ready!"
