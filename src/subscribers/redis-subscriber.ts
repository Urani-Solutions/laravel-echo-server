import Redis from 'ioredis';
import { Log } from './../log';
import { Subscriber } from './subscriber';

export class RedisSubscriber implements Subscriber {
    /**
     * Redis pub/sub client.
     *
     * @type {object}
     */
    private _redis: any;

    /**
     *
     * KeyPrefix for used in the redis Connection
     *
     * @type {String}
     */
    private _keyPrefix: string;

    /**
     * Create a new instance of subscriber.
     *
     * @param {any} options
     */
    constructor(private options: any) {
        this._keyPrefix = options.databaseConfig.redis.keyPrefix || '';
        this._redis = new Redis(options.databaseConfig.redis);
        // Log all Redis errors
        this._redis.on('error', (err) => {
            Log.error('Redis Error:');
            Log.error(err);
        });
    }

    /**
     * Subscribe to events to broadcast.
     *
     * @return {Promise<any>}
     */
    subscribe(callback): Promise<any> {

        return new Promise((resolve, reject) => {
            this._redis.on('pmessage', (subscribed, channel, message) => {
                try {
                    message = JSON.parse(message);

                    if (this.options.devMode) {
                        Log.info("Channel: " + channel);
                        Log.info("Event: " + message.event);
                    }

                    callback(channel.substring(this._keyPrefix.length), message);
                } catch (e) {
                    if (this.options.devMode) {
                        Log.info("No JSON message");
                    }
                }
            });

            this._redis.psubscribe(`${this._keyPrefix}*`, (err, count) => {
                if (err) {
                    reject('Redis could not subscribe.')
                }

                Log.success('Listening for redis events...');

                resolve(void 0);
            });
        });
    }

    /**
     * Unsubscribe from events to broadcast.
     *
     * @return {Promise}
     */
    unsubscribe(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this._redis.disconnect();
                resolve(void 0);
            } catch(e) {
                reject('Could not disconnect from redis -> ' + e);
                // Optionally, for type safety, could use: reject(void 0);

            }
        });
    }
}
