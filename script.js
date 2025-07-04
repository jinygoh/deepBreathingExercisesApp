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
    const inhaleSound = document.getElementById('inhaleSound');
    const exhaleSound = document.getElementById('exhaleSound');

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
                { name: "Hold", duration: 7, soundId: null, animationClass: "hold" },
                { name: "Exhale", duration: 8, soundId: 'exhaleSound', animationClass: "exhale" }
            ]
        },
        "box": {
            name: "Box Breathing",
            description: "Inhale for 4s, Hold for 4s, Exhale for 4s, Hold for 4s.",
            phases: [
                { name: "Inhale", duration: 4, soundId: 'inhaleSound', animationClass: "inhale" },
                { name: "Hold", duration: 4, soundId: null, animationClass: "hold" },
                { name: "Exhale", duration: 4, soundId: 'exhaleSound', animationClass: "exhale" },
                { name: "Hold", duration: 4, soundId: null, animationClass: "hold" }
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
            if (exerciseIsRunning && !exerciseIsPaused) {
                // Optionally, prompt user if they want to stop current exercise
                console.log("Exercise running, stop it first or implement a confirmation.");
                return;
            }

            // Remove 'active' class from all buttons
            exerciseButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to the clicked button
            button.classList.add('active');

            const selectedExerciseKey = button.dataset.exercise;
            currentExercise = exercises[selectedExerciseKey]; // Will be undefined until exercises are populated

            if (selectedExerciseKey === 'custom') {
                customizationArea.style.display = 'block';
                // Load custom settings if not already loaded, or apply defaults to inputs
                // This will be fleshed out in the "Custom Breathing" step
            } else {
                customizationArea.style.display = 'none';
            }

            // Reset UI for new selection if no exercise is running
            if (!exerciseIsRunning) {
                resetUIForNewSelection(selectedExerciseKey);
            }
            console.log(`Selected exercise: ${selectedExerciseKey}`);
        });
    });

    function resetUIForNewSelection(exerciseKey) {
        // Placeholder: Update instruction text based on selected exercise description
        // e.g., instructionText.textContent = "Get ready for 4-7-8 Breathing";
        countdownNumber.textContent = ''; // Clear countdown
        // Reset circle to default state if needed
        breathingCircle.className = 'circle'; // Removes inhale/exhale/hold classes
        // Potentially display the first phase's duration in the circle
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
        if (hold1 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold1, soundId: null, animationClass: "hold" });
        if (exhale > 0) exercises.custom.phases.push({ name: "Exhale", duration: exhale, soundId: 'exhaleSound', animationClass: "exhale" });
        if (hold2 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold2, soundId: null, animationClass: "hold" });

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
        clearInterval(countdownTimer); // Clear any existing countdown interval
        countdownNumber.textContent = currentCountdownValue;

        countdownTimer = setInterval(() => {
            currentCountdownValue--;
            countdownNumber.textContent = currentCountdownValue;
            if (currentCountdownValue <= 0) {
                clearInterval(countdownTimer);
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
        startNextPhase();

        startButton.textContent = 'Pause';
        stopButton.disabled = false; // Ensure stop button is enabled
        instructionText.textContent = currentExercise.phases[0].name; // Show first phase name
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
    }

    function pauseExercise() {
        if (!exerciseIsRunning || exerciseIsPaused) return;
        exerciseIsPaused = true;

        clearTimeout(currentPhaseTimer); // Stop phase from transitioning
        clearInterval(countdownTimer); // Stop visual countdown
        clearInterval(sessionTimerInterval); // Stop session timer

        // Save remaining time in current phase if needed for precise resume
        // For simplicity, we'll restart the current phase on resume or just use currentCountdownValue

        instructionText.textContent = `Paused: ${currentExercise.phases[currentPhaseIndex].name} (${currentCountdownValue}s left). Press Resume.`;
        startButton.textContent = 'Resume';
    }

    function resumeExercise() {
        if (!exerciseIsRunning || !exerciseIsPaused) return;
        exerciseIsPaused = false;

        // Restart the current phase's timer and countdown
        const phase = currentExercise.phases[currentPhaseIndex];
        // currentCountdownValue is already holding the remaining time if countdown was running
        // If countdown had finished but phase timer hadn't, currentCountdownValue might be 0 or less.
        // For simplicity, we can restart the phase countdown fully or use remaining.
        // Let's use the remaining currentCountdownValue if it's > 0, otherwise phase duration.

        if (currentCountdownValue <= 0) { // If countdown finished before pause or was at 0
           currentCountdownValue = phase.duration; // Restart full phase countdown
        }

        updateUICircleAndText(phase.name, phase.animationClass); // Ensure UI is correct
        startCountdownDisplay(); // Restart the visual countdown
        startSessionTimer(); // Resume session timer

        // Resume phase timer for the remaining duration of the current phase
        // currentPhaseTimer was cleared on pause. We need to set a new one.
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
        }, currentCountdownValue * 1000); // Use remaining time for phase transition

        startButton.textContent = 'Pause';
        instructionText.textContent = phase.name;
    }


    // --- UI Update functions ---
    function updateUICircleAndText(phaseName, animationClass) {
        instructionText.textContent = phaseName;
        // Manage circle animation classes
        breathingCircle.classList.remove('inhale', 'exhale', 'hold'); // Remove all phase-specific classes
        if (animationClass) {
            breathingCircle.classList.add(animationClass);
        }
        // Ensure the base 'circle' class is always present if others are removed.
        // This is implicitly handled by removing specific classes and adding new ones.
        // If no animationClass, it defaults to the base .circle style.
    }

    function playPhaseSound(soundId) {
        // This will be detailed in Sound Implementation step
        if (soundEnabled && soundId) {
            const soundElement = document.getElementById(soundId);
            if (soundElement) {
                soundElement.currentTime = 0;
                soundElement.play().catch(e => console.warn("Sound play failed:", e));
            }
        }
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
