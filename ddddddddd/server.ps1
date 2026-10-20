# Servidor HTTP en PowerShell nativo para Windows
$port = 3000
$publicDir = Join-Path $PSScriptRoot "public"

# Obtener IP local de la red Wi-Fi / LAN
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $localIp) { $localIp = "127.0.0.1" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Prefixes.Add("http://127.0.0.1:$port/") } catch {}

$started = $false
if ($localIp -ne "127.0.0.1") {
    try {
        $listener.Prefixes.Add("http://$localIp`:$port/")
        $listener.Start()
        $started = $true
    } catch {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$port/")
        try { $listener.Prefixes.Add("http://127.0.0.1:$port/") } catch {}
    }
}

if (-not $started) {
    try {
        $listener.Start()
        $started = $true
    } catch {
        Write-Host "Error al iniciar HttpListener: $_" -ForegroundColor Red
    }
}

if ($started) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host " INSTITUTO NACIONAL DR. SARBELIO NAVARRETE" -ForegroundColor Cyan
    Write-Host " Servidor Web Local: http://localhost:$port/" -ForegroundColor Yellow
    Write-Host " Servidor Web Wi-Fi: http://$localIp`:$port/" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Green

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "*")
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        if ($urlPath -eq "/api/system/info") {
            $jsonResponse = "{`"status`":`"success`",`"ip`":`"$localIp`",`"port`":$port,`"url`":`"http://$localIp`:$port`"}"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            try {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {}
            $response.Close()
            continue
        }

        if ($urlPath -eq "/api/google-sheets/proxy") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $jsonObj = $null
            try { $jsonObj = $body | ConvertFrom-Json } catch {}

            $scriptUrl = if ($jsonObj) { $jsonObj.script_url } else { "" }
            $payload = if ($jsonObj) { $jsonObj.payload } else { $null }

            $result = @{ status = "error"; message = "Faltan parámetros script_url o payload" }

            if ($scriptUrl -and $payload) {
                try {
                    $jsonPayload = $payload | ConvertTo-Json -Depth 6 -Compress
                    $remoteResp = Invoke-RestMethod -Uri $scriptUrl -Method Post -Body $jsonPayload -ContentType "application/json" -TimeoutSec 15
                    $result = @{ status = "success"; message = "Enviado a Google Sheets correctamente"; response = $remoteResp }
                } catch {
                    $result = @{ status = "error"; message = "Error de conexión con Google Apps Script: $($_.Exception.Message)" }
                }
            }

            $jsonResponse = $result | ConvertTo-Json -Depth 6
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "*")
            try {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {}
            $response.Close()
            continue
        }

        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $localPath = Join-Path $publicDir $urlPath.TrimStart('/')

        if (-not (Test-Path $localPath -PathType Leaf)) {
            $localPath = Join-Path $publicDir "index.html"
        }

        $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
        $contentType = "text/html; charset=utf-8"

        switch ($ext) {
            ".css"  { $contentType = "text/css; charset=utf-8" }
            ".js"   { $contentType = "application/javascript; charset=utf-8" }
            ".json" { $contentType = "application/json; charset=utf-8" }
            ".png"  { $contentType = "image/png" }
            ".jpg"  { $contentType = "image/jpeg" }
            ".jpeg" { $contentType = "image/jpeg" }
            ".svg"  { $contentType = "image/svg+xml" }
            ".ico"  { $contentType = "image/x-icon" }
        }

        try {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        } finally {
            $response.Close()
        }
    }
} catch {
    Write-Host "Error al iniciar el servidor listener: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) { $listener.Stop() }
}

