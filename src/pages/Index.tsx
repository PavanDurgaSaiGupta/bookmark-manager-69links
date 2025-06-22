
import React, { useState, useEffect } from 'react';
import { Plus, Search, Github, Settings, Grid, List, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import GitHubConnectModal from '@/components/GitHubConnectModal';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  dateAdded: string;
  favicon?: string;
}

const Index = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [githubRepo, setGithubRepo] = useState('');
  const { toast } = useToast();

  // Sample bookmarks for demo
  useEffect(() => {
    const sampleBookmarks: Bookmark[] = [
      {
        id: '1',
        title: 'GitHub',
        url: 'https://github.com',
        description: 'Where the world builds software',
        tags: ['development', 'code', 'git'],
        dateAdded: '2024-01-15',
        favicon: '🐙'
      },
      {
        id: '2',
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: 'Programming Q&A community',
        tags: ['development', 'help', 'community'],
        dateAdded: '2024-01-14',
        favicon: '📚'
      },
      {
        id: '3',
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Web technology documentation',
        tags: ['documentation', 'web', 'reference'],
        dateAdded: '2024-01-13',
        favicon: '📖'
      }
    ];
    setBookmarks(sampleBookmarks);
    
    // Check for saved GitHub repo
    const savedRepo = localStorage.getItem('githubRepo');
    if (savedRepo) {
      setGithubRepo(savedRepo);
    }
  }, []);

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || bookmark.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags))).sort();

  const handleAddBookmark = (newBookmark: Omit<Bookmark, 'id' | 'dateAdded'>) => {
    const bookmark: Bookmark = {
      ...newBookmark,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setBookmarks(prev => [bookmark, ...prev]);
    toast({
      title: "Bookmark added",
      description: "Your bookmark has been saved successfully.",
    });
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Bookmark deleted",
      description: "The bookmark has been removed.",
    });
  };

  const connectGitHubRepo = (repoUrl: string) => {
    setGithubRepo(repoUrl);
    localStorage.setItem('githubRepo', repoUrl);
    toast({
      title: "GitHub repository connected",
      description: "Your bookmarks will now sync to the repository.",
    });
  };

  if (!githubRepo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Github className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">GitMark</CardTitle>
            <CardDescription>
              Connect your GitHub repository to start saving bookmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsGitHubModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Github className="mr-2 h-4 w-4" />
              Connect GitHub Repository
            </Button>
          </CardContent>
        </Card>
        <GitHubConnectModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          onConnect={connectGitHubRepo}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Github className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">GitMark</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                {githubRepo.split('/').slice(-2).join('/')}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGitHubModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag('')}
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarks */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedTag ? 'Try adjusting your search or filter.' : 'Start by adding your first bookmark.'}
            </p>
            {!searchQuery && !selectedTag && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Bookmark
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {filteredBookmarks.map(bookmark => (
              <Card key={bookmark.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-lg">{bookmark.favicon || '🔖'}</span>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium truncate">
                          {bookmark.title}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {new URL(bookmark.url).hostname}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(bookmark.description || bookmark.tags.length > 0) && (
                  <CardContent className="pt-0">
                    {bookmark.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {bookmark.description}
                      </p>
                    )}
                    {bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBookmark}
      />
      
      <GitHubConnectModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onConnect={connectGitHubRepo}
        currentRepo={githubRepo}
      />
    </div>
  );
};

export default Index;
