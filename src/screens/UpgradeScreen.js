import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPGRADES = [
  { id: 'tools1', name: 'Better Tools Lv.1', description: '+20% production', cost: 500, bonus: 0.2 },
  { id: 'tools2', name: 'Better Tools Lv.2', description: '+50% production', cost: 2000, bonus: 0.5, requires: 'tools1' },
  { id: 'tools3', name: 'Better Tools Lv.3', description: '+100% production', cost: 8000, bonus: 1.0, requires: 'tools2' },
  { id: 'storage1', name: 'Bigger Storage Lv.1', description: '2x max storage', cost: 300, bonus: 0 },
  { id: 'storage2', name: 'Bigger Storage Lv.2', description: '5x max storage', cost: 1500, bonus: 0, requires: 'storage1' },
  { id: 'slot', name: 'New Character Slot', description: 'Add another farmer', cost: 5000, bonus: 0 },
];

export default function UpgradeScreen() {
  const [seeds, setSeeds] = useState(0);
  const [purchased, setPurchased] = useState([]);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const savedSeeds = await AsyncStorage.getItem('seeds');
      const savedPurchased = await AsyncStorage.getItem('purchased');
      if (savedSeeds) setSeeds(parseFloat(savedSeeds));
      if (savedPurchased) setPurchased(JSON.parse(savedPurchased));
    } catch (e) {
      console.log('Error loading upgrades:', e);
    }
  };

  const isUnlocked = (upgrade) => {
    if (!upgrade.requires) return true;
    return purchased.includes(upgrade.requires);
  };

  const canAfford = (upgrade) => seeds >= upgrade.cost;

  const buy = async (upgrade) => {
    if (!canAfford(upgrade) || !isUnlocked(upgrade) || purchased.includes(upgrade.id)) return;
    const newSeeds = seeds - upgrade.cost;
    const newPurchased = [...purchased, upgrade.id];
    setSeeds(newSeeds);
    setPurchased(newPurchased);
    await AsyncStorage.setItem('seeds', newSeeds.toString());
    await AsyncStorage.setItem('purchased', JSON.stringify(newPurchased));
  };

  const getStatus = (upgrade) => {
    if (purchased.includes(upgrade.id)) return 'owned';
    if (!isUnlocked(upgrade)) return 'locked';
    if (!canAfford(upgrade)) return 'expensive';
    return 'available';
  };

  const getButtonStyle = (status) => {
    switch (status) {
      case 'owned': return styles.btnOwned;
      case 'locked': return styles.btnLocked;
      case 'expensive': return styles.btnExpensive;
      default: return styles.btnAvailable;
    }
  };

  const getButtonText = (upgrade, status) => {
    switch (status) {
      case 'owned': return '✅ Owned';
      case 'locked': return `🔒 Requires ${upgrade.requires}`;
      case 'expensive': return `${upgrade.cost} SEEDS`;
      default: return `Buy — ${upgrade.cost} SEEDS`;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>⚡ UPGRADES</Text>
      <View style={styles.seedsBar}>
        <Text style={styles.seedsText}>💰 {Math.floor(seeds)} SEEDS available</Text>
      </View>
      {UPGRADES.map((upgrade) => {
        const status = getStatus(upgrade);
        return (
          <View key={upgrade.id} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{upgrade.name}</Text>
              <Text style={styles.cardDesc}>{upgrade.description}</Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, getButtonStyle(status)]}
              onPress={() => buy(upgrade)}
              disabled={status !== 'available'}
            >
              <Text style={styles.btnText}>{getButtonText(upgrade, status)}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9945FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  seedsBar: {
    backgroundColor: '#1a0533',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  seedsText: {
    color: '#14F195',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#666666',
    fontSize: 12,
  },
  btn: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  btnAvailable: {
    backgroundColor: '#9945FF',
  },
  btnOwned: {
    backgroundColor: '#1a3320',
    borderWidth: 1,
    borderColor: '#14F195',
  },
  btnLocked: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  btnExpensive: {
    backgroundColor: '#1a0a00',
    borderWidth: 1,
    borderColor: '#FF4400',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});