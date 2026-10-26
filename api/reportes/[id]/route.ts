// /api/reportes/[id]/route.ts
if (user.role === 'CLIENTE' && caso.status !== 'FIRMADO' && caso.status !== 'ENTREGADO') {
  return 403 - "Informe preliminar confidencial. Solo disponible después de firma CPA y pago."
}
if (user.role === 'CPA_AFILIADO' || user.role === 'ADMIN' || user.role === 'SOCIO') {
  // Puede ver reportePreliminarUrl
}
