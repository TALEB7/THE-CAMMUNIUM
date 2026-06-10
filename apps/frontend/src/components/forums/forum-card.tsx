'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, MessageSquare } from 'lucide-react';
import type { Forum } from '@/types';

interface Props {
  forum: Forum;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ForumCard({ forum, onClick, onEdit, onDelete }: Props) {
  return (
    <div className="relative group w-full text-left">
      <button onClick={onClick} className="w-full text-left outline-none block">
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-xl hover:shadow-md hover:bg-card/80 transition-all duration-300 relative overflow-hidden ring-1 ring-border/50 group-hover:ring-primary/50">
          <div className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300 opacity-50 group-hover:opacity-100" style={{ backgroundColor: forum.color || '#1a237e' }} />
          <CardContent className="p-6 flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-inner transform transition-transform group-hover:scale-110 duration-300"
            style={{ backgroundImage: `linear-gradient(135deg, ${forum.color || '#1a237e'} 0%, ${forum.color ? forum.color + '99' : '#000044'} 100%)` }}
          >
            {forum.icon || forum.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{forum.name}</h3>
            {forum.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{forum.description}</p>}
          </div>
          <div className="hidden sm:flex items-center gap-6 text-right shrink-0 px-4 border-l border-border/50">
             <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">{forum._count?.posts ?? 0}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5"><MessageSquare className="w-3 h-3"/> Sujets</span>
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
      </button>

      {/* Admin Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-muted-foreground hover:text-primary bg-background/80 hover:bg-background rounded-md shadow-sm border border-border/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-muted-foreground hover:text-destructive bg-background/80 hover:bg-background rounded-md shadow-sm border border-border/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
