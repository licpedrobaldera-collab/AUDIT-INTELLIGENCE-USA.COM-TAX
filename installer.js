// installer.js - Ejecuta: node installer.js y crea todo el sistema
const fs = require('fs');
const files = {
  "package.json": `{"name":"audit-intelligence-usa","version":"2.0.0","scripts":{"dev":"next dev","build":"next build"},"dependencies":{"next":"14.2.0","react":"18.3.1","@prisma/client":"5.14.0","pdf-lib":"1.17.1","stripe":"15.0.0"}}`,
  "prisma/schema.prisma": `
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite" url = "file:./dev.db" }
enum Role { ADMIN MANAGER SOCIO CPA_AFILIADO CLIENTE }
model CPA_Afiliado { id String @id @default(cuid()) nombreCompleto String email String @unique licenciaNumero String @unique codigoRegistro String @unique estadoLicencia String estadoPrincipal String firmaDigitalUrl String credencialPTIN String verificado Boolean @default(false) comisionFija Float @default(45.0) balancePendiente Float @default(0) casosFirmados Int @default(0) totalGanado Float @default(0) activo Boolean @default(true) fechaAfiliacion DateTime @default(now()) casos CasoTax[] }
model CasoTax { id String @id @default(cuid()) clienteNombre String clienteEmail String anioFiscal Int estados String status String @default("PRELIMINAR") cpaAsignadoId String? cpaAsignado CPA_Afiliado? @relation(fields: [cpaAsignadoId], references: [id]) montoCobrado Float comisionCPA Float @default(45.0) reportePreliminarUrl String? reporteFinalUrl String? highubSubido Boolean @default(false) firmadoEn DateTime? }
`,
};

for (let path in files) {
  fs.mkdirSync(path.split('/').slice(0,-1).join('/'), {recursive:true});
  fs.writeFileSync(path, files[path]);
}
console.log("✅ Sistema creado. Ahora: npm install && npx prisma db push && npm run dev");
