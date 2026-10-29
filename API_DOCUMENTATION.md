# Admin Panel Chat Push API Documentation

## Backend Requirements

- **Node.js** >= 18.x
- **Express** server running on port 3004 (default)
- **MySQL** database with Prisma ORM
- **Firebase Admin** credentials configured in `.env`
- **Firebase Cloud Messaging** token for admin push notifications

## Environment Variables

Create or update `.env` file:

```env
PORT=3000
GEMINI_API_KEY=your-gemini-key
DATABASE_URL="mysql://user:password@localhost:3306/networkup_support?charset=utf8mb4"
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
MIN_SIMILARITY_SCORE=0.7
ADMIN_FCM_TOKEN=your-admin-fcm-token-here  # Required for push notifications
```

## Authentication

All admin endpoints require **Firebase Authentication** via Bearer token:

```
Authorization: Bearer <firebase-id-token>
```

The token must be a valid Firebase ID token. Admins must be authenticated users in the Firebase system.

## API Endpoints

### 1. Get Urgent Conversations

**Endpoint:** `GET /api/admin/urgent-chats`

**Description:** Fetch all conversations that are pending human attention (escalated from the chatbot).

**Authentication:** Required (Firebase Bearer token)

**Success Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conversation-uuid",
      "title": "Chat Title",
      "status": "PENDING_HUMAN",
      "agentType": "HUMAN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z",
      "lastMessage": "User: I need help with my network setup urgently!",
      "messageCount": 3
    }
  ]
}
```

**Error Responses:**

- `401` - Missing or invalid authentication token
- `500` - Server error fetching conversations

---

### 2. Send Admin Message

**Endpoint:** `POST /api/admin/conversations/:id/messages`

**Description:** Allow admin to send a message back to a conversation. The message is stored in the database with the admin as the sender.

**Authentication:** Required (Firebase Bearer token)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Conversation ID (from URL path) |
| `content` | string | Message content to send (required) |

**Request Body:**

```json
{
  "content": "I have reviewed your urgent scenario. How can I help?"
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "messageId": "new-message-uuid",
    "role": "ASSISTANT",
    "content": "I have reviewed your urgent scenario. How can I help?",
    "createdAt": "2024-01-15T10:40:00.000Z"
  }
}
```

**Error Responses:**

- `400` - Message content is required or invalid
- `404` - Conversation not found
- `401` - Missing or invalid authentication token
- `500` - Server error sending message

---

### 3. Escalate Conversation

**Endpoint:** `POST /conversations/:id/escalate`

**Description:** Escalate a conversation to human support. This will:
- Change conversation status to `PENDING_HUMAN`
- Change agent type to `HUMAN`
- Add a system message: "Conversation escalated to human support."
- Send Firebase push notification to admin (if FCM token configured)

**Authentication:** Required (Firebase Bearer token)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Conversation ID (from URL path) |

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "conversation-uuid",
    "status": "PENDING_HUMAN",
    "agentType": "HUMAN",
    "message": "Conversation escalated to human support."
  }
}
```

**Error Responses:**

- `404` - Conversation not found
- `400` - Conversation already closed or escalated
- `401` - Missing or invalid authentication token
- `500` - Server error (including FCM notification failure)

## Flow Example

### 1. Chatbot Conversation

User chats with AI → Conversation stays `OPEN` with `agentType: "AI"`

### 2. Escalation (Urgent Scenario)

Admin or system calls escalate API:

```http
POST /conversations/c123/escalate
Authorization: Bearer <token>
```

**Result:**

- Conversation status → `PENDING_HUMAN`
- Agent type → `HUMAN`
- System message added
- **FCM notification sent to admin** (if token configured)

### 3. Admin Panel Shows Urgent Chat

```http
GET /api/admin/urgent-chats
Authorization: Bearer <token>
```

Returns conversation in urgent list with preview of last message.

### 4. Admin Replies

```http
POST /api/admin/conversations/c123/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I see your urgent network issue. Let me help you with that."
}
```

**Result:**

- Admin message stored in conversation
- Conversation updated timestamp
- Conversation continues with human agent

### 5. Conversation Status Options

| Status | Meaning |
|--------|---------|
| `OPEN` | Active AI chat |
| `PENDING_HUMAN` | Escalated, waiting for human |
| `ASSIGNED` | Assigned to specific human agent |
| `CLOSED` | Conversation completed |

## FCM Push Notification Setup

To enable actual push notifications to the admin:

1. **Get FCM Token** from admin's web browser or mobile app:
   - Web: Call `firebase.messaging().getToken()` after requesting notification permission
   - Mobile: Use native Firebase SDK

2. **Set in `.env`:**
   ```env
   ADMIN_FCM_TOKEN=bKienrdT1oY:APA91bE...
   ```

3. **Notification sent when:** `POST /conversations/:id/escalate` is called

**Notification format:**
- **Title:** "Urgent Scenario"
- **Body:** "Conversation escalated to human support - [Admin Name]"
- **Data:** Includes conversation ID and type "urgent_chat"

If `ADMIN_FCM_TOKEN` is not set, the system logs a warning instead of crashing, allowing the API to work without push notifications.

## Development & Testing

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test endpoints with curl (replace TOKEN with valid Firebase ID token)
curl -X GET "http://localhost:3004/api/admin/urgent-chats" \
  -H "Authorization: Bearer TOKEN"

curl -X POST "http://localhost:3004/api/admin/conversations/con123/messages" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello admin, I need help"}'
```

## Database Schema Support

The existing Prisma schema already supports all features:

```prisma
enum ConversationStatus {
  OPEN
  PENDING_HUMAN
  ASSIGNED
  CLOSED
}

enum AgentType {
  AI
  BOT
  HUMAN
}

model Conversation {
  id          String           @id @default(cuid())
  userId      String
  status      ConversationStatus @default(OPEN)
  agentType   AgentType        @default(AI)
  assignedAgentId String?
  messages    Message[]
  ...
}

model Message {
  id              String       @id @default(cuid())
  conversationId  String
  role            SenderType   // USER, ASSISTANT, SYSTEM
  content         String       @db.Text
  ...
}
```

No database schema migrations are required - all needed enums and fields already exist.

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for message posting)
- `400` - Bad request (missing parameters, invalid content)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found (conversation doesn't exist)
- `500` - Server error