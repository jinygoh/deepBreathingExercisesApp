package com.example.serenitybreath.model

data class BreathingPhase(
    val name: String,
    val duration: Int, // in seconds
    val soundId: String? = null // Placeholder for sound mapping
)

data class Exercise(
    val id: String,
    val name: String,
    val description: String,
    val phases: List<BreathingPhase>
)

// Predefined exercises
object Exercises {
    val B478 = Exercise(
        id = "4-7-8",
        name = "4-7-8 Breathing",
        description = "Inhale for 4s, Hold for 7s, Exhale for 8s.",
        phases = listOf(
            BreathingPhase("Inhale", 4, "inhaleSound"),
            BreathingPhase("Hold", 7, "holdSound"),
            BreathingPhase("Exhale", 8, "exhaleSound")
        )
    )

    val Box = Exercise(
        id = "box",
        name = "Box Breathing",
        description = "Inhale for 4s, Hold for 4s, Exhale for 4s, Hold for 4s.",
        phases = listOf(
            BreathingPhase("Inhale", 4, "inhaleSound"),
            BreathingPhase("Hold", 4, "holdSound"),
            BreathingPhase("Exhale", 4, "exhaleSound"),
            BreathingPhase("Hold", 4, "holdSound")
        )
    )

    val Diaphragmatic = Exercise(
        id = "diaphragmatic",
        name = "Diaphragmatic Breathing",
        description = "Inhale slowly (4s), Exhale slowly (6s).",
        phases = listOf(
            BreathingPhase("Inhale", 4, "inhaleSound"),
            BreathingPhase("Exhale", 6, "exhaleSound")
        )
    )

    val PursedLip = Exercise(
        id = "pursed-lip",
        name = "Pursed-Lip Breathing",
        description = "Inhale normally (2s), Exhale slowly (4s) through pursed lips.",
        phases = listOf(
            BreathingPhase("Inhale", 2, "inhaleSound"),
            BreathingPhase("Exhale", 4, "exhaleSound")
        )
    )

    fun defaultCustomExercise() = Exercise(
        id = "custom",
        name = "Custom Breathing",
        description = "Define your own breathing pattern.",
        phases = listOf(
            BreathingPhase("Inhale", 4, "inhaleSound"),
            BreathingPhase("Hold", 7, "holdSound"),
            BreathingPhase("Exhale", 8, "exhaleSound"),
            BreathingPhase("Hold", 0, "holdSound")
        )
    )

    val allExercises: List<Exercise> = listOf(B478, Box, Diaphragmatic, PursedLip, defaultCustomExercise())

    fun getExerciseById(id: String): Exercise? {
        return allExercises.find { it.id == id } ?: if (id == "custom") defaultCustomExercise() else null
    }

    fun updateCustomExercise(inhale: Int, hold1: Int, exhale: Int, hold2: Int): Exercise {
        val phases = mutableListOf<BreathingPhase>()
        if (inhale > 0) phases.add(BreathingPhase("Inhale", inhale, "inhaleSound"))
        if (hold1 > 0) phases.add(BreathingPhase("Hold", hold1, "holdSound"))
        if (exhale > 0) phases.add(BreathingPhase("Exhale", exhale, "exhaleSound"))
        if (hold2 > 0) phases.add(BreathingPhase("Hold", hold2, "holdSound"))

        val description = "Custom: " + phases.joinToString("-") { "${it.name.first()}${it.duration}s" }
            .ifEmpty { "No phases defined." }

        return Exercise("custom", "Custom Breathing", description, phases)
    }
}
