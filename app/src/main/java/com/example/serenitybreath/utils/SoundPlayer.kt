package com.example.serenitybreath.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.util.Log

// Sound constants matching web app's intent
const val INHALE_SOUND = "inhaleSound"
const val EXHALE_SOUND = "exhaleSound"
const val HOLD_SOUND = "holdSound"

class SoundPlayer(private val context: Context) {

    private var soundPool: SoundPool? = null
    private val soundMap = mutableMapOf<String, Int>()
    private var soundEnabled = true

    init {
        try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            soundPool = SoundPool.Builder()
                .setMaxStreams(3)
                .setAudioAttributes(audioAttributes)
                .build()

            // In a real app, you would load actual sound files from res/raw
            // For this example, we are just preparing the map.
            // soundMap[INHALE_SOUND] = soundPool?.load(context, R.raw.inhale_tone, 1) ?: 0
            // soundMap[EXHALE_SOUND] = soundPool?.load(context, R.raw.exhale_tone, 1) ?: 0
            // soundMap[HOLD_SOUND] = soundPool?.load(context, R.raw.hold_tone, 1) ?: 0
            // Since we don't have R.raw files, these will effectively be 0 or cause errors if used.
            // This setup is for structure demonstration. Actual sound loading needs raw resources.

            Log.d("SoundPlayer", "SoundPool initialized.")
            // Simulate loading for now, as we don't have raw resources
            soundMap[INHALE_SOUND] = 1 // Placeholder ID
            soundMap[EXHALE_SOUND] = 2 // Placeholder ID
            soundMap[HOLD_SOUND] = 3   // Placeholder ID

        } catch (e: Exception) {
            Log.e("SoundPlayer", "Error initializing SoundPool: ${e.message}")
            soundPool = null
        }
    }

    fun playSound(soundId: String?) {
        if (!soundEnabled || soundPool == null || soundId == null) {
            Log.d("SoundPlayer", "Sound not played: enabled=$soundEnabled, poolNull=${soundPool==null}, soundId=$soundId")
            return
        }

        soundMap[soundId]?.let { resId ->
            if (resId > 0) { // In real scenario, check if load was successful
                try {
                    soundPool?.play(resId, 1f, 1f, 1, 0, 1f)
                    Log.d("SoundPlayer", "Playing sound: $soundId (ID: $resId)")
                } catch (e: Exception) {
                    Log.e("SoundPlayer", "Error playing sound $soundId: ${e.message}")
                }
            } else {
                Log.w("SoundPlayer", "Sound ID $resId for $soundId not loaded or invalid.")
            }
        } ?: Log.w("SoundPlayer", "Sound key $soundId not found in soundMap.")
    }

    fun setSoundEnabled(enabled: Boolean) {
        soundEnabled = enabled
        if (!enabled && soundPool != null) {
            // Optionally stop all sounds if disabling
            // soundMap.values.forEach { soundPool?.stop(it) }
        }
        Log.d("SoundPlayer", "Sound enabled set to: $enabled")
    }

    fun release() {
        soundPool?.release()
        soundPool = null
        Log.d("SoundPlayer", "SoundPool released.")
    }
}
// Note: To make this fully functional:
// 1. Add actual sound files (e.g., short .ogg or .wav) to your project's `res/raw` directory.
// 2. Uncomment and replace `R.raw.inhale_tone`, etc., with your actual resource IDs in the `init` block.
// 3. Ensure SoundPlayer is instantiated with a valid Context, typically from an Activity or Application context.
// 4. Manage the lifecycle of SoundPlayer (e.g., call release() when no longer needed, like in onDestroy of an Activity or ViewModel's onCleared).
// 5. For the Web Audio API's tone generation (sine, triangle, square waves),
//    Android's AudioTrack class would be needed for direct PCM stream generation,
//    which is more complex than SoundPool for pre-recorded samples.
//    Given the simplicity of the web app's sounds, short pre-recorded tones are a more straightforward approach for native.
