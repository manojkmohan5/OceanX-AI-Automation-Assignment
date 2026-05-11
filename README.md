# OceanX AI Finance OS — Intern Automation Assignment

This repository contains a high-fidelity, multi-agent automation system built for the **OceanX AI Intern Automation Assignment**. 

The project demonstrates a fully autonomous pipeline that bridges the gap between raw data intake (Underwriting) and legal deal execution (Contract Structuring), fulfilling the core OceanX mission: *"Humans only do relationships + capital decisions. Agents run everything else."*

---

## 🎯 Assignment Selection
**Option Chosen:** Multi-step mini-agent (2-3 steps combined)

We have implemented a **Trio of Specialized Agents** that communicate via structured JSON payloads to automate the most complex back-office phases of trade finance:
1.  **Step 3: Underwriting Agent** — Financial extraction and risk scoring.
2.  **Master Supervisor Agent** — Quality control, error flagging, and orchestration.
3.  **Step 4: Contract Agent** — Context-aware legal drafting and execution.

---

## 🏗️ Agent Architecture

### 1. The Underwriting Agent (Step 3)
*   **Ingestion:** Ingests raw text from connected data packets or public URLs (using a custom fetch-based scraping engine).
*   **Extraction:** Uses **Llama 3.3 (via Groq)** to map unstructured text into a precise financial JSON schema (Revenue, Gross Margin, ADB, Debt).
*   **Policy Engine:** Applies deterministic OceanX credit gates to calculate risk scores and conditional credit limits.

### 2. The Master Supervisor Agent (Quality Control)
*   **Orchestration:** Acts as the central nervous system. It intercepts the Underwriter's output and validates mathematical integrity.
*   **Error Flagging:** If critical data is missing (e.g., no bank connection), it flags a `REQUEST INFO` status and decides whether to halt the pipeline or authorize a **Conditional Offer** with TBD placeholders.
*   **HITL Routing:** Automatically routes complex edge cases for **Human-In-The-Loop** review.

### 3. The Contract Agent (Step 4)
*   **Logic:** Receives the supervisor-approved payload.
*   **Pivoting:** Intelligently switches document types based on data completeness:
    *   **Full Approval:** Generates a **Commercial Finance Facility Agreement**.
    *   **Conditional Approval:** Generates a **Conditional Facility Offer & Information Request** (explicitly asking the customer for missing details).
*   **Execution:** Simulates the final handoff to the **DocuSign** API for signature.

---

## ⚖️ Credit Policy Framework
The agents are programmed with a "Lower-Of" credit policy to ensure capital safety:
*   **Method A (Cash-Flow):** 10x Average Daily Balance (ADB).
*   **Method B (Revenue Cap):** 20% of Verified Annual Revenue (split 10/10 between Import and Inventory finance).
*   **Decision:** The system autonomously recommends the lower of the two values to prevent over-leveraging.

---

## 🛠️ Tech Stack
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend/UI** | Next.js 14, TailwindCSS, Framer Motion | Premium, dark-mode dashboard with professional micro-animations. |
| **Backend** | Node.js Serverless API Routes | Scalable, high-speed orchestration for agent communications. |
| **AI/LLM** | Groq (Llama 3.3 70B) | Ultra-low latency inference for real-time data pulling. |
| **Languages** | TypeScript | Ensures absolute data integrity and type-safety across all agents. |
| **Architecture** | Mermaid.js | High-fidelity, code-driven documentation of the agent workflow. |

---

## 🚀 Setup & Installation

### 1. Prerequisites
*   Node.js (v18+)
*   Groq API Key (Sign up at [console.groq.com](https://console.groq.com/))

### 2. Installation
```bash
git clone <your-repo-url>
cd oceanx-ai-finance-os
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your Groq key:
```env
GROQ_API_KEY=your_key_here
```

### 4. Running the Project
```bash
npm run dev
```
The app will start on `http://localhost:3000` (or the next available port).

---

## 📂 Project Structure Highlights
*   `app/api/data-pull/`: Logic for the Underwriting Agent.
*   `app/api/generate-contract/`: Logic for the Master Supervisor & Contract Agent.
*   `lib/live-underwriting.ts`: The deterministic Credit Policy Engine.
*   `Demo_Presentation_Guide.html`: A standalone, interactive presentation guide for the demo.

---

## 📝 Assignment Compliance (Option 2)
In accordance with the assignment rules (Section 5):
*   **Mock APIs:** The system simulates external API connections for Bank Feeds, CIN7, Xero, and DocuSign using high-fidelity JSON mocks and simulated UI actions to ensure a seamless demo without production environment blockers.

---
