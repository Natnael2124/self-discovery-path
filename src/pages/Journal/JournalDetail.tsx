import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
import ExportEntryButton from "@/components/ExportEntryButton";
import { useDiary } from "@/contexts/DiaryContext";
import { 
  ArrowLeft, 
  Brain, 
  Lightbulb, 
  AlertTriangle,
  Trash2,
  Edit,
  Save,
  X,
  Tag
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

const JournalDetail = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { getEntryById, analyzeEntry, deleteEntry, updateEntry, loading } = useDiary();
  const [entry, setEntry] = useState(getEntryById(entryId || ""));
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);

  useEffect(() => {
    if (entryId) {
      const foundEntry = getEntryById(entryId);
      setEntry(foundEntry);
      
      if (!foundEntry) {
        navigate("/journal");
      } else {
        setEditTitle(foundEntry.title);
        setEditContent(foundEntry.content);
        setEditTags(foundEntry.tags || []);
      }
    }
  }, [entryId, getEntryById, navigate]);

  if (!entry) {
    return null;
  }

  const handleAnalyze = async () => {
    if (entryId) {
      try {
        await analyzeEntry(entryId);
        setEntry(getEntryById(entryId));
      } catch (error) {
        console.error("Error in analyze handler:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (entryId) {
      try {
        await deleteEntry(entryId);
        navigate("/journal");
        toast.success("Journal entry deleted successfully");
      } catch (error) {
        console.error("Error deleting entry:", error);
        toast.error("Failed to delete entry. Please try again.");
      }
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (entryId) {
      try {
        await updateEntry(entryId, editTitle, editContent, editTags);
        setIsEditing(false);
        setEntry(getEntryById(entryId));
        toast.success("Journal entry updated successfully");
      } catch (error) {
        console.error("Error updating entry:", error);
        toast.error("Failed to update entry. Please try again.");
      }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journal")}>
            <ArrowLeft size={20} />
          </Button>
          {!isEditing ? (
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold ml-2">{entry.title}</h1>
                  <p className="text-sm text-muted-foreground ml-2">
                    {new Date(entry.createdAt).toLocaleDateString()} • {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ExportEntryButton entry={entry} />
                  <Button variant="outline" size="icon" onClick={startEditing}>
                    <Edit size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your journal entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow">
              <h1 className="text-xl font-bold ml-2 mb-2">Edit Journal Entry</h1>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-medium"
                  placeholder="Title"
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[300px] resize-none"
                  placeholder="What's on your mind?"
                />
                
                <div className="pt-4 border-t">
                  <div className="flex items-center mb-2">
                    <Tag size={16} className="mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <TagInput 
                    tags={editTags} 
                    onChange={setEditTags} 
                    placeholder="Add tags (e.g., work, family, goals...)"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditing} disabled={loading}>
                    <X size={16} className="mr-2" /> Cancel
                  </Button>
                  <Button onClick={saveChanges} disabled={loading}>
                    <Save size={16} className="mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap">{entry.content}</div>
                
                {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!isEditing && (
          entry.mood ? (
            <Card>
              <CardContent className="py-6">
                {entry._fallback && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {entry._quotaExceeded 
                        ? "API quota exceeded. This is a fallback analysis." 
                        : "AI analysis failed. This is a fallback analysis."}
                    </AlertDescription>
                  </Alert>
                )}
              
                <div className="flex items-center mb-4">
                  <Brain className="text-primary mr-2" size={20} />
                  <h2 className="text-xl font-bold">AI Analysis</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Mood & Emotions</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10">
                        {entry.mood}
                      </Badge>
                      {entry.emotions?.map((emotion, i) => (
                        <Badge key={i} variant="outline">
                          {emotion}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Strengths</h3>
                    <Badge variant="outline" className="bg-insight-strength/10 text-insight-strength">
                      {entry.strength || "None detected"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Areas for Growth</h3>
                    <Badge variant="outline" className="bg-insight-weakness/10 text-insight-weakness mb-4">
                      {entry.weakness || "None detected"}
                    </Badge>

                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Key Insight</h3>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="text-yellow-500 mt-1 flex-shrink-0" size={16} />
                      <p className="text-sm">{entry.insight}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col items-center">
                  <Brain className="text-muted-foreground mb-2" size={36} />
                  <h3 className="text-lg font-medium">AI Analysis</h3>
                  <p className="text-muted-foreground text-center max-w-md mt-2 mb-4">
                    Get insights about your mood, emotions, strengths, and patterns in this journal entry
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={loading}
                  >
                    {loading ? "Analyzing..." : "Analyze with AI"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </MainLayout>
  );
};

export default JournalDetail;
