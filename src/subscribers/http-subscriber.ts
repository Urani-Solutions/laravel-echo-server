import { Log } from './../log';
import { Subscriber } from './subscriber';

export class HttpSubscriber implements Subscriber {
    /**
     * Create new instance of http subscriber.
     *
     * @param  {any} express
     */
    constructor(private express: any, private options: any) { }

    /**
     * Subscribe to events to broadcast.
     *
     * @return {void}
     */
    subscribe(callback: any): Promise<void> {
        return new Promise((resolve) => {
            // Broadcast a message to a channel
            this.express.post('/apps/:appId/events', (req: any, res: any) => {
                let body: any = [];
                res.on('error', (error: any) => {
                    if (this.options.devMode) {
                        Log.error(error);
                    }
                });

                req.on('data', (chunk) => body.push(chunk))
                    .on('end', () => this.handleData(req, res, body, callback));
            });

            Log.success('Listening for http events...');

            resolve(void 0);
        });
    }

    /**
     * Unsubscribe from events to broadcast.
     *
     * @return {Promise<void>}
     */
    unsubscribe(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.express.post('/apps/:appId/events', (req: any, res: any) => {
                    res.status(404).send();
                });
                resolve(void 0);
            } catch(e) {
                reject('Could not overwrite the event endpoint -> ' + e);
            }
        });
    }

    /**
     * Handle incoming event data.
     *
     * @param  {any} req
     * @param  {any} res
     * @param  {any} body
     * @param  {Function} broadcast
     * @return {Promise<boolean>}
     */
    handleData(req: any, res: any, body: any, broadcast: any): Promise<boolean> {
        body = JSON.parse(Buffer.concat(body).toString());

        if ((body.channels || body.channel) && body.name && body.data) {

            var data = body.data;
            try {
                data = JSON.parse(data);
            } catch (e) { }

            var message = {
                event: body.name,
                data: data,
                socket: body.socket_id
            }
            var channels = body.channels || [body.channel];

            if (this.options.devMode) {
                Log.info("Channel: " + channels.join(', '));
                Log.info("Event: " + message.event);
            }

            channels.forEach(channel => broadcast(channel, message));
        } else {
            return this.badResponse(
                req,
                res,
                'Event must include channel, event name and data'
            );
        }

        res.json({ message: 'ok' })
    }

    /**
     * Handle bad requests.
     *
     * @param  {any} req
     * @param  {any} res
     * @param  {string} message
     * @return {Promise<boolean>}
     */
    badResponse(req: any, res: any, message: string): Promise<boolean> {
        res.statusCode = 400;
        res.json({ error: message });

        return Promise.resolve(false);
    }
}
