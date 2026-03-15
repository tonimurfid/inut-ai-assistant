import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { mastra } from '../index';
import express from 'express';

const app = express();
app.use(express.json());

let sockGlobal: any = null;
let myLID = '';

// Endpoint untuk reminder worker
app.post('/send', async (req, res) => {
  try {
    if (!sockGlobal) {
      res.status(503).json({ ok: false, error: 'Bot not connected yet' });
      return;
    }
    const { message } = req.body;
    const target = `${process.env.ALLOWED_WA_NUMBER}@s.whatsapp.net`;
    await sockGlobal.sendMessage(target, { text: message });
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Send error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(3001, () => console.log('🌐 Bot API running on port 3001'));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./wa-session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sockGlobal = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan QR ini dengan WhatsApp kamu:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed. Reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
    }
  });

  sock.ev.on('creds.update', () => {
    saveCreds();
    const lid = state.creds?.me?.lid;
    if (lid) {
      myLID = lid.replace(':1@lid', '').replace('@lid', '');
      console.log(`🔑 My LID: ${myLID}`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid!;
      const senderRaw = from
        .replace('@s.whatsapp.net', '')
        .replace('@lid', '');

      const allowedNumber = process.env.ALLOWED_WA_NUMBER!;
      const allowedLID = process.env.ALLOWED_WA_LID || '';

      const isAllowed =
        senderRaw === allowedNumber ||
        senderRaw === allowedLID ||
        senderRaw === myLID ||
        from.includes(allowedNumber);

      if (!isAllowed) {
        console.log(`⛔ Tidak diizinkan: ${senderRaw}`);
        continue;
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      if (!text) continue;

      console.log(`📨 Pesan masuk: ${text}`);

      try {
        const agent = mastra.getAgent('lifeAgent');
        const response = await agent.generate(text, {
          memory: {
            thread: `toni-${senderRaw}`,
            resource: 'toni',
          },
        });

        const reply = response.text;

        await sock.sendMessage(from, { text: reply });
        console.log(`📤 Balasan: ${reply}`);
      } catch (err) {
        console.error('❌ Error:', err);
        await sock.sendMessage(from, {
          text: '⚠️ Maaf, ada error. Coba lagi ya.',
        });
      }
    }
  });
}

startBot();