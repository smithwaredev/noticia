
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Método não permitido"
        });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return res.status(500).json({
            success: false,
            error: "Configuração do Telegram ausente"
        });
    }

    try {
        const { modo, latitude, longitude, consentimentoIp } = req.body || {};

        let mensagemTelegram = "";

        if (modo === "gps") {
            const lat = Number(latitude);
            const lon = Number(longitude);

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon) ||
                lat < -90 || lat > 90 ||
                lon < -180 || lon > 180
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Coordenadas inválidas"
                });
            }

            const maps = `https://www.google.com/maps?q=${lat},${lon}`;

            mensagemTelegram =
                "📍 LOCALIZAÇÃO GPS AUTORIZADA\n\n" +
                `Latitude: ${lat}\n` +
                `Longitude: ${lon}\n\n` +
                `Google Maps: ${maps}`;
        }

        else if (modo === "ip") {
            if (consentimentoIp !== true) {
                return res.status(403).json({
                    success: false,
                    error: "Consentimento para estimativa por IP não informado"
                });
            }

            const encaminhado = req.headers["x-forwarded-for"];
            const ip = (
                typeof encaminhado === "string"
                    ? encaminhado.split(",")[0].trim()
                    : req.headers["x-real-ip"]
            );

            if (!ip) {
                return res.status(400).json({
                    success: false,
                    error: "Não foi possível identificar o IP"
                });
            }

            const respostaIp = await fetch(
                `https://ipwho.is/${encodeURIComponent(ip)}`
            );

            if (!respostaIp.ok) {
                throw new Error("Falha ao consultar estimativa por IP");
            }

            const dadosIp = await respostaIp.json();

            if (!dadosIp.success) {
                throw new Error("Não foi possível estimar a localização por IP");
            }

            const cidade = dadosIp.city || "Não identificada";
            const regiao = dadosIp.region || "Não identificada";
            const pais = dadosIp.country || "Não identificado";

            mensagemTelegram =
                "🌐 ESTIMATIVA DE LOCALIZAÇÃO POR IP\n\n" +
                "O visitante autorizou expressamente esta estimativa.\n\n" +
                `IP: ${ip}\n` +
                `Cidade: ${cidade}\n` +
                `Região: ${regiao}\n` +
                `País: ${pais}\n\n` +
                "Observação: localização aproximada, não representa GPS.";
        }

        else {
            return res.status(400).json({
                success: false,
                error: "Modo de localização inválido"
            });
        }

        const respostaTelegram = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: mensagemTelegram
                })
            }
        );

        const resultadoTelegram = await respostaTelegram.json();

        if (!respostaTelegram.ok || resultadoTelegram.ok !== true) {
            return res.status(502).json({
                success: false,
                error: "O Telegram não confirmou o recebimento"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Localização enviada com sucesso"
        });

    } catch (erro) {
        console.error("Erro no envio:", erro);

        return res.status(500).json({
            success: false,
            error: "Erro interno ao processar localização"
        });
    }
}
