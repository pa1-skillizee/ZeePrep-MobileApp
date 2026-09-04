Add-Type -AssemblyName System.Drawing

$outputDir = Join-Path $PSScriptRoot "..\playstore_assets"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

function Generate-FeatureGraphic {
    $width = 1024
    $height = 500
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # 1. Background Gradient (Deep Indigo / Slate Luxury Theme)
    $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(49, 46, 129)), 45.0
    $g.FillRectangle($brush, $rect)

    # 2. Glowing Accents
    $glowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(40, 99, 102, 241)), 60
    $g.DrawEllipse($glowPen, 700, -100, 450, 450)
    $g.DrawEllipse($glowPen, -100, 250, 350, 350)

    # 3. Logo & Brand Title
    $titleFont = New-Object System.Drawing.Font 'Arial', 42, [System.Drawing.FontStyle]::Bold
    $subFont = New-Object System.Drawing.Font 'Arial', 18, [System.Drawing.FontStyle]::Bold
    $tagFont = New-Object System.Drawing.Font 'Arial', 14, [System.Drawing.FontStyle]::Regular
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(251, 191, 36))
    $lightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(226, 232, 240))

    # App Icon Shield in Graphic
    $iconRect = New-Object System.Drawing.Rectangle 60, 60, 90, 90
    $iconBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 70, 229))
    $g.FillRectangle($iconBg, $iconRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(129, 140, 248)), 3), $iconRect)
    $zFont = New-Object System.Drawing.Font 'Arial', 46, [System.Drawing.FontStyle]::Bold
    $g.DrawString('Z', $zFont, $whiteBrush, 75, 70)

    $g.DrawString('ZeePrep', $titleFont, $whiteBrush, 170, 68)
    $g.DrawString('SMART CBT EXAMINATION & LMS PLATFORM', $tagFont, $goldBrush, 174, 126)

    # Value Proposition Headlines
    $g.DrawString('• NTA JEE / NEET & CBSE Test Series Engine', $subFont, $lightBrush, 60, 210)
    $g.DrawString('• Live Question Palette with Strict CBT Timers', $subFont, $lightBrush, 60, 260)
    $g.DrawString('• Instant AI Score Prediction & Weak Topic Diagnostics', $subFont, $lightBrush, 60, 310)
    $g.DrawString('• Topic-Wise Video Lectures & Faculty Notes', $subFont, $lightBrush, 60, 360)

    # Right Side Mockup Visual Box
    $mockCard = New-Object System.Drawing.Rectangle 660, 70, 310, 380
    $mockBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 41, 59))
    $g.FillRectangle($mockBg, $mockCard)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(51, 65, 85)), 2), $mockCard)

    $cardHeadFont = New-Object System.Drawing.Font 'Arial', 15, [System.Drawing.FontStyle]::Bold
    $g.DrawString('Score Prediction: 96%', $cardHeadFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34, 197, 94))), 680, 95)
    $g.DrawString('Level 1: 24/25  |  Level 2: 22/25', $tagFont, $lightBrush, 680, 130)
    $g.DrawString('Level 3: 25/25  |  Accuracy: 95%', $tagFont, $lightBrush, 680, 160)

    # Palette Mini Preview
    $colors = @(
        [System.Drawing.Color]::FromArgb(22, 163, 74),
        [System.Drawing.Color]::FromArgb(224, 62, 26),
        [System.Drawing.Color]::FromArgb(107, 33, 168),
        [System.Drawing.Color]::FromArgb(37, 99, 235),
        [System.Drawing.Color]::FromArgb(22, 163, 74),
        [System.Drawing.Color]::FromArgb(22, 163, 74),
        [System.Drawing.Color]::FromArgb(224, 62, 26),
        [System.Drawing.Color]::FromArgb(22, 163, 74)
    )
    for ($i = 0; $i -lt 8; $i++) {
        $bx = 680 + ($i % 4) * 65
        $by = 220 + [Math]::Floor($i / 4) * 65
        $cRect = New-Object System.Drawing.Rectangle $bx, $by, 50, 45
        $g.FillRectangle((New-Object System.Drawing.SolidBrush $colors[$i]), $cRect)
        $numStr = ($i + 1).ToString()
        $g.DrawString($numStr, $cardHeadFont, $whiteBrush, ($bx + 15), ($by + 12))
    }

    $outPath = Join-Path $outputDir 'playstore-feature-graphic-1024x500.png'
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

function Generate-Screenshot1 {
    $width = 1080
    $height = 1920
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(30, 41, 59)), 90.0
    $g.FillRectangle($brush, $rect)

    $titleFont = New-Object System.Drawing.Font 'Arial', 36, [System.Drawing.FontStyle]::Bold
    $subFont = New-Object System.Drawing.Font 'Arial', 20, [System.Drawing.FontStyle]::Regular
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $slateBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))

    $badgeFont = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Bold
    $badgeRect = New-Object System.Drawing.Rectangle 80, 70, 360, 50
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))), $badgeRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16, 185, 129)), 2), $badgeRect)
    $g.DrawString('NTA CBT EXAM ENGINE', $badgeFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))), 95, 82)

    $g.DrawString('Real Computer-Based Test Simulator', $titleFont, $whiteBrush, 80, 140)
    $g.DrawString('Complete with NTA Question Palette and Countdown Timer', $subFont, $slateBrush, 80, 205)

    # Phone Frame
    $px = 80
    $py = 280
    $pw = 920
    $ph = 1560
    $phoneRect = New-Object System.Drawing.Rectangle $px, $py, $pw, $ph
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 252))), $phoneRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(71, 85, 105)), 4), $phoneRect)

    # Header
    $appHeader = New-Object System.Drawing.Rectangle $px, $py, $pw, 100
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))), $appHeader)
    $appHeadFont = New-Object System.Drawing.Font 'Arial', 22, [System.Drawing.FontStyle]::Bold
    $g.DrawString('ZeePrep Exam Engine', $appHeadFont, $whiteBrush, ($px + 30), ($py + 35))

    # Timer Bar
    $tRect = New-Object System.Drawing.Rectangle ($px + 30), ($py + 130), ($pw - 60), 70
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $tRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225)), 2), $tRect)
    $tFont = New-Object System.Drawing.Font 'Arial', 20, [System.Drawing.FontStyle]::Bold
    $g.DrawString('TIME LEFT: 44:20', $tFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 163, 74))), ($px + 50), ($py + 150))
    $g.DrawString('Question 4 of 25', $tFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 70, 229))), ($px + 620), ($py + 150))

    # Question Box
    $qRect = New-Object System.Drawing.Rectangle ($px + 30), ($py + 230), ($pw - 60), 650
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $qRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240)), 2), $qRect)

    $qNumFont = New-Object System.Drawing.Font 'Arial', 20, [System.Drawing.FontStyle]::Bold
    $qTextFont = New-Object System.Drawing.Font 'Arial', 18, [System.Drawing.FontStyle]::Regular
    $g.DrawString('Question 4: (+4 Marks, -1 Mark)', $qNumFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))), ($px + 60), ($py + 260))
    $g.DrawString('If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, find the number of elements in the power set P(A △ B):', $qTextFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(51, 65, 85))), (New-Object System.Drawing.RectangleF ($px + 60), ($py + 310), ($pw - 120), 100))

    # Options (1), (2), (3), (4)
    $options = @('(1) 16', '(2) 32', '(3) 8', '(4) 64')
    for ($i = 0; $i -lt 4; $i++) {
        $oy = $py + 440 + ($i * 90)
        $oRect = New-Object System.Drawing.Rectangle ($px + 60), $oy, ($pw - 120), 70
        $isSelected = ($i -eq 0)
        $bgCol = if ($isSelected) { [System.Drawing.Color]::FromArgb(238, 242, 255) } else { [System.Drawing.Color]::White }
        $borderCol = if ($isSelected) { [System.Drawing.Color]::FromArgb(79, 70, 229) } else { [System.Drawing.Color]::FromArgb(203, 213, 225) }
        $g.FillRectangle((New-Object System.Drawing.SolidBrush $bgCol), $oRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen $borderCol, 2), $oRect)
        $txtCol = if ($isSelected) { [System.Drawing.Color]::FromArgb(79, 70, 229) } else { [System.Drawing.Color]::FromArgb(30, 41, 59) }
        $g.DrawString($options[$i], $qNumFont, (New-Object System.Drawing.SolidBrush $txtCol), ($px + 90), ($oy + 20))
    }

    # 2x2 Action Buttons
    $btnFont = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Bold
    $b1 = New-Object System.Drawing.Rectangle ($px + 30), ($py + 910), 415, 75
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 163, 74))), $b1)
    $g.DrawString('SAVE & NEXT', $btnFont, $whiteBrush, ($px + 140), ($py + 935))

    $b2 = New-Object System.Drawing.Rectangle ($px + 475), ($py + 910), 415, 75
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $b2)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225)), 2), $b2)
    $g.DrawString('CLEAR', $btnFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))), ($px + 640), ($py + 935))

    $b3 = New-Object System.Drawing.Rectangle ($px + 30), ($py + 1010), 415, 75
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(107, 33, 168))), $b3)
    $g.DrawString('SAVE & MARK REVIEW', $btnFont, $whiteBrush, ($px + 100), ($py + 1035))

    $b4 = New-Object System.Drawing.Rectangle ($px + 475), ($py + 1010), 415, 75
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(37, 99, 235))), $b4)
    $g.DrawString('MARK REVIEW & NEXT', $btnFont, $whiteBrush, ($px + 540), ($py + 1035))

    # Submit
    $submitBtn = New-Object System.Drawing.Rectangle ($px + 550), ($py + 1120), 340, 80
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 163, 74))), $submitBtn)
    $subHeadFont = New-Object System.Drawing.Font 'Arial', 18, [System.Drawing.FontStyle]::Bold
    $g.DrawString('SUBMIT EXAM', $subHeadFont, $whiteBrush, ($px + 620), ($py + 1145))

    $outPath = Join-Path $outputDir 'playstore-screenshot-1-cbt-exam.png'
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

function Generate-Screenshot2 {
    $width = 1080
    $height = 1920
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(30, 41, 59)), 90.0
    $g.FillRectangle($brush, $rect)

    $titleFont = New-Object System.Drawing.Font 'Arial', 36, [System.Drawing.FontStyle]::Bold
    $subFont = New-Object System.Drawing.Font 'Arial', 20, [System.Drawing.FontStyle]::Regular
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $slateBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))

    $badgeFont = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Bold
    $badgeRect = New-Object System.Drawing.Rectangle 80, 70, 420, 50
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))), $badgeRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(59, 130, 246)), 2), $badgeRect)
    $g.DrawString('DIAGNOSTICS & SCORE PREDICTION', $badgeFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(59, 130, 246))), 95, 82)

    $g.DrawString('Intelligent Diagnostic Report', $titleFont, $whiteBrush, 80, 140)
    $g.DrawString('Track Level-Wise Score Forecasts and Strengths', $subFont, $slateBrush, 80, 205)

    $px = 80
    $py = 280
    $pw = 920
    $ph = 1560
    $phoneRect = New-Object System.Drawing.Rectangle $px, $py, $pw, $ph
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 252))), $phoneRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(71, 85, 105)), 4), $phoneRect)

    # Score Banner
    $sRect = New-Object System.Drawing.Rectangle ($px + 30), ($py + 130), ($pw - 60), 280
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $sRect, ([System.Drawing.Color]::FromArgb(79, 70, 229)), ([System.Drawing.Color]::FromArgb(99, 102, 241)), 45.0
    $g.FillRectangle($brush, $sRect)

    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(251, 191, 36))
    $hFont = New-Object System.Drawing.Font 'Arial', 22, [System.Drawing.FontStyle]::Bold
    $bigFont = New-Object System.Drawing.Font 'Arial', 52, [System.Drawing.FontStyle]::Bold
    $subF = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Regular

    $g.DrawString('DIAGNOSTIC SCORECARD', $hFont, $goldBrush, ($px + 60), ($py + 155))
    $g.DrawString('96% PREDICTED SCORE', $bigFont, $whiteBrush, ($px + 60), ($py + 200))
    $g.DrawString('Level 1 (96%) • Level 2 (88%) • Level 3 (100%)', $subF, $whiteBrush, ($px + 60), ($py + 340))

    # Metric Tiles 2x2
    $metrics = @(
        @{ Title = 'ACCURACY'; Val = '96%'; Col = [System.Drawing.Color]::FromArgb(34, 197, 94) },
        @{ Title = 'CORRECT ANSWERS'; Val = '24/25'; Col = [System.Drawing.Color]::FromArgb(59, 130, 246) },
        @{ Title = 'AVERAGE SPEED'; Val = '42s / Q'; Col = [System.Drawing.Color]::FromArgb(168, 85, 247) },
        @{ Title = 'PERCENTILE'; Val = '98.4th'; Col = [System.Drawing.Color]::FromArgb(245, 158, 11) }
    )
    for ($i = 0; $i -lt 4; $i++) {
        $mx = $px + 30 + ($i % 2) * 445
        $my = $py + 440 + [Math]::Floor($i / 2) * 160
        $mRect = New-Object System.Drawing.Rectangle $mx, $my, 415, 135
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $mRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240)), 2), $mRect)

        $mTitleFont = New-Object System.Drawing.Font 'Arial', 14, [System.Drawing.FontStyle]::Bold
        $mValFont = New-Object System.Drawing.Font 'Arial', 28, [System.Drawing.FontStyle]::Bold
        $g.DrawString($metrics[$i].Title, $mTitleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))), ($mx + 20), ($my + 20))
        $g.DrawString($metrics[$i].Val, $mValFont, (New-Object System.Drawing.SolidBrush $metrics[$i].Col), ($mx + 20), ($my + 60))
    }

    # Weak Topics Card
    $wRect = New-Object System.Drawing.Rectangle ($px + 30), ($py + 790), ($pw - 60), 380
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $wRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(254, 202, 202)), 2), $wRect)

    $wHeadFont = New-Object System.Drawing.Font 'Arial', 18, [System.Drawing.FontStyle]::Bold
    $g.DrawString('Targeted Revision Areas', $wHeadFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 38, 38))), ($px + 60), ($py + 820))
    $g.DrawString('• Relations & Functions: Inverse & Domain Mappings', $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(51, 65, 85))), ($px + 60), ($py + 880))
    $g.DrawString('• Trigonometric Identities: Multiple Angle Formulas', $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(51, 65, 85))), ($px + 60), ($py + 940))
    $g.DrawString('• Calculus: Left-Hand & Right-Hand Limits', $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(51, 65, 85))), ($px + 60), ($py + 1000))

    $outPath = Join-Path $outputDir 'playstore-screenshot-2-performance-report.png'
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

function Generate-Screenshot3 {
    $width = 1080
    $height = 1920
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(30, 41, 59)), 90.0
    $g.FillRectangle($brush, $rect)

    $titleFont = New-Object System.Drawing.Font 'Arial', 36, [System.Drawing.FontStyle]::Bold
    $subFont = New-Object System.Drawing.Font 'Arial', 20, [System.Drawing.FontStyle]::Regular
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $slateBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))

    $badgeFont = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Bold
    $badgeRect = New-Object System.Drawing.Rectangle 80, 70, 360, 50
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))), $badgeRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(139, 92, 246)), 2), $badgeRect)
    $g.DrawString('TOPIC-WISE STUDY NOTES', $badgeFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(139, 92, 246))), 95, 82)

    $g.DrawString('Video Lectures & Revision Notes', $titleFont, $whiteBrush, 80, 140)
    $g.DrawString('Organized Alphabetically by Class, Subject & Topic', $subFont, $slateBrush, 80, 205)

    $px = 80
    $py = 280
    $pw = 920
    $ph = 1560
    $phoneRect = New-Object System.Drawing.Rectangle $px, $py, $pw, $ph
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 252))), $phoneRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(71, 85, 105)), 4), $phoneRect)

    # Resource Cards
    $cards = @(
        @{ Title = 'Sets & Relations: Complete Mastery Course'; Topic = 'Class 11 Mathematics • 45 Mins'; Type = 'VIDEO LECTURE' },
        @{ Title = 'Trigonometric Functions & Graphs Guide'; Topic = 'Class 11 Mathematics • PDF Notes'; Type = 'CHEATSHEET' },
        @{ Title = 'Calculus Limits & Continuity Formula Sheet'; Topic = 'Class 11 Mathematics • 32 Mins'; Type = 'VIDEO LECTURE' }
    )

    $hFont = New-Object System.Drawing.Font 'Arial', 22, [System.Drawing.FontStyle]::Bold
    $subF = New-Object System.Drawing.Font 'Arial', 16, [System.Drawing.FontStyle]::Bold
    $tagFont = New-Object System.Drawing.Font 'Arial', 14, [System.Drawing.FontStyle]::Regular

    for ($i = 0; $i -lt 3; $i++) {
        $cy = $py + 130 + ($i * 300)
        $cRect = New-Object System.Drawing.Rectangle ($px + 30), $cy, ($pw - 60), 260
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $cRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240)), 2), $cRect)

        $tBox = New-Object System.Drawing.Rectangle ($px + 50), ($cy + 25), 200, 160
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(238, 242, 255))), $tBox)
        $g.DrawString($cards[$i].Type, $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 70, 229))), ($px + 60), ($cy + 85))

        $g.DrawString($cards[$i].Title, $hFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))), (New-Object System.Drawing.RectangleF ($px + 280), ($cy + 30), ($pw - 360), 80))
        $g.DrawString($cards[$i].Topic, $tagFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))), ($px + 280), ($cy + 130))

        $aPill = New-Object System.Drawing.Rectangle ($px + 280), ($cy + 180), 200, 45
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 70, 229))), $aPill)
        $g.DrawString("Open Resource >", $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), ($px + 300), ($cy + 192))
    }

    $outPath = Join-Path $outputDir "playstore-screenshot-3-topic-resources.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

function Generate-Screenshot4 {
    $width = 1080
    $height = 1920
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(30, 41, 59)), 90.0
    $g.FillRectangle($brush, $rect)

    $titleFont = New-Object System.Drawing.Font "Arial", 36, [System.Drawing.FontStyle]::Bold
    $subFont = New-Object System.Drawing.Font "Arial", 20, [System.Drawing.FontStyle]::Regular
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $slateBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))

    $badgeFont = New-Object System.Drawing.Font "Arial", 16, [System.Drawing.FontStyle]::Bold
    $badgeRect = New-Object System.Drawing.Rectangle 80, 70, 360, 50
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))), $badgeRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(245, 158, 11)), 2), $badgeRect)
    $g.DrawString("MULTI-LEVEL TEST SERIES", $badgeFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 158, 11))), 95, 82)

    $g.DrawString("Level 1, 2 and 3 Adaptive Exams", $titleFont, $whiteBrush, 80, 140)
    $g.DrawString("Master Foundation, Intermediate & Advanced Papers", $subFont, $slateBrush, 80, 205)

    $px = 80
    $py = 280
    $pw = 920
    $ph = 1560
    $phoneRect = New-Object System.Drawing.Rectangle $px, $py, $pw, $ph
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 252))), $phoneRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(71, 85, 105)), 4), $phoneRect)

    $hFont = New-Object System.Drawing.Font 'Arial', ([float]22), [System.Drawing.FontStyle]::Bold
    $subF = New-Object System.Drawing.Font 'Arial', ([float]16), [System.Drawing.FontStyle]::Bold
    $tagFont = New-Object System.Drawing.Font 'Arial', ([float]14), [System.Drawing.FontStyle]::Regular

    $exams = @(
        @{ Title = "Class 11 Mathematics - Level 1"; Sub = "Sets, Relations, Complex Numbers & Algebra"; Status = "Completed (Score: 24/25)" },
        @{ Title = "Class 11 Mathematics - Level 2"; Sub = "Trigonometry, Coordinate Geometry & Sequences"; Status = "Completed (Score: 22/25)" },
        @{ Title = "Class 11 Mathematics - Level 3"; Sub = "Limits, Derivatives, Statistics & Probability"; Status = "Completed (Score: 25/25)" }
    )

    for ($i = 0; $i -lt 3; $i++) {
        $ey = $py + 140 + ($i * 320)
        $eRect = New-Object System.Drawing.Rectangle ($px + 30), $ey, ($pw - 60), 280
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), $eRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240)), 2), $eRect)

        $badgeCol = [System.Drawing.Color]::FromArgb(254, 243, 199)
        $badgeTxtCol = [System.Drawing.Color]::FromArgb(180, 83, 9)
        $bRect = New-Object System.Drawing.Rectangle ($px + 60), ($ey + 25), 180, 40
        $g.FillRectangle((New-Object System.Drawing.SolidBrush $badgeCol), $bRect)
        $lvlStr = "Level " + ($i + 1).ToString()
        $g.DrawString($lvlStr, $subF, (New-Object System.Drawing.SolidBrush $badgeTxtCol), ($px + 105), ($ey + 32))

        $g.DrawString($exams[$i].Title, $hFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))), ($px + 60), ($ey + 80))
        $g.DrawString($exams[$i].Sub, $tagFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(71, 85, 105))), ($px + 60), ($ey + 125))

        $statStr = "Completed: " + $exams[$i].Status
        $g.DrawString($statStr, $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 163, 74))), ($px + 60), ($ey + 180))

        $btn = New-Object System.Drawing.Rectangle ($px + 600), ($ey + 195), 230, 55
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 70, 229))), $btn)
        $g.DrawString("Retake Exam", $subF, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), ($px + 645), ($ey + 210))
    }

    $outPath = Join-Path $outputDir "playstore-screenshot-4-exam-library.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

# Run Generators
Generate-FeatureGraphic
Generate-Screenshot1
Generate-Screenshot2
Generate-Screenshot3
Generate-Screenshot4

Write-Output "All Play Store Graphics generated in playstore_assets directory!"
