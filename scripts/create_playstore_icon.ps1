Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\images\icon.png"
$destPath = Join-Path $PSScriptRoot "..\playstore-icon-512x512.png"
$destPathAssets = Join-Path $PSScriptRoot "..\assets\images\playstore-icon-512x512.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$dest = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, 512, 512)

$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save($destPathAssets, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$dest.Dispose()
$src.Dispose()

Write-Output "Successfully created 512x512 icon at: $destPath"
