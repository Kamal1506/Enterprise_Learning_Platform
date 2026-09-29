[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [ValidateSet("all", "skill", "learning", "cert", "career", "assistant", "frontend", "menu")]
    [string]$Target = "menu",

    [Parameter()]
    [switch]$NewWindow,

    [Parameter()]
    [string]$DbPassword = "kamal1717",

    [Parameter()]
    [string]$DbUrl = "jdbc:postgresql://localhost:5432/skillsphere_nexus",

    [Parameter()]
    [string]$DbUsername = "postgres",

    [Parameter()]
    [string]$JwtSecret = "9a6747f5e5b74c2e8b2b7b5c6e8f0a2d3c4b5a6d7e8f901234567890abcdef12",

    [Parameter()]
    [string]$SkillServiceUrl = "http://localhost:8081/api/v1",

    [Parameter()]
    [string]$GroqApiKey = "gsk_placeholder_value"
)

# Load variables from .env file if it exists
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        
        switch ($name) {
            "SPRING_DATASOURCE_PASSWORD" { $DbPassword = $value }
            "SPRING_DATASOURCE_URL"      { $DbUrl = $value }
            "SPRING_DATASOURCE_USERNAME" { $DbUsername = $value }
            "JWT_SECRET"                 { $JwtSecret = $value }
            "SKILL_SERVICE_URL"          { $SkillServiceUrl = $value }
            "GROQ_API_KEY"               { $GroqApiKey = $value }
        }
    }
}

$Services = @{
    "skill" = @{
        Name = "Skill Service"
        Path = "services\skill-service"
        Command = ".\mvnw.cmd spring-boot:run"
    }
    "learning" = @{
        Name = "Learning Service"
        Path = "services\learning-service"
        Command = ".\mvnw.cmd spring-boot:run"
    }
    "cert" = @{
        Name = "Certification Service"
        Path = "services\certification-service"
        Command = ".\mvnw.cmd spring-boot:run"
    }
    "career" = @{
        Name = "Career Service"
        Path = "services\career-service"
        Command = ".\mvnw.cmd spring-boot:run"
    }
    "assistant" = @{
        Name = "AI Assistant Service"
        Path = "services\assistant-service"
        Command = ".\mvnw.cmd spring-boot:run"
    }
    "frontend" = @{
        Name = "Skillsphere Frontend"
        Path = "frontend\skillsphere-app"
        Command = "npm start"
    }
}

function Start-ServiceProcess {
    param (
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [switch]$InNewWindow
    )

    $resolvedPath = Join-Path $PSScriptRoot $Path
    if (-not (Test-Path $resolvedPath)) {
        Write-Error "Directory not found: $resolvedPath"
        return
    }

    if ($InNewWindow) {
        Write-Host "Starting $Name in a new PowerShell window..." -ForegroundColor Cyan
        
        # We construct the command script for the new PowerShell window
        $commandText = @"
`[System.Console`]::Title = '$Name'
`$env:JWT_SECRET = '$JwtSecret'
`$env:SPRING_DATASOURCE_URL = '$DbUrl'
`$env:SPRING_DATASOURCE_USERNAME = '$DbUsername'
`$env:SPRING_DATASOURCE_PASSWORD = '$DbPassword'
`$env:SKILL_SERVICE_URL = '$SkillServiceUrl'
`$env:GROQ_API_KEY = '$GroqApiKey'
Set-Location '$resolvedPath'
Write-Host '==================================================' -ForegroundColor Green
Write-Host ' Starting $Name' -ForegroundColor Green
Write-Host ' Port and environment initialized successfully.' -ForegroundColor Green
Write-Host '==================================================' -ForegroundColor Green
$Command
Read-Host 'Press Enter to close this window...'
"@
        
        $bytes = [System.Text.Encoding]::Unicode.GetBytes($commandText)
        $encodedText = [Convert]::ToBase64String($bytes)
        Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $encodedText
    } else {
        Write-Host "Starting $Name in current window..." -ForegroundColor Cyan
        # Set environment variables in the local session
        $env:JWT_SECRET = $JwtSecret
        $env:SPRING_DATASOURCE_URL = $DbUrl
        $env:SPRING_DATASOURCE_USERNAME = $DbUsername
        $env:SPRING_DATASOURCE_PASSWORD = $DbPassword
        $env:SKILL_SERVICE_URL = $SkillServiceUrl
        $env:GROQ_API_KEY = $GroqApiKey
        
        Set-Location $resolvedPath
        Invoke-Expression $Command
    }
}

if ($Target -eq "menu") {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Magenta
    Write-Host "      Skillsphere Nexus - Development Environment Runner  " -ForegroundColor Magenta
    Write-Host "==========================================================" -ForegroundColor Magenta
    Write-Host " [0] Run All Services + Frontend (In separate windows) [Default]"
    Write-Host " [1] Skill Service          (Port 8081)"
    Write-Host " [2] Learning Service       (Port 8082)"
    Write-Host " [3] Certification Service  (Port 8083)"
    Write-Host " [4] Career Service         (Port 8084)"
    Write-Host " [5] AI Assistant Service   (Port 8085)"
    Write-Host " [6] Frontend App           (Port 4200)"
    Write-Host " [q] Quit"
    Write-Host "==========================================================" -ForegroundColor Magenta
    $choice = Read-Host "Select an option (0-6 or q)"
    if ($choice -eq "" -or $choice -eq "0") {
        $Target = "all"
    } elseif ($choice -eq "1") {
        $Target = "skill"
    } elseif ($choice -eq "2") {
        $Target = "learning"
    } elseif ($choice -eq "3") {
        $Target = "cert"
    } elseif ($choice -eq "4") {
        $Target = "career"
    } elseif ($choice -eq "5") {
        $Target = "assistant"
    } elseif ($choice -eq "6") {
        $Target = "frontend"
    } else {
        Write-Host "Exiting."
        exit
    }
}

if ($Target -eq "all") {
    Write-Host "Starting all 5 services and the frontend in separate windows..." -ForegroundColor Green
    
    # Skill Service (Start first and sleep for database migrations to execute)
    Start-ServiceProcess -Name "Skill Service (8081)" -Path "services\skill-service" -Command ".\mvnw.cmd spring-boot:run" -InNewWindow
    Start-Sleep -Seconds 4
    
    # Run the remaining backend microservices
    Start-ServiceProcess -Name "Learning Service (8082)" -Path "services\learning-service" -Command ".\mvnw.cmd spring-boot:run" -InNewWindow
    Start-ServiceProcess -Name "Certification Service (8083)" -Path "services\certification-service" -Command ".\mvnw.cmd spring-boot:run" -InNewWindow
    Start-ServiceProcess -Name "Career Service (8084)" -Path "services\career-service" -Command ".\mvnw.cmd spring-boot:run" -InNewWindow
    Start-ServiceProcess -Name "AI Assistant Service (8085)" -Path "services\assistant-service" -Command ".\mvnw.cmd spring-boot:run" -InNewWindow
    
    # Start the Angular frontend application
    Start-ServiceProcess -Name "Skillsphere Frontend (4200)" -Path "frontend\skillsphere-app" -Command "npm start" -InNewWindow
} else {
    $service = $Services[$Target]
    if ($null -ne $service) {
        $inNewWindow = $NewWindow.IsPresent
        Start-ServiceProcess -Name $service.Name -Path $($service.Path) -Command $service.Command -InNewWindow $inNewWindow
    } else {
        Write-Error "Unknown target: $Target"
    }
}
