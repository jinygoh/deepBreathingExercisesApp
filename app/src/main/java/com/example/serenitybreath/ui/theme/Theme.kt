package com.example.serenitybreath.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = SereneTeal,
    onPrimary = SoftSand,
    primaryContainer = LighterSereneTeal,
    onPrimaryContainer = DeepSlate,
    secondary = ButtonBackground, // Can be used for FABs or accents
    onSecondary = ButtonText,
    tertiary = VeryLightSereneTeal,
    onTertiary = DeepSlate,
    background = BackgroundPrimary,
    onBackground = TextPrimary,
    surface = SurfacePrimary, // Cards, Sheets, Menus
    onSurface = TextPrimary,
    surfaceVariant = ButtonBackground, // For elements like outlined text fields
    onSurfaceVariant = TextPrimary,
    error = StopButtonBackground,
    onError = StopButtonText,
    outline = SereneTeal // For outlines like in OutlinedTextField
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkSereneTeal,
    onPrimary = DarkSoftSand,
    primaryContainer = DarkLighterSereneTeal,
    onPrimaryContainer = DarkDeepSlate,
    secondary = DarkButtonBackground,
    onSecondary = DarkButtonText,
    tertiary = DarkVeryLightSereneTeal,
    onTertiary = DarkDeepSlate,
    background = DarkBackgroundPrimary,
    onBackground = DarkTextPrimary,
    surface = DarkSurfacePrimary,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkButtonBackground,
    onSurfaceVariant = DarkTextPrimary,
    error = DarkStopButtonBackground,
    onError = DarkStopButtonText,
    outline = DarkSereneTeal
)

@Composable
fun SerenityBreathTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb() // Or colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            // For Navigation Bar (if visible)
            // window.navigationBarColor = colorScheme.background.toArgb()
            // WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
