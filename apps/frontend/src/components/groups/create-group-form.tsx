'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface FormState {
  name: string;
  description: string;
  isPrivate: boolean;
  category: string;
}

interface Props {
  isPending: boolean;
  onSubmit: (form: FormState) => void;
}

export function CreateGroupForm({ isPending, onSubmit }: Props) {
  const { t } = useT();
  const [form, setForm] = useState<FormState>({ name: '', description: '', isPrivate: false, category: '' });

  return (
    <Card className="border-border">
      <CardContent className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t.groups.groupName}</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t.groups.descriptionLabel}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t.groups.category}</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder={t.groups.categoryPlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
            className="rounded border-border text-primary focus:ring-[#C8102E]"
          />
          <span className="text-sm text-muted-foreground">{t.groups.privateGroup}</span>
        </label>
        <button
          onClick={() => onSubmit(form)}
          disabled={!form.name || isPending}
          className="ygo-btn-gold w-full justify-center disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t.groups.createBtn}
        </button>
      </CardContent>
    </Card>
  );
}
