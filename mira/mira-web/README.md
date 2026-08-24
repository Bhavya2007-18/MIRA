# MIRA Caretaker Web Portal (Next.js App Router + Tailwind CSS)

A clinical and family telemetry dashboard for monitoring dementia patients' cognitive stability, reaction speeds, and managing real-time AI facial memory prosthetics.

## Key Features

- **Google OAuth Only**: Exclusive Google Gmail single sign-on paired with patient ID linking (`MIRA-8821`).
- **Interactive Telemetry Visualizations (Recharts)**:
  - **Reaction Time Trend**: 14-day continuous line chart plotted against a 1,500ms MCI clinical alert baseline threshold.
  - **Cognitive Domain Accuracy**: Bar chart breakdown of visual memory, auditory recall, and numerical logic games.
- **Cognitive Stability Metrics**:
  - Total Sessions Played, Cognitive Stability Score (%), Average Reaction Speed (ms), and Active Alert status.
- **Family Memory Prosthetic Enrollment**:
  - Drag-and-drop photo upload dropzone with real-time browser speech synthesis previews (`SpeechSynthesis`).
  - Full CRUD gallery for editing and managing enrolled loved ones and custom core memory trigger prompts.
- **Patient Switcher**: Support for multi-patient monitoring for professional care teams.

## Getting Started

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.
