export const exportToPDF = async (elementId: string, eventName: string) => {
  const html2canvasPro = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  const element = document.getElementById(elementId);
  if (!element) return;

  const header = document.getElementById('pdf-header');
  if (header) header.style.display = 'block';

  const sanitizedName = eventName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  const filename = sanitizedName ? `${sanitizedName}-dados.pdf` : 'otdsp-indicadores.pdf';

  try {
    const scale = 2; // Alta resolução
    
    // 1. Tira a "foto" panorâmica do layout 100% intacto
    const canvas = await html2canvasPro(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc' 
    });

    // 2. Mapeamento Matemático das "Zonas de Perigo" (Elementos que não podem ser cortados)
    const parentRect = element.getBoundingClientRect();
    const avoidZones = Array.from(element.querySelectorAll('.avoid-break')).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        // Multiplicamos pelo scale pois o canvas é gerado em tamanho ampliado
        top: (rect.top - parentRect.top) * scale,
        bottom: (rect.bottom - parentRect.top) * scale,
        height: rect.height * scale
      };
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidthMm = 297;
    const pdfHeightMm = 210;
    const marginMm = 8; // Margem de respiro
    
    const outputWidthMm = pdfWidthMm - (marginMm * 2);
    const outputHeightMm = pdfHeightMm - (marginMm * 2);

    // Quantos pixels do canvas cabem em 1 página vertical do PDF
    const pageHeightPx = Math.floor(canvas.width * (outputHeightMm / outputWidthMm));

    let pageCuts = [0];
    let currentY = 0;

    // 3. Algoritmo da Guilhotina Inteligente
    while (currentY < canvas.height) {
      let proposedBreak = currentY + pageHeightPx;

      if (proposedBreak >= canvas.height) {
        pageCuts.push(canvas.height);
        break;
      }

      // Procura se a linha de corte atinge alguma zona de perigo (avoid-break)
      const intersectingZones = avoidZones.filter(
        zone => zone.height < pageHeightPx && zone.top < proposedBreak && zone.bottom > proposedBreak
      );

      if (intersectingZones.length > 0) {
        // Se vai cortar algo, ache o elemento mais alto do bloco afetado
        const minTop = Math.min(...intersectingZones.map(z => z.top));
        // Recua a linha de corte para ficar logo acima do elemento (com 20px de respiro)
        proposedBreak = Math.max(currentY + 1, minTop - 20);
      }

      pageCuts.push(proposedBreak);
      currentY = proposedBreak;
    }

    // 4. Fatiamento físico das imagens e inserção no PDF
    for (let i = 0; i < pageCuts.length - 1; i++) {
      const startY = pageCuts[i];
      const endY = pageCuts[i + 1];
      const sliceHeight = endY - startY;

      // Cria um mini-canvas temporário só para segurar essa fatia da página
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Copia a fatia específica do canvas original gigante
        tempCtx.drawImage(
          canvas,
          0, startY, canvas.width, sliceHeight, // O que será copiado
          0, 0, canvas.width, sliceHeight       // Onde será colado
        );

        const sliceData = tempCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (sliceHeight * outputWidthMm) / canvas.width;

        if (i > 0) pdf.addPage();
        
        // Insere a fatia no PDF
        pdf.addImage(sliceData, 'JPEG', marginMm, marginMm, outputWidthMm, sliceHeightMm);
      }
    }

    pdf.save(filename);

  } catch (error) {
    console.error("Erro crítico na geração/corte do PDF:", error);
  } finally {
    if (header) header.style.display = 'none';
  }
};