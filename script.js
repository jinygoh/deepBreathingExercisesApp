// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // DOM Element References
    const breathingCircle = document.getElementById('breathingCircle');
    const countdownNumber = document.getElementById('countdownNumber');
    const instructionText = document.getElementById('instructionText');
    const exerciseButtons = document.querySelectorAll('.exercise-btn');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const customizationArea = document.getElementById('customizationArea');
    const inhaleDurationInput = document.getElementById('inhaleDuration');
    const hold1DurationInput = document.getElementById('hold1Duration');
    const exhaleDurationInput = document.getElementById('exhaleDuration');
    const hold2DurationInput = document.getElementById('hold2Duration');
    const applyCustomButton = document.getElementById('applyCustomButton');
    const soundToggleButton = document.getElementById('soundToggleButton');
    const soundStatusText = document.getElementById('soundStatusText');
    const cycleCountDisplay = document.getElementById('cycleCount');
    const sessionTimerDisplay = document.getElementById('sessionTimer');
    // Sound sample elements are no longer needed, will be removed from HTML later.
    // const inhaleSound = document.getElementById('inhaleSound');
    // const exhaleSound = document.getElementById('exhaleSound');

    // Constants for animation
    const MAX_SCALE = 1.2;
    const MIN_SCALE_NO_HOLD_AFTER = 0.1; // Target for exhale if NOT followed by a hold
    const MIN_VISIBLE_HOLD_SCALE = 0.5;   // Target for exhale IF followed by a hold, and for the hold itself

    // Web Audio API Setup
    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                soundEnabled = false; // Disable sound if API not supported
                updateSoundToggleUI(); // Reflect that sound is off
            }
        }
    }

    // Call initAudioContext early, perhaps on DOMContentLoaded or first sound interaction.
    // For now, let's ensure it's called before any sound generation.

    function generateSound(frequency, type = 'sine', durationSeconds = 0.5, volume = 0.3, phaseNameForLog = "Unknown") {
        if (!audioCtx) {
            console.log(`AudioContext not available for ${phaseNameForLog}. SoundEnabled: ${soundEnabled}`);
            return;
        }
        if (!soundEnabled) {
            console.log(`Sound generation skipped for ${phaseNameForLog} because soundEnabled is false.`);
            return;
        }

        // console.log(`Generating sound for ${phaseNameForLog}: Freq=${frequency}, Type=${type}, Dur=${durationSeconds}, Vol=${volume}`);

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        // Fade out quickly to avoid clicks
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + durationSeconds);


        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + durationSeconds);
    }

    function generateInhaleSound() {
        // Higher pitch for inhale
        generateSound(660, 'triangle', 0.4, 0.25, "Inhale"); // A5 note, triangle wave for softer sound
    }

    function generateExhaleSound() {
        // Lower pitch for exhale
        generateSound(440, 'sine', 0.6, 0.2, "Exhale"); // A4 note, sine wave
    }

    function generateHoldSound() {
        // Audible and distinct sound for hold phase
        generateSound(330, 'square', 0.7, 0.2, "Hold"); // E4 note, square wave
    }


    // State Management Variables
    let currentExercise = null; // Stores the selected exercise config
    let currentPhaseIndex = 0;
    let currentPhaseTimer = null; // setTimeout for phase duration
    let countdownTimer = null; // setInterval for 1s countdown
    let currentCountdownValue = 0;
    let exerciseIsRunning = false;
    let exerciseIsPaused = false;
    let completedCycles = 0;
    let sessionStartTime = null;
    let sessionTimerInterval = null;
    let soundEnabled = true; // Default, will be updated from localStorage

    // Breathing Exercise Definitions
    // Each phase: { name: "Inhale", duration: 4, sound: inhaleSound, animationClass: "inhale" }
    const exercises = {
        "4-7-8": {
            name: "4-7-8 Breathing",
            description: "Inhale for 4s, Hold for 7s, Exhale for 8s.",
            phases: [
                { name: "Inhale", duration: 4, soundId: 'inhaleSound', animationClass: "inhale" },
                { name: "Hold", duration: 7, soundId: 'holdSound', animationClass: "hold" },
                { name: "Exhale", duration: 8, soundId: 'exhaleSound', animationClass: "exhale" }
            ]
        },
        "box": {
            name: "Box Breathing",
            description: "Inhale for 4s, Hold for 4s, Exhale for 4s, Hold for 4s.",
            phases: [
                { name: "Inhale", duration: 4, soundId: 'inhaleSound', animationClass: "inhale" },
                { name: "Hold", duration: 4, soundId: 'holdSound', animationClass: "hold" },
                { name: "Exhale", duration: 4, soundId: 'exhaleSound', animationClass: "exhale" },
                { name: "Hold", duration: 4, soundId: 'holdSound', animationClass: "hold" }
            ]
        },
        "diaphragmatic": {
            name: "Diaphragmatic Breathing",
            description: "Inhale slowly (4s), Exhale slowly (6s).",
            phases: [
                { name: "Inhale", duration: 4, soundId: 'inhaleSound', animationClass: "inhale" },
                { name: "Exhale", duration: 6, soundId: 'exhaleSound', animationClass: "exhale" }
            ]
        },
        "pursed-lip": {
            name: "Pursed-Lip Breathing",
            description: "Inhale normally (2s), Exhale slowly (4s) through pursed lips.",
            phases: [
                { name: "Inhale", duration: 2, soundId: 'inhaleSound', animationClass: "inhale" },
                { name: "Exhale", duration: 4, soundId: 'exhaleSound', animationClass: "exhale" }
            ]
        },
        "custom": { // Will be populated by user input and localStorage
            name: "Custom Breathing",
            description: "Define your own breathing pattern.",
            phases: [] // Initially empty, filled by applyCustomSettings
        }
    };

    // Local Storage Keys
    const CUSTOM_SETTINGS_KEY = 'serenityBreathCustomSettings';
    const SOUND_PREF_KEY = 'serenityBreathSoundPref';

    // Initial UI Setup
    instructionText.textContent = 'Select an exercise and press Start';
    countdownNumber.textContent = ''; // Initially empty or could be a play icon
    stopButton.disabled = true; // Stop button disabled initially


    // Event Listeners

    // Exercise Selection
    exerciseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedExerciseKey = button.dataset.exercise;

            // If an exercise is running or paused, stop it completely
            if (exerciseIsRunning) {
                stopExercise(); // This function already handles UI reset like button text and timers
            }

            // Clear any 'active' class and set it for the clicked button
            exerciseButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentExercise = exercises[selectedExerciseKey];

            if (selectedExerciseKey === 'custom') {
                customizationArea.style.display = 'block';
                // Ensure custom settings are up-to-date if it's selected
                loadCustomSettings(); // This will also update exercises.custom
                currentExercise = exercises.custom; // Re-assign in case loadCustomSettings updated it
            } else {
                customizationArea.style.display = 'none';
            }

            // Reset UI elements specifically for a new selection, even after stopExercise
            resetUIForNewSelection(selectedExerciseKey);

            // Ensure start button says "Start" and is enabled, stop is disabled.
            // stopExercise() should handle most of this, but good to be explicit.
            startButton.textContent = 'Start';
            startButton.disabled = false; // It should be available to start the new exercise
            stopButton.disabled = true;

            console.log(`Selected exercise: ${selectedExerciseKey}. State reset.`);
        });
    });

    function resetUIForNewSelection(exerciseKey) {
        const selectedExerciseData = exercises[exerciseKey];
        if (selectedExerciseData) {
            instructionText.textContent = selectedExerciseData.description || `Get ready for ${selectedExerciseData.name}`;
        } else {
            // This case might happen if 'custom' is selected before its phases are defined
            if (exerciseKey === 'custom' && exercises.custom && exercises.custom.phases.length === 0) {
                instructionText.textContent = "Define custom exercise settings below.";
            } else if (exerciseKey === 'custom' && exercises.custom) {
                 instructionText.textContent = exercises.custom.description || "Custom exercise ready.";
            }
            else {
                instructionText.textContent = "Select an exercise.";
            }
        }
        countdownNumber.textContent = ''; // Clear countdown display
        breathingCircle.className = 'circle'; // Reset circle visual classes
        breathingCircle.style.transform = 'scale(1)'; // Reset JS-controlled scale
        breathingCircle.style.transition = 'transform 1s ease-in-out, background-color 1s ease-in-out'; // Restore original transition

        // Reset metrics that might have been partially set if user clicks rapidly
        completedCycles = 0;
        updateCycleCountDisplay();
        sessionTimerDisplay.textContent = "00:00";
        sessionStartTime = null;
    }

    // Start Button
    startButton.addEventListener('click', () => {
        if (exerciseIsRunning && !exerciseIsPaused) { // If running, pause it
            pauseExercise();
        } else if (exerciseIsRunning && exerciseIsPaused) { // If paused, resume it
            resumeExercise();
        } else { // If not running, start it
            startExercise();
        }
    });

    // Stop Button
    stopButton.addEventListener('click', () => {
        stopExercise();
    });

    // Apply Custom Settings
    applyCustomButton.addEventListener('click', () => {
        const inhale = parseInt(inhaleDurationInput.value);
        const hold1 = parseInt(hold1DurationInput.value);
        const exhale = parseInt(exhaleDurationInput.value);
        const hold2 = parseInt(hold2DurationInput.value);

        // Basic validation
        if (inhale <= 0 || exhale <= 0 || hold1 < 0 || hold2 < 0) {
            alert("Durations must be positive. Hold durations can be 0.");
            // Potentially highlight invalid fields or provide more specific feedback
            return;
        }
        if ((inhale + hold1 + exhale + hold2) === 0) {
            alert("At least one phase must have a duration greater than 0.");
            return;
        }


        updateCustomExerciseConfig(inhale, hold1, exhale, hold2);
        saveCustomSettings({ inhale, hold1, exhale, hold2 });

        instructionText.textContent = 'Custom settings applied. Select "Custom Breathing" and press Start.';
        if (currentExercise && currentExercise.name === "Custom Breathing") {
            // If custom is already selected, make it the active one to reflect new settings
             currentExercise = exercises.custom;
             resetUIForNewSelection('custom'); // Update UI if custom is active
        }
        console.log('Custom settings applied and saved.');
    });

    // Sound Toggle
    soundToggleButton.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        updateSoundToggleUI();
        saveSoundPreference(); // Save preference to localStorage
        console.log(`Sound enabled: ${soundEnabled}`);
    });

    function updateSoundToggleUI() {
        if (soundEnabled) {
            soundStatusText.textContent = 'Sound On';
            // Could change SVG icon here if using two different icons
            soundToggleButton.querySelector('svg').style.opacity = 1;
        } else {
            soundStatusText.textContent = 'Sound Off';
            soundToggleButton.querySelector('svg').style.opacity = 0.5;
        }
    }

    // Initialize sound UI based on default or loaded preference
    loadSoundPreference(); // Load and apply sound preference on init
    loadCustomSettings(); // Load custom settings on init


    // --- LocalStorage Functions ---
    function saveCustomSettings(settings) {
        try {
            localStorage.setItem(CUSTOM_SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Error saving custom settings to localStorage:", e);
        }
    }

    function loadCustomSettings() {
        try {
            const savedSettings = localStorage.getItem(CUSTOM_SETTINGS_KEY);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Update input fields
                inhaleDurationInput.value = parsedSettings.inhale;
                hold1DurationInput.value = parsedSettings.hold1;
                exhaleDurationInput.value = parsedSettings.exhale;
                hold2DurationInput.value = parsedSettings.hold2;
                // Update the 'custom' exercise configuration
                updateCustomExerciseConfig(parsedSettings.inhale, parsedSettings.hold1, parsedSettings.exhale, parsedSettings.hold2);
                console.log("Custom settings loaded from localStorage.");
            } else {
                // Apply default values to input fields if nothing is saved
                updateCustomExerciseConfig(
                    parseInt(inhaleDurationInput.value),
                    parseInt(hold1DurationInput.value),
                    parseInt(exhaleDurationInput.value),
                    parseInt(hold2DurationInput.value)
                );
            }
        } catch (e) {
            console.error("Error loading custom settings from localStorage:", e);
            // Fallback to default if loading fails
             updateCustomExerciseConfig(
                parseInt(inhaleDurationInput.value),
                parseInt(hold1DurationInput.value),
                parseInt(exhaleDurationInput.value),
                parseInt(hold2DurationInput.value)
            );
        }
    }

    function saveSoundPreference() {
        try {
            localStorage.setItem(SOUND_PREF_KEY, JSON.stringify(soundEnabled));
        } catch (e) {
            console.error("Error saving sound preference to localStorage:", e);
        }
    }

    function loadSoundPreference() {
        try {
            const savedPref = localStorage.getItem(SOUND_PREF_KEY);
            if (savedPref !== null) {
                soundEnabled = JSON.parse(savedPref);
            }
        } catch (e) {
            console.error("Error loading sound preference from localStorage:", e);
            soundEnabled = true; // Default to true if error
        }
        updateSoundToggleUI();
    }

    // Function to update the exercises.custom object based on input/loaded values
    function updateCustomExerciseConfig(inhale, hold1, exhale, hold2) {
        exercises.custom.phases = [];
        if (inhale > 0) exercises.custom.phases.push({ name: "Inhale", duration: inhale, soundId: 'inhaleSound', animationClass: "inhale" });
        if (hold1 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold1, soundId: 'holdSound', animationClass: "hold" });
        if (exhale > 0) exercises.custom.phases.push({ name: "Exhale", duration: exhale, soundId: 'exhaleSound', animationClass: "exhale" });
        if (hold2 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold2, soundId: 'holdSound', animationClass: "hold" });

        // Update description for custom exercise
        let desc = "Custom: ";
        if (exercises.custom.phases.length > 0) {
            desc += exercises.custom.phases.map(p => `${p.name.charAt(0)}${p.duration}s`).join('-');
        } else {
            desc = "Custom: No phases defined.";
        }
        exercises.custom.description = desc;

        // If 'custom' is the currently selected exercise, update the display text
        const activeButton = document.querySelector('.exercise-btn.active');
        if (activeButton && activeButton.dataset.exercise === 'custom') {
            currentExercise = exercises.custom; // Ensure currentExercise reflects the update
            // instructionText.textContent = exercises.custom.description; // Or some other UI update
        }
    }

    // --- State Machine & Timers ---

    function startNextPhase() {
        if (!currentExercise || !currentExercise.phases || currentExercise.phases.length === 0) {
            console.error("Cannot start next phase: current exercise or its phases are not defined.", currentExercise);
            stopExercise(); // Stop if configuration is bad
            return;
        }

        const phase = currentExercise.phases[currentPhaseIndex];
        if (!phase) {
            console.error(`Phase undefined at index ${currentPhaseIndex} for exercise ${currentExercise.name}`);
            stopExercise();
            return;
        }

        currentCountdownValue = phase.duration;
        updateUICircleAndText(phase.name, phase.animationClass);
        startCountdownDisplay(); // Starts the 1-second interval for number display
        playPhaseSound(phase.soundId);

        // Clear previous phase timer before starting a new one
        clearTimeout(currentPhaseTimer);
        currentPhaseTimer = setTimeout(() => {
            // Transition to the next phase or end cycle/exercise
            currentPhaseIndex++;
            if (currentPhaseIndex >= currentExercise.phases.length) {
                completedCycles++;
                updateCycleCountDisplay();
                currentPhaseIndex = 0; // Loop back to the first phase for another cycle
            }

            if (exerciseIsRunning && !exerciseIsPaused) {
                startNextPhase();
            }
        }, phase.duration * 1000);
    }

    function startCountdownDisplay() {
        clearInterval(countdownTimer);

        const phase = currentExercise.phases[currentPhaseIndex];
        const totalDuration = phase.duration;
        currentCountdownValue = 1; // Start counting from 1
        let elapsedAnimationTime = 0; // For animation scaling, tracks ticks from 0 to totalDuration-1

        countdownNumber.textContent = currentCountdownValue;

        // Set initial state for animation based on phase type
        if (phase.name === "Inhale") {
            breathingCircle.style.transform = `scale(${MIN_SCALE_NO_HOLD_AFTER})`;
        } else if (phase.name === "Exhale") {
            breathingCircle.style.transform = `scale(${MAX_SCALE})`;
        } else if (phase.name === "Hold") {
            const previousPhaseIndex = (currentPhaseIndex - 1 + currentExercise.phases.length) % currentExercise.phases.length;
            const previousPhase = currentExercise.phases[previousPhaseIndex];
            if (previousPhase.name === "Inhale") {
                breathingCircle.style.transform = `scale(${MAX_SCALE})`; // Hold large after inhale
            } else { // After Exhale or another Hold (implying it was small)
                breathingCircle.style.transform = `scale(${MIN_VISIBLE_HOLD_SCALE})`;
            }
        }
        breathingCircle.style.transition = `transform ${100 / 1000}s linear, background-color 1s ease-in-out`;

        countdownTimer = setInterval(() => {
            countdownNumber.textContent = currentCountdownValue;
            const animationProgress = currentCountdownValue / totalDuration;

            if (phase.name === "Inhale") {
                const scale = MIN_SCALE_NO_HOLD_AFTER + ((MAX_SCALE - MIN_SCALE_NO_HOLD_AFTER) * animationProgress);
                breathingCircle.style.transform = `scale(${Math.min(scale, MAX_SCALE)})`;
            } else if (phase.name === "Exhale") {
                // Determine target scale for this exhale
                let targetExhaleScale = MIN_SCALE_NO_HOLD_AFTER;
                const nextPhaseIndex = (currentPhaseIndex + 1) % currentExercise.phases.length;
                if (currentExercise.phases[nextPhaseIndex] && currentExercise.phases[nextPhaseIndex].name === "Hold") {
                    targetExhaleScale = MIN_VISIBLE_HOLD_SCALE;
                }

                const scale = MAX_SCALE - ((MAX_SCALE - targetExhaleScale) * animationProgress);
                breathingCircle.style.transform = `scale(${Math.max(scale, targetExhaleScale)})`;
            }
            // Hold phase keeps its scale set initially.

            if (currentCountdownValue >= totalDuration) {
                clearInterval(countdownTimer);
                // Ensure final scale is set precisely
                if (phase.name === "Inhale") {
                    breathingCircle.style.transform = `scale(${MAX_SCALE})`;
                } else if (phase.name === "Exhale") {
                    // Re-check target for final state of exhale
                    let finalExhaleTarget = MIN_SCALE_NO_HOLD_AFTER;
                    const nextPhaseIndex = (currentPhaseIndex + 1) % currentExercise.phases.length;
                     if (currentExercise.phases[nextPhaseIndex] && currentExercise.phases[nextPhaseIndex].name === "Hold") {
                        finalExhaleTarget = MIN_VISIBLE_HOLD_SCALE;
                    }
                    breathingCircle.style.transform = `scale(${finalExhaleTarget})`;
                }
                // For Hold, its scale was set at the beginning of startCountdownDisplay and doesn't change.
            } else {
                currentCountdownValue++;
            }
        }, 1000);
    }

    function clearAllTimers() {
        clearInterval(countdownTimer);
        clearTimeout(currentPhaseTimer);
        clearInterval(sessionTimerInterval);
        currentPhaseTimer = null;
        countdownTimer = null;
        sessionTimerInterval = null;
    }

    function startExercise() {
        if (!currentExercise) {
            instructionText.textContent = 'Please select an exercise first!';
            return;
        }
        if (currentExercise.name === "Custom Breathing" && exercises.custom.phases.length === 0) {
            instructionText.textContent = 'Custom exercise has no phases. Please define them.';
            customizationArea.style.display = 'block'; // Show customization
            return;
        }

        exerciseIsRunning = true;
        exerciseIsPaused = false;
        completedCycles = 0;
        currentPhaseIndex = 0;
        updateCycleCountDisplay();
        startSessionTimer();

        // Reset circle to a known small state before starting, to ensure smooth first inhale
        breathingCircle.style.transition = 'transform 0.1s linear, background-color 1s ease-in-out'; // quick reset
        breathingCircle.style.transform = 'scale(0.1)';
        // Delay startNextPhase slightly to allow the reset to apply visually if needed,
        // or rely on startNextPhase to correctly set initial state.
        // For now, direct call.
        startNextPhase();


        startButton.textContent = 'Pause';
        stopButton.disabled = false; // Ensure stop button is enabled
        // instructionText.textContent will be set by startNextPhase -> updateUICircleAndText
    }

    function stopExercise() {
        exerciseIsRunning = false;
        exerciseIsPaused = false;
        clearAllTimers();
        resetSessionMetrics(); // Resets cycle count and timer display
        resetUIToInitialState();
        startButton.textContent = 'Start';
        stopButton.disabled = true; // Disable stop button when no exercise is running
        instructionText.textContent = 'Exercise stopped. Select an exercise and press Start.';
        breathingCircle.style.transform = 'scale(1)'; // Reset scale to default
        breathingCircle.style.transition = 'transform 1s ease-in-out, background-color 1s ease-in-out'; // Restore original transition
    }

    function pauseExercise() {
        if (!exerciseIsRunning || exerciseIsPaused) return;
        exerciseIsPaused = true;

        clearTimeout(currentPhaseTimer); // Stop phase from transitioning
        clearInterval(countdownTimer); // Stop visual countdown
        clearInterval(sessionTimerInterval); // Stop session timer

        // The circle's current scale is preserved due to inline style.

        instructionText.textContent = `Paused: ${currentExercise.phases[currentPhaseIndex].name} (${currentCountdownValue}s left). Press Resume.`;
        startButton.textContent = 'Resume';
    }

    function resumeExercise() {
        if (!exerciseIsRunning || !exerciseIsPaused) return;
        exerciseIsPaused = false;

        const phase = currentExercise.phases[currentPhaseIndex];

        // currentCountdownValue holds the remaining seconds for the number display.
        // The animation needs to know how much of the phase duration has passed.
        // Let's assume elapsedTime was implicitly tracked by (phase.duration - currentCountdownValue)
        // For simplicity on resume, we'll restart the countdown logic which includes animation.
        // The visual scale is already where it was due to inline styles.

        if (currentCountdownValue <= 0) {
           currentCountdownValue = phase.duration;
        }

        updateUICircleAndText(phase.name, phase.animationClass, false); // Update text and color, but not scale via class
        startCountdownDisplay(); // This will handle the animation from current state if logic is robust
        startSessionTimer();

        currentPhaseTimer = setTimeout(() => {
            currentPhaseIndex++;
            if (currentPhaseIndex >= currentExercise.phases.length) {
                completedCycles++;
                updateCycleCountDisplay();
                currentPhaseIndex = 0;
            }
            if (exerciseIsRunning && !exerciseIsPaused) {
                startNextPhase();
            }
        }, currentCountdownValue * 1000);

        startButton.textContent = 'Pause';
        instructionText.textContent = phase.name;
    }


    // --- UI Update functions ---
    function updateUICircleAndText(phaseName, animationClass, updateScaleViaClass = true) {
        instructionText.textContent = phaseName;
        breathingCircle.classList.remove('inhale', 'exhale', 'hold');
        if (animationClass) {
            breathingCircle.classList.add(animationClass); // For background color primarily now
        }

        if (updateScaleViaClass) { // This part is now mostly handled by startCountdownDisplay
            // Or by explicit settings in start/stop/reset
            // We might remove scale changes from CSS classes if fully JS controlled
            // For now, let CSS classes define colors and JS define scale over time.
        }
    }

    function playPhaseSound(soundId) {
        initAudioContext(); // Ensure AudioContext is initialized

        if (!soundEnabled || !audioCtx || !soundId) return; // Also check if audioCtx is available

        if (soundId === 'inhaleSound') {
            generateInhaleSound();
        } else if (soundId === 'exhaleSound') {
            generateExhaleSound();
        } else if (soundId === 'holdSound') {
            generateHoldSound();
        }
        // No sound for 'hold' phases (soundId will be null or unhandled)
    }

    function updateCycleCountDisplay() {
        cycleCountDisplay.textContent = completedCycles;
    }

    function resetSessionMetrics() {
        completedCycles = 0;
        updateCycleCountDisplay();
        sessionTimerDisplay.textContent = "00:00";
        sessionStartTime = null; // Reset start time for session timer
    }

    function resetUIToInitialState() {
        breathingCircle.className = 'circle'; // Reset circle to default state (removes inhale/exhale/hold)
        countdownNumber.textContent = '';
        instructionText.textContent = 'Select an exercise and press Start';
        // Active exercise button remains selected.
        // UI for Start/Stop buttons is handled by stopExercise()
    }

    function resetUIForNewSelection(exerciseKey) {
        const selectedExerciseData = exercises[exerciseKey];
        if (selectedExerciseData) {
            instructionText.textContent = selectedExerciseData.description || `Get ready for ${selectedExerciseData.name}`;
        } else {
            instructionText.textContent = "Select an exercise.";
        }
        countdownNumber.textContent = ''; // Clear countdown
        breathingCircle.className = 'circle'; // Reset circle to default state
        // If the first phase has a duration, could display it, but simple clear is fine.
    }

    // --- Session Timer Functions ---
    function startSessionTimer() {
        if (sessionTimerInterval) clearInterval(sessionTimerInterval); // Clear if already running
        if (!sessionStartTime) { // If starting fresh or from full stop
            sessionStartTime = Date.now();
        } else { // If resuming from pause, adjust start time
            sessionStartTime = Date.now() - (parsedTimeInSeconds(sessionTimerDisplay.textContent) * 1000);
        }

        sessionTimerInterval = setInterval(() => {
            const elapsedTime = Date.now() - sessionStartTime;
            sessionTimerDisplay.textContent = formatTime(elapsedTime);
        }, 1000);
    }

    function parsedTimeInSeconds(timeString) { // e.g., "01:30"
        const parts = timeString.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    // Initial call to load custom settings and sound preferences
    loadCustomSettings();
    loadSoundPreference();

    console.log('SerenityBreath app initialized.');
});
