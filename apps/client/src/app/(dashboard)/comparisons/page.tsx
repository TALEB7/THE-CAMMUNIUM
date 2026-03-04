'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitCompareArrows,
  Plus,
  Trash2,
  X,
  Loader2,
  MapPin,
  Star,
  Edit3,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  useComparisonLists,
  useCreateComparisonList,
  useDeleteComparisonList,
  useRenameComparisonList,
  useRemoveComparisonItem,
} from '@/hooks/comparisons';

export default function ComparisonsPage() {
  const { userId } = useAuth();
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { t } = useT();

  // Queries & Mutations via hooks
  const { data: lists, isLoading } = useComparisonLists(userId);
  const createMutation = useCreateComparisonList(userId!);
  const deleteMutation = useDeleteComparisonList(userId!);
  const removeItemMutation = useRemoveComparisonItem(userId!);
  const renameMutation = useRenameComparisonList(userId!);

  const activeList = lists?.find((l: any) => l.id === selectedList);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a237e] font-heading">
            {t.comparisonsPage.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.comparisonsPage.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nom de la liste..."
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
          />
          <button
            onClick={() => {
              createMutation.mutate(newListName || 'Nouvelle comparaison', {
                onSuccess: () => setNewListName(''),
              });
            }}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] transition"
          >
            <Plus className="h-4 w-4" />
            Créer
          </button>
        </div>
      </div>

      {/* Lists */}
      {!lists?.length ? (
        <Card className="border-[#d4c088]/40">
          <CardContent className="p-12 text-center">
            <GitCompareArrows className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Aucune liste de comparaison</h3>
            <p className="text-sm text-gray-400 mt-1">
              Créez une liste et ajoutez des annonces depuis le marketplace pour les comparer
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* List selector sidebar */}
          <div className="space-y-2">
            {lists.map((list: any) => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedList === list.id
                    ? 'border-[#c9a730] bg-[#f5f0e1]'
                    : 'border-gray-100 hover:border-[#d4c088]'
                }`}
              >
                <div className="flex items-center justify-between">
                  {renamingId === list.id ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        renameMutation.mutate(
                          { id: list.id, name: renameValue },
                          { onSuccess: () => setRenamingId(null) },
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameMutation.mutate(
                            { id: list.id, name: renameValue },
                            { onSuccess: () => setRenamingId(null) },
                          );
                        }
                      }}
                      className="text-sm font-semibold text-[#1a237e] bg-transparent border-b border-[#c9a730] outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="font-semibold text-sm text-[#1a237e]">{list.name}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(list.id);
                        setRenameValue(list.name);
                      }}
                      className="p-1 text-gray-400 hover:text-[#1a237e] rounded"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(list.id, {
                          onSuccess: () => {
                            if (selectedList === list.id) setSelectedList(null);
                          },
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{list.items?.length || 0} article(s)</p>
              </button>
            ))}
          </div>

          {/* Comparison view */}
          <div className="lg:col-span-3">
            {!activeList ? (
              <Card className="border-[#d4c088]/40">
                <CardContent className="p-12 text-center">
                  <GitCompareArrows className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Sélectionnez une liste</h3>
                  <p className="text-sm text-gray-400 mt-1">Choisissez une liste à gauche pour voir la comparaison</p>
                </CardContent>
              </Card>
            ) : activeList.items?.length === 0 ? (
              <Card className="border-[#d4c088]/40">
                <CardContent className="p-12 text-center">
                  <Plus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Liste vide</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Ajoutez des annonces depuis le{' '}
                    <Link href="/marketplace" className="text-[#c9a730] underline">
                      marketplace
                    </Link>{' '}
                    pour commencer la comparaison
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 p-3 bg-gray-50 rounded-tl-lg">
                        Critère
                      </th>
                      {activeList.items.map((item: any) => (
                        <th key={item.id} className="text-center p-3 bg-gray-50 min-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#1a237e] truncate max-w-[160px]">
                              {item.listing?.title}
                            </span>
                            <button
                              onClick={() => removeItemMutation.mutate({ listId: activeList.id, itemId: item.id })}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Image */}
                    <tr className="border-t border-gray-100">
                      <td className="text-xs font-medium text-gray-500 p-3">Image</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center">
                          {item.listing?.images?.[0] ? (
                            <img
                              src={item.listing.images[0]}
                              alt=""
                              className="w-24 h-24 object-cover rounded-lg mx-auto"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    {/* Price */}
                    <tr className="border-t border-gray-100 bg-[#faf8f0]">
                      <td className="text-xs font-medium text-gray-500 p-3">Prix</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center">
                          <span className="font-bold text-[#c9a730]">
                            {item.listing?.price?.toLocaleString('fr-FR')} MAD
                          </span>
                        </td>
                      ))}
                    </tr>
                    {/* Category */}
                    <tr className="border-t border-gray-100">
                      <td className="text-xs font-medium text-gray-500 p-3">Catégorie</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center">
                          <Badge variant="outline" className="text-xs border-[#d4c088]">
                            {item.listing?.category?.name || '-'}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    {/* City */}
                    <tr className="border-t border-gray-100 bg-[#faf8f0]">
                      <td className="text-xs font-medium text-gray-500 p-3">Ville</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center text-sm text-gray-600">
                          {item.listing?.city ? (
                            <span className="flex items-center justify-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.listing.city}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      ))}
                    </tr>
                    {/* Condition */}
                    <tr className="border-t border-gray-100">
                      <td className="text-xs font-medium text-gray-500 p-3">État</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center text-sm text-gray-600">
                          {item.listing?.condition || '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Seller */}
                    <tr className="border-t border-gray-100 bg-[#faf8f0]">
                      <td className="text-xs font-medium text-gray-500 p-3">Vendeur</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center text-sm text-gray-600">
                          {item.listing?.seller
                            ? `${item.listing.seller.firstName} ${item.listing.seller.lastName}`
                            : '-'}
                        </td>
                      ))}
                    </tr>
                    {/* Views */}
                    <tr className="border-t border-gray-100">
                      <td className="text-xs font-medium text-gray-500 p-3">Vues</td>
                      {activeList.items.map((item: any) => (
                        <td key={item.id} className="p-3 text-center text-sm text-gray-600">
                          {item.listing?.views ?? 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
