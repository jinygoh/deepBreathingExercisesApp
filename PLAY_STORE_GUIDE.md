# Guide to Uploading Your SerenityBreath Android App to Google Play Store

This guide provides a checklist of steps to help you upload your Android app (`.aab` file) to the Google Play Store.

## 1. Final Technical Preparation & Build

*   **[ ] App ID:** Ensure `applicationId` in `app/build.gradle.kts` is unique (e.g., `com.yourdomain.serenitybreath`).
*   **[ ] Versioning:**
    *   Set `versionCode` (e.g., 1, increment for each update).
    *   Set `versionName` (e.g., "1.0.0").
*   **[ ] Generate Signing Key:**
    *   In Android Studio: `Build > Generate Signed Bundle / APK...`.
    *   Choose "Android App Bundle (AAB)".
    *   Create a new keystore if you don't have one.
    *   **IMPORTANT: Securely back up your keystore file and remember its passwords. Losing it means you can't update your app.**
*   **[ ] Configure Release Build:**
    *   Ensure your `app/build.gradle.kts` is set up for release signing using the key you generated.
    *   Enable code shrinking: `isMinifyEnabled = true` for release builds.
*   **[ ] Build Release AAB:**
    *   In Android Studio: `Build > Build Bundle(s) / APK(s) > Build Bundle(s)`.
    *   Or using terminal: `./gradlew bundleRelease`.
    *   The AAB will be located in `app/build/outputs/bundle/release/`.
*   **[ ] Test Release Build:** Thoroughly test the signed AAB (e.g., by installing it directly on a device or using internal testing).

## 2. Google Play Console Setup

*   **[ ] Create Developer Account:** If you don't have one, sign up at `play.google.com/console` (one-time fee).
*   **[ ] Create New App:**
    *   Click "Create app".
    *   Fill in App Name (e.g., "SerenityBreath"), language, app type (App), free/paid (Free).
    *   Agree to policies.

## 3. Complete Store Listing (Under "Main store listing")

*   **[ ] App Name:** Max 30 chars (e.g., "SerenityBreath: Calm Breathing").
*   **[ ] Short Description:** Max 80 chars.
    *   *Example: "Guided breathing exercises like 4-7-8 & Box Breathing to find calm and reduce stress."*
*   **[ ] Full Description:** Max 4000 chars. Detail features and benefits.
*   **[ ] Graphics:**
    *   **App Icon:** 512x512 px (32-bit PNG with alpha).
    *   **Feature Graphic:** 1024x500 px (JPG or 24-bit PNG, no alpha).
    *   **Screenshots:** Min 2, Max 8 (phone/tablet). Show key app screens.
    *   **Video Link (Optional):** YouTube video.
*   **[ ] Categorization:**
    *   App type: App
    *   Category: Health & Fitness (or Lifestyle).
    *   Tags (Optional).
*   **[ ] Contact Details:** Your email address.
*   **[ ] Privacy Policy:**
    *   **You MUST provide a URL to a privacy policy.**
    *   If your app collects no personal data (as SerenityBreath is currently designed), create a simple policy stating this.
    *   Host it online (e.g., GitHub Pages, Google Sites, or a simple website).
    *   *Example text for no data collection: "SerenityBreath does not collect, store, or transmit any personal user data. All settings are stored locally on your device and are not shared."*
    *   Add the URL in the "Privacy policy" field in the Play Console (under "App setup" > "Store settings" or in the "Policy" section).

## 4. App Content Section (Navigate through sections in the Play Console dashboard)

*   **[ ] Content Rating:** Complete the questionnaire. It will likely be "Everyone" for this app.
*   **[ ] Target Audience and Content:** Specify target age group (e.g., 13+, 16+, 18+).
*   **[ ] Data Safety:**
    *   This is critical. Answer accurately.
    *   For SerenityBreath (as designed, with no external data collection/sharing):
        *   **Data collection:** Select "No" if you confirm no data is collected or sent off-device. (SharedPreferences for local settings is generally fine).
        *   **Data sharing:** Select "No data shared with third parties."
        *   **Data types:** If you answered "Yes" to collection, you must specify types.
        *   Review Google's guidance on what constitutes data collection.
*   **[ ] Ads:** Declare if your app has ads (No for current version).
*   **[ ] App Access:** "All functionality is available without special access" (likely).
*   **[ ] Government Apps:** No.
*   **[ ] Financial Features:** No.

## 5. Testing Your App (Before Full Release)

*   **[ ] Internal Testing:**
    *   Upload your AAB to the "Internal testing" track.
    *   Add tester email addresses. Testers can download via a special Play Store link.
    *   This is essential for verifying the AAB installs and runs correctly.
*   **[ ] Closed/Open Testing (Optional):** For wider feedback with more users.

## 6. Upload & Rollout to Production

*   **[ ] Go to "Production" Track:** (In left menu under "Release").
*   **[ ] Create New Release.**
*   **[ ] Upload Your AAB file.**
*   **[ ] Release Name:** For your reference (e.g., "1.0.0 - Initial Release").
*   **[ ] Release Notes (What's new):** This is shown to users. Make it informative.
*   **[ ] Review:** Check for errors or warnings. Ensure all sections (Store Listing, App Content) are complete.
*   **[ ] Save and "Review release".**
*   **[ ] Start Rollout:**
    *   Choose your rollout percentage (e.g., 100% for initial launch, or a smaller percentage for a staged rollout).
    *   Confirm.

## 7. App Review by Google

*   Your app will be "In review." This can take from a few hours to several days.
*   Monitor the status in the Play Console.

## 8. App Published!

*   Once approved, your app will be live on the Google Play Store!
*   Monitor Android Vitals (crashes, ANRs) and user reviews in the Play Console.

Good luck!
