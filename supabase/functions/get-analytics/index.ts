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
    const requestData = await req.json();
    const { presentationId, timeRange } = requestData;

    // Mock analytics data - in production this would query real data
    const mockAnalyticsData = {
      overview: {
        totalViews: Math.floor(Math.random() * 1000) + 100,
        totalDownloads: Math.floor(Math.random() * 200) + 10,
        totalLikes: Math.floor(Math.random() * 150) + 5,
        totalComments: Math.floor(Math.random() * 50) + 2,
        uniqueViewers: Math.floor(Math.random() * 800) + 80,
        engagementRate: Math.random() * 20 + 5,
        avgViewDuration: Math.floor(Math.random() * 300) + 120,
        conversionRate: Math.random() * 10 + 2
      },
      viewsOverTime: generateMockTimeSeriesData(timeRange),
      geographicData: [
        { country: 'United States', views: 400, percentage: 40 },
        { country: 'United Kingdom', views: 200, percentage: 20 },
        { country: 'Germany', views: 150, percentage: 15 },
        { country: 'Canada', views: 100, percentage: 10 },
        { country: 'Others', views: 150, percentage: 15 }
      ],
      deviceData: [
        { device: 'Desktop', count: 600, percentage: 60 },
        { device: 'Mobile', count: 300, percentage: 30 },
        { device: 'Tablet', count: 100, percentage: 10 }
      ],
      topPresentations: [],
      audienceInsights: {
        peakHours: generateMockPeakHours(),
        retentionRate: generateMockRetention(),
        referralSources: [
          { source: 'Direct', visits: 400, percentage: 40 },
          { source: 'Social Media', visits: 300, percentage: 30 },
          { source: 'Search', visits: 200, percentage: 20 },
          { source: 'Referral', visits: 100, percentage: 10 }
        ]
      }
    };

    return new Response(JSON.stringify(mockAnalyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'ANALYTICS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateMockTimeSeriesData(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.unshift({
      date: date.toLocaleDateString(),
      views: Math.floor(Math.random() * 50) + 10,
      downloads: Math.floor(Math.random() * 10) + 1,
      likes: Math.floor(Math.random() * 15) + 2
    });
  }
  
  return data;
}

function generateMockPeakHours() {
  return Array(24).fill(0).map((_, hour) => ({
    hour,
    activity: Math.floor(Math.random() * 100) + 10
  }));
}

function generateMockRetention() {
  return Array(10).fill(0).map((_, index) => ({
    slide: index + 1,
    retention: Math.max(100 - (index * 8) - Math.random() * 10, 20)
  }));
}
