
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Github, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (repoUrl: string) => void;
  currentRepo?: string;
}

const GitHubConnectModal: React.FC<GitHubConnectModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect, 
  currentRepo 
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?$/;
    return githubPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    const cleanUrl = repoUrl.trim().replace(/\/$/, '');
    
    if (!validateGitHubUrl(cleanUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, you would validate the repo exists and is accessible
      // For now, we'll just simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onConnect(cleanUrl);
      setRepoUrl('');
      onClose();
    } catch (error) {
      setError('Failed to connect to repository. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('githubRepo');
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>GitHub Repository</span>
          </DialogTitle>
          <DialogDescription>
            Connect a GitHub repository to store your bookmarks. The repository should be public or you need access to it.
          </DialogDescription>
        </DialogHeader>

        {currentRepo && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Currently connected:</Label>
              <div className="flex items-center justify-between mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4" />
                  <span className="text-sm font-mono">{currentRepo.split('/').slice(-2).join('/')}</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={currentRepo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or connect a different repository</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">GitHub Repository URL</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setError('');
              }}
              disabled={isLoading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This app will create a <code>bookmarks/</code> folder in your repository to store bookmark files. 
              Make sure you have write access to the repository.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : currentRepo ? 'Switch Repository' : 'Connect Repository'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubConnectModal;
