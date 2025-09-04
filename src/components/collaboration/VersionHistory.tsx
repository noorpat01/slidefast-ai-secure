import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, RotateCcw, Plus, User, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Version {
  id: string;
  version_number: number;
  branch_name: string;
  created_by: string;
  title: string;
  description: string;
  change_summary: string;
  is_current_version: boolean;
  created_at: string;
  parent_version_id?: string;
}

interface VersionHistoryProps {
  presentationId: string;
  onVersionRestore?: (versionId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  presentationId,
  onVersionRestore
}) => {
  const { user } = useAuthStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  useEffect(() => {
    if (presentationId) {
      loadVersions();
    }
  }, [presentationId, selectedBranch]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('version-manager', {
        body: {
          action: 'get_versions',
          presentationId
        }
      });

      if (error) throw error;

      const allVersions = data.data || [];
      setVersions(allVersions.filter((v: Version) => v.branch_name === selectedBranch));
      
      // Extract unique branches
      const uniqueBranches = [...new Set(allVersions.map((v: any) => v.branch_name))] as string[];
      setBranches(uniqueBranches);
    } catch (error: any) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('version-manager', {
        body: {
          action: 'restore_version',
          presentationId,
          versionId,
          branchName: selectedBranch
        }
      });

      if (error) throw error;

      toast.success('Version restored successfully');
      onVersionRestore?.(versionId);
      loadVersions();
    } catch (error: any) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !selectedVersion) {
      toast.error('Please enter a branch name and select a version');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('version-manager', {
        body: {
          action: 'create_branch',
          presentationId,
          versionData: {
            parentVersionId: selectedVersion,
            newBranchName: newBranchName.trim()
          }
        }
      });

      if (error) throw error;

      toast.success(`Branch '${newBranchName}' created successfully`);
      setIsCreateBranchOpen(false);
      setNewBranchName('');
      setSelectedVersion('');
      loadVersions();
    } catch (error: any) {
      console.error('Failed to create branch:', error);
      toast.error('Failed to create branch');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionColor = (version: Version) => {
    if (version.is_current_version) return 'bg-green-500';
    if (version.branch_name !== 'main') return 'bg-purple-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Version History</h2>
          
          {/* Branch Selector */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {branches.map(branch => (
              <option key={branch} value={branch}>
                {branch === 'main' ? 'Main Branch' : branch}
              </option>
            ))}
          </select>
        </div>

        {/* Create Branch Dialog */}
        <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Create Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Branch Name
                </label>
                <Input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="feature-branch-name"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Branch from Version
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select a version...</option>
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      v{version.version_number} - {version.change_summary || 'No description'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateBranchOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateBranch}>
                  Create Branch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Version Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No versions found for this branch</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>
            
            {versions.map((version, index) => (
              <div key={version.id} className="relative flex items-start gap-4 pb-6">
                {/* Timeline Dot */}
                <div className="relative z-10">
                  <div className={`w-3 h-3 rounded-full ${getVersionColor(version)}`}></div>
                  {version.is_current_version && (
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 border-green-500 animate-pulse"></div>
                  )}
                </div>

                {/* Version Card */}
                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.is_current_version ? "default" : "secondary"}>
                        v{version.version_number}
                      </Badge>
                      {version.branch_name !== 'main' && (
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {version.branch_name}
                        </Badge>
                      )}
                      {version.is_current_version && (
                        <Badge className="bg-green-500/20 text-green-400">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={version.is_current_version}
                        className="text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{version.title}</h3>
                  
                  {version.change_summary && (
                    <p className="text-slate-300 text-sm mb-2">{version.change_summary}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Author</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(version.created_at)}</span>
                    </div>
                  </div>

                  {version.description && (
                    <p className="text-slate-400 text-sm mt-2 italic">
                      {version.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;