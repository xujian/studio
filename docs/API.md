# API Documentation

## POST /api/generate

Generate an AI portrait image from a text prompt.

### Authentication
Requires valid Supabase session cookie.

### Request Body
```json
{
  "prompt": "string (1-500 characters, required)"
}
```

### Response (Success - 200)
```json
{
  "id": "uuid",
  "url": "https://...",
  "prompt": "string",
  "created_at": "ISO 8601 timestamp"
}
```

### Response (Error - 400)
```json
{
  "error": "Validation error message"
}
```

### Response (Error - 401)
```json
{
  "error": "Unauthorized"
}
```

### Response (Error - 500)
```json
{
  "error": "Failed to generate image"
}
```

### Process Flow
1. Validate authentication
2. Validate prompt
3. Generate image with Gemini
4. Create database record
5. Upload image to Supabase Storage
6. Return public URL

### Rate Limits
Currently unlimited. Consider adding rate limiting for production.

### Example
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A professional portrait of a woman in natural lighting'
  })
})

const data = await response.json()
```
