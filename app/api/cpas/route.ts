import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'comisiones_highub.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json([]);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lineas = fileContent.split('\n').filter(linea => linea.trim() !== '');
    
    // Ignorar la cabecera
    const cuerpo = lineas.slice(1);

    // Agrupar datos por CPA para consolidar el Histórico
    const mapeoCPAs: Record<string, { licencia: string; estado: string; casos: number }> = {};

    cuerpo.forEach(linea => {
      // Separar columnas respetando comas
      const [,, estado, , codigoCpa] = linea.split(',');
      
      if (codigoCpa && estado) {
        const key = codigoCpa.trim();
        if (!mapeoCPAs[key]) {
          mapeoCPAs[key] = {
            licencia: key,
            estado: estado.trim(),
            casos: 0
          };
        }
        mapeoCPAs[key].cases += 1; // Sumar un caso por cada fila en el CSV
      }
    });

    // Mapeo final adaptado para la UI
    const resultado = Object.values(mapeoCPAs).map((cpa, index) => ({
      id: String(index + 1),
      nombre: `CPA Profesional (${cpa.licencia.split('-')[1] || 'Asignado'})`, // Nombre derivado del código
      licencia: cpa.licencia,
      estado: cpa.estado,
      casosFirmados: cpa.casos,
      ptin: `PTIN-${100000 + index}`,
      aprobado: true // Estatus base por defecto
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error leyendo el CSV:", error);
    return NextResponse.json({ error: "No se pudo procesar el archivo contable" }, { status: 500 });
  }
}
