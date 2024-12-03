import { RedisClient } from 'src/modal/RedisClient';
import { LockUtil } from 'src/util/lock/LockUtil';
import * as Domain from 'domain';
import * as AsyncLock from 'async-lock';
import Redis from 'ioredis';
const redis = new Redis({ host: 'localhost', port: 6379, password: '123' });

describe('LockUtil', () => {
  it('should create an instance of LockUtil', async () => {
    const redisClients: RedisClient[] = [
      { host: 'localhost', port: 6379, password: '123' },
    ];

    const lockUtil = new LockUtil(redisClients);

    const result = await lockUtil.redlock.using(
      ['name'],
      2000,
      async (signal) => {
        console.log(signal);
        await new Promise<void>((res) => {
          setTimeout(() => {
            res();
          }, 5000);
        });

        console.log(signal);
        return 'Hello World';
      },
    );

    lockUtil.close();
    expect(result).toBe('Hello World');
  }, 10000000);

  // Write more tests here to test the behavior of LockUtil methods
  it('reentrant test', async () => {
    const redisClients: RedisClient[] = [
      { host: 'localhost', port: 6379, password: '123' },
    ];

    const lockUtil = new LockUtil(redisClients);
    // const lock = new AsyncLock();
    const lock = new AsyncLock({ domainReentrant: true });
    const d = Domain.create();

    const result = await lockUtil.redlock.using(
      ['name'],
      2000,
      async (signal) => {
        d.run(function () {
          lock.acquire('key', async function () {
            await redis
              .get('gg')
              .then(function (value) {
                console.log(value);
              })
              .catch((e) => console.log(e));
            //Enter lock
            return lock.acquire('key', function () {
              redis.hget('gg', 'value').then(function (value) {
                console.log(value);
              });
            });
          });
        });

        await new Promise<void>((res) => {
          setTimeout(() => {
            res();
          }, 35000);
        });

        console.log(signal);
        return 'Hello World';
      },
    );

    lockUtil.close();
    expect(result).toBe('Hello World');
  }, 10000000);
});
