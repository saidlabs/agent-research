/**
 * Send A2A message via WebSocket
 * Usage: node send-ws.js <RECIPIENT> <MESSAGE>
 */

import { SAIDAgent } from '@said-protocol/a2a';
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

const keypairPath = process.env.WALLET_PATH || `${process.env.HOME}/.config/solana/id.json`;
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const recipientAddress = process.argv[2];
const message = process.argv[3];

if (!recipientAddress || !message) {
  console.error('Usage: node send-ws.js <RECIPIENT> <MESSAGE>');
  process.exit(1);
}

const agent = new SAIDAgent({
  keypair,
  mode: 'websocket',
  enableCooldown: false, // Disable for one-off sends
});

console.log(`📤 Connecting to SAID WebSocket...`);

agent.on('connected', async () => {
  console.log(`✅ Connected`);
  console.log(`📨 Sending to ${recipientAddress}...`);
  console.log(`   Message: "${message}"`);
  
  try {
    await agent.send(recipientAddress, message);
    console.log('✅ Message sent!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to send:', err.message);
    process.exit(1);
  }
});

agent.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

// Connect
agent.connect().catch((err) => {
  console.error('❌ Failed to connect:', err.message);
  process.exit(1);
});

// Timeout after 30s
setTimeout(() => {
  console.error('❌ Timeout');
  process.exit(1);
}, 30000);
