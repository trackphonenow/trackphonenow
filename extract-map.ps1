Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("c:\Users\Anime\Desktop\location-tool.com\public\google-maps-phone-tracker.jpeg")

# Phone is in center. Let us find the phone borders:
# Left edge of phone screen: roughly 480
# Top edge: roughly 80
# Right edge: roughly 745
# Bottom edge: roughly 630
Write-Output "Image size: $($img.Width)x$($img.Height)"

$rect = New-Object System.Drawing.Rectangle(480, 80, 265, 548)
$screen = New-Object System.Drawing.Bitmap(265, 548)
$g = [System.Drawing.Graphics]::FromImage($screen)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$img.Dispose()

$screen.Save("c:\Users\Anime\Desktop\location-tool.com\public\real-google-map-screen.png", [System.Drawing.Imaging.ImageFormat]::Png)
$screen.Dispose()
Write-Output "Successfully saved real-google-map-screen.png!"
