import React from 'react';
import { CheckCircle, ArrowRight, Star, TrendingUp, Users, Target, Lightbulb, BarChart3 } from 'lucide-react';

interface SlideRendererProps {
  slide: any;
  className?: string;
  renderMode?: 'view' | 'edit' | 'thumbnail';
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className, renderMode = 'view' }) => {
  if (!slide) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 ${className || ''}`}>
        <div className="text-center p-8">
          <div className="text-slate-400">No slide content</div>
        </div>
      </div>
    );
  }

  const layout = slide.layout || 'title_and_bullets';
  const isThumbnail = renderMode === 'thumbnail';
  const isEdit = renderMode === 'edit';

  // Professional color scheme
  const getLayoutClasses = () => {
    if (isThumbnail) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-100';
    }
    return 'bg-gradient-to-br from-white to-slate-50';
  };

  // Format content items with rich formatting
  const formatContent = (content: string | string[]) => {
    if (!content) return [];
    
    const contentArray = Array.isArray(content) ? content : [content];
    return contentArray.filter(item => item && item.trim() !== '');
  };

  // Render bullet points with professional styling
  const renderBulletPoint = (item: string, index: number) => {
    const iconSize = isThumbnail ? 'h-2 w-2' : 'h-4 w-4';
    const textSize = isThumbnail ? 'text-xs' : 'text-base';
    const spacing = isThumbnail ? 'mb-1' : 'mb-3';
    
    // Choose different icons for variety
    const icons = [CheckCircle, ArrowRight, Star, TrendingUp];
    const IconComponent = icons[index % icons.length];
    
    return (
      <div key={index} className={`flex items-start space-x-2 ${spacing}`}>
        <IconComponent className={`${iconSize} text-blue-600 mt-1 flex-shrink-0`} />
        <span className={`${textSize} text-slate-700 leading-relaxed`}>
          {item}
        </span>
      </div>
    );
  };

  // Render different layout types
  const renderSlideContent = () => {
    const title = slide.title || 'Untitled Slide';
    const content = formatContent(slide.content);
    const speakerNotes = slide.speaker_notes;
    const visualSuggestion = slide.visual_suggestion;

    const titleSize = isThumbnail ? 'text-sm' : 'text-3xl';
    const contentSize = isThumbnail ? 'text-xs' : 'text-lg';
    const padding = isThumbnail ? 'p-3' : 'p-8';
    const spacing = isThumbnail ? 'space-y-2' : 'space-y-6';

    switch (layout) {
      case 'title_only':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${padding}`}>
            <h1 className={`${titleSize} font-bold text-slate-800 text-center leading-tight`}>
              {title}
            </h1>
            {!isThumbnail && (
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            )}
          </div>
        );

      case 'image_focus':
        return (
          <div className={`flex flex-col ${padding} ${spacing}`}>
            <h2 className={`${titleSize} font-bold text-slate-800 mb-4`}>
              {title}
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <div className={`${isThumbnail ? 'w-16 h-12' : 'w-64 h-48'} bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300`}>
                <div className="text-center">
                  <div className={`${isThumbnail ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>
                    {visualSuggestion || 'Image Placeholder'}
                  </div>
                </div>
              </div>
            </div>
            {content.length > 0 && (
              <div className="mt-4">
                {content.map((item, index) => renderBulletPoint(item, index))}
              </div>
            )}
          </div>
        );

      case 'comparison':
        const halfContent = Math.ceil(content.length / 2);
        const leftContent = content.slice(0, halfContent);
        const rightContent = content.slice(halfContent);
        
        return (
          <div className={`${padding} ${spacing}`}>
            <h2 className={`${titleSize} font-bold text-slate-800 text-center mb-6`}>
              {title}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className={`${contentSize} font-semibold text-blue-600`}>Option A</h3>
                {leftContent.map((item, index) => renderBulletPoint(item, index))}
              </div>
              <div className="space-y-3">
                <h3 className={`${contentSize} font-semibold text-purple-600`}>Option B</h3>
                {rightContent.map((item, index) => renderBulletPoint(item, index))}
              </div>
            </div>
          </div>
        );

      case 'conclusion':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${padding} text-center`}>
            <Target className={`${isThumbnail ? 'h-6 w-6' : 'h-16 w-16'} text-blue-600 mb-4`} />
            <h1 className={`${titleSize} font-bold text-slate-800 mb-6`}>
              {title}
            </h1>
            <div className={`${spacing} max-w-3xl`}>
              {content.map((item, index) => (
                <div key={index} className={`${contentSize} text-slate-700 leading-relaxed`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        );

      default: // 'title_and_bullets'
        return (
          <div className={`${padding} ${spacing}`}>
            {/* Title Section */}
            <div className="mb-6">
              <h1 className={`${titleSize} font-bold text-slate-800 leading-tight`}>
                {title}
              </h1>
              {!isThumbnail && (
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              )}
            </div>
            
            {/* Content Section */}
            {content.length > 0 && (
              <div className="space-y-3">
                {content.map((item, index) => renderBulletPoint(item, index))}
              </div>
            )}
            
            {/* Visual Suggestion Area */}
            {visualSuggestion && !isThumbnail && (
              <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Visual Suggestion</h4>
                    <p className="text-sm text-blue-700">{visualSuggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`${getLayoutClasses()} border border-slate-200 shadow-sm ${className || ''} overflow-hidden`}>
      {renderSlideContent()}
      
      {/* Slide number for thumbnails */}
      {isThumbnail && (
        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          {slide.id}
        </div>
      )}
    </div>
  );
};

export default SlideRenderer;
