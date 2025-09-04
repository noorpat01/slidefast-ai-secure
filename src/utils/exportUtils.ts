import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { toast } from 'react-hot-toast';

interface Slide {
  id: string;
  title: string;
  content: string[];
  speaker_notes?: string;
  visual_suggestion?: string;
}

interface PresentationData {
  id: string;
  title: string;
  description?: string;
  content?: {
    slides: Slide[];
    metadata?: {
      audience_level?: string;
      presentation_type?: string;
      tone?: string;
      author?: string;
    };
  };
}

/**
 * IFRAME-BASED EXPORT - Completely isolated rendering to eliminate screen flashing
 * This creates a hidden iframe, renders slides inside it, captures them, then removes the iframe
 */
export async function exportPresentationAsImagesWithIframe(
  presentation: PresentationData,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  let toastId: string | undefined;
  let iframe: HTMLIFrameElement | null = null;

  try {
    // Show loading toast
    toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);

    const slides = presentation.content?.slides || [];
    if (slides.length === 0) {
      throw new Error('No slides found in presentation');
    }

    console.log(`🎨 Starting ${format.toUpperCase()} export for ${slides.length} slides...`);

    // Create completely hidden iframe for isolated rendering
    iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1920px !important;
      height: 1080px !important;
      border: none !important;
      background: white !important;
      visibility: hidden !important;
      opacity: 0 !important;
      z-index: -1000 !important;
      pointer-events: none !important;
    `;
    
    // Add iframe to document
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise<void>((resolve) => {
      iframe!.onload = () => resolve();
      // Create minimal HTML document for iframe
      iframe!.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                width: 1920px;
                height: 1080px;
                overflow: hidden;
              }
            </style>
          </head>
          <body></body>
        </html>
      `;
    });

    // Get iframe document for rendering
    const iframeDoc = iframe.contentDocument!;
    const iframeBody = iframeDoc.body;
    
    // Update progress
    toast.loading(`Generating ${format.toUpperCase()} images...`, { id: toastId });

    const zip = new JSZip();
    const images: Array<{
      slideNumber: number;
      filename: string;
      content: string;
      mimeType: string;
      slideTitle: string;
    }> = [];

    // Generate images for each slide inside iframe
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`🖼️ Generating image ${i + 1}/${slides.length}: ${slide.title}`);
      
      // Update progress
      toast.loading(`Processing slide ${i + 1}/${slides.length}...`, { id: toastId });
      
      // Clear iframe body
      iframeBody.innerHTML = '';
      
      // Create slide element inside iframe
      const slideElement = createSlideElementForIframe(presentation, slide, i + 1, slides.length, iframeDoc);
      iframeBody.appendChild(slideElement);
      
      // Wait for content to render in iframe
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture from iframe content - completely isolated from main page
      const canvas = await html2canvas(slideElement, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: '#0f172a',
        removeContainer: false,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0
      });
      
      console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);
      
      // Convert canvas to blob
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpeg' ? 0.95 : undefined;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
      });
      
      console.log(`💾 Generated blob size: ${blob.size} bytes`);
      
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Content = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
      
      const filename = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_slide_${(i + 1).toString().padStart(2, '0')}.${format}`;
      
      images.push({
        slideNumber: i + 1,
        filename,
        content: base64Content,
        mimeType,
        slideTitle: slide.title
      });
      
      console.log(`✅ Generated image ${i + 1}/${slides.length}: ${slide.title} (${blob.size} bytes)`);
    }
    
    console.log(`🎯 Successfully generated ${images.length} images`);
    
    // Streamlined download process
    if (images.length === 1) {
      // Single slide - download directly
      const image = images[0];
      downloadBase64Image(image.content, image.filename, image.mimeType);
    } else {
      // Multiple slides - auto-download as ZIP
      console.log(`📦 Creating ZIP archive with ${images.length} slides...`);
      await downloadImagesAsZip(images, presentation.title || 'Presentation', format);
      console.log(`✅ ZIP download completed successfully`);
    }
    
    // Dismiss loading and show success
    if (toastId) {
      toast.dismiss(toastId);
      toast.success(`${format.toUpperCase()} export completed successfully!`, {
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155'
        }
      });
    }
    
  } catch (error) {
    // Dismiss loading on error
    if (toastId) {
      toast.dismiss(toastId);
      toast.error('Failed to export presentation. Please try again.', { id: toastId });
    }
    console.error(`${format.toUpperCase()} export failed:`, error);
    throw error;
  } finally {
    // Always clean up iframe
    if (iframe && iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}

/**
 * Create a slide element specifically for iframe rendering
 */
function createSlideElementForIframe(
  presentation: PresentationData, 
  slide: Slide, 
  slideNumber: number, 
  totalSlides: number,
  iframeDoc: Document
): HTMLElement {
  const slideDiv = iframeDoc.createElement('div');
  
  slideDiv.style.cssText = `
    font-family: Arial, Helvetica, sans-serif;
    background: #0f172a;
    color: white;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 80px;
    box-sizing: border-box;
  `;
  
  // Slide Number Badge
  const badge = iframeDoc.createElement('div');
  badge.style.cssText = `
    position: absolute;
    top: 60px;
    right: 60px;
    width: 60px;
    height: 60px;
    background: #06b6d4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 28px;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  badge.textContent = slideNumber.toString();
  slideDiv.appendChild(badge);
  
  // Slide Title
  const title = iframeDoc.createElement('h1');
  title.style.cssText = `
    font-size: 72px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 60px 0;
    color: #06b6d4;
    line-height: 1.2;
    max-width: 1600px;
    word-wrap: break-word;
  `;
  title.textContent = slide.title;
  slideDiv.appendChild(title);
  
  // Slide Content Container
  const contentContainer = iframeDoc.createElement('div');
  contentContainer.style.cssText = `
    max-width: 1400px;
    font-size: 32px;
    line-height: 1.6;
    color: #e2e8f0;
  `;
  
  // Add bullet points
  slide.content.forEach(item => {
    const itemContainer = iframeDoc.createElement('div');
    itemContainer.style.cssText = `
      display: flex;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 10px 0;
    `;
    
    const bullet = iframeDoc.createElement('span');
    bullet.style.cssText = `
      color: #06b6d4;
      font-size: 40px;
      margin-right: 30px;
      margin-top: 5px;
      font-weight: bold;
    `;
    bullet.textContent = '•';
    
    const text = iframeDoc.createElement('span');
    text.style.cssText = `
      flex: 1;
      color: #e2e8f0;
      line-height: 1.5;
    `;
    text.textContent = item;
    
    itemContainer.appendChild(bullet);
    itemContainer.appendChild(text);
    contentContainer.appendChild(itemContainer);
  });
  
  slideDiv.appendChild(contentContainer);
  
  // Footer
  const footer = iframeDoc.createElement('div');
  footer.style.cssText = `
    position: absolute;
    bottom: 40px;
    left: 80px;
    right: 80px;
    text-align: center;
    font-size: 24px;
    color: #94a3b8;
    border-top: 2px solid rgba(148, 163, 184, 0.3);
    padding: 20px;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 10px;
  `;
  footer.textContent = `${presentation.title || 'Presentation'} | Slide ${slideNumber} of ${totalSlides} | AI Presentation Platform`;
  slideDiv.appendChild(footer);
  
  return slideDiv;
}

/**
 * Download base64 encoded image
 */
function downloadBase64Image(base64Content: string, filename: string, mimeType: string) {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error('Failed to download image file');
  }
}

/**
 * Download multiple images as ZIP archive
 */
async function downloadImagesAsZip(images: any[], presentationTitle: string, format: string) {
  try {
    const zip = new JSZip();
    
    // Add each image to the ZIP
    images.forEach((image, index) => {
      const byteCharacters = atob(image.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      zip.file(image.filename, byteArray);
    });
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Download ZIP file
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(presentationTitle || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_slides.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Failed to create ZIP archive:', error);
    // Fallback to individual downloads
    console.log('Falling back to individual downloads...');
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      setTimeout(() => {
        downloadBase64Image(image.content, image.filename, image.mimeType);
      }, i * 500);
    }
  }
}
