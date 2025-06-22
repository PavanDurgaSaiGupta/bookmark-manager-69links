
import React, { useState, useEffect } from 'react';
import { Plus, Search, Github, Settings, Grid, List, ExternalLink, Edit, Trash2, FolderPlus, Folder, Moon, Sun, Download, Upload, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import AddFolderModal from '@/components/AddFolderModal';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  notes?: string;
  tags: string[];
  dateAdded: string;
  favicon?: string;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  dateCreated: string;
}

const GITHUB_REPO = 'https://github.com/PavanDurgaSaiGupta/TooManyTabs';
const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com/repos/PavanDurgaSaiGupta/TooManyTabs/contents';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem('6^^9-auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
      loadDataFromGitHub();
    }
  }, []);

  const loadDataFromGitHub = async () => {
    try {
      // Load bookmarks
      const bookmarksResponse = await fetch(`${GITHUB_API_URL}/bookmarks.json`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (bookmarksResponse.ok) {
        const bookmarksData = await bookmarksResponse.json();
        const bookmarksContent = JSON.parse(atob(bookmarksData.content));
        setBookmarks(bookmarksContent);
      }

      // Load folders
      const foldersResponse = await fetch(`${GITHUB_API_URL}/folders.json`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        const foldersContent = JSON.parse(atob(foldersData.content));
        setFolders(foldersContent);
      }
    } catch (error) {
      console.log('Loading initial data from GitHub...');
      // Initialize with sample data
      const sampleFolders: Folder[] = [
        {
          id: '1',
          name: 'Development',
          color: '#3B82F6',
          dateCreated: '2024-01-15'
        },
        {
          id: '2',
          name: 'Design',
          color: '#EF4444',
          dateCreated: '2024-01-15'
        }
      ];

      const sampleBookmarks: Bookmark[] = [
        {
          id: '1',
          title: 'GitHub',
          url: 'https://github.com',
          description: 'Where the world builds software',
          notes: 'Great for version control and collaboration',
          tags: ['development', 'code', 'git'],
          dateAdded: '2024-01-15',
          favicon: '🐙',
          folderId: '1'
        },
        {
          id: '2',
          title: 'Stack Overflow',
          url: 'https://stackoverflow.com',
          description: 'Programming Q&A community',
          notes: 'Best place to find coding solutions',
          tags: ['development', 'help', 'community'],
          dateAdded: '2024-01-14',
          favicon: '📚',
          folderId: '1'
        }
      ];

      setFolders(sampleFolders);
      setBookmarks(sampleBookmarks);
      saveToGitHub(sampleBookmarks, sampleFolders);
    }
  };

  const saveToGitHub = async (bookmarksData: Bookmark[], foldersData: Folder[]) => {
    try {
      // Save bookmarks
      const bookmarksContent = btoa(JSON.stringify(bookmarksData, null, 2));
      await fetch(`${GITHUB_API_URL}/bookmarks.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update bookmarks',
          content: bookmarksContent,
        }),
      });

      // Save folders
      const foldersContent = btoa(JSON.stringify(foldersData, null, 2));
      await fetch(`${GITHUB_API_URL}/folders.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update folders',
          content: foldersContent,
        }),
      });

      toast({
        title: "Synced to GitHub",
        description: "Your data has been saved to the repository.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to save to GitHub repository.",
        variant: "destructive",
      });
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || bookmark.tags.includes(selectedTag);
    const matchesFolder = !selectedFolder || bookmark.folderId === selectedFolder;
    return matchesSearch && matchesTag && matchesFolder;
  });

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags))).sort();

  const handleAddBookmark = (newBookmark: Omit<Bookmark, 'id' | 'dateAdded'>) => {
    const bookmark: Bookmark = {
      ...newBookmark,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    const updatedBookmarks = [bookmark, ...bookmarks];
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, folders);
    toast({
      title: "Bookmark added",
      description: "Your bookmark has been saved and synced to GitHub.",
    });
  };

  const handleAddFolder = (folderData: Omit<Folder, 'id' | 'dateCreated'>) => {
    const folder: Folder = {
      ...folderData,
      id: Date.now().toString(),
      dateCreated: new Date().toISOString().split('T')[0]
    };
    const updatedFolders = [...folders, folder];
    setFolders(updatedFolders);
    saveToGitHub(bookmarks, updatedFolders);
    toast({
      title: "Folder created",
      description: "Your folder has been created and synced to GitHub.",
    });
  };

  const handleDeleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, folders);
    toast({
      title: "Bookmark deleted",
      description: "The bookmark has been removed and synced to GitHub.",
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Title', 'URL', 'Description', 'Notes', 'Tags', 'Folder', 'Date Added'],
      ...bookmarks.map(bookmark => [
        bookmark.title,
        bookmark.url,
        bookmark.description || '',
        bookmark.notes || '',
        bookmark.tags.join(';'),
        folders.find(f => f.id === bookmark.folderId)?.name || '',
        bookmark.dateAdded
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '6^^9-links-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return <AuthModal onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  6^^9 links
                </div>
              </div>
              <div className="text-sm text-muted-foreground">:: TooManyTabs</div>
              <Badge variant="outline" className="text-xs">
                Connected to GitHub
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                variant="outline"
                size="sm"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setIsAddFolderModalOpen(true)}
                variant="outline"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Folder
              </Button>
              
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-6">
            {/* Folders */}
            <div>
              <h3 className="font-medium mb-3">Folders</h3>
              <div className="space-y-1">
                <Button
                  variant={selectedFolder === '' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedFolder('')}
                  className="w-full justify-start"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  All Bookmarks
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                    className="w-full justify-start"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1">
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
          </div>

          {/* Bookmarks */}
          <div className="flex-1">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedTag || selectedFolder ? 'Try adjusting your search or filter.' : 'Start by adding your first bookmark.'}
                </p>
                {!searchQuery && !selectedTag && !selectedFolder && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Bookmark
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
              }>
                {filteredBookmarks.map(bookmark => (
                  <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
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
                    {(bookmark.description || bookmark.notes || bookmark.tags.length > 0) && (
                      <CardContent className="pt-0">
                        {bookmark.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {bookmark.description}
                          </p>
                        )}
                        {bookmark.notes && (
                          <div className="flex items-start space-x-1 mb-2">
                            <StickyNote className="h-3 w-3 mt-0.5 text-amber-500" />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {bookmark.notes}
                            </p>
                          </div>
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
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBookmark}
        folders={folders}
      />
      
      <AddFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={() => setIsAddFolderModalOpen(false)}
        onAdd={handleAddFolder}
      />
    </div>
  );
};

export default Index;
