const { webcrypto } = require('crypto');
const crypto = webcrypto;

// Helper to export key to ArrayBuffer then encode to Base64
function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

async function generateECDHAndECDSAKeys() {
  const ecdhKeyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveBits'],
  );

  const ecdsaKeyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );

  return { ecdhKeyPair, ecdsaKeyPair };
}

async function exportPublicKey(key) {
  return await crypto.subtle.exportKey('spki', key);
}

async function importPublicKey(keyData, algorithm) {
  if (!(keyData instanceof ArrayBuffer)) {
    throw new TypeError('Key data must be an ArrayBuffer');
  }

  return crypto.subtle.importKey('spki', keyData, algorithm, true, ['verify']);
}

function uint8ArrayToHex(uint8Array) {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function signData(privateKey, data) {
  return crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data,
  );
}

async function verifySignature(publicKey, signature, data) {
  return crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    publicKey,
    signature,
    data,
  );
}

async function deriveSharedSecret(myPrivateKey, theirPublicKey) {
  return crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    myPrivateKey,
    256,
  );
}

async function runKeyExchange() {
  // Generate key pairs
  const user = await generateECDHAndECDSAKeys();
  const university = await generateECDHAndECDSAKeys();

  // Export ECDH public keys (SPKI)
  const userECDHPubRaw = await exportPublicKey(user.ecdhKeyPair.publicKey);
  const universityECDHPubRaw = await exportPublicKey(university.ecdhKeyPair.publicKey);

  // Sign ECDH public keys with ECDSA private keys
  const userSignature = await signData(user.ecdsaKeyPair.privateKey, userECDHPubRaw);
  const universitySignature = await signData(university.ecdsaKeyPair.privateKey, universityECDHPubRaw);

  // Exchange data
  const userData = {
    ecdhPubKeyRaw: userECDHPubRaw,
    signature: userSignature,
    ecdsaPubKeyRaw: await exportPublicKey(user.ecdsaKeyPair.publicKey),
  };

  const universityData = {
    ecdhPubKeyRaw: universityECDHPubRaw,
    signature: universitySignature,
    ecdsaPubKeyRaw: await exportPublicKey(university.ecdsaKeyPair.publicKey),
  };

  // Import verification keys
  const userVerifyingKey = await importPublicKey(universityData.ecdsaPubKeyRaw, {
    name: 'ECDSA',
    namedCurve: 'P-256',
  });

  console.log(userVerifyingKey);

  const universityVerifyingKey = await importPublicKey(userData.ecdsaPubKeyRaw, {
    name: 'ECDSA',
    namedCurve: 'P-256',
  });

  // Verify signatures
  const userVerified = await verifySignature(userVerifyingKey, universityData.signature, universityData.ecdhPubKeyRaw);
  const universityVerified = await verifySignature(universityVerifyingKey, userData.signature, userData.ecdhPubKeyRaw);

  if (!userVerified || !universityVerified) {
    throw new Error('Signature verification failed. Possible MITM attack.');
  }

  // Import peer ECDH keys
  const userECDHPub = await crypto.subtle.importKey(
    'spki',
    universityData.ecdhPubKeyRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );

  const universityECDHPub = await crypto.subtle.importKey(
    'spki',
    userData.ecdhPubKeyRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );

  // Derive shared secrets
  const userSecret = await deriveSharedSecret(user.ecdhKeyPair.privateKey, userECDHPub);
  const universitySecret = await deriveSharedSecret(university.ecdhKeyPair.privateKey, universityECDHPub);

  console.log('User Secret:', Buffer.from(userSecret).toString('hex'));
  console.log('University Secret:', Buffer.from(universitySecret).toString('hex'));

  const userSecretUint8 = new Uint8Array(userSecret);
  const universitySecretUint8 = new Uint8Array(universitySecret);
  console.log(userSecretUint8);
  console.log(universitySecretUint8);
  console.log(uint8ArrayToHex(userSecretUint8));
  console.log(uint8ArrayToHex(universitySecretUint8));
}

runKeyExchange().catch(console.error);
