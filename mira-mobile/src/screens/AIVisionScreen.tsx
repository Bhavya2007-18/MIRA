import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import {
  ChevronLeft,
  Volume2,
  X,
  Sparkles,
  CheckCircle2,
  Users,
  MapPin
} from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const AIVisionScreen: React.FC = () => {
  const { navigateTo, enrolledPersons, selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(true);

  const activePerson = enrolledPersons[selectedPersonIndex] || enrolledPersons[0];

  useEffect(() => {
    // When person is recognized, announce their name & core memory in active language
    if (activePerson) {
      const speechPrompt =
        selectedLanguage === 'as'
          ? `এখেত হ’ল ${activePerson.name}, ${activePerson.relation}। মূল স্মৃতি: ${activePerson.coreMemory}`
          : `This is ${activePerson.name}, ${activePerson.relation}. Core memory: ${activePerson.coreMemory}`;

      speakAloud(speechPrompt, undefined, currentLang.speechCode);
    }
  }, [selectedPersonIndex, selectedLanguage]);

  const handleSpeakMemory = () => {
    triggerHaptic('medium');
    if (activePerson) {
      const speechPrompt =
        selectedLanguage === 'as'
          ? `এখেত হ’ল ${activePerson.name}, ${activePerson.relation}। ${activePerson.coreMemory}`
          : `This is ${activePerson.name}, ${activePerson.relation}. ${activePerson.coreMemory}`;

      speakAloud(speechPrompt, undefined, currentLang.speechCode);
    }
  };

  const handleNextPerson = () => {
    triggerHaptic('light');
    setIsScanning(true);
    setTimeout(() => {
      setSelectedPersonIndex((prev) => (prev + 1) % enrolledPersons.length);
      setIsScanning(false);
      setSheetVisible(true);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      {/* Simulated Live Camera Viewport */}
      <View style={styles.cameraViewport}>
        <Image
          source={{ uri: activePerson.photoUri }}
          style={styles.cameraFeedImage}
          resizeMode="cover"
        />
        <View style={styles.cameraOverlay} />

        {/* Top Floating Controls */}
        <View style={styles.cameraTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              navigateTo('HOME');
            }}
            accessibilityRole="button"
            accessibilityLabel={t.home}
          >
            <ChevronLeft size={28} color="#2D3748" />
            <Text style={styles.backButtonText}>{t.home}</Text>
          </TouchableOpacity>

          <View style={styles.topRightRow}>
            <LanguageSwitcher compact />
            <View style={styles.aiStatusBadge}>
              <Sparkles size={16} color="#4B6584" />
              <Text style={styles.aiStatusText}>{t.aiVisionActive}</Text>
            </View>
          </View>
        </View>

        {/* High-Contrast Facial Recognition Bounding Box Overlay */}
        <View style={styles.boundingBoxContainer}>
          <View style={[styles.targetBox, isScanning && styles.targetBoxScanning]}>
            {/* Corner Markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Match Floating Tag */}
            <View style={styles.confidenceTag}>
              <CheckCircle2 size={16} color="#556B48" />
              <Text style={styles.confidenceText}>99.4% {t.matchVerified}</Text>
            </View>
          </View>
        </View>

        {/* Switch Person / Camera Scan Selector */}
        <TouchableOpacity
          style={styles.switchPersonFab}
          onPress={handleNextPerson}
          activeOpacity={0.8}
        >
          <Users size={20} color="#2D3748" />
          <Text style={styles.switchPersonText}>
            {t.scanNext} ({selectedPersonIndex + 1}/{enrolledPersons.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Identification Bottom Sheet */}
      {sheetVisible && (
        <View style={styles.bottomSheetContainer}>
          <View style={styles.sheetHandleBar} />

          <View style={styles.sheetHeader}>
            <View style={styles.photoWrapper}>
              <Image source={{ uri: activePerson.photoUri }} style={styles.profilePhoto} />
              <View style={styles.verifiedDot}>
                <CheckCircle2 size={22} color="#8FA382" />
              </View>
            </View>

            <View style={styles.personDetails}>
              {/* Name (32px Bold) */}
              <Text style={styles.personName}>{activePerson.name}</Text>

              {/* Relation (Highlighted Badge) */}
              <View style={styles.relationBadge}>
                <Text style={styles.relationBadgeText}>{activePerson.relation}</Text>
              </View>

              {activePerson.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#556B48" />
                  <Text style={styles.locationText}>{activePerson.location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Core Memory Card */}
          <View style={styles.memoryCard}>
            <Text style={styles.memoryLabel}>{t.coreMemoryPrompt}</Text>
            <Text style={styles.memoryText}>"{activePerson.coreMemory}"</Text>
          </View>

          {/* Action Buttons: Audio Replay and Close */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={handleSpeakMemory}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t.speakAloudBtn}
            >
              <Volume2 size={26} color="#FFFFFF" />
              <Text style={styles.audioButtonText}>{t.speakAloudBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                triggerHaptic('light');
                navigateTo('HOME');
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t.done}
            >
              <X size={24} color="#2D3748" />
              <Text style={styles.closeButtonText}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  },
  cameraViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  cameraFeedImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(251, 249, 243, 0.2)'
  },
  cameraTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    zIndex: 10
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 249, 243, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    minHeight: 46
  },
  backButtonText: {
    color: '#2D3748',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2
  },
  aiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3F8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#A0B2C6'
  },
  aiStatusText: {
    color: '#4B6584',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4
  },
  boundingBoxContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 170
  },
  targetBox: {
    width: 230,
    height: 270,
    borderColor: '#A0B2C6',
    borderWidth: 2,
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'rgba(160, 178, 198, 0.12)'
  },
  targetBoxScanning: {
    borderColor: '#E8B4B8'
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#4B6584'
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 16
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 16
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 16
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 16
  },
  confidenceTag: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10
  },
  confidenceText: {
    color: '#556B48',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4
  },
  switchPersonFab: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#F3EFE6',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5
  },
  switchPersonText: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6
  },
  bottomSheetContainer: {
    backgroundColor: '#FBF9F3',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 2.5,
    borderColor: '#E4DEC8',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16
  },
  sheetHandleBar: {
    width: 50,
    height: 5,
    backgroundColor: '#E4DEC8',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  photoWrapper: {
    position: 'relative'
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8FA382'
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12
  },
  personDetails: {
    marginLeft: 14,
    flex: 1
  },
  personName: {
    color: '#2D3748',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  relationBadge: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  relationBadgeText: {
    color: '#4B6584',
    fontSize: 16,
    fontWeight: '700'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  locationText: {
    color: '#556B48',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3
  },
  memoryCard: {
    backgroundColor: '#F3EFE6',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    marginBottom: 14
  },
  memoryLabel: {
    color: '#556B48',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  memoryText: {
    color: '#2D3748',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  audioButton: {
    flex: 2,
    backgroundColor: '#8FA382',
    borderColor: '#556B48',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 64,
    shadowColor: '#556B48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 64
  },
  closeButtonText: {
    color: '#2D3748',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 4
  }
});
