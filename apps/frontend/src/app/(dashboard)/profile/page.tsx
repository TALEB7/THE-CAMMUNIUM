'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, MapPin, Mail, Phone, Briefcase, Building2, Calendar, 
  FileText, ShoppingBag, Coins, Image as ImageIcon, Film, Music, 
  FolderOpen, Globe, Users, Trophy, Gamepad2, GraduationCap, 
  MessageSquare, Heart, MessageCircle, AlertCircle, Download, Award
} from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media-url';
import KycStatusBadge from '@/components/kyc/KycStatusBadge';

type TabType = 'profile' | 'timeline' | 'photos' | 'videos' | 'music' | 'documents' | 'marketplace' | 'tks';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { userId } = useAuth();
  const user = session?.user as any;
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Fetch complete profile info
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles/me').then((res) => res.data),
  });

  // Fetch KYC status
  const { data: kyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => api.get('/kyc/status').then((res) => res.data),
  });

  // Fetch User's Posts for Timeline
  const { data: userPostsData } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: () => api.get(`/forums/posts/user/${profile.id}`).then((res) => res.data),
    enabled: activeTab === 'timeline' && !!profile?.id,
  });

  // Fetch User's Listings for Marketplace
  const { data: userListingsData } = useQuery({
    queryKey: ['user-listings', profile?.id],
    queryFn: () => api.get('/marketplace/listings', { params: { sellerId: profile.id } }).then((res) => res.data),
    enabled: activeTab === 'marketplace' && !!profile?.id,
  });

  // Fetch User's Token Transactions for Tks
  const { data: userTransactions } = useQuery({
    queryKey: ['user-transactions'],
    queryFn: () => api.get('/tokens/transactions').then((res) => res.data),
    enabled: activeTab === 'tks',
  });

  const isBusiness = profile?.accountType === 'business' || profile?.accountType === 'company_creation';
  const displayName = isBusiness ? (profile?.companyName || 'Entreprise') : `${profile?.firstName || user?.firstName || ''} ${profile?.lastName || user?.lastName || ''}`.trim() || 'Utilisateur';

  const formatCreationDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // --- Sub-Tabs Bar ---
  const tabsList: { id: TabType; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profil', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: MessageSquare },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'videos', label: 'Vidéos', icon: Film },
    { id: 'music', label: 'Musique', icon: Music },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'tks', label: 'Tks', icon: Coins },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      
      {/* Profile Header */}
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-card/60 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-red-500 to-pink-500" />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative h-24 w-24 shrink-0 rounded-full border-4 border-primary/30 overflow-hidden bg-accent flex items-center justify-center shadow-lg">
                {getMediaUrl(profile?.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaUrl(profile.avatarUrl)!}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-primary font-heading">
                    {displayName[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-foreground tracking-tight font-heading flex items-center justify-center sm:justify-start gap-2">
                  {displayName}
                  {profile?.isVerified && (
                    <Badge className="bg-green-100 text-green-800 border-none px-2 text-[10px]">Vérifié</Badge>
                  )}
                </h1>
                <p className="text-sm font-semibold text-primary font-heading">
                  {isBusiness ? (profile?.activities || 'Secteur non renseigné') : (profile?.profession || 'Profession non renseignée')}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge variant={isBusiness ? 'default' : 'secondary'}>
                    {profile?.accountType === 'company_creation' ? "Création d'entreprise" : isBusiness ? 'Business' : 'Personnel'}
                  </Badge>
                  {kyc && kyc.status && kyc.status !== 'none' && (
                    <KycStatusBadge status={kyc.status} type={kyc.type || profile?.accountType} />
                  )}
                  {!isBusiness && (!kyc || kyc.status === 'none' || kyc.status === 'rejected') && (
                    <Link
                      href="/onboarding/verify/personal"
                      className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition"
                    >
                      Vérifier mon identité
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={isBusiness ? "/profile/edit?type=business" : "/profile/edit?type=personal"}
              className="flex items-center gap-2 rounded-full bg-primary text-black font-bold px-5 py-2 text-xs hover:brightness-110 shadow-md transition-all shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max pb-px">
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-heading text-xs font-extrabold tracking-wide uppercase transition-all
                  ${isActive 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- TAB CONTENT PANEL --- */}
      <div className="grid grid-cols-1 gap-6">

        {/* ==================== 1. PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column (Main Profile Content - 2/3 width) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* ABOUT Section */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">About</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {profile?.bio || (isBusiness 
                      ? "Aucune présentation d'entreprise rédigée pour le moment." 
                      : "Aucune biographie rédigée pour le moment.")}
                  </p>
                </CardContent>
              </Card>

              {/* PERSONAL: Education, Skills, Additional Info */}
              {!isBusiness && (
                <>
                  {/* Education & Certificates */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Éducation & Certificats</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {profile?.education && (profile.education as any[]).length > 0 ? (
                        <div className="space-y-4">
                          {(profile.education as any[]).map((edu: any, i: number) => (
                            <div key={i} className="border-l-2 border-primary pl-4 py-0.5">
                              <h4 className="font-bold text-sm text-foreground">{edu.degree}</h4>
                              <p className="text-xs text-muted-foreground">{edu.school}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{edu.startDate} - {edu.endDate || 'Présent'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucune formation enregistrée.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Experiences */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Expériences professionnelles</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {profile?.workHistory && (profile.workHistory as any[]).length > 0 ? (
                        <div className="space-y-4">
                          {(profile.workHistory as any[]).map((job: any, i: number) => (
                            <div key={i} className="border-l-2 border-primary pl-4 py-0.5">
                              <h4 className="font-bold text-sm text-foreground">{job.title}</h4>
                              <p className="text-xs text-muted-foreground">{job.company}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{job.startDate} - {job.endDate || 'Présent'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucune expérience enregistrée.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Technical & Soft Skills */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Compétences</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-2">Technical Skills</h4>
                        {profile?.technicalSkills && profile.technicalSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.technicalSkills.map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[10px] py-0.5 font-semibold">{s}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Aucune compétence technique ajoutée.</p>
                        )}
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-2">Soft Skills</h4>
                        {profile?.softSkills && (profile.softSkills as any[]).length > 0 ? (
                          <div className="space-y-2">
                            {(profile.softSkills as any[]).map((s: any, idx: number) => (
                              <div key={idx} className="text-xs leading-relaxed">
                                <span className="font-bold text-foreground">{s.category} : </span>
                                <span className="text-muted-foreground">{Array.isArray(s.skills) ? s.skills.join(' | ') : s.skills}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Aucune compétence comportementale ajoutée.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information: Languages, Sports, Gaming */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Informations complémentaires</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {/* Languages */}
                      {profile?.languages && (profile.languages as any[]).length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Langues</h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            {(profile.languages as any[]).map((l: any) => `${l.language} (${l.level})`).join(' - ')}
                          </p>
                        </div>
                      )}
                      
                      {/* Sports */}
                      {profile?.sports && profile.sports.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" /> Sports</h4>
                          <p className="text-xs text-muted-foreground font-medium">{profile.sports.join(' - ')}</p>
                        </div>
                      )}

                      {/* Gaming */}
                      {profile?.gaming && profile.gaming.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5 flex items-center gap-1.5"><Gamepad2 className="h-3.5 w-3.5 text-primary" /> Gaming</h4>
                          <p className="text-xs text-muted-foreground font-medium">{profile.gaming.join(' - ')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* BUSINESS: Licenses, Projects, Equipment, Human Resources, Additional Info */}
              {isBusiness && (
                <>
                  {/* Licenses & Certifications */}
                  {(profile?.licenses?.length > 0 || profile?.certifications?.length > 0) && (
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Licences & Certifications</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {profile?.licenses && profile.licenses.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-foreground">Licences</p>
                            <p className="text-xs text-muted-foreground font-semibold mt-1">{profile.licenses.join(' | ')}</p>
                          </div>
                        )}
                        {profile?.certifications && profile.certifications.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-foreground">Certifications ISO & Outils</p>
                            <p className="text-xs text-muted-foreground font-semibold mt-1">{profile.certifications.join(' | ')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Projects */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Projets de l'entreprise</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {profile?.projects && (profile.projects as any[]).length > 0 ? (
                        <div className="space-y-4">
                          {(profile.projects as any[]).map((proj: any, i: number) => (
                            <div key={i} className="border-l-2 border-primary pl-4 py-0.5">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-foreground">{proj.name}</h4>
                                {proj.url && (
                                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                                    Visiter
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucun projet ajouté pour le moment.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Technical Equipments & Stuff */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Matériel & Équipements</CardTitle></CardHeader>
                    <CardContent>
                      {profile?.technicalEquipment && (profile.technicalEquipment as any[]).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(profile.technicalEquipment as any[]).map((eq: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs py-1 px-3 font-semibold">
                              {eq.count} {eq.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucun matériel ou équipement référencé.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Human Resources / Stuff */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Ressources Humaines</CardTitle></CardHeader>
                    <CardContent>
                      {profile?.humanResources && (profile.humanResources as any[]).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(profile.humanResources as any[]).map((hr: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs py-1 px-3 font-semibold border-primary/30 text-primary">
                              {hr.count} {hr.role}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucune distribution d'effectif enregistrée.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Business Info: Events, online meetings, training */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Agenda & Formations</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {/* Events */}
                      {profile?.events && (profile.events as any[]).length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5">Événements planifiés</h4>
                          <ul className="space-y-1">
                            {(profile.events as any[]).map((ev: any, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">{ev.title}</span> : le {ev.date} à {ev.location}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Online Meetings */}
                      {profile?.onlineMeetings && (profile.onlineMeetings as any[]).length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5">Meetings en ligne</h4>
                          <ul className="space-y-1">
                            {(profile.onlineMeetings as any[]).map((mt: any, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">{mt.title}</span> : le {mt.date} via {mt.platform}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Training Programs */}
                      {profile?.trainingPrograms && (profile.trainingPrograms as any[]).length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground mb-1.5">Formations proposées</h4>
                          <ul className="space-y-1">
                            {(profile.trainingPrograms as any[]).map((tp: any, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">{tp.title}</span> : le {tp.date} à {tp.location}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Interests Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    {isBusiness ? "Secteurs d'intérêt" : "Centres d'intérêt"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isBusiness ? (
                    profile?.sectorsOfInterests && profile.sectorsOfInterests.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.sectorsOfInterests.map((interest: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-bold">{interest}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun secteur d'intérêt ajouté.</p>
                    )
                  ) : (
                    profile?.interests && profile.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.interests.map((interest: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-bold">{interest}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun intérêt ajouté.</p>
                    )
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column (Side Card Info - 1/3 width) */}
            <div className="space-y-6">
              
              {/* Sidebar Info Card */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Fiche d'identité</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-xs font-semibold text-foreground/80">
                  {isBusiness ? (
                    <>
                      <InfoRowSidebar label="Création" value={profile?.creationDate ? formatCreationDate(profile.creationDate) : 'Non renseignée'} />
                      <InfoRowSidebar label="Siège social" value={profile?.headquarters || profile?.city || 'Non renseigné'} />
                      {profile?.subsidiaries && profile.subsidiaries.length > 0 && (
                        <InfoRowSidebar label="Filiales" value={profile.subsidiaries.join(', ')} />
                      )}
                      <InfoRowSidebar label="Contact" value={profile?.phone || 'Non renseigné'} />
                      <InfoRowSidebar label="Email" value={profile?.email || 'Non renseigné'} />
                      {profile?.website && (
                        <InfoRowSidebar label="Site Web" value={
                          <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {profile.website}
                          </a>
                        } />
                      )}
                      <div className="border-t border-border pt-3 space-y-2">
                        <InfoRowSidebar label="N° RC" value={profile?.rc || '—'} />
                        <InfoRowSidebar label="N° ICE" value={profile?.ice || '—'} />
                        <InfoRowSidebar label="N° IF" value={profile?.ifNumber || '—'} />
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRowSidebar label="Anniversaire" value={profile?.birthday ? formatCreationDate(profile.birthday) : 'Non renseigné'} />
                      <InfoRowSidebar label="Originaire de" value={profile?.birthplace || 'Non renseigné'} />
                      <InfoRowSidebar label="Réside à" value={profile?.city ? `${profile.city}, ${profile.country || 'Maroc'}` : 'Non renseigné'} />
                      <InfoRowSidebar label="Contact" value={profile?.phone || 'Non renseigné'} />
                      <InfoRowSidebar label="Email" value={profile?.email || user?.email} />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact card */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Adresse postale</CardTitle></CardHeader>
                <CardContent className="text-xs font-medium text-muted-foreground leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      {profile?.address || "Aucune adresse postale renseignée."}
                      {profile?.city && <span className="block mt-1 font-bold text-foreground">{profile.city}, {profile.country || "Maroc"}</span>}
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {/* ==================== 2. TIMELINE TAB ==================== */}
        {activeTab === 'timeline' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">Fil d'actualité</h3>
            {userPostsData?.posts && userPostsData.posts.length > 0 ? (
              userPostsData.posts.map((post: any) => (
                <Card key={post.id} className="hover:border-primary/40 transition">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent overflow-hidden shrink-0 flex items-center justify-center border">
                        {profile?.avatarUrl ? (
                          <img src={getMediaUrl(profile.avatarUrl)!} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{displayName[0]}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground leading-tight">{displayName}</h4>
                        <p className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-foreground hover:text-primary transition font-heading">
                        <Link href={`/forums/posts/${post.id}`}>{post.title}</Link>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((t: string) => (
                          <span key={t} className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full font-bold">#{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 border-t border-border/40 pt-2 text-[10px] font-bold text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post._count?.likes || 0} Likes</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post._count?.comments || 0} Commentaires</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-semibold">Aucune publication sur le fil d'actualité pour le moment.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. MARKETPLACE TAB ==================== */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">Annonces publiées</h3>
            {userListingsData?.data && userListingsData.data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userListingsData.data.map((listing: any) => (
                  <Card key={listing.id} className="overflow-hidden hover:border-primary/40 transition">
                    <div className="h-40 bg-accent relative flex items-center justify-center border-b overflow-hidden">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={getMediaUrl(listing.images[0])!} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="absolute top-2 right-2 bg-primary text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        {listing.price} MAD
                      </div>
                    </div>
                    <CardContent className="pt-3 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary">{listing.category?.name}</span>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1 hover:text-primary transition">
                        <Link href={`/marketplace/listings/${listing.slug}`}>{listing.title}</Link>
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{listing.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[9px] text-muted-foreground font-bold">
                        <span>État: {listing.condition === 'new' ? 'Neuf' : listing.condition === 'like_new' ? 'Comme neuf' : 'Bon état'}</span>
                        <span>{listing.city}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-semibold">Aucune annonce en ligne dans le Marketplace.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. TKS TOKENS TAB ==================== */}
        {activeTab === 'tks' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Wallet Overview */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20">
              <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                    T
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Communium Tokens Wallet</h3>
                    <p className="text-xs text-muted-foreground">Historique de vos gains et dépenses de tokens Tks</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-3xl font-black text-primary font-heading leading-none">{profile?.tksBalance ?? 0} Tks</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Solde disponible</p>
                </div>
              </CardContent>
            </Card>

            {/* Transactions History */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> Historique des transactions</CardTitle></CardHeader>
              <CardContent>
                {userTransactions && userTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-2">Motif</th>
                          <th className="py-2">Date</th>
                          <th className="py-2 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-xs">
                        {userTransactions.map((tx: any) => {
                          const isNegative = tx.amount < 0;
                          return (
                            <tr key={tx.id}>
                              <td className="py-3 font-semibold text-foreground">{tx.reason}</td>
                              <td className="py-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                              <td className={`py-3 text-right font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                                {isNegative ? '' : '+'}{tx.amount} Tks
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">Aucune transaction enregistrée.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== 5. MEDIA TABS ==================== */}
        {(activeTab === 'photos' || activeTab === 'videos' || activeTab === 'music' || activeTab === 'documents') && (
          <MediaTab type={activeTab} userId={userId} />
        )}

      </div>
    </div>
  );
}


// Helper component for Sidebar Identity values
function InfoRowSidebar({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-bold">{value}</span>
    </div>
  );
}

// ─── MediaTab — Real media grid from ProfileMedia API ────────────────────
function MediaTab({ type, userId }: { type: string; userId?: string | null }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['profile-media', 'me', type],
    queryFn: () => api.get(`/profile-media/me?type=${type}`).then((r) => r.data),
    enabled: !!userId,
    staleTime: 30000,
  });

  const icons: Record<string, any> = {
    photos: ImageIcon, videos: Film, music: Music, documents: FolderOpen,
  };
  const Icon = icons[type] || FolderOpen;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-xl max-w-xl mx-auto">
        <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
          {type === 'photos' ? 'Aucune photo' : type === 'videos' ? 'Aucune vidéo' : type === 'music' ? 'Aucune musique' : 'Aucun document'}
        </h4>
        <p className="text-xs text-muted-foreground font-semibold mt-1">
          Publiez depuis la page d'accueil pour remplir cet espace.
        </p>
        <Link href="/feed" className="mt-3 inline-block text-xs text-primary font-bold hover:underline">
          Aller publier →
        </Link>
      </div>
    );
  }

  // Photos grid
  if (type === 'photos') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {items.map((item: any) => (
          <div key={item.id} className="relative group aspect-square overflow-hidden rounded-xl border border-border bg-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getMediaUrl(item.url) || item.url}
              alt={item.name || 'Photo'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {item.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Videos grid
  if (type === 'videos') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-xl overflow-hidden border border-border bg-card">
            <video
              src={getMediaUrl(item.url) || item.url}
              controls
              className="w-full max-h-56 bg-black"
            />
            {item.caption && (
              <p className="text-xs text-muted-foreground px-3 py-2 truncate">{item.caption}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Music list
  if (type === 'music') {
    return (
      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent transition">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Music className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.name || 'Audio'}</p>
              {item.caption && <p className="text-xs text-muted-foreground truncate">{item.caption}</p>}
            </div>
            <audio src={getMediaUrl(item.url) || item.url} controls className="h-8 max-w-[180px]" />
          </div>
        ))}
      </div>
    );
  }

  // Documents list
  return (
    <div className="space-y-2">
      {items.map((item: any) => (
        <a
          key={item.id}
          href={getMediaUrl(item.url) || item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent transition group"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{item.name || 'Document'}</p>
            {item.caption && <p className="text-xs text-muted-foreground truncate">{item.caption}</p>}
          </div>
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
        </a>
      ))}
    </div>
  );
}
