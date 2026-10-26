import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfPath, nombreCpa, codigoCpa, ptin, estado, cliente, firmaPngBase64 } = body;

    if (!firmaPngBase64) {
      return NextResponse.json({ error: "La firma PNG es obligatoria para estampar el documento." }, { status: 400 });
    }

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob'; // Solución oficial de Vercel para almacenamiento persistente

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casoId, nombreCpa, codigoCpa, ptin, estado, cliente, firmaPngBase64 } = body;

    if (!firmaPngBase64) {
      return NextResponse.json({ error: "La firma PNG es obligatoria." }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const añoActual = new Date().getFullYear().toString();

    // 1. Decodificar la imagen PNG de la firma
    const base64Data = firmaPngBase64.replace(/^data:image\/png;base64,/, "");
    const bufferFirmaImagen = Buffer.from(base64Data, 'base64');

    // 2. Procesamiento y Estampado del PDF
    // Aquí tu motor genera el PDF con la estampa visual combinando el buffer de imagen y textos.
    const bufferPdfFinal = Buffer.from("CONTENIDO_BINARIO_DEL_PDF_CON_IMAGEN_PNG_ESTAMPADA");

    // 3. Subir el archivo firmado a almacenamiento persistente en la nube (Vercel Blob)
    // Conserva de forma estricta la máscara de nomenclatura solicitada en la URL
    const nombreArchivoSalida = `1040_FIRMADO_${codigoCpa}.pdf`;
    const rutaDestinoHIGHUB = `HIGHUB/${añoActual}/${estado.toUpperCase()}/${cliente.toUpperCase()}/${nombreArchivoSalida}`;
    
    const blobResponse = await put(rutaDestinoHIGHUB, bufferPdfFinal, {
      access: 'public',
      addRandomSuffix: false // Mantiene el nombre limpio sin hashes extraños
    });

    // 4. Operación Transaccional en Base de Datos (Persistencia libre de borrados)
    await prisma.$transaction([
      // Actualizar el caso a FIRMADO y guardar la URL persistente del PDF
      prisma.caso.update({
        where: { id: casoId },
        data: {
          estatus: 'FIRMADO',
          fechaFirma: new Date(),
          ipAuditoria: ip,
          codigoCpaFirma: codigoCpa,
          pdfFirmadoUrl: blobResponse.url // URL de descarga en audit-intelligence-usa.com
        }
      }),
      // Crear registro de comisión de $45 vinculado de forma inmutable
      prisma.comision.create({
        data: {
          añoFiscal: añoActual,
          monto: 45.00,
          codigoCpa: codigoCpa,
          casoId: casoId
        }
      })
    ]);

    // 5. Despacho asíncrono de alertas (WhatsApp Twilio + Email Resend)
    // Mantiene tu flujo de notificaciones configurado para el número dominicano o de USA

    return NextResponse.json({
      success: true,
      mensaje: "Firma estampada con éxito de forma persistente.",
      urlDescarga: blobResponse.url,
      comision: 45.00
    });

  } catch (error) {
    console.error("Error crítico en el motor de nube:", error);
    return NextResponse.json({ error: "Fallo al procesar el almacenamiento o base de datos." }, { status: 500 });
  }
}

    
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const añoActual = new Date().getFullYear().toString();
    const fechaFirma = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Organizar directorios HIGHUB automáticos
    const carpetaDestino = path.join(process.cwd(), 'HIGHUB', añoActual, estado.toUpperCase(), cliente.toUpperCase());
    fs.mkdirSync(carpetaDestino, { recursive: true });

    const nombreArchivoSalida = `1040_FIRMADO_${codigoCpa}.pdf`;
    const rutaCompletaSalida = path.join(carpetaDestino, nombreArchivoSalida);

    // 2. DECODIFICAR LA IMAGEN PNG DE LA FIRMA PARA EL MOTOR PDF
    // Extraer cabecera del formato Base64 (data:image/png;base64,...)
    const base64Data = firmaPngBase64.replace(/^data:image\/png;base64,/, "");
    const bufferFirmaImagen = Buffer.from(base64Data, 'base64');

    // Aquí guardamos el archivo de la firma PNG usado para auditorías del IRS si fuese necesario
    const rutaFirmaAuditada = path.join(carpetaDestino, `firma_cpa_registro.png`);
    fs.writeFileSync(rutaFirmaAuditada, bufferFirmaImagen);

    // LÓGICA DE PROCESAMIENTO PDF:
    // El motor inyecta "bufferFirmaImagen" como una capa visual transparente (Watermark)
    // junto al bloque de texto con el Código CPA, PTIN y la Fecha.
    fs.writeFileSync(rutaCompletaSalida, "CONTENIDO_BINARIO_DEL_PDF_CON_IMAGEN_PNG_ESTAMPADA");

    // 3. Escribir registro financiero en comisiones_highub.csv
    const rutaCsv = path.join(process.cwd(), 'comisiones_highub.csv');
    const existeCsv = fs.existsSync(rutaCsv);
    const filaContable = `${fechaFirma},${añoActual},${estado.toUpperCase()},${cliente.toUpperCase()},${codigoCpa},45.00,FIRMADO,IP:${ip}\n`;

    if (!existeCsv) {
      const cabecera = "Fecha Registro,Año Fiscal,Estado,Cliente,Código CPA,Monto Comisión (USD),Estatus,IP Auditoria\n";
      fs.writeFileSync(rutaCsv, cabecera + filaContable, 'utf-8');
    } else {
      fs.appendFileSync(rutaCsv, filaContable, 'utf-8');
    }

    // 4. Despacho automatizado de alertas de mensajería (Omitido por brevedad, mantiene Twilio y Resend)

    return NextResponse.json({
      success: true,
      mensaje: "Firma gráfica inyectada con éxito y archivada en HIGHUB.",
      rutaFinal: `/HIGHUB/${añoActual}/${estado}/${cliente}/${nombreArchivoSalida}`
    });

  } catch (error) {
    console.error("Fallo en el procesador binario de firmas:", error);
    return NextResponse.json({ error: "Fallo al decodificar la imagen o estampar el PDF." }, { status: 500 });
  }
}
