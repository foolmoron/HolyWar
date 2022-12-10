import { firestore, logger } from 'firebase-functions';
import admin from 'firebase-admin';
import { FieldValue } from '@google-cloud/firestore';

function assert(value: unknown, message: string): asserts value {
    if (!value) throw new Error(`Assertion failed: ${message}`);
}

admin.initializeApp();
const db = admin.firestore();

const increment = FieldValue.increment(1);

export const onInfluence = firestore
    .document('users/{userId}/influences/{influenceId}')
    .onCreate(async (change, context) => {
        // Grab values
        const time = change.updateTime?.toMillis();
        assert(time, 'time is undefined');

        const loc = change.data()?.loc as string;
        assert(loc, 'loc is undefined');

        const sect = await(
            await db.doc(`users/${context.params.userId}`).get()
        ).data()?.sect as string;
        assert(sect, 'sect is undefined');

        const limitHours = await(
            await db.doc('config/influence_limit_hours').get()
        ).data()?.value as number;
        assert(limitHours, 'limitHours is undefined');

        logger.log('Influencing!', {
            loc,
            sect,
        });

        // Check for prev within limit
        const influenceWithinLimit = await db
            .collection(`users/${context.params.userId}/influences`)
            .where('loc', '==', loc)
            .where('time', '>=', time - limitHours * 60 * 60 * 1000)
            .limit(1)
            .get();

        // Set timestamp after so it's not counted in above query
        await change.ref.update({
            time,
        });

        // Reject if within limit
        if (influenceWithinLimit.size > 0) {
            logger.log(
                'Found influence within time limit, rejecting this new influence',
                { prevInfluence: influenceWithinLimit.docs[0] }
            );
            await change.ref.delete();
            return;
        }

        // Add scores
        const usersToAddScore = await db
            .collection('users')
            .where('sect', '==', sect)
            .get();
        logger.log('Influencing sect, adding score to users', {
            sect,
            userCount: usersToAddScore.size,
            userIds: usersToAddScore.docs.map((user) => user.id),
        });
        await Promise.all(
            usersToAddScore.docs.map(async (user) => {
                await db.doc(`users/${user.id}`).update({
                    score: increment,
                });
            })
        );
    });
