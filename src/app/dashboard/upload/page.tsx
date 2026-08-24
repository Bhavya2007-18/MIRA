'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Edit3,
  Volume2,
  Sparkles,
  UserPlus,
  Users,
  X,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { EnrolledFamilyMember } from '../../../types';
import { getWebTranslation } from '../../../lib/translations';

const NER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop', // Priya
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop', // Rohan
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop', // Lalrinmawii
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop', // Dr. Amarjit
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'  // Tenzing
];

export default function UploadPersonPage() {
  const { enrolledMembers, addFamilyMember, deleteFamilyMember, editFamilyMember, selectedLanguage } = useAuth();
  const t = getWebTranslation(selectedLanguage);

  // Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [coreMemory, setCoreMemory] = useState('');
  const [location, setLocation] = useState('Guwahati, Assam');
  const [photoUrl, setPhotoUrl] = useState(NER_AVATAR_PRESETS[0]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<EnrolledFamilyMember | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const randomPreset = NER_AVATAR_PRESETS[Math.floor(Math.random() * NER_AVATAR_PRESETS.length)];
    setPhotoUrl(randomPreset);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relation.trim() || !coreMemory.trim()) return;

    addFamilyMember({
      name: name.trim(),
      relation: relation.trim(),
      coreMemory: coreMemory.trim(),
      photoUrl: photoUrl,
      location: location.trim()
    });

    setSuccessMessage(`Successfully enrolled ${name.trim()} to MIRA Memory Prosthetic!`);
    setName('');
    setRelation('');
    setCoreMemory('');

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const handlePlayVoicePreview = (member: EnrolledFamilyMember) => {
    setPlayingAudioId(member.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak =
        selectedLanguage === 'as'
          ? `এখেত হ’ল ${member.name}, ${member.relation}। মূল স্মৃতি: ${member.coreMemory}`
          : `This is ${member.name}, ${member.relation}. Core memory: ${member.coreMemory}`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.85;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudioId(null), 2000);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    editFamilyMember(editingMember.id, {
      name: editingMember.name,
      relation: editingMember.relation,
      coreMemory: editingMember.coreMemory,
      location: editingMember.location
    });

    setEditingMember(null);
  };

  return (
    <div className="space-y-10">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-sage-50 border border-sage-200 px-3 py-1 rounded-full text-xs font-bold text-sage-700 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.prosthesisEngineTag}</span>
        </div>
        <h2 className="text-3xl font-black text-charcoal-900 tracking-tight">
          {t.enrollLovedOnesTitle}
        </h2>
        <p className="text-sm text-charcoal-600 mt-1 max-w-2xl font-medium">
          {t.enrollLovedOnesDesc}
        </p>
      </div>

      {/* Main Grid: Upload Form (Left) & Gallery (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Dropzone & Memory Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-cream-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-sage-50 border border-sage-200 text-sage-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-charcoal-900">{t.addNewMember}</h3>
          </div>

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-sage-50 border border-sage-300 text-sage-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Drag and Drop Dropzone */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-2">
                {t.photoDropzone}
              </label>
              
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-cream-300 hover:border-sage-400 bg-cream-50/70'
                }`}
              >
                <div className="relative mb-3">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-sage-500 shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 p-1 bg-white rounded-full border border-cream-200">
                    <ImageIcon className="w-3.5 h-3.5 text-sage-600" />
                  </div>
                </div>

                <p className="text-xs font-black text-charcoal-900">
                  {t.dropzoneHint}
                </p>
                <p className="text-[11px] text-charcoal-600 mt-0.5 font-medium">
                  {t.dropzoneSub}
                </p>
              </div>

              {/* Preset avatars selection */}
              <div className="flex items-center justify-center space-x-2.5 mt-3">
                <span className="text-[11px] font-bold text-charcoal-600">{t.presets}:</span>
                {NER_AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(preset)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      photoUrl === preset ? 'border-sage-600 scale-110' : 'border-cream-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-1.5">
                {t.fullName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="w-full bg-cream-50 border border-cream-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500 rounded-xl px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-500 outline-none"
              />
            </div>

            {/* Relation Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-1.5">
                {t.relationLabel}
              </label>
              <input
                type="text"
                required
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder={t.relationPlaceholder}
                className="w-full bg-cream-50 border border-cream-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500 rounded-xl px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-500 outline-none"
              />
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-1.5">
                Regional Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Guwahati / Shillong / Imphal"
                className="w-full bg-cream-50 border border-cream-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500 rounded-xl px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-500 outline-none"
              />
            </div>

            {/* Core Memory Trigger */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-1.5">
                {t.coreMemoryLabel}
              </label>
              <textarea
                required
                rows={3}
                value={coreMemory}
                onChange={(e) => setCoreMemory(e.target.value)}
                placeholder={t.coreMemoryPlaceholder}
                className="w-full bg-cream-50 border border-cream-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500 rounded-xl p-3 text-sm text-charcoal-900 placeholder:text-charcoal-500 outline-none resize-none"
              />
              <p className="text-[11px] text-charcoal-600 mt-1 font-medium">
                {t.coreMemoryHint}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-sage-500 hover:bg-sage-600 text-white font-black py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md shadow-sage-700/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.enrollButton}</span>
            </button>
          </form>
        </div>

        {/* Right Gallery: Enrolled Family Members (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-sage-600" />
              <h3 className="text-lg font-black text-charcoal-900">{t.enrolledCircleTitle} ({enrolledMembers.length})</h3>
            </div>
            <span className="text-xs text-charcoal-600 font-bold">{t.syncedApp}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolledMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-cream-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-cream-300 transition-all group"
              >
                <div>
                  {/* Avatar & Badges */}
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-sage-500"
                      />
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                        <CheckCircle className="w-4 h-4 text-sage-600" />
                      </div>
                    </div>

                    <span className="text-[11px] font-black bg-sage-50 border border-sage-200 text-sage-800 px-2.5 py-1 rounded-full">
                      {member.relation}
                    </span>
                  </div>

                  {/* Name & Memory Text */}
                  <div className="mt-4">
                    <h4 className="text-base font-black text-charcoal-900">{member.name}</h4>
                    {member.location && (
                      <p className="text-xs text-sage-700 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{member.location}</span>
                      </p>
                    )}
                    <p className="text-xs text-charcoal-800 font-semibold mt-2 line-clamp-3 bg-cream-50 p-2.5 rounded-xl border border-cream-200">
                      "{member.coreMemory}"
                    </p>
                  </div>
                </div>

                {/* Footer Controls: Audio Preview, Edit, Delete */}
                <div className="mt-5 pt-3 border-t border-cream-200 flex items-center justify-between">
                  <button
                    onClick={() => handlePlayVoicePreview(member)}
                    className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                      playingAudioId === member.id
                        ? 'bg-sage-600 text-white'
                        : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{playingAudioId === member.id ? t.speakingAudio : t.testAudio}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-1.5 text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100 rounded-lg transition-colors"
                      title={t.editMemory}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFamilyMember(member.id)}
                      className="p-1.5 text-charcoal-600 hover:text-gentle-pink-700 hover:bg-gentle-pink-50 rounded-lg transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-charcoal-900">{t.editMemory}</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 text-charcoal-500 hover:text-charcoal-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-charcoal-700 mb-1">{t.fullName}</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-sm text-charcoal-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-charcoal-700 mb-1">{t.relationLabel}</label>
                <input
                  type="text"
                  value={editingMember.relation}
                  onChange={(e) => setEditingMember({ ...editingMember, relation: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-sm text-charcoal-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-charcoal-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editingMember.location || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-sm text-charcoal-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-charcoal-700 mb-1">{t.coreMemoryLabel}</label>
                <textarea
                  rows={3}
                  value={editingMember.coreMemory}
                  onChange={(e) => setEditingMember({ ...editingMember, coreMemory: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-3 text-sm text-charcoal-900 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-charcoal-600 hover:bg-cream-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-black bg-sage-500 hover:bg-sage-600 text-white"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
