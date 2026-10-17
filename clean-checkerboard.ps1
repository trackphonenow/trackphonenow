Add-Type -AssemblyName System.Drawing

$srcFile = "C:\Users\Anime\Desktop\location-tool.com\public\user-phone-cutout.jpg"
$dstFile = "C:\Users\Anime\Desktop\location-tool.com\public\phone-isolated.png"

$src = [System.Drawing.Bitmap]::FromFile($srcFile)
$w = $src.Width
$h = $src.Height

Write-Host "Image dimensions: $w x $h"

# Sample corner pixels to see checkerboard values
$c1 = $src.GetPixel(5, 5)
$c2 = $src.GetPixel(25, 5)
Write-Host "Corner samples: ($($c1.R),$($c1.G),$($c1.B)) and ($($c2.R),$($c2.G),$($c2.B))"

$dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Flood-fill or mask all outer checkerboard pixels:
# The checkerboard consists of two neutral grey/white tones:
# near (125-135, 125-135, 125-135) and (190-205, 190-205, 190-205) or pure grey where |R-G| <= 6 and |G-B| <= 6
# Let's do a connected BFS from the borders (0,0), (w-1,0), (0, h-1), (w-1, h-1)

$visited = New-Object 'bool[,]' $w, $h
$queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

# Enqueue border pixels
for ($x = 0; $x -lt $w; $x++) {
    $queue.Enqueue((New-Object System.Drawing.Point($x, 0)))
    $visited[$x, 0] = $true
    $queue.Enqueue((New-Object System.Drawing.Point($x, $h - 1)))
    $visited[$x, $h - 1] = $true
}
for ($y = 0; $y -lt $h; $y++) {
    $queue.Enqueue((New-Object System.Drawing.Point(0, $y)))
    $visited[0, $y] = $true
    $queue.Enqueue((New-Object System.Drawing.Point($w - 1, $y)))
    $visited[$w - 1, $y] = $true
}

function IsCheckerboard($pixel) {
    $r = [int]$pixel.R
    $g = [int]$pixel.G
    $b = [int]$pixel.B

    # Gray check: R, G, B are very close to each other
    $rg = [Math]::Abs($r - $g)
    $gb = [Math]::Abs($g - $b)
    $rb = [Math]::Abs($r - $b)

    if ($rg -le 10 -and $gb -le 10 -and $rb -le 10) {
        # Check standard checkerboard shades (usually ~120-140 or ~190-210)
        if (($r -ge 100 -and $r -le 155) -or ($r -ge 175 -and $r -le 225)) {
            return $true
        }
    }
    return $false
}

$isBackground = New-Object 'bool[,]' $w, $h

while ($queue.Count -gt 0) {
    $pt = $queue.Dequeue()
    $px = $pt.X
    $py = $pt.Y
    $pixel = $src.GetPixel($px, $py)

    if (IsCheckerboard $pixel) {
        $isBackground[$px, $py] = $true

        # Check 4 neighbors
        $neighbors = @(
            (New-Object System.Drawing.Point($px + 1, $py)),
            (New-Object System.Drawing.Point($px - 1, $py)),
            (New-Object System.Drawing.Point($px, $py + 1)),
            (New-Object System.Drawing.Point($px, $py - 1))
        )

        foreach ($n in $neighbors) {
            if ($n.X -ge 0 -and $n.X -lt $w -and $n.Y -ge 0 -and $n.Y -lt $h) {
                if (-not $visited[$n.X, $n.Y]) {
                    $visited[$n.X, $n.Y] = $true
                    $queue.Enqueue($n)
                }
            }
        }
    }
}

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        if ($isBackground[$x, $y]) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $dst.SetPixel($x, $y, $src.GetPixel($x, $y))
        }
    }
}

$dst.Save($dstFile, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host "Successfully generated transparent PNG: $dstFile"
