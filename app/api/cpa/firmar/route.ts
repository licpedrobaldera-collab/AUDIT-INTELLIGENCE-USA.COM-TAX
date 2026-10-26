import os
import datetime
import fitz  # PyMuPDF para estampar el PDF

def motor_firma(pdf_path, nombre_cpa, codigo_cpa, ptin, firma_hash, estado, cliente):
    # 1. Definir variables de tiempo y rutas
    año_actual = datetime.date.today().strftime("%Y")
    fecha_firma = datetime.date.today().strftime("%Y-%m-%d %H:%M:%S")
    
    # 2. Estampar en el PDF
    doc = fitz.open(pdf_path)
    pagina = doc[0] # Se estampa en la primera página (modificable)
    
    texto_estampa = (
        f"--- FIRMA CPA DIGITAL ---\n"
        f"Nombre CPA: {nombre_cpa}\n"
        f"Código: {codigo_cpa}\n"
        f"PTIN: {ptin}\n"
        f"Firma: {firma_hash}\n"
        f"Fecha: {fecha_firma}\n"
        f"Status: FIRMADO"
    )
    
    # Coordenadas donde se estampará el texto (X1, Y1, X2, Y2)
    rectangulo = fitz.Rect(350, 650, 550, 750)
    pagina.draw_rect(rectangulo, color=(0.1, 0.6, 0.2), width=1.5) # Cuadro verde de validación
    pagina.insert_text((355, 665), texto_estampa, fontsize=8, color=(0, 0, 0))
    
    # 3. Generar la carpeta automática HIGHUB de manera limpia
    ruta_carpeta = f"HIGHUB/{año_actual}/{estado}/{cliente}"
    os.makedirs(ruta_carpeta, exist_ok=True)
    
    # Nombre de archivo estandarizado
    nombre_archivo_salida = f"1040_FIRMADO_{codigo_cpa}.pdf"
    ruta_final_pdf = os.path.join(ruta_carpeta, nombre_archivo_salida)
    
    # Guardar los cambios en el destino definitivo
    doc.save(ruta_final_pdf)
    doc.close()
    
    # 4. Cambiar Status y Crear Comisión
    status = "FIRMADO"
    comision = 45.00
    
    # Log de salida para el sistema de registros
    print(f"Cambio de Estatus: {status}")
    print(f"Finanzas: Comisión de ${comision} USD generada exitosamente.")
    print(f"Almacenamiento: Guardado en /{ruta_carpeta}/{nombre_archivo_salida}")
    
    return status, comision, ruta_final_pdf

# Ejemplo de ejecución
if __name__ == "__main__":
    # Estos parámetros pueden pasarse como variables de entorno en GitHub Actions
    motor_firma(
        pdf_path="declaracion_original.pdf", 
        nombre_cpa="Nombre CPA Ejemplo",
        codigo_cpa="CPA-NY-12345",
        ptin="P00123456",
        firma_hash="[FIRMA_DIGITAL_CPA-NY-12345]",
        estado="NY",
        cliente="JUAN_PEREZ"
    )
