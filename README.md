# 🚀 Hacks Base Indonesia - AI Generator Service

A production-ready Backend AI Service designed to generate viral LinkedIn content.
Built with **Next.js 14**, **Groq AI**, and **Tavily Research**, featuring a seamless **x402 Protocol** payment simulation.

## 🌟 Features

- **Viral Ghostwriter Engine**: Generates high-engagement LinkedIn posts using `llama-3.3-70b`.
- **Real-Time Research**: Integrates **Tavily** to fetch live news and data, preventing AI hallucinations.
- **Model Selection**: Choose between High Quality (70B) or High Speed (8B) models.
- **Public API**: Exposed via Cloudflare Tunnel for secure, easy access.
- **CORS Enabled**: Ready for integration with any Frontend (React, Vue, etc.) or x402 Payment Processor.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI Inference**: Groq SDK (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`)
- **Web Research**: Tavily API

---

## 🔌 API Documentation

**Base Endpoint**: `https://proto-hackathon-base.tempegoreng.my.id/api/generate`
**Method**: `POST`

### 1. Request Format

Send a JSON body to the endpoint.

#### **Option A: Smartest Quality (Default)**
Best for "Pro/Premium" users. Uses `llama-3.3-70b` + Deep Research.
```json
{
  "topic": "The Future of AI Agents"
}
```

#### **Option B: Fastest Speed (Cost Efficient)**
Best for "Basic" tier or testing. Uses `llama-3.1-8b`.
```json
{
  "topic": "Quick Monday Motivation",
  "model": "llama-3.1-8b-instant"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | `string` | **Yes** | The user's input/prompt. |
| `model` | `string` | No | `llama-3.3-70b-versatile` (default) or `llama-3.1-8b-instant`. |

### 2. Response Format

Returns a JSON object with the generated content.

```json
{
  "result": "🚀 AI Agents are taking over...\n\nHere is why you should care:\n\n1. It saves time.\n2. It scales effort.\n\n#AI #Tech"
}
```

> **Note**: The `result` string contains `\n` for line breaks. In your frontend, render this using CSS `white-space: pre-wrap;` to preserve formatting.

### 3. Error Handling

- **400 Bad Request**: Missing `topic` or invalid JSON.
- **500 Internal Server Error**: API Key issues or AI provider downtime.

---

## 🚀 Getting Started (Local Development)

Follow these steps to run the backend on your machine.

### Prerequisites
- Node.js 18+ installed.
- API Keys for **Groq** and **Tavily**.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Auto-Linkid/AI-Backend.git
    cd AI-Backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Rename `.env.local.example` to `.env.local` and add your keys:
    ```env
    GROQ_API_KEY=gsk_...
    TAVILY_API_KEY=tvly-...
    ```

4.  **Run the Server**:
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:3000`.

5.  **Test the API**:
    You can use the included test script:
    ```bash
    node scripts/test-api.js
    ```

## 📄 License
Private Repository for Hacks Base Indonesia.
