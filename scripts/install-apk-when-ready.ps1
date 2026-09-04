Write-Host "Checking for connected Android devices via ADB..."
for ($i = 0; $i -lt 15; $i++) {
    $out = & adb devices | Out-String
    Write-Host ("Attempt " + $i + ": " + $out)
    if ($out -match "\b([0-9a-zA-Z]+)\s+device\b") {
        $devId = $matches[1]
        Write-Host "Found device: $devId! Installing Zee Prep.apk..."
        & adb -s $devId install -r ".\Zee Prep.apk"
        Write-Host "Launching ZeePrep MainActivity..."
        & adb -s $devId shell am start -n com.skillizee.zeeprep/.MainActivity
        exit 0
    } elseif ($out -match "\bunauthorized\b") {
        Write-Host "Device detected but unauthorized. Please tap 'Allow USB Debugging' on your phone screen!"
    }
    Start-Sleep -Seconds 2
}
Write-Host "No active ADB device detected after timeout."
exit 1
