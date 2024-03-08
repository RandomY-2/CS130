const FirebaseSingleton = require('../third_party/db');
const firebaseInstance = FirebaseSingleton.getInstance();
const db = firebaseInstance.getDatabase();

module.exports.getAccessForums = async (req, res) => {
    const userId = req.user.id; 

    try {
        const accessibleForumsSnapshot = await db.collection('users').doc(userId).collection('AccessibleForums').get();
        const accessibleForumIds = accessibleForumsSnapshot.docs.map(doc => doc.id);
        // Return the list of accessible forum IDs by current user
        res.status(200).json({ accessibleForums: accessibleForumIds });
    } catch (error) {
        console.error('Error fetching accessible forums:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports.getComment = async (req, res) => {
    const { forumId } = req.body;
    console.log('Get all comments from ', { forumId });

    try {
        const forumDocRef = db.collection('forums').doc(forumId);
        const forumDoc = await forumDocRef.get();

        // Check if forum exists
        if (!forumDoc.exists) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        // Retrieve all comments for the forum
        const commentsSnapshot = await forumDocRef.collection('comments').get();
        const comments = [];

        commentsSnapshot.forEach((doc) => {
            comments.push({
                id: doc.id,
                data: doc.data()
            });
        });

        return res.status(200).json({ comments });
    } catch (error) {
        console.log('Error retrieving comments: ', error);
        return res.status(500).json({ message: error.message });
    }
};


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
