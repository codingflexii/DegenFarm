import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsernameScreen from './UsernameScreen';

const CHARACTERS = [
  {
    id: 'degen_ape',
    name: 'Degen Ape',
    emoji: '🐒',
    inspiration: 'Degenerate Ape Academy',
    production: 10,
    ability: 'Double harvest every other day',
    color: '#FF6B35',
  },
  {
    id: 'foxy',
    name: 'Foxy',
    emoji: '🦊',
    inspiration: 'Famous Fox Federation',
    production: 8,
    ability: '+15% harvest on streak ≥ 3',
    color: '#FF9900',
  },
  {
    id: 'okay_bear',
    name: 'Okay Bear',
    emoji: '🐻',
    inspiration: 'Okay Bears',
    production: 12,
    ability: 'Never loses harvest to full storage',
    color: '#14F195',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);

  const handleContinueToUsername = async () => {
    if (!selected) return;
    await AsyncStorage.setItem('character', JSON.stringify(selected));
    setStep(3);
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🌾 DEGEN FARM</Text>
        <Text style={styles.subtitle}>Built on Solana</Text>
        <Text style={styles.description}>
          Mint your farm for 0.033 SOL and start growing SEEDS daily. Harvest every day to build your streak and climb the leaderboard.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
          <Text style={styles.primaryBtnText}>GET STARTED →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 3) {
    return (
      <UsernameScreen
        character={selected}
        walletAddress="demo_wallet_address"
        onComplete={async (username) => {
          await AsyncStorage.setItem('username', username);
          await AsyncStorage.setItem('onboarded', 'true');
          onComplete(selected);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Farmer</Text>
      <Text style={styles.subtitle}>Your character determines your farming style</Text>

      {CHARACTERS.map((char) => (
        <TouchableOpacity
          key={char.id}
          style={[
            styles.characterCard,
            selected?.id === char.id && { borderColor: char.color, borderWidth: 2 },
          ]}
          onPress={() => setSelected(char)}
        >
          <Text style={styles.characterEmoji}>{char.emoji}</Text>
          <View style={styles.characterInfo}>
            <Text style={styles.characterName}>{char.name}</Text>
            <Text style={styles.characterInspiration}>Inspired by {char.inspiration}</Text>
            <Text style={styles.characterProduction}>⚡ {char.production} SEEDS / hour</Text>
            <Text style={styles.characterAbility}>✨ {char.ability}</Text>
          </View>
          {selected?.id === char.id && (
            <Text style={[styles.selectedBadge, { color: char.color }]}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
        onPress={handleContinueToUsername}
        disabled={!selected}
      >
        <Text style={styles.primaryBtnText}>
          {selected ? `Continue as ${selected.name} →` : 'Select a character'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9945FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#14F195',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  characterCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  characterEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  characterInspiration: {
    color: '#666666',
    fontSize: 11,
    marginBottom: 6,
  },
  characterProduction: {
    color: '#14F195',
    fontSize: 13,
    marginBottom: 2,
  },
  characterAbility: {
    color: '#9945FF',
    fontSize: 12,
  },
  selectedBadge: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: '#9945FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnDisabled: {
    backgroundColor: '#333333',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});