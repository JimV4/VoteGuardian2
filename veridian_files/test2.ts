import signify, {
  CreateIdentiferArgs,
  EventResult,
  Operation,
  randomPasscode,
  ready,
  Salter,
  Serder,
  SignifyClient,
  Tier,
} from 'signify-ts';
import assert from 'assert';
import { waitAndMarkNotification } from './utils/test-util';
import { randomBytes } from 'crypto';

await ready();

const bran = 'a9F3kQ2ZxM7P0WcR4LJYs';
const url = 'https://keria.veridian.dandelion.link';
const boot_url = 'https://keria-boot.veridian.dandelion.link';

// const url = 'http://127.0.0.1:3901';
// const boot_url = 'http://127.0.0.1:3903';

const client = new SignifyClient(url, bran, Tier.low, boot_url);

await client.boot();
await client.connect();
console.log(client);

/* ------------------------------------------------------------------------- */
// Dhmioyrgia identifier toy bob

const resultBob = await client.identifiers().create('bobk');
const operationBob = await resultBob.op();
const prefixBob = resultBob.serder.ked.i;

// const bobOobi = await client.oobis().get(prefixBob, 'agent');
// const op = await client.oobis().resolve(bobOobi, prefixBob);

// Vazw sthn bob to agent end role kai oobi
const result12Bob = await client.identifiers().addEndRole(prefixBob, 'agent', client.agent!.pre);
console.log('bob0');
await client
  .oobis()
  .resolve('https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao');

console.log('bob');
// Dhmioyrgia identifier ths alice

const result = await client.identifiers().create('alicek');
const operation = await result.op();
const prefix = result.serder.ked.i;
console.log(prefix);

/////////////////////////////////////////////////////////////////////////////////////

// Vazw sthn alice to agent end role kai oobi
const result12 = await client.identifiers().addEndRole(prefix, 'agent', client.agent!.pre);
console.log('alice1');

console.log('alice2');
// DHmioyrgoyme to registry ths alice
const result2 = await client.registries().create({
  name: prefix,
  registryName: 'Alice6',
  nonce: 'AAd7Zfk6072acq_37bw29qiHOkG3-vErjQGdtjPRmVE_',
});
const registryPrefix = result2.regser.pre;
const midnightSecret = randomBytes(32).toString('hex');

const QVI_SCHEMA_SAID = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';

console.log('before issue');
await client
  .oobis()
  .resolve('https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao');
const result3 = await client.credentials().issue(prefix, {
  ri: registryPrefix,
  s: QVI_SCHEMA_SAID,
  a: {
    i: prefixBob,
    voting_secret: midnightSecret,
    LEI: '5493001KJTIIGC8Y1R17',
  },
});
const acdcSaid = result3.acdc.ked.d;
console.log(acdcSaid);

const acdc = await client.credentials().get(acdcSaid);
console.log(acdc);

const [grant, gsigs, gend] = await client.ipex().grant({
  senderName: prefix,
  acdc: new Serder(acdc.sad),
  anc: new Serder(acdc.anc),
  iss: new Serder(acdc.iss),
  ancAttachment: acdc.ancAttachment,
  recipient: prefixBob,
  datetime: new Date().toISOString().replace('Z', '000+00:00'),
});

const operationGrant = await client.ipex().submitGrant(prefix, grant, gsigs, gend, [prefixBob]);

console.log('grant happened');
// const [admit, asigs, aend] = await client.ipex().admit({
//     senderName: prefix,
//     grantSaid: grantExn.d,
//     recipient: prefixBob,
//     datetime: new Date().toISOString().replace('Z', '000+00:00'),
// });

// const operationAdmit = await client
//     .ipex()
//     .submitAdmit(prefix, admit, asigs, aend, [prefix]);

// const grantMsgSaid = await waitAndMarkNotification(client, '/exn/ipex/grant');
