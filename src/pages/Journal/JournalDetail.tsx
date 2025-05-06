
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDiary } from "@/contexts/DiaryContext";
import { ArrowLeft, Brain, Lightbulb } from "lucide-react";

const JournalDetail = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { getEntryById, analyzeEntry, loading } = useDiary();
  const [entry, setEntry] = useState(getEntryById(entryId || ""));

  useEffect(() => {
    if (entryId) {
      const foundEntry = getEntryById(entryId);
      setEntry(foundEntry);
      
      if (!foundEntry) {
        navigate("/journal");
      }
    }
  }, [entryId, getEntryById, navigate]);

  if (!entry) {
    return null;
  }

  const handleAnalyze = async () => {
    if (entryId) {
      await analyzeEntry(entryId);
      setEntry(getEntryById(entryId));
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journal")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold ml-2">{entry.title}</h1>
            <p className="text-sm text-muted-foreground ml-2">
              {new Date(entry.createdAt).toLocaleDateString()} • {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="whitespace-pre-wrap">{entry.content}</div>
          </CardContent>
        </Card>

        {entry.mood ? (
          <Card>
            <CardContent className="py-6">
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
        )}
      </div>
    </MainLayout>
  );
};

export default JournalDetail;
