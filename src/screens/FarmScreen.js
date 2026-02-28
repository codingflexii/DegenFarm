import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FarmScreen() {
  const [seeds, setSeeds] = useState(0);
  const [pendingSeeds, setPendingSeeds] = useState(0);
  const [lastHarvest, setLastHarvest] = useState(new Date());

  const SEEDS_PER_HOUR = 10;

  useEffect(() => {
    loadGameState();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hoursElapsed = (now - lastHarvest) / (1000 * 60 * 60);
      setPendingSeeds(hoursElapsed * SEEDS_PER_HOUR);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastHarvest]);

  const loadGameState = async () => {
    try {
      const savedSeeds = await AsyncStorage.getItem('seeds');
      const savedLastHarvest = await AsyncStorage.getItem('lastHarvest');
      if (savedSeeds) setSeeds(parseFloat(savedSeeds));
      if (savedLastHarvest) {
        setLastHarvest(new Date(savedLastHarvest));
      } else {
        const now = new Date();
        setLastHarvest(now);
        await AsyncStorage.setItem('lastHarvest', now.toISOString());
      }
    } catch (e) {
      console.log('Error loading game state:', e);
    }
  };

  const harvest = async () => {
    const now = new Date();
    const newTotal = seeds + pendingSeeds;
    setSeeds(newTotal);
    setPendingSeeds(0);
    setLastHarvest(now);
    await AsyncStorage.setItem('seeds', newTotal.toString());
    await AsyncStorage.setItem('lastHarvest', now.toISOString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 DEGEN FARM</Text>

      <View style={styles.seedBox}>
        <Text style={styles.seedLabel}>TOTAL SEEDS</Text>
        <Text style={styles.seedCount}>{Math.floor(seeds)}</Text>
      </View>

      <View style={styles.pendingBox}>
        <Text style={styles.pendingLabel}>READY TO HARVEST</Text>
        <Text style={styles.pendingCount}>{pendingSeeds.toFixed(4)}</Text>
        <Text style={styles.rateText}>+{SEEDS_PER_HOUR} SEEDS / hour</Text>
      </View>

      <TouchableOpacity style={styles.harvestBtn} onPress={harvest}>
        <Text style={styles.harvestText}>🌾 HARVEST</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9945FF',
    marginBottom: 40,
  },
  seedBox: {
    backgroundColor: '#1a0533',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9945FF',
    width: '100%',
  },
  seedLabel: {
    color: '#14F195',
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 8,
  },
  seedCount: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  pendingBox: {
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#14F195',
    width: '100%',
  },
  pendingLabel: {
    color: '#14F195',
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 8,
  },
  pendingCount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rateText: {
    color: '#666666',
    fontSize: 12,
  },
  harvestBtn: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  harvestText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});