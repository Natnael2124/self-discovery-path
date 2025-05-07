
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Download, Loader2 } from 'lucide-react';
import { DiaryEntry } from '@/contexts/DiaryContext';
import { toast } from '@/components/ui/sonner';

interface ExportEntryButtonProps {
  entry: DiaryEntry;
  className?: string;
}

const ExportEntryButton = ({ entry, className }: ExportEntryButtonProps) => {
  const [loading, setLoading] = useState(false);

  const formatAnalysisText = (entry: DiaryEntry): string => {
    if (!entry.mood) return '';
    
    return `
AI ANALYSIS
-----------
Mood: ${entry.mood}
Emotions: ${entry.emotions?.join(', ') || 'None'}
Strength: ${entry.strength || 'None detected'}
Area for Growth: ${entry.weakness || 'None detected'}
Key Insight: ${entry.insight || 'None provided'}
`;
  };

  const exportAsText = () => {
    setLoading(true);
    
    try {
      const entryDate = new Date(entry.createdAt).toLocaleDateString();
      const entryTime = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const content = `${entry.title}
${entryDate} • ${entryTime}
      
${entry.content}

${formatAnalysisText(entry)}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-${entryDate.replace(/\//g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Journal entry exported as text file');
    } catch (error) {
      console.error('Error exporting entry:', error);
      toast.error('Failed to export journal entry');
    } finally {
      setLoading(false);
    }
  };

  const exportAsHTML = () => {
    setLoading(true);
    
    try {
      const entryDate = new Date(entry.createdAt).toLocaleDateString();
      const entryTime = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let analysisHTML = '';
      if (entry.mood) {
        analysisHTML = `
        <div style="margin-top: 20px; border-top: 1px solid #eaeaea; padding-top: 20px;">
          <h2>AI Analysis</h2>
          <p><strong>Mood:</strong> ${entry.mood}</p>
          <p><strong>Emotions:</strong> ${entry.emotions?.join(', ') || 'None'}</p>
          <p><strong>Strength:</strong> ${entry.strength || 'None detected'}</p>
          <p><strong>Area for Growth:</strong> ${entry.weakness || 'None detected'}</p>
          <p><strong>Key Insight:</strong> ${entry.insight || 'None provided'}</p>
        </div>
        `;
      }
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${entry.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { margin-bottom: 5px; }
          .date { color: #666; margin-bottom: 20px; font-size: 0.9em; }
          .content { white-space: pre-wrap; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${entry.title}</h1>
        <div class="date">${entryDate} • ${entryTime}</div>
        <div class="content">${entry.content.replace(/\n/g, '<br>')}</div>
        ${analysisHTML}
      </body>
      </html>
      `;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-${entryDate.replace(/\//g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Journal entry exported as HTML file');
    } catch (error) {
      console.error('Error exporting entry:', error);
      toast.error('Failed to export journal entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsText}>
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML}>
          Export as HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportEntryButton;
