// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
// Initialize the app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection string (replace with your MongoDB URI)
const mongoURI = 'mongodb+srv://dhmhtrhsvassiliou:pIzxC9sXgUSHpXWi@cluster0.ai7xh.mongodb.net/';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  publicKey: String,
});

const User = mongoose.model('User', userSchema);

// Endpoint to check if user exists
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Query the database
    const user = await User.findOne({ username, password });

    if (user) {
      if (!user.publicKey) {
        const secretKeybytes = new Uint8Array(32);
        crypto.getRandomValues(secretKeybytes);
        const toHex = (bytes) => Buffer.from(bytes).toString('hex');
        const secretKeyHex = toHex(secretKeybytes);

        // Hash the secret key using SHA-256 to create the public key
        const hashSHA256 = (data) => {
          return crypto.createHash('sha256').update(data, 'hex').digest('hex');
        };
        const publicKeyHex = hashSHA256(secretKeyHex);

        user.publicKey = publicKeyHex;
        await user.save();
        res.status(200).json({ message: 'User found.', secretKey: secretKeyHex });
      } else {
        res.status(200).json({ message: 'User found.' });
      }
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Endpoint to insert a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    // Create a new user
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
