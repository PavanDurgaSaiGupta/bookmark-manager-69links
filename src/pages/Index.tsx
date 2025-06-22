import React, { useState, useEffect } from 'react';
import { Plus, Search, Github, Grid, List, ExternalLink, Trash2, FolderPlus, Folder, Moon, Sun, Download, StickyNote, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import AddFolderModal from '@/components/AddFolderModal';
import AddNoteModal from '@/components/AddNoteModal';
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

interface Note {
  id: string;
  title: string;
  content: string;
  dateAdded: string;
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem('6^^9-auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
      loadDataFromGitHub();
    }
  }, []);

  // Auto-sync every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncInterval = setInterval(() => {
      console.log('Auto-syncing to GitHub...');
      saveToGitHub(bookmarks, notes, folders, true);
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, bookmarks, notes, folders]);

  const loadDataFromGitHub = async () => {
    try {
      console.log('Loading data from GitHub...');
      setIsSyncing(true);
      
      // Load bookmarks
      try {
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
          console.log('Bookmarks loaded from GitHub:', bookmarksContent.length);
        }
      } catch (error) {
        console.log('No existing bookmarks file found');
      }

      // Load notes
      try {
        const notesResponse = await fetch(`${GITHUB_API_URL}/notes.json`, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          const notesContent = JSON.parse(atob(notesData.content));
          setNotes(notesContent);
          console.log('Notes loaded from GitHub:', notesContent.length);
        }
      } catch (error) {
        console.log('No existing notes file found');
      }

      // Load folders
      try {
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
          console.log('Folders loaded from GitHub:', foldersContent.length);
        }
      } catch (error) {
        console.log('No existing folders file found');
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error loading from GitHub:', error);
      // Initialize with sample data if GitHub fails
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

      setFolders(sampleFolders);
      saveToGitHub([], [], sampleFolders);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToGitHub = async (bookmarksData: Bookmark[], notesData: Note[], foldersData: Folder[], isAutoSync = false) => {
    try {
      if (!isAutoSync) {
        setIsSyncing(true);
      }
      
      console.log('Saving to GitHub...', { 
        bookmarks: bookmarksData.length, 
        notes: notesData.length, 
        folders: foldersData.length 
      });

      // Get existing file SHAs for updates
      const getFileSha = async (filename: string) => {
        try {
          const response = await fetch(`${GITHUB_API_URL}/${filename}`, {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            return data.sha;
          }
        } catch (error) {
          console.log(`No existing ${filename} found`);
        }
        return null;
      };

      // Save bookmarks
      const bookmarksSha = await getFileSha('bookmarks.json');
      const bookmarksContent = btoa(JSON.stringify(bookmarksData, null, 2));
      const bookmarksPayload: any = {
        message: `Update bookmarks - ${new Date().toISOString()}`,
        content: bookmarksContent,
      };
      if (bookmarksSha) {
        bookmarksPayload.sha = bookmarksSha;
      }

      const bookmarksResponse = await fetch(`${GITHUB_API_URL}/bookmarks.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarksPayload),
      });

      // Save notes
      const notesSha = await getFileSha('notes.json');
      const notesContent = btoa(JSON.stringify(notesData, null, 2));
      const notesPayload: any = {
        message: `Update notes - ${new Date().toISOString()}`,
        content: notesContent,
      };
      if (notesSha) {
        notesPayload.sha = notesSha;
      }

      const notesResponse = await fetch(`${GITHUB_API_URL}/notes.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notesPayload),
      });

      // Save folders
      const foldersSha = await getFileSha('folders.json');
      const foldersContent = btoa(JSON.stringify(foldersData, null, 2));
      const foldersPayload: any = {
        message: `Update folders - ${new Date().toISOString()}`,
        content: foldersContent,
      };
      if (foldersSha) {
        foldersPayload.sha = foldersSha;
      }

      const foldersResponse = await fetch(`${GITHUB_API_URL}/folders.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foldersPayload),
      });

      if (bookmarksResponse.ok && notesResponse.ok && foldersResponse.ok) {
        console.log('Successfully saved to GitHub');
        setLastSyncTime(new Date());
        
        if (!isAutoSync) {
          toast({
            title: "Synced to GitHub",
            description: "Your data has been saved to the repository.",
          });
        }
      } else {
        throw new Error('Failed to save some files');
      }
    } catch (error) {
      console.error('GitHub sync error:', error);
      if (!isAutoSync) {
        toast({
          title: "Sync failed",
          description: "Failed to save to GitHub repository. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isAutoSync) {
        setIsSyncing(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('6^^9-auth');
    setIsAuthenticated(false);
    setBookmarks([]);
    setNotes([]);
    setFolders([]);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || note.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
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
    saveToGitHub(updatedBookmarks, notes, folders);
    toast({
      title: "Bookmark added",
      description: "Your bookmark has been saved and synced to GitHub.",
    });
  };

  const handleAddNote = (newNote: Omit<Note, 'id' | 'dateAdded'>) => {
    const note: Note = {
      ...newNote,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    saveToGitHub(bookmarks, updatedNotes, folders);
    toast({
      title: "Note added",
      description: "Your note has been saved and synced to GitHub.",
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
    saveToGitHub(bookmarks, notes, updatedFolders);
    toast({
      title: "Folder created",
      description: "Your folder has been created and synced to GitHub.",
    });
  };

  const handleDeleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, notes, folders);
    toast({
      title: "Bookmark deleted",
      description: "The bookmark has been removed and synced to GitHub.",
    });
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    saveToGitHub(bookmarks, updatedNotes, folders);
    toast({
      title: "Note deleted",
      description: "The note has been removed and synced to GitHub.",
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Type', 'Title', 'URL/Content', 'Description', 'Notes', 'Tags', 'Folder', 'Date Added'],
      ...bookmarks.map(bookmark => [
        'Bookmark',
        bookmark.title,
        bookmark.url,
        bookmark.description || '',
        bookmark.notes || '',
        bookmark.tags.join(';'),
        folders.find(f => f.id === bookmark.folderId)?.name || '',
        bookmark.dateAdded
      ]),
      ...notes.map(note => [
        'Note',
        note.title,
        note.content,
        '',
        '',
        '',
        folders.find(f => f.id === note.folderId)?.name || '',
        note.dateAdded
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
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  6^^9 links
                </div>
              </div>
              <div className="hidden sm:block text-sm text-muted-foreground">:: TooManyTabs</div>
              <Badge variant="outline" className="text-xs hidden md:inline-flex">
                <Github className="w-3 h-3 mr-1" />
                {isSyncing ? 'Syncing...' : 'GitHub'}
              </Badge>
              {lastSyncTime && (
                <div className="hidden lg:block text-xs text-muted-foreground">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48 lg:w-64"
                />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="hidden sm:flex"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="hidden sm:flex"
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
                className="hidden md:flex"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
              
              <Button
                onClick={() => setIsAddNoteModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Add Note
              </Button>
              
              <Button
                onClick={() => setIsAddFolderModalOpen(true)}
                variant="outline"
                className="col-span-2 lg:col-span-1"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Folder
              </Button>
            </div>

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
                  All Items
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
              <div className="hidden lg:block">
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

          {/* Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bookmarks" className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Bookmarks ({filteredBookmarks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Notes ({filteredNotes.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookmarks" className="mt-6">
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
                                <StickyNote className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
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
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium mb-2">No notes found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || selectedFolder ? 'Try adjusting your search or filter.' : 'Start by adding your first note.'}
                    </p>
                    {!searchQuery && !selectedFolder && (
                      <Button
                        onClick={() => setIsAddNoteModalOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <StickyNote className="mr-2 h-4 w-4" />
                        Add Your First Note
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                  }>
                    {filteredNotes.map(note => (
                      <Card key={note.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <StickyNote className="h-5 w-5 text-amber-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-sm font-medium truncate">
                                  {note.title}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {note.dateAdded}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {note.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
      
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        onAdd={handleAddNote}
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
