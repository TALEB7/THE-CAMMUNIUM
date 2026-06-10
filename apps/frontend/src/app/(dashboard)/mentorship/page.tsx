'use client';

import { useState } from 'react';
import { useUser } from '@/lib/auth-client';
import { useT } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Star, GraduationCap, Calendar } from 'lucide-react';
import { useMentors, useRequestMentor } from '@/hooks/mentorship/use-mentorship';

type Tab = 'browse' | 'sessions' | 'profile';

const TAB_LABELS: Record<Tab, string> = {
  browse: 'Trouver un mentor',
  sessions: 'Mes sessions',
  profile: 'Mon profil mentor',
};

export default function MentorshipPage() {
  const { user } = useUser();
  const { t } = useT();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');

  const { data: mentors = [], isLoading } = useMentors(search);
  const requestMentor = useRequestMentor();

  const handleRequest = (mentorId: string) => {
    if (!user?.id) return;
    requestMentor.mutate(
      { mentorProfileId: mentorId, menteeId: user.id },
      {
        onSuccess: () => toast({ title: 'Demande envoyée !', description: 'Le mentor recevra votre demande.' }),
        onError: () => toast({ title: 'Erreur', description: 'Impossible d\'envoyer la demande.', variant: 'destructive' }),
      },
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">🎓 {t.mentorshipPage.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trouvez un expert pour accélérer votre croissance</p>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === key
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Browse ── */}
      {tab === 'browse' && (
        <div className="space-y-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, expertise..."
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mentors.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Aucun mentor disponible</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? `Aucun résultat pour "${search}"` : 'Des mentors seront disponibles bientôt'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="border-border hover:border-primary transition-all">
                  <CardContent className="p-5 space-y-4">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {mentor.user.firstName?.[0]}{mentor.user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {mentor.user.firstName} {mentor.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{mentor.headline || 'Mentor'}</p>
                      </div>
                      {mentor.isAvailable && (
                        <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-green-500" title="Disponible" />
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${n <= Math.round(mentor.rating) ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({mentor.totalReviews} avis)</span>
                    </div>

                    {/* Expertise tags */}
                    {mentor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise.slice(0, 3).map((e) => (
                          <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {mentor.yearsExp && <span>{mentor.yearsExp} ans d'exp.</span>}
                      {mentor.hourlyRate && (
                        <span className="font-semibold text-primary">{mentor.hourlyRate} Tks/h</span>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleRequest(mentor.id)}
                      disabled={requestMentor.isPending && requestMentor.variables?.mentorProfileId === mentor.id}
                      className="ygo-btn-gold w-full justify-center disabled:opacity-50"
                    >
                      {requestMentor.isPending && requestMentor.variables?.mentorProfileId === mentor.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : 'Demander un mentorat'}
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sessions ── */}
      {tab === 'sessions' && (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucune session planifiée</p>
            <p className="text-sm text-muted-foreground mt-1">Vos sessions de mentorat apparaîtront ici</p>
          </CardContent>
        </Card>
      )}

      {/* ── Become mentor ── */}
      {tab === 'profile' && (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-primary/40 mb-4" />
            <p className="text-foreground font-semibold text-lg mb-2">Partagez votre expertise</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Devenez mentor et aidez d'autres membres à progresser dans leur domaine
            </p>
            <button className="ygo-btn-gold">Créer mon profil mentor</button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
