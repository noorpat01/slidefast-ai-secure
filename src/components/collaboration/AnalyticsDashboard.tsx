import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Download,
  Heart,
  MessageCircle,
  Globe,
  Clock,
  Activity,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Utility function for formatting numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalDownloads: number;
    totalLikes: number;
    totalComments: number;
    uniqueViewers: number;
    engagementRate: number;
    avgViewDuration: number;
    conversionRate: number;
  };
  viewsOverTime: Array<{
    date: string;
    views: number;
    downloads: number;
    likes: number;
  }>;
  geographicData: Array<{
    country: string;
    views: number;
    percentage: number;
  }>;
  deviceData: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  topPresentations: Array<{
    id: string;
    title: string;
    views: number;
    downloads: number;
    likes: number;
    engagementRate: number;
  }>;
  audienceInsights: {
    peakHours: Array<{ hour: number; activity: number }>;
    retentionRate: Array<{ slide: number; retention: number }>;
    referralSources: Array<{ source: string; visits: number; percentage: number }>;
  };
}

interface AnalyticsDashboardProps {
  presentationId?: string; // If provided, show analytics for specific presentation
  className?: string;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  presentationId, 
  className = '' 
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [presentationId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: {
          presentationId,
          timeRange,
          includeGeographic: true,
          includeDeviceData: true,
          includeAudienceInsights: true
        }
      });

      if (error) throw error;

      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data</h3>
        <p className="text-slate-400">Analytics data is not available for this presentation.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {presentationId ? 'Presentation Analytics' : 'Analytics Dashboard'}
          </h1>
          <p className="text-slate-400">
            {presentationId 
              ? 'Detailed insights for your presentation performance'
              : 'Comprehensive overview of all your presentations'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range === '7d' && 'Last 7 days'}
              {range === '30d' && 'Last 30 days'}
              {range === '90d' && 'Last 90 days'}
              {range === '1y' && 'Last year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Views"
          value={analytics.overview.totalViews}
          icon={<Eye className="h-5 w-5" />}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        <OverviewCard
          title="Downloads"
          value={analytics.overview.totalDownloads}
          icon={<Download className="h-5 w-5" />}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <OverviewCard
          title="Unique Viewers"
          value={analytics.overview.uniqueViewers}
          icon={<Users className="h-5 w-5" />}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <OverviewCard
          title="Engagement Rate"
          value={`${analytics.overview.engagementRate.toFixed(1)}%`}
          icon={<Heart className="h-5 w-5" />}
          color="text-pink-400"
          bgColor="bg-pink-500/10"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-600">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-slate-600">
            <Users className="h-4 w-4 mr-2" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-600">
            <Target className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-slate-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Views Over Time */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Views & Engagement Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#334155', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="1"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="downloads"
                      stackId="2"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="likes"
                      stackId="3"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Presentations */}
          {!presentationId && analytics.topPresentations && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Presentations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPresentations.map((presentation, index) => (
                    <div 
                      key={presentation.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{presentation.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {formatNumber(presentation.views)}
                            </span>
                            <span className="flex items-center">
                              <Download className="h-3 w-3 mr-1" />
                              {formatNumber(presentation.downloads)}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {formatNumber(presentation.likes)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          {formatPercentage(presentation.engagementRate)}
                        </div>
                        <div className="text-xs text-slate-400">Engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.geographicData.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" 
                             style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-white">{country.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-sm">{formatNumber(country.views)}</span>
                        <span className="text-slate-500 text-sm">({formatPercentage(country.percentage)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {analytics.deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#334155', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Sources */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.audienceInsights.referralSources}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="source" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#334155', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="visits" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Peak Activity Hours */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Peak Activity Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.audienceInsights.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#334155', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelFormatter={(value) => `${value}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activity" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Slide Retention */}
          {presentationId && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Slide Retention Rate</CardTitle>
                <p className="text-slate-400 text-sm">Percentage of viewers who reach each slide</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.audienceInsights.retentionRate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="slide" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickFormatter={(value) => `Slide ${value}`}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#334155', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retention']}
                        labelFormatter={(value) => `Slide ${value}`}
                      />
                      <Bar 
                        dataKey="retention" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-300 text-sm font-medium">Avg. View Duration</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(analytics.overview.avgViewDuration / 60)}m {analytics.overview.avgViewDuration % 60}s
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {formatPercentage(analytics.overview.conversionRate)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Total Interactions</p>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(analytics.overview.totalLikes + analytics.overview.totalComments)}
                    </p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PerformanceMetric
                  label="View-to-Download Rate"
                  value={((analytics.overview.totalDownloads / analytics.overview.totalViews) * 100).toFixed(1)}
                  suffix="%"
                  color="text-cyan-400"
                />
                <PerformanceMetric
                  label="Engagement Score"
                  value={analytics.overview.engagementRate.toFixed(1)}
                  suffix="%"
                  color="text-purple-400"
                />
                <PerformanceMetric
                  label="Return Visitor Rate"
                  value={((analytics.overview.totalViews - analytics.overview.uniqueViewers) / analytics.overview.totalViews * 100).toFixed(1)}
                  suffix="%"
                  color="text-green-400"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Components
const OverviewCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = ({ title, value, icon, color, bgColor }) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-white">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        </div>
        <div className={`${bgColor} ${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PerformanceMetric: React.FC<{
  label: string;
  value: string;
  suffix: string;
  color: string;
}> = ({ label, value, suffix, color }) => (
  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
    <span className="text-slate-300">{label}</span>
    <span className={`text-xl font-semibold ${color}`}>
      {value}{suffix}
    </span>
  </div>
);

export default AnalyticsDashboard;
