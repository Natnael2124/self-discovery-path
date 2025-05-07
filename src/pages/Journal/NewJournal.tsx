
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
import { useDiary } from "@/contexts/DiaryContext";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft, Save, Tag } from "lucide-react";

const NewJournal = () => {
  const navigate = useNavigate();
  const { addEntry, loading } = useDiary();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a title for your journal entry");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please write something in your journal entry");
      return;
    }
    
    try {
      const entry = await addEntry(title, content, tags);
      navigate(`/journal/${entry.id}`);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast.error("Failed to save your journal entry");
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journal")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold ml-2">New Journal Entry</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Input
                placeholder="Title"
                className="text-2xl font-medium border-none px-0 focus-visible:ring-0 mb-4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              
              <div className="text-sm text-muted-foreground mb-4">
                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              <Textarea
                placeholder="What's on your mind today? How are you feeling?"
                className="min-h-[300px] border-none focus-visible:ring-0 resize-none mb-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              
              <div className="pt-4 border-t">
                <div className="flex items-center mb-2">
                  <Tag size={16} className="mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <TagInput 
                  tags={tags} 
                  onChange={setTags}
                  placeholder="Add tags (e.g., work, family, goals...)"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/journal")} 
              className="mr-2"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default NewJournal;
