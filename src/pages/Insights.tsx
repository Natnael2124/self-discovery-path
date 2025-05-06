
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiary } from "@/contexts/DiaryContext";
import { useInsight } from "@/contexts/InsightContext";
import { 
  AreaChart, 
  Area, 
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart, 
  Bar 
} from "recharts";
import { BarChart2, TrendingUp, Sparkles, Brain } from "lucide-react";

const Insights = () => {
  const { entries } = useDiary();
  const { getEmotionTrends, getTopStrengths, getTopWeaknesses } = useInsight();
  const [activeTab, setActiveTab] = useState("overview");

  const analyzedEntries = entries.filter((entry) => entry.mood);
  const emotionTrendData = getEmotionTrends();
  const strengthsData = getTopStrengths();
  const weaknessesData = getTopWeaknesses();

  // Calculate positive vs negative emotion ratio
  const emotionRatio = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  analyzedEntries.forEach((entry) => {
    const mood = entry.mood?.toLowerCase() || "";
    if (["happy", "excited", "content", "grateful", "hopeful", "inspired"].includes(mood)) {
      emotionRatio.positive++;
    } else if (["sad", "anxious", "angry", "frustrated", "stressed", "overwhelmed"].includes(mood)) {
      emotionRatio.negative++;
    } else {
      emotionRatio.neutral++;
    }
  });

  const totalEmotions = emotionRatio.positive + emotionRatio.negative + emotionRatio.neutral;
  const positiveRatio = totalEmotions ? Math.round((emotionRatio.positive / totalEmotions) * 100) : 0;
  const negativeRatio = totalEmotions ? Math.round((emotionRatio.negative / totalEmotions) * 100) : 0;
  const neutralRatio = totalEmotions ? Math.round((emotionRatio.neutral / totalEmotions) * 100) : 0;

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="mr-2" size={24} />
            Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated patterns and insights from your journal entries
          </p>
        </div>

        {analyzedEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Brain className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No insights available yet</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Write and analyze journal entries to start seeing patterns and insights
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="emotions">Emotions</TabsTrigger>
              <TabsTrigger value="strengths">Strengths & Growth</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Analyzed Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyzedEntries.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((analyzedEntries.length / entries.length) * 100)}% of all entries
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Primary Mood</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {emotionRatio.positive > emotionRatio.negative
                        ? "Positive"
                        : emotionRatio.negative > emotionRatio.positive
                        ? "Negative"
                        : "Neutral"}
                    </div>
                    <p className="text-xs text-muted-foreground">Based on mood analysis</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Strength</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {strengthsData.length > 0 ? strengthsData[0].strength : "None identified"}
                    </div>
                    <p className="text-xs text-muted-foreground">Recurring pattern in entries</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 text-primary" size={18} />
                    Key Insights
                  </CardTitle>
                  <CardDescription>Patterns discovered across all your journal entries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {strengthsData.length > 0 && (
                      <div>
                        <h3 className="font-medium">Your core strengths:</h3>
                        <p className="text-muted-foreground">
                          {strengthsData.map(s => s.strength).join(", ")}
                        </p>
                      </div>
                    )}

                    {emotionRatio.positive > emotionRatio.negative && (
                      <div>
                        <h3 className="font-medium">Positive outlook:</h3>
                        <p className="text-muted-foreground">
                          Your journal entries generally demonstrate a positive emotional state.
                        </p>
                      </div>
                    )}

                    {emotionRatio.negative > emotionRatio.positive && (
                      <div>
                        <h3 className="font-medium">Areas of challenge:</h3>
                        <p className="text-muted-foreground">
                          Your journal entries suggest you're working through some challenges right now.
                        </p>
                      </div>
                    )}

                    {weaknessesData.length > 0 && (
                      <div>
                        <h3 className="font-medium">Growth opportunities:</h3>
                        <p className="text-muted-foreground">
                          Consider focusing on developing skills related to {weaknessesData[0].weakness}.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emotions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 text-primary" size={18} />
                    Emotion Trends
                  </CardTitle>
                  <CardDescription>How your emotions have changed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {emotionTrendData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={emotionTrendData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorUv)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not enough data to display trends.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="mr-2 text-primary" size={18} />
                    Emotional Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Positive</span>
                        <span>{positiveRatio}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${positiveRatio}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Neutral</span>
                        <span>{neutralRatio}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${neutralRatio}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Negative</span>
                        <span>{negativeRatio}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{ width: `${negativeRatio}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strengths" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Strengths</CardTitle>
                    <CardDescription>Your most frequently identified strengths</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {strengthsData.length > 0 ? (
                      <div className="space-y-4">
                        {strengthsData.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="capitalize">{item.strength}</span>
                              <span>{item.count} entries</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-insight-strength h-2.5 rounded-full"
                                style={{
                                  width: `${(item.count / analyzedEntries.length) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No strengths identified yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Areas</CardTitle>
                    <CardDescription>Areas you might want to focus on improving</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {weaknessesData.length > 0 ? (
                      <div className="space-y-4">
                        {weaknessesData.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="capitalize">{item.weakness}</span>
                              <span>{item.count} entries</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-insight-weakness h-2.5 rounded-full"
                                style={{
                                  width: `${(item.count / analyzedEntries.length) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No growth areas identified yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Suggested Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyzedEntries.length > 0 ? (
                      <>
                        {strengthsData.length > 0 && (
                          <div>
                            <h3 className="font-medium">Leverage your strengths</h3>
                            <p className="text-muted-foreground">
                              Continue to lean into your {strengthsData[0]?.strength} as this appears to be a core strength for you. Consider how you can apply this strength in new areas of your life.
                            </p>
                          </div>
                        )}

                        {weaknessesData.length > 0 && (
                          <div>
                            <h3 className="font-medium">Areas for development</h3>
                            <p className="text-muted-foreground">
                              Work on strategies to address {weaknessesData[0]?.weakness}. This appears in several entries and may be holding you back from achieving your goals.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        Write more journal entries to receive personalized suggestions.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default Insights;
