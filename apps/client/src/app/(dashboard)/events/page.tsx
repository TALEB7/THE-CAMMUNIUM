'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Loader2,
  ArrowLeft,
  Globe,
  Monitor,
  CheckCircle2,
  XCircle,
  Send,
  Filter,
} from 'lucide-react';

type ViewMode = 'browse' | 'detail' | 'create';

const eventTypeIcons: Record<string, any> = {
  IN_PERSON: MapPin,
  ONLINE: Monitor,
  HYBRID: Globe,
};

export default function EventsPage() {
  const { userId } = useAuth();
  const { t } = useT();

  const eventTypeLabels: Record<string, string> = {
    IN_PERSON: t.events.inPerson,
    ONLINE: t.events.online,
    HYBRID: t.events.hybrid,
  };
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create form
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'IN_PERSON',
    city: '',
    address: '',
    startDate: '',
    endDate: '',
    maxAttendees: '',
    category: '',
    price: '0',
  });

  // Browse events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', cityFilter, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cityFilter) params.append('city', cityFilter);
      if (typeFilter) params.append('eventType', typeFilter);
      return api.get(`/events?${params}`).then((r) => r.data);
    },
    enabled: view === 'browse',
  });

  // Single event
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', selectedEventId],
    queryFn: () => api.get(`/events/${selectedEventId}`).then((r) => r.data),
    enabled: !!selectedEventId && view === 'detail',
  });

  // Create event
  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/events', {
        ...form,
        organizerId: userId,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
        price: parseFloat(form.price) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setView('browse');
      setForm({
        title: '',
        description: '',
        eventType: 'IN_PERSON',
        city: '',
        address: '',
        startDate: '',
        endDate: '',
        maxAttendees: '',
        category: '',
        price: '0',
      });
    },
  });

  // RSVP
  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/rsvp`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // Cancel RSVP
  const cancelRsvpMutation = useMutation({
    mutationFn: (eventId: string) => api.delete(`/events/${eventId}/rsvp`, { data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── BROWSE VIEW ──
  if (view === 'browse') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{`📅 ${t.events.title}`}</h1>
            <p className="text-sm text-gray-500">{t.events.description}</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1a237e] text-white rounded-lg hover:bg-[#283593] transition"
          >
            <Plus className="h-4 w-4" />
            {t.events.createEvent}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder={t.events.filterByCity}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730] w-48"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
          >
            <option value="">{t.events.allTypes}</option>
            <option value="IN_PERSON">{t.events.inPerson}</option>
            <option value="ONLINE">{t.events.online}</option>
            <option value="HYBRID">{t.events.hybrid}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !eventsData?.events?.length ? (
          <Card className="border-[#d4c088]/40">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">{t.events.noEvents}</h3>
              <p className="text-sm text-gray-400 mt-1">{t.events.noEventsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventsData.events.map((ev: any) => {
              const TypeIcon = eventTypeIcons[ev.eventType] || Globe;
              const isPast = new Date(ev.startDate) < new Date();
              return (
                <button key={ev.id} onClick={() => { setSelectedEventId(ev.id); setView('detail'); }} className="text-left">
                  <Card className={`border-[#d4c088]/40 hover:border-[#c9a730] transition h-full ${isPast ? 'opacity-60' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-[#d4c088] text-[#1a237e] flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {eventTypeLabels[ev.eventType]}
                          </Badge>
                          {ev.status === 'CANCELLED' && <Badge variant="destructive" className="text-xs">{t.events.cancelled}</Badge>}
                          {isPast && <Badge variant="secondary" className="text-xs">{t.polls.ended}</Badge>}
                        </div>
                        {ev.price > 0 && (
                          <span className="text-sm font-bold text-[#c9a730]">{ev.price} MAD</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#1a237e] mb-1">{ev.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ev.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ev.startDate)}
                        </span>
                        {ev.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {ev.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ev._count?.rsvps || 0}{ev.maxAttendees ? `/${ev.maxAttendees}` : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── EVENT DETAIL VIEW ──
  if (view === 'detail') {
    const TypeIcon = event ? (eventTypeIcons[event.eventType] || Globe) : Globe;
    const userRsvp = event?.rsvps?.find((r: any) => r.userId === userId);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a237e] transition">
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </button>

        {eventLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#c9a730]" /></div>
        ) : !event ? (
          <p className="text-gray-500">{t.common.noData}</p>
        ) : (
          <>
            <Card className="border-[#d4c088]/40">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="text-xs border-[#d4c088] text-[#1a237e] flex items-center gap-1 w-fit mb-2">
                      <TypeIcon className="h-3 w-3" />
                      {eventTypeLabels[event.eventType]}
                    </Badge>
                    <h1 className="text-2xl font-bold text-[#1a237e]">{event.title}</h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Par {event.organizer?.firstName} {event.organizer?.lastName}
                    </p>
                  </div>
                  {event.price > 0 && (
                    <span className="text-xl font-bold text-[#c9a730]">{event.price} MAD</span>
                  )}
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>

                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#c9a730]" />
                    <div>
                      <p className="text-xs text-gray-400">{t.events.startDate}</p>
                      <p className="font-medium text-gray-700">{formatDate(event.startDate)}</p>
                    </div>
                  </div>
                  {event.endDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#c9a730]" />
                      <div>
                        <p className="text-xs text-gray-400">{t.events.endDate}</p>
                        <p className="font-medium text-gray-700">{formatDate(event.endDate)}</p>
                      </div>
                    </div>
                  )}
                  {event.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#c9a730]" />
                      <div>
                        <p className="text-xs text-gray-400">{t.events.city}</p>
                        <p className="font-medium text-gray-700">{event.city}{event.address ? `, ${event.address}` : ''}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#c9a730]" />
                    <div>
                      <p className="text-xs text-gray-400">{t.events.participants}</p>
                      <p className="font-medium text-gray-700">
                        {event._count?.rsvps || 0}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RSVP */}
                <div className="flex items-center gap-3 pt-2">
                  {userRsvp ? (
                    <>
                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {userRsvp.status === 'WAITLISTED' ? t.events.waitlisted : t.events.registered}
                      </Badge>
                      <button
                        onClick={() => cancelRsvpMutation.mutate(event.id)}
                        disabled={cancelRsvpMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                      >
                        <XCircle className="h-3 w-3" />
                        {t.events.cancelRsvp}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => rsvpMutation.mutate(event.id)}
                      disabled={rsvpMutation.isPending || event.status === 'CANCELLED'}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
                    >
                      {rsvpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t.events.rsvpBtn}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            {event.rsvps?.length > 0 && (
              <Card className="border-[#d4c088]/40">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t.events.participants} ({event.rsvps.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.rsvps.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                        <img
                          src={r.user?.avatarUrl || '/default-avatar.png'}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        {r.user?.firstName} {r.user?.lastName}
                        {r.status === 'WAITLISTED' && (
                          <Badge variant="secondary" className="text-[10px] py-0">{t.events.waitlisted}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // ── CREATE EVENT VIEW ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => setView('browse')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a237e] transition">
        <ArrowLeft className="h-4 w-4" />
        {t.common.back}
      </button>

      <h1 className="text-2xl font-bold text-[#1a237e] font-heading">{t.events.createEventTitle}</h1>

      <Card className="border-[#d4c088]/40">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.eventTitle}</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.eventDesc}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.eventType}</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              >
                <option value="IN_PERSON">{t.events.inPerson}</option>
                <option value="ONLINE">{t.events.online}</option>
                <option value="HYBRID">{t.events.hybrid}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.faq.category}</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="ex: networking, workshop..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.city}</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Casablanca"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.address}</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.startDate}</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.endDate}</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.maxAttendees}</label>
              <input
                type="number"
                value={form.maxAttendees}
                onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                placeholder={t.events.unlimited}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.events.price}</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c9a730]"
              />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.startDate || createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-[#c9a730] text-white rounded-lg hover:bg-[#b8962c] disabled:opacity-50 transition"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t.events.createBtn}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
