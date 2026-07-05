import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmail, signUpWithEmail } from '../lib/auth';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'signUp') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      // On success, onAuthChange in App.tsx picks up the new session automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>WildDex</Text>
      <Text style={styles.subtitle}>{mode === 'signUp' ? 'Create an account' : 'Sign in to continue'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8b949e"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8b949e"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === 'signUp' ? 'Sign Up' : 'Sign In'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleButton}
        disabled
      >
        <Text style={styles.googleButtonText}>Continue with Google (coming soon)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => {
          setError(null);
          setMode(mode === 'signUp' ? 'signIn' : 'signUp');
        }}
      >
        <Text style={styles.toggleText}>
          {mode === 'signUp' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', padding: 24 },
  title: { color: '#e6edf3', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#8b949e', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 10,
    padding: 14,
    color: '#e6edf3',
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: { color: '#f85149', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  button: {
    backgroundColor: '#238636',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  googleButton: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.5,
  },
  googleButtonText: { color: '#8b949e', fontSize: 15, fontWeight: '600' },
  toggleRow: { marginTop: 24, alignItems: 'center' },
  toggleText: { color: '#58a6ff', fontSize: 14 },
});
