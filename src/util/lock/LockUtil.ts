import Client from 'ioredis';
import Redlock, { ResourceLockedError } from 'redlock';
import { RedisClient } from 'src/modal/RedisClient';


export class LockUtil {
  public redlock: Redlock;

  constructor(redisArray: RedisClient[]) {
    this.init(redisArray);
  }

  public init(redisArray) {
    try {
      const redisClients = redisArray.map((redisClient) => {
        return new Client(redisClient);
      });
      this.redlock = new Redlock(
        // You should have one client for each independent redis node
        // or cluster.
        redisClients,
        {
          // The expected clock drift; for more details see:
          // http://redis.io/topics/distlock
          driftFactor: 0.01, // multiplied by lock ttl to determine drift time

          // The max number of times Redlock will attempt to lock a resource
          // before erroring.
          retryCount: 10,

          // the time in ms between attempts
          retryDelay: 200, // time in ms

          // the max time in ms randomly added to retries
          // to improve performance under high contention
          // see https://www.awsarchitectureblog.com/2015/03/backoff.html
          retryJitter: 200, // time in ms

          // The minimum remaining time on a lock before an extension is automatically
          // attempted with the `using` API.
          automaticExtensionThreshold: 500, // time in ms
        },
      );

      this.redlock.on('error', (error) => {
        // Ignore cases where a resource is explicitly marked as locked on a client.
        if (error instanceof ResourceLockedError) {
          return;
        }

        // Log all other errors.
        console.error(error);
      });

      this.redlock.on('message', (channel, message) => {
        console.log(`Received ${message} from ${channel}`);
      });
    } catch (e) {
      console.log(e);
    }
  }

  public close() {
    this.redlock.quit();
  }
  // public async getLock() {
  //   // Acquire a lock.
  //   let lock = await this.redlock.acquire(['a'], 5000);
  //   try {
  //     // Do something...
  //     //await something();

  //     // Extend the lock.
  //     lock = await lock.extend(5000);

  //     // Do something else...
  //     // await somethingElse();
  //   } finally {
  //     // Release the lock.
  //     await lock.release();
  //   }
  // }

  //   The using method wraps and executes a routine in the
  //   context of an auto-extending lock, returning a promise
  //   of the routine's value. In the case that auto-extension
  //   fails, an AbortSignal will be updated to indicate that
  //   abortion of the routine is in order, and to pass along the encountered error.

  //   The first parameter is an array of resources to lock;
  //   the second is the requested lock duration in milliseconds,
  //   which MUST NOT contain values after the decimal.
  //public async getUsing() {
  // await this.redlock.using([senderId, recipientId], 5000, async (signal) => {
  //   // Do something...
  //   await something();
  //   // Make sure any attempted lock extension has not failed.
  //   if (signal.aborted) {
  //     throw signal.error;
  //   }
  //   // Do something else...
  //   await somethingElse();
  // });
  //}
}
