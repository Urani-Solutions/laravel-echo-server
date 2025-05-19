import { Database } from './../database';
import { Log } from './../log';
var _ = require("lodash");

export class PresenceChannel {
    /**
     * Database instance.
     */
    db: Database;

    /**
     * Create a new Presence channel instance.
     */
    constructor(private io, private options: any) {
        this.db = new Database(options);
    }

    /**
     * Get the members of a presence channel.
     */
    getMembers(channel: string): Promise<any> {
        return this.db.get(channel + ":members");
    }

    /**
     * Check if a user is on a presence channel.
     */
    isMember(channel: string, member: any): Promise<boolean> {
        return new Promise((resolve) => {
            this.getMembers(channel).then(
                (members) => {
                    this.removeInactive(channel, members, member).then(
                        (members: any) => {
                            let search = members.filter(
                                (m: any) => m.user_id == member.user_id
                            );

                            if (search && search.length) {
                                resolve(true);
                            }

                            resolve(false);
                        }
                    );
                },
                (error: any) => Log.error(error)
            );
        });
    }

    /**
     * Remove inactive channel members from the presence channel.
     */
    removeInactive(channel: string, members: any[], member: any): Promise<any> {
        return new Promise((resolve) => {
            this.io
                .of("/")
                .in(channel)
                .allSockets()
                .then((clients: Set<string>) => {
                    members = members || [];
                    // clients is a Set in v4
                    members = members.filter((member) => {
                        return clients.has(member.socketId);
                    });

                    this.db.set(channel + ":members", members);

                    resolve(members);
                })
                .catch((error: any) => {
                    resolve(members || []);
                });
        });
    }

    /**
     * Join a presence channel and emit that they have joined only if it is the
     * first instance of their presence.
     */
    join(socket: any, channel: string, member: any) {
        if (!member) {
            if (this.options.devMode) {
                Log.error(
                    "Unable to join channel. Member data for presence channel missing"
                );
            }

            return;
        }

        this.isMember(channel, member).then(
            (is_member: boolean) => {
                this.getMembers(channel).then(
                    (members: any[]) => {
                        members = members || [];
                        member.socketId = socket.id;
                        members.push(member);

                        this.db.set(channel + ":members", members);

                        members = _.uniqBy(members.reverse(), "user_id");

                        this.onSubscribed(socket, channel, members);

                        if (!is_member) {
                            this.onJoin(socket, channel, member);
                        }
                    },
                    (error: any) => Log.error(error)
                );
            },
            (error: any) => {
                Log.error("Error retrieving pressence channel members.");
            }
        );
    }

    /**
     * Remove a member from a presenece channel and broadcast they have left
     * only if not other presence channel instances exist.
     */
    leave(socket: any, channel: string): void {
        this.getMembers(channel).then(
            (members: any[]) => {
                members = members || [];
                let member = members.find((member: any) => member.socketId == socket.id);
                if (!member) {
                    // Member not found, nothing to remove or broadcast
                    return;
                }
                members = members.filter((m: any) => m.socketId != member.socketId);

                this.db.set(channel + ":members", members);

                this.isMember(channel, member).then((is_member: boolean) => {
                    if (!is_member) {
                        delete member.socketId;
                        this.onLeave(socket, channel, member);
                    }
                });
            },
            (error: any) => Log.error(error)
        );
    }

    /**
     * On join event handler.
     */
    onJoin(socket: any, channel: string, member: any): void {
        socket.to(channel).emit("presence:joining", channel, member);
    }

    /**
     * On leave emitter.
     */
    onLeave(socket: any, channel: string, member: any): void {
        socket.to(channel).emit("presence:leaving", channel, member);
    }

    /**
     * On subscribed event emitter.
     */
    onSubscribed(socket: any, channel: string, members: any[]) {
        socket.emit("presence:subscribed", channel, members);
    }
}
