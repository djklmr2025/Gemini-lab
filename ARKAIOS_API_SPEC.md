# ARKAIOS Multimodal Ecosystem API Spec

This document details how to interact with the ARKAIOS Multimodal Orchestrator.

## Orchestration Chain
When a request is sent to this API, the following agents collaborate in sequence:
1. **A.I.D.A.**: Performs initial strategic analysis and intent mapping.
2. **Claude (3.5 Sonnet)**: Provides the primary, detailed, and structured response.
3. **GPT-4o**: Reviews Claude's response, adding alternative perspectives or specific corrections.
4. **Gemini (1.5 Flash)**: Synthesizes the conversation with actionable insights or a quick summary.

---

## API Endpoint

**URL:** `https://arkaios-vivo-dashboard.onrender.com/api/v1/interact`  
**Method:** `POST`  
**Auth:** API Key required in body.

### Request Body (JSON)
| Field | Type | Description |
| :--- | :--- | :--- |
| `text` | `string` | The message or command for the ecosystem. |
| `apiKey` | `string` | Authorization key (Use your `AIDA_KEY`). |

**Example Request:**
```json
{
  "text": "¿Cómo puedo optimizar el rendimiento del servidor?",
  "apiKey": "KaOQ1ZQ4gyF5bkgxkiwPEFgkrUMW31ZEwVhOITkLRO5jaImetmUlYJegOdwG"
}
```

### Response (JSON)
The API responds immediately confirming the message has been dispatched to the bus.
```json
{
  "ok": true,
  "status": "dispatched",
  "messageId": "1734567890123",
  "info": "Listen to socket.io events 'bus-message' for responses from AIDA, Claude, GPT-4o, Gemini"
}
```

---

## Real-time Monitoring
To receive the actual AI responses, you can connect via **Socket.IO** to the same Base URL and listen for the event `bus-message`.

- **Event:** `bus-message`
- **Payload Format:**
```json
{
  "from": "claude|gpt4o|gemini|aida",
  "text": "The AI response content...",
  "meta": { "topic": "global" }
}
```

---
*Powered by ARKAIOS VIVO Enhanced Ecosystem*
