# MIRA Mobile App (Patient Cognitive Assistance & Memory Prosthetic)

A high-accessibility React Native / Expo application designed for elderly dementia patients, featuring voice-assisted guidance, real-time facial recognition assistance, and 3 cognitive training games with automated telemetry tracking.

## Key Features

- **Elder Accessibility**:
  - Minimum 72px–80px touch target sizes for primary buttons.
  - High-contrast dark theme (`#0F172A` Slate Dark) with WCAG AAA compliant text and vibrant action cards.
  - Zero nested submenus; flat linear navigation flow.
  - Built-in Text-to-Speech audio guide (`expo-speech`) and haptic feedback (`expo-haptics`).
- **Google OAuth Only**: Strict Google Gmail authentication without phone/OTP hurdles.
- **AI Vision**: Facial recognition viewport simulation with bounding box overlays, confidence verification, and voice readback of family member relations & core memories.
- **Brain Games Hub**:
  - `Card Match`: 2x2 visual memory matching grid.
  - `Auditory Recall`: Sound-to-image recognition with audio cues.
  - `Maths Comparison`: High-contrast split screen greater-than numerical decision training.
- **Automated Telemetry**: Automatically measures and dispatches reaction time in milliseconds, error counts, and completion durations to the Caretaker Portal.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```
