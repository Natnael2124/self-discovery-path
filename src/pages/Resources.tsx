
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInsight } from "@/contexts/InsightContext";
import { useDiary } from "@/contexts/DiaryContext";
import { Youtube, BookOpen, Headphones, BookText, RefreshCcw, ThumbsUp, ThumbsDown } from "lucide-react";

const Resources = () => {
  const { recommendations, generateRecommendations, markRecommendation, loading } = useInsight();
  const { entries } = useDiary();
  const [activeTab, setActiveTab] = useState("all");

  const analyzedEntries = entries.filter(entry => entry.mood);
  const hasAnalyzedEntries = analyzedEntries.length > 0;

  const filteredRecommendations = activeTab === "all" 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeTab);

  const getIconForType = (type: string) => {
    switch (type) {
      case "youtube":
        return <Youtube size={16} />;
      case "book":
        return <BookText size={16} />;
      case "podcast":
        return <Headphones size={16} />;
      case "article":
        return <BookOpen size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BookOpen className="mr-2" size={24} />
              Resources
            </h1>
            <p className="text-muted-foreground mt-1">Personalized recommendations based on your journal insights</p>
          </div>
          
          <Button
            onClick={() => generateRecommendations()}
            disabled={loading || !hasAnalyzedEntries}
          >
            <RefreshCcw size={16} className="mr-2" />
            Refresh Recommendations
          </Button>
        </div>

        {!hasAnalyzedEntries ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No recommendations available yet</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Write and analyze journal entries to receive personalized recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">Generate your first recommendations</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Click the button below to get personalized recommendations based on your journal entries
                </p>
                <Button onClick={() => generateRecommendations()} disabled={loading}>
                  <RefreshCcw size={16} className="mr-2" />
                  {loading ? "Generating..." : "Generate Recommendations"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="youtube">Videos</TabsTrigger>
                <TabsTrigger value="article">Articles</TabsTrigger>
                <TabsTrigger value="podcast">Podcasts</TabsTrigger>
                <TabsTrigger value="book">Books</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <p className="text-muted-foreground">No {activeTab} recommendations available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecommendations.map((recommendation) => (
                      <Card key={recommendation.id} className="flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1.5">
                              {getIconForType(recommendation.type)}
                              <span className="capitalize">{recommendation.type}</span>
                            </div>
                            
                            {recommendation.isHelpful !== undefined && (
                              <Badge 
                                className={recommendation.isHelpful ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}
                              >
                                {recommendation.isHelpful ? "Helpful" : "Not Helpful"}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{recommendation.title}</CardTitle>
                          {recommendation.author && (
                            <CardDescription>By {recommendation.author}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="py-2 flex-grow">
                          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2 pb-4">
                          {recommendation.url ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={recommendation.url} target="_blank" rel="noopener noreferrer">
                                View Resource
                              </a>
                            </Button>
                          ) : (
                            <span></span>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markRecommendation(recommendation.id, true)}
                              disabled={recommendation.isHelpful === true}
                              className={recommendation.isHelpful === true ? "text-green-500" : ""}
                            >
                              <ThumbsUp size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markRecommendation(recommendation.id, false)}
                              disabled={recommendation.isHelpful === false}
                              className={recommendation.isHelpful === false ? "text-red-500" : ""}
                            >
                              <ThumbsDown size={16} />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

// Badge component for resource ratings
const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </div>
);

export default Resources;
