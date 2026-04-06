# LLM Configuration Guide

## Current Setup
- **Host**: https://api.ollama.com (Ollama Cloud API)
- **Model**: `gemma3:12b` (12 billion parameters)
- **Status**: ✅ Working

## Available Models on Ollama Cloud API

### Recommended for Trading (Balanced)
- **`gemma3:12b`** ⭐ (24.0GB) - Current selection - Good balance of capability and speed
- `gemma3:27b` (55.0GB) - More powerful, better reasoning
- `ministral-3:8b` (10.4GB) - Faster responses, lighter
- `rnj-1:8b` (16.0GB) - Alternative option

### For Production (High Quality)
- `deepseek-v3.2` (688.6GB) - Top tier, very capable but heavy
- `glm-5` (756.2GB) - Latest GLM model
- `mistral-large-3:675b` (682.0GB) - Powerful Mistral variant
- `cogito-2.1:671b` (688.6GB) - Advanced reasoning

### For Testing / Development (Fast)
- `ministral-3:3b` (4.7GB) - Very fast, lightweight
- `gemma3:4b` (8.6GB) - Small but capable
- `gemma3:12b` (24.0GB) - Current choice

## How to Change Model

Edit `.env`:
```env
OLLAMA_MODEL=gemma3:12b
```

Change `gemma3:12b` to any model from the list above.

## Troubleshooting

### Error: "model 'xxx' not found (status code: 404)"
This means the model is not available on the API. Use the list above to select a different model.

### Error: "401 Unauthorized"
Check that `OLLAMA_API_KEY` is correctly set in `.env`

### Error: "Connection timeout"
The API may be overloaded. Try a smaller model or wait a moment.

## Features Implemented

✅ **Error Handling**
- Gracefully handles 404 (model not found)
- Handles 401 (authentication errors)
- Handles timeouts and connection errors

✅ **JSON Parsing**
- Strips markdown code blocks (```json...```)
- Validates JSON output
- Falls back to conservative decision on error

✅ **Response Caching**
- 30-second TTL cache
- Reduces API calls significantly
- Improves response time (instant on cache hit vs 5-10s on API call)

✅ **Fallback Strategy**
- Conservative default: `{"action": "HOLD", "amount": 0}`
- Ensures system never crashes
- Logs all errors for debugging

## Performance Notes

- **First call**: 5-10 seconds (API call)
- **Cached call**: <100ms (from cache)
- **Cache TTL**: 30 seconds
- **Request timeout**: 10 seconds per call
