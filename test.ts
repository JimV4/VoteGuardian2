import { randomPasscode, ready, SignifyClient, Tier } from 'signify-ts';

await ready();

const bran = randomPasscode();
const url = 'http://127.0.0.1:3901';
const boot_url = 'http://127.0.0.1:3903';
const actualSignifyClient = new SignifyClient(url, bran, Tier.low, boot_url);

console.log(actualSignifyClient);
