package com.example.serenitybreath.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Replace with your actual font assets if you have custom fonts
// For now, using default FontFamily
val AppFontFamily = FontFamily.Default // Or FontFamily.SansSerif

// Set of Material typography styles to start with
val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 45.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp
    ),
    displaySmall = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 36.sp,
        lineHeight = 44.sp,
        letterSpacing = 0.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.SemiBold, // Adjusted from Normal for typical headlines
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    ),
    headlineSmall = TextStyle( // App Title "SerenityBreath" can use this
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.SemiBold, // Changed from Normal to SemiBold
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),
    titleLarge = TextStyle( // Instruction Text can use this
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium, // Changed from Normal to Medium
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    titleMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    titleSmall = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    bodyLarge = TextStyle( // Countdown number can use this, or a display style if larger
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Bold, // Make countdown bold
        fontSize = 30.sp, // Larger for countdown
        lineHeight = 36.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle( // General text, labels
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    bodySmall = TextStyle( // Metrics text, footer
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),
    labelLarge = TextStyle( // For buttons
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    labelMedium = TextStyle(
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle( // Sound status text
        fontFamily = AppFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
val CountdownTextStyle = TextStyle( // Specific style for the large countdown number
    fontFamily = AppFontFamily,
    fontWeight = FontWeight.Bold,
    fontSize = 48.sp, // Larger than bodyLarge
    lineHeight = 56.sp,
    letterSpacing = 0.sp
)

val InstructionTextStyle = TextStyle( // Specific style for instruction text
    fontFamily = AppFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 20.sp, // Larger for instruction text
    lineHeight = 28.sp,
    letterSpacing = 0.15.sp
)

val AppTitleStyle = TextStyle(
    fontFamily = AppFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 26.sp, // Slightly larger than headlineSmall
    lineHeight = 34.sp,
    letterSpacing = 0.sp
)
