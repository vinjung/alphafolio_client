import { Redis } from 'ioredis';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'redis-client' });

// REDIS_URL 환경 변수 유효성 검사
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  log.warn(
    'REDIS_URL 환경 변수가 설정되지 않았습니다. Redis 기능이 비활성화됩니다.'
  );
}

const globalForRedis = globalThis as unknown as {
  redis?: Redis | null;
};

let redis: Redis | null = null;

// Parse REDIS_URL into individual options to avoid ioredis URL encoding issues
// (ioredis does not decode percent-encoded passwords like %40 -> @)
function parseRedisOptions(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    family: parsed.hostname.endsWith('.railway.internal') ? 6 : 0,
    password: parsed.password
      ? decodeURIComponent(parsed.password)
      : undefined,
    username:
      parsed.username && parsed.username !== 'default'
        ? parsed.username
        : undefined,
    connectTimeout: 3000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  };
}

if (redisUrl) {
  const options = parseRedisOptions(redisUrl);

  if (process.env.NODE_ENV === 'production') {
    log.info('Production 환경 Redis 연결 시도...');
    redis = new Redis(options);

    redis.on('connect', () => log.info('Production Redis 연결 성공!'));
    redis.on('error', (err) => {
      log.error(`Production Redis 연결 오류: ${err.message}`, {
        error_name: err.name,
        error_stack: err.stack,
      });
    });
    redis.on('reconnecting', (delay: number) =>
      log.warn(`Production Redis 재연결 시도 중... (딜레이: ${delay}ms)`)
    );
    redis.on('end', () => log.info('Production Redis 연결 종료.'));
  } else {
    if (!globalForRedis.redis) {
      log.info('Development 환경 Redis 연결 시도 (싱글톤)...');
      globalForRedis.redis = new Redis(options);
      globalForRedis.redis.on('connect', () =>
        log.info('Development Redis 연결 성공!')
      );
      globalForRedis.redis.on('error', (err) =>
        log.error(`Development Redis 연결 오류: ${err.message}`, {
          error_name: err.name,
          error_stack: err.stack,
        })
      );
      globalForRedis.redis.on('reconnecting', (delay: number) =>
        log.warn(`Development Redis 재연결 시도 중... (딜레이: ${delay}ms)`)
      );
      globalForRedis.redis.on('end', () =>
        log.info('Development Redis 연결 종료.')
      );
    }
    redis = globalForRedis.redis;
  }
}

export { redis };
