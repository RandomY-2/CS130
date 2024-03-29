const FirebaseSingleton = require('../third_party/db');
const firebaseInstance = FirebaseSingleton.getInstance();
const db = firebaseInstance.getDatabase();

/**
 * Retrieves a list of forum IDs that a given user has access to.
 *
 * @param {object} req - The request object, including the authenticated user's ID.
 * @param {object} res - The response object used to return the list of accessible forum IDs or an error.
 */
module.exports.getAccessForums = async (req, res) => {
    const userId = req.user.id;

    try {
        const accessibleForumsSnapshot = await db.collection('users').doc(userId).collection('AccessibleForums').get();
        const accessibleForumIds = accessibleForumsSnapshot.docs.map(doc => doc.id);

        const forumFetchPromises = accessibleForumIds.map(forumId => {
            return db.collection('forums').doc(forumId).get();
        });

        const forumSnapshots = await Promise.all(forumFetchPromises);

        const accessibleForums = forumSnapshots.filter(snapshot => snapshot.exists).map(snapshot => {
            return { id: snapshot.id, name: snapshot.data().name, rating: snapshot.data().forumRating, imageURL: snapshot.data().url };
        });

        res.status(200).json({ accessibleForums });
    } catch (error) {
        console.error('Error fetching accessible forums:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieves all comments for a specified forum.
 *
 * @param {object} req - The request object, containing the forum ID in the body.
 * @param {object} res - The response object used to return the comments or an error.
 */

module.exports.getComment = async (req, res) => {
    const { forumId } = req.body;
    console.log('Get all comments from ', { forumId });

    try {
        const forumDocRef = db.collection('forums').doc(forumId);
        const forumDoc = await forumDocRef.get();

        if (!forumDoc.exists) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        const commentsSnapshot = await forumDocRef.collection('comments')
                                                   .orderBy('timestamp')
                                                   .get();
        const commentsPromises = commentsSnapshot.docs.map(async (doc) => {
            const commentData = doc.data();
            const userSnapshot = await db.collection('users').doc(commentData.usersRefNum).get();
            const userData = userSnapshot.data();
            return {
                id: doc.id,
                content: commentData.content,
                timestamp: commentData.timestamp,
                user: userData.name,
            };
        });

        // Resolve all promises from the map
        const comments = await Promise.all(commentsPromises);

        return res.status(200).json({ comments });
    } catch (error) {
        console.log('Error retrieving comments: ', error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Adds a new comment to a specified forum.
 *
 * @param {object} req - The request object, containing the forum ID and comment content.
 * @param {object} res - The response object used to confirm the addition of the comment or an error.
 */
module.exports.addComment = async (req, res) => {
    const { forumId, content } = req.body;
    const userId = req.user.id;
    console.log('received comment', { content, userId });

    try {
        const forumDocRef = db.collection('forums').doc(forumId);
        const forumDoc = await forumDocRef.get();

        if (!forumDoc.exists) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        // add comment to the subcollection
        const commentData = {
            content: content,
            usersRefNum: userId,
            timestamp: new Date(),
        };

        const commentRef = await forumDocRef.collection('comments').add(commentData);

        return res.status(200).json({ message: 'Comment added successfully', comment: content, userId: userId });
    } catch (error) {
        console.log('Error adding comment:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Adds or updates a rating for a specified forum by a user.
 *
 * @param {object} req - The request object, containing the forum ID and rating.
 * @param {object} res - The response object used to confirm the rating update or return an error.
 */
module.exports.addOrUpdateForumRating = async (req, res) => {
    const { forumId, rating } = req.body;
    const userId = req.user.id;
    console.log('received update rating request', { forumId, userId, rating });

    // Check if rating is within the valid range (1 to 5)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating. Rating must be an integer between 1 and 5' });
    }

    try {
        // Check if the forum exists
        const forumRef = db.collection('forums').doc(forumId);
        const forumDoc = await forumRef.get();
        if (!forumDoc.exists) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        // Check if the user has access to this forum
        const userAccessForumRef = db.collection('users').doc(userId).collection('AccessibleForums').doc(forumId);
        const userAccessForumDoc = await userAccessForumRef.get();
        if (!userAccessForumDoc.exists) {
            return res.status(403).json({ error: 'User does not have access to this forum' });
        }

        // Get the previous rating if exists
        const previousRating = userAccessForumDoc.data()?.rating || 0;

        // Update or add the rating
        await userAccessForumRef.set({ rating: rating }, { merge: true });

        // Update forum's total rating statistics
        const forumData = forumDoc.data();
        const totalScore = (forumData.totalScore || 0) - previousRating + rating;
        const totalUsers = (forumData.totalUsers || 0) + (previousRating === 0 ? 1 : 0);
        const forumRating = totalScore / totalUsers;

        await forumRef.update({
            totalScore,
            totalUsers,
            forumRating
        });


        return res.status(200).json({ message: 'Rating added/updated successfully', forumRating: forumRating });
    } catch (error) {
        console.error('Error adding/updating rating:', error);
        return res.status(500).json({ message: error.message });
    }
};
