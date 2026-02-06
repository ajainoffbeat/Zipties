# Socket.IO Connection Testing Guide

## ✅ Verification Results

The socket fields and functions are working correctly:

```
✅ socket_id field exists in user table
✅ socket_connected_at field exists in user table
✅ fn_update_user_socket function working
✅ fn_clear_user_socket function working
✅ fn_get_conversation_sockets function working
✅ fn_get_user_by_socket function working
```

## 🔌 Testing Socket.IO Connection

### Option 1: Using Socket.IO Client Tool (Browser)

1. Go to: https://amritb.github.io/socketio-client-tool/

2. Configure connection:
   - **Socket URL**: `http://localhost:5000`
   - **Path**: `/socket.io/`
   - **Auth**: Add custom field
     - Key: `token`
     - Value: `YOUR_JWT_TOKEN`

3. Click "Connect"

4. You should see in your server logs:
   ```
   ✅ Socket authenticated: username (user-id)
   🔌 User connected: username (user-id) - Socket: abc123
   ✅ Socket ID stored in DB for user user-id
   ```

### Option 2: Using Node.js Script

Create a test file `test-socket-client.js`:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('new_message', (payload) => {
  console.log('📨 New message received:', payload);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Keep alive
setTimeout(() => {
  console.log('Disconnecting...');
  socket.disconnect();
}, 5000);
```

Run with:
```bash
npm install socket.io-client
node test-socket-client.js
```

### Option 3: Using Postman (WebSocket)

1. Create new WebSocket request
2. URL: `ws://localhost:5000/socket.io/?EIO=4&transport=websocket`
3. Add auth in connection params

## 🔍 Debugging

### Check if Socket ID is stored:

Run this script:

```bash
npx tsx src/scripts/inspect_socket.ts
```

### Check server logs:

When a client connects, you should see:
```
✅ Socket authenticated: username (user-id)
🔌 User connected: username (user-id) - Socket: abc123
✅ Socket ID stored in DB for user user-id
```

When a client disconnects:
```
⚠️ User disconnecting: username (user-id) - Socket: abc123
🔌 User disconnected: username (user-id) - Socket: abc123 - Reason: client namespace disconnect
✅ Socket ID cleared from DB for user user-id
```

### Verify in Database:

While a client is connected, check:

```sql
SELECT id, username, socket_id, socket_connected_at 
FROM "user" 
WHERE socket_id IS NOT NULL;
```

## 🐛 Common Issues

### Issue 1: Socket ID not storing

**Symptom**: No logs showing "Socket ID stored in DB"

**Solutions**:
- Ensure server is running: `npm run dev`
- Check JWT token is valid
- Verify DATABASE_URL is correct
- Check server logs for errors

### Issue 2: CORS errors

**Symptom**: Browser shows CORS error

**Solution**: Update `FRONTEND_URL` in `.env`:
```
FRONTEND_URL=http://localhost:3000
```

### Issue 3: Authentication failed

**Symptom**: "Authentication failed" error

**Solutions**:
- Verify JWT_SECRET is set in `.env`
- Ensure token is passed in `auth.token` field
- Check token hasn't expired

## 📝 Enhanced Logging

The socket handler now includes detailed logging:

- ✅ Authentication success/failure
- 🔌 Connection events
- ⚠️ Disconnecting events
- ❌ Errors with context
- ✅ Database operations success

All logs are prefixed with emojis for easy scanning.
