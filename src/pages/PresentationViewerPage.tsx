import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Edit3, Play, Maximize2, Share2, Eye, Users } from 'lucide-react';
import { usePresentationStore } from '../store/presentation';
import { useAuthStore } from '../store/auth';
import SlideRenderer from '../components/SlideRenderer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { exportToPDF, exportToPPTX, exportToHTML, downloadPresentation } from '../utils/fileExport';
import { exportPresentationAsImagesWithIframe } from '../utils/workerExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import { 
  CollaborationProvider, 
  CollaborationSidebar,
  CollaborationToolbar,
  CollaborationStatusBadge,
  CollaborativeSlide
} from '../components/collaboration';

// Full Screen Presentation Component
interface FullScreenPresentationProps {
  slides: any[];
  currentSlideIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const FullScreenPresentation: React.FC<FullScreenPresentationProps> = ({
  slides,
  currentSlideIndex,
  onClose,
  onPrevious,
  onNext
}) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentSlideIndex > 0) onPrevious();
          break;
        case 'ArrowRight':
          if (currentSlideIndex < slides.length - 1) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, slides.length, onClose, onPrevious, onNext]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <span className="text-white text-sm">
              {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={currentSlideIndex === 0}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={onNext}
              disabled={currentSlideIndex === slides.length - 1}
              className="text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Main Slide */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-6xl w-full aspect-video">
            <SlideRenderer
              slide={currentSlide}
              className="w-full h-full"
              renderMode="view"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PresentationViewerPage: React.FC = () => {
  const { id: presentationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { presentations, currentPresentation, fetchPresentations } = usePresentationStore();
  const { user, subscription } = useAuthStore();
  
  // Find the current presentation from the presentations list
  const presentation = presentations.find(p => p.id === presentationId) || currentPresentation;
  // Handle both Presentation and GeneratedPresentation types
  const slides = (presentation as any)?.slides || (presentation as any)?.content?.slides || [];

  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollaborationSidebarOpen, setIsCollaborationSidebarOpen] = useState(false);
  const [downloadingItem, setDownloadingItem] = useState<{ id: string; format: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  useEffect(() => {
    if (presentationId && presentations.length === 0) {
      fetchPresentations()
        .then(() => setIsLoading(false))
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [presentationId, fetchPresentations, presentations.length]);
  
  const goToPrevious = useCallback(() => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  }, []);
  
  const goToNext = useCallback(() => {
    setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);
  
  const goBack = () => {
    navigate('/presentations');
  };
  
  const handleDownload = async (format: 'pdf' | 'pptx' | 'html' | 'png' | 'jpeg', id: string, title: string) => {
    const presentation = presentations.find(p => p.id === id) || currentPresentation;
    if (!presentation) {
      toast.error('Presentation not found');
      return;
    }
    
    setDownloadingItem({ id, format });
    
    try {
      // Route PNG/JPEG to Web Worker export, others to regular export
      if (format === 'png' || format === 'jpeg') {
        // Prepare presentation data for Web Worker export
        const exportData = {
          id: presentation.id,
          title: presentation.title || 'Presentation',
          description: presentation.description || '',
          content: {
            slides: (presentation as any).content?.slides || (presentation as any).slides || slides,
            metadata: {
              audience_level: (presentation as any).metadata?.audience_level || 'intermediate',
              presentation_type: (presentation as any).metadata?.presentation_type || 'business',
              tone: (presentation as any).metadata?.tone || 'professional',
              author: 'Slidefast Platform'
            }
          }
        };
        
        await exportPresentationAsImagesWithIframe(exportData, format as 'png' | 'jpeg');
      } else {
        // Use regular export for PDF/PPTX/HTML  
        await downloadPresentation(presentation as any, format, (message) => {
          toast.loading(message);
        });
      }
      
      // Success message handled by export functions
    } catch (error: any) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      toast.error(error.message || `Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloadingItem(null);
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isFullscreen) return; // Full screen component handles its own navigation
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, isFullscreen]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  if (!presentation || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Presentation not found
          </h2>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  const currentSlide = slides[currentSlideIndex];
  
  return (
    <CollaborationProvider 
      presentationId={presentationId || null}
      userTier={(subscription?.ai_present_plans?.plan_type?.toLowerCase() as 'free' | 'team' | 'pro') || 'free'}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {isFullscreen && (
          <FullScreenPresentation
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onClose={() => setIsFullscreen(false)}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
        
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={goBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {presentation.title}
              </h1>
              <Badge variant="secondary" className="text-sm">
                {slides.length} slides
              </Badge>
              <CollaborationStatusBadge presentationId={presentation.id} />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/presentations/${presentationId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
              
              {/* Export Dropdown - Using exact working implementation from Presentations page */}
              <div className="relative">
                <button 
                  onClick={() => setOpenDropdown(openDropdown ? null : 'export')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                  title="Export presentation"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                {openDropdown === 'export' && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-40">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        handleDownload('pdf', presentation.id, presentation.title);
                      }}
                      disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf'}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors rounded-t-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      PDF Document
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        handleDownload('pptx', presentation.id, presentation.title);
                      }}
                      disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx'}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      PowerPoint
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        handleDownload('html', presentation.id, presentation.title);
                      }}
                      disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'html'}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {downloadingItem?.id === presentation.id && downloadingItem.format === 'html' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      Web Page
                    </button>
                    <div className="border-t border-slate-600 my-1"></div>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        handleDownload('png', presentation.id, presentation.title);
                      }}
                      disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'png'}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {downloadingItem?.id === presentation.id && downloadingItem.format === 'png' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      PNG Images
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        handleDownload('jpeg', presentation.id, presentation.title);
                      }}
                      disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg'}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      JPEG Images
                    </button>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Full Screen
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsCollaborationSidebarOpen(!isCollaborationSidebarOpen)}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Collaborate
              </Button>
            </div>
          </div>
          
          {/* Collaboration Toolbar */}
          <CollaborationToolbar
            presentationId={presentation.id}
            onOpenSidebar={() => setIsCollaborationSidebarOpen(true)}
            className="mb-4"
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Main Slide Viewer */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="relative">
                  <CollaborativeSlide
                    slideId={currentSlide.id}
                    className="aspect-video bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border"
                  >
                    <SlideRenderer
                      slide={currentSlide}
                      className="w-full h-full object-contain"
                      renderMode="view"
                    />
                  </CollaborativeSlide>
                  
                  {/* Slide Navigation */}
                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={goToPrevious}
                      disabled={currentSlideIndex === 0}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Slide {currentSlideIndex + 1} of {slides.length}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={goToNext}
                      disabled={currentSlideIndex === slides.length - 1}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Slide Thumbnails */}
            <div className="lg:w-64">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Slides
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        index === currentSlideIndex
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-2 overflow-hidden">
                        <SlideRenderer
                          slide={slide}
                          className="w-full h-full object-contain"
                          renderMode="thumbnail"
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Slide {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collaboration Sidebar */}
        <CollaborationSidebar
          presentationId={presentation.id}
          isOpen={isCollaborationSidebarOpen}
          onClose={() => setIsCollaborationSidebarOpen(false)}
        />
      </div>
    </CollaborationProvider>
  );
};

export default PresentationViewerPage;
