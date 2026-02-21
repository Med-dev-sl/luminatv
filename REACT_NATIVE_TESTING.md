# React Native API Testing Guide

## Quick Start - Test Backend Connection

### Option 1: Use Test Screen Component (Easiest for Mobile)

1. Add test screen route to your app router:

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="test-screen" options={{ title: 'API Tests' }} />
    </Stack>
  );
}
```

2. Navigate to test screen from your app:

```typescript
import { Link } from 'expo-router';
import { APITestScreen } from '@/app/test-screen';

export default function HomeScreen() {
  return (
    <Link href="/test-screen" asChild>
      <Pressable>
        <Text>Run API Tests</Text>
      </Pressable>
    </Link>
  );
}
```

3. Run your app and tap "Run All Tests" button:

```bash
npm start
# Then open in Expo Go on your phone (QR code scan)
# Or press 'i' for iOS, 'a' for Android
```

Expected output on test screen:
```
✅ Backend Health Check
{
  "status": "healthy",
  "version": "1.0"
}

✅ Backend Status Check
{
  "service": "luminatv-backend",
  "status": "ok",
  "django_version": "6.0",
  ...
}
```

---

### Option 2: Manual Testing in Console

Use the React Native debugger console to run manual tests:

```javascript
// Open React Native debugger (press 'j' in Expo)
// Paste this into the console:

import { runAllAPITests } from '@/lib/api-test';
runAllAPITests();
```

Check the console output for results.

---

### Option 3: Expo CLI Testing

Test directly from your computer terminal:

```bash
cd /path/to/luminatv

# Set environment variable for backend URL
export EXPO_PUBLIC_API_URL=http://localhost:8000  # For local dev
# or
export EXPO_PUBLIC_API_URL=https://luminatv-backend.onrender.com  # For Render

# Run your app
npm start
```

Then use test screen in the app.

---

## Integration Testing - Use in Your Components

### Basic Component Example

```typescript
// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { checkHealth } from '@/lib/supabase';

export default function HomeScreen() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {loading && <Text>Loading backend status...</Text>}
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      {health && (
        <>
          <Text>Backend Status: {health.status}</Text>
          <Text>Version: {health.version}</Text>
        </>
      )}
    </View>
  );
}
```

---

## Troubleshooting API Calls

### Issue: Connection Refused

**Cause**: Backend not running or wrong URL

**Solution**:
- **Local dev**: Ensure Django is running: `python manage.py runserver`
- **Render**: Check `EXPO_PUBLIC_API_URL=https://luminatv-backend.onrender.com`
- **Diagnostics**: Use test screen to see exact error

```bash
# In test screen, if you see error like "network request failed":
# 1. Check backend is running
# 2. Verify API_URL environment variable matches backend URL
# 3. Check firewall/network settings
```

### Issue: CORS Error (Specific to Web)

**React Native Note**: CORS errors typically don't appear in React Native the same way as web browsers. The preflight OPTIONS request may fail, but actual GET/POST requests usually work.

**If you still get CORS issues**:
- Verify `CORS_ALLOWED_ORIGINS` in `limunatv/settings.py` includes your frontend origin
- In development with localhost: Already included (`http://localhost:8081`, etc.)

### Issue: 401 Unauthorized

**Cause**: Missing authentication token (if required)

**Solution**: Add auth token to requests:

```typescript
export const apiCallWithAuth = async (
  endpoint: string,
  token: string,
  options: RequestInit = {}
) => {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
```

### Issue: Timeout

**Cause**: Backend too slow or not responding

**Solution**:
- Check backend health: `curl https://luminatv-backend.onrender.com/health/`
- If on Render free tier: May be sleeping (wakes up on first request, takes 5-10 seconds)
- Upgrade to Standard plan for instant response

---

## Test Coverage

### What Gets Tested

✅ **Health Check** (`/health/`)
- Verifies database connectivity
- Returns: `{ "status": "healthy" }`

✅ **Status Endpoint** (`/status/`)  
- Returns service metadata
- Returns: `{ "service": "luminatv-backend", "status": "ok", "django_version": "6.0" }`

✅ **CORS Headers** (Web only, informational for React Native)
- Verifies cross-origin access policies

### What NOT Tested (Add Your Own)

Create custom test functions for:

```typescript
// Example: Test authentication endpoint
export const testLogin = async (email: string, password: string) => {
  return apiCall('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// Example: Test data fetch
export const testGetUsers = async () => {
  return apiCall('/api/users/', { method: 'GET' });
};

// Example: Test data creation
export const testCreateUser = async (userData: any) => {
  return apiCall('/api/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};
```

Then add to test screen or run manually.

---

## Environment Variables

### Development Setup

Create `app.json` with test settings:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000"
    }
  }
}
```

Or use `.env.local`:

```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Production Setup

Set in Render or deployment platform:

```
EXPO_PUBLIC_API_URL=https://luminatv-backend.onrender.com
```

---

## Common API Response Examples

### Successful Health Check

```json
{
  "status": "healthy",
  "version": "1.0",
  "timestamp": "2026-02-21T10:15:30Z"
}
```

### Successful Status Check

```json
{
  "service": "luminatv-backend",
  "status": "ok",
  "django_version": "6.0",
  "database": "sqlite3",
  "debug": false,
  "timestamp": "2026-02-21T10:15:30Z"
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Next Steps

1. ✅ Run test screen in your React Native app
2. ✅ Verify all tests pass
3. ✅ Add custom API calls for your endpoints
4. ✅ Integrate API data into your UI screens
5. ✅ Test on actual Android/iOS device with EAS build

---

## References

- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Native Networking](https://reactnative.dev/docs/network)
- [Expo Documentation](https://docs.expo.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
