
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickyNote } from 'lucide-react';

interface Note {
  title: string;
  content: string;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (note: Note) => void;
  folders: Folder[];
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, onAdd, folders }) => {
  const [formData, setFormData] = useState<Note>({
    title: '',
    content: '',
    folderId: undefined
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    setIsLoading(true);
    onAdd(formData);
    
    // Reset form
    setFormData({
      title: '',
      content: '',
      folderId: undefined
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <StickyNote className="h-5 w-5 text-amber-500" />
            <span>Add New Note</span>
          </DialogTitle>
          <DialogDescription>
            Create a new note and save it to your GitHub repository.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              id="note-title"
              placeholder="Note title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-folder">Folder</Label>
            <Select value={formData.folderId || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, folderId: value === 'none' ? undefined : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: folder.color }}
                      />
                      <span>{folder.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">Content *</Label>
            <Textarea
              id="note-content"
              placeholder="Write your note content here..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              required
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 w-full sm:w-auto"
              disabled={!formData.title || !formData.content || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
