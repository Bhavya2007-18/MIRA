import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useMiraStore } from './src/store/useMiraStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AIVisionScreen } from './src/screens/AIVisionScreen';
import { GamesHubScreen } from './src/screens/GamesHubScreen';
import { CardGame } from './src/screens/games/CardGame';
import { AuditoryGame } from './src/screens/games/AuditoryGame';
import { MathsGame } from './src/screens/games/MathsGame';
import { UploadPersonScreen } from './src/screens/UploadPersonScreen';

export default function App() {
  const { currentScreen, isAuthenticated } = useMiraStore();

  const renderActiveScreen = () => {
    if (!isAuthenticated || currentScreen === 'LOGIN') {
      return <LoginScreen />;
    }

    switch (currentScreen) {
      case 'HOME':
        return <HomeScreen />;
      case 'AI_VISION':
        return <AIVisionScreen />;
      case 'GAMES_HUB':
        return <GamesHubScreen />;
      case 'CARD_GAME':
        return <CardGame />;
      case 'AUDITORY_GAME':
        return <AuditoryGame />;
      case 'MATHS_GAME':
        return <MathsGame />;
      case 'UPLOAD_PERSON':
        return <UploadPersonScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.appRoot}>
      <StatusBar style="dark" backgroundColor="#FBF9F3" />
      {renderActiveScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  }
});
