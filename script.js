/*
This script.js file contains all the client-side logic for the SerenityBreath web application.
It is responsible for handling user interactions, managing the state of the breathing exercises,
controlling animations, playing sounds, and managing settings using localStorage.
This script is loaded by index.html and manipulates the DOM elements defined within it.
*/

// The main function is wrapped in a 'DOMContentLoaded' event listener.
// This ensures that the script only runs after the entire HTML document has been loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    // Get references to all necessary DOM elements from index.html.
    // This allows the script to interact with these elements (e.g., read values, change text, add event listeners).
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

    // Constants defining the visual behavior of the breathing circle animation.
    const MAX_SCALE = 1.2; // The maximum size the circle scales to (during inhale).
    const MIN_SCALE_NO_HOLD_AFTER = 0.1; // The minimum size for an exhale not followed by a hold.
    const MIN_VISIBLE_HOLD_SCALE = 0.5;   // A slightly larger minimum size for exhales followed by a hold, making the hold phase more noticeable.

    // Setup for the Web Audio API to generate sounds programmatically.
    let audioCtx = null; // The AudioContext is the central point for all audio operations.

    /**
     * Initializes the Web Audio API's AudioContext.
     * This is necessary to play any sound and is best practice to create it only once,
     * ideally in response to a user interaction to comply with browser autoplay policies.
     */
    function initAudioContext() {
        if (!audioCtx) {
            try {
                // Creates a new AudioContext. 'webkitAudioContext' is for older Safari versions.
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                soundEnabled = false; // If API is not supported, disable sound functionality.
                updateSoundToggleUI(); // Update the UI to reflect that sound is off.
            }
        }
    }

    /**
     * Generates a simple sound with a specific frequency, type, duration, and volume.
     * This function is the core of the audio feedback system.
     * @param {number} frequency - The pitch of the sound in Hz.
     * @param {string} type - The waveform type (e.g., 'sine', 'square', 'triangle').
     * @param {number} durationSeconds - How long the sound should play.
     * @param {number} volume - The gain (loudness) of the sound.
     * @param {string} phaseNameForLog - A label for logging purposes.
     */
    function generateSound(frequency, type = 'sine', durationSeconds = 0.5, volume = 0.3, phaseNameForLog = "Unknown") {
        // Do not proceed if the audio context isn't available or if sound is disabled by the user.
        if (!audioCtx || !soundEnabled) {
            return;
        }

        // Create an OscillatorNode to generate the sound wave.
        const oscillator = audioCtx.createOscillator();
        // Create a GainNode to control the volume.
        const gainNode = audioCtx.createGain();

        // Configure the oscillator's properties.
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        // Configure the gain node to control the volume and create a fade-out effect to prevent clicking sounds.
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + durationSeconds);

        // Connect the nodes: oscillator -> gain -> destination (speakers).
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Start and stop the oscillator to play the sound for the specified duration.
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + durationSeconds);
    }

    // Specific sound generation functions for each phase of the breathing exercise.
    function generateInhaleSound() { generateSound(660, 'triangle', 0.4, 0.25, "Inhale"); }
    function generateExhaleSound() { generateSound(440, 'sine', 0.6, 0.2, "Exhale"); }
    function generateHoldSound() { generateSound(330, 'square', 0.7, 0.2, "Hold"); }


    // Variables to manage the application's state.
    let currentExercise = null;      // The currently selected breathing exercise object.
    let currentPhaseIndex = 0;       // Index of the current phase within the exercise.
    let currentPhaseTimer = null;    // A setTimeout ID for the duration of the current phase.
    let countdownTimer = null;       // A setInterval ID for the 1-second countdown display.
    let currentCountdownValue = 0;   // The current number displayed in the countdown.
    let exerciseIsRunning = false;   // Flag indicating if an exercise is active.
    let exerciseIsPaused = false;    // Flag indicating if the active exercise is paused.
    let completedCycles = 0;         // Counter for the number of breathing cycles completed.
    let sessionStartTime = null;     // Timestamp when the session started, for the timer.
    let sessionTimerInterval = null; // A setInterval ID for the session timer.
    let soundEnabled = true;         // Flag for whether sound is on or off.

    // An object containing the definitions for all breathing exercises.
    // Each exercise has a name, a description, and an array of phases.
    // Each phase defines its name, duration, sound, and a CSS class for animation.
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
        "custom": {
            name: "Custom Breathing",
            description: "Define your own breathing pattern.",
            phases: [] // This is populated by user input.
        }
    };

    // Keys used for storing and retrieving settings from the browser's localStorage.
    const CUSTOM_SETTINGS_KEY = 'serenityBreathCustomSettings';
    const SOUND_PREF_KEY = 'serenityBreathSoundPref';

    // Initial setup of the user interface on page load.
    instructionText.textContent = 'Select an exercise and press Start';
    countdownNumber.textContent = '';
    stopButton.disabled = true; // The stop button is disabled until an exercise starts.


    // --- Event Listeners Setup ---

    // Adds a click event listener to each exercise selection button.
    exerciseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedExerciseKey = button.dataset.exercise;

            // If an exercise is already running, stop it before starting a new one.
            if (exerciseIsRunning) {
                stopExercise();
            }

            // Manages the 'active' class to visually highlight the selected exercise.
            exerciseButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Set the current exercise based on the button clicked.
            currentExercise = exercises[selectedExerciseKey];

            // If 'custom' is selected, show the customization area.
            if (selectedExerciseKey === 'custom') {
                customizationArea.style.display = 'block';
                loadCustomSettings(); // Load any saved custom settings.
                currentExercise = exercises.custom;
            } else {
                customizationArea.style.display = 'none';
            }

            // Reset the UI to be ready for the new selection.
            resetUIForNewSelection(selectedExerciseKey);

            // Ensure the start/stop buttons are in the correct state.
            startButton.textContent = 'Start';
            startButton.disabled = false;
            stopButton.disabled = true;
        });
    });

    /**
     * Resets parts of the UI when a new exercise is selected.
     * @param {string} exerciseKey - The key of the selected exercise (e.g., "box").
     */
    function resetUIForNewSelection(exerciseKey) {
        const selectedExerciseData = exercises[exerciseKey];
        if (selectedExerciseData) {
            instructionText.textContent = selectedExerciseData.description || `Get ready for ${selectedExerciseData.name}`;
        } else {
            instructionText.textContent = "Select an exercise.";
        }
        countdownNumber.textContent = '';
        breathingCircle.className = 'circle';
        breathingCircle.style.transform = 'scale(1)';
        breathingCircle.style.transition = 'transform 1s ease-in-out, background-color 1s ease-in-out';

        // Reset session metrics.
        completedCycles = 0;
        updateCycleCountDisplay();
        sessionTimerDisplay.textContent = "00:00";
        sessionStartTime = null;
    }

    // Handles clicks on the main Start/Pause/Resume button.
    startButton.addEventListener('click', () => {
        if (exerciseIsRunning && !exerciseIsPaused) {
            pauseExercise();
        } else if (exerciseIsRunning && exerciseIsPaused) {
            resumeExercise();
        } else {
            startExercise();
        }
    });

    // Handles clicks on the Stop button.
    stopButton.addEventListener('click', () => {
        stopExercise();
    });

    // Handles clicks on the 'Apply' button in the custom settings area.
    applyCustomButton.addEventListener('click', () => {
        const inhale = parseInt(inhaleDurationInput.value);
        const hold1 = parseInt(hold1DurationInput.value);
        const exhale = parseInt(exhaleDurationInput.value);
        const hold2 = parseInt(hold2DurationInput.value);

        // Basic validation for custom durations.
        if (inhale <= 0 || exhale <= 0 || hold1 < 0 || hold2 < 0 || (inhale + hold1 + exhale + hold2) === 0) {
            alert("Durations must be positive, and at least one phase must be greater than 0. Hold durations can be 0.");
            return;
        }

        // Update the custom exercise configuration and save it to localStorage.
        updateCustomExerciseConfig(inhale, hold1, exhale, hold2);
        saveCustomSettings({ inhale, hold1, exhale, hold2 });
        instructionText.textContent = 'Custom settings applied. Select "Custom Breathing" and press Start.';

        // If custom is currently active, refresh its state.
        if (currentExercise && currentExercise.name === "Custom Breathing") {
             currentExercise = exercises.custom;
             resetUIForNewSelection('custom');
        }
    });

    // Handles clicks on the sound toggle button.
    soundToggleButton.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        updateSoundToggleUI();
        saveSoundPreference();
    });

    /**
     * Updates the UI of the sound toggle button (text and icon opacity).
     */
    function updateSoundToggleUI() {
        soundStatusText.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
        soundToggleButton.querySelector('svg').style.opacity = soundEnabled ? 1 : 0.5;
    }

    // --- LocalStorage Functions ---

    /**
     * Saves the custom breathing settings to localStorage.
     * @param {object} settings - The custom settings object to save.
     */
    function saveCustomSettings(settings) {
        try {
            localStorage.setItem(CUSTOM_SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Error saving custom settings to localStorage:", e);
        }
    }

    /**
     * Loads custom breathing settings from localStorage and updates the UI and exercise configuration.
     */
    function loadCustomSettings() {
        try {
            const savedSettings = localStorage.getItem(CUSTOM_SETTINGS_KEY);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                inhaleDurationInput.value = parsedSettings.inhale;
                hold1DurationInput.value = parsedSettings.hold1;
                exhaleDurationInput.value = parsedSettings.exhale;
                hold2DurationInput.value = parsedSettings.hold2;
                updateCustomExerciseConfig(parsedSettings.inhale, parsedSettings.hold1, parsedSettings.exhale, parsedSettings.hold2);
            } else {
                // If no settings are saved, configure the custom exercise with the default values from the input fields.
                updateCustomExerciseConfig(
                    parseInt(inhaleDurationInput.value),
                    parseInt(hold1DurationInput.value),
                    parseInt(exhaleDurationInput.value),
                    parseInt(hold2DurationInput.value)
                );
            }
        } catch (e) {
            console.error("Error loading custom settings from localStorage:", e);
        }
    }

    /**
     * Saves the user's sound preference (on/off) to localStorage.
     */
    function saveSoundPreference() {
        try {
            localStorage.setItem(SOUND_PREF_KEY, JSON.stringify(soundEnabled));
        } catch (e) {
            console.error("Error saving sound preference to localStorage:", e);
        }
    }

    /**
     * Loads the sound preference from localStorage and updates the application state.
     */
    function loadSoundPreference() {
        try {
            const savedPref = localStorage.getItem(SOUND_PREF_KEY);
            if (savedPref !== null) {
                soundEnabled = JSON.parse(savedPref);
            }
        } catch (e) {
            console.error("Error loading sound preference from localStorage:", e);
            soundEnabled = true; // Default to true if there's an error.
        }
        updateSoundToggleUI();
    }

    /**
     * Updates the 'exercises.custom' object with new phase durations.
     * @param {number} inhale - Duration for inhale.
     * @param {number} hold1 - Duration for hold after inhale.
     * @param {number} exhale - Duration for exhale.
     * @param {number} hold2 - Duration for hold after exhale.
     */
    function updateCustomExerciseConfig(inhale, hold1, exhale, hold2) {
        exercises.custom.phases = [];
        if (inhale > 0) exercises.custom.phases.push({ name: "Inhale", duration: inhale, soundId: 'inhaleSound', animationClass: "inhale" });
        if (hold1 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold1, soundId: 'holdSound', animationClass: "hold" });
        if (exhale > 0) exercises.custom.phases.push({ name: "Exhale", duration: exhale, soundId: 'exhaleSound', animationClass: "exhale" });
        if (hold2 > 0) exercises.custom.phases.push({ name: "Hold", duration: hold2, soundId: 'holdSound', animationClass: "hold" });

        // Generate a dynamic description for the custom exercise.
        let desc = "Custom: " + (exercises.custom.phases.length > 0 ? exercises.custom.phases.map(p => `${p.name.charAt(0)}${p.duration}s`).join('-') : "No phases defined.");
        exercises.custom.description = desc;

        // If the custom exercise is currently selected, update the UI to reflect the new configuration.
        const activeButton = document.querySelector('.exercise-btn.active');
        if (activeButton && activeButton.dataset.exercise === 'custom') {
            currentExercise = exercises.custom;
        }
    }

    // --- State Machine & Timers ---

    /**
     * Starts the next phase of the breathing exercise. This function is called recursively via setTimeout.
     */
    function startNextPhase() {
        if (!currentExercise || !currentExercise.phases || currentExercise.phases.length === 0) {
            console.error("Cannot start next phase: current exercise or its phases are not defined.", currentExercise);
            stopExercise();
            return;
        }

        const phase = currentExercise.phases[currentPhaseIndex];
        currentCountdownValue = phase.duration;
        updateUICircleAndText(phase.name, phase.animationClass);
        startCountdownDisplay();
        playPhaseSound(phase.soundId);

        // Set a timer for the duration of the current phase.
        clearTimeout(currentPhaseTimer);
        currentPhaseTimer = setTimeout(() => {
            currentPhaseIndex++;
            // If the cycle is complete, increment the cycle counter and loop back to the start.
            if (currentPhaseIndex >= currentExercise.phases.length) {
                completedCycles++;
                updateCycleCountDisplay();
                currentPhaseIndex = 0;
            }
            // If the exercise is still running, start the next phase.
            if (exerciseIsRunning && !exerciseIsPaused) {
                startNextPhase();
            }
        }, phase.duration * 1000);
    }

    /**
     * Manages the visual countdown and the circle scaling animation.
     */
    function startCountdownDisplay() {
        clearInterval(countdownTimer);
        const phase = currentExercise.phases[currentPhaseIndex];
        const totalDuration = phase.duration;
        currentCountdownValue = 1;

        countdownNumber.textContent = currentCountdownValue;

        // Set the initial scale of the circle based on the current phase.
        if (phase.name === "Inhale") {
            breathingCircle.style.transform = `scale(${MIN_SCALE_NO_HOLD_AFTER})`;
        } else if (phase.name === "Exhale") {
            breathingCircle.style.transform = `scale(${MAX_SCALE})`;
        } else if (phase.name === "Hold") {
            // Holds maintain the scale of the previous phase.
            const previousPhase = currentExercise.phases[(currentPhaseIndex - 1 + currentExercise.phases.length) % currentExercise.phases.length];
            breathingCircle.style.transform = `scale(${previousPhase.name === "Inhale" ? MAX_SCALE : MIN_VISIBLE_HOLD_SCALE})`;
        }

        // Use a linear transition for smooth scaling over time.
        breathingCircle.style.transition = `transform ${100 / 1000}s linear, background-color 1s ease-in-out`;

        countdownTimer = setInterval(() => {
            countdownNumber.textContent = currentCountdownValue;
            const animationProgress = currentCountdownValue / totalDuration;

            // Animate the circle's scale based on the progress through the current phase.
            if (phase.name === "Inhale") {
                const scale = MIN_SCALE_NO_HOLD_AFTER + ((MAX_SCALE - MIN_SCALE_NO_HOLD_AFTER) * animationProgress);
                breathingCircle.style.transform = `scale(${Math.min(scale, MAX_SCALE)})`;
            } else if (phase.name === "Exhale") {
                const nextPhase = currentExercise.phases[(currentPhaseIndex + 1) % currentExercise.phases.length];
                const targetExhaleScale = (nextPhase && nextPhase.name === "Hold") ? MIN_VISIBLE_HOLD_SCALE : MIN_SCALE_NO_HOLD_AFTER;
                const scale = MAX_SCALE - ((MAX_SCALE - targetExhaleScale) * animationProgress);
                breathingCircle.style.transform = `scale(${Math.max(scale, targetExhaleScale)})`;
            }

            if (currentCountdownValue >= totalDuration) {
                clearInterval(countdownTimer);
                // Ensure the final scale is set precisely at the end of the phase.
                if (phase.name === "Inhale") {
                    breathingCircle.style.transform = `scale(${MAX_SCALE})`;
                } else if (phase.name === "Exhale") {
                    const nextPhase = currentExercise.phases[(currentPhaseIndex + 1) % currentExercise.phases.length];
                    const finalExhaleTarget = (nextPhase && nextPhase.name === "Hold") ? MIN_VISIBLE_HOLD_SCALE : MIN_SCALE_NO_HOLD_AFTER;
                    breathingCircle.style.transform = `scale(${finalExhaleTarget})`;
                }
            } else {
                currentCountdownValue++;
            }
        }, 1000);
    }

    /**
     * Clears all active timers (phase, countdown, and session).
     */
    function clearAllTimers() {
        clearInterval(countdownTimer);
        clearTimeout(currentPhaseTimer);
        clearInterval(sessionTimerInterval);
        currentPhaseTimer = null;
        countdownTimer = null;
        sessionTimerInterval = null;
    }

    /**
     * Starts a new breathing exercise session.
     */
    function startExercise() {
        if (!currentExercise || (currentExercise.name === "Custom Breathing" && exercises.custom.phases.length === 0)) {
            instructionText.textContent = 'Please select a valid exercise first!';
            return;
        }

        exerciseIsRunning = true;
        exerciseIsPaused = false;
        completedCycles = 0;
        currentPhaseIndex = 0;
        updateCycleCountDisplay();
        startSessionTimer();

        // Quickly reset circle to a small size before the first inhale animation.
        breathingCircle.style.transition = 'transform 0.1s linear, background-color 1s ease-in-out';
        breathingCircle.style.transform = 'scale(0.1)';

        startNextPhase();

        startButton.textContent = 'Pause';
        stopButton.disabled = false;
    }

    /**
     * Stops the currently running exercise and resets the UI.
     */
    function stopExercise() {
        exerciseIsRunning = false;
        exerciseIsPaused = false;
        clearAllTimers();
        resetSessionMetrics();
        resetUIToInitialState();
        startButton.textContent = 'Start';
        stopButton.disabled = true;
        instructionText.textContent = 'Exercise stopped. Select an exercise and press Start.';
        breathingCircle.style.transform = 'scale(1)';
        breathingCircle.style.transition = 'transform 1s ease-in-out, background-color 1s ease-in-out';
    }

    /**
     * Pauses the currently running exercise.
     */
    function pauseExercise() {
        if (!exerciseIsRunning || exerciseIsPaused) return;
        exerciseIsPaused = true;
        clearAllTimers();
        instructionText.textContent = `Paused. Press Resume.`;
        startButton.textContent = 'Resume';
    }

    /**
     * Resumes a paused exercise.
     */
    function resumeExercise() {
        if (!exerciseIsRunning || !exerciseIsPaused) return;
        exerciseIsPaused = false;
        const phase = currentExercise.phases[currentPhaseIndex];

        // Restart timers and UI updates for the current phase.
        updateUICircleAndText(phase.name, phase.animationClass, false);
        startCountdownDisplay();
        startSessionTimer();

        // Set a timer to transition to the next phase.
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
    }


    // --- UI Update Functions ---

    /**
     * Updates the instruction text and the circle's background color.
     * @param {string} phaseName - The name of the current phase (e.g., "Inhale").
     * @param {string} animationClass - The CSS class for the current phase.
     */
    function updateUICircleAndText(phaseName, animationClass) {
        instructionText.textContent = phaseName;
        breathingCircle.className = 'circle ' + animationClass; // Set class for color.
    }

    /**
     * Plays the appropriate sound for the current phase.
     * @param {string} soundId - The ID of the sound to play.
     */
    function playPhaseSound(soundId) {
        initAudioContext(); // Ensure AudioContext is ready.
        if (!soundEnabled || !audioCtx || !soundId) return;

        if (soundId === 'inhaleSound') generateInhaleSound();
        else if (soundId === 'exhaleSound') generateExhaleSound();
        else if (soundId === 'holdSound') generateHoldSound();
    }

    /**
     * Updates the cycle count display on the page.
     */
    function updateCycleCountDisplay() {
        cycleCountDisplay.textContent = completedCycles;
    }

    /**
     * Resets the session metrics (cycle count and timer display).
     */
    function resetSessionMetrics() {
        completedCycles = 0;
        updateCycleCountDisplay();
        sessionTimerDisplay.textContent = "00:00";
        sessionStartTime = null;
    }

    /**
     * Resets the UI to its initial state before an exercise starts.
     */
    function resetUIToInitialState() {
        breathingCircle.className = 'circle';
        countdownNumber.textContent = '';
        instructionText.textContent = 'Select an exercise and press Start';
    }

    // --- Session Timer Functions ---

    /**
     * Starts or resumes the session timer.
     */
    function startSessionTimer() {
        clearInterval(sessionTimerInterval);
        if (!sessionStartTime) {
            sessionStartTime = Date.now();
        } else {
            // Adjust start time when resuming from a pause.
            sessionStartTime = Date.now() - (parsedTimeInSeconds(sessionTimerDisplay.textContent) * 1000);
        }

        sessionTimerInterval = setInterval(() => {
            const elapsedTime = Date.now() - sessionStartTime;
            sessionTimerDisplay.textContent = formatTime(elapsedTime);
        }, 1000);
    }

    /**
     * Parses a time string (MM:SS) into total seconds.
     * @param {string} timeString - The time string to parse.
     * @returns {number} The total time in seconds.
     */
    function parsedTimeInSeconds(timeString) {
        const parts = timeString.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    /**
     * Formats milliseconds into a MM:SS time string.
     * @param {number} milliseconds - The time in milliseconds.
     * @returns {string} The formatted time string.
     */
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    // Initial calls on page load to set up the application based on stored preferences.
    loadCustomSettings();
    loadSoundPreference();

    console.log('SerenityBreath app initialized.');
});
