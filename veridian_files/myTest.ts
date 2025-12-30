import { strict as assert } from 'assert';
import { Ilks, Saider, Serder, SignifyClient } from 'signify-ts';
import { resolveEnvironment } from './utils/resolve-env';
import {
  assertNotifications,
  assertOperations,
  createAid,
  getOrCreateClients,
  getOrCreateContact,
  markAndRemoveNotification,
  resolveOobi,
  waitForNotifications,
  waitOperation,
} from './utils/test-util';
import { retry } from './utils/retry';
import { randomUUID } from 'crypto';
import { step } from './utils/test-step';

const { vleiServerUrl } = resolveEnvironment();

const QVI_SCHEMA_SAID = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
const LE_SCHEMA_SAID = 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY';
const vLEIServerHostUrl = `${vleiServerUrl}/oobi`;
const QVI_SCHEMA_URL = `${vLEIServerHostUrl}/${QVI_SCHEMA_SAID}`;
const LE_SCHEMA_URL = `${vLEIServerHostUrl}/${LE_SCHEMA_SAID}`;

// Define interfaces to match the test structure
interface Aid {
  name: string;
  prefix: string;
  oobi: string;
}

let issuerClient: SignifyClient;
let holderClient: SignifyClient;
let verifierClient: SignifyClient;
let legalEntityClient: SignifyClient;

let issuerAid: Aid;
let holderAid: Aid;
let verifierAid: Aid;
let legalEntityAid: Aid;

let applySaid: string;
let offerSaid: string;
let agreeSaid: string;

async function runStandaloneSetup() {
  try {
    console.log('runStandaloneSetup runs now');
    // 1. Initialize the Clients (Connects to KERIA agents)
    // The utility handles the connection and authentication via 'bran'
    const [issuerClient, holderClient] = await getOrCreateClients(2);
    console.log('created clients');
    // 2. Create the Identifiers (AIDs)
    // This creates the actual identity prefixes (e.g., E...123)
    const [issuerAid, holderAid]: Aid[] = await Promise.all([
      createAid(issuerClient, 'issuer'),
      createAid(holderClient, 'holder'),
    ]);

    console.log(`Issuer created with prefix: ${issuerAid.prefix}`);
    console.log(`Holder created with prefix: ${holderAid.prefix}`);

    // 3. Establish the Connection (Contact Exchange)
    // This maps the OOBIs so the agents can find each other
    await Promise.all([
      getOrCreateContact(
        issuerClient,
        'https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
        holderAid.oobi,
      ),
      getOrCreateContact(
        holderClient,
        'https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
        issuerAid.oobi,
      ),
    ]);

    console.log('Connection established. Clients are ready for issuance.');

    // --- YOUR ISSUANCE LOGIC GOES HERE ---
    // (Followed by the IPEX Grant and Admit steps)

    // 4. Cleanup/Validation (Mirroring 'afterAll')
    // Ensures no operations are stuck and notifications are handled
    // await assertOperations(issuerClient, holderClient);
    // await assertNotifications(issuerClient, holderClient);

    console.log('Cleanup check complete. No pending operations.');
  } catch (e) {
    console.error('DETAILED ERROR:', e);
  }
}

// await runStandaloneSetup().catch(console.error);

/**
 * UTILITY: A simple poll/wait function to simulate waiting for the agent to
 * process notifications or background cryptographic operations.
 */
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIssuanceFlow() {
  console.log('--- Phase 1: Setup ---');

  // 1. Initialize Clients
  const [issuerClient, holderClient] = await getOrCreateClients(2);

  // 2. Create AIDs
  const [issuerAid, holderAid] = await Promise.all([createAid(issuerClient, 'issuer'), createAid(holderClient, 'Jim')]);

  console.log('--- Phase 2: Issuance (Issuer Side) ---');

  // 4. Create Credential Registry (Required for issuance)
  const regResult = await issuerClient.registries().create({
    name: issuerAid.name,
    registryName: 'vLEI-registry',
  });
  await waitOperation(issuerClient, await regResult.op());
  const registries = await issuerClient.registries().list(issuerAid.name);
  const registry = registries[0];

  // 5. Issue the Credential (ACDC)
  const vcdata = { LEI: '5493001KJTIIGC8Y1R17' };

  //3. Exchange Contacts
  await Promise.all([
    getOrCreateContact(
      issuerClient,
      'https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
      holderAid.oobi,
    ),
    getOrCreateContact(
      holderClient,
      'https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
      issuerAid.oobi,
    ),
  ]);

  await issuerClient
    .oobis()
    .resolve('https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao');

  await holderClient
    .oobis()
    .resolve('https://cred-issuance.demo.idw-sandboxes.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao');
  const issResult = await issuerClient.credentials().issue(issuerAid.name, {
    ri: registry.regk,
    s: QVI_SCHEMA_SAID,
    a: { i: holderAid.prefix, ...vcdata },
  });
  console.log('issue happebed');
  await waitOperation(issuerClient, issResult.op);
  const credentialId = issResult.acdc.ked.d;

  // 6. IPEX Grant (Send to Holder)
  const issuerCredential = await issuerClient.credentials().get(credentialId);
  const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAid.name,
    acdc: new Serder(issuerCredential.sad),
    anc: new Serder(issuerCredential.anc),
    iss: new Serder(issuerCredential.iss),
    recipient: holderAid.prefix,
    datetime: new Date().toISOString().replace('Z', '000+00:00'),
  });

  console.log('grant happend');

  const grantOp = await issuerClient.ipex().submitGrant(issuerAid.name, grant, gsigs, gend, [holderAid.prefix]);
  await waitOperation(issuerClient, grantOp);
  console.log('Issuer: Credential granted and sent.');

  console.log('--- Phase 3: Reception (Holder Side) ---');

  // 7. Wait for Notification
  const holderNotifications = await waitForNotifications(holderClient, '/exn/ipex/grant');
  const grantNote = holderNotifications[0];

  // 8. IPEX Admit (Accept into Wallet)
  const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAid.name,
    grantSaid: grantNote.a.d!,
    recipient: issuerAid.prefix,
    datetime: new Date().toISOString().replace('Z', '000+00:00'),
  });

  const admitOp = await holderClient.ipex().submitAdmit(holderAid.name, admit, sigs, aend, [issuerAid.prefix]);
  await waitOperation(holderClient, admitOp);

  // Clean up the notification tray
  await markAndRemoveNotification(holderClient, grantNote);

  // 9. Final Step: Console Log the Credential from the Holder's perspective
  const holderCredential = await retry(async () => {
    return await holderClient.credentials().get(credentialId);
  });

  console.log('\n--- SUCCESS: Holder Received Credential ---');
  console.log('Credential Schema:', holderCredential.sad.s);
  console.log('Data Payload:', JSON.stringify(holderCredential.sad.a, null, 2));
  console.log('Issuer Prefix:', holderCredential.sad.i);
}

await runIssuanceFlow().catch(console.error);
