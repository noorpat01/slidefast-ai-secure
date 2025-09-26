Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Parse request body for POST requests
        const requestData = await req.json();
        const { id: presentationId, format = 'pdf' } = requestData;

        if (!presentationId) {
            throw new Error('Presentation ID is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.id;
            }
        }

        if (!userId) {
            throw new Error('User authentication required');
        }

        // Fetch presentation from database
        const presentationResponse = await fetch(`${supabaseUrl}/rest/v1/presentations?id=eq.${presentationId}&user_id=eq.${userId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!presentationResponse.ok) {
            throw new Error('Failed to fetch presentation');
        }

        const presentations = await presentationResponse.json();
        if (!presentations || presentations.length === 0) {
            throw new Error('Presentation not found');
        }

        const presentation = presentations[0];
        const slides = presentation.content?.slides || [];

        if (format === 'png' || format === 'jpeg') {
            // Generate high-quality slide images
            const imageData = await generateSlideImages(presentation, slides, format as 'png' | 'jpeg');
            
            return new Response(JSON.stringify({ 
                data: imageData
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            });
        } else if (format === 'pdf') {
            // Generate PDF content
            const pdfContent = generatePDFContent(presentation, slides);
            
            return new Response(JSON.stringify({ 
                data: {
                    content: pdfContent,
                    filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                    mimeType: 'application/pdf'
                }
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            });
        } else if (format === 'pptx') {
            // Generate PowerPoint content
            const pptxContent = generatePowerPointContent(presentation, slides);
            
            return new Response(JSON.stringify({ 
                data: {
                    content: pptxContent,
                    filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx`,
                    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                }
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            });
        } else {
            // Generate HTML for preview
            const htmlContent = generateHTMLPresentation(presentation, slides);
            
            return new Response(JSON.stringify({ 
                data: {
                    content: htmlContent,
                    filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
                    mimeType: 'text/html'
                }
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json'
                }
            });
        }

    } catch (error) {
        console.error('Presentation export error:', error);

        const errorResponse = {
            error: {
                code: 'EXPORT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateHTMLPresentation(presentation: any, slides: any[]) {
    const slideElements = slides.map((slide, index) => `
        <section class="slide" data-slide="${index + 1}">
            <div class="slide-number">${slide.id}</div>
            <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
            <div class="slide-content">
                ${slide.content.map((item: string) => `
                    <div class="content-item">
                        <span class="bullet">•</span>
                        <span class="text">${escapeHtml(item)}</span>
                    </div>
                `).join('')}
            </div>
            ${slide.visual_suggestion ? `
                <div class="visual-suggestion">
                    <strong>Visual:</strong> ${escapeHtml(slide.visual_suggestion)}
                </div>
            ` : ''}
            ${slide.speaker_notes ? `
                <div class="speaker-notes">
                    <strong>Notes:</strong> ${escapeHtml(slide.speaker_notes)}
                </div>
            ` : ''}
        </section>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(presentation.title)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%);
            color: white;
            overflow-x: hidden;
        }
        
        .presentation-header {
            text-align: center;
            padding: 2rem;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .presentation-title {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }
        
        .presentation-description {
            font-size: 1.1rem;
            color: #94a3b8;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .slide {
            min-height: 100vh;
            padding: 3rem 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            page-break-after: always;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .slide-number {
            position: absolute;
            top: 2rem;
            right: 2rem;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            color: white;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .slide-title {
            font-size: 3rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 3rem;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
        }
        
        .slide-content {
            max-width: 800px;
            margin: 0 auto;
            font-size: 1.3rem;
            line-height: 1.8;
        }
        
        .content-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            padding: 0.5rem 0;
        }
        
        .bullet {
            color: #06b6d4;
            font-size: 1.5rem;
            margin-right: 1rem;
            margin-top: 0.1rem;
        }
        
        .text {
            flex: 1;
            color: #e2e8f0;
        }
        
        .visual-suggestion {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(6, 182, 212, 0.1);
            border-left: 4px solid #06b6d4;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            color: #94a3b8;
        }
        
        .speaker-notes {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(139, 92, 246, 0.1);
            border-left: 4px solid #8b5cf6;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            color: #94a3b8;
        }
        
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .slide {
                page-break-after: always;
            }
            
            .speaker-notes,
            .visual-suggestion {
                display: none;
            }
        }
        
        @media (max-width: 768px) {
            .slide {
                padding: 2rem 1rem;
            }
            
            .slide-title {
                font-size: 2rem;
            }
            
            .slide-content {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <div class="presentation-header">
        <h1 class="presentation-title">${escapeHtml(presentation.title)}</h1>
        <p class="presentation-description">${escapeHtml(presentation.description || '')}</p>
    </div>
    
    ${slideElements}
    
    <script>
        // Add keyboard navigation
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'flex' : 'none';
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                if (currentSlide < slides.length - 1) {
                    currentSlide++;
                    showSlide(currentSlide);
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentSlide > 0) {
                    currentSlide--;
                    showSlide(currentSlide);
                }
            }
        });
        
        // Initialize presentation mode
        if (window.location.hash === '#presentation') {
            document.body.style.overflow = 'hidden';
            showSlide(0);
        }
    </script>
</body>
</html>
    `;
}

function generatePDFContent(presentation: any, slides: any[]) {
    // Generate HTML that can be converted to PDF
    const pdfHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(presentation.title)}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0.5in;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .cover-page {
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .cover-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .cover-description {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            max-width: 600px;
        }
        
        .cover-meta {
            font-size: 1rem;
            opacity: 0.8;
        }
        
        .slide {
            page-break-before: always;
            page-break-after: always;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .slide-header {
            border-bottom: 3px solid #667eea;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        
        .slide-number {
            color: #667eea;
            font-size: 0.9rem;
            font-weight: bold;
        }
        
        .slide-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #333;
            margin: 0.5rem 0;
        }
        
        .slide-content {
            flex: 1;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .content-item {
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
        }
        
        .bullet {
            color: #667eea;
            font-weight: bold;
            margin-right: 0.5rem;
            margin-top: 0.1rem;
        }
        
        .speaker-notes {
            margin-top: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            font-size: 0.9rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="cover-page">
        <h1 class="cover-title">${escapeHtml(presentation.title)}</h1>
        <p class="cover-description">${escapeHtml(presentation.description || '')}</p>
        <div class="cover-meta">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>${slides.length} slides</p>
        </div>
    </div>
    
    ${slides.map((slide, index) => `
        <div class="slide">
            <div class="slide-header">
                <div class="slide-number">Slide ${index + 1} of ${slides.length}</div>
                <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
            </div>
            <div class="slide-content">
                ${slide.content.map((item: string) => `
                    <div class="content-item">
                        <span class="bullet">•</span>
                        <span>${escapeHtml(item)}</span>
                    </div>
                `).join('')}
            </div>
            ${slide.speaker_notes ? `
                <div class="speaker-notes">
                    <strong>Speaker Notes:</strong><br>
                    ${escapeHtml(slide.speaker_notes)}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
    `;
    
    return pdfHTML;
}

function generatePowerPointContent(presentation: any, slides: any[]) {
    // Generate a simplified PowerPoint-like structure
    // This would typically use a library like officegen or pptxgenjs
    // For now, we'll return a structured JSON that can be converted client-side
    const pptxData = {
        title: presentation.title,
        description: presentation.description,
        slides: slides.map((slide, index) => ({
            slideNumber: index + 1,
            title: slide.title,
            content: slide.content,
            speakerNotes: slide.speaker_notes,
            layout: slide.layout || 'title_and_bullets'
        })),
        metadata: {
            created: new Date().toISOString(),
            slideCount: slides.length,
            audienceLevel: presentation.content?.metadata?.audience_level || 'Professional'
        }
    };
    
    return JSON.stringify(pptxData, null, 2);
}

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Generate high-quality slide images using HTML canvas rendering
 */
async function generateSlideImages(presentation: any, slides: any[], format: 'png' | 'jpeg') {
    const images = [];
    const slideWidth = 1920;
    const slideHeight = 1080;
    
    // Generate images for individual slides
    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideHtml = generateSlideHTML(presentation, slide, i + 1, slides.length, slideWidth, slideHeight);
        
        try {
            // Convert HTML to image using canvas-based rendering
            const imageBuffer = await htmlToImage(slideHtml, slideWidth, slideHeight, format);
            const base64Image = btoa(String.fromCharCode.apply(null, Array.from(imageBuffer)));
            
            images.push({
                slideNumber: i + 1,
                filename: `${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-slide-${i + 1}.${format}`,
                content: base64Image,
                mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
                slideTitle: slide.title
            });
        } catch (error) {
            console.error(`Error generating image for slide ${i + 1}:`, error);
            // Continue with other slides even if one fails
        }
    }
    
    return {
        images,
        presentationTitle: presentation.title,
        totalSlides: slides.length,
        format
    };
}

/**
 * Generate individual slide HTML for image conversion
 */
function generateSlideHTML(presentation: any, slide: any, slideNumber: number, totalSlides: number, width: number, height: number) {
    const slideContent = slide.content.map((item: string) => `
        <div class="content-item">
            <span class="bullet">•</span>
            <span class="text">${escapeHtml(item)}</span>
        </div>
    `).join('');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%);
            color: white;
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        
        .slide-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 80px;
            position: relative;
        }
        
        .slide-number {
            position: absolute;
            top: 40px;
            right: 40px;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .slide-title {
            font-size: 72px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 60px;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
            max-width: 90%;
        }
        
        .slide-content {
            max-width: 1400px;
            margin: 0 auto;
            font-size: 32px;
            line-height: 1.6;
        }
        
        .content-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 10px 0;
        }
        
        .bullet {
            color: #06b6d4;
            font-size: 40px;
            margin-right: 20px;
            margin-top: 5px;
            font-weight: bold;
        }
        
        .text {
            flex: 1;
            color: #e2e8f0;
            line-height: 1.5;
        }
        
        .presentation-footer {
            position: absolute;
            bottom: 20px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 20px;
            color: #94a3b8;
            border-top: 2px solid rgba(148, 163, 184, 0.3);
            padding-top: 15px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="slide-container">
        <div class="slide-number">${slideNumber}</div>
        <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
        <div class="slide-content">
            ${slideContent}
        </div>
        <div class="presentation-footer">
            ${escapeHtml(presentation.title)} | Slide ${slideNumber} of ${totalSlides} | AI Presentation Platform
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Convert HTML to image buffer using advanced canvas rendering with actual slide content
 */
async function htmlToImage(html: string, width: number, height: number, format: 'png' | 'jpeg'): Promise<Uint8Array> {
    // Create canvas for high-quality slide rendering
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    
    // Set high-quality rendering options
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textBaseline = 'top';
    
    // Create gradient background matching the platform theme
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');  // slate-900
    gradient.addColorStop(0.5, '#581c87'); // purple-800  
    gradient.addColorStop(1, '#0f172a');  // slate-900
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Extract slide data from HTML comment markers (more reliable than HTML parsing)
    const slideData = extractSlideDataFromHTML(html);
    
    // Render slide number badge
    renderSlideNumberBadge(ctx, slideData.slideNumber, width);
    
    // Render slide title with professional typography
    renderSlideTitle(ctx, slideData.title, width, height);
    
    // Render slide content bullets
    renderSlideContent(ctx, slideData.content, width, height);
    
    // Render footer with presentation branding
    renderSlideFooter(ctx, slideData.presentationTitle, slideData.slideNumber, slideData.totalSlides, width, height);
    
    // Convert canvas to blob with high quality
    const blob = await canvas.convertToBlob({ 
        type: format === 'png' ? 'image/png' : 'image/jpeg',
        quality: format === 'jpeg' ? 0.95 : undefined
    });
    
    // Convert blob to Uint8Array
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Extract structured slide data from HTML using regex patterns
 */
function extractSlideDataFromHTML(html: string) {
    // Extract slide number
    const slideNumberMatch = html.match(/<div class="slide-number">(\d+)<\/div>/);
    const slideNumber = slideNumberMatch ? parseInt(slideNumberMatch[1]) : 1;
    
    // Extract slide title
    const titleMatch = html.match(/<h1 class="slide-title">([^<]+)<\/h1>/);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Presentation Slide';
    
    // Extract presentation title from footer
    const presMatch = html.match(/([^|]+) \| Slide \d+ of \d+ \| AI Presentation Platform/);
    const presentationTitle = presMatch ? decodeHtmlEntities(presMatch[1].trim()) : 'AI Presentation';
    
    // Extract total slides
    const totalMatch = html.match(/Slide \d+ of (\d+) \| AI Presentation Platform/);
    const totalSlides = totalMatch ? parseInt(totalMatch[1]) : 1;
    
    // Extract content items
    const contentMatches = html.match(/<span class="text">([^<]+)<\/span>/g) || [];
    const content = contentMatches.map(match => {
        const textMatch = match.match(/<span class="text">([^<]+)<\/span>/);
        return textMatch ? decodeHtmlEntities(textMatch[1]) : '';
    }).filter(text => text.length > 0);
    
    return {
        slideNumber,
        title,
        content,
        presentationTitle,
        totalSlides
    };
}

/**
 * Decode HTML entities to readable text
 */
function decodeHtmlEntities(text: string): string {
    const entityMap: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&#39;': "'"
    };
    
    return text.replace(/&[#a-z0-9]+;/gi, match => entityMap[match] || match);
}

/**
 * Render professional slide number badge
 */
function renderSlideNumberBadge(ctx: OffscreenCanvasRenderingContext2D, slideNumber: number, width: number) {
    const badgeX = width - 80;
    const badgeY = 80;
    const badgeRadius = 30;
    
    // Create gradient for badge
    const badgeGradient = ctx.createLinearGradient(badgeX - badgeRadius, badgeY - badgeRadius, badgeX + badgeRadius, badgeY + badgeRadius);
    badgeGradient.addColorStop(0, '#06b6d4'); // cyan-500
    badgeGradient.addColorStop(1, '#8b5cf6'); // purple-500
    
    // Draw badge circle with shadow effect
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = badgeGradient;
    ctx.fill();
    ctx.restore();
    
    // Draw slide number text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slideNumber.toString(), badgeX, badgeY);
}

/**
 * Render slide title with gradient text effect
 */
function renderSlideTitle(ctx: OffscreenCanvasRenderingContext2D, title: string, width: number, height: number) {
    const titleY = height * 0.25; // 25% from top
    const maxWidth = width * 0.85; // 85% of slide width
    
    // Set font for title
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Handle text wrapping for long titles
    const lines = wrapText(ctx, title, maxWidth, 72);
    const lineHeight = 85;
    const startY = titleY - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        
        // Create gradient for title text
        const titleGradient = ctx.createLinearGradient(0, y - 36, 0, y + 36);
        titleGradient.addColorStop(0, '#06b6d4'); // cyan-500
        titleGradient.addColorStop(1, '#8b5cf6'); // purple-500
        
        ctx.fillStyle = titleGradient;
        ctx.fillText(line, width / 2, y);
    });
}

/**
 * Render slide content with professional bullet points
 */
function renderSlideContent(ctx: OffscreenCanvasRenderingContext2D, content: string[], width: number, height: number) {
    if (content.length === 0) return;
    
    const contentStartY = height * 0.45; // Start at 45% from top
    const maxWidth = width * 0.75; // 75% of slide width
    const leftMargin = width * 0.125; // 12.5% left margin
    const bulletSize = 8;
    const bulletMargin = 25;
    const lineHeight = 45;
    
    ctx.font = '32px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let currentY = contentStartY;
    
    content.forEach((item, index) => {
        // Limit to prevent overflow
        if (currentY > height * 0.8) return;
        
        // Draw bullet point
        ctx.fillStyle = '#06b6d4'; // cyan-500
        ctx.beginPath();
        ctx.arc(leftMargin + bulletSize, currentY + 20, bulletSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw content text with wrapping
        ctx.fillStyle = '#e2e8f0'; // slate-200
        const textX = leftMargin + bulletSize + bulletMargin;
        const textMaxWidth = maxWidth - bulletSize - bulletMargin;
        
        const wrappedLines = wrapText(ctx, item, textMaxWidth, 32);
        wrappedLines.forEach((line, lineIndex) => {
            ctx.fillText(line, textX, currentY + (lineIndex * lineHeight));
        });
        
        currentY += Math.max(lineHeight * wrappedLines.length, lineHeight) + 20;
    });
}

/**
 * Render professional footer with branding
 */
function renderSlideFooter(ctx: OffscreenCanvasRenderingContext2D, presentationTitle: string, slideNumber: number, totalSlides: number, width: number, height: number) {
    const footerY = height - 60;
    const footerHeight = 40;
    
    // Draw footer background with transparency
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // slate-900 with opacity
    ctx.fillRect(40, footerY, width - 80, footerHeight);
    
    // Draw top border
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'; // slate-400 with opacity
    ctx.fillRect(40, footerY, width - 80, 2);
    
    // Footer text
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const footerText = `${presentationTitle} | Slide ${slideNumber} of ${totalSlides} | AI Presentation Platform`;
    const maxFooterWidth = width - 100;
    const footerLines = wrapText(ctx, footerText, maxFooterWidth, 20);
    
    footerLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, footerY + 20 + (index * 22));
    });
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(ctx: OffscreenCanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [text];
}
