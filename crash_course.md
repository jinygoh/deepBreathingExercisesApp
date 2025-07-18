# SerenityBreath Crash Course

Welcome to the SerenityBreath web application! This document will give you a quick overview of the project structure, how the files work together, and how to use the application.

## Project Structure

The project is composed of three main files:

*   `index.html`: The main HTML file that defines the structure of the web page.
*   `style.css`: The CSS file that styles the application, giving it a calm and serene look and feel.
*   `script.js`: The JavaScript file that contains all the logic for the application, including the breathing exercises, animations, and user interactions.

## How the Files Work Together

1.  **`index.html`**: This is the entry point of the application. It defines all the elements you see on the page, such as the title, the breathing circle, the buttons, and the settings area. It links to `style.css` for styling and `script.js` for functionality.

    *   **Example:** The breathing circle is defined in `index.html` with the following code:
        ```html
        <div class="circle" id="breathingCircle">
            <span id="countdownNumber"></span>
        </div>
        ```

2.  **`style.css`**: This file is responsible for the visual appearance of the application. It defines the colors, fonts, layout, and animations. The styles are organized into sections to make them easy to understand and maintain.

    *   **Example:** The animation of the breathing circle is defined in `style.css` with the following code:
        ```css
        .circle {
            transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.8s ease-in-out;
        }

        .circle.inhale {
            background-color: #7FBAB2; /* Lighter Serene Teal */
        }

        .circle.exhale {
            background-color: #5E9C94; /* Main Serene Teal */
        }
        ```

3.  **`script.js`**: This file contains the "brains" of the application. It handles all the user interactions, such as clicking buttons, and manages the state of the application. It also controls the breathing exercises, including the timing of each phase (inhale, hold, exhale) and the animations.

    *   **Example:** The logic for the "4-7-8 Breathing" exercise is defined in `script.js` with the following code:
        ```javascript
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
            // ... other exercises
        };
        ```

## How to Use the Application

1.  **Select an Exercise**: Click on one of the exercise buttons at the top of the page to choose a breathing exercise. You can choose from predefined exercises like "4-7-8 Breathing" or "Box Breathing", or you can create your own custom exercise.

2.  **Start the Exercise**: Click the "Start" button to begin the breathing exercise. The breathing circle will start to animate, and the instruction text will guide you through each phase of the exercise.

3.  **Follow the Guide**: Follow the visual guide of the breathing circle and the instruction text to perform the breathing exercise. The circle will expand as you inhale and shrink as you exhale.

4.  **Pause and Stop**: You can pause the exercise at any time by clicking the "Pause" button. To resume, click the "Resume" button. To stop the exercise completely, click the "Stop" button.

5.  **Custom Exercise**: If you select the "Custom Breathing" exercise, a customization area will appear where you can set the duration of each phase (inhale, hold, exhale). Click the "Apply" button to save your custom settings.

6.  **Sound**: You can toggle the sound on or off by clicking the sound icon in the bottom left corner of the page.

We hope you enjoy using the SerenityBreath application!
