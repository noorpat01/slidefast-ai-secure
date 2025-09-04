import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  Link as LinkIcon, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Chrome,
  ExternalLink,
  Zap,
  ArrowRight,
  Globe
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ChromeIntegrationProps {
  onPresentationImported?: (presentationId: string) => void;
  onPresentationExported?: (exportUrl: string) => void;
  className?: string;
}

interface ChromeAuthState {
  isAuthenticated: boolean;
  user?: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken?: string;
}

interface ChromeSlide {
  id: string;
  title: string;
  notes?: string;
  elements: Array<{
    type: 'text' | 'image' | 'shape';
    content: string;
    position: { x: number; y: number; width: number; height: number };
    style?: Record<string, any>;
  }>;
}

interface ChromePresentation {
  id: string;
  title: string;
  slides: ChromeSlide[];
  metadata: {
    createdAt: string;
    modifiedAt: string;
    size: string;
    slideCount: number;
  };
}

export const ChromeIntegration: React.FC<ChromeIntegrationProps> = ({
  onPresentationImported,
  onPresentationExported,
  className = ''
}) => {
  const [authState, setAuthState] = useState<ChromeAuthState>({ isAuthenticated: false });
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [googlePresentations, setChromePresentations] = useState<ChromePresentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<string>('');
  const [importUrl, setImportUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chrome API
  const initializeChromeAPI = useCallback(async () => {
    try {
      // Load Chrome API script if not already loaded
      if (!window.gapi) {
        await loadChromeAPI();
      }

      await window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        });
      });

      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          discoveryDocs: [
            'https://slides.googleapis.com/$discovery/rest?version=v1',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
          ],
          scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file'
        });
      });

      // Check if already authenticated
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        const profile = user.getBasicProfile();
        setAuthState({
          isAuthenticated: true,
          user: {
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl()
          },
          accessToken: user.getAuthResponse().access_token
        });
      }
    } catch (error) {
      console.error('Failed to initialize Chrome API:', error);
      toast.error('Failed to connect to Chrome Slides');
    }
  }, []);

  React.useEffect(() => {
    initializeChromeAPI();
  }, [initializeChromeAPI]);

  const loadChromeAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Chrome API'));
      document.head.appendChild(script);
    });
  };

  const handleChromeSignIn = async () => {
    try {
      setLoading(true);
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      const profile = user.getBasicProfile();
      
      setAuthState({
        isAuthenticated: true,
        user: {
          email: profile.getEmail(),
          name: profile.getName(),
          picture: profile.getImageUrl()
        },
        accessToken: user.getAuthResponse().access_token
      });
      
      toast.success('Successfully connected to Chrome Slides!');
    } catch (error) {
      console.error('Chrome sign-in failed:', error);
      toast.error('Failed to connect to Chrome account');
    } finally {
      setLoading(false);
    }
  };

  const handleChromeSignOut = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setAuthState({ isAuthenticated: false });
      setChromePresentations([]);
      toast.success('Disconnected from Chrome account');
    } catch (error) {
      console.error('Chrome sign-out failed:', error);
      toast.error('Failed to disconnect from Chrome account');
    }
  };

  const loadChromePresentations = async () => {
    if (!authState.isAuthenticated) return;

    try {
      setLoading(true);
      const response = await window.gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.presentation'",
        pageSize: 20,
        fields: 'files(id,name,createdTime,modifiedTime,size)'
      });

      const presentations: ChromePresentation[] = [];
      
      for (const file of response.result.files) {
        try {
          const presentation = await window.gapi.client.slides.presentations.get({
            presentationId: file.id
          });
          
          presentations.push({
            id: file.id,
            title: file.name,
            slides: presentation.result.slides?.map((slide: any) => ({
              id: slide.objectId,
              title: extractSlideTitle(slide),
              notes: slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId,
              elements: extractSlideElements(slide)
            })) || [],
            metadata: {
              createdAt: file.createdTime,
              modifiedAt: file.modifiedTime,
              size: file.size || '0',
              slideCount: presentation.result.slides?.length || 0
            }
          });
        } catch (error) {
          console.warn(`Failed to load details for presentation ${file.id}:`, error);
        }
      }

      setChromePresentations(presentations);
    } catch (error) {
      console.error('Failed to load Chrome presentations:', error);
      toast.error('Failed to load Chrome Slides presentations');
    } finally {
      setLoading(false);
    }
  };

  const extractSlideTitle = (slide: any): string => {
    const titlePlaceholder = slide.pageElements?.find((element: any) => 
      element.shape?.placeholder?.type === 'TITLE'
    );
    
    if (titlePlaceholder?.shape?.text?.textElements) {
      return titlePlaceholder.shape.text.textElements
        .map((el: any) => el.textRun?.content || '')
        .join('')
        .trim();
    }
    
    return `Slide ${slide.objectId?.slice(-4) || 'Unknown'}`;
  };

  const extractSlideElements = (slide: any): ChromeSlide['elements'] => {
    if (!slide.pageElements) return [];

    return slide.pageElements.map((element: any) => {
      const transform = element.transform;
      const position = {
        x: transform?.translateX || 0,
        y: transform?.translateY || 0,
        width: transform?.scaleX || 100,
        height: transform?.scaleY || 100
      };

      if (element.shape?.text) {
        const content = element.shape.text.textElements
          ?.map((el: any) => el.textRun?.content || '')
          .join('')
          .trim() || '';
          
        return {
          type: 'text' as const,
          content,
          position,
          style: element.shape.shapeProperties
        };
      }

      if (element.image) {
        return {
          type: 'image' as const,
          content: element.image.contentUrl || '',
          position,
          style: element.image.imageProperties
        };
      }

      return {
        type: 'shape' as const,
        content: '',
        position,
        style: element.shape?.shapeProperties
      };
    }).filter(el => el.content || el.type !== 'text');
  };

  const importFromChromeSlides = async (presentationId?: string) => {
    if (!authState.isAuthenticated) {
      toast.error('Please connect to Chrome account first');
      return;
    }

    const targetId = presentationId || selectedPresentation;
    if (!targetId) {
      toast.error('Please select a presentation to import');
      return;
    }

    try {
      setImportProgress(10);
      
      // Get presentation details from Chrome
      const googlePresentation = googlePresentations.find(p => p.id === targetId);
      if (!googlePresentation) {
        throw new Error('Presentation not found');
      }

      setImportProgress(30);

      // Convert Chrome Slides format to our format
      const convertedSlides = googlePresentation.slides.map((slide, index) => ({
        id: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        content: slide.elements
          .filter(el => el.type === 'text' && el.content)
          .map(el => el.content),
        visual_suggestion: `Imported from Chrome Slides: ${slide.elements.length} elements`,
        speaker_notes: slide.notes || '',
        layout: 'title_and_bullets'
      }));

      setImportProgress(60);

      // Save to our database
      const { data, error } = await supabase.functions.invoke('import-google-presentation', {
        body: {
          googlePresentationId: targetId,
          title: googlePresentation.title,
          description: `Imported from Chrome Slides on ${new Date().toLocaleDateString()}`,
          slides: convertedSlides,
          metadata: {
            source: 'google_slides',
            originalId: targetId,
            importedAt: new Date().toISOString(),
            ...googlePresentation.metadata
          }
        }
      });

      if (error) throw error;

      setImportProgress(100);
      toast.success(`Successfully imported "${googlePresentation.title}"`);
      onPresentationImported?.(data.presentationId);
      
      // Reset progress after a delay
      setTimeout(() => setImportProgress(0), 2000);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import presentation from Chrome Slides');
      setImportProgress(0);
    }
  };

  const importFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a Chrome Slides URL');
      return;
    }

    // Extract presentation ID from URL
    const match = importUrl.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      toast.error('Invalid Chrome Slides URL format');
      return;
    }

    const presentationId = match[1];
    await importFromChromeSlides(presentationId);
  };

  const exportToChromeSlides = async (localPresentationId: string) => {
    if (!authState.isAuthenticated) {
      toast.error('Please connect to Chrome account first');
      return;
    }

    try {
      setExportProgress(10);
      
      // Get local presentation data
      const { data: presentation, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', localPresentationId)
        .single();

      if (error) throw error;

      setExportProgress(30);

      // Create new Chrome Slides presentation
      const createResponse = await window.gapi.client.slides.presentations.create({
        title: presentation.title
      });

      const googlePresentationId = createResponse.result.presentationId;
      setExportProgress(50);

      // Convert our slides to Chrome Slides format
      const slides = presentation.content?.slides || [];
      const requests = [];

      // Remove the default slide if we have content
      if (slides.length > 0) {
        requests.push({
          deleteObject: {
            objectId: createResponse.result.slides[0].objectId
          }
        });
      }

      // Add our slides
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideId = `slide_${i}`;
        
        // Create slide
        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: {
              predefinedLayout: 'TITLE_AND_BODY'
            },
            placeholderIdMappings: [{
              layoutPlaceholder: {
                type: 'TITLE'
              },
              objectId: `${slideId}_title`
            }, {
              layoutPlaceholder: {
                type: 'BODY'
              },
              objectId: `${slideId}_body`
            }]
          }
        });

        // Add title
        requests.push({
          insertText: {
            objectId: `${slideId}_title`,
            text: slide.title || `Slide ${i + 1}`
          }
        });

        // Add content
        if (slide.content && slide.content.length > 0) {
          const bodyText = slide.content.join('\n• ');
          requests.push({
            insertText: {
              objectId: `${slideId}_body`,
              text: `• ${bodyText}`
            }
          });
        }

        // Add speaker notes if available
        if (slide.speaker_notes) {
          requests.push({
            createShape: {
              objectId: `${slideId}_notes`,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  height: { magnitude: 50, unit: 'PT' },
                  width: { magnitude: 400, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 50,
                  translateY: 400,
                  unit: 'PT'
                }
              }
            }
          });
          
          requests.push({
            insertText: {
              objectId: `${slideId}_notes`,
              text: `Speaker Notes: ${slide.speaker_notes}`
            }
          });
        }
      }

      setExportProgress(70);

      // Execute all requests
      if (requests.length > 0) {
        await window.gapi.client.slides.presentations.batchUpdate({
          presentationId: googlePresentationId,
          requests
        });
      }

      setExportProgress(90);

      // Save export record
      await supabase.functions.invoke('track-google-export', {
        body: {
          localPresentationId,
          googlePresentationId,
          exportedAt: new Date().toISOString()
        }
      });

      setExportProgress(100);
      
      const exportUrl = `https://docs.google.com/presentation/d/${googlePresentationId}/edit`;
      toast.success('Successfully exported to Chrome Slides!');
      onPresentationExported?.(exportUrl);
      
      // Open in new tab
      window.open(exportUrl, '_blank');
      
      // Reset progress after a delay
      setTimeout(() => setExportProgress(0), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export to Chrome Slides');
      setExportProgress(0);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Chrome className="h-8 w-8 text-blue-500 mr-3" />
          <h2 className="text-2xl font-bold text-white">Chrome Slides Integration</h2>
        </div>
        <p className="text-slate-400">
          Import presentations from Chrome Slides or export your creations back to Chrome
        </p>
      </div>

      {/* Authentication */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Chrome className="h-5 w-5 mr-2 text-blue-500" />
            Chrome Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authState.isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={authState.user?.picture} 
                  alt={authState.user?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{authState.user?.name}</p>
                  <p className="text-slate-400 text-sm">{authState.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleChromeSignOut}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <Chrome className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Not connected</p>
                  <p className="text-slate-400 text-sm">Connect to access Chrome Slides</p>
                </div>
              </div>
              <Button 
                onClick={handleChromeSignIn}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Chrome className="h-4 w-4 mr-2" />
                )}
                Connect to Chrome
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Actions */}
      {authState.isAuthenticated && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import from Chrome Slides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import from URL */}
              <div className="space-y-3">
                <Label className="text-slate-300">Import from URL</Label>
                <div className="flex space-x-2">
                  <Input
                    type="url"
                    placeholder="Paste Chrome Slides URL here..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                  <Button 
                    onClick={importFromUrl}
                    disabled={!importUrl.trim() || importProgress > 0}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Import from Library */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Your Chrome Slides</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadChromePresentations}
                    disabled={loading}
                    className="text-slate-400 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {googlePresentations.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedPresentation}
                      onChange={(e) => setSelectedPresentation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white"
                    >
                      <option value="">Select a presentation...</option>
                      {googlePresentations.map((presentation) => (
                        <option key={presentation.id} value={presentation.id}>
                          {presentation.title} ({presentation.metadata.slideCount} slides)
                        </option>
                      ))}
                    </select>
                    <Button 
                      onClick={() => importFromChromeSlides()}
                      disabled={!selectedPresentation || importProgress > 0}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      {importProgress > 0 ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Import Presentation
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={loadChromePresentations}
                    disabled={loading}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Load Your Presentations
                  </Button>
                )}
              </div>

              {/* Import Progress */}
              {importProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Importing...</span>
                    <span className="text-slate-300">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export to Chrome Slides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Export Any Presentation</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Go to any presentation and use the "Export" menu to send it directly to Chrome Slides
                </p>
                <a href="/presentations" className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Presentations
                </a>
              </div>

              {/* Export Progress */}
              {exportProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Exporting...</span>
                    <span className="text-slate-300">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Seamless Import</h3>
          <p className="text-slate-400 text-sm">
            Import presentations directly from Chrome Slides with all formatting preserved
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Download className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Smart Export</h3>
          <p className="text-slate-400 text-sm">
            Export your presentations to Chrome Slides with intelligent layout conversion
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Globe className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Universal Access</h3>
          <p className="text-slate-400 text-sm">
            Work across platforms with full synchronization between our editor and Chrome Slides
          </p>
        </div>
      </div>
    </div>
  );
};

// Extend window type for Chrome APIs
declare global {
  interface Window {
    gapi: any;
  }
}

export default ChromeIntegration;
