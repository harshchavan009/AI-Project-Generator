"""
Reliability and Resilience Utilities for CapstoneForge.
Implements exponential backoff retries (max 3 attempts) for external LLM calls,
graceful fallback responses, structured logging, and Sentry error tracking.
"""

import asyncio
import random
import logging
import time
from typing import Callable, Any, Optional, Dict, AsyncGenerator

import httpx

try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None

logger = logging.getLogger("capstoneforge.reliability")

MAX_RETRIES = 3
INITIAL_DELAY = 1.0
BACKOFF_FACTOR = 2.0
FALLBACK_MENTOR_MESSAGE = "Mentor is temporarily unavailable, please try again."

async def retry_with_backoff(
    coro_func: Callable[..., Any],
    *args,
    max_retries: int = MAX_RETRIES,
    initial_delay: float = INITIAL_DELAY,
    backoff_factor: float = BACKOFF_FACTOR,
    operation_name: str = "LLM_API_Call",
    fallback_value: Any = None,
    **kwargs
) -> Any:
    """
    Executes an async operation with exponential backoff retry logic.
    Retries on network errors, timeouts, HTTP 429 (rate limited), and 5xx errors.
    """
    attempt = 0
    current_delay = initial_delay

    while attempt < max_retries:
        attempt += 1
        try:
            return await coro_func(*args, **kwargs)
        except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException, ConnectionError) as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            is_retriable = (
                status_code in (429, 500, 502, 503, 504) or
                isinstance(exc, (httpx.ConnectError, httpx.TimeoutException, ConnectionError))
            )

            logger.warning(
                f"[{operation_name}] Attempt {attempt}/{max_retries} failed: {exc}. "
                f"Status: {status_code}. Retriable: {is_retriable}"
            )

            if not is_retriable or attempt >= max_retries:
                if sentry_sdk:
                    sentry_sdk.capture_exception(exc)
                logger.error(f"[{operation_name}] Max retries exhausted: {exc}")
                if fallback_value is not None:
                    return fallback_value
                raise exc

            # Calculate exponential backoff delay with jitter
            jitter = random.uniform(0.1, 0.5)
            sleep_duration = current_delay + jitter
            logger.info(f"[{operation_name}] Backing off for {sleep_duration:.2f}s before attempt {attempt + 1}")
            await asyncio.sleep(sleep_duration)
            current_delay *= backoff_factor

        except Exception as exc:
            # Unhandled unexpected error
            logger.error(f"[{operation_name}] Unexpected error on attempt {attempt}: {exc}")
            if sentry_sdk:
                sentry_sdk.capture_exception(exc)
            if fallback_value is not None:
                return fallback_value
            raise exc

    return fallback_value

async def resilient_stream_wrapper(
    stream_generator: AsyncGenerator[str, None],
    fallback_message: str = FALLBACK_MENTOR_MESSAGE
) -> AsyncGenerator[str, None]:
    """
    Wraps an async generator SSE stream. If an exception occurs, yields a graceful
    fallback SSE event so the client UI displays the message without crashing.
    """
    import json
    try:
        async for chunk in stream_generator:
            yield chunk
    except Exception as exc:
        logger.error(f"[StreamMentor] Stream interrupted by error: {exc}")
        if sentry_sdk:
            sentry_sdk.capture_exception(exc)
        fallback_event = json.dumps({
            "token": f"\n\n⚠️ *{fallback_message}*",
            "done": True,
            "error": True,
            "fallback": True
        })
        yield f"data: {fallback_event}\n\n"
