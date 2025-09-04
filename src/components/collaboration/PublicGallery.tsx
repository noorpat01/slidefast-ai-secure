import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Filter, 
  Eye, 
  Heart, 
  Download, 
  Star,
  TrendingUp,
  Clock,
  User,
  Globe,
  Sparkles,
  Award
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface PublicPresentation {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  view_count: number;
  like_count: number;
  download_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  category: string;
  tags: string[];
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  content: {
    slides: any[];
    metadata?: any;
  };
}

interface PublicGalleryProps {
  className?: string;
}

const CATEGORIES = [
  'All',
  'Business',
  'Education',
  'Technology', 
  'Marketing',
  'Science',
  'Design',
  'Healthcare',
  'Finance',
  'Other'
];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'most-downloaded', label: 'Most Downloaded' }
];

export const PublicGallery: React.FC<PublicGalleryProps> = ({ className = '' }) => {
  const [presentations, setPresentations] = useState<PublicPresentation[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<PublicPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [featuredPresentations, setFeaturedPresentations] = useState<PublicPresentation[]>([]);

  useEffect(() => {
    loadPublicPresentations();
  }, []);

  useEffect(() => {
    filterAndSortPresentations();
  }, [presentations, searchQuery, selectedCategory, sortBy]);

  const loadPublicPresentations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('public_gallery')
        .select(`
          *,
          user:users(id, full_name, avatar_url),
          presentation:presentations(id, title, description, content)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPresentations = data.map(item => ({
        ...item.presentation,
        ...item,
        user: item.user
      })) as PublicPresentation[];

      setPresentations(formattedPresentations);
      setFeaturedPresentations(formattedPresentations.filter(p => p.is_featured).slice(0, 6));
    } catch (error) {
      console.error('Error loading public presentations:', error);
      toast.error('Failed to load public gallery');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPresentations = () => {
    let filtered = [...presentations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query)) ||
        p.user.full_name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'highest-rated':
        filtered.sort((a, b) => b.rating_average - a.rating_average);
        break;
      case 'most-downloaded':
        filtered.sort((a, b) => b.download_count - a.download_count);
        break;
      case 'trending':
      default:
        // Trending algorithm: combines recent activity with popularity
        filtered.sort((a, b) => {
          const aScore = calculateTrendingScore(a);
          const bScore = calculateTrendingScore(b);
          return bScore - aScore;
        });
        break;
    }

    setFilteredPresentations(filtered);
  };

  const calculateTrendingScore = (presentation: PublicPresentation): number => {
    const now = new Date().getTime();
    const createdAt = new Date(presentation.created_at).getTime();
    const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    // Decay factor: newer presentations get higher scores
    const recencyScore = Math.max(0, 30 - daysSinceCreated) / 30;
    
    // Popularity score
    const popularityScore = (
      presentation.view_count * 1 +
      presentation.like_count * 5 +
      presentation.download_count * 3 +
      presentation.rating_average * 2
    );
    
    // Featured presentations get a boost
    const featuredBoost = presentation.is_featured ? 50 : 0;
    
    return (recencyScore * 100 + popularityScore + featuredBoost);
  };

  const handleLike = async (presentationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('toggle-presentation-like', {
        body: { presentationId }
      });
      
      if (error) throw error;
      
      // Update local state
      setPresentations(prev => prev.map(p => 
        p.id === presentationId 
          ? { ...p, like_count: p.like_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error liking presentation:', error);
      toast.error('Failed to like presentation');
    }
  };

  const handleDownload = async (presentationId: string, format: string) => {
    try {
      // Track download
      await supabase.functions.invoke('track-presentation-download', {
        body: { presentationId, format }
      });
      
      // Update local state
      setPresentations(prev => prev.map(p => 
        p.id === presentationId 
          ? { ...p, download_count: p.download_count + 1 }
          : p
      ));
      
      // Trigger actual download
      window.open(`/api/presentations/${presentationId}/download/${format}`, '_blank');
    } catch (error) {
      console.error('Error downloading presentation:', error);
      toast.error('Failed to download presentation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-2xl border border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center mb-4">
            <Globe className="h-8 w-8 text-cyan-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Public Gallery</h1>
          </div>
          <p className="text-xl text-slate-300 mb-6">
            Discover amazing presentations created by our community
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>{presentations.length} Presentations</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{new Set(presentations.map(p => p.user.id)).size} Creators</span>
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              <span>{featuredPresentations.length} Featured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Presentations */}
      {featuredPresentations.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <Award className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">Featured Presentations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPresentations.map((presentation) => (
              <FeaturedPresentationCard
                key={presentation.id}
                presentation={presentation}
                onLike={handleLike}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search presentations, creators, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {searchQuery || selectedCategory !== 'All' 
              ? `${filteredPresentations.length} Results` 
              : 'All Presentations'
            }
          </h2>
          {sortBy === 'trending' && (
            <div className="flex items-center text-sm text-slate-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Trending Now</span>
            </div>
          )}
        </div>

        {filteredPresentations.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-slate-400">Try adjusting your search criteria or browse all presentations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPresentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                onLike={handleLike}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Featured Presentation Card Component
const FeaturedPresentationCard: React.FC<{
  presentation: PublicPresentation;
  onLike: (id: string) => void;
  onDownload: (id: string, format: string) => void;
}> = ({ presentation, onLike, onDownload }) => {
  return (
    <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            Featured
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{presentation.rating_average.toFixed(1)}</span>
          </div>
        </div>
        <CardTitle className="text-white text-lg leading-tight">
          {presentation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm line-clamp-3">
          {presentation.description}
        </p>
        
        <div className="flex items-center space-x-2">
          <img 
            src={presentation.user.avatar_url || '/default-avatar.png'} 
            alt={presentation.user.full_name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-slate-400">{presentation.user.full_name}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {presentation.view_count}
            </span>
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {presentation.like_count}
            </span>
            <span className="flex items-center">
              <Download className="h-3 w-3 mr-1" />
              {presentation.download_count}
            </span>
          </div>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(presentation.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            to={`/presentations/${presentation.id}/view`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white transition-colors"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLike(presentation.id)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Heart className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Regular Presentation Card Component
const PresentationCard: React.FC<{
  presentation: PublicPresentation;
  onLike: (id: string) => void;
  onDownload: (id: string, format: string) => void;
}> = ({ presentation, onLike, onDownload }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
            {presentation.category}
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{presentation.rating_average.toFixed(1)}</span>
          </div>
        </div>
        <CardTitle className="text-white text-base leading-tight">
          {presentation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-slate-300 text-sm line-clamp-2">
          {presentation.description}
        </p>
        
        <div className="flex items-center space-x-2">
          <img 
            src={presentation.user.avatar_url || '/default-avatar.png'} 
            alt={presentation.user.full_name}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs text-slate-400 truncate">{presentation.user.full_name}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {presentation.view_count}
            </span>
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {presentation.like_count}
            </span>
          </div>
          <span>{new Date(presentation.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            to={`/presentations/${presentation.id}/view`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLike(presentation.id)}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Heart className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicGallery;
