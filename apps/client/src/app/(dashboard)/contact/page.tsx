'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Send,
  Loader2,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
  MessageCircle,
  Newspaper,
} from 'lucide-react';

export default function ContactPage() {
  const { t } = useT();
  const { userId } = useAuth();
  const { user } = useUser();
  const [tab, setTab] = useState<'contact' | 'newsletter'>('contact');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Newsletter form state
  const [newsEmail, setNewsEmail] = useState('');
  const [newsFirstName, setNewsFirstName] = useState('');

  const contactMutation = useMutation({
    mutationFn: (data: any) => api.post('/newsletter/contact', data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: any) => api.post('/newsletter/subscribe', data),
  });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate({
      ...contactForm,
      userId: userId || undefined,
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    subscribeMutation.mutate({
      email: newsEmail,
      firstName: newsFirstName || undefined,
      userId: userId || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a237e] font-heading tracking-wide flex items-center gap-2">
          <Mail className="h-7 w-7 text-[#c9a730]" />
          {t.contact.title}
        </h1>
        <p className="text-gray-500">{t.contact.description}</p>
        <div className="h-0.5 bg-gradient-to-r from-[#c9a730] via-[#e6c200] to-transparent max-w-[120px] mt-1" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setTab('contact')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            tab === 'contact' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {t.contact.contactTab}
        </button>
        <button
          onClick={() => setTab('newsletter')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition ${
            tab === 'newsletter' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Newspaper className="h-3.5 w-3.5" />
          {t.contact.newsletterTab}
        </button>
      </div>

      {tab === 'contact' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Contact form */}
          <div className="md:col-span-2">
            <Card className="border-[#d4c088]/40">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[#1a237e]">
                  {t.contact.sendMessage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contactMutation.isSuccess ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-[#1a237e]">{t.contact.messageSent}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t.contact.messageSentDesc}
                    </p>
                    <button
                      onClick={() => {
                        contactMutation.reset();
                        setContactForm({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="mt-4 text-sm text-[#c9a730] font-semibold hover:underline"
                    >
                      {t.contact.sendAnother}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.fullName}</label>
                        <input
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder={user ? `${user.firstName} ${user.lastName}` : t.contact.placeholderName}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.email}</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder={user?.primaryEmailAddress?.emailAddress || t.contact.placeholderEmail}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.subject}</label>
                      <input
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder={t.contact.placeholderSubject}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.message}</label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder={t.contact.placeholderMessage}
                        rows={5}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={contactMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#1a237e] text-white font-semibold text-sm rounded-lg hover:bg-[#283593] disabled:opacity-50 transition"
                    >
                      {contactMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {t.common.send}
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <Card className="border-[#d4c088]/40">
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.contact.address}</p>
                    <p className="text-xs text-gray-500">{t.contact.addressValue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.contact.email}</p>
                    <p className="text-xs text-gray-500">{t.contact.emailValue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.contact.phone}</p>
                    <p className="text-xs text-gray-500">{t.contact.phoneValue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-[#1a237e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.contact.hours}</p>
                    <p className="text-xs text-gray-500">{t.contact.hoursValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'newsletter' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscribe form */}
          <Card className="border-[#c9a730]/40 bg-gradient-to-br from-[#fff8e1]/50 to-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#1a237e]">
                {t.contact.stayInformed}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {t.contact.newsletterDesc}
              </p>
            </CardHeader>
            <CardContent>
              {subscribeMutation.isSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-[#1a237e]">{t.contact.subscribed}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.contact.subscribedDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.firstName}</label>
                    <input
                      value={newsFirstName}
                      onChange={(e) => setNewsFirstName(e.target.value)}
                      placeholder={t.contact.placeholderFirstName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.contact.email}</label>
                    <input
                      type="email"
                      value={newsEmail}
                      onChange={(e) => setNewsEmail(e.target.value)}
                      placeholder={t.contact.placeholderEmail}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a730]/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="w-full px-5 py-2.5 bg-gradient-to-r from-[#c9a730] to-[#e6c200] text-[#1a237e] font-bold text-sm rounded-lg hover:shadow-md disabled:opacity-50 transition-all"
                  >
                    {subscribeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      t.contact.subscribeBtn
                    )}
                  </button>
                  {subscribeMutation.isError && (
                    <p className="text-xs text-red-500">{t.contact.errorSubscribe}</p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* What you get */}
          <Card className="border-[#d4c088]/40">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#1a237e]">
                {t.contact.whatYouGet}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: '📰', title: t.contact.businessNews, desc: t.contact.businessNewsDesc },
                { icon: '💡', title: t.contact.practicalTips, desc: t.contact.practicalTipsDesc },
                { icon: '🤝', title: t.contact.networkOpportunities, desc: t.contact.networkOpportunitiesDesc },
                { icon: '🎯', title: t.contact.exclusiveOffers, desc: t.contact.exclusiveOffersDesc },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="bg-[#f5f0e1] rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-600">
                  📮 {t.contact.newsletterFrequency}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
