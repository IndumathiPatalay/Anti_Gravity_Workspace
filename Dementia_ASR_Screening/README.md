# 🧠 Dementia ASR Screening System

A state-of-the-art, full-stack cognitive screening application designed to aid healthcare professionals and patients in detecting early signs of cognitive decline or dementia. The system utilizes **Automatic Speech Recognition (ASR)** to record, transcribe, and analyze verbal responses to contextual prompts, generating visual, data-rich diagnostic reports.

---

## 🚀 Key Features

*   **🔒 Secure Authentication**: Multi-role support for patients and researchers with bcrypt password hashing and JWT sessions.
*   **🖼️ Contextual Theme Elicitation**: Engaging visual tasks (e.g., *Gardening Workbench*, *Office Workspaces*, *Daily Activities*) to prompt rich cognitive responses.
*   **🎙️ ASR & Speech Recording**: Custom high-fidelity audio recorder integrated with browser Speech Recognition APIs to capture patient speech pattern metrics.
*   **📊 Diagnostic Metrics & Analytics**:
    *   **Cognitive Scoring**: AI-estimated scores based on vocabulary richness, grammar complexity, and coherence.
    *   **Emotional & Speed Analysis**: Real-time tracking of speaking speed (Words Per Minute), speech clarity, and emotional sentiment mapping.
    *   **Cognitive Decline Profiling**: Interactive risk levels (Low, Moderate, High) with interactive charts.
*   **📱 Seamless Responsive Design**: Premium glassmorphic interface that scales flawlessly across mobile, tablet, and desktop screens.

---

## 🛠️ Technology Stack

### **Frontend**
*   **Core**: React 19 (Functional Components & Hooks), TypeScript, Vite (Superfast builds & HMR).
*   **Routing**: React Router DOM (v7).
*   **Styling**: Pure CSS (Harmonious CSS Variables, Sleek Dark Mode theme, custom responsive grid models, dynamic hover animations).
*   **Icons**: Lucide React.
*   **Deployment Config**: Optimized `vercel.json` for custom Single Page Application path-rewriting.

### **Backend**
*   **Server**: Node.js & Express.js.
*   **Database**: SQLite3 (Local storage of users, tests, and cognitive session metadata).
*   **File Handling**: Multer (Secure handling of raw audio uploads).
*   **Security & Encryption**: bcrypt (Password hashing) & JSON Web Tokens (JWT session management).

---

## 📁 Repository Structure

```text
Dementia_ASR_Screening/
├── backend/                  # Node.js & Express REST API
│   ├── database.sqlite       # Local SQLite3 database
│   ├── db.js                 # SQLite database initializer and schemas
│   ├── server.js             # Entrypoint server script
│   ├── package.json          # Backend package dependencies
│   └── routes/               # Express routing endpoints
│       ├── auth.js           # Login & Registration logic
│       ├── sessions.js       # Cognitive report management
│       └── transcribe.js     # Audio file upload and ASR pipeline
└── frontend/                 # Client Single Page Application (SPA)
    ├── index.html            # Main HTML document
    ├── package.json          # Frontend packages & compile scripts
    ├── vercel.json           # Production rewrite rules for Vercel
    ├── src/
    │   ├── main.tsx          # Client entrypoint
    │   ├── App.tsx           # Client router and configuration
    │   ├── index.css         # Styling system (tokens, variables, dark mode layout)
    │   └── components/       # Application views
    │       ├── Welcome.tsx   # Portal onboarding screen
    │       ├── Login.tsx     # Security portal access
    │       ├── Register.tsx  # Patient enrollment & demographics setup
    │       ├── Dashboard.tsx # Historical metrics dashboard
    │       ├── ThemeSelection.tsx # Interactive visual theme selector
    │       ├── SpeechTest.tsx # ASR speech recording suite
    │       └── AnalysisReport.tsx # Cognitive analysis output & feedback charts
```

---

## ⚙️ Setup & Installation

### **Prerequisites**
*   Node.js (v18 or higher recommended)
*   npm or yarn

### **1. Backend Server Setup**
1. Navigate to the backend directory:
   ```bash
   cd Dementia_ASR_Screening/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs by default on port `5000`):
   ```bash
   node server.js
   ```

### **2. Frontend Client Setup**
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server (runs on port `5174` or the next available port):
   ```bash
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5174`.

---

## 🌐 Production & Vercel Deployment

This project is build-safe and pre-configured for Vercel deployment:
*   Running `npm run build` compiles TypeScript strictly (`tsc -b`) and bundles files into optimized chunks via Vite.
*   The `vercel.json` file redirects all virtual paths to `index.html` to allow React Router to manage clean client-side routes without page reloads.

---

## 🔒 Safety, Privacy & Design Best Practices

*   **Offline Fallbacks**: Speech-to-text operates using web standard speech synthesis APIs for instant offline/low-latency client fallbacks.
*   **Security First**: Passwords are never stored in plain-text. JWT tokens protect database queries from unauthorized requests.
*   **Enhanced UX Accessibility**: Text sizes, visual hierarchy, and high contrast styling cater directly to the target demographic of older adults.
