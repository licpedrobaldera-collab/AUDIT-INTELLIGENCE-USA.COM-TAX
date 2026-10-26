import os
import argparse
import datetime
import csv
import fitz  # Requiere: pip install pymupdf

def registrar_comision(año, estado, cliente, codigo_cpa):
    """Registra de manera incremental la comisión de $45 en una bitácora CSV."""
    archivo_csv = "comisiones_highub.csv"
    archivo_existe = os.path.exists(archivo_csv)
    fecha_registro = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Encabezados del reporte financiero
    columnas = ["Fecha Registro", "Año Fiscal", "Estado", "Cliente", "Código CPA", "Monto Comisión (USD)", "Estatus"]
    
    nueva_fila = [fecha_registro, año, estado.upper(), cliente.upper(), codigo_cpa, 45.00, "FIRMADO"]
    
    # Escritura segura con codificación UTF-8
    with open(archivo_csv, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        if not archivo_existe:
            writer.writerow(columnas)  # Crear encabezados si el archivo es nuevo
        writer.writerow(nueva_fila)
        
    print(f"📈 Bitácora Contable: Comisión de $45 registrada en '{archivo_csv}'")

def ejecutar_motor_firma(pdf_path, nombre_cpa, codigo_cpa, ptin, estado, cliente):
    if not os.path.exists(pdf_path):
        print(f"❌ Error: El archivo '{pdf_path}' no existe.")
        return False

    # 1. Variables de tiempo y firmas
    año_actual = datetime.date.today().strftime("%Y")
    fecha_firma = datetime.date.today().strftime("%Y-%m-%d %H:%M:%S")
    firma_hash = f"SIG-{codigo_cpa}-{cliente.upper().replace(' ', '_')}-OK"
    
    # 2. Estampar en el PDF
    doc = fitz.open(pdf_path)
    pagina = doc[0]  # Primera página
    
    texto_estampa = (
        f"--- FIRMA CPA DIGITAL ---\n"
        f"Nombre CPA: {nombre_cpa}\n"
        f"Código: {codigo_cpa}\n"
        f"PTIN: {ptin}\n"
        f"Firma: {firma_hash}\n"
        f"Fecha: {fecha_firma}\n"
        f"Status: FIRMADO"
    )
    
    # Cuadro verde de validación visual
    rectangulo = fitz.Rect(350, 650, 550, 750)
    pagina.draw_rect(rectangulo, color=(0.1, 0.6, 0.2), width=1.5)
    pagina.insert_text((355, 665), texto_estampa, fontsize=8, color=(0, 0, 0))
    
    # 3. Generar la estructura de carpetas HIGHUB automática
    ruta_carpeta = f"HIGHUB/{año_actual}/{estado.upper()}/{cliente.replace(' ', '_').upper()}"
    os.makedirs(ruta_carpeta, exist_ok=True)
    
    nombre_archivo_salida = f"1040_FIRMADO_{codigo_cpa}.pdf"
    ruta_final_pdf = os.path.join(ruta_carpeta, nombre_archivo_salida)
    
    doc.save(ruta_final_pdf)
    doc.close()
    
    # 4. Cambiar estatus y registrar la comisión de $45 en el CSV
    registrar_comision(año_actual, estado, cliente, codigo_cpa)
    
    # 5. Logs del Sistema
    print("\n" + "="*40)
    print("🚀 PROCESAMIENTO DE MOTOR COMPLETADO")
    print("="*40)
    print(f"🔹 Status: FIRMADO")
    print(f"📂 Archivo Destino: /{ruta_final_pdf}")
    print("="*40 + "\n")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Motor de Firma Local y Cloud para HIGHUB con Contabilidad")
    parser.add_argument("--pdf", required=True, help="Ruta del archivo PDF original")
    parser.add_argument("--nombre", default="Nombre CPA Ejemplo", help="Nombre del CPA")
    parser.add_argument("--codigo", default="CPA-NY-12345", help="Código CPA")
    parser.add_argument("--ptin", default="PTIN-000000", help="Número PTIN")
    parser.add_argument("--estado", required=True, help="Estado del cliente")
    parser.add_argument("--cliente", required=True, help="Nombre del cliente")

    args = parser.parse_args()
    
    ejecutar_motor_firma(
        pdf_path=args.pdf,
        nombre_cpa=args.nombre,
        codigo_cpa=args.codigo,
        ptin=args.ptin,
        estado=args.estado,
        cliente=args.cliente
    )
