// Web Worker for slide rendering using OffscreenCanvas
// This completely isolates rendering from the main UI thread

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  if (type === 'RENDER_SLIDES') {
    try {
      const { presentation, format } = payload;
      const slides = presentation.content?.slides || [];
      
      if (slides.length === 0) {
        self.postMessage({ 
          type: 'ERROR', 
          error: 'No slides found in presentation' 
        });
        return;
      }

      self.postMessage({ 
        type: 'PROGRESS', 
        message: `Starting ${format.toUpperCase()} generation...` 
      });

      const renderedImages = [];

      // Process each slide using OffscreenCanvas
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        self.postMessage({ 
          type: 'PROGRESS', 
          message: `Rendering slide ${i + 1}/${slides.length}...` 
        });

        // Create OffscreenCanvas for this slide
        const canvas = new OffscreenCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');
        
        // Render slide content to canvas
        await renderSlideToCanvas(ctx, slide, i + 1, slides.length, presentation);
        
        // Convert to blob
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.95 : undefined;
        const blob = await canvas.convertToBlob({ 
          type: mimeType, 
          quality 
        });
        
        // Convert blob to array buffer for transfer
        const arrayBuffer = await blob.arrayBuffer();
        const filename = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_slide_${(i + 1).toString().padStart(2, '0')}.${format}`;
        
        renderedImages.push({
          slideNumber: i + 1,
          filename,
          arrayBuffer,
          mimeType,
          slideTitle: slide.title
        });
        
        self.postMessage({ 
          type: 'SLIDE_COMPLETE', 
          slideNumber: i + 1,
          total: slides.length
        });
      }
      
      self.postMessage({ 
        type: 'RENDER_COMPLETE', 
        images: renderedImages
      });
      
    } catch (error) {
      self.postMessage({ 
        type: 'ERROR', 
        error: error.message 
      });
    }
  }
});

/**
 * Render a slide to OffscreenCanvas using native Canvas 2D API
 */
async function renderSlideToCanvas(ctx, slide, slideNumber, totalSlides, presentation) {
  const width = 1920;
  const height = 1080;
  
  // Clear canvas with WHITE background for professional appearance
  ctx.fillStyle = '#ffffff';  // White background instead of dark
  ctx.fillRect(0, 0, width, height);
  
  // Set text properties
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Draw slide number badge with professional styling
  const badgeX = width - 120;
  const badgeY = 60;
  const badgeRadius = 30;
  
  // Badge background
  ctx.fillStyle = '#1e293b';  // Dark badge on light background
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Badge border
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(slideNumber.toString(), badgeX, badgeY - 10);
  
  // Draw slide title with dark text on light background
  ctx.fillStyle = '#1e293b';  // Dark text color for light background
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  
  // Word wrap for title
  const titleLines = wrapText(ctx, slide.title, width - 160);
  const titleY = 200;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, titleY + (index * 80));
  });
  
  // Draw content bullets with dark text
  ctx.fillStyle = '#374151';  // Dark gray text for good readability
  ctx.font = '32px Arial';
  ctx.textAlign = 'left';
  
  let contentY = titleY + (titleLines.length * 80) + 80;
  const contentX = 160;
  const bulletSize = 8;
  const lineSpacing = 50;
  
  slide.content.forEach((item, index) => {
    // Draw bullet point
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(contentX, contentY + 20, bulletSize, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw bullet text with word wrap - dark text on light background
    ctx.fillStyle = '#374151';  // Dark gray for good contrast
    const bulletLines = wrapText(ctx, item, width - 320);
    bulletLines.forEach((line, lineIndex) => {
      ctx.fillText(line, contentX + 40, contentY + (lineIndex * 40));
    });
    
    contentY += (bulletLines.length * 40) + lineSpacing;
  });
  
  // Draw footer with light background
  const footerY = height - 100;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';  // Light footer background
  ctx.fillRect(80, footerY, width - 160, 60);
  
  // Footer border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, footerY);
  ctx.lineTo(width - 80, footerY);
  ctx.stroke();
  
  // Footer text
  ctx.fillStyle = '#64748b';  // Medium gray text
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  const footerText = `${presentation.title || 'Presentation'} | Slide ${slideNumber} of ${totalSlides} | Slidefast`;
  ctx.fillText(footerText, width / 2, footerY + 30);
}

/**
 * Word wrap utility for canvas text
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine.trim());
      currentLine = words[i] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}
