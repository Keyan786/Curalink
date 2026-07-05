# Curalink: Research-Grade AI Health Mentor

Curalink is a state-of-the-art AI-powered platform designed to provide evidence-based clinical research and health insights. It bridges the gap between complex medical literature and actionable knowledge by integrating directly with peer-reviewed databases like PubMed, OpenAlex, and ClinicalTrials.gov.

## 🚀 Key Features

### 🔍 Evidence-First Research Engine
*   **Multi-Source Retrieval**: Aggregates clinical data in real-time from world-class medical databases.
*   **Confidence Tiers**: Automatically classifies retrieved evidence into tiers (Very High, High, Moderate, Low) based on study relevance and impact.
*   **Clinical Trial Integration**: Provides specialized cards for ongoing and completed trials, including status, phases, and locations.

### 🛡️ Reliability 2.0 Architecture
*   **Tag-Based Guardrails**: Uses a unique orchestration layer to prevent AI hallucinations by enforcing rigid data extraction boundaries.
*   **Traceable Citations**: Every claim in the conversation is backed by selectable citations (`[1]`, `[T1]`) that link directly to verified sources.
*   **Advice Guardrails**: Proactively detects medical advice intent and redirects users to scientific landscapes rather than providing remedies.

### 📊 Intelligent Research Dashboard
*   **Emerging Themes**: Dynamically derives research keywords from your history using frequency analysis.
*   **Top Publications**: Automatically curates a reading list of the most relevant papers from your sessions.
*   **Session Persistence**: Keeps a detailed log of your research journey, allowing you to pick up where you left off.

---

## 🛠️ Technology Stack

### Frontend
- **React (Vite)**: High-performance UI framework.
- **Framer Motion**: Smooth, premium micro-animations.
- **Lucide React**: Modern iconography.
- **React Router**: Seamless SPAs routing.

### Backend
- **Node.js & Express**: Scalable server-side logic.
- **MongoDB & Mongoose**: Secure, flexible data persistence for research history.
- **JWT & Bcrypt**: Robust authentication and security.
- **Axios**: Dynamic handling of external API requests.

### AI & Research
- **Meta Llama 3.1 8B Instruct**: Deep inference via Hugging Face API.
- **Biomedical Services**: Custom aggregators for PubMed, OpenAlex, and ClinicalTrials.gov.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Hugging Face API Token

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/curalink.git
cd curalink
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
HF_TOKEN=your_hugging_face_token
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

### 3. Install Dependencies
```bash
# Root directory
npm install

# Client directory
cd client && npm install

# Server directory
cd ../server && npm install
```

### 4. Run the Application
```bash
# From the root directory (starts both server and client concurrently)
npm run dev
```

---

## 🏛️ Architecture Overview

Curalink follows the **Reliability 2.0** framework:
1.  **Request Expansion**: User queries are enriched with persistent research context (biomarkers, disease focus, location).
2.  **Evidence Synthesis**: The backend retrieves raw clinical data and injects it into a high-guard system prompt.
3.  **Audit & Repair**: The model's response is audited for structural integrity. If a JSON failure is detected, a secondary "1-shot repair" mechanism fixes the structure without altering the scientific claims.
4.  **Analytics Persistence**: Keywords and sources are saved to the user's profile to drive the dynamic dashboard.

---

## 📜 License
This project is licensed under the ISC License.

---
*Created by the Curalink Engineering Team.*
