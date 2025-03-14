const crypto = require('crypto');

const randomBytes = (length) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const hexToBytes = (hex) => {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const toHex = (bytes) => Buffer.from(bytes).toString('hex');

const randomByteArray = randomBytes(16); // Generate 16 random bytes
console.log('Random Bytes:', randomByteArray);

const hexString = toHex(randomByteArray);
console.log('Hex String:', hexString);

const convertedBytes = hexToBytes(hexString);
console.log('Converted Bytes:', convertedBytes);
