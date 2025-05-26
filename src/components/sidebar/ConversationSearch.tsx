import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ConversationSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const ConversationSearch = ({ searchTerm, setSearchTerm }: ConversationSearchProps) => {
  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search conversations..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
