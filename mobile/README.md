# IlmConnect Mobile App (Expo / React Native)

Cross-platform mobile application for Ghanaian Islamic learners, built with Expo Router and TypeScript, featuring a Jibreel-inspired minimalist interface.

---

## 1. Quick Start

### Start Development Server
```bash
cd mobile
npm start
```
From the interactive terminal:
* Press `a` to open in Android Emulator
* Press `i` to open in iOS Simulator (macOS only)
* Press `w` to open in Web Browser
* Scan the QR code using the **Expo Go** app on your physical Android or iPhone.

---

## 2. Navigation Architecture

```
app/
├── _layout.tsx                 # Root layout (Auth check, Stack navigator, Theme)
├── index.tsx                   # Splash / redirect gate
├── auth/
│   ├── login.tsx               # Sign In (Email/Phone + Password, Demo Login)
│   └── register.tsx            # Create Account (Name, Email/Phone, Gender, Password)
├── onboarding/
│   └── index.tsx               # 3-Step Diagnostic Questionnaire:
│                               #   1. Knowledge Level (Beginner to Advanced)
│                               #   2. Learning Goals (Qur'an, Tajweed, Fiqh, Arabic)
│                               #   3. Preferred Format (1-on-1, Group Madrassa, Combo)
└── (tabs)/
    ├── _layout.tsx             # 4-tab bar navigation with custom emerald styling
    ├── index.tsx               # Tab 1: Explore (Verified Scholars & Group Classes, Filter Pills)
    ├── learning.tsx            # Tab 2: My Learning (Active 1-on-1 Mentors & Google Meet links)
    ├── questions.tsx           # Tab 3: Fatwa & Q&A (Community Board, Anonymous Ask Modal)
    └── profile.tsx             # Tab 4: Profile (Learner stats, knowledge level, Sign Out)
```

---

## 3. Connecting to the Backend
The API client is located in `src/api/client.ts`. It connects automatically:
* **Android Emulator:** `http://10.0.2.2:8080/api/v1`
* **iOS Simulator / Web:** `http://localhost:8080/api/v1`
* **Physical Device:** Update `HOST` in `src/api/client.ts` with your computer's local Wi-Fi IP address (e.g. `http://192.168.1.50:8080`).

---

## 4. UI/UX Philosophy
Inspired by **Jibreel**:
* **Surface Palette:** Warm Sand (`#FAF9F5`) and Deep Islamic Forest Green (`#064E3B`).
* **Distraction-Free:** No banner ads or arcade game bloat.
* **Direct Class Integration:** One-tap button to open live Google Meet / Zoom class sessions.

