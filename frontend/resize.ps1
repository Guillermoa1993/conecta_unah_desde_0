Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\DELL\Downloads\conecta_unah_desde_0-Grupo_1\conecta_unah_desde_0-Grupo_1\frontend\public\puma_unah.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function Resize-Image($width, $height, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $width, $height)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Resize-Image 192 192 "C:\Users\DELL\Downloads\conecta_unah_desde_0-Grupo_1\conecta_unah_desde_0-Grupo_1\frontend\public\icon-192.png"
Resize-Image 512 512 "C:\Users\DELL\Downloads\conecta_unah_desde_0-Grupo_1\conecta_unah_desde_0-Grupo_1\frontend\public\icon-512.png"
Resize-Image 180 180 "C:\Users\DELL\Downloads\conecta_unah_desde_0-Grupo_1\conecta_unah_desde_0-Grupo_1\frontend\public\apple-touch-icon.png"

$src.Dispose()
Write-Host "Images resized successfully!"
