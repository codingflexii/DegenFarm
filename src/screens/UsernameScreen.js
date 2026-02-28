import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

export default function UsernameScreen({ character, walletAddress, onComplete }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = () => {
    if (username.length < 3) return false;
    if (username.length > 20) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    return true;
  };

  const getValidationMessage = () => {
    if (username.length === 0) return '';
    if (username.length < 3) return 'Minimum 3 characters';
    if (username.length > 20) return 'Maximum 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers and underscore allowed';
    return '✅ Looks good!';
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    setLoading(true);
    setError('');

    try {
      const { data: existing } = await supabase
        .from('players')
        .select('username')
        .eq('username', username)
        .single();

      if (existing) {
        setError('Username already taken, try another!');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('players')
        .insert({
          wallet_address: walletAddress,
          username: username,
          character_id: character.id,
          total_seeds: 0,
          streak: 0,
        });

      if (insertError) throw insertError;

      onComplete(username);
    } catch (e) {
      setError('Something went wrong, try again!');
      console.log('Error creating player:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Username</Text>
      <Text style={styles.subtitle}>This is how you appear on the leaderboard</Text>

      <View style={styles.characterPreview}>
        <Text style={styles.characterEmoji}>{character.emoji}</Text>
        <Text style={styles.characterName}>{character.name}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter username..."
        placeholderTextColor="#444444"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />

      <Text style={[
        styles.validation,
        getValidationMessage().startsWith('✅') ? styles.validGreen : styles.validRed
      ]}>
        {getValidationMessage()}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, (!isValid() || loading) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid() || loading}
      >
        {loading
          ? <ActivityIndicator color="#ffffff" />
          : <Text style={styles.btnText}>Join Degen Farm →</Text>
        }
      </TouchableOpacity>

      <Text style={styles.note}>You can change your username once every 30 days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9945FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  characterPreview: {
    alignItems: 'center',
    marginBottom: 32,
  },
  characterEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  characterName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#9945FF',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 18,
    width: '100%',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  validation: {
    fontSize: 12,
    marginBottom: 16,
    height: 18,
  },
  validGreen: {
    color: '#14F195',
  },
  validRed: {
    color: '#FF4444',
  },
  error: {
    color: '#FF4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#9945FF',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: '#333333',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    color: '#444444',
    fontSize: 11,
    textAlign: 'center',
  },
});