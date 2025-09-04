import React, { useEffect, useState, useCallback } from 'react'
import { usePresentationStore } from '../store/presentation'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Clock, 
  FileText, 
  MoreHorizontal,
  Calendar,
  Folder
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { downloadPresentation } from '../utils/fileExport'
import { exportPresentationAsImagesWithIframe } from '../utils/workerExport'
import toast from 'react-hot-toast'

export const PresentationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { presentations, loading, fetchPresentations, deletePresentation } = usePresentationStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'status'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [downloadingItem, setDownloadingItem] = useState<{ id: string; format: string } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchPresentations()
  }, [fetchPresentations])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])



  // Stable navigation handlers
  const handleViewPresentation = useCallback((id: string) => {
    console.log('👁️ Navigating to view presentation:', id)
    navigate(`/presentations/${id}/view`)
  }, [navigate])

  const handleEditPresentation = useCallback((id: string) => {
    console.log('✏️ Navigating to edit presentation:', id)
    navigate(`/presentations/${id}/edit`)
  }, [navigate])

  const filteredPresentations = presentations
    .filter(presentation => {
      const matchesSearch = presentation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (presentation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesFilter = filterStatus === 'all' || presentation.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this presentation?')) {
      await deletePresentation(id)
    }
  }

  const handleDownload = async (id: string, title: string, format: 'pdf' | 'pptx' | 'html' | 'png' | 'jpeg') => {
    const presentation = presentations.find(p => p.id === id)
    if (!presentation) {
      toast.error('Presentation not found')
      return
    }
    
    setDownloadingItem({ id, format })
    
    try {
      // Route PNG/JPEG to Web Worker export, others to regular export
      if (format === 'png' || format === 'jpeg') {
        // Prepare presentation data for Web Worker export
        const exportData = {
          id: presentation.id,
          title: presentation.title || 'Presentation',
          description: presentation.description || '',
          content: {
            slides: (presentation as any).content?.slides || (presentation as any).slides || [],
            metadata: {
              audience_level: (presentation as any).metadata?.audience_level || 'intermediate',
              presentation_type: (presentation as any).metadata?.presentation_type || 'business',
              tone: (presentation as any).metadata?.tone || 'professional',
              author: 'Slidefast Platform'
            }
          }
        }
        
        await exportPresentationAsImagesWithIframe(exportData, format as 'png' | 'jpeg')
      } else {
        // Use regular export for PDF/PPTX/HTML
        await downloadPresentation(presentation, format, (message) => {
          toast.loading(message)
        })
      }
      
      // Success message handled by export functions
    } catch (error: any) {
      console.error(`${format.toUpperCase()} export failed:`, error)
      toast.error(error.message || `Failed to download ${format.toUpperCase()}`)
    } finally {
      setDownloadingItem(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400'
      case 'draft': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get audience level badge color
  const getAudienceLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'phd': case 'expert': return 'bg-purple-500/20 text-purple-400'
      case 'professional': case 'intermediate': return 'bg-blue-500/20 text-blue-400'
      case 'beginner': case 'general': return 'bg-green-500/20 text-green-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  // Get slide count from presentation content
  const getSlideCount = (presentation: any) => {
    return presentation.content?.slides?.length || 0
  }

  // Get audience level from metadata
  const getAudienceLevel = (presentation: any) => {
    return presentation.content?.metadata?.audience_level || 'General'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Presentations</h1>
          <p className="text-slate-300">
            Manage and organize your AI-generated presentations
          </p>
        </div>
        <Link
          to="/generate"
          className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Presentation
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search presentations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'published')}
            className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'status')}
            className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="recent">Most Recent</option>
            <option value="title">Title A-Z</option>
            <option value="status">Status</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-900/50 text-slate-400 hover:text-white'
              }`}
            >
              <Folder className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors border-l border-slate-600 ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-900/50 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredPresentations.length === 0 ? (
        <div className="text-center py-20">
          {presentations.length === 0 ? (
            // No presentations at all
            <>
              <FileText className="h-20 w-20 text-slate-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-slate-300 mb-4">No presentations yet</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Create your first AI-powered presentation to get started. Choose from various templates and let our AI generate professional content for you.
              </p>
              <Link
                to="/generate"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Presentation
              </Link>
            </>
          ) : (
            // No search results
            <>
              <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No matching presentations</h3>
              <p className="text-slate-400">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </>
          )}
        </div>
      ) : (
        /* Presentations Grid/List */
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredPresentations.map((presentation, index) => (
            <div
              key={presentation.id}
              className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl transition-all duration-200 hover:border-cyan-500/30 relative ${
                viewMode === 'grid' ? 'p-6' : 'p-4'
              }`}
            >
              {/* Presentation Number Badge */}
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                #{index + 1}
              </div>
              
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {presentation.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-3 mb-3">
                        {presentation.description || 'No description available'}
                      </p>
                    </div>
                    <div className="relative ml-2">
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhanced Metadata Row */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center text-slate-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(presentation.created_at)}
                      </span>
                      <span className="flex items-center text-slate-500">
                        <FileText className="h-3 w-3 mr-1" />
                        {getSlideCount(presentation)} slides
                      </span>
                    </div>
                  </div>
                  
                  {/* Status and Audience Level Badges */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(presentation.status)}`}>
                      {presentation.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAudienceLevelColor(getAudienceLevel(presentation))}`}>
                      {getAudienceLevel(presentation)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewPresentation(presentation.id)}
                      className="flex-1 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleEditPresentation(presentation.id)}
                      className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors flex items-center justify-center"
                      title="Edit presentation"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Download Buttons Row */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => handleDownload(presentation.id, presentation.title, 'pdf')}
                        disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf'}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Download as PDF"
                      >
                        {downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownload(presentation.id, presentation.title, 'pptx')}
                        disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx'}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Download as PowerPoint"
                      >
                        {downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        PPTX
                      </button>
                      <button
                        onClick={() => handleDownload(presentation.id, presentation.title, 'html')}
                        disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'html'}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Download as HTML"
                      >
                        {downloadingItem?.id === presentation.id && downloadingItem.format === 'html' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        HTML
                      </button>
                      <button
                        onClick={() => handleDownload(presentation.id, presentation.title, 'png')}
                        disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'png'}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Download as PNG Images"
                      >
                        {downloadingItem?.id === presentation.id && downloadingItem.format === 'png' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        PNG
                      </button>
                      <button
                        onClick={() => handleDownload(presentation.id, presentation.title, 'jpeg')}
                        disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg'}
                        className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Download as JPEG Images"
                      >
                        {downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        JPEG
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDelete(presentation.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center"
                      title="Delete presentation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                // List View
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate mb-1">
                        {presentation.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center text-slate-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(presentation.created_at)}
                        </span>
                        <span className="flex items-center text-slate-500">
                          <FileText className="h-3 w-3 mr-1" />
                          {getSlideCount(presentation)} slides
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(presentation.status)}`}>
                          {presentation.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAudienceLevelColor(getAudienceLevel(presentation))}`}>
                          {getAudienceLevel(presentation)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewPresentation(presentation.id)}
                      className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleEditPresentation(presentation.id)}
                      className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                      title="Edit presentation"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    {/* Download Menu */}
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === presentation.id ? null : presentation.id)}
                        className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors flex items-center"
                        title="Download presentation"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      {openDropdown === presentation.id && (
                        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-40">
                          <button
                            onClick={() => {
                              setOpenDropdown(null)
                              handleDownload(presentation.id, presentation.title, 'pdf')
                            }}
                            disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf'}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors rounded-t-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {downloadingItem?.id === presentation.id && downloadingItem.format === 'pdf' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            PDF
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null)
                              handleDownload(presentation.id, presentation.title, 'pptx')
                            }}
                            disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx'}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {downloadingItem?.id === presentation.id && downloadingItem.format === 'pptx' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            PowerPoint
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null)
                              handleDownload(presentation.id, presentation.title, 'html')
                            }}
                            disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'html'}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {downloadingItem?.id === presentation.id && downloadingItem.format === 'html' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            HTML
                          </button>
                          <div className="border-t border-slate-600 my-1"></div>
                          <button
                            onClick={() => {
                              setOpenDropdown(null)
                              handleDownload(presentation.id, presentation.title, 'png')
                            }}
                            disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'png'}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {downloadingItem?.id === presentation.id && downloadingItem.format === 'png' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            PNG Images
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null)
                              handleDownload(presentation.id, presentation.title, 'jpeg')
                            }}
                            disabled={downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg'}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {downloadingItem?.id === presentation.id && downloadingItem.format === 'jpeg' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            JPEG Images
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDelete(presentation.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete presentation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}