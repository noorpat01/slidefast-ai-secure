import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  User, 
  Settings, 
  Shield, 
  ExternalLink, 
  RefreshCw,
  Chrome
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GoogleConnection {
  connected: boolean;
  google_email?: string;
  connected_at?: string;
  last_sync_at?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection>({ connected: false });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      checkGoogleConnection();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading user profile:', error);
      } else if (data) {
        setUserProfile(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || ''
        });
      } else {
        // No profile exists, create default
        setUserProfile({
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString()
        });
        setFormData({
          full_name: '',
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    if (!user) return;
    
    try {
      // Check if user has Google identity linked
      const { data: identities, error } = await supabase.auth.getUserIdentities();
      
      if (error) {
        console.error('Error checking Google connection:', error);
        return;
      }
      
      const googleIdentity = identities?.identities?.find(
        identity => identity.provider === 'google'
      );
      
      if (googleIdentity) {
        setGoogleConnection({
          connected: true,
          google_email: googleIdentity.identity_data?.email,
          connected_at: googleIdentity.created_at,
          last_sync_at: googleIdentity.last_sign_in_at
        });
      } else {
        setGoogleConnection({ connected: false });
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnection({ connected: false });
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully');
      await loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      });
      
      if (error) {
        console.error('Google connection error:', error);
        toast.error('Failed to connect Google account');
      }
    } catch (error) {
      console.error('Google connection error:', error);
      toast.error('Failed to connect Google account');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setLoading(true);
    try {
      // Get user identities to find Google identity ID
      const { data: identities, error: identitiesError } = await supabase.auth.getUserIdentities();
      
      if (identitiesError) {
        throw identitiesError;
      }
      
      const googleIdentity = identities?.identities?.find(
        identity => identity.provider === 'google'
      );
      
      if (googleIdentity) {
        const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
        
        if (error) {
          throw error;
        }
        
        toast.success('Google account disconnected successfully');
        await checkGoogleConnection();
      }
    } catch (error) {
      console.error('Google disconnection error:', error);
      toast.error('Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled
                  />
                  <p className="text-sm text-slate-400">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-300">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-slate-400">
                    {userProfile?.created_at && (
                      <>Member since {formatDate(userProfile.created_at)}</>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Google Integration */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Chrome className="w-5 h-5 text-red-500" />
                Google Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleConnection.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-green-400">Connected</p>
                        <p className="text-xs text-slate-400">
                          {googleConnection.google_email}
                        </p>
                      </div>
                    </div>
                    <Chrome className="w-5 h-5 text-green-400" />
                  </div>
                  
                  {googleConnection.connected_at && (
                    <div className="text-xs text-slate-400">
                      Connected on {formatDate(googleConnection.connected_at)}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 font-medium">Available Features:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>Google Slides Import & Export</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>Google Drive Integration</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span>Seamless Collaboration</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDisconnectGoogle}
                    disabled={loading}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect Google Account'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/10 to-red-500/10 border border-blue-500/20 rounded-2xl mb-4">
                      <Chrome className="h-8 w-8 text-slate-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-3">Connect Google Account</h3>
                  
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Connect your Google account to unlock powerful integration features:
                  </p>
                  
                  <div className="space-y-2 mb-6 text-left bg-slate-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Import presentations from Google Slides</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Export to Google Slides format</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Sync with Google Drive</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Enhanced collaboration tools</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Chrome className="w-4 h-4 mr-2" />
                        Connect Google Account
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-slate-500 mt-4">
                    Your Google account will be securely linked to enhance your experience.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-yellow-500" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Your account is secured with Supabase authentication. 
              </p>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};