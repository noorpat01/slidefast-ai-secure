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
 * WEB WORKER + OFFSCREEN CANVAS EXPORT - Zero visual impact solution
 * This uses Web Workers and OffscreenCanvas to render slides completely off the main thread
 */
export async function exportPresentationAsImagesWithWorker(
  presentation: PresentationData,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  let toastId: string | undefined;
  let worker: Worker | null = null;

  try {
    // Show loading toast
    toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);

    const slides = presentation.content?.slides || [];
    if (slides.length === 0) {
      throw new Error('No slides found in presentation');
    }

    console.log(`🚀 Starting Web Worker ${format.toUpperCase()} export for ${slides.length} slides...`);

    // Check for OffscreenCanvas support
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('OffscreenCanvas is not supported in this browser. Please use a modern browser.');
    }

    // Create Web Worker
    worker = new Worker('/slideRenderWorker.js');
    
    // Set up worker communication
    const images = await new Promise<Array<{
      slideNumber: number;
      filename: string;
      arrayBuffer: ArrayBuffer;
      mimeType: string;
      slideTitle: string;
    }>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout - rendering took too long'));
      }, 120000); // 2 minute timeout

      worker!.addEventListener('message', (event) => {
        const { type, payload, message, images, error, slideNumber, total } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            if (toastId) {
              toast.loading(message, { id: toastId });
            }
            console.log(`📊 ${message}`);
            break;
            
          case 'SLIDE_COMPLETE':
            if (toastId) {
              toast.loading(`Generated slide ${slideNumber}/${total}...`, { id: toastId });
            }
            console.log(`✅ Completed slide ${slideNumber}/${total}`);
            break;
            
          case 'RENDER_COMPLETE':
            clearTimeout(timeout);
            console.log(`🎯 Successfully generated ${images.length} images`);
            resolve(images);
            break;
            
          case 'ERROR':
            clearTimeout(timeout);
            reject(new Error(error));
            break;
        }
      });

      worker!.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${error.message}`));
      });

      // Start rendering
      worker!.postMessage({
        type: 'RENDER_SLIDES',
        payload: { presentation, format }
      });
    });
    
    // Update progress
    if (toastId) {
      toast.loading('Creating download package...', { id: toastId });
    }
    
    // Create ZIP package
    if (images.length === 1) {
      // Single slide - download directly
      const image = images[0];
      const blob = new Blob([image.arrayBuffer], { type: image.mimeType });
      downloadBlob(blob, image.filename);
    } else {
      // Multiple slides - create ZIP
      const zip = new JSZip();
      
      images.forEach((image) => {
        zip.file(image.filename, image.arrayBuffer);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_slides.zip`;
      downloadBlob(zipBlob, zipFilename);
    }
    
    // Show success message
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
    
    console.log(`🎉 Export completed successfully!`);
    
  } catch (error) {
    // Handle errors
    if (toastId) {
      toast.dismiss(toastId);
      toast.error('Failed to export presentation. Please try again.', { id: toastId });
    }
    console.error(`${format.toUpperCase()} export failed:`, error);
    throw error;
  } finally {
    // Always terminate worker
    if (worker) {
      worker.terminate();
    }
  }
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  try {
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
    console.error('Failed to download file:', error);
    throw new Error('Failed to download file');
  }
}

// Export the function with the same name as before for compatibility
export const exportPresentationAsImagesWithIframe = exportPresentationAsImagesWithWorker;
