import { firestore, logger } from 'firebase-functions';
import admin from 'firebase-admin';
import { FieldValue } from '@google-cloud/firestore';
import fetch from 'node-fetch';

const IMAGE_BUCKET = 'holy-war-d3052_images';

function assert(value: unknown, message: string): asserts value {
    if (!value) throw new Error(`Assertion failed: ${message}`);
}

admin.initializeApp();
const db = admin.firestore();

const increment1 = FieldValue.increment(1);

export const onCreateUser = firestore
    .document('users/{userId}')
    .onCreate(async (change, context) => {
        change.ref.update({
            score: FieldValue.increment(0), // safe way to init
        });
    });

export const onInfluence = firestore
    .document('users/{userId}/influences/{influenceId}')
    .onCreate(async (change, context) => {
        // Grab values
        const time = change.updateTime?.toMillis();
        assert(time, 'time is undefined');

        const loc = change.data()?.loc as string;
        assert(loc, 'loc is undefined');

        const sect = (await (
            await db.doc(`users/${context.params.userId}`).get()
        ).data()?.sect) as string;
        assert(sect, 'sect is undefined');

        const limitHours = (await (
            await db.doc('config/influence_limit_hours').get()
        ).data()?.value) as number;
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
                { prevInfluence: influenceWithinLimit.docs[0].id }
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
                    score: increment1,
                });
            })
        );
    });

export const copyImage = firestore
    .document('places/{userId}')
    .onWrite(async (change, _context) => {
        if (!change.after.exists) {
            return;
        }

        const imageUrl = change.after.data()?.imageUrl as string;
        if (imageUrl.startsWith('https://storage.googleapis.com')) {
            logger.log('Image already cached to google storage, aborting', {
                imageUrl,
            });
            return;
        }

        logger.log('Downloading image to cache', {
            imageUrl,
        });
        const imageBuffer = await fetch(imageUrl).then((res) =>
            res.arrayBuffer()
        );
        const file = admin
            .storage()
            .bucket(IMAGE_BUCKET)
            .file(`${change.after.id}.png`);
        await file.save(Buffer.from(imageBuffer));

        const newUrl = file.publicUrl();
        await change.after.ref.update({
            imageUrl: newUrl,
        });
        logger.log('Successfully cached image', {
            newUrl,
        });
    });
