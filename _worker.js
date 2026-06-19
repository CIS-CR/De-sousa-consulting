const API_ORIGIN = "https://api.fbos.org";
const SUBMIT_PATH = "/api/demos/de-sousa-consulting/submit";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const serviceLabels = {
  "transformacion-modernizacion": "Transformación y modernización empresarial",
  "transformacion-digital-ia": "Transformación y modernización empresarial",
  "transformacion-digital": "Transformación y modernización empresarial",
  "finanzas-capital": "Estructuración financiera y preparación de capital",
  "estructuracion-financiera-capital": "Estructuración financiera y preparación de capital",
  "estructuracion-financiera": "Estructuración financiera y preparación de capital",
  "riesgos-cumplimiento": "Gestión de riesgos y cumplimiento",
  "gobierno-riesgos": "Gestión de riesgos y cumplimiento",
  inmobiliario: "Estrategia y estructuración inmobiliaria",
  "estrategia-estructuracion-inmobiliaria": "Estrategia y estructuración inmobiliaria",
  "asesoria-inmobiliaria": "Estrategia y estructuración inmobiliaria",
  "patrimonio-activos": "Estrategia patrimonial y de activos",
  "estrategia-patrimonial-activos": "Estrategia patrimonial y de activos",
  "planeacion-patrimonial": "Estrategia patrimonial y de activos",
  "optimizacion-operativa": "Optimización operativa",
};

function decodeJson(buffer) {
  if (!buffer) return null;

  try {
    const text = new TextDecoder().decode(buffer);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickFirst(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function resolveService(payload) {
  const explicit = pickFirst(payload?.service_selected, payload?.serviceSelected);
  if (explicit) return explicit;

  const category = String(payload?.category || payload?.serviceOrigin || "").trim().toLowerCase();
  return serviceLabels[category] || "Solicitud general";
}

function resolveActionId(result) {
  return pickFirst(
    result?.action_id,
    result?.action?.action_id,
    result?.action?.id,
    result?.id,
    result?.data?.action_id,
    result?.data?.id
  );
}

function emailList(value, fallback) {
  return String(value || fallback || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function buildEmailText(payload, result) {
  const service = resolveService(payload);
  const actionId = resolveActionId(result) || "Sin ID";

  return [
    "Nueva solicitud recibida desde desousaconsulting.com",
    "",
    `Servicio: ${service}`,
    `ID FBOS: ${actionId}`,
    `Nombre: ${pickFirst(payload?.name, payload?.customer_name, "No indicado")}`,
    `Email: ${pickFirst(payload?.email, payload?.customer_email, "No indicado")}`,
    `Empresa / industria: ${pickFirst(payload?.industry, "No indicado")}`,
    `Tamaño de equipo: ${pickFirst(payload?.teamSize, "No indicado")}`,
    `País: ${pickFirst(payload?.country, payload?.location, "No indicado")}`,
    "",
    "Necesidad:",
    pickFirst(payload?.pain, payload?.description, "No indicada"),
  ].join("\n");
}

function buildEmailHtml(payload, result) {
  const service = resolveService(payload);
  const actionId = resolveActionId(result) || "Sin ID";
  const rows = [
    ["Servicio", service],
    ["ID FBOS", actionId],
    ["Nombre", pickFirst(payload?.name, payload?.customer_name, "No indicado")],
    ["Email", pickFirst(payload?.email, payload?.customer_email, "No indicado")],
    ["Empresa / industria", pickFirst(payload?.industry, "No indicado")],
    ["Tamaño de equipo", pickFirst(payload?.teamSize, "No indicado")],
    ["País", pickFirst(payload?.country, payload?.location, "No indicado")],
  ];

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f3ec;color:#1f2933;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5dfd2;">
            <tr>
              <td style="padding:24px 28px 12px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#12263a;">Nueva solicitud De Sousa Consulting</h1>
                <p style="margin:8px 0 0;color:#5f6b76;">Se recibió una nueva solicitud desde el formulario web.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${rows
                    .map(
                      ([label, value]) => `<tr>
                    <td style="padding:10px 0;border-top:1px solid #ece7dc;color:#5f6b76;width:38%;">${escapeHtml(label)}</td>
                    <td style="padding:10px 0;border-top:1px solid #ece7dc;color:#12263a;font-weight:600;">${escapeHtml(value)}</td>
                  </tr>`
                    )
                    .join("")}
                </table>
                <h2 style="margin:20px 0 8px;font-size:15px;color:#12263a;">Necesidad</h2>
                <p style="margin:0;white-space:pre-wrap;color:#1f2933;line-height:1.5;">${escapeHtml(
                  pickFirst(payload?.pain, payload?.description, "No indicada")
                )}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildCustomerEmailText(payload) {
  return [
    `Hola ${pickFirst(payload?.name, payload?.customer_name, "")},`,
    "",
    "Hemos recibido correctamente su solicitud en De Sousa Consulting.",
    "",
    "El pasado es experiencia.",
    "El presente es oportunidad.",
    "La estrategia correcta construye tu futuro.",
    "",
    "Las empresas que perduran no improvisan. Analizan, planifican y ejecutan con una visión de largo plazo.",
    "",
    "Permítanos acompañarle en el diseño de una estrategia clara y un plan estructurado que transforme los objetivos de hoy en los resultados del mañana.",
    "",
    `Servicio: ${resolveService(payload)}`,
    "",
    "Resumen de su solicitud:",
    pickFirst(payload?.pain, payload?.description, "Sin descripción"),
    "",
    "Nuestro equipo revisará la información y se pondrá en contacto con usted.",
    "",
    "De Sousa Consulting",
  ].join("\n");
}

function buildCustomerEmailHtml(payload) {
  const name = pickFirst(payload?.name, payload?.customer_name, "");
  const service = resolveService(payload);
  const description = pickFirst(
    payload?.pain,
    payload?.description,
    "Sin descripción"
  );

  return `<!doctype html>
<html>
  <body style="margin:0;background:#eef2f6;color:#243447;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #dce3ea;">
            <tr>
              <td style="padding:30px 32px;background:#144982;color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0;vertical-align:middle;">
                      <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:bold;text-transform:uppercase;color:#dceafa;">Confirmación de solicitud</p>
                      <h1 style="margin:0;font-size:25px;line-height:1.3;color:#ffffff;">Hemos recibido su información</h1>
                    </td>
                    <td align="right" style="width:104px;padding:0 0 0 20px;vertical-align:middle;">
                      <img src="https://desousaconsulting.com/assets/logo-desousa-white.png" width="84" alt="De Sousa Consulting" style="display:block;width:84px;max-width:84px;height:auto;border:0;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#243447;">Hola ${escapeHtml(name)},</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#465768;">Gracias por contactar a De Sousa Consulting. Nuestro equipo revisará su solicitud y se pondrá en contacto con usted para conversar sobre los próximos pasos.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-collapse:collapse;border-left:4px solid #c8a96a;background:#f7f9fc;">
                  <tr>
                    <td style="padding:24px 24px 22px;">
                      <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:#144982;">
                        El pasado es experiencia.<br />
                        El presente es oportunidad.<br />
                        La estrategia correcta construye tu futuro.
                      </p>
                      <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#465768;">Las empresas que perduran no improvisan. Analizan, planifican y ejecutan con una visión de largo plazo.</p>
                      <p style="margin:0;font-size:15px;line-height:1.65;color:#465768;">Permítanos acompañarle en el diseño de una estrategia clara y un plan estructurado que transforme los objetivos de hoy en los resultados del mañana.</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f5f7fa;border:1px solid #dce3ea;">
                  <tr>
                    <td style="padding:16px 18px;color:#657587;font-size:13px;line-height:1.4;width:30%;">Servicio solicitado</td>
                    <td style="padding:16px 18px;color:#0f3763;font-size:15px;line-height:1.5;font-weight:bold;">${escapeHtml(service)}</td>
                  </tr>
                </table>
                <h2 style="margin:26px 0 10px;font-size:15px;line-height:1.4;color:#0f3763;">Resumen de su solicitud</h2>
                <p style="margin:0;white-space:pre-wrap;color:#465768;font-size:15px;line-height:1.6;">${escapeHtml(description)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #dce3ea;">
                  <tr>
                    <td style="padding-top:20px;color:#657587;font-size:13px;line-height:1.6;">
                      Este correo confirma que recibimos su solicitud. No es necesario responder a este mensaje.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 28px;background:#f5f7fa;border-top:1px solid #dce3ea;">
                <p style="margin:0;color:#0f3763;font-size:13px;line-height:1.5;font-weight:bold;">De Sousa Consulting</p>
                <p style="margin:4px 0 0;color:#758596;font-size:12px;line-height:1.5;">Estrategia, transformación y estructuración empresarial</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendResendEmail(env, message, label) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  const detail = await response.text().catch(() => "");

  if (!response.ok) {
    console.error(`DESOUSA_EMAIL_FAILED [${label}]: ${response.status} ${detail}`);
    return;
  }

  console.log(`DESOUSA_EMAIL_SENT [${label}]: ${detail}`);
}

async function sendLeadEmails(env, payload, result) {
  if (!env.RESEND_API_KEY) {
    console.warn("DESOUSA_EMAIL_SKIPPED: RESEND_API_KEY is not configured");
    return;
  }

  const internalTo = emailList(
    env.DESOUSA_NOTIFICATION_TO,
    "vasco_de_sousa@live.com"
  );
  if (!internalTo.length) {
    console.warn("DESOUSA_EMAIL_SKIPPED: no notification recipient configured");
    return;
  }

  const from =
    env.DESOUSA_RESEND_FROM || "De Sousa Consulting <noreply@fbos.org>";
  const service = resolveService(payload);
  const customerEmail = pickFirst(payload?.email, payload?.customer_email);
  const internalMessage = {
    from,
    to: internalTo,
    subject: `Nueva solicitud De Sousa Consulting - ${service}`,
    html: buildEmailHtml(payload, result),
    text: buildEmailText(payload, result),
  };

  if (customerEmail) {
    internalMessage.reply_to = customerEmail;
  }

  const emails = [sendResendEmail(env, internalMessage, "internal")];

  if (customerEmail) {
    emails.push(
      sendResendEmail(
        env,
        {
          from,
          to: [customerEmail],
          subject: `Confirmación de solicitud - ${service}`,
          html: buildCustomerEmailHtml(payload),
          text: buildCustomerEmailText(payload),
        },
        "customer"
      )
    );
  } else {
    console.warn("DESOUSA_CUSTOMER_EMAIL_SKIPPED: customer email is missing");
  }

  await Promise.all(emails);
}

async function proxyApiRequest(request, env, ctx) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname, API_ORIGIN);
  targetUrl.search = sourceUrl.search;
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  const shouldNotify =
    request.method === "POST" && sourceUrl.pathname === SUBMIT_PATH && body;
  const payload = shouldNotify ? decodeJson(body) : null;

  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    });
    const responseHeaders = new Headers(upstream.headers);
    const responseBody = await upstream.arrayBuffer();
    const result = shouldNotify ? decodeJson(responseBody) : null;

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    if (upstream.ok && result?.success && payload) {
      ctx.waitUntil(
        sendLeadEmails(env, payload, result).catch((error) => {
          console.error(`DESOUSA_EMAIL_ERROR: ${error?.message || error}`);
        })
      );
    }

    return new Response(responseBody, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "FBOS API proxy failed",
        detail: error?.message || "Unknown proxy error",
      },
      { status: 502, headers: corsHeaders }
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return proxyApiRequest(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
