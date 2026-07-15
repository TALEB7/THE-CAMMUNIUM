'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { INTEREST_CATEGORIES } from '@communium/shared';
import { AvatarCropUpload } from '@/components/profile/avatar-crop-upload';
import Link from 'next/link';

interface WorkHistoryEntry { title: string; company: string; startDate: string; endDate: string; }
interface EducationEntry { degree: string; school: string; startDate: string; endDate: string; }
interface SoftSkillEntry { category: string; skills: string; }
interface LanguageEntry { language: string; level: string; }
interface EquipmentEntry { name: string; count: number; }
interface HREntry { role: string; count: number; }
interface EventEntry { title: string; date: string; location: string; }
interface MeetingEntry { title: string; date: string; platform: string; }
interface TrainingEntry { title: string; date: string; location: string; }

export default function EditProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { t } = useT();
  const router = useRouter();
 
  const [isBusinessProfile, setIsBusinessProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
 
  // Text fields state
  const [fields, setFields] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Personal list states
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [softSkills, setSoftSkills] = useState<SoftSkillEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);

  // Business list states
  const [technicalEquipment, setTechnicalEquipment] = useState<EquipmentEntry[]>([]);
  const [humanResources, setHumanResources] = useState<HREntry[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [onlineMeetings, setOnlineMeetings] = useState<MeetingEntry[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingEntry[]>([]);
 
  // Load existing profile data
  useEffect(() => {
    api.get('/profiles/me')
      .then((r) => {
        const p = r.data;
        const isBiz = p.accountType === 'business' || p.accountType === 'company_creation';
        setIsBusinessProfile(isBiz);
        
        setAvatarUrl(p.avatarUrl || '');
        setSelectedInterests(p.interests || []);
        
        // Pre-fill all text fields from profile
        const f: Record<string, string> = {};
        const textFields = isBiz
          ? ['companyName', 'rc', 'creationDate', 'phone', 'email', 'country', 'city', 'address', 'activities', 'ice', 'ifNumber', 'bio', 'headquarters', 'website']
          : ['firstName', 'lastName', 'birthday', 'identityType', 'identityNumber', 'phone', 'email', 'country', 'city', 'address', 'profession', 'bio', 'birthplace'];
        
        textFields.forEach((k) => { if (p[k] != null) f[k] = String(p[k]); });

        // Pre-fill comma-separated fields
        if (isBiz) {
          f.licenses = (p.licenses || []).join(', ');
          f.certifications = (p.certifications || []).join(', ');
          f.subsidiaries = (p.subsidiaries || []).join(', ');
          f.sectorsOfInterests = (p.sectorsOfInterests || []).join(', ');
          
          setTechnicalEquipment(p.technicalEquipment || []);
          setHumanResources(p.humanResources || []);
          setEvents(p.events || []);
          setOnlineMeetings(p.onlineMeetings || []);
          setTrainingPrograms(p.trainingPrograms || []);
        } else {
          f.technicalSkills = (p.technicalSkills || []).join(', ');
          f.sports = (p.sports || []).join(', ');
          f.gaming = (p.gaming || []).join(', ');
          
          setWorkHistory(p.workHistory || []);
          setEducation(p.education || []);
          
          // Map soft skills {category, skills: []} to editable {category, skills: string}
          const mappedSoft = (p.softSkills || []).map((s: any) => ({
            category: s.category || '',
            skills: Array.isArray(s.skills) ? s.skills.join(', ') : String(s.skills || ''),
          }));
          setSoftSkills(mappedSoft);
          setLanguages(p.languages || []);
        }

        setFields(f);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const set = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  // Helper functions for dynamic list additions/removals
  const addWorkEntry = () => setWorkHistory([...workHistory, { title: '', company: '', startDate: '', endDate: '' }]);
  const removeWorkEntry = (i: number) => setWorkHistory(workHistory.filter((_, idx) => idx !== i));
  const updateWorkEntry = (i: number, key: keyof WorkHistoryEntry, val: string) => {
    const next = [...workHistory];
    next[i][key] = val;
    setWorkHistory(next);
  };

  const addEduEntry = () => setEducation([...education, { degree: '', school: '', startDate: '', endDate: '' }]);
  const removeEduEntry = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEduEntry = (i: number, key: keyof EducationEntry, val: string) => {
    const next = [...education];
    next[i][key] = val;
    setEducation(next);
  };

  const addSoftEntry = () => setSoftSkills([...softSkills, { category: '', skills: '' }]);
  const removeSoftEntry = (i: number) => setSoftSkills(softSkills.filter((_, idx) => idx !== i));
  const updateSoftEntry = (i: number, key: keyof SoftSkillEntry, val: string) => {
    const next = [...softSkills];
    next[i][key] = val;
    setSoftSkills(next);
  };

  const addLangEntry = () => setLanguages([...languages, { language: '', level: '' }]);
  const removeLangEntry = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i));
  const updateLangEntry = (i: number, key: keyof LanguageEntry, val: string) => {
    const next = [...languages];
    next[i][key] = val;
    setLanguages(next);
  };

  const addEquipEntry = () => setTechnicalEquipment([...technicalEquipment, { name: '', count: 0 }]);
  const removeEquipEntry = (i: number) => setTechnicalEquipment(technicalEquipment.filter((_, idx) => idx !== i));
  const updateEquipEntry = (i: number, key: keyof EquipmentEntry, val: any) => {
    const next = [...technicalEquipment];
    (next[i] as any)[key] = key === 'count' ? Number(val) : val;
    setTechnicalEquipment(next);
  };

  const addHREntry = () => setHumanResources([...humanResources, { role: '', count: 0 }]);
  const removeHREntry = (i: number) => setHumanResources(humanResources.filter((_, idx) => idx !== i));
  const updateHREntry = (i: number, key: keyof HREntry, val: any) => {
    const next = [...humanResources];
    (next[i] as any)[key] = key === 'count' ? Number(val) : val;
    setHumanResources(next);
  };

  const addEventEntry = () => setEvents([...events, { title: '', date: '', location: '' }]);
  const removeEventEntry = (i: number) => setEvents(events.filter((_, idx) => idx !== i));
  const updateEventEntry = (i: number, key: keyof EventEntry, val: string) => {
    const next = [...events];
    next[i][key] = val;
    setEvents(next);
  };

  const addMeetingEntry = () => setOnlineMeetings([...onlineMeetings, { title: '', date: '', platform: 'ZOOM' }]);
  const removeMeetingEntry = (i: number) => setOnlineMeetings(onlineMeetings.filter((_, idx) => idx !== i));
  const updateMeetingEntry = (i: number, key: keyof MeetingEntry, val: string) => {
    const next = [...onlineMeetings];
    next[i][key] = val;
    setOnlineMeetings(next);
  };

  const addTrainingEntry = () => setTrainingPrograms([...trainingPrograms, { title: '', date: '', location: '' }]);
  const removeTrainingEntry = (i: number) => setTrainingPrograms(trainingPrograms.filter((_, idx) => idx !== i));
  const updateTrainingEntry = (i: number, key: keyof TrainingEntry, val: string) => {
    const next = [...trainingPrograms];
    next[i][key] = val;
    setTrainingPrograms(next);
  };

  const toggleInterest = (interest: string) =>
    setSelectedInterests((prev) => prev.includes(interest) ? prev.filter((x) => x !== interest) : [...prev, interest]);

  // Parse comma-separated strings to array of trimmed values
  const parseCommaArray = (str?: string) => {
    if (!str) return [];
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Build API payload
    const payload: Record<string, any> = {};
    
    // Copy all text fields
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        // Exclude internal comma fields from direct string copy
        if (!['technicalSkills', 'sports', 'gaming', 'licenses', 'certifications', 'subsidiaries', 'sectorsOfInterests'].includes(k)) {
          payload[k] = v;
        }
      }
    });

    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (selectedInterests.length > 0) payload.interests = selectedInterests;

    // Apply arrays & dynamic list maps
    if (isBusinessProfile) {
      payload.accountType = 'business';
      payload.licenses = parseCommaArray(fields.licenses);
      payload.certifications = parseCommaArray(fields.certifications);
      payload.subsidiaries = parseCommaArray(fields.subsidiaries);
      payload.sectorsOfInterests = parseCommaArray(fields.sectorsOfInterests);

      if (technicalEquipment.length > 0) payload.technicalEquipment = technicalEquipment.filter((x) => x.name);
      if (humanResources.length > 0) payload.humanResources = humanResources.filter((x) => x.role);
      if (events.length > 0) payload.events = events.filter((x) => x.title);
      if (onlineMeetings.length > 0) payload.onlineMeetings = onlineMeetings.filter((x) => x.title);
      if (trainingPrograms.length > 0) payload.trainingPrograms = trainingPrograms.filter((x) => x.title);
    } else {
      payload.accountType = 'personal';
      payload.technicalSkills = parseCommaArray(fields.technicalSkills);
      payload.sports = parseCommaArray(fields.sports);
      payload.gaming = parseCommaArray(fields.gaming);

      if (workHistory.length > 0) payload.workHistory = workHistory.filter((x) => x.title && x.company);
      if (education.length > 0) payload.education = education.filter((x) => x.degree && x.school);
      
      // Structure softSkills {category, skills: string[]} for API validation compatibility
      if (softSkills.length > 0) {
        payload.softSkills = softSkills
          .filter((x) => x.category)
          .map((s) => ({
            category: s.category,
            skills: s.skills.split(',').map((x) => x.trim()).filter(Boolean),
          }));
      }
      if (languages.length > 0) payload.languages = languages.filter((x) => x.language && x.level);
    }

    try {
      await api.put('/profiles/me', payload);
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const status = err?.response?.status;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || `Erreur ${status || ''} lors de la sauvegarde.`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      
      {/* Back button */}
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition uppercase tracking-wide">
        <ArrowLeft className="h-4 w-4" /> Retour au profil
      </Link>

      <div>
        <h1 className="text-2xl font-black text-foreground tracking-wide font-heading">
          {isBusinessProfile ? 'Modifier le profil Business' : 'Modifier le profil Personnel'}
        </h1>
        <p className="text-muted-foreground text-xs font-semibold mt-0.5">Complétez ou ajustez les détails ci-dessous.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Avatar Crop / Upload Card */}
        <Card>
          <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photo de profil</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <AvatarCropUpload
              currentUrl={avatarUrl}
              onUploadComplete={(url) => setAvatarUrl(url)}
            />
          </CardContent>
        </Card>

        {/* ===== PERSONAL FIELDS ===== */}
        {!isBusinessProfile && (
          <>
            {/* Identity Card */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identité & Bio</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Prénom">
                  <input value={fields.firstName || ''} onChange={(e) => set('firstName', e.target.value)} className="form-input text-xs" placeholder="Prénom" />
                </FormField>
                <FormField label="Nom">
                  <input value={fields.lastName || ''} onChange={(e) => set('lastName', e.target.value)} className="form-input text-xs" placeholder="Nom" />
                </FormField>
                <FormField label="Profession / Titre">
                  <input value={fields.profession || ''} onChange={(e) => set('profession', e.target.value)} className="form-input text-xs" placeholder="Ex: Chairman, CEO & Founder" />
                </FormField>
                <FormField label="Date de naissance">
                  <input value={fields.birthday || ''} onChange={(e) => set('birthday', e.target.value)} type="date" className="form-input text-xs" />
                </FormField>
                <FormField label="Présentation / Bio" className="sm:col-span-2">
                  <textarea value={fields.bio || ''} onChange={(e) => set('bio', e.target.value)} rows={4} className="form-input text-xs resize-none" placeholder="Rédigez votre biographie ici..." />
                </FormField>
              </CardContent>
            </Card>

            {/* Verification Info */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vérification d'identité (KYC)</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Type d'identité">
                  <select value={fields.identityType || 'cin'} onChange={(e) => set('identityType', e.target.value)} className="form-input text-xs">
                    <option value="cin">CIN</option>
                    <option value="passport">Passeport</option>
                  </select>
                </FormField>
                <FormField label="Numéro d'identité">
                  <input value={fields.identityNumber || ''} onChange={(e) => set('identityNumber', e.target.value)} className="form-input text-xs" placeholder="Ex: AB123456" />
                </FormField>
              </CardContent>
            </Card>

            {/* Location & Contact Info */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coordonnées & Origine</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input value={fields.email || ''} onChange={(e) => set('email', e.target.value)} type="email" className="form-input text-xs" placeholder="Email de contact" />
                </FormField>
                <FormField label="Téléphone">
                  <input value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} className="form-input text-xs" placeholder="Ex: +212 664 981 880" />
                </FormField>
                <FormField label="Ville d'origine (From)">
                  <input value={fields.birthplace || ''} onChange={(e) => set('birthplace', e.target.value)} className="form-input text-xs" placeholder="Ex: Tangier" />
                </FormField>
                <FormField label="Ville de résidence (Live in)">
                  <input value={fields.city || ''} onChange={(e) => set('city', e.target.value)} className="form-input text-xs" placeholder="Ex: Toronto" />
                </FormField>
                <FormField label="Pays">
                  <select value={fields.country || 'Maroc'} onChange={(e) => set('country', e.target.value)} className="form-input text-xs">
                    {['Maroc','Canada','France','Belgique','USA','Suisse'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Adresse complète" className="sm:col-span-2">
                  <input value={fields.address || ''} onChange={(e) => set('address', e.target.value)} className="form-input text-xs" placeholder="Adresse complète" />
                </FormField>
              </CardContent>
            </Card>

            {/* Education & Certificates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Éducation & Certificats</CardTitle>
                <button type="button" onClick={addEduEntry} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.length === 0 && <p className="text-xs text-muted-foreground">Aucune formation ajoutée.</p>}
                {education.map((edu, i) => (
                  <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 relative bg-muted/20">
                    <input value={edu.degree} onChange={(e) => updateEduEntry(i, 'degree', e.target.value)} className="form-input text-xs" placeholder="Diplôme ou Certificat (ex: Self Taught)" />
                    <input value={edu.school} onChange={(e) => updateEduEntry(i, 'school', e.target.value)} className="form-input text-xs" placeholder="École ou Établissement" />
                    <input value={edu.startDate} onChange={(e) => updateEduEntry(i, 'startDate', e.target.value)} className="form-input text-xs" placeholder="Date de début (ex: 2008)" />
                    <div className="flex items-center gap-2">
                      <input value={edu.endDate} onChange={(e) => updateEduEntry(i, 'endDate', e.target.value)} className="form-input text-xs flex-1" placeholder="Date de fin (ex: Present)" />
                      <button type="button" onClick={() => removeEduEntry(i)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Experiences Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expériences professionnelles</CardTitle>
                <button type="button" onClick={addWorkEntry} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {workHistory.length === 0 && <p className="text-xs text-muted-foreground">Aucune expérience ajoutée.</p>}
                {workHistory.map((entry, i) => (
                  <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 relative bg-muted/20">
                    <input value={entry.title} onChange={(e) => updateWorkEntry(i, 'title', e.target.value)} className="form-input text-xs" placeholder="Poste (ex: Chairman, CEO & Founder)" />
                    <input value={entry.company} onChange={(e) => updateWorkEntry(i, 'company', e.target.value)} className="form-input text-xs" placeholder="Entreprise (ex: HAMRI CAPITAL)" />
                    <input value={entry.startDate} onChange={(e) => updateWorkEntry(i, 'startDate', e.target.value)} className="form-input text-xs" placeholder="Date de début (ex: March 15, 2025)" />
                    <div className="flex items-center gap-2">
                      <input value={entry.endDate} onChange={(e) => updateWorkEntry(i, 'endDate', e.target.value)} className="form-input text-xs flex-1" placeholder="Date de fin (ex: Present)" />
                      <button type="button" onClick={() => removeWorkEntry(i)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills: Technical (comma) & Soft Skills (dynamic list) */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compétences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Technical Skills (Séparées par des virgules)">
                  <input value={fields.technicalSkills || ''} onChange={(e) => set('technicalSkills', e.target.value)} className="form-input text-xs" placeholder="Ex: Financial Modeling, Valuation, Excel Advanced" />
                </FormField>
                
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Soft Skills</label>
                    <button type="button" onClick={addSoftEntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter une catégorie
                    </button>
                  </div>
                  {softSkills.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center bg-muted/10 p-2 rounded-lg border">
                      <input value={s.category} onChange={(e) => updateSoftEntry(i, 'category', e.target.value)} className="form-input text-xs w-1/3" placeholder="Catégorie (ex: Communication)" />
                      <input value={s.skills} onChange={(e) => updateSoftEntry(i, 'skills', e.target.value)} className="form-input text-xs flex-1" placeholder="Valeurs (ex: Active Listening, Writing)" />
                      <button type="button" onClick={() => removeSoftEntry(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info Cards: Languages, Sports, Gaming (comma strings) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informations complémentaires & Langues</CardTitle>
                <button type="button" onClick={addLangEntry} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Ajouter Langue
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {languages.map((lang, i) => (
                  <div key={i} className="flex gap-2 items-center bg-muted/10 p-2 rounded-lg border">
                    <input value={lang.language} onChange={(e) => updateLangEntry(i, 'language', e.target.value)} className="form-input text-xs flex-1" placeholder="Langue (ex: French)" />
                    <input value={lang.level} onChange={(e) => updateLangEntry(i, 'level', e.target.value)} className="form-input text-xs w-1/3" placeholder="Niveau (ex: C1, Native)" />
                    <button type="button" onClick={() => removeLangEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                
                <div className="border-t border-border pt-4 grid gap-4 sm:grid-cols-2">
                  <FormField label="Sports (Séparés par des virgules)">
                    <input value={fields.sports || ''} onChange={(e) => set('sports', e.target.value)} className="form-input text-xs" placeholder="Ex: Tennis 5.5, Chess, Poker" />
                  </FormField>
                  <FormField label="Gaming (Séparés par des virgules)">
                    <input value={fields.gaming || ''} onChange={(e) => set('gaming', e.target.value)} className="form-input text-xs" placeholder="Ex: Master Duel, Dofus" />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== BUSINESS FIELDS ===== */}
        {isBusinessProfile && (
          <>
            {/* Identity Card */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identité Entreprise & Bio</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nom de l'entreprise">
                  <input value={fields.companyName || ''} onChange={(e) => set('companyName', e.target.value)} className="form-input text-xs" placeholder="Nom officiel" />
                </FormField>
                <FormField label="Secteur d'activité (Activities)">
                  <input value={fields.activities || ''} onChange={(e) => set('activities', e.target.value)} className="form-input text-xs" placeholder="Ex: Investment Management & Funds" />
                </FormField>
                <FormField label="Date de création">
                  <input value={fields.creationDate || ''} onChange={(e) => set('creationDate', e.target.value)} type="date" className="form-input text-xs" />
                </FormField>
                <FormField label="Présentation / Bio de l'entreprise" className="sm:col-span-2">
                  <textarea value={fields.bio || ''} onChange={(e) => set('bio', e.target.value)} rows={4} className="form-input text-xs resize-none" placeholder="Présentation complète, services proposés, etc..." />
                </FormField>
              </CardContent>
            </Card>

            {/* Legal Cards */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informations Légales & Certifications</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Registre de Commerce (RC)">
                  <input value={fields.rc || ''} onChange={(e) => set('rc', e.target.value)} className="form-input text-xs" placeholder="N° RC" />
                </FormField>
                <FormField label="ICE">
                  <input value={fields.ice || ''} onChange={(e) => set('ice', e.target.value)} className="form-input text-xs" placeholder="N° ICE" />
                </FormField>
                <FormField label="Identifiant Fiscal (IF)">
                  <input value={fields.ifNumber || ''} onChange={(e) => set('ifNumber', e.target.value)} className="form-input text-xs" placeholder="N° IF" />
                </FormField>
                <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                  <FormField label="Licences (Séparées par des virgules)">
                    <input value={fields.licenses || ''} onChange={(e) => set('licenses', e.target.value)} className="form-input text-xs" placeholder="Ex: RIA, FCA, AMMC" />
                  </FormField>
                  <FormField label="Certifications (Séparées par des virgules)">
                    <input value={fields.certifications || ''} onChange={(e) => set('certifications', e.target.value)} className="form-input text-xs" placeholder="Ex: ISO 14001:2026, ISO 42001:2023" />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Structure Card */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Siège, Contact & Site Web</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email Entreprise">
                  <input value={fields.email || ''} onChange={(e) => set('email', e.target.value)} type="email" className="form-input text-xs" placeholder="contact@entreprise.com" />
                </FormField>
                <FormField label="Téléphone">
                  <input value={fields.phone || ''} onChange={(e) => set('phone', e.target.value)} className="form-input text-xs" placeholder="Téléphone entreprise" />
                </FormField>
                <FormField label="Site Web">
                  <input value={fields.website || ''} onChange={(e) => set('website', e.target.value)} className="form-input text-xs" placeholder="www.entreprise.com" />
                </FormField>
                <FormField label="Siège social (Headquarter)">
                  <input value={fields.headquarters || ''} onChange={(e) => set('headquarters', e.target.value)} className="form-input text-xs" placeholder="Ex: Morocco, Tangier" />
                </FormField>
                <FormField label="Filiales (Subsidiaries - séparées par des virgules)" className="sm:col-span-2">
                  <input value={fields.subsidiaries || ''} onChange={(e) => set('subsidiaries', e.target.value)} className="form-input text-xs" placeholder="Ex: Canada, Toronto" />
                </FormField>
                <FormField label="Pays">
                  <select value={fields.country || 'Maroc'} onChange={(e) => set('country', e.target.value)} className="form-input text-xs">
                    {['Maroc','France','Belgique','USA','Canada'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Ville">
                  <input value={fields.city || ''} onChange={(e) => set('city', e.target.value)} className="form-input text-xs" placeholder="Ville" />
                </FormField>
                <FormField label="Adresse physique" className="sm:col-span-2">
                  <input value={fields.address || ''} onChange={(e) => set('address', e.target.value)} className="form-input text-xs" placeholder="Adresse complète" />
                </FormField>
              </CardContent>
            </Card>

            {/* Representative details */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Représentant légal</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nom complet du représentant">
                  <input value={fields.personInCharge || ''} onChange={(e) => set('personInCharge', e.target.value)} className="form-input text-xs" placeholder="Ex: Omar Hamri" />
                </FormField>
                <FormField label="Rôle / Titre du représentant">
                  <input value={fields.role || ''} onChange={(e) => set('role', e.target.value)} className="form-input text-xs" placeholder="Ex: Chairman, CEO & Founder" />
                </FormField>
              </CardContent>
            </Card>

            {/* Equipments and HR Stuff */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Matériel & Ressources Humaines</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                
                {/* Equipment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Équipements & Matériel</label>
                    <button type="button" onClick={addEquipEntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter Matériel
                    </button>
                  </div>
                  {technicalEquipment.map((eq, i) => (
                    <div key={i} className="flex gap-2 items-center bg-muted/10 p-2 rounded-lg border">
                      <input value={eq.name} onChange={(e) => updateEquipEntry(i, 'name', e.target.value)} className="form-input text-xs flex-1" placeholder="Équipement (ex: Vehicles, Work Stations)" />
                      <input value={eq.count} onChange={(e) => updateEquipEntry(i, 'count', e.target.value)} type="number" className="form-input text-xs w-24" placeholder="Quantité" />
                      <button type="button" onClick={() => removeEquipEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>

                {/* Human resources */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Effectif & Staff</label>
                    <button type="button" onClick={addHREntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter Effectif
                    </button>
                  </div>
                  {humanResources.map((hr, i) => (
                    <div key={i} className="flex gap-2 items-center bg-muted/10 p-2 rounded-lg border">
                      <input value={hr.role} onChange={(e) => updateHREntry(i, 'role', e.target.value)} className="form-input text-xs flex-1" placeholder="Poste (ex: Analysts, Directors)" />
                      <input value={hr.count} onChange={(e) => updateHREntry(i, 'count', e.target.value)} type="number" className="form-input text-xs w-24" placeholder="Effectif" />
                      <button type="button" onClick={() => removeHREntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>

            {/* Agendas & Formations Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agenda & Formations</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                
                {/* Events */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Événements planifiés</label>
                    <button type="button" onClick={addEventEntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter un événement
                    </button>
                  </div>
                  {events.map((ev, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-3 bg-muted/10 p-3 rounded-lg border relative">
                      <input value={ev.title} onChange={(e) => updateEventEntry(i, 'title', e.target.value)} className="form-input text-xs" placeholder="Titre de l'événement" />
                      <input value={ev.date} onChange={(e) => updateEventEntry(i, 'date', e.target.value)} className="form-input text-xs" placeholder="Date (ex: June 21-22, 2026)" />
                      <div className="flex items-center gap-2">
                        <input value={ev.location} onChange={(e) => updateEventEntry(i, 'location', e.target.value)} className="form-input text-xs flex-1" placeholder="Lieu (ex: Hotel Marriott Fes)" />
                        <button type="button" onClick={() => removeEventEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meetings */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Réunions en ligne</label>
                    <button type="button" onClick={addMeetingEntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter une réunion
                    </button>
                  </div>
                  {onlineMeetings.map((mt, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-3 bg-muted/10 p-3 rounded-lg border relative">
                      <input value={mt.title} onChange={(e) => updateMeetingEntry(i, 'title', e.target.value)} className="form-input text-xs" placeholder="Titre de la réunion" />
                      <input value={mt.date} onChange={(e) => updateMeetingEntry(i, 'date', e.target.value)} className="form-input text-xs" placeholder="Date (ex: July 2, 2026)" />
                      <div className="flex items-center gap-2">
                        <input value={mt.platform} onChange={(e) => updateMeetingEntry(i, 'platform', e.target.value)} className="form-input text-xs flex-1" placeholder="Plateforme (ex: ZOOM)" />
                        <button type="button" onClick={() => removeMeetingEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trainings */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Programmes de formation</label>
                    <button type="button" onClick={addTrainingEntry} className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                      <Plus className="h-3" /> Ajouter une formation
                    </button>
                  </div>
                  {trainingPrograms.map((tp, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-3 bg-muted/10 p-3 rounded-lg border relative">
                      <input value={tp.title} onChange={(e) => updateTrainingEntry(i, 'title', e.target.value)} className="form-input text-xs" placeholder="Titre de la formation" />
                      <input value={tp.date} onChange={(e) => updateTrainingEntry(i, 'date', e.target.value)} className="form-input text-xs" placeholder="Date (ex: May 31, 2026)" />
                      <div className="flex items-center gap-2">
                        <input value={tp.location} onChange={(e) => updateTrainingEntry(i, 'location', e.target.value)} className="form-input text-xs flex-1" placeholder="Lieu (ex: Tangier Office)" />
                        <button type="button" onClick={() => removeTrainingEntry(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>

            {/* Sectors of interests */}
            <Card>
              <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secteurs d'intérêt (Séparés par des virgules)</CardTitle></CardHeader>
              <CardContent>
                <input value={fields.sectorsOfInterests || ''} onChange={(e) => set('sectorsOfInterests', e.target.value)} className="form-input text-xs" placeholder="Ex: Agriculture, Aviation, Real Estate, E-commerce" />
              </CardContent>
            </Card>
          </>
        )}

        {/* Core Interests Category list (both profile types) */}
        <Card>
          <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Centres d'intérêt généraux</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATEGORIES.map((interest) => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition font-semibold ${selectedInterests.includes(interest) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  {interest}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Messages */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">{error}</div>
        )}
        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-xs font-semibold text-green-700">Profil enregistré avec succès !</div>
        )}

        <button type="submit" disabled={loading}
          className="ygo-btn-blue w-full py-3 font-black text-xs uppercase tracking-wide disabled:opacity-50 transition shadow-lg">
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-foreground/80">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
