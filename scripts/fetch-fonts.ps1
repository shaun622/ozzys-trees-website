# Download self-hosted woff2 fonts (latin subset) from Google Fonts CDN and emit @font-face CSS.
$root = "C:\Users\USER\Claude Projects\Ozzys Trees Website"
$fontDir = Join-Path $root "assets\fonts"
New-Item -ItemType Directory -Force -Path $fontDir | Out-Null
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

$families = @(
  @{ slug='bricolage'; family='Bricolage Grotesque'; url='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap' },
  @{ slug='hanken';    family='Hanken Grotesk';     url='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap' }
)

$css = @()
foreach ($fam in $families) {
  $resp = Invoke-WebRequest -Uri $fam.url -UserAgent $ua -UseBasicParsing
  $text = $resp.Content
  # Split into @font-face blocks
  $blocks = [regex]::Matches($text, '@font-face\s*\{[^}]*\}')
  $i = 0
  foreach ($b in $blocks) {
    $blk = $b.Value
    $weight = ([regex]::Match($blk, 'font-weight:\s*(\d+)')).Groups[1].Value
    $urange = ([regex]::Match($blk, 'unicode-range:\s*([^;]+);')).Groups[1].Value
    $woff2  = ([regex]::Match($blk, 'src:\s*url\(([^)]+\.woff2)\)')).Groups[1].Value
    if (-not $woff2) { continue }
    # latin subset only (contains U+0000)
    if ($urange -notmatch 'U\+0000') { continue }
    $fname = "{0}-{1}.woff2" -f $fam.slug, $weight
    $out = Join-Path $fontDir $fname
    Invoke-WebRequest -Uri $woff2 -UserAgent $ua -UseBasicParsing -OutFile $out
    $kb = [math]::Round((Get-Item $out).Length/1KB)
    Write-Output ("{0}  w{1}  {2} KB" -f $fam.family, $weight, $kb)
    $css += "@font-face{font-family:'$($fam.family)';font-style:normal;font-weight:$weight;font-display:swap;src:url('../fonts/$fname') format('woff2');unicode-range:$urange;}"
    $i++
  }
}
$css -join "`n" | Out-File -Encoding ascii (Join-Path $fontDir "fontface.css")
Write-Output "---"
Write-Output ("Wrote {0} @font-face rules to assets\fonts\fontface.css" -f $css.Count)
Get-ChildItem $fontDir -Filter *.woff2 | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB)}} | Format-Table -AutoSize
