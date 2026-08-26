$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ArchiveDir = Join-Path $Root "dnd music archive"
$UploadsDir = Join-Path $Root "uploads"
$SoundsDir = Join-Path $UploadsDir "sounds"
$UploadsFile = Join-Path $Root "data\uploads.json"
$CategoriesFile = Join-Path $Root "data\sound-categories.json"
$AudioExtensions = @(".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac")

Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force -Path $SoundsDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $UploadsFile) | Out-Null

function Read-JsonArray($Path) {
    if (-not (Test-Path $Path)) { return @() }
    $Raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if (-not $Raw.Trim()) { return @() }
    $Value = $Raw | ConvertFrom-Json
    if ($null -eq $Value) { return @() }
    if ($Value -is [array]) { return @($Value) }
    return @($Value)
}

function Write-JsonArray($Path, $Value) {
    $Json = @($Value) | ConvertTo-Json -Depth 20
    Set-Content -LiteralPath $Path -Value $Json -Encoding UTF8
}

function Get-Base64UrlId($Text) {
    $Bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-Slug($Text) {
    $Slug = $Text.ToLowerInvariant() -replace "[^\w\s-]+", "" -replace "\s+", "-" -replace "-+", "-"
    $Slug = $Slug.Trim("-")
    if (-not $Slug) { $Slug = "soundpad" }
    return $Slug
}

function Get-SafeName($Text) {
    $Safe = $Text -replace "[^\w\s.-]+", "" -replace "\s+", "-" -replace "-+", "-"
    $Safe = $Safe.Trim(".-")
    if (-not $Safe) { $Safe = "sound" }
    if ($Safe.Length -gt 120) { $Safe = $Safe.Substring(0, 120).Trim(".-") }
    return $Safe
}

function Get-CategoryName($ArchiveName) {
    return ([IO.Path]::GetFileNameWithoutExtension($ArchiveName) `
        -replace "\s+SoundPad\s+Patreon\s+Version$", "" `
        -replace "\s+SoundPad\s+Patreon$", "" `
        -replace "\s+SoundPad$", "").Trim()
}

function Get-CategoryImage($Name) {
    switch -Regex ($Name) {
        "Age of Sail|Bleakwater Docks" { return "ocean.webp" }
        "Alien Starship|Starship|Future City" { return "city.webp" }
        "Combat" { return "battle.webp" }
        "Cthulhu|House on the Hill|Weirder Things" { return "dark.webp" }
        "Dark Forest|Jungle Planet" { return "nature.jpg" }
        "Dungeon" { return "dungeon.webp" }
        "Ice Planet" { return "snow-footsteps.webp" }
        "Vampire" { return "uploads/images/1787617919542-f6586f62-462373_SWPeZ1fdhS_coteries_of_new_york_shadows_of.jpg" }
        "Vikings" { return "battle.webp" }
        "Wasteland" { return "journey.webp" }
        default { return "situations.jpg" }
    }
}

function Get-TrackTitle($EntryName, $CategoryName) {
    $Base = [IO.Path]::GetFileNameWithoutExtension($EntryName)
    $Prefixes = @(
        ($CategoryName -replace "\s+", "_"),
        ($CategoryName -replace "\s+", "-"),
        $CategoryName,
        "Combat_Future",
        "Future_City",
        "Dark_Forest",
        "Ice_Planet",
        "Jungle_Planet",
        "Alien_Starship",
        "Age_of_Sail",
        "House_on_the_Hill",
        "Bleakwater_Docks",
        "Weirder_Things"
    )
    foreach ($Prefix in $Prefixes) {
        $Escaped = [regex]::Escape($Prefix)
        $Base = $Base -replace "^$Escaped\s*[-_]\s*", ""
        $Base = $Base -replace "^$Escaped\s+-\s+", ""
    }
    $Base = $Base -replace "[-_]+", " " -replace "\s+", " "
    $Base = $Base.Trim()
    if (-not $Base) { $Base = [IO.Path]::GetFileNameWithoutExtension($EntryName) }
    return (Get-Culture).TextInfo.ToTitleCase($Base.ToLowerInvariant())
}

$Uploads = [System.Collections.ArrayList]::new()
@((Read-JsonArray $UploadsFile)) | ForEach-Object { [void]$Uploads.Add($_) }
$Categories = [System.Collections.ArrayList]::new()
@((Read-JsonArray $CategoriesFile)) | ForEach-Object { [void]$Categories.Add($_) }

$ExistingUploadIds = @{}
foreach ($Upload in $Uploads) { if ($Upload.id) { $ExistingUploadIds[$Upload.id] = $true } }
$ExistingCategoryIds = @{}
foreach ($Category in $Categories) { if ($Category.id) { $ExistingCategoryIds[$Category.id] = $true } }

$ImportedFiles = 0
$SkippedFiles = 0
$CreatedCategories = 0

Get-ChildItem -LiteralPath $ArchiveDir -File -Filter "*SoundPad*.zip" | Sort-Object Name | ForEach-Object {
    $Archive = $_
    $CategoryName = Get-CategoryName $Archive.Name
    $CategoryId = "soundpad-$(Get-Slug $CategoryName)"
    $CategoryImage = Get-CategoryImage $CategoryName

    if (-not $ExistingCategoryIds.ContainsKey($CategoryId)) {
        [void]$Categories.Add([ordered]@{
            id = $CategoryId
            name = $CategoryName
            image = $CategoryImage
            createdAt = (Get-Date).ToUniversalTime().ToString("o")
            source = "soundpad-import"
        })
        $ExistingCategoryIds[$CategoryId] = $true
        $CreatedCategories++
    }

    $Zip = [System.IO.Compression.ZipFile]::OpenRead($Archive.FullName)
    try {
        $Entries = $Zip.Entries | Where-Object {
            $Ext = [IO.Path]::GetExtension($_.Name).ToLowerInvariant()
            $_.Name -and $AudioExtensions -contains $Ext
        }

        foreach ($Entry in $Entries) {
            $Ext = [IO.Path]::GetExtension($Entry.Name).ToLowerInvariant()
            $RelativeSafe = Get-SafeName (($Entry.FullName -replace "[/\\]+", "-"))
            if (-not $RelativeSafe.EndsWith($Ext)) { $RelativeSafe = "$RelativeSafe$Ext" }
            $TargetName = "soundpad-$($CategoryId.Substring(9))-$RelativeSafe"
            if ($TargetName.Length -gt 170) {
                $Base = [IO.Path]::GetFileNameWithoutExtension($TargetName)
                $TargetName = "$($Base.Substring(0, [Math]::Min(160, $Base.Length)).Trim(".-"))$Ext"
            }

            $TargetPath = Join-Path $SoundsDir $TargetName
            $FileField = "sounds/$TargetName"
            $Id = Get-Base64UrlId "upload:$FileField"

            if ($ExistingUploadIds.ContainsKey($Id)) {
                $SkippedFiles++
                continue
            }

            if (-not (Test-Path -LiteralPath $TargetPath)) {
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($Entry, $TargetPath, $false)
            }

            $Bytes = (Get-Item -LiteralPath $TargetPath).Length
            [void]$Uploads.Add([ordered]@{
                id = $Id
                file = $FileField
                originalFileName = $Entry.FullName
                title = Get-TrackTitle $Entry.Name $CategoryName
                type = "sound"
                sectionId = $CategoryId
                sectionName = $CategoryName
                sectionIds = @($CategoryId)
                themeId = $null
                image = $CategoryImage
                bytes = $Bytes
                uploadedAt = (Get-Date).ToUniversalTime().ToString("o")
                source = "soundpad-import"
            })
            $ExistingUploadIds[$Id] = $true
            $ImportedFiles++
        }
    } finally {
        $Zip.Dispose()
    }
}

Write-JsonArray $CategoriesFile $Categories
Write-JsonArray $UploadsFile $Uploads

Write-Host "Created categories: $CreatedCategories"
Write-Host "Imported audio files: $ImportedFiles"
Write-Host "Skipped existing files: $SkippedFiles"
