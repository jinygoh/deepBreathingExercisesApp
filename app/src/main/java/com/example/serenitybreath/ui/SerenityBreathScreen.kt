package com.example.serenitybreath.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.serenitybreath.model.Exercise
import com.example.serenitybreath.model.Exercises
import com.example.serenitybreath.ui.theme.*
import com.example.serenitybreath.viewmodel.BreathingUiState
import com.example.serenitybreath.viewmodel.BreathingViewModel
import com.example.serenitybreath.viewmodel.ExerciseState
import com.google.accompanist.flowlayout.FlowRow // Add this dependency

@Composable
fun SerenityBreathScreen(viewModel: BreathingViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    SerenityBreathTheme {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("SerenityBreath", style = MaterialTheme.typography.headlineSmall) },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            },
            containerColor = MaterialTheme.colorScheme.background
        ) { paddingValues ->
            MainContent(
                uiState = uiState,
                onExerciseSelect = { viewModel.selectExercise(it) },
                onStartPauseResume = { viewModel.startOrPauseOrResumeExercise() },
                onStop = { viewModel.stopExercise() },
                onSoundToggle = { viewModel.toggleSoundEnabled() },
                onCustomTimingChange = { inhale, hold1, exhale, hold2 ->
                    viewModel.updateCustomTimings(inhale, hold1, exhale, hold2)
                },
                onApplyCustomSettings = { viewModel.applyCustomSettings() },
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@Composable
fun MainContent(
    uiState: BreathingUiState,
    onExerciseSelect: (String) -> Unit,
    onStartPauseResume: () -> Unit,
    onStop: () -> Unit,
    onSoundToggle: () -> Unit,
    onCustomTimingChange: (Int?, Int?, Int?, Int?) -> Unit,
    onApplyCustomSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column( // Content Column
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp) // Spacing between sections
        ) {
            BreathingGuide(
                phaseName = uiState.currentPhase?.name,
                countdownValue = uiState.countdownValue,
                totalPhaseDuration = uiState.totalPhaseDuration,
                exerciseState = uiState.exerciseState,
                instructionText = uiState.instructionText
            )

            ExerciseSelection(
                exercises = uiState.availableExercises,
                selectedExerciseId = uiState.selectedExercise.id,
                onExerciseSelect = onExerciseSelect,
                isEnabled = uiState.exerciseState == ExerciseState.STOPPED
            )

            if (uiState.showCustomizationArea) {
                CustomizationArea(
                    customTimings = uiState.customTimings,
                    onTimingChange = onCustomTimingChange,
                    onApply = onApplyCustomSettings,
                    isEnabled = uiState.exerciseState == ExerciseState.STOPPED
                )
            }

            MainControls(
                exerciseState = uiState.exerciseState,
                onStartPauseResume = onStartPauseResume,
                onStop = onStop,
                isReadyToStart = uiState.selectedExercise.phases.isNotEmpty() || !uiState.showCustomizationArea
            )
        }

        SessionInfo( // Footer items
            soundEnabled = uiState.soundEnabled,
            onSoundToggle = onSoundToggle,
            cycleCount = uiState.completedCycles,
            sessionTimeMillis = uiState.sessionTimeMillis,
            modifier = Modifier.padding(top = 16.dp) // Add some top margin
        )
    }
}

@Composable
fun BreathingGuide(
    phaseName: String?,
    countdownValue: Int,
    totalPhaseDuration: Int,
    exerciseState: ExerciseState,
    instructionText: String
) {
    val circleSize: Dp = min(LocalConfiguration.current.screenWidthDp.dp, LocalConfiguration.current.screenHeightDp.dp) / 2f

    // Animation for circle scale
    val targetScale = when (exerciseState) {
        ExerciseState.RUNNING -> {
            when (phaseName) {
                "Inhale" -> 1.2f // Max scale from web app
                "Exhale" -> 0.5f // Min visible hold scale (web app used 0.1 if no hold after)
                "Hold" -> {
                    // This needs more context from previous phase, simplified here
                    // Assume hold maintains the scale of the end of the previous phase
                    // Or, if we want a specific visual for hold:
                    1.0f // Neutral scale for hold, or make it specific
                }
                else -> 1f // Default scale
            }
        }
        ExerciseState.PAUSED -> 1f // Or maintain last scale
        ExerciseState.STOPPED -> 1f
    }
    // More precise animation based on countdown progress
    val progress = if (totalPhaseDuration > 0 && exerciseState == ExerciseState.RUNNING) {
        (totalPhaseDuration - countdownValue + 1).toFloat() / totalPhaseDuration.toFloat()
    } else {
        0f
    }

    val animatedScale by animateFloatAsState(
        targetValue = if (exerciseState == ExerciseState.RUNNING) {
            when (phaseName) {
                "Inhale" -> 0.5f + (0.7f * progress) // from 0.5 to 1.2
                "Exhale" -> 1.2f - (0.7f * progress) // from 1.2 to 0.5
                "Hold" -> if (progress < 0.5f) 1.2f else 0.5f // Example: maintain scale from previous phase (simplified)
                // A better "Hold" would know if it's after Inhale (large) or Exhale (small)
                else -> 1f
            }
        } else 1f, // Default scale when stopped or paused
        animationSpec = tween(durationMillis = 900), // Smooth transition
        label = "BreathingCircleScale"
    )


    // Animation for circle color
    val circleColor by animateColorAsState(
        targetValue = when (phaseName) {
            "Inhale" -> MaterialTheme.colorScheme.primaryContainer // LighterSereneTeal
            "Exhale" -> MaterialTheme.colorScheme.primary // MainSereneTeal
            "Hold" -> MaterialTheme.colorScheme.tertiary // VeryLightSereneTeal
            else -> MaterialTheme.colorScheme.surfaceVariant // Default color
        },
        animationSpec = tween(durationMillis = 900),
        label = "BreathingCircleColor"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(vertical = 20.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(circleSize)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(
                    color = circleColor,
                    radius = (size.minDimension / 2f) * animatedScale
                )
            }
            if (exerciseState != ExerciseState.STOPPED && countdownValue > 0) {
                Text(
                    text = countdownValue.toString(),
                    style = CountdownTextStyle, // Custom style for large number
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            } else if (exerciseState == ExerciseState.STOPPED) {
                 Icon(
                    imageVector = Icons.Filled.GraphicEq, // Placeholder, like a play icon
                    contentDescription = "Start exercise",
                    modifier = Modifier.size(circleSize / 3),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            text = instructionText,
            style = InstructionTextStyle, // Custom style for instruction
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp).defaultMinSize(minHeight = 48.dp) // Ensure space
        )
    }
}

@Composable
fun ExerciseSelection(
    exercises: List<Exercise>,
    selectedExerciseId: String,
    onExerciseSelect: (String) -> Unit,
    isEnabled: Boolean
) {
    Text("Choose an Exercise:", style = MaterialTheme.typography.titleMedium)
    FlowRow(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        mainAxisSpacing = 8.dp,
        crossAxisSpacing = 8.dp,
        mainAxisAlignment = FlowRowMainAxisAlignment.Center // Center items in the row
    ) {
        exercises.forEach { exercise ->
            val isSelected = exercise.id == selectedExerciseId
            Button(
                onClick = { onExerciseSelect(exercise.id) },
                enabled = isEnabled,
                shape = MaterialTheme.shapes.medium,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                    contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondary,
                    disabledContainerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f)
                )
            ) {
                Text(exercise.name)
            }
        }
    }
}

@Composable
fun CustomizationArea(
    customTimings: com.example.serenitybreath.viewmodel.CustomTimings,
    onTimingChange: (inhale: Int?, hold1: Int?, exhale: Int?, hold2: Int?) -> Unit,
    onApply: () -> Unit,
    isEnabled: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Custom Breathing Settings", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
            CustomDurationInput("Inhale (s):", customTimings.inhale) { onTimingChange(it, null, null, null) }
            CustomDurationInput("Hold after Inhale (s):", customTimings.hold1) { onTimingChange(null, it, null, null) }
            CustomDurationInput("Exhale (s):", customTimings.exhale) { onTimingChange(null, null, it, null) }
            CustomDurationInput("Hold after Exhale (s):", customTimings.hold2) { onTimingChange(null, null, null, it) }
            Spacer(Modifier.height(16.dp))
            Button(onClick = onApply, enabled = isEnabled && customTimings.isValid) {
                Text("Apply Custom Settings")
            }
        }
    }
}

@Composable
private fun CustomDurationInput(label: String, value: Int, onValueChange: (Int?) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        OutlinedTextField(
            value = if (value == 0 && label.contains("Hold")) "" else value.toString(), // Show empty for 0 hold, easier to type
            onValueChange = { text -> onValueChange(text.toIntOrNull() ?: 0) },
            modifier = Modifier.width(80.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            singleLine = true,
            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center)
        )
    }
}


@Composable
fun MainControls(
    exerciseState: ExerciseState,
    onStartPauseResume: () -> Unit,
    onStop: () -> Unit,
    isReadyToStart: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        Button(
            onClick = onStartPauseResume,
            enabled = isReadyToStart || exerciseState == ExerciseState.PAUSED, // Enable if ready or if paused (to resume)
            modifier = Modifier.weight(1f).padding(end = 4.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (exerciseState == ExerciseState.RUNNING) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                when (exerciseState) {
                    ExerciseState.STOPPED -> "Start"
                    ExerciseState.RUNNING -> "Pause"
                    ExerciseState.PAUSED -> "Resume"
                }
            )
        }
        Button(
            onClick = onStop,
            enabled = exerciseState != ExerciseState.STOPPED,
            modifier = Modifier.weight(1f).padding(start = 4.dp),
            colors = ButtonDefaults.buttonColors(containerColor = StopButtonBackground, contentColor = StopButtonText)
        ) {
            Text("Stop")
        }
    }
}

@Composable
fun SessionInfo(
    soundEnabled: Boolean,
    onSoundToggle: () -> Unit,
    cycleCount: Int,
    sessionTimeMillis: Long,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        IconButton(onClick = onSoundToggle) {
            Icon(
                imageVector = if (soundEnabled) Icons.Filled.VolumeUp else Icons.Filled.VolumeOff,
                contentDescription = if (soundEnabled) "Mute Sounds" else "Unmute Sounds",
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
        Text("Cycles: $cycleCount", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground)
        Text("Time: ${formatTime(sessionTimeMillis)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground)
    }
}

fun formatTime(milliseconds: Long): String {
    val totalSeconds = milliseconds / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%02d:%02d", minutes, seconds)
}


@Preview(showBackground = true, widthDp = 360, heightDp = 720)
@Composable
fun DefaultPreview() {
    val previewUiState = BreathingUiState(
        availableExercises = Exercises.allExercises,
        selectedExercise = Exercises.B478,
        instructionText = Exercises.B478.description,
        customTimings = com.example.serenitybreath.viewmodel.CustomTimings(4,7,8,0)
    )
    SerenityBreathTheme {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("SerenityBreath Preview", style = MaterialTheme.typography.headlineSmall) },
                     colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        ) { paddingValues ->
            MainContent(
                uiState = previewUiState,
                onExerciseSelect = {},
                onStartPauseResume = {},
                onStop = {},
                onSoundToggle = {},
                onCustomTimingChange = {_,_,_,_ ->},
                onApplyCustomSettings = {},
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@Preview(showBackground = true, widthDp = 360, heightDp = 720, name = "Customization Area Preview")
@Composable
fun CustomizationPreview() {
    val previewUiState = BreathingUiState(
        availableExercises = Exercises.allExercises,
        selectedExercise = Exercises.allExercises.find { it.id == "custom" }!!,
        showCustomizationArea = true,
        instructionText = "Define custom settings.",
        customTimings = com.example.serenitybreath.viewmodel.CustomTimings(5,5,5,5)
    )
     SerenityBreathTheme {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("SerenityBreath Custom", style = MaterialTheme.typography.headlineSmall) },
                     colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        ) { paddingValues ->
            MainContent(
                uiState = previewUiState,
                onExerciseSelect = {},
                onStartPauseResume = {},
                onStop = {},
                onSoundToggle = {},
                onCustomTimingChange = {_,_,_,_ ->},
                onApplyCustomSettings = {},
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@Preview(showBackground = true, widthDp = 360, heightDp = 720, name = "Running Exercise Preview")
@Composable
fun RunningExercisePreview() {
    val previewUiState = BreathingUiState(
        availableExercises = Exercises.allExercises,
        selectedExercise = Exercises.B478,
        currentPhase = Exercises.B478.phases[0], // Inhale
        countdownValue = 3,
        totalPhaseDuration = 4,
        exerciseState = ExerciseState.RUNNING,
        completedCycles = 2,
        sessionTimeMillis = 120000, // 2 minutes
        instructionText = "Inhale"
    )
     SerenityBreathTheme {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("SerenityBreath Running", style = MaterialTheme.typography.headlineSmall) },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        ) { paddingValues ->
            MainContent(
                uiState = previewUiState,
                onExerciseSelect = {},
                onStartPauseResume = {},
                onStop = {},
                onSoundToggle = {},
                onCustomTimingChange = {_,_,_,_ ->},
                onApplyCustomSettings = {},
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}
