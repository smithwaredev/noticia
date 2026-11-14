
export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Método não permitido"
        });
    }

    try {
        const {
            latitude,
            longitude,
            consentimento
        } = req.body || {};

        // Exige autorização expressa
        if (consentimento !== true) {
            return res.status(403).json({
                success: false,
                error: "Compartilhamento não autorizado"
            });
        }

        const lat = Number(latitude);
        const lon = Number(longitude);

        // Validação das coordenadas
        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {
            return res.status(400).json({
                success: false,
                error: "Localização inválida"
            });
        }

        // Dados protegidos nas variáveis da Vercel
        const TELEGRAM_BOT_TOKEN =
            process.env.TELEGRAM_BOT_TOKEN;

        const TELEGRAM_CHAT_ID =
            process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return res.status(500).json({
                success: false,
                error: "Integração não configurada"
            });
        }

        const maps =
            `https://www.google.com/maps?q=${lat},${lon}`;

        const mensagem =
            `📍 *BOLA EM FOCO — LOCALIZAÇÃO COMPARTILHADA*\n\n` +
            `O visitante autorizou expressamente o compartilhamento.\n\n` +
            `*Latitude:* ${lat}\n` +
            `*Longitude:* ${lon}\n\n` +
            `🗺️ [Visualizar no Google Maps](${maps})`;

        const telegramUrl =
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensagem,
                parse_mode: "Markdown",
                disable_web_page_preview: true
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            return res.status(502).json({
                success: false,
                error: "Erro ao enviar notificação"
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            error: "Erro interno no servidor"
        });

    }
}
