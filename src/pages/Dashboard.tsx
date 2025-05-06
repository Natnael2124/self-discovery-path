
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { useInsight } from "@/contexts/InsightContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Book, BarChart, Sparkles, Lightbulb } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { entries } = useDiary();
  const { recommendations, generateRecommendations, loading } = useInsight();
  const navigate = useNavigate();

  // Fetch recommendations when dashboard loads if none exist
  useEffect(() => {
    if (user && entries.length > 0 && recommendations.length === 0) {
      generateRecommendations();
    }
  }, [user, entries.length, recommendations.length, generateRecommendations]);

  const analyzedEntries = entries.filter(entry => entry.mood);
  const latestEntry = entries[entries.length - 1];

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">
            Continue your journey of self-discovery and personal growth
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Book className="mr-2 text-primary" size={20} />
                Journal Entries
              </CardTitle>
              <CardDescription>Record your thoughts and reflections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold mb-2">{entries.length}</div>
                <p className="text-sm text-muted-foreground mb-4">
                  {analyzedEntries.length} entries analyzed by AI
                </p>
                <Button onClick={() => navigate("/journal/new")}>
                  Write New Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 text-primary" size={20} />
                Insights & Patterns
              </CardTitle>
              <CardDescription>AI-generated insights from your entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold mb-2">
                  {analyzedEntries.length > 0 ? "Patterns Detected" : "No Insights Yet"}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {analyzedEntries.length > 0
                    ? "AI has analyzed your journal entries"
                    : "Write entries to get AI insights"}
                </p>
                <Button 
                  onClick={() => navigate("/insights")}
                  disabled={analyzedEntries.length === 0}
                  variant={analyzedEntries.length === 0 ? "outline" : "default"}
                >
                  View Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {entries.length > 0 && (
          <Card className="mb-6 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 text-primary" size={20} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestEntry ? (
                  <div>
                    <h3 className="font-medium">Latest Journal Entry</h3>
                    <div className="border rounded-md p-4 mt-2">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">{latestEntry.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(latestEntry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {latestEntry.content}
                      </p>
                      <Button
                        variant="link"
                        className="px-0 mt-2"
                        onClick={() => navigate(`/journal/${latestEntry.id}`)}
                      >
                        View entry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p>No journal entries yet. Start writing to track your journey!</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations.length > 0 && (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 text-primary" size={20} />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Based on your journal entries and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {rec.type}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-medium mt-2">{rec.title}</h3>
                    {rec.author && <p className="text-sm text-muted-foreground">By {rec.author}</p>}
                    <p className="text-sm mt-1 line-clamp-2">{rec.description}</p>
                  </div>
                ))}
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/resources")}>
                    View All Recommendations
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
