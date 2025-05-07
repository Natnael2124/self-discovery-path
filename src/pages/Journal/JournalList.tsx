
import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useDiary } from "@/contexts/DiaryContext";
import { Book, Search, Plus, Tag, X } from "lucide-react";

const JournalList = () => {
  const { entries, getAllTags } = useDiary();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const allTags = getAllTags();

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        // Text search
        const matchesSearch = 
          searchTerm === "" || 
          entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Tag filtering
        const matchesTags = 
          selectedTags.length === 0 || 
          (entry.tags && selectedTags.some(tag => entry.tags?.includes(tag)));
        
        return matchesSearch && matchesTags;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, searchTerm, selectedTags]);

  const groupedEntries = useMemo(() => {
    return filteredEntries.reduce<Record<string, typeof filteredEntries>>((groups, entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {});
  }, [filteredEntries]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Book className="mr-2" size={24} />
              Journal
            </h1>
            <p className="text-muted-foreground mt-1">Your personal reflections and thoughts</p>
          </div>
          <Button onClick={() => navigate("/journal/new")}>
            <Plus className="mr-2" size={16} />
            New Entry
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
            <Input
              placeholder="Search entries..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Tag size={16} className="mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by tag</span>
                
                {(searchTerm || selectedTags.length > 0) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-xs"
                    onClick={clearFilters}
                  >
                    <X size={14} className="mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Book className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No entries yet</h3>
                <p className="text-muted-foreground mt-2 mb-4">Start journaling to begin your self-discovery journey</p>
                <Button onClick={() => navigate("/journal/new")}>
                  <Plus className="mr-2" size={16} />
                  Write First Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No matching entries</h3>
                <p className="text-muted-foreground mt-2 mb-4">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedEntries).map((date) => (
              <div key={date}>
                <h2 className="text-lg font-medium mb-3">{date}</h2>
                <div className="space-y-3">
                  {groupedEntries[date].map((entry) => (
                    <Card
                      key={entry.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/journal/${entry.id}`)}
                    >
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{entry.title}</h3>
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {entry.content}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.mood && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {entry.mood}
                            </span>
                          )}
                          {entry.strength && (
                            <span className="text-xs px-2 py-0.5 bg-insight-strength/10 text-insight-strength rounded-full">
                              Strength: {entry.strength}
                            </span>
                          )}
                          {entry.tags && entry.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2 py-0.5 bg-secondary/80 text-secondary-foreground rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(tag);
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default JournalList;
