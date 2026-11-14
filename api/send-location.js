
export default async function handler(req, res) {

    // Aceita somente POST
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

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

        // Exige confirmação expressa enviada pelo site
        if (consentimento !== true) {
            return res.status(403).json({
                success: false,
                error: "Compartilhamento não autorizado"
            });
        }

        // Converte e valida as coordenadas
        const lat = Number(latitude);
        const lon = Number(longitude);

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
                error: "Coordenadas inválidas"
            });
        }

        // Credenciais armazenadas na Vercel
        const TELEGRAM_BOT_TOKEN =
            process.env.TELEGRAM_BOT_TOKEN;

        const TELEGRAM_CHAT_ID =
            process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error("Variáveis do Telegram não configuradas.");

            return res.status(500).json({
                success: false,
                error: "Integração do Telegram não configurada"
            });
        }

        const maps =
            `https://www.google.com/maps?q=${lat},${lon}`;

        const mensagem =
            "📍 BOLA EM FOCO — LOCALIZAÇÃO COMPARTILHADA\n\n" +
            "O visitante autorizou expressamente o compartilhamento da localização.\n\n" +
            `Latitude: ${lat}\n` +
            `Longitude: ${lon}\n\n` +
            `Visualizar no Google Maps:\n${maps}`;

        const telegramUrl =
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const resposta = await fetch(telegramUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensagem,
                disable_web_page_preview: true
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok || resultado.ok !== true) {
            console.error(
                "Erro retornado pelo Telegram:",
                resultado
            );

            return res.status(502).json({
                success: false,
                error: "O Telegram não confirmou o envio"
            });
        }

        console.log("Localização enviada ao Telegram.");

        return res.status(200).json({
            success: true,
            message: "Localização enviada com sucesso"
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        return res.status(500).json({
            success: false,
            error: "Erro interno no servidor"
        });
    }
}
