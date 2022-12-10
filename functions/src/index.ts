import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import { FieldValue } from '@google-cloud/firestore';

function assert(value: unknown, message: string): asserts value {
    if (!value) throw Error(`Assertion failed: ${message}`);
}

admin.initializeApp();
const db = admin.firestore();

const increment = FieldValue.increment(1);

console.warn('hi');

export const onInfluence = functions.firestore
    .document('users/{userId}/influences/{influenceId}')
    .onWrite(async (change, context) => {
        if (context.eventType !== 'google.firestore.document.create') {
            return;
        }

        // Grab values
        const time = change.after.updateTime?.toMillis();
        assert(time, 'time is undefined');

        const loc = change.after.data()?.loc as string;
        assert(loc, 'loc is undefined');

        const sect = (await (
            await db.doc(`users/${context.params.userId}`).get()
        ).data()?.sect) as string;
        assert(sect, 'sect is undefined');

        const limitHours = (await (
            await db.doc('config/influence_limit_hours').get()
        ).data()?.value) as number;
        assert(limitHours, 'limitHours is undefined');

        console.log(
            `Influencing loc '${loc}' for sect '${sect}' by user '${context.params.userId}'`
        );

        // Check for limit
        const influenceWithinLimit = await db
            .collection(`users/${context.params.userId}/influences`)
            .where('time', '>=', time - limitHours * 60 * 60 * 1000)
            .limit(1)
            .get();
        if (influenceWithinLimit.size > 0) {
            console.log(
                `Found influence within time limit, rejecting this new influence: ${influenceWithinLimit.docs[0].id}`
            );
            await change.after.ref.delete();
            return;
        }

        // Add scores
        const usersToAddScore = await db
            .collection('users')
            .where('sect', '==', sect)
            .get();
        console.log(
            `Influencing sect '${sect}', adding score to ${usersToAddScore.size} users`
        );
        await Promise.all(
            usersToAddScore.docs.map(async (user) => {
                await db.doc(`users/${user.id}`).update({
                    score: increment,
                });
            })
        );
    });
