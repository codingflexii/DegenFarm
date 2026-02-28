import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

// ─── Character ability definitions ───────────────────────────────────────────
//
//  degen_ape  – base 10 seeds/h, DOUBLE harvest every other day
//               (tracked via a counter: harvestCount % 2 === 0 → 2x multiplier)
//
//  foxy       – base 8 seeds/h, extra +15% bonus on top of streak bonus
//               when current streak ≥ 3
//
//  okay_bear  – base 12 seeds/h, seeds never overflow / get wasted
//               (pendingSeeds is never capped; storage is effectively infinite)
//
// ─────────────────────────────────────────────────────────────────────────────

const CHARACTER_STATS = {
  degen_ape: { seedsPerHour: 10 },
  foxy:      { seedsPerHour: 8  },
  okay_bear: { seedsPerHour: 12 },
};

const DEFAULT_SEEDS_PER_HOUR = 10;

export default function FarmScreen({ route }) {
  const character = route?.params?.character ?? null;

  const [seeds, setSeeds] = useState(0);
  const [pendingSeeds, setPendingSeeds] = useState(0);
  const [lastHarvest, setLastHarvest] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [harvestedToday, setHarvestedToday] = useState(false);
  // Degen Ape: tracks total lifetime harvests to determine double-harvest turns
  const [harvestCount, setHarvestCount] = useState(0);

  const seedsPerHour = character
    ? (CHARACTER_STATS[character.id]?.seedsPerHour ?? DEFAULT_SEEDS_PER_HOUR)
    : DEFAULT_SEEDS_PER_HOUR;

  useEffect(() => {
    loadGameState();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hoursElapsed = (now - lastHarvest) / (1000 * 60 * 60);
      setPendingSeeds(hoursElapsed * seedsPerHour);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastHarvest, seedsPerHour]);

  const loadGameState = async () => {
    try {
      const savedSeeds          = await AsyncStorage.getItem('seeds');
      const savedLastHarvest    = await AsyncStorage.getItem('lastHarvest');
      const savedStreak         = await AsyncStorage.getItem('streak');
      const savedLastStreakDate  = await AsyncStorage.getItem('lastStreakDate');
      const savedHarvestCount   = await AsyncStorage.getItem('harvestCount');

      if (savedSeeds)        setSeeds(parseFloat(savedSeeds));
      if (savedStreak)       setStreak(parseInt(savedStreak));
      if (savedHarvestCount) setHarvestCount(parseInt(savedHarvestCount));

      if (savedLastHarvest) {
        setLastHarvest(new Date(savedLastHarvest));
      } else {
        const now = new Date();
        setLastHarvest(now);
        await AsyncStorage.setItem('lastHarvest', now.toISOString());
      }

      if (savedLastStreakDate) {
        const today     = new Date().toDateString();
        const lastDay   = new Date(savedLastStreakDate).toDateString();
        if (today === lastDay) {
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

  // ─── Bonus calculations ───────────────────────────────────────────────────

  const getStreakBonus = () => {
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.10;
    return 1.0;
  };

  /**
   * Returns the total harvest multiplier for the current harvest action.
   *
   * degen_ape: every other harvest (1st, 3rd, 5th…) is 2× — this is checked
   *            BEFORE incrementing harvestCount, so harvestCount % 2 === 0
   *            means "this is an even-numbered harvest" (0-indexed).
   *
   * foxy:      streak bonus stacks with an extra +15% when streak ≥ 3.
   *
   * okay_bear: no extra multiplier here — the benefit is no storage cap
   *            (pendingSeeds is never reset early by a cap).
   */
  const getTotalMultiplier = (currentHarvestCount) => {
    const streakBonus = getStreakBonus();

    if (character?.id === 'degen_ape') {
      // Double on even harvests (0th, 2nd, 4th…)
      const isDoubleHarvest = currentHarvestCount % 2 === 0;
      return streakBonus * (isDoubleHarvest ? 2.0 : 1.0);
    }

    if (character?.id === 'foxy' && streak >= 3) {
      return streakBonus * 1.15;
    }

    return streakBonus;
  };

  const harvest = async () => {
    const now = new Date();
    const multiplier = getTotalMultiplier(harvestCount);
    const earned     = pendingSeeds * multiplier;
    const newTotal   = seeds + earned;
    const newCount   = harvestCount + 1;

    setSeeds(newTotal);
    setPendingSeeds(0);
    setLastHarvest(now);
    setHarvestCount(newCount);

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
    await AsyncStorage.setItem('harvestCount', newCount.toString());

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

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7)  return '🔥🔥';
    if (streak >= 3)  return '🔥';
    return '💤';
  };

  const getBonusText = () => {
    const multiplier = getTotalMultiplier(harvestCount);
    if (multiplier > 1) return `+${Math.round((multiplier - 1) * 100)}% bonus active!`;
    return 'Harvest daily for bonus';
  };

  const getAbilityTag = () => {
    if (!character) return null;

    if (character.id === 'degen_ape') {
      const isNext2x = harvestCount % 2 === 0;
      return {
        label: isNext2x ? '⚡ DOUBLE HARVEST ACTIVE' : '⚡ Next double in 1 harvest',
        color: '#FF6B35',
      };
    }
    if (character.id === 'foxy') {
      return {
        label: streak >= 3
          ? '🦊 Foxy bonus: +15% active'
          : `🦊 Foxy bonus at streak ≥ 3 (${streak}/3)`,
        color: '#FF9900',
      };
    }
    if (character.id === 'okay_bear') {
      return {
        label: '🐻 Infinite storage — no seeds wasted',
        color: '#14F195',
      };
    }
    return null;
  };

  const abilityTag = getAbilityTag();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 DEGEN FARM</Text>

      {/* Character badge */}
      {character && (
        <View style={[styles.characterBadge, { borderColor: character.color ?? '#9945FF' }]}>
          <Text style={styles.characterEmoji}>{character.emoji}</Text>
          <Text style={[styles.characterName, { color: character.color ?? '#ffffff' }]}>
            {character.name}
          </Text>
        </View>
      )}

      {/* Ability tag */}
      {abilityTag && (
        <View style={[styles.abilityTag, { borderColor: abilityTag.color }]}>
          <Text style={[styles.abilityText, { color: abilityTag.color }]}>
            {abilityTag.label}
          </Text>
        </View>
      )}

      {/* Streak */}
      <View style={styles.streakBox}>
        <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
        <Text style={styles.streakCount}>{streak} day streak</Text>
        <Text style={styles.bonusText}>{getBonusText()}</Text>
        {harvestedToday && <Text style={styles.todayText}>✅ Harvested today</Text>}
      </View>

      {/* Total seeds */}
      <View style={styles.seedBox}>
        <Text style={styles.seedLabel}>TOTAL SEEDS</Text>
        <Text style={styles.seedCount}>{Math.floor(seeds)}</Text>
      </View>

      {/* Pending harvest */}
      <View style={styles.pendingBox}>
        <Text style={styles.pendingLabel}>READY TO HARVEST</Text>
        <Text style={styles.pendingCount}>{pendingSeeds.toFixed(4)}</Text>
        <Text style={styles.rateText}>+{seedsPerHour} SEEDS / hour</Text>
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
    marginBottom: 12,
  },
  characterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
  },
  characterEmoji: {
    fontSize: 18,
  },
  characterName: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  abilityTag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  abilityText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  streakBox: {
    backgroundColor: '#1a1000',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 12,
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
    marginBottom: 24,
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