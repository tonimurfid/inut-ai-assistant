import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { mastra } from '../index';

let myLID = '';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./wa-session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  // Tampilkan QR di terminal
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

  // Simpan LID sendiri saat creds update
  sock.ev.on('creds.update', () => {
    saveCreds();
    const lid = state.creds?.me?.lid;
    if (lid) {
      myLID = lid.replace(':1@lid', '').replace('@lid', '');
      console.log(`🔑 My LID: ${myLID}`);
    }
  });

  // Handle pesan masuk
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

      console.log(`📱 from: "${from}"`);
      console.log(`📱 senderRaw: "${senderRaw}"`);
      console.log(`📱 myLID: "${myLID}"`);
      console.log(`📱 ALLOWED: "${allowedNumber}"`);
      console.log(`📱 ALLOWED LID: "${allowedLID}"`);
      // Izinkan kalau: nomor cocok ATAU LID cocok
      const isAllowed =
        senderRaw === allowedNumber ||
        senderRaw === allowedLID ||
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
        const response = await agent.generate(text);
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