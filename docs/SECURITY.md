# ModelSmith Security Guide

## Overview

ModelSmith is designed as a **local-first development tool**. All operations run on your machine — no data leaves your computer unless you explicitly download models from HuggingFace Hub or publish to the marketplace.

## Authentication

### API Key System

A random 32-byte API key is generated on every backend startup:

- **Automatic**: The frontend fetches the key via `GET /api/session-key` on first load and includes it as `X-Api-Key` on all requests
- **Manual**: To use a fixed key (for curl/scripts), set `MODELSMITH_API_KEY` env var before starting:
  ```bash
  export MODELSMITH_API_KEY="my-secure-key-here"
  uvicorn backend.main:app --port 8765
  ```
- **Validation**: Middleware checks every non-public endpoint (except health, session-key, docs, WebSocket, static assets)

### Bypassing Auth

For local development, you can disable the API key check by not setting `MODELSMITH_API_KEY` — the auto-generated key is fetched by the frontend automatically. If you're scripting against the API, either set `MODELSMITH_API_KEY` or fetch the session key first:

```bash
# Fetch session key
KEY=$(curl -s http://127.0.0.1:8765/api/session-key | python3 -c "import sys,json; print(json.load(sys.stdin)['key'])")

# Use it
curl -H "X-Api-Key: $KEY" http://127.0.0.1:8765/api/models/registry
```

## Token Security

### HuggingFace Token

Your HuggingFace token is protected in three ways:

1. **At rest (localStorage)**: Encrypted with XOR cipher using a random 16-byte key before writing to disk
2. **Key isolation**: Decryption key stored in `sessionStorage` (cleared when browser tab closes)
3. **In transit**: Sent via `X-HF-Token` HTTP header (never in URL, never in POST body, never logged by default)

### What This Means

- Token is **unreadable at rest** — a localStorage dump shows only ciphertext
- Key is **ephemeral** — lost when browser closes, token becomes undecryptable until re-entered
- Token is **never in request bodies or URLs** — won't appear in server logs, proxy logs, or browser history

## Network Security

### CORS Configuration

```
Frontend (5173) ──► Backend (8765)
   Origin: http://localhost:5173
   Methods: GET, POST, PUT, DELETE, OPTIONS
   Headers: Content-Type, Authorization, X-Api-Key, X-HF-Token
```

- Origins restricted to `http://localhost:5173` (Vite dev) and `http://localhost:8765` (direct API access)
- Only expected HTTP methods allowed
- Custom headers explicitly whitelisted

### Network Binding

By default, the backend binds to **127.0.0.1** (localhost only). This means:
- Only processes on your machine can connect
- No network exposure even if firewall is disabled
- Override with `0.0.0.0` only if you need remote access (not recommended)

## File System Safety

### Path Validation

All user-supplied file paths pass through `resolve_model_path()` which:
1. Resolves symlinks and `..`
2. Expands `~` to home directory
3. Checks against allowed prefixes: project root, home dir, `/tmp`
4. Rejects paths outside these boundaries with `ValueError`

### Subprocess Execution

All external commands (GGUF quantize, llama.cpp convert) follow these safety measures:

| Measure | Implementation |
|---------|---------------|
| No shell | `shell=False` (default, explicit) |
| Captured output | `capture_output=True` — no terminal injection |
| Internal paths | All args derived from `shutil.which()` or `tempfile` |
| Arg validation | `validate_subprocess_arg()` rejects special characters |
| Timeouts | All subprocesses have explicit timeouts (1–2 hours) |

### Model Loading

`trust_remote_code=False` is set on all HuggingFace model and tokenizer loads. This prevents arbitrary Python execution from malicious model repositories.

## Generated API Safety

When using `POST /api/pipeline/export-api` to generate a deployable `serve.py`:

- **CORS**: Restricted to `localhost:5173` and `localhost:3000` only
- **Methods**: Only `GET` and `POST`
- **Headers**: Only `Content-Type` and `Authorization`
- **Model path**: Sanitized via regex — only alphanumeric, `/`, `-`, `_`, `.`, `:` characters allowed

## Best Practices

1. **Keep the backend local**: Don't bind to `0.0.0.0` unless you need remote access
2. **Set a custom API key** via `MODELSMITH_API_KEY` if integrating with external tools
3. **Revoke compromised HF tokens** at https://huggingface.co/settings/tokens
4. **Clear browser data** on shared machines — tokens in sessionStorage are cleared on tab close
5. **Review marketplace pipelines** before applying — they contain node configurations that execute on your models
