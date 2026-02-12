# Generative AI Use Case Diagram - Frontend

A React/Vite application that leverages Generative AI to convert user stories into fully interactive Use Case Diagrams and detailed specifications.

## 🚀 Features

- **Step 1: Actor Extraction:** Analyzes raw user stories to identify primary and secondary actors.
- **Step 2: Use Case Generation:** Generates use cases based on approved actors.
- **Step 3: Interactive Diagram:** Visualizes the system using **GoJS**. Supports dragging, rearranging, and linking nodes.
- **Step 4: Scenario Generation:** Generates detailed flows and scores for each use case.
- **PDF Export:** Exports the final diagram and all specifications into a professional PDF report.
- **Session Management:** Saves your progress locally so you can resume later.

---

## 📦 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm or yarn

## ⚙️ Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd <project-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

## 🔧 Configuration

By default, the frontend connects to a backend running on localhost port 8000.

To change the backend URL, edit **`src/components/api.ts`**:

```typescript
// src/components/api.ts
export const API_BASE_URL = '[http://127.0.0.1:8000](http://127.0.0.1:8000)'; // Change this if deploying
```
