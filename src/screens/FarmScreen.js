import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

export default function FarmScreen() {
  const [seeds, setSeeds] = useState(0);
  const [pendingSeeds, setPendingSeeds] = useState(0);
  const [lastHarvest, setLastHarvest] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [harvestedToday, setHarvestedToday] = useState(false);

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
      const savedStreak = await AsyncStorage.getItem('streak');
      const savedLastStreakDate = await AsyncStorage.getItem('lastStreakDate');

      if (savedSeeds) setSeeds(parseFloat(savedSeeds));
      if (savedStreak) setStreak(parseInt(savedStreak));

      if (savedLastHarvest) {
        const last = new Date(savedLastHarvest);
        setLastHarvest(last);
      } else {
        const now = new Date();
        setLastHarvest(now);
        await AsyncStorage.setItem('lastHarvest', now.toISOString());
      }

      if (savedLastStreakDate) {
        const today = new Date().toDateString();
        const lastStreakDay = new Date(savedLastStreakDate).toDateString();
        if (today === lastStreakDay) {
          setHarvestedToday(true);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (new Date(savedLastStreakDate).toDateString() !== yesterday.toDateString()) {
            setStreak(0);
            await AsyncStorage.setItem('streak', '0');
          }
        }
      }
    } catch (e) {
      console.log('Error loading game state:', e);
    }
  };

  const getStreakBonus = () => {
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.10;
    return 1.0;
  };

  const harvest = async () => {
    const now = new Date();
    const bonus = getStreakBonus();
    const earned = pendingSeeds * bonus;
    const newTotal = seeds + earned;

    setSeeds(newTotal);
    setPendingSeeds(0);
    setLastHarvest(now);

    let newStreak = streak;
    if (!harvestedToday) {
      newStreak = streak + 1;
      setStreak(newStreak);
      setHarvestedToday(true);
      await AsyncStorage.setItem('streak', newStreak.toString());
      await AsyncStorage.setItem('lastStreakDate', now.toISOString());
    }

    await AsyncStorage.setItem('seeds', newTotal.toString());
    await AsyncStorage.setItem('lastHarvest', now.toISOString());

    const username = await AsyncStorage.getItem('username');
    if (username) {
      await supabase
        .from('players')
        .update({
          total_seeds: Math.floor(newTotal),
          streak: newStreak,
          updated_at: now.toISOString(),
        })
        .eq('username', username);
    }
  };

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '💤';
  };

  const getBonusText = () => {
    const bonus = getStreakBonus();
    if (bonus > 1) return `+${Math.round((bonus - 1) * 100)}% bonus active!`;
    return 'Harvest daily for bonus';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 DEGEN FARM</Text>

      <View style={styles.streakBox}>
        <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
        <Text style={styles.streakCount}>{streak} day streak</Text>
        <Text style={styles.bonusText}>{getBonusText()}</Text>
        {harvestedToday && <Text style={styles.todayText}>✅ Harvested today</Text>}
      </View>

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
    marginBottom: 20,
  },
  streakBox: {
    backgroundColor: '#1a1000',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF9900',
    width: '100%',
  },
  streakEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  streakCount: {
    color: '#FF9900',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bonusText: {
    color: '#14F195',
    fontSize: 12,
  },
  todayText: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },
  seedBox: {
    backgroundColor: '#1a0533',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 42,
    fontWeight: 'bold',
  },
  pendingBox: {
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
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