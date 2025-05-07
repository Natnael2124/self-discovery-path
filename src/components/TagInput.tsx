
import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TagInput = ({ tags, onChange, placeholder = "Add tag...", disabled = false }: TagInputProps) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const trimmedInput = tagInput.trim();
    
    if (trimmedInput && !tags.includes(trimmedInput)) {
      const newTags = [...tags, trimmedInput];
      onChange(newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs py-1 px-2 flex items-center gap-1"
          >
            {tag}
            {!disabled && (
              <X 
                size={12} 
                className="cursor-pointer hover:text-destructive" 
                onClick={() => removeTag(tag)}
              />
            )}
          </Badge>
        ))}
      </div>
      
      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="text-sm"
            disabled={disabled}
          />
          <Button 
            type="button" 
            size="sm" 
            variant="outline"
            onClick={addTag} 
            disabled={!tagInput.trim() || disabled}
          >
            <Plus size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TagInput;
