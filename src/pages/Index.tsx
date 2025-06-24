import React, { useState, useEffect } from 'react';
import { Plus, Search, Github, Grid, List, ExternalLink, Trash2, FolderPlus, Folder, Moon, Sun, Download, StickyNote, FileText, LogOut, Edit, CheckCircle } from 'lucide-react';
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

// GitHub configuration with updated token
const GITHUB_REPO = 'https://github.com/PavanDurgaSaiGupta/BOOKMARKSTOOLS';
const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com/repos/PavanDurgaSaiGupta/BOOKMARKSTOOLS/contents';

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
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'error' | 'disconnected'>('disconnected');
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Ensure General folder exists
  const ensureGeneralFolder = () => {
    if (!folders.find(f => f.name === 'General')) {
      const generalFolder: Folder = {
        id: 'general',
        name: 'General',
        color: '#3B82F6',
        dateCreated: new Date().toISOString().split('T')[0]
      };
      return [generalFolder, ...folders];
    }
    return folders;
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('6^^9-auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
      // Force GitHub connection on page load
      initializeApp();
    }
  }, []);

  const initializeApp = async () => {
    console.log('🚀 Initializing 6^^9 Links with updated GitHub token...');
    try {
      setSyncStatus('syncing');
      
      // Test GitHub connection with enhanced error handling
      const response = await fetch(`https://api.github.com/repos/PavanDurgaSaiGupta/BOOKMARKSTOOLS`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': '6^^9-Links-App',
        },
      });
      
      if (response.ok) {
        setSyncStatus('connected');
        console.log('✅ GitHub connection successful with updated token!');
        
        // Load existing data from GitHub
        await loadDataFromGitHub();
        
        toast({
          title: "🎉 GitHub Connected Successfully!",
          description: "Your bookmarks and notes are now synced with GitHub repository using the updated token!",
        });
      } else {
        const errorData = await response.json();
        console.error('❌ GitHub connection failed:', response.status, errorData);
        setSyncStatus('error');
        toast({
          title: "⚠️ GitHub Connection Failed",
          description: `Unable to connect to GitHub: ${errorData.message}. Please check your token permissions.`,
          variant: "destructive",
        });
        loadLocalData();
      }
    } catch (error) {
      console.error('💥 Connection error:', error);
      setSyncStatus('error');
      toast({
        title: "Connection Error",
        description: "Unable to connect to GitHub. Using local storage as fallback.",
        variant: "destructive",
      });
      loadLocalData();
    }
  };

  const loadLocalData = () => {
    const savedBookmarks = localStorage.getItem('6^^9-bookmarks');
    const savedNotes = localStorage.getItem('6^^9-notes');
    const savedFolders = localStorage.getItem('6^^9-folders');
    
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      setFolders(ensureGeneralFolder());
    }
  };

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
          console.log('Loaded bookmarks:', bookmarksContent.length);
        } else {
          console.log('No bookmarks file found, starting fresh');
          setBookmarks([]);
        }
      } catch (error) {
        console.log('No bookmarks file found');
        setBookmarks([]);
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
          console.log('Loaded notes:', notesContent.length);
        } else {
          console.log('No notes file found, starting fresh');
          setNotes([]);
        }
      } catch (error) {
        console.log('No notes file found');
        setNotes([]);
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
          setFolders(ensureGeneralFolder());
        } else {
          console.log('No folders file found, creating General folder');
          setFolders(ensureGeneralFolder());
        }
      } catch (error) {
        console.log('No folders file found, creating General folder');
        setFolders(ensureGeneralFolder());
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error loading from GitHub:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToGitHub = async (bookmarksData: Bookmark[], notesData: Note[], foldersData: Folder[]) => {
    if (syncStatus === 'error') {
      console.log('GitHub not connected, saving locally only');
      localStorage.setItem('6^^9-bookmarks', JSON.stringify(bookmarksData));
      localStorage.setItem('6^^9-notes', JSON.stringify(notesData));
      localStorage.setItem('6^^9-folders', JSON.stringify(foldersData));
      toast({
        title: "⚠️ Local Save Only",
        description: "Data saved locally. GitHub sync unavailable.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      console.log('Saving to GitHub...', { 
        bookmarks: bookmarksData.length, 
        notes: notesData.length, 
        folders: foldersData.length 
      });

      const saveFile = async (filename: string, content: any) => {
        let sha = null;
        try {
          const existingResponse = await fetch(`${GITHUB_API_URL}/${filename}`, {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': '6^^9-Links-App',
            },
          });
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            sha = existingData.sha;
          }
        } catch (error) {
          console.log(`No existing ${filename} found, creating new file`);
        }

        const payload: any = {
          message: `Update ${filename} - ${new Date().toISOString()}`,
          content: typeof content === 'string' ? btoa(content) : btoa(JSON.stringify(content, null, 2)),
        };
        
        if (sha) {
          payload.sha = sha;
        }

        const response = await fetch(`${GITHUB_API_URL}/${filename}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': '6^^9-Links-App',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save ${filename}:`, errorText);
          throw new Error(`Failed to save ${filename}`);
        }

        return response;
      };

      // Save all files to GitHub
      await Promise.all([
        saveFile('bookmarks.json', bookmarksData),
        saveFile('notes.json', notesData),
        saveFile('folders.json', foldersData),
        saveFile('bookmarks.html', generateBookmarksHTML(bookmarksData, foldersData))
      ]);

      console.log('✅ Successfully saved all data to GitHub');
      setLastSyncTime(new Date());
      setSyncStatus('connected');
      
      // Also save locally as backup
      localStorage.setItem('6^^9-bookmarks', JSON.stringify(bookmarksData));
      localStorage.setItem('6^^9-notes', JSON.stringify(notesData));
      localStorage.setItem('6^^9-folders', JSON.stringify(foldersData));
      
      toast({
        title: "✅ Sync Successful",
        description: "All data successfully synced to GitHub repository!",
      });
    } catch (error) {
      console.error('GitHub sync error:', error);
      setSyncStatus('error');
      
      // Save locally as fallback
      localStorage.setItem('6^^9-bookmarks', JSON.stringify(bookmarksData));
      localStorage.setItem('6^^9-notes', JSON.stringify(notesData));
      localStorage.setItem('6^^9-folders', JSON.stringify(foldersData));
      
      toast({
        title: "❌ Sync Failed",
        description: "GitHub sync failed. Data saved locally only.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const generateBookmarksHTML = (bookmarksData: Bookmark[], foldersData: Folder[]) => {
    const timestamp = Math.floor(Date.now() / 1000);
    
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- 6^^9 Links Bookmarks Export -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>6^^9 Links Bookmarks</TITLE>
<H1>6^^9 Links Bookmarks</H1>
<DL><p>
`;

    // Group bookmarks by folder
    const bookmarksByFolder = new Map();
    bookmarksData.forEach(bookmark => {
      const folderId = bookmark.folderId || 'general';
      if (!bookmarksByFolder.has(folderId)) {
        bookmarksByFolder.set(folderId, []);
      }
      bookmarksByFolder.get(folderId).push(bookmark);
    });

    // Add bookmarks organized by folders
    bookmarksByFolder.forEach((bookmarks, folderId) => {
      const folder = foldersData.find(f => f.id === folderId);
      const folderName = folder ? folder.name : 'General';
      
      html += `<DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${folderName}</H3>\n<DL><p>\n`;
      
      bookmarks.forEach(bookmark => {
        const addDate = Math.floor(new Date(bookmark.dateAdded).getTime() / 1000);
        const description = bookmark.description ? ` - ${bookmark.description}` : '';
        const notes = bookmark.notes ? ` | Notes: ${bookmark.notes}` : '';
        const tags = bookmark.tags.length > 0 ? ` | Tags: ${bookmark.tags.join(', ')}` : '';
        
        html += `<DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}" TAGS="${bookmark.tags.join(',')}">${bookmark.title}</A>\n`;
        if (description || notes || tags) {
          html += `<DD>${description}${notes}${tags}\n`;
        }
      });
      
      html += `</DL><p>\n`;
    });

    html += `</DL><p>`;
    return html;
  };

  const handleLogout = () => {
    localStorage.removeItem('6^^9-auth');
    localStorage.removeItem('6^^9-bookmarks');
    localStorage.removeItem('6^^9-notes');
    localStorage.removeItem('6^^9-folders');
    setIsAuthenticated(false);
    setBookmarks([]);
    setNotes([]);
    setFolders([]);
    setSyncStatus('disconnected');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'connected': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'connected': return 'Connected';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Local Only';
      default: return 'Disconnected';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'connected': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'syncing': return <div className="w-3 h-3 mr-1 animate-spin border border-current border-t-transparent rounded-full" />;
      case 'error': return <div className="w-3 h-3 mr-1 bg-orange-500 rounded-full" />;
      default: return <div className="w-3 h-3 mr-1 bg-gray-400 rounded-full" />;
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || note.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags))).sort();

  const handleAddBookmark = (newBookmark: Omit<Bookmark, 'id' | 'dateAdded'>) => {
    // Ensure folder exists or default to general
    const ensuredFolders = ensureGeneralFolder();
    setFolders(ensuredFolders);
    
    let folderId = newBookmark.folderId;
    if (folderId && !ensuredFolders.find(f => f.id === folderId)) {
      folderId = 'general'; // Default to general if folder doesn't exist
    }
    
    const bookmark: Bookmark = {
      ...newBookmark,
      folderId: folderId || 'general',
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    const updatedBookmarks = [bookmark, ...bookmarks];
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, notes, ensuredFolders);
    
    toast({
      title: "📚 Bookmark Added",
      description: "Bookmark saved and synced successfully!",
    });
  };

  const handleEditBookmark = (updatedBookmark: Bookmark) => {
    const updatedBookmarks = bookmarks.map(b => 
      b.id === updatedBookmark.id ? updatedBookmark : b
    );
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, notes, folders);
    setEditingBookmark(null);
    toast({
      title: "✏️ Bookmark Updated",
      description: "Bookmark updated and synced successfully!",
    });
  };

  const handleAddNote = (newNote: Omit<Note, 'id' | 'dateAdded'>) => {
    // Ensure folder exists or default to general
    const ensuredFolders = ensureGeneralFolder();
    setFolders(ensuredFolders);
    
    let folderId = newNote.folderId;
    if (folderId && !ensuredFolders.find(f => f.id === folderId)) {
      folderId = 'general'; // Default to general if folder doesn't exist
    }
    
    const note: Note = {
      ...newNote,
      folderId: folderId || 'general',
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    saveToGitHub(bookmarks, updatedNotes, ensuredFolders);
    
    toast({
      title: "📝 Note Added",
      description: "Note saved and synced successfully!",
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
      title: "📁 Folder Created",
      description: "Folder created and synced successfully!",
    });
  };

  const handleEditFolder = (updatedFolder: Folder) => {
    const updatedFolders = folders.map(f => 
      f.id === updatedFolder.id ? updatedFolder : f
    );
    setFolders(updatedFolders);
    saveToGitHub(bookmarks, notes, updatedFolders);
    setEditingFolder(null);
    toast({
      title: "📁 Folder Updated",
      description: "Folder updated and synced successfully!",
    });
  };

  const handleDeleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    saveToGitHub(updatedBookmarks, notes, folders);
    toast({
      title: "🗑️ Bookmark Deleted",
      description: "Bookmark removed and synced successfully!",
    });
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    saveToGitHub(bookmarks, updatedNotes, folders);
    toast({
      title: "🗑️ Note Deleted",
      description: "Note removed and synced successfully!",
    });
  };

  const handleDeleteFolder = (id: string) => {
    // Move bookmarks and notes from deleted folder to general
    const updatedBookmarks = bookmarks.map(b => 
      b.folderId === id ? { ...b, folderId: 'general' } : b
    );
    const updatedNotes = notes.map(n => 
      n.folderId === id ? { ...n, folderId: 'general' } : n
    );
    const updatedFolders = folders.filter(f => f.id !== id);
    
    setBookmarks(updatedBookmarks);
    setNotes(updatedNotes);
    setFolders(updatedFolders);
    saveToGitHub(updatedBookmarks, updatedNotes, updatedFolders);
    
    toast({
      title: "🗑️ Folder Deleted",
      description: "Folder deleted, items moved to General folder.",
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
        folders.find(f => f.id === bookmark.folderId)?.name || 'General',
        bookmark.dateAdded
      ]),
      ...notes.map(note => [
        'Note',
        note.title,
        note.content,
        '',
        '',
        '',
        folders.find(f => f.id === note.folderId)?.name || 'General',
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
    
    toast({
      title: "📊 Export Complete",
      description: "Your data has been exported to CSV format.",
    });
  };

  if (!isAuthenticated) {
    return <AuthModal onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  6^^9 links
                </div>
              </div>
              <div className="hidden sm:block text-sm text-muted-foreground">:: BookmarksTools</div>
              <div className={`text-xs flex items-center px-2 py-1 rounded-full border ${getStatusColor()}`}>
                {getStatusIcon()}
                {getStatusText()}
              </div>
              {lastSyncTime && syncStatus === 'connected' && (
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
                  className="pl-10 w-48 lg:w-64 transition-all duration-200 focus:w-56 lg:focus:w-72"
                />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="hidden sm:flex transition-all duration-200 hover:scale-105"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="hidden sm:flex transition-all duration-200 hover:scale-105"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="transition-all duration-200 hover:scale-105"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="hidden md:flex transition-all duration-200 hover:scale-105"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-105"
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
              
              <Button
                onClick={() => setIsAddNoteModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Add Note
              </Button>
              
              <Button
                onClick={() => setIsAddFolderModalOpen(true)}
                variant="outline"
                className="col-span-2 lg:col-span-1 transition-all duration-200 hover:scale-105 border-dashed hover:border-solid"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Folder
              </Button>
            </div>

            {/* Folders */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Folders</h3>
              <div className="space-y-1">
                <Button
                  variant={selectedFolder === '' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedFolder('')}
                  className="w-full justify-start transition-all duration-200 hover:scale-105"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  All Items
                  <Badge variant="secondary" className="ml-auto">
                    {bookmarks.length + notes.length}
                  </Badge>
                </Button>
                {folders.map(folder => {
                  const folderItemCount = bookmarks.filter(b => b.folderId === folder.id).length + 
                                         notes.filter(n => n.folderId === folder.id).length;
                  
                  return (
                    <div key={folder.id} className="flex items-center group">
                      <Button
                        variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedFolder(folder.id)}
                        className="w-full justify-start flex-1 transition-all duration-200 hover:scale-105"
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2 shadow-sm" 
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                        <Badge variant="secondary" className="ml-auto">
                          {folderItemCount}
                        </Badge>
                      </Button>
                      {folder.name !== 'General' && (
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1 ml-2 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFolder(folder)}
                            className="h-8 w-8 p-0 hover:scale-110 transition-all duration-200"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="h-8 w-8 p-0 hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="hidden lg:block space-y-3">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedTag === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag('')}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    All
                  </Button>
                  {allTags.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                      className="transition-all duration-200 hover:scale-105"
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="bookmarks" className="flex items-center space-x-2 transition-all duration-200">
                  <ExternalLink className="h-4 w-4" />
                  <span>Bookmarks ({filteredBookmarks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center space-x-2 transition-all duration-200">
                  <FileText className="h-4 w-4" />
                  <span>Notes ({filteredNotes.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookmarks">
                {filteredBookmarks.length === 0 ? (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || selectedTag || selectedFolder ? 'Try adjusting your search or filter.' : 'Start by adding your first bookmark.'}
                    </p>
                    {!searchQuery && !selectedTag && !selectedFolder && (
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
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
                    {filteredBookmarks.map((bookmark, index) => (
                      <Card 
                        key={bookmark.id} 
                        className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 animate-fade-in"
                        style={{ 
                          borderLeftColor: folders.find(f => f.id === bookmark.folderId)?.color || '#3B82F6',
                          animationDelay: `${index * 50}ms`
                        }}
                      >
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
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button variant="ghost" size="sm" asChild className="hover:scale-110 transition-all duration-200">
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingBookmark(bookmark)}
                                className="hover:scale-110 transition-all duration-200"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteBookmark(bookmark.id)}
                                className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-700"
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
                                  <Badge key={tag} variant="secondary" className="text-xs hover:scale-105 transition-all duration-200">
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

              <TabsContent value="notes">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium mb-2">No notes found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || selectedFolder ? 'Try adjusting your search or filter.' : 'Start by adding your first note.'}
                    </p>
                    {!searchQuery && !selectedFolder && (
                      <Button
                        onClick={() => setIsAddNoteModalOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
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
                    {filteredNotes.map((note, index) => (
                      <Card 
                        key={note.id} 
                        className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 animate-fade-in"
                        style={{ 
                          borderLeftColor: folders.find(f => f.id === note.folderId)?.color || '#F59E0B',
                          animationDelay: `${index * 50}ms`
                        }}
                      >
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
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-700"
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
        isOpen={isAddModalOpen || !!editingBookmark}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(null);
        }}
        onAdd={editingBookmark ? handleEditBookmark : handleAddBookmark}
        folders={folders}
        editingBookmark={editingBookmark}
      />
      
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        onAdd={handleAddNote}
        folders={folders}
      />
      
      <AddFolderModal
        isOpen={isAddFolderModalOpen || !!editingFolder}
        onClose={() => {
          setIsAddFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onAdd={editingFolder ? handleEditFolder : handleAddFolder}
        editingFolder={editingFolder}
      />
    </div>
  );
};

export default Index;
