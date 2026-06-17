export const exportToPDF = async (elementId: string, eventName: string) => {
  // Importação dinâmica para evitar erros de SSR (Server-Side Rendering) no Next.js
  const html2pdf = (await import('html2pdf.js')).default;

  const element = document.getElementById(elementId);
  if (!element) return;

  // Revela temporariamente o cabeçalho oficial exclusivo para o PDF
  const header = document.getElementById('pdf-header');
  if (header) header.style.display = 'block';

  // Formatação do nome do arquivo (ex: "workshop-caninos-2026-dados.pdf")
  const sanitizedName = eventName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  const filename = sanitizedName ? `${sanitizedName}-dados.pdf` : 'otdsp-indicadores.pdf';

  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false, ignoreElements: (element: any) => element.classList.contains('ignore-pdf')}, // useCORS é vital para renderizar o mapa do Leaflet
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Paisagem fica melhor para gráficos
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
  } finally {
    // Esconde o cabeçalho novamente após gerar o PDF
    if (header) header.style.display = 'none';
  }
};