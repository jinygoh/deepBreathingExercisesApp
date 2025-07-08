package com.example.serenitybreath.viewmodel

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.serenitybreath.model.BreathingPhase
import com.example.serenitybreath.model.Exercise
import com.example.serenitybreath.model.Exercises
import com.example.serenitybreath.utils.SoundPlayer
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class ExerciseState {
    STOPPED, RUNNING, PAUSED
}

data class CustomTimings(
    val inhale: Int = 4,
    val hold1: Int = 7,
    val exhale: Int = 8,
    val hold2: Int = 0
) {
    val isValid: Boolean
        get() = inhale > 0 && exhale > 0 && hold1 >= 0 && hold2 >= 0 && (inhale + hold1 + exhale + hold2 > 0)
}

data class BreathingUiState(
    val availableExercises: List<Exercise> = Exercises.allExercises,
    val selectedExercise: Exercise = Exercises.B478,
    val currentPhase: BreathingPhase? = null,
    val countdownValue: Int = 0, // Number displayed in the circle
    val totalPhaseDuration: Int = 0, // For animation progress calculation
    val exerciseState: ExerciseState = ExerciseState.STOPPED,
    val completedCycles: Int = 0,
    val sessionTimeMillis: Long = 0L,
    val soundEnabled: Boolean = true,
    val customTimings: CustomTimings = CustomTimings(
        inhale = Exercises.defaultCustomExercise().phases.getOrNull(0)?.duration ?: 4,
        hold1 = Exercises.defaultCustomExercise().phases.getOrNull(1)?.duration ?: 7,
        exhale = Exercises.defaultCustomExercise().phases.getOrNull(2)?.duration ?: 8,
        hold2 = Exercises.defaultCustomExercise().phases.getOrNull(3)?.duration ?: 0
    ),
    val showCustomizationArea: Boolean = false,
    val instructionText: String = "Select an exercise and press Start"
)

private const val PREFS_NAME = "SerenityBreathPrefs"
private const val KEY_SOUND_ENABLED = "soundEnabled"
private const val KEY_CUSTOM_INHALE = "customInhale"
private const val KEY_CUSTOM_HOLD1 = "customHold1"
private const val KEY_CUSTOM_EXHALE = "customExhale"
private const val KEY_CUSTOM_HOLD2 = "customHold2"


class BreathingViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(BreathingUiState())
    val uiState: StateFlow<BreathingUiState> = _uiState.asStateFlow()

    private var exerciseJob: Job? = null
    private var sessionTimerJob: Job? = null
    private var currentPhaseIndex = 0
    private var timeInCurrentPhaseMillis = 0L // Time elapsed in the current phase for pause/resume

    private val soundPlayer: SoundPlayer = SoundPlayer(application.applicationContext)
    private val sharedPreferences: SharedPreferences =
        application.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    init {
        loadPreferences()
        updateInstructionText()
    }

    private fun loadPreferences() {
        val soundPref = sharedPreferences.getBoolean(KEY_SOUND_ENABLED, true)
        val customInhale = sharedPreferences.getInt(KEY_CUSTOM_INHALE, Exercises.defaultCustomExercise().phases.getOrNull(0)?.duration ?: 4)
        val customHold1 = sharedPreferences.getInt(KEY_CUSTOM_HOLD1, Exercises.defaultCustomExercise().phases.getOrNull(1)?.duration ?: 7)
        val customExhale = sharedPreferences.getInt(KEY_CUSTOM_EXHALE, Exercises.defaultCustomExercise().phases.getOrNull(2)?.duration ?: 8)
        val customHold2 = sharedPreferences.getInt(KEY_CUSTOM_HOLD2, Exercises.defaultCustomExercise().phases.getOrNull(3)?.duration ?: 0)

        val loadedCustomTimings = CustomTimings(customInhale, customHold1, customExhale, customHold2)
        val updatedExercises = _uiState.value.availableExercises.map {
            if (it.id == "custom") Exercises.updateCustomExercise(customInhale, customHold1, customExhale, customHold2) else it
        }

        _uiState.update {
            it.copy(
                soundEnabled = soundPref,
                customTimings = loadedCustomTimings,
                availableExercises = updatedExercises,
                // If the app starts with "custom" selected, reflect loaded timings
                selectedExercise = if (it.selectedExercise.id == "custom") {
                    updatedExercises.find { ex -> ex.id == "custom" } ?: Exercises.defaultCustomExercise()
                } else {
                    it.selectedExercise
                }
            )
        }
        soundPlayer.setSoundEnabled(soundPref)
        updateInstructionText() // Update instruction based on loaded custom exercise if selected
    }

    fun selectExercise(exerciseId: String) {
        if (_uiState.value.exerciseState != ExerciseState.STOPPED) {
            stopExercise()
        }
        val newExercise = _uiState.value.availableExercises.find { it.id == exerciseId }
        newExercise?.let {
            _uiState.update { state ->
                state.copy(
                    selectedExercise = it,
                    currentPhase = null,
                    countdownValue = 0,
                    completedCycles = 0,
                    sessionTimeMillis = 0L,
                    showCustomizationArea = it.id == "custom",
                    // instructionText will be updated by updateInstructionText
                )
            }
        }
        updateInstructionText()
    }

    fun startOrPauseOrResumeExercise() {
        when (_uiState.value.exerciseState) {
            ExerciseState.STOPPED -> startExercise()
            ExerciseState.RUNNING -> pauseExercise()
            ExerciseState.PAUSED -> resumeExercise()
        }
    }

    private fun startExercise() {
        val currentExercise = _uiState.value.selectedExercise
        if (currentExercise.phases.isEmpty()) {
             _uiState.update { it.copy(instructionText = "Custom exercise has no phases. Define them.") }
            return
        }

        currentPhaseIndex = 0
        timeInCurrentPhaseMillis = 0L
        _uiState.update {
            it.copy(
                exerciseState = ExerciseState.RUNNING,
                completedCycles = 0,
                sessionTimeMillis = 0L
            )
        }
        startSessionTimer()
        runPhase()
    }

    private fun runPhase() {
        exerciseJob?.cancel()
        val phase = _uiState.value.selectedExercise.phases.getOrNull(currentPhaseIndex)
        if (phase == null) { // Should not happen if phases list is not empty
            stopExercise()
            return
        }

        _uiState.update { it.copy(currentPhase = phase, totalPhaseDuration = phase.duration) }
        soundPlayer.playSound(phase.soundId)
        updateInstructionText(phase.name)


        val remainingDurationMillis = (phase.duration * 1000) - timeInCurrentPhaseMillis

        exerciseJob = viewModelScope.launch {
            // Countdown loop for display
            var countdown = (remainingDurationMillis / 1000).toInt()
            if (remainingDurationMillis % 1000 > 0) countdown++ // if there's a fraction of a second, count it

            _uiState.update { it.copy(countdownValue = countdown) }

            // This loop updates the countdown display every second.
            // It runs concurrently with the delay for the full phase duration.
            val countdownJob = launch {
                 for (sec in countdown downTo 1) {
                    _uiState.update { it.copy(countdownValue = sec) }
                    delay(1000)
                }
            }

            delay(remainingDurationMillis) // Wait for the actual phase duration
            countdownJob.cancel() // Ensure countdown display stops

            timeInCurrentPhaseMillis = 0L // Reset for next phase
            currentPhaseIndex++
            if (currentPhaseIndex >= _uiState.value.selectedExercise.phases.size) {
                currentPhaseIndex = 0
                _uiState.update { it.copy(completedCycles = it.completedCycles + 1) }
            }

            if (_uiState.value.exerciseState == ExerciseState.RUNNING) {
                runPhase()
            }
        }
    }

    private fun pauseExercise() {
        exerciseJob?.cancel() // Stops the phase progression and countdown updates
        sessionTimerJob?.cancel()
        // Calculate how much time was left in the current phase timer
        // Note: exerciseJob is a coroutine. Its execution time isn't directly subtracted.
        // We need to track timeInCurrentPhaseMillis more accurately.
        // For simplicity, we assume the countdown reflects remaining whole seconds.
        // A more precise pause would capture the exact moment within the phase.
        // For now, we'll use the current countdownValue to estimate remaining time.
        timeInCurrentPhaseMillis = (_uiState.value.currentPhase?.duration?.toLong()?.times(1000) ?: 0L) -
                                  (_uiState.value.countdownValue.toLong() * 1000L)
        // Ensure timeInCurrentPhaseMillis is not negative or excessively large
        if (timeInCurrentPhaseMillis < 0) timeInCurrentPhaseMillis = 0


        _uiState.update { it.copy(exerciseState = ExerciseState.PAUSED) }
        updateInstructionText("Paused: ${_uiState.value.currentPhase?.name ?: ""}")
    }

    private fun resumeExercise() {
        _uiState.update { it.copy(exerciseState = ExerciseState.RUNNING) }
        startSessionTimer(_uiState.value.sessionTimeMillis) // Resume timer from where it left off
        runPhase() // runPhase will use timeInCurrentPhaseMillis
    }

    fun stopExercise() {
        exerciseJob?.cancel()
        sessionTimerJob?.cancel()
        currentPhaseIndex = 0
        timeInCurrentPhaseMillis = 0L
        _uiState.update {
            it.copy(
                exerciseState = ExerciseState.STOPPED,
                currentPhase = null,
                countdownValue = 0,
                // sessionTimeMillis = 0L, // Keep session time or reset? Web version resets.
                // completedCycles = 0 // Keep cycles or reset? Web version resets.
            )
        }
        // Reset metrics like web version
        resetSessionMetrics()
        updateInstructionText()
    }


    private fun startSessionTimer(initialMillis: Long = 0L) {
        sessionTimerJob?.cancel()
        var mutableSessionTimeMillis = initialMillis
        _uiState.update { it.copy(sessionTimeMillis = mutableSessionTimeMillis) } // Update UI immediately

        sessionTimerJob = viewModelScope.launch {
            val startTime = System.currentTimeMillis() - mutableSessionTimeMillis
            while (_uiState.value.exerciseState == ExerciseState.RUNNING) {
                delay(1000) // Update every second
                mutableSessionTimeMillis = System.currentTimeMillis() - startTime
                _uiState.update { it.copy(sessionTimeMillis = mutableSessionTimeMillis) }
            }
        }
    }


    fun toggleSoundEnabled() {
        val newSoundEnabled = !_uiState.value.soundEnabled
        _uiState.update { it.copy(soundEnabled = newSoundEnabled) }
        soundPlayer.setSoundEnabled(newSoundEnabled)
        sharedPreferences.edit().putBoolean(KEY_SOUND_ENABLED, newSoundEnabled).apply()
    }

    fun updateCustomTimings(inhale: Int?, hold1: Int?, exhale: Int?, hold2: Int?) {
        val current = _uiState.value.customTimings
        val newTimings = CustomTimings(
            inhale = inhale ?: current.inhale,
            hold1 = hold1 ?: current.hold1,
            exhale = exhale ?: current.exhale,
            hold2 = hold2 ?: current.hold2
        )
        _uiState.update { it.copy(customTimings = newTimings) }
    }

    fun applyCustomSettings() {
        val timings = _uiState.value.customTimings
        if (!timings.isValid) {
            _uiState.update { it.copy(instructionText = "Invalid custom timings.") }
            return
        }

        val updatedCustomExercise = Exercises.updateCustomExercise(
            timings.inhale, timings.hold1, timings.exhale, timings.hold2
        )

        val newExerciseList = _uiState.value.availableExercises.map {
            if (it.id == "custom") updatedCustomExercise else it
        }
        _uiState.update { state ->
            state.copy(
                availableExercises = newExerciseList,
                selectedExercise = if (state.selectedExercise.id == "custom") updatedCustomExercise else state.selectedExercise,
                // instructionText will be updated by updateInstructionText
            )
        }

        sharedPreferences.edit()
            .putInt(KEY_CUSTOM_INHALE, timings.inhale)
            .putInt(KEY_CUSTOM_HOLD1, timings.hold1)
            .putInt(KEY_CUSTOM_EXHALE, timings.exhale)
            .putInt(KEY_CUSTOM_HOLD2, timings.hold2)
            .apply()

        // If custom is selected, update the instruction text to reflect new settings.
        // Otherwise, general "custom settings applied" message.
        if (_uiState.value.selectedExercise.id == "custom") {
             updateInstructionText()
        } else {
            _uiState.update { it.copy(instructionText = "Custom settings applied.") }
        }
    }


    private fun updateInstructionText(phaseName: String? = null) {
        val state = _uiState.value
        val text = when (state.exerciseState) {
            ExerciseState.RUNNING -> phaseName ?: state.currentPhase?.name ?: "Starting..."
            ExerciseState.PAUSED -> "Paused: ${state.currentPhase?.name ?: ""} (${state.countdownValue}s left)"
            ExerciseState.STOPPED -> {
                if (state.selectedExercise.id == "custom" && state.selectedExercise.phases.isEmpty()) {
                    "Define custom exercise settings."
                } else {
                    state.selectedExercise.description
                }
            }
        }
        _uiState.update { it.copy(instructionText = text) }
    }

    private fun resetSessionMetrics() {
        _uiState.update {
            it.copy(
                completedCycles = 0,
                sessionTimeMillis = 0L
            )
        }
    }


    override fun onCleared() {
        super.onCleared()
        exerciseJob?.cancel()
        sessionTimerJob?.cancel()
        soundPlayer.release()
    }
}
