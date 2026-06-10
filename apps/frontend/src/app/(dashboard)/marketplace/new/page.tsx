'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useT } from '@/lib/i18n';
import { LISTING_CONDITION_OPTIONS, CITIES } from '@communium/shared';
import { useCategoriesTree, useCreateListing, usePriceSuggestion, useClassifyListing } from '@/hooks/marketplace';

export default function CreateListingPage() {
  const { t } = useT();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('new');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [classifyInput, setClassifyInput] = useState({ title: '', description: '' });
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const { data: categories } = useCategoriesTree();
  const createMutation = useCreateListing();

  // AI — Price suggestion
  const { data: priceSuggestion } = usePriceSuggestion(
    categoryId || undefined,
    condition || undefined,
  );

  // AI — Auto-classify (debounced via state)
  const classifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: classifyResult } = useClassifyListing(
    classifyInput.title,
    classifyInput.description,
  );

  const scheduleClassify = (t: string, d: string) => {
    if (classifyTimer.current) clearTimeout(classifyTimer.current);
    classifyTimer.current = setTimeout(() => {
      setDismissedSuggestion(false);
      setClassifyInput({ title: t, description: d });
    }, 800);
  };

  useEffect(() => () => { if (classifyTimer.current) clearTimeout(classifyTimer.current); }, []);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !price || !categoryId) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le titre, la description, le prix et la catégorie.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(
      {
        title,
        description,
        price: parseFloat(price),
        categoryId,
        condition,
        city: city || undefined,
        location: location || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: (listing: { slug: string }) => {
          router.push(`/marketplace/${listing.slug}`);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/marketplace" className="rounded-lg border p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-primary font-heading tracking-wide">Publier une annonce</h1>
          <p className="text-sm text-muted-foreground">Remplissez les informations de votre annonce</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); scheduleClassify(e.target.value, description); }}
                placeholder="Ex: iPhone 15 Pro 256 Go"
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                maxLength={200}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); scheduleClassify(title, e.target.value); }}
                placeholder="Décrivez votre article en détail..."
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                rows={5}
                maxLength={5000}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/5000</p>
            </div>

            {/* AI Auto-classify suggestion */}
            {classifyResult && !dismissedSuggestion && (
              <div className="rounded-lg border border-primary/30 bg-accent px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-primary">
                      ✨ Suggestion IA — Catégorie détectée : {classifyResult.predicted_category}
                    </p>
                    {classifyResult.suggested_tags.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tags suggérés :{' '}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() => {
                            const newTags = classifyResult.suggested_tags.filter((t) => !tags.includes(t)).slice(0, 10 - tags.length);
                            setTags([...tags, ...newTags]);
                            setDismissedSuggestion(true);
                          }}
                        >
                          {classifyResult.suggested_tags.join(', ')}
                        </button>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedSuggestion(true)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Price & Condition */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  Prix (Dhs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">État</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                >
                  {LISTING_CONDITION_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Price suggestion */}
            {priceSuggestion && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <p className="font-medium text-amber-800">
                  💡 Prix IA suggéré : {priceSuggestion.recommended_price.toLocaleString('fr-MA')} Dhs
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Fourchette estimée : {priceSuggestion.min_price.toLocaleString('fr-MA')} – {priceSuggestion.max_price.toLocaleString('fr-MA')} Dhs
                  {' '}(confiance {Math.round(priceSuggestion.confidence * 100)}%
                  {priceSuggestion.method === 'heuristic' ? ' · estimation' : ' · basé sur le marché'})
                </p>
                <button
                  type="button"
                  className="mt-1.5 text-xs font-medium text-amber-800 underline"
                  onClick={() => setPrice(String(priceSuggestion.recommended_price))}
                >
                  Appliquer ce prix
                </button>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories?.map((cat: any) => (
                  <optgroup key={cat.id} label={`${cat.icon || ''} ${cat.name}`}>
                    {cat.children?.map((child: any) => (
                      <option key={child.id} value={child.id}>
                        {child.icon || ''} {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">Ville</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                >
                  <option value="">Sélectionner une ville</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  Quartier / Zone
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Maârif, Agdal..."
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Photos du produit</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={imageUrls}
              onChange={setImageUrls}
              maxImages={8}
              maxSizeMB={5}
              folder="listings"
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajouter un tag..."
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 10}
                className="rounded-lg bg-muted px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-sm bg-accent px-3 py-1 text-xs font-medium text-primary border border-primary/30"
                  >
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter((tg) => tg !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/marketplace"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="ygo-btn-blue px-6 py-2.5 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Publication...' : 'Publier l\'annonce'}
          </button>
        </div>
      </form>
    </div>
  );
}
