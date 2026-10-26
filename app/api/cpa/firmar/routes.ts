import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csv-writer'; 
import fitz from 'fitz'; // Representa la llamada del backend al motor PyMuPDF o librería PDF equivalente de Node.js

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfPath, nombreCpa, codigoCpa, ptin, estado, cliente, firmaPng } = body;

    // 1. Obtener IP del cliente y tiempos de ejecución
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const añoActual = new Date().getFullYear().toString();
    const fechaFirma = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 2. Comprobar o simular existencia del PDF base
    // En entornos productivos leerías el archivo real guardado en servidor
    const rutaOrigenSimulada = path.join(process.cwd(), 'public', 'plantillas', '1040_vacia.pdf');
    
    // 3. Crear Estructura de Carpetas Automática de HIGHUB: /{AÑO}/{ESTADO}/{CLIENTE}/
    const carpetaDestino = path.join(process.cwd(), 'HIGHUB', añoActual, estado.toUpperCase(), cliente.toUpperCase());
    fs.mkdirSync(carpetaDestino, { recursive: true });

    // Nomenclatura exacta solicitada
    const nombreArchivoSalida = `1040_FIRMADO_${codigoCpa}.pdf`;
    const rutaCompletaSalida = path.join(carpetaDestino, nombreArchivoSalida);

    // 4. Estampar metadatos en el PDF (Lógica del motor de renderizado)
    // Aquí el motor escribe de manera binaria las variables solicitadas:
    const metadatosEstampa = {
      nombreCpa,
      codigoCpa,
      ptin,
      firma: `[HASH_PNG_RENDER]: ${firmaPng}`,
      fecha: fechaFirma,
      ip_registro: ip,
      status: "FIRMADO"
    };

    // Simulación de escritura exitosa del archivo final en el file system de HIGHUB
    fs.writeFileSync(path.join(carpetaDestino, `${nombreArchivoSalida}.meta.json`), JSON.stringify(metadatosEstampa, null, 2));
    fs.writeFileSync(rutaCompletaSalida, "CONTENIDO_BINARIO_PDF_FIRMADO_STAMP"); 

    // 5. Crear e Incrementar la comisión de $45 en la bitácora CSV centralizada
    const rutaCsv = path.join(process.cwd(), 'comisiones_highub.csv');
    const existeCsv = fs.existsSync(rutaCsv);

    const filaContable = `${fechaFirma},${añoActual},${estado.toUpperCase()},${cliente.toUpperCase()},${codigoCpa},45.00,FIRMADO,IP:${ip}\n`;

    if (!existeCsv) {
      const cabecera = "Fecha Registro,Año Fiscal,Estado,Cliente,Código CPA,Monto Comisión (USD),Estatus,IP Auditoria\n";
      fs.writeFileSync(rutaCsv, cabecera + filaContable, 'utf-8');
    } else {
      fs.appendFileSync(rutaCsv, filaContable, 'utf-8');
    }

    // 6. Respuesta satisfactoria al cliente
    return NextResponse.json({
      success: true,
      mensaje: "Firma estampada, estatus actualizado y comisión generada.",
      rutaFinal: `/HIGHUB/${añoActual}/${estado}/${cliente}/${nombreArchivoSalida}`,
      comision: 45.00
    });

  } catch (error) {
    console.error("Error en el Motor de Firma Integrado:", error);
    return NextResponse.json({ error: "Fallo crítico al estampar o archivar el documento." }, { status: 500 });
  }
}
