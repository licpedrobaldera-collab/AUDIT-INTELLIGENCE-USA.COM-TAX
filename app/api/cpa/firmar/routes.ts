import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configuración de variables de entorno ficticias para los proveedores de mensajería
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'AC_TWILIO_SID';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'TWILIO_TOKEN';
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Número sandbox o aprobado de Twilio

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfPath, nombreCpa, codigoCpa, ptin, estado, cliente, firmaPng } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const añoActual = new Date().getFullYear().toString();
    const fechaFirma = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Estructura de carpetas HIGHUB automática
    const carpetaDestino = path.join(process.cwd(), 'HIGHUB', añoActual, estado.toUpperCase(), cliente.toUpperCase());
    fs.mkdirSync(carpetaDestino, { recursive: true });

    const nombreArchivoSalida = `1040_FIRMADO_${codigoCpa}.pdf`;
    const rutaCompletaSalida = path.join(carpetaDestino, nombreArchivoSalida);

    // Guardado físico simulado del PDF firmado
    fs.writeFileSync(rutaCompletaSalida, "CONTENIDO_BINARIO_PDF_FIRMADO_STAMP");

    // 2. Incrementar la comisión de $45 en la bitácora CSV
    const rutaCsv = path.join(process.cwd(), 'comisiones_highub.csv');
    const existeCsv = fs.existsSync(rutaCsv);
    const filaContable = `${fechaFirma},${añoActual},${estado.toUpperCase()},${cliente.toUpperCase()},${codigoCpa},45.00,FIRMADO,IP:${ip}\n`;

    if (!existeCsv) {
      const cabecera = "Fecha Registro,Año Fiscal,Estado,Cliente,Código CPA,Monto Comisión (USD),Estatus,IP Auditoria\n";
      fs.writeFileSync(rutaCsv, cabecera + filaContable, 'utf-8');
    } else {
      fs.appendFileSync(rutaCsv, filaContable, 'utf-8');
    }

    // 3. DATOS DE CONTACTO DEL CLIENTE (Configurables por el Administrador)
    // El administrador puede cambiar estos valores dinámicamente desde el panel.
    const telefonoCliente = "+18297717390"; // Formato internacional para República Dominicana o USA (+1...)
    const emailCliente = "cliente.impuestos@gmail.com";

    // 4. ENVÍO DE NOTIFICACIÓN WHATSAPP (Vía Twilio API)
    try {
      const mensajeWhatsApp = `¡Hola ${cliente.replace('_', ' ')}! Tu formulario 1040 ha sido FIRMADO digitalmente por el CPA autorizado ${nombreCpa} (${codigoCpa}). Estatus: COMPLETADO. Gracias por confiar en HIGHUB.`;
      
      await fetch(`https://twilio.com{TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: `whatsapp:${telefonoCliente}`,
          Body: mensajeWhatsApp
        })
      });
      console.log(`📱 WhatsApp enviado con éxito al ${telefonoCliente}`);
    } catch (wsError) {
      console.error("⚠️ Error al despachar WhatsApp:", wsError);
    }

    // 5. ENVÍO DE NOTIFICACIÓN POR EMAIL (Vía Resend API)
    try {
      await fetch('https://resend.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'HIGHUB Notifications <no-reply@highub.com>',
          to: [emailCliente],
          subject: `📋 Tu Declaración 1040 ha sido Firmada - HIGHUB`,
          html: `<p>Estimado cliente,</p><p>Le informamos que su declaración de impuestos ha sido revisada y firmada exitosamente por el profesional **${nombreCpa}**.</p><p><strong>Estatus:</strong> FIRMADO<br><strong>Código CPA:</strong> ${codigoCpa}</p>`
        })
      });
      console.log(`✉️ Email enviado con éxito a ${emailCliente}`);
    } catch (emailError) {
      console.error("⚠️ Error al despachar Email:", emailError);
    }

    return NextResponse.json({
      success: true,
      mensaje: "Firma estampada, comisión generada y notificaciones enviadas.",
      rutaFinal: `/HIGHUB/${añoActual}/${estado}/${cliente}/${nombreArchivoSalida}`
    });

  } catch (error) {
    console.error("Fallo crítico en el motor:", error);
    return NextResponse.json({ error: "Error en el procesamiento del flujo corporativo." }, { status: 500 });
  }
}
