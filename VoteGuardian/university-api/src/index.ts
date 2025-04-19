import { type CredentialSubject, pureCircuits, type Signature } from '@midnight-ntwrk/university-contract';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { randomBytes as nodeRandomBytes } from 'crypto';
import { Request, Response } from 'express';

// Import dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';

// Initialize the app
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const hexToBytes = (hex: string) => {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

function pad(s: string, n: number): Uint8Array {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
}

const hashSubject = (subject: CredentialSubject): string => {
  return toHex(pureCircuits.subject_hash(subject));
};

const generateSignature = (subject: CredentialSubject, sk: Uint8Array): Signature => {
  const msg = Buffer.from(hashSubject(subject), 'hex');
  return pureCircuits.sign(msg, sk);
};

function fromRawSubject(raw: any): CredentialSubject {
  return {
    username: pad(raw.username, 32),
    hashed_secret: new Uint8Array(fromHex(raw.hashed_secret)),
  };
}

// Middleware
app.use(bodyParser.json());

// MongoDB connection string (replace with your MongoDB URI)
const mongoURI = 'mongodb+srv://dhmhtrhsvassiliou:pIzxC9sXgUSHpXWi@cluster0.ai7xh.mongodb.net/';

mongoose.connect(mongoURI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
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
app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password, walletPubKey } = req.body.subject;
  console.log(req.body.subject);

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    console.log(`from server wallet pub key ${walletPubKey}`);
    // Query the database
    const user = await User.findOne({ username, password });
    console.log(user);

    if (user) {
      if (!user.publicKey) {
        const secretKeybytes = new Uint8Array(32);
        crypto.getRandomValues(secretKeybytes);
        const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
        const secretKeyHex = toHex(secretKeybytes);

        // Hash the secret key using SHA-256 to create the public key
        const hashSHA256 = (data: string) => {
          return crypto.createHash('sha256').update(data, 'hex').digest('hex');
        };
        const publicKeyHex = hashSHA256(secretKeyHex);

        user.publicKey = publicKeyHex;
        await user.save();
        res.status(200).json({ message: 'User found.', secretKey: secretKeyHex });
      } else {
        console.log('here');
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
app.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists.' });
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

// const server = createServer((req, res) => {
//   res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin (for development)
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allowed HTTP methods
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allowed headers
//   if (req.method === 'OPTIONS') {
//     // Respond to preflight request
//     res.writeHead(204);
//     res.end();
//     return;
//   }
//   if (req.method === 'POST' && req.url === '/login') {
//     let body = '';

//     req.on('data', (chunk) => {
//       body += chunk.toString();
//     });

//     req.on('end', async () => {
//       let raw, subject, userSignature, subjectHash;
//       raw = JSON.parse(body);
//       console.log('aa4');
//       if (!raw.subject.username || !raw.subject.password) {
//         res.writeHead(400, { message: 'Username and password are required.' });
//         res.end('Not Found');
//       }
//       console.log('point0');

//       try {
//         // Step 1: Parse input
//         raw = JSON.parse(body);
//         console.log(raw);
//         let username = raw.username;
//         let password = raw.password;
//         const user = await User.findOne({ username, password });
//         // let hashed_secret = user?.hashed_secret;
//         let hashed_secret = '2ea3775ee4f00cce35bc398e5c50bc6bdf3e05b837288fa9ada7227d8451a685';
//         console.log({ username: raw.subject.username, hashed_secret });
//         subject = fromRawSubject({ username: raw.subject.username, hashed_secret });
//         console.log(subject);

//         // Query the database
//         // if (user) {
//         try {
//           // Step 4: Generate response on success
//           subjectHash = hashSubject(subject);
//           const hash = subjectHash;
//           const msg = hash;
//           const sk = pad('0x987', 32);
//           const signature = generateSignature(subject, sk);
//           console.log('passedd');
//           res.writeHead(200, { 'Content-Type': 'application/json' });
//           res.end(
//             JSON.stringify({ signature, msg }, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
//           );
//         } catch (error) {
//           console.error('Unexpected server error:', error);
//           res.writeHead(500, { 'Content-Type': 'application/json' });
//           res.end(JSON.stringify({ error: 'Internal server error' }));
//         }
//         // }
//       } catch (error) {
//         console.error('Invalid JSON input:', error);
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Invalid JSON input' }));
//         return;
//       }
//     });
//   } else {
//     res.writeHead(404, { 'Content-Type': 'text/plain' });
//     res.end('Not Found');
//   }
// });

// const PORT = 3000;
// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}/`);
// });

// const subject = {
//   username: 'Alice',
//   hashed_secret: toHex(nodeRandomBytes(32)),
// };

// console.log(subject);
// const signature: Signature = generateSignature(fromRawSubject(subject), pad('0x123', 32));
// console.log(signature);

// Endpoint to insert a new user
// app.post('/register', async (req: Request, res: Response): Promise<void> => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     res.status(400).json({ message: 'Username and password are required.' });
//   }

//   try {
//     // Check if the user already exists
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       res.status(400).json({ message: 'Username already exists.' });
//     } else {
//       // Create a new user
//       const newUser = new User({ username, password });

//       const hashedSecretBytes = new Uint8Array(32);
//       crypto.getRandomValues(hashedSecretBytes);
//       const toHex = (hashedSecretBytes: Uint8Array) => Buffer.from(hashedSecretBytes).toString('hex');
//       const hashedSecretHex = toHex(hashedSecretBytes);

//       newUser.hashed_secret = hashedSecretHex;
//       await newUser.save();

//       res.status(201).json({ message: 'User registered successfully.', user: newUser });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// const server = createServer((req, res) => {
//   res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin (for development)
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allowed HTTP methods
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allowed headers
//   if (req.method === 'OPTIONS') {
//     // Respond to preflight request
//     res.writeHead(204);
//     res.end();
//     return;
//   }
//   if (req.method === 'POST' && req.url === '/sign') {
//     let body = '';

//     req.on('data', (chunk) => {
//       body += chunk.toString();
//     });

//     req.on('end', () => {
//       let raw, subject, userSignature, subjectHash;

//       try {
//         // Step 1: Parse input
//         raw = JSON.parse(body);
//         subject = fromRawSubject(raw.subject);
//         userSignature = {
//           pk: {
//             x: BigInt(raw?.signature.pk.x),
//             y: BigInt(raw?.signature.pk.y),
//           },
//           R: {
//             x: BigInt(raw?.signature.R.x),
//             y: BigInt(raw?.signature.R.y),
//           },
//           s: BigInt(raw?.signature.s),
//         };

//         // Step 2: Compute subject hash
//         subjectHash = hashSubject(subject);
//       } catch (error) {
//         console.error('Invalid JSON input:', error);
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Invalid JSON input' }));
//         return;
//       }

//       try {
//         // Step 3: Verify signature
//         pureCircuits.verify_signature(Buffer.from(subjectHash, 'hex'), userSignature);
//       } catch (error) {
//         console.error('Signature verification failed:', error);
//         res.writeHead(403, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Signature verification failed' }));
//         return;
//       }

//       // Verify against signature registry

//       try {
//         // Step 4: Generate response on success
//         const hash = subjectHash;
//         const sk = pad('0x345', 32);
//         const signature = generateSignature(subject, sk);

//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(
//           JSON.stringify({ hash, signature }, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
//         );
//       } catch (error) {
//         console.error('Unexpected server error:', error);
//         res.writeHead(500, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Internal server error' }));
//       }
//     });
//   } else {
//     res.writeHead(404, { 'Content-Type': 'text/plain' });
//     res.end('Not Found');
//   }
// });

// const subject = {
//   id: toHex(nodeRandomBytes(32)),
//   first_name: 'Alice',
//   last_name: 'Smith',
//   national_identifier: '123-45-6789',
//   birth_timestamp: '1234567890',
// };

// const signature: Signature = generateSignature(fromRawSubject(subject), pad('0x123', 32));

// const input = {
//   subject,
//   signature,
// };

// console.log('Input:', input);

// const PORT = 3000;
// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}/`);
// });

/*
curl -X POST http://localhost:3000/sign      -H "Content-Type: application/json"      -d '{
  "subject": {
    "id": "2ea3775ee4f00cce35bc398e5c50bc6bdf3e05b837288fa9ada7227d8451a685",
    "first_name": "Alice",
    "last_name": "Smith",
    "national_identifier": "123-45-6789",
    "birth_timestamp": "1234567890"
  },
  "signature": {
    "pk": { "x": 0, "y": 0 },
    "R": {
      "x": "18250425320773182875191322741382237911789961875104734001453131557863717856764720531473973773908799734018915806598527734631001064002109",
      "y": "59585660597828398764430543205636994154366615495691729038178371728941073242409678482031297068554263240614514392517288322868536272973223"
    },
    "s": "9589090694631275093367095506100403814460881701424917773052016196853504263295565524861055401236141738701836009274121920923060224050114"
  }
}' | jq



{
  "hash": "2c142d00b212644216b4469435ed4b979e8d5139d917c599baaa62bd171504c7",
  "signature": {
    "pk": {
      "x": "0",
      "y": "0"
    },
    "R": {
      "x": "94274180075211532100105663883483095814594123004786781269726409837380726931960064477719543689645874893136628976288238269072299544913388",
      "y": "2591002812354145244166080049779982255011999556763671273197282527791340187036495136631448656665490476659055900861615790415107382016999"
    },
    "s": "94553522974466636013374815211136044108559561951181758599534859053374612204589717963214674964422169696227411079896380304860687124777257"
  }
}

 */
