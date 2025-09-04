import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

// Professional color schemes
const PROFESSIONAL_COLORS = {
  PRIMARY_BLUE: '#003366',
  ACCENT_BLUE: '#0066CC',
  LIGHT_BLUE: '#E6F2FF',
  DARK_GRAY: '#2C3E50',
  MEDIUM_GRAY: '#7F8C8D',
  LIGHT_GRAY: '#ECF0F1',
  SUCCESS_GREEN: '#27AE60',
  WARNING_ORANGE: '#E67E22',
  ERROR_RED: '#C0392B',
  PRIMARY_TEXT: '#2C3E50',
  SECONDARY_TEXT: '#7F8C8D',
  WHITE_TEXT: '#FFFFFF'
};

// Typography standards
const TYPOGRAPHY = {
  H1_SIZE: 28,
  H2_SIZE: 24,
  H3_SIZE: 20,
  BODY_SIZE: 18,
  CAPTION_SIZE: 14,
  PRIMARY_FONT: 'Arial, sans-serif',
  SECONDARY_FONT: 'Helvetica, sans-serif',
  LINE_HEIGHT: 1.6
};

// Layout constants
const LAYOUT = {
  MARGIN: 25,
  COLUMN_GAP: 20,
  SECTION_SPACING: 30,
  PARAGRAPH_SPACING: 16,
  BULLET_INDENT: 15
};

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
      presentation_style?: string;
      topic?: string;
      author?: string;
      company?: string;
    };
  };
}

/**
 * Generate professional-grade PDF
 */
export const exportToPDF = async (presentation: PresentationData): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const slides = presentation.content?.slides || [];
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const metadata = presentation.content?.metadata || {};

  // Set document metadata
  pdf.setProperties({
    title: presentation.title,
    author: metadata.author || 'Slidefast',
    subject: presentation.description || 'AI Generated Presentation',
    creator: 'Slidefast'
  });

  // Professional cover page
  createProfessionalCoverPage(pdf, presentation, pageWidth, pageHeight);

  // Generate content slides
  slides.forEach((slide, index) => {
    pdf.addPage();
    createProfessionalSlide(pdf, slide, index + 1, slides.length, pageWidth, pageHeight);
  });

  // Add metadata page if needed
  if (metadata.audience_level || metadata.presentation_style) {
    pdf.addPage();
    createMetadataPage(pdf, presentation, pageWidth, pageHeight);
  }

  // Download
  const filename = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_Professional.pdf`;
  pdf.save(filename);
};

/**
 * Create professional cover page
 */
function createProfessionalCoverPage(
  pdf: jsPDF, 
  presentation: PresentationData, 
  pageWidth: number, 
  pageHeight: number
): void {
  const centerX = pageWidth / 2;
  const metadata = presentation.content?.metadata || {};

  // Background
  pdf.setFillColor(PROFESSIONAL_COLORS.PRIMARY_BLUE);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  pdf.setFillColor(PROFESSIONAL_COLORS.LIGHT_BLUE);
  pdf.rect(0, 60, pageWidth, pageHeight - 60, 'F');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(TYPOGRAPHY.H1_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.WHITE_TEXT);
  
  const titleLines = pdf.splitTextToSize(presentation.title, pageWidth - (LAYOUT.MARGIN * 2));
  pdf.text(titleLines, centerX, 35, { align: 'center' });

  // Description
  if (presentation.description) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(TYPOGRAPHY.BODY_SIZE);
    pdf.setTextColor(PROFESSIONAL_COLORS.PRIMARY_TEXT);
    
    const descLines = pdf.splitTextToSize(presentation.description, pageWidth - (LAYOUT.MARGIN * 3));
    pdf.text(descLines, centerX, 100, { align: 'center' });
  }

  // Metadata
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(TYPOGRAPHY.CAPTION_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.SECONDARY_TEXT);
  
  let metaY = pageHeight - 60;
  
  if (metadata.audience_level) {
    pdf.text(`Audience Level: ${metadata.audience_level}`, centerX, metaY, { align: 'center' });
    metaY += 15;
  }
  
  if (metadata.company) {
    pdf.text(`Organization: ${metadata.company}`, centerX, metaY, { align: 'center' });
    metaY += 15;
  }
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(currentDate, centerX, metaY, { align: 'center' });

  const slideCount = presentation.content?.slides?.length || 0;
  pdf.setFontSize(TYPOGRAPHY.CAPTION_SIZE);
  pdf.text(`${slideCount} Slides`, centerX, metaY + 15, { align: 'center' });
}

/**
 * Create professional slide
 */
function createProfessionalSlide(
  pdf: jsPDF,
  slide: Slide,
  slideNumber: number,
  totalSlides: number,
  pageWidth: number,
  pageHeight: number
): void {
  // Header
  pdf.setFillColor(PROFESSIONAL_COLORS.PRIMARY_BLUE);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  // Slide number
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(TYPOGRAPHY.CAPTION_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.WHITE_TEXT);
  pdf.text(`${slideNumber} / ${totalSlides}`, pageWidth - LAYOUT.MARGIN, 15, { align: 'right' });

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(TYPOGRAPHY.H2_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.PRIMARY_TEXT);
  
  const titleLines = pdf.splitTextToSize(slide.title, pageWidth - (LAYOUT.MARGIN * 2));
  pdf.text(titleLines, LAYOUT.MARGIN, 50);

  // Content
  let contentY = 75;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(TYPOGRAPHY.BODY_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.PRIMARY_TEXT);

  slide.content.forEach((item) => {
    // Bullet point
    pdf.setFillColor(PROFESSIONAL_COLORS.ACCENT_BLUE);
    pdf.circle(LAYOUT.MARGIN + 5, contentY - 2, 2, 'F');
    
    // Content text
    const itemLines = pdf.splitTextToSize(item, pageWidth - LAYOUT.MARGIN * 2 - LAYOUT.BULLET_INDENT);
    pdf.text(itemLines, LAYOUT.MARGIN + LAYOUT.BULLET_INDENT, contentY);
    
    contentY += (itemLines.length * 8) + LAYOUT.PARAGRAPH_SPACING;
  });

  // Speaker notes
  if (slide.speaker_notes && contentY < pageHeight - 80) {
    contentY += LAYOUT.SECTION_SPACING;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(TYPOGRAPHY.H3_SIZE);
    pdf.setTextColor(PROFESSIONAL_COLORS.ACCENT_BLUE);
    pdf.text('Speaker Notes', LAYOUT.MARGIN, contentY);
    
    contentY += 15;
    
    const notesHeight = 40;
    pdf.setFillColor(PROFESSIONAL_COLORS.LIGHT_GRAY);
    pdf.rect(LAYOUT.MARGIN, contentY - 5, pageWidth - (LAYOUT.MARGIN * 2), notesHeight, 'F');
    
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(TYPOGRAPHY.CAPTION_SIZE);
    pdf.setTextColor(PROFESSIONAL_COLORS.SECONDARY_TEXT);
    
    const notesLines = pdf.splitTextToSize(slide.speaker_notes, pageWidth - (LAYOUT.MARGIN * 2) - 10);
    pdf.text(notesLines, LAYOUT.MARGIN + 5, contentY + 5);
  }

  // Footer line
  pdf.setDrawColor(PROFESSIONAL_COLORS.LIGHT_GRAY);
  pdf.setLineWidth(0.5);
  pdf.line(LAYOUT.MARGIN, pageHeight - 15, pageWidth - LAYOUT.MARGIN, pageHeight - 15);
}

/**
 * Create metadata summary page
 */
function createMetadataPage(
  pdf: jsPDF,
  presentation: PresentationData,
  pageWidth: number,
  pageHeight: number
): void {
  const metadata = presentation.content?.metadata || {};
  const centerX = pageWidth / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(TYPOGRAPHY.H2_SIZE);
  pdf.setTextColor(PROFESSIONAL_COLORS.PRIMARY_TEXT);
  pdf.text('Presentation Details', centerX, 50, { align: 'center' });

  let detailY = 80;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(TYPOGRAPHY.BODY_SIZE);
  
  const details = [
    { label: 'Title', value: presentation.title },
    { label: 'Description', value: presentation.description },
    { label: 'Audience Level', value: metadata.audience_level },
    { label: 'Presentation Style', value: metadata.presentation_style },
    { label: 'Topic', value: metadata.topic },
    { label: 'Author', value: metadata.author },
    { label: 'Generated', value: new Date().toLocaleString() }
  ];

  details.forEach(detail => {
    if (detail.value) {
      pdf.setTextColor(PROFESSIONAL_COLORS.ACCENT_BLUE);
      pdf.text(`${detail.label}:`, LAYOUT.MARGIN, detailY);
      
      pdf.setTextColor(PROFESSIONAL_COLORS.PRIMARY_TEXT);
      pdf.text(detail.value, LAYOUT.MARGIN + 60, detailY);
      
      detailY += 20;
    }
  });
}

/**
 * Generate Clean Professional PowerPoint presentation with simplified styling
 */
export const exportToPPTX = async (presentation: PresentationData): Promise<void> => {
  const pptx = new PptxGenJS();
  
  const metadata = presentation.content?.metadata || {};
  pptx.author = metadata.author || 'Slidefast Platform';
  pptx.company = metadata.company || 'Slidefast';
  pptx.title = presentation.title;
  pptx.subject = presentation.description || 'AI Generated Presentation';
  pptx.revision = '1.0';
  
  // Define clean 16:9 layout
  pptx.defineLayout({ name: 'CLEAN_16x9', width: 13.33, height: 7.5 });
  pptx.layout = 'CLEAN_16x9';

  // Simplified professional color palette
  const CLEAN_COLORS = {
    PRIMARY_BLUE: '1B365D',      // Professional navy
    ACCENT_BLUE: '3B82F6',       // Clean blue accent
    WHITE: 'FFFFFF',             // Pure white
    LIGHT_GRAY: 'F8F9FA',        // Light background
    DARK_TEXT: '1F2937',         // Dark readable text
    MEDIUM_TEXT: '6B7280'        // Medium gray text
  };

  const slides = presentation.content?.slides || [];

  // CLEAN TITLE SLIDE
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: CLEAN_COLORS.WHITE };
  
  // Simple header accent
  titleSlide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.5,
    fill: { color: CLEAN_COLORS.PRIMARY_BLUE },
    line: { width: 0 }
  });
  
  // Main title - clean and simple
  titleSlide.addText(presentation.title, {
    x: 1, y: 2.5, w: 11.33, h: 1.5,
    fontSize: 36,
    bold: true,
    align: 'center',
    valign: 'middle',
    color: CLEAN_COLORS.DARK_TEXT,
    fontFace: 'Calibri'
  });
  
  // Subtitle if available
  if (presentation.description) {
    titleSlide.addText(presentation.description, {
      x: 1.5, y: 4.5, w: 10.33, h: 1,
      fontSize: 18,
      align: 'center',
      color: CLEAN_COLORS.MEDIUM_TEXT,
      fontFace: 'Calibri'
    });
  }
  
  // Simple footer info
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  titleSlide.addText(`${slides.length} Slides | ${currentDate}`, {
    x: 1, y: 6.5, w: 11.33, h: 0.4,
    fontSize: 14,
    align: 'center',
    color: CLEAN_COLORS.MEDIUM_TEXT,
    fontFace: 'Calibri'
  });

  // CLEAN CONTENT SLIDES
  slides.forEach((slide, index) => {
    const contentSlide = pptx.addSlide();
    contentSlide.background = { color: CLEAN_COLORS.WHITE };
    
    // Simple header
    contentSlide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: 0.3,
      fill: { color: CLEAN_COLORS.PRIMARY_BLUE },
      line: { width: 0 }
    });
    
    // Slide number
    contentSlide.addText(`${index + 1} / ${slides.length}`, {
      x: 11.5, y: 0.5, w: 1.5, h: 0.4,
      fontSize: 12,
      color: CLEAN_COLORS.MEDIUM_TEXT,
      fontFace: 'Calibri',
      align: 'right'
    });
    
    // Slide title - clean and readable
    contentSlide.addText(slide.title, {
      x: 0.8, y: 1.2, w: 11.73, h: 0.8,
      fontSize: 28,
      bold: true,
      color: CLEAN_COLORS.PRIMARY_BLUE,
      fontFace: 'Calibri',
      valign: 'middle'
    });
    
    // Content bullets - simplified to prevent overlapping
    let bulletY = 2.5;
    const bulletSpacing = 0.7;  // Increased spacing to prevent overlap
    
    slide.content.forEach((item, bulletIndex) => {
      // Simple bullet point
      contentSlide.addText('•', {
        x: 1, y: bulletY, w: 0.3, h: 0.5,
        fontSize: 18,
        color: CLEAN_COLORS.ACCENT_BLUE,
        fontFace: 'Calibri',
        bold: true
      });
      
      // Clean bullet text - single text box to prevent duplication
      contentSlide.addText(item, {
        x: 1.5, y: bulletY, w: 10.5, h: 0.6,
        fontSize: 16,
        fontFace: 'Calibri',
        color: CLEAN_COLORS.DARK_TEXT,
        valign: 'top',
        wrap: true  // Enable text wrapping
      });
      
      bulletY += bulletSpacing;
    });
    
    // Simple footer
    contentSlide.addText(presentation.title, {
      x: 0.8, y: 7, w: 8, h: 0.3,
      fontSize: 10,
      color: CLEAN_COLORS.MEDIUM_TEXT,
      fontFace: 'Calibri'
    });

    // Add clean speaker notes
    if (slide.speaker_notes) {
      const notesText = `Speaker Notes: ${slide.speaker_notes}`;
      contentSlide.addNotes(notesText);
    }
  });

  // Download with clean filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pptx`;
  await pptx.writeFile({ fileName: filename });
};

/**
 * Generate Interactive HTML Presentation with Full Slideshow Functionality
 */
export const exportToHTML = async (presentation: PresentationData): Promise<void> => {
  const slides = presentation.content?.slides || [];
  const metadata = presentation.content?.metadata || {};
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${presentation.description || 'Interactive AI-generated presentation with slideshow functionality'}">
    <meta name="author" content="${metadata.author || 'Slidefast'}">
    <title>${presentation.title} - Interactive Presentation</title>
    <style>
        :root {
            --color-primary-blue: #003366;
            --color-accent-blue: #0066CC;
            --color-light-blue: #E6F2FF;
            --color-dark-gray: #2C3E50;
            --color-medium-gray: #7F8C8D;
            --color-light-gray: #ECF0F1;
            --color-white: #FFFFFF;
            --color-success: #27AE60;
            --color-warning: #F39C12;
            --font-size-h1: 2.618rem;
            --font-size-h2: 2rem;
            --font-size-body: 1.125rem;
            --spacing-sm: 1rem;
            --spacing-md: 1.5rem;
            --spacing-lg: 2rem;
            --spacing-xl: 3rem;
            --border-radius: 12px;
            --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.08);
            --transition-smooth: all 0.3s ease;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, var(--color-primary-blue) 0%, var(--color-accent-blue) 100%);
            color: var(--color-dark-gray);
            line-height: 1.6;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        /* DOCUMENT VIEW MODE (Default) */
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-lg);
            transition: var(--transition-smooth);
        }
        
        .presentation-header {
            text-align: center;
            margin-bottom: var(--spacing-xl);
            background: var(--color-white);
            padding: var(--spacing-xl);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-soft);
            position: relative;
        }
        
        .presentation-title {
            font-size: var(--font-size-h1);
            font-weight: 700;
            color: var(--color-primary-blue);
            margin-bottom: var(--spacing-md);
        }
        
        .presentation-subtitle {
            font-size: var(--font-size-body);
            color: var(--color-medium-gray);
            margin-bottom: var(--spacing-md);
        }
        
        /* CONTROL TOOLBAR */
        .presentation-toolbar {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-white);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-soft);
            padding: 10px;
            display: flex;
            gap: 10px;
            z-index: 1000;
            transition: var(--transition-smooth);
        }
        
        .toolbar-button {
            background: var(--color-accent-blue);
            color: var(--color-white);
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: var(--transition-smooth);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .toolbar-button:hover {
            background: var(--color-primary-blue);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 51, 102, 0.3);
        }
        
        .toolbar-button.active {
            background: var(--color-success);
        }
        
        .toolbar-button.print-btn {
            background: var(--color-warning);
        }
        
        .toolbar-button.print-btn:hover {
            background: #E67E22;
        }
        
        /* SLIDE STYLES */
        .slide {
            background: var(--color-white);
            margin: var(--spacing-lg) 0;
            padding: var(--spacing-xl);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-soft);
            transition: var(--transition-smooth);
            scroll-margin-top: 100px;
        }
        
        .slide:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
        
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-lg);
        }
        
        .slide-number {
            background: var(--color-accent-blue);
            color: var(--color-white);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 700;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        
        .slide-number:hover {
            background: var(--color-primary-blue);
            transform: scale(1.05);
        }
        
        .slide-title {
            font-size: var(--font-size-h2);
            font-weight: 700;
            color: var(--color-primary-blue);
            flex: 1;
            margin-right: var(--spacing-md);
        }
        
        .slide-content ul {
            list-style: none;
            padding: 0;
        }
        
        .slide-content li {
            margin: var(--spacing-sm) 0;
            padding-left: var(--spacing-lg);
            position: relative;
            transition: var(--transition-smooth);
        }
        
        .slide-content li:hover {
            transform: translateX(5px);
            color: var(--color-primary-blue);
        }
        
        .slide-content li::before {
            content: '▶';
            color: var(--color-accent-blue);
            font-weight: 700;
            position: absolute;
            left: 0;
            top: 2px;
            transition: var(--transition-smooth);
        }
        
        .slide-content li:hover::before {
            color: var(--color-primary-blue);
            transform: scale(1.2);
        }
        
        .speaker-notes {
            margin-top: var(--spacing-lg);
            padding: var(--spacing-lg);
            background: var(--color-light-gray);
            border-left: 4px solid var(--color-accent-blue);
            border-radius: 0 var(--border-radius) var(--border-radius) 0;
            transition: var(--transition-smooth);
        }
        
        .speaker-notes:hover {
            background: #E8F4FD;
            border-left-color: var(--color-primary-blue);
        }
        
        .speaker-notes-title {
            font-weight: 700;
            color: var(--color-primary-blue);
            margin-bottom: var(--spacing-sm);
        }
        
        /* SLIDESHOW MODE */
        .slideshow-mode {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 9999;
            display: none;
            overflow: hidden;
        }
        
        .slideshow-mode.active {
            display: block;
        }
        
        .slideshow-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.5s ease;
        }
        
        .slideshow-slide.active {
            opacity: 1;
            transform: translateX(0);
        }
        
        .slideshow-slide.prev {
            transform: translateX(-100%);
        }
        
        .slideshow-slide-number {
            position: absolute;
            top: 30px;
            right: 30px;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
        }
        
        .slideshow-slide-title {
            font-size: 3.5rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slideshow-slide-content {
            font-size: 1.8rem;
            line-height: 1.6;
            max-width: 80%;
            text-align: center;
        }
        
        .slideshow-slide-content ul {
            list-style: none;
            text-align: left;
        }
        
        .slideshow-slide-content li {
            margin: 1rem 0;
            padding-left: 2rem;
            position: relative;
        }
        
        .slideshow-slide-content li::before {
            content: '•';
            color: #60a5fa;
            font-size: 2rem;
            position: absolute;
            left: 0;
            top: -0.2rem;
        }
        
        /* SLIDESHOW NAVIGATION */
        .slideshow-nav {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 10000;
        }
        
        .slideshow-nav button {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 50px;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        
        .slideshow-nav button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        
        .slideshow-controls {
            position: fixed;
            top: 30px;
            left: 30px;
            display: flex;
            gap: 15px;
            z-index: 10000;
        }
        
        .slideshow-controls button {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 25px;
            padding: 8px 15px;
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        
        .slideshow-controls button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        /* PROGRESS BAR */
        .progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            z-index: 10000;
        }
        
        .progress-fill {
            height: 100%;
            background: #60a5fa;
            transition: width 0.3s ease;
            width: 0%;
        }
        
        /* PRINT STYLES */
        @media print {
            .presentation-toolbar,
            .slideshow-mode {
                display: none !important;
            }
            
            body {
                background: white !important;
            }
            
            .presentation-container {
                max-width: none;
                padding: 0;
            }
            
            .slide {
                page-break-inside: avoid;
                page-break-after: always;
                box-shadow: none;
                border: 1px solid #ddd;
                margin: 0;
            }
            
            .speaker-notes {
                display: none;
            }
        }
        
        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
            .presentation-container {
                padding: var(--spacing-sm);
            }
            
            .slide-header {
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .presentation-toolbar {
                position: fixed;
                bottom: 20px;
                right: 20px;
                top: auto;
                flex-direction: column;
            }
            
            .slideshow-slide {
                padding: 30px;
            }
            
            .slideshow-slide-title {
                font-size: 2.5rem;
            }
            
            .slideshow-slide-content {
                font-size: 1.4rem;
                max-width: 95%;
            }
        }
        
        /* KEYBOARD HINT */
        .keyboard-hint {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1001;
            transition: var(--transition-smooth);
        }
        
        .keyboard-hint:hover {
            background: rgba(0, 0, 0, 0.9);
        }
    </style>
</head>
<body>
    <!-- CONTROL TOOLBAR -->
    <div class="presentation-toolbar">
        <button class="toolbar-button" onclick="startSlideshow()" title="Start Slideshow (F5)">
            🎥 Slideshow
        </button>
        <button class="toolbar-button print-btn" onclick="printPresentation()" title="Print Presentation (Ctrl+P)">
            🖶️ Print
        </button>
        <button class="toolbar-button" onclick="toggleSpeakerNotes()" title="Toggle Speaker Notes">
            📝 Notes
        </button>
        <button class="toolbar-button" onclick="scrollToSlide(1)" title="Go to First Slide">
            ⏮️ Start
        </button>
    </div>
    
    <!-- KEYBOARD SHORTCUTS HINT -->
    <div class="keyboard-hint" title="Keyboard Shortcuts">
        F5: Slideshow | ←→: Navigate | Esc: Exit | Ctrl+P: Print
    </div>
    
    <!-- DOCUMENT VIEW -->
    <div class="presentation-container">
        <header class="presentation-header">
            <h1 class="presentation-title">${presentation.title}</h1>
            ${presentation.description ? `<p class="presentation-subtitle">${presentation.description}</p>` : ''}
            <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-medium-gray);">
                📊 ${slides.length} slides | 🗺️ Interactive presentation | 🔗 Generated ${new Date().toLocaleDateString()}
            </div>
        </header>
        
        <main>
            ${slides.map((slide, index) => `
                <article class="slide" id="slide-${index + 1}" data-slide="${index}">
                    <div class="slide-header">
                        <h2 class="slide-title">${slide.title}</h2>
                        <span class="slide-number" onclick="goToSlideshow(${index})" title="Present from this slide">
                            Slide ${index + 1}
                        </span>
                    </div>
                    <div class="slide-content">
                        <ul>
                            ${slide.content.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ${slide.speaker_notes ? `
                        <section class="speaker-notes" data-speaker-notes>
                            <h3 class="speaker-notes-title">🎤 Speaker Notes</h3>
                            <div class="speaker-notes-content">${slide.speaker_notes}</div>
                        </section>
                    ` : ''}
                </article>
            `).join('')}
        </main>
        
        <footer style="text-align: center; margin-top: 3rem; padding: 2rem; color: #fff;">
            <p><strong>Slidefast</strong> | Interactive HTML Presentation | Generated ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>
    
    <!-- SLIDESHOW MODE -->
    <div class="slideshow-mode" id="slideshowMode">
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        
        <div class="slideshow-controls">
            <button onclick="exitSlideshow()" title="Exit Slideshow (Esc)">✕ Exit</button>
            <button onclick="toggleFullscreen()" title="Toggle Fullscreen">⛶ Fullscreen</button>
        </div>
        
        <!-- Dynamic slides will be inserted here -->
        
        <div class="slideshow-nav">
            <button onclick="previousSlide()" title="Previous Slide (←)">❮ Previous</button>
            <button onclick="nextSlide()" title="Next Slide (→)">Next ❯</button>
        </div>
    </div>
    
    <script>
        // PRESENTATION STATE
        let currentSlideIndex = 0;
        let slideshowMode = false;
        let speakerNotesVisible = true;
        const totalSlides = ${slides.length};
        const slides = ${JSON.stringify(slides)};
        
        // INITIALIZE PRESENTATION
        document.addEventListener('DOMContentLoaded', function() {
            initializePresentation();
            setupKeyboardShortcuts();
            updateProgress();
            
            // Add smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });
        
        // SLIDESHOW FUNCTIONALITY
        function startSlideshow(startIndex = 0) {
            currentSlideIndex = startIndex;
            slideshowMode = true;
            document.body.style.overflow = 'hidden';
            
            const slideshowEl = document.getElementById('slideshowMode');
            slideshowEl.innerHTML = generateSlideshowHTML();
            slideshowEl.classList.add('active');
            
            showSlide(currentSlideIndex);
            updateProgress();
            
            // Auto-hide cursor after inactivity
            let hideTimer;
            const resetHideTimer = () => {
                clearTimeout(hideTimer);
                slideshowEl.style.cursor = 'default';
                hideTimer = setTimeout(() => {
                    slideshowEl.style.cursor = 'none';
                }, 3000);
            };
            
            slideshowEl.addEventListener('mousemove', resetHideTimer);
            resetHideTimer();
        }
        
        function exitSlideshow() {
            slideshowMode = false;
            document.body.style.overflow = 'auto';
            document.getElementById('slideshowMode').classList.remove('active');
            updateProgress();
        }
        
        function generateSlideshowHTML() {
            return slides.map((slide, index) => \`
                <div class="slideshow-slide" data-slide-index="\${index}">
                    <div class="slideshow-slide-number">\${index + 1} / \${totalSlides}</div>
                    <h1 class="slideshow-slide-title">\${slide.title}</h1>
                    <div class="slideshow-slide-content">
                        <ul>
                            \${slide.content.map(item => \`<li>\${item}</li>\`).join('')}
                        </ul>
                    </div>
                </div>
            \`).join('');
        }
        
        function showSlide(index) {
            const slides = document.querySelectorAll('.slideshow-slide');
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'prev');
                if (i === index) {
                    slide.classList.add('active');
                } else if (i < index) {
                    slide.classList.add('prev');
                }
            });
        }
        
        function nextSlide() {
            if (currentSlideIndex < totalSlides - 1) {
                currentSlideIndex++;
                if (slideshowMode) {
                    showSlide(currentSlideIndex);
                }
                updateProgress();
            }
        }
        
        function previousSlide() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                if (slideshowMode) {
                    showSlide(currentSlideIndex);
                }
                updateProgress();
            }
        }
        
        function goToSlideshow(index) {
            startSlideshow(index);
        }
        
        // NAVIGATION FUNCTIONS
        function scrollToSlide(slideNumber) {
            const slide = document.getElementById(\`slide-\${slideNumber}\`);
            if (slide) {
                slide.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        function updateProgress() {
            const progress = ((currentSlideIndex + 1) / totalSlides) * 100;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = \`\${progress}%\`;
            }
        }
        
        // UTILITY FUNCTIONS
        function toggleSpeakerNotes() {
            speakerNotesVisible = !speakerNotesVisible;
            const notes = document.querySelectorAll('[data-speaker-notes]');
            notes.forEach(note => {
                note.style.display = speakerNotesVisible ? 'block' : 'none';
            });
            
            const button = document.querySelector('[onclick="toggleSpeakerNotes()"]');
            button.textContent = speakerNotesVisible ? '📝 Notes' : '📝 Show Notes';
            button.classList.toggle('active', !speakerNotesVisible);
        }
        
        function printPresentation() {
            window.print();
        }
        
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(\`Error attempting to enable fullscreen: \${err.message}\`);
                });
            } else {
                document.exitFullscreen();
            }
        }
        
        // KEYBOARD SHORTCUTS
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                // Prevent default behavior for our shortcuts
                if (['F5', 'Escape', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || 
                    (e.ctrlKey && e.code === 'KeyP')) {
                    
                    switch(e.code) {
                        case 'F5':
                            e.preventDefault();
                            if (!slideshowMode) {
                                startSlideshow();
                            }
                            break;
                        case 'Escape':
                            if (slideshowMode) {
                                exitSlideshow();
                            }
                            break;
                        case 'ArrowLeft':
                            if (slideshowMode) {
                                e.preventDefault();
                                previousSlide();
                            }
                            break;
                        case 'ArrowRight':
                        case 'Space':
                            if (slideshowMode) {
                                e.preventDefault();
                                nextSlide();
                            }
                            break;
                        case 'KeyP':
                            if (e.ctrlKey) {
                                e.preventDefault();
                                printPresentation();
                            }
                            break;
                    }
                }
                
                // Number keys for quick slide navigation in slideshow
                if (slideshowMode && e.code.startsWith('Digit')) {
                    const slideNum = parseInt(e.code.replace('Digit', ''));
                    if (slideNum > 0 && slideNum <= totalSlides) {
                        currentSlideIndex = slideNum - 1;
                        showSlide(currentSlideIndex);
                        updateProgress();
                    }
                }
            });
        }
        
        function initializePresentation() {
            console.log('\ud83c\udfa5 Interactive Presentation Loaded');
            console.log(\`Total slides: \${totalSlides}\`);
            console.log('Keyboard shortcuts:');
            console.log('  F5: Start slideshow');
            console.log('  ← →: Navigate slides (in slideshow)');
            console.log('  Esc: Exit slideshow');
            console.log('  Ctrl+P: Print presentation');
            console.log('  1-9: Jump to slide (in slideshow)');
        }
        
        // TOUCH SUPPORT FOR MOBILE
        let touchStartX = null;
        let touchStartY = null;
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', function(e) {
            if (!touchStartX || !touchStartY || !slideshowMode) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchStartX - touchEndX;
            const deltaY = touchStartY - touchEndY;
            
            // Only respond to horizontal swipes that are longer than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    nextSlide(); // Swipe left = next slide
                } else {
                    previousSlide(); // Swipe right = previous slide
                }
            }
            
            touchStartX = null;
            touchStartY = null;
        });
    </script>
</body>
</html>`;

  // Create and download HTML file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(presentation.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}_Interactive.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Main export function with loading state management
 */
export const downloadPresentation = async (
  presentation: PresentationData, 
  format: 'pdf' | 'pptx' | 'html' | 'png' | 'jpeg',
  onProgress?: (message: string) => void
): Promise<void> => {
  try {
    onProgress?.(`Preparing ${format.toUpperCase()} export...`);
    
    switch (format) {
      case 'pdf':
        await exportToPDF(presentation);
        break;
      case 'pptx':
        await exportToPPTX(presentation);
        break;
      case 'html':
        await exportToHTML(presentation);
        break;
      case 'png':
      case 'jpeg':
        // PNG/JPEG export is now handled by Web Worker approach
        throw new Error(`PNG/JPEG export is handled separately by the presentation viewer`);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    onProgress?.(`${format.toUpperCase()} downloaded successfully!`);
  } catch (error) {
    console.error(`Export to ${format} failed:`, error);
    throw new Error(`Failed to export to ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
