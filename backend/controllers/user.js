const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const FirebaseSingleton = require('../third_party/db');
const firebaseInstance = FirebaseSingleton.getInstance();
const db = firebaseInstance.getDatabase();

// Helper function to generate a JWT token
const generateToken = (user) => {
  return jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports.register = async (req, res) => {
    const { email, password, name } = req.body;
    console.log('received register request', {email, password, name});

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        console.log("found existing user with same email");

        res.status(400).json({ message: 'Email already in use' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUserRef = db.collection('users').doc();
      await newUserRef.set({
        name,
        email,
        password: hashedPassword,
      });

      console.log("created db entry for", {email, password, name});

      const token = generateToken({ email, id: newUserRef.id });

      console.log("created token for", {email, password, name});

      res.status(200).json({ token, email, name });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports.signin = async (req, res) => {
  const { email, password } = req.body;
  console.log('received login request', {email, password});

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
        console.log("found existing user with same email");

        res.status(404).json({ message: 'User not found' });
        return;
    }

    let user;
    snapshot.forEach(doc => {
      user = { id: doc.id, ...doc.data() };
    });

    console.log('fetched user info for', {email, password});

    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (!isPasswordSame) {
        console.log("user password unmatch for", {email, password});

        res.status(400).json({ message: 'Password Not Correct ' });
        return;
    }

    const token = generateToken(user);

    console.log("created token for", {email, password});

    res.status(200).json({ token, email, name: user.name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.getUsrDetailByEmail = async (req, res) => {
    const { email } = req.params;

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) {
        res.status(404).json({ message: 'User Not Found' });
        return;
      }

      snapshot.forEach(doc => {
        res.status(200).json(doc.data());
      });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports.getUsrByToken = async (req, res) => {
  try {
    console.log("get user by token for", req.user);

    const user = req.user;
    const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', user.email).get();

      if (snapshot.empty) {
        console.log('cannot find in db user: ', req.user);

        res.status(404).json({ message: 'User Not Found' });
        return;
      }

      snapshot.forEach(doc => {
        const {email, name} = doc.data();
        res.status(200).json({email, name});
      });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error.message });
  }
};
