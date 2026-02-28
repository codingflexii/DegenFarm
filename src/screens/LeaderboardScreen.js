import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadUsername();
    fetchLeaderboard();
  }, []);

  const loadUsername = async () => {
    const saved = await AsyncStorage.getItem('username');
    if (saved) setUsername(saved);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('username, character_id, total_seeds, streak')
        .order('total_seeds', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPlayers(data || []);
    } catch (e) {
      console.log('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCharacterEmoji = (characterId) => {
    switch (characterId) {
      case 'degen_ape': return '🐒';
      case 'foxy': return '🦊';
      case 'okay_bear': return '🐻';
      case 'monke': return '🐵';
      default: return '🌾';
    }
  };

  const getRankStyle = (index) => {
    if (index === 0) return styles.rank1;
    if (index === 1) return styles.rank2;
    if (index === 2) return styles.rank3;
    return styles.rankDefault;
  };

  const getRankLabel = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 LEADERBOARD</Text>
      <Text style={styles.subtitle}>Top 50 farmers by total SEEDS</Text>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchLeaderboard}>
        <Text style={styles.refreshText}>↻ Refresh</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#9945FF" size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {players.length === 0 ? (
            <Text style={styles.emptyText}>No farmers yet — be the first!</Text>
          ) : (
            players.map((player, index) => (
              <View
                key={player.username}
                style={[
                  styles.row,
                  player.username === username && styles.rowHighlight,
                ]}
              >
                <Text style={[styles.rank, getRankStyle(index)]}>
                  {getRankLabel(index)}
                </Text>
                <Text style={styles.emoji}>
                  {getCharacterEmoji(player.character_id)}
                </Text>
                <View style={styles.playerInfo}>
                  <Text style={[
                    styles.playerName,
                    player.username === username && styles.playerNameHighlight,
                  ]}>
                    {player.username}
                    {player.username === username ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.playerStreak}>🔥 {player.streak} day streak</Text>
                </View>
                <Text style={styles.seeds}>
                  {player.total_seeds.toLocaleString()}
                  {'\n'}
                  <Text style={styles.seedsLabel}>SEEDS</Text>
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9945FF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  refreshText: {
    color: '#9945FF',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  rowHighlight: {
    borderColor: '#9945FF',
    backgroundColor: '#1a0533',
  },
  rank: {
    width: 36,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rank1: { color: '#FFD700' },
  rank2: { color: '#C0C0C0' },
  rank3: { color: '#CD7F32' },
  rankDefault: { color: '#444444' },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerNameHighlight: {
    color: '#14F195',
  },
  playerStreak: {
    color: '#666666',
    fontSize: 11,
  },
  seeds: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  seedsLabel: {
    color: '#14F195',
    fontSize: 10,
  },
});