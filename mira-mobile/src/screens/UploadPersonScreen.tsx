import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar
} from 'react-native';
import { Camera, Check, Heart } from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import { Header } from '../components/Header';
import { BigButton } from '../components/BigButton';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';

const NER_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop', // Priya
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop', // Rohan
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop', // Lalrinmawii
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop'  // Dr. Amarjit
];

export const UploadPersonScreen: React.FC = () => {
  const { navigateTo, addEnrolledPerson, selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [coreMemory, setCoreMemory] = useState('');
  const [photoUri, setPhotoUri] = useState(NER_PHOTO_PRESETS[0]);
  const [isSaved, setIsSaved] = useState(false);

  const handleSelectPresetPhoto = (uri: string) => {
    triggerHaptic('light');
    setPhotoUri(uri);
  };

  const handleSaveMemory = () => {
    if (!name.trim()) {
      triggerHaptic('warning');
      speakAloud(
        selectedLanguage === 'as' ? 'অনুগ্ৰহ কৰি ব্যক্তিজনৰ নাম লিখক।' : 'Please enter the name before saving.',
        undefined,
        currentLang.speechCode
      );
      return;
    }

    if (!relation.trim()) {
      triggerHaptic('warning');
      speakAloud(
        selectedLanguage === 'as' ? 'আপোনাৰ সৈতে সম্বন্ধ লিখক।' : 'Please enter your relationship to this person.',
        undefined,
        currentLang.speechCode
      );
      return;
    }

    if (!coreMemory.trim()) {
      triggerHaptic('warning');
      speakAloud(
        selectedLanguage === 'as' ? 'মূল স্মৃতিৰ কথা লিখক।' : 'Please enter a core memory prompt.',
        undefined,
        currentLang.speechCode
      );
      return;
    }

    triggerHaptic('success');
    addEnrolledPerson({
      name: name.trim(),
      relation: relation.trim(),
      coreMemory: coreMemory.trim(),
      photoUri: photoUri,
      location: 'North East India'
    });

    setIsSaved(true);
    speakAloud(
      selectedLanguage === 'as'
        ? `${name}ৰ নাম আৰু স্মৃতি মিৰাত সংৰক্ষণ কৰা হ’ল!`
        : `Successfully saved ${name} to your MIRA memory bank!`,
      undefined,
      currentLang.speechCode
    );

    setTimeout(() => {
      navigateTo('HOME');
    }, 1600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      <Header
        title={t.uploadPersonTitle}
        subtitle={t.uploadPersonSubtitle}
        showBack
        onBack={() => navigateTo('HOME')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo Selection Preview */}
        <View style={styles.photoPickerSection}>
          <Text style={styles.sectionHeader}>{t.choosePhoto}</Text>

          <View style={styles.previewCenter}>
            <Image source={{ uri: photoUri }} style={styles.mainAvatar} />
            <View style={styles.photoTagBadge}>
              <Camera size={16} color="#FFFFFF" />
              <Text style={styles.photoTagText}>Selected</Text>
            </View>
          </View>

          {/* Quick Selection Thumbnails */}
          <Text style={styles.presetLabel}>{t.pickFamilyPreset}</Text>
          <View style={styles.thumbnailRow}>
            {NER_PHOTO_PRESETS.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbButton,
                  photoUri === preset && styles.thumbButtonActive
                ]}
                onPress={() => handleSelectPresetPhoto(preset)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: preset }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Input Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>2. DETAILS</Text>

          {/* Person Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.personName}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t.personNamePlaceholder}
              placeholderTextColor="#A0AEC0"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Relation to Patient */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.relation}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t.relationPlaceholder}
              placeholderTextColor="#A0AEC0"
              value={relation}
              onChangeText={setRelation}
            />
          </View>

          {/* Core Memory Trigger */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.coreMemoryLabel}</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder={t.coreMemoryPlaceholder}
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
              value={coreMemory}
              onChangeText={setCoreMemory}
            />
          </View>
        </View>

        {/* Big Primary Save Memory Button */}
        <View style={styles.actionContainer}>
          <BigButton
            title={isSaved ? t.savedToMemories : t.saveMemoryBtn}
            subtitle="Securely synced with Caretaker"
            icon={isSaved ? <Check size={28} color="#FFFFFF" /> : <Heart size={28} color="#FFFFFF" />}
            backgroundColor={isSaved ? "#556B48" : "#8FA382"}
            onPress={handleSaveMemory}
            disabled={isSaved}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12
  },
  sectionHeader: {
    color: '#556B48',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  photoPickerSection: {
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    marginBottom: 16
  },
  previewCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative'
  },
  mainAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#8FA382'
  },
  photoTagBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#8FA382',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  photoTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 3
  },
  presetLabel: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center'
  },
  thumbnailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14
  },
  thumbButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E4DEC8',
    overflow: 'hidden'
  },
  thumbButtonActive: {
    borderColor: '#8FA382',
    borderWidth: 3.5
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  formSection: {
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    marginBottom: 16
  },
  inputGroup: {
    marginVertical: 8
  },
  inputLabel: {
    color: '#2D3748',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4DEC8',
    borderWidth: 1.5,
    borderRadius: 16,
    color: '#2D3748',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56
  },
  textAreaInput: {
    minHeight: 84,
    textAlignVertical: 'top'
  },
  actionContainer: {
    marginTop: 4
  }
});
