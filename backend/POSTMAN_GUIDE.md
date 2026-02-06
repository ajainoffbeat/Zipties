# Postman Testing Guide - Conversation API

## 🔧 Setup

### Base URL
```
http://localhost:5000
```

### Authentication
Most endpoints require a JWT token. Add this to **Headers** for authenticated requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 API Endpoints

### 1. Create/Get Conversation

**Endpoint:** `POST /api/conversation/create`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "user_ids": [
    "user-uuid-1",
    "user-uuid-2"
  ],
  "type_name": "individual"
}
```

**Optional Fields:**
```json
{
  "user_ids": ["uuid1", "uuid2"],
  "type_name": "group",
  "source_type_name": "post",
  "source_id": "source-uuid"
}
```

**Response (200 OK):**
```json
{
  "status": 0,
  "message": "Conversation created successfully",
  "data": {
    "conversation_id": "2427047b-6f21-4144-b079-6b321135b610"
  }
}
```

---

### 2. Send Message

**Endpoint:** `POST /api/conversation/message`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "conversation_id": "2427047b-6f21-4144-b079-6b321135b610",
  "content": "Hello! This is a test message.",
  "content_type_name": "text"
}
```

**Content Types:**
- `"text"` (default)
- `"image"`

**Response (200 OK):**
```json
{
  "status": 0,
  "message": "Message sent successfully",
  "data": {
    "message_id": "e8f30df4-2242-41d0-83a8-bd2dfdbd903f"
  }
}
```

> **Note:** This also triggers Socket.IO emission to online recipients automatically.

---

### 3. Mark Conversation as Read

**Endpoint:** `POST /api/conversation/read`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "conversation_id": "2427047b-6f21-4144-b079-6b321135b610",
  "last_message_id": "e8f30df4-2242-41d0-83a8-bd2dfdbd903f"
}
```

**Response (200 OK):**
```json
{
  "status": 0,
  "message": "Conversation marked as read"
}
```

---

### 4. Get User Inbox

**Endpoint:** `GET /api/conversation/inbox`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**No Body Required**

**Response (200 OK):**
```json
{
  "status": 0,
  "message": "Inbox retrieved successfully",
  "data": [
    {
      "conversation_id": "2427047b-6f21-4144-b079-6b321135b610",
      "title": "Direct Chat",
      "type_name": "individual",
      "unread_count": 1,
      "last_message_content": "Hello! This is a test message.",
      "last_message_at": "2026-02-03T08:45:27.841Z",
      "last_message_sender_id": "66dc9264-d35c-4ebd-8d71-cf87fc44dc34",
      "last_message_sender_name": "user_a_1770108053644",
      "source_type": null,
      "source_id": null
    }
  ]
}
```

---

### 5. Get Conversation Messages

**Endpoint:** `GET /api/conversation/:id/messages`

**Example:** `GET /api/conversation/2427047b-6f21-4144-b079-6b321135b610/messages`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters (Optional):**
```
?limit=50&offset=0
```

**Response (200 OK):**
```json
{
  "status": 0,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": "e8f30df4-2242-41d0-83a8-bd2dfdbd903f",
      "sender_id": "66dc9264-d35c-4ebd-8d71-cf87fc44dc34",
      "content": "Hello! This is a test message.",
      "created_at": "2026-02-03T08:45:27.841Z",
      "content_type": "text",
      "sender_name": "user_a_1770108053644"
    }
  ]
}
```

---

## 🧪 Testing Flow

### Step 1: Get JWT Token
First, login via your auth endpoint to get a JWT token:

**Endpoint:** `POST /api/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Copy the JWT token from the response.

---

### Step 2: Create Test Users (If Needed)
If you need test users, use your signup endpoint:

**Endpoint:** `POST /api/signup`

**Body:**
```json
{
  "email": "testuser1@example.com",
  "username": "testuser1",
  "password": "password123"
}
```

Create 2 users and note their user IDs.

---

### Step 3: Create Conversation
Use the user IDs from Step 2:

**POST** `/api/conversation/create`
```json
{
  "user_ids": [
    "user-id-1",
    "user-id-2"
  ],
  "type_name": "individual"
}
```

Save the `conversation_id` from response.

---

### Step 4: Send Message
**POST** `/api/conversation/message`
```json
{
  "conversation_id": "YOUR_CONVERSATION_ID",
  "content": "Hello from Postman!",
  "content_type_name": "text"
}
```

---

### Step 5: Get Inbox
**GET** `/api/conversation/inbox`

You should see the conversation with `unread_count: 1`.

---

### Step 6: Get Messages
**GET** `/api/conversation/YOUR_CONVERSATION_ID/messages`

You should see all messages in the conversation.

---

### Step 7: Mark as Read
**POST** `/api/conversation/read`
```json
{
  "conversation_id": "YOUR_CONVERSATION_ID",
  "last_message_id": "YOUR_MESSAGE_ID"
}
```

---

### Step 8: Verify Unread Count Reset
**GET** `/api/conversation/inbox`

Now `unread_count` should be `0`.

---

## 📦 Postman Collection JSON

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Conversation API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Conversation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"user_ids\": [\n    \"{{user_id_1}}\",\n    \"{{user_id_2}}\"\n  ],\n  \"type_name\": \"individual\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/conversation/create",
          "host": ["{{base_url}}"],
          "path": ["api", "conversation", "create"]
        }
      }
    },
    {
      "name": "Send Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"conversation_id\": \"{{conversation_id}}\",\n  \"content\": \"Hello from Postman!\",\n  \"content_type_name\": \"text\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/conversation/message",
          "host": ["{{base_url}}"],
          "path": ["api", "conversation", "message"]
        }
      }
    },
    {
      "name": "Mark as Read",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"conversation_id\": \"{{conversation_id}}\",\n  \"last_message_id\": \"{{message_id}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/conversation/read",
          "host": ["{{base_url}}"],
          "path": ["api", "conversation", "read"]
        }
      }
    },
    {
      "name": "Get Inbox",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/conversation/inbox",
          "host": ["{{base_url}}"],
          "path": ["api", "conversation", "inbox"]
        }
      }
    },
    {
      "name": "Get Messages",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/conversation/{{conversation_id}}/messages?limit=50&offset=0",
          "host": ["{{base_url}}"],
          "path": ["api", "conversation", "{{conversation_id}}", "messages"],
          "query": [
            {
              "key": "limit",
              "value": "50"
            },
            {
              "key": "offset",
              "value": "0"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN_HERE"
    },
    {
      "key": "user_id_1",
      "value": ""
    },
    {
      "key": "user_id_2",
      "value": ""
    },
    {
      "key": "conversation_id",
      "value": ""
    },
    {
      "key": "message_id",
      "value": ""
    }
  ]
}
```

---

## 🔑 Environment Variables

Set these in Postman Environment:

| Variable | Example Value |
|----------|---------------|
| `base_url` | `http://localhost:5000` |
| `jwt_token` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `user_id_1` | `66dc9264-d35c-4ebd-8d71-cf87fc44dc34` |
| `user_id_2` | `9600d9a5-2cd5-43b0-81e8-cc7d6dee2a27` |
| `conversation_id` | `2427047b-6f21-4144-b079-6b321135b610` |
| `message_id` | `e8f30df4-2242-41d0-83a8-bd2dfdbd903f` |

---

## ⚠️ Important Notes

1. **Authentication Required**: All conversation endpoints require a valid JWT token in the `Authorization` header.

2. **User ID Extraction**: The user ID is extracted from the JWT token automatically by the auth middleware, so you don't need to pass it in the request body.

3. **Socket.IO**: When you send a message via REST API, Socket.IO automatically emits to online recipients. You won't see this in Postman, but connected Socket.IO clients will receive the event.

4. **Error Responses**: All errors return:
   ```json
   {
     "status": 1,
     "message": "Error description"
   }
   ```

5. **Conversation Types**: 
   - `"individual"` - Direct 1-on-1 chat
   - `"group"` - Group conversation
