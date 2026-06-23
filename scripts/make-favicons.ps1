# Generate PNG favicons, multi-size favicon.ico, and branded OG share image to match the SVG logo.
Add-Type -AssemblyName System.Drawing
$root = "C:\Users\USER\Claude Projects\Ozzys Trees Website"
$imgDir = Join-Path $root "assets\img"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

# Brand colours
$gTop = [System.Drawing.ColorTranslator]::FromHtml("#6E9A77")
$gBot = [System.Drawing.ColorTranslator]::FromHtml("#2C5740")
$cream = [System.Drawing.ColorTranslator]::FromHtml("#F6F3EA")

# Canopy circles in 0-100 space: cx,cy,r
$circles = @(
  @(50,34,22),@(34,31,13),@(66,31,13),@(50,22,14),@(28.5,43,11),@(71.5,43,11),@(50,45,17.5)
)
# Trunk polygon in 0-100 space
$trunk = @(@(46,58),@(45,69),@(43,78),@(40.5,85),@(59.5,85),@(57,78),@(55,69),@(54,58))

function New-RoundedPath($x,$y,$w,$h,$r){
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  if ($r -le 0) { $p.AddRectangle((New-Object System.Drawing.RectangleF($x,$y,$w,$h))); return $p }
  $d = $r*2
  $p.AddArc($x,$y,$d,$d,180,90)
  $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90)
  $p.AddArc($x,$y+$h-$d,$d,$d,90,90)
  $p.CloseFigure()
  return $p
}

function Draw-Mark($g,$size,$drawBadge){
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $s = $size/100.0
  if ($drawBadge){
    $rad = [int]($size*0.23)
    $path = New-RoundedPath 0 0 $size $size $rad
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)),(New-Object System.Drawing.Point(0,$size)),$gTop,$gBot)
    $g.FillPath($brush,$path); $brush.Dispose(); $path.Dispose()
  }
  $white = New-Object System.Drawing.SolidBrush($cream)
  # trunk
  $tp = $trunk | ForEach-Object { New-Object System.Drawing.PointF([single]($_[0]*$s),[single]($_[1]*$s)) }
  $g.FillPolygon($white,[System.Drawing.PointF[]]$tp)
  # canopy
  foreach($c in $circles){
    $cx=$c[0]*$s; $cy=$c[1]*$s; $r=$c[2]*$s
    $g.FillEllipse($white,[single]($cx-$r),[single]($cy-$r),[single]($r*2),[single]($r*2))
  }
  $white.Dispose()
}

function Make-Png($size,$file,$badge){
  $bmp = New-Object System.Drawing.Bitmap($size,$size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  Draw-Mark $g $size $badge
  $g.Dispose()
  $bmp.Save((Join-Path $imgDir $file),[System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("png {0} -> {1}" -f $size,$file)
}

Make-Png 512 "icon-512.png" $true
Make-Png 192 "icon-192.png" $true
Make-Png 180 "apple-touch-icon.png" $true
Make-Png 32  "favicon-32.png" $true
Make-Png 16  "favicon-16.png" $true
# maskable-ish (extra padding) for PWA
$bmp = New-Object System.Drawing.Bitmap(512,512,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$path = New-RoundedPath 0 0 512 512 0; $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)),(New-Object System.Drawing.Point(0,512)),$gTop,$gBot)
$g.FillPath($brush,$path); $brush.Dispose(); $path.Dispose()
# draw mark at 70% centered
$g.TranslateTransform(77,77); $g.ScaleTransform(3.58,3.58); Draw-Mark $g 100 $false
$g.Dispose(); $bmp.Save((Join-Path $imgDir "icon-maskable-512.png"),[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Output "png maskable -> icon-maskable-512.png"

# ---- favicon.ico (PNG-encoded entries: 16,32,48) ----
function Get-PngBytes($size){
  $bmp = New-Object System.Drawing.Bitmap($size,$size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::Transparent); Draw-Mark $g $size $true; $g.Dispose()
  $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  return ,([byte[]]$ms.ToArray())
}
$sizes = @(16,32,48)
$pngs = @{}; foreach($s in $sizes){ $pngs[$s] = [byte[]](Get-PngBytes $s) }
$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ico)
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)  # ICONDIR
$offset = 6 + (16*$sizes.Count)
foreach($s in $sizes){
  $data = $pngs[$s]
  $bw.Write([Byte]($(if($s -ge 256){0}else{$s})))   # width
  $bw.Write([Byte]($(if($s -ge 256){0}else{$s})))   # height
  $bw.Write([Byte]0); $bw.Write([Byte]0)            # colors, reserved
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)        # planes, bpp
  $bw.Write([UInt32]$data.Length)                    # size
  $bw.Write([UInt32]$offset)                          # offset
  $offset += $data.Length
}
foreach($s in $sizes){ $bw.Write([byte[]]$pngs[$s], 0, $pngs[$s].Length) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $root "favicon.ico"), $ico.ToArray())
$bw.Dispose(); $ico.Dispose()
Write-Output ("favicon.ico -> {0} bytes" -f (Get-Item (Join-Path $root 'favicon.ico')).Length)

# ---- OG share image 1200x630 ----
$ogW=1200; $ogH=630
$og = New-Object System.Drawing.Bitmap($ogW,$ogH,[System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($og)
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
# diagonal gradient bg
$rect = New-Object System.Drawing.Rectangle(0,0,$ogW,$ogH)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect,([System.Drawing.ColorTranslator]::FromHtml("#2C5740")),([System.Drawing.ColorTranslator]::FromHtml("#16301F")),35.0)
$g.FillRectangle($bg,$rect); $bg.Dispose()
# faint big tree mark on right
$g.TranslateTransform(720,90); $g.ScaleTransform(4.7,4.7)
$faint = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28,246,243,234))
$tp = $trunk | ForEach-Object { New-Object System.Drawing.PointF([single]$_[0],[single]$_[1]) }
$g.FillPolygon($faint,[System.Drawing.PointF[]]$tp)
foreach($c in $circles){ $g.FillEllipse($faint,[single]($c[0]-$c[2]),[single]($c[1]-$c[2]),[single]($c[2]*2),[single]($c[2]*2)) }
$faint.Dispose(); $g.ResetTransform()
# small solid mark top-left
$g.TranslateTransform(80,70); $g.ScaleTransform(0.92,0.92); Draw-Mark $g 100 $true; $g.ResetTransform()
# text
$creamBrush = New-Object System.Drawing.SolidBrush($cream)
$amber = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#E0A14B"))
$fBig = New-Object System.Drawing.Font("Bahnschrift",74,[System.Drawing.FontStyle]::Bold)
$fMid = New-Object System.Drawing.Font("Bahnschrift",40,[System.Drawing.FontStyle]::Bold)
$fSub = New-Object System.Drawing.Font("Segoe UI Semibold",27,[System.Drawing.FontStyle]::Regular)
$fSm  = New-Object System.Drawing.Font("Segoe UI",23,[System.Drawing.FontStyle]::Regular)
$g.DrawString("OZZY'S", $fBig, $creamBrush, 78, 210)
$g.DrawString("TREE & STUMP SERVICES", $fMid, $amber, 82, 320)
$g.DrawString("Brisbane Northside's tree & stump specialists", $fSub, $creamBrush, 82, 392)
$g.DrawString("Tree removal  |  Lopping & pruning  |  Stump grinding", $fSm, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,246,243,234))), 82, 452)
# bottom strip
$sep = "   " + [char]0x2022 + "   "
$g.DrawString(("Free quotes{0}7 days a week{0}Fully insured{0}0451 308 349" -f $sep), $fSub, $amber, 82, 528)
$g.Dispose()
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1); $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]88)
$og.Save((Join-Path $imgDir "og-image.jpg"),$jpegCodec,$ep); $og.Dispose()
Write-Output ("og-image.jpg -> {0} KB" -f [math]::Round((Get-Item (Join-Path $imgDir 'og-image.jpg')).Length/1KB))
Write-Output "DONE"
