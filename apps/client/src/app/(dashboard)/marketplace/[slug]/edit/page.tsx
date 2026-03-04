'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { LISTING_CONDITION_OPTIONS, CITIES } from '@communium/shared';
import {
  useCategoriesTree,
  useListingBySlug,
  useUpdateListing,
} from '@/hooks/marketplace';

export default function EditListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: listing, isLoading } = useListingBySlug(slug);
  const { data: categories } = useCategoriesTree();
  const updateMutation = useUpdateListing(slug);

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
  const [populated, setPopulated] = useState(false);

  // Pre-populate form once listing loads
  useEffect(() => {
    if (listing && !populated) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPrice(listing.price?.toString() || '');
      setCategoryId(listing.categoryId || '');
      setCondition(listing.condition || 'new');
      setCity(listing.city || '');
      setLocation(listing.location || '');
      setTags(listing.tags || []);
      setImageUrls(listing.images || []);
      setPopulated(true);
    }
  }, [listing, populated]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!listing) return;

    if (!title || !description || !price || !categoryId) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le titre, la description, le prix et la catégorie.',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(
      {
        id: listing.id,
        payload: {
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
      },
      {
        onSuccess: () => {
          router.push(`/marketplace/${slug}`);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">Annonce introuvable</p>
        <Link href="/marketplace/my-listings" className="mt-4 text-[#1a237e] hover:underline">
          Retour à mes annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/marketplace/my-listings" className="rounded-lg border p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide">
            Modifier l&apos;annonce
          </h1>
          <p className="text-sm text-gray-500">Modifiez les informations de votre annonce</p>
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: iPhone 15 Pro 256 Go"
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                maxLength={200}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre article en détail..."
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                rows={5}
                maxLength={5000}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{description.length}/5000</p>
            </div>

            {/* Price & Condition */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">État</label>
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

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ville</label>
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-sm bg-[#e8eaf6] px-3 py-1 text-xs font-medium text-[#1a237e] border border-[#c9a730]/30"
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
            href="/marketplace/my-listings"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="ygo-btn-blue px-6 py-2.5 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
