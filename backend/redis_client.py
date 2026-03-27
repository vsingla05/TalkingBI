import redis
from config import REDIS_HOST, REDIS_PORT

# Single shared Redis client (thread-safe via connection pool)
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,  # always return strings, not bytes
)
