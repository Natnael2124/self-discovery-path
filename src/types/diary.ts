
export interface DiaryEntry {
  id: string;
  content: string;
  title: string;
  createdAt: string;
  userId: string;
  tags?: string[];
  mood?: string;
  emotions?: string[];
  strength?: string;
  weakness?: string;
  insight?: string;
  analysis?: any;
}

export interface DiaryContextType {
  entries: DiaryEntry[];
  loading: boolean;
  addEntry: (title: string, content: string, tags?: string[]) => Promise<DiaryEntry>;
  getEntryById: (id: string) => DiaryEntry | undefined;
  analyzeEntry: (entryId: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  updateEntry: (entryId: string, title: string, content: string, tags?: string[]) => Promise<void>;
  getAllTags: () => string[];
}
