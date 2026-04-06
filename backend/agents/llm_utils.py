"""
LLM Utilities: Ollama Primary + Groq Optional Fallback
───────────────────────────────────────────────────────
All LLM requests route to Ollama (local) first.
Groq is used as fallback ONLY if GROQ_API_KEY is set and Ollama fails.

Workflow:
1. Check Redis cache → return if hit
2. Try Ollama (local, primary)
3. On Ollama failure + GROQ_API_KEY set → fallback to Groq
4. Cache result and return
"""

import time
import hashlib
import json
import requests
from typing import Optional, Dict, Any
from redis_client import redis_client
from config import GROQ_API_KEY, LLM_MODEL, OLLAMA_BASE_URL, OLLAMA_MODEL

# ─── Ollama Configuration (Primary LLM) ───────────────────────────────────────
# Model and URL are read from config.py / .env:
#   OLLAMA_BASE_URL=http://localhost:11434
#   OLLAMA_MODEL=llama3.2:8b
OLLAMA_TIMEOUT = 300            # 5 minutes for local inference
OLLAMA_RETRY_ATTEMPTS = 2

# ─── Groq Configuration (Optional Fallback) ───────────────────────────────────
# Only active when GROQ_API_KEY is set in .env
GROQ_FALLBACK_ENABLED = bool(GROQ_API_KEY)
RATE_LIMIT_RETRY_ATTEMPTS = 3
RATE_LIMIT_INITIAL_WAIT = 2   # seconds
RATE_LIMIT_MAX_WAIT = 30      # seconds
REQUEST_TIMEOUT = 60          # seconds
CACHE_TTL = 3600              # 1 hour

# Initialize Groq client lazily (only if key is set)
_groq_client = None
if GROQ_FALLBACK_ENABLED:
    try:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq configured as fallback LLM")
    except Exception as e:
        print(f"⚠️  Groq fallback unavailable: {e}")
        GROQ_FALLBACK_ENABLED = False

# Track which LLM was used
LAST_LLM_USED = None


def _create_cache_key(messages: list, model: str, temperature: float) -> str:
    """Create a unique cache key for LLM request."""
    content = f"{json.dumps(messages)}:{model}:{temperature}"
    return f"llm_cache:{hashlib.md5(content.encode()).hexdigest()}"


def _check_ollama_available() -> bool:
    """Check if Ollama service is running and accessible."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"⚠️  Ollama not available: {e}")
        return False


def _get_ollama_response(messages: list, temperature: float = 0.2, max_tokens: int = 4000) -> Optional[str]:
    """
    Call local Ollama instance (primary LLM provider).
    Uses the /api/chat endpoint which natively supports OpenAI-style messages.
    """
    try:
        print(f"\n🦙 Ollama (Primary LLM)")
        print(f"   Model: {OLLAMA_MODEL}, MaxTokens: {max_tokens}, Temp: {temperature}")

        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,   # OpenAI-format messages passed directly
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                }
            },
            timeout=OLLAMA_TIMEOUT
        )

        if response.status_code == 200:
            result = response.json()
            response_text = result.get("message", {}).get("content", "").strip()
            print(f"✅ Ollama response received ({len(response_text)} chars)")
            return response_text
        else:
            print(f"❌ Ollama error: HTTP {response.status_code} — {response.text[:200]}")
            return None

    except requests.exceptions.Timeout:
        print(f"❌ Ollama timed out after {OLLAMA_TIMEOUT}s")
        return None
    except Exception as e:
        print(f"❌ Ollama call failed: {e}")
        return None


def _get_cached_response(messages: list, model: str, temperature: float) -> Optional[str]:
    """Retrieve cached LLM response if available."""
    try:
        cache_key = _create_cache_key(messages, model, temperature)
        cached = redis_client.get(cache_key)
        if cached:
            print(f"✅ LLM response cache hit")
            return cached.decode('utf-8')
    except Exception as e:
        print(f"⚠️  Cache retrieval failed: {e}")
    return None


def _cache_response(messages: list, model: str, temperature: float, response: str) -> None:
    """Cache LLM response for future use."""
    try:
        cache_key = _create_cache_key(messages, model, temperature)
        redis_client.setex(cache_key, CACHE_TTL, response)
    except Exception as e:
        print(f"⚠️  Cache storage failed: {e}")


def call_groq_with_retry(
    messages: list,
    model: str = LLM_MODEL,
    temperature: float = 0.2,
    max_tokens: int = 4000,
    use_cache: bool = True,
) -> str:
    """
    Primary LLM call — routes to Ollama (local) first.
    Falls back to Groq cloud if Ollama fails AND GROQ_API_KEY is set.

    Parameters
    ----------
    messages : list - Messages in OpenAI format [{"role": ..., "content": ...}]
    model : str - Ignored for Ollama (uses OLLAMA_MODEL); kept for API compatibility
    temperature : float - Sampling temperature (0-1)
    max_tokens : int - Max tokens to generate
    use_cache : bool - Whether to use Redis response caching

    Returns
    -------
    str - LLM response text

    Raises
    ------
    Exception - If all providers fail
    """
    global LAST_LLM_USED

    # ── Step 1: Check cache ──────────────────────────────────────────────────
    if use_cache:
        cached_response = _get_cached_response(messages, OLLAMA_MODEL, temperature)
        if cached_response:
            return cached_response

    # ── Step 2: Try Ollama (Primary) ─────────────────────────────────────────
    if _check_ollama_available():
        for attempt in range(1, OLLAMA_RETRY_ATTEMPTS + 1):
            print(f"\n🦙 Ollama Call (Attempt {attempt}/{OLLAMA_RETRY_ATTEMPTS})")
            ollama_response = _get_ollama_response(messages, temperature, max_tokens)
            if ollama_response:
                if use_cache:
                    _cache_response(messages, OLLAMA_MODEL, temperature, ollama_response)
                LAST_LLM_USED = "ollama"
                return ollama_response
            print(f"   Retrying Ollama...")
            time.sleep(1)
        print("⚠️  Ollama returned no response after all attempts.")
    else:
        print("⚠️  Ollama not running. Start it with: ollama serve")

    # ── Step 3: Groq Fallback (Optional) ─────────────────────────────────────
    if GROQ_FALLBACK_ENABLED and _groq_client:
        print("\n" + "="*60)
        print("☁️  FALLING BACK TO GROQ (Cloud LLM)")
        print("="*60)

        wait_time = RATE_LIMIT_INITIAL_WAIT
        last_error = None

        for attempt in range(1, RATE_LIMIT_RETRY_ATTEMPTS + 1):
            try:
                print(f"   Groq attempt {attempt}/{RATE_LIMIT_RETRY_ATTEMPTS} | model={model}")
                response = _groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=REQUEST_TIMEOUT,
                )
                response_text = response.choices[0].message.content
                if use_cache:
                    _cache_response(messages, model, temperature, response_text)
                print(f"✅ Groq fallback successful (attempt {attempt})")
                LAST_LLM_USED = "groq"
                return response_text

            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                is_rate_limit = any(k in error_str for k in ["rate", "limit", "429", "quota", "overloaded"])
                if is_rate_limit and attempt < RATE_LIMIT_RETRY_ATTEMPTS:
                    print(f"   Groq rate limited — waiting {wait_time}s...")
                    time.sleep(wait_time)
                    wait_time = min(wait_time * 2, RATE_LIMIT_MAX_WAIT)
                else:
                    print(f"❌ Groq error: {e}")
                    break

        raise Exception(
            f"All LLM providers failed. "
            f"Ollama: not available or timed out. Groq: {last_error}. "
            f"Run: ollama serve && ollama pull {OLLAMA_MODEL}"
        )

    # No providers available
    raise Exception(
        f"No LLM provider available. "
        f"Ollama is not running. Start it with:\n"
        f"  ollama serve\n"
        f"  ollama pull {OLLAMA_MODEL}"
    )


def call_groq_no_cache(
    messages: list,
    model: str = LLM_MODEL,
    temperature: float = 0.2,
    max_tokens: int = 4000,
) -> str:
    """
    LLM call without caching (for unique/dynamic requests).
    Routes through Ollama primary → Groq fallback.
    """
    return call_groq_with_retry(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        use_cache=False,
    )


def get_last_llm_used() -> Optional[str]:
    """Get which LLM was used for the last request ('groq' or 'ollama')."""
    return LAST_LLM_USED


def clear_llm_cache() -> int:
    """Clear all cached LLM responses."""
    try:
        pattern = "llm_cache:*"
        cursor = 0
        count = 0
        
        while True:
            cursor, keys = redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                count += redis_client.delete(*keys)
            if cursor == 0:
                break
        
        print(f"✅ Cleared {count} cached LLM responses")
        return count
    except Exception as e:
        print(f"❌ Cache clearing failed: {e}")
        return 0

