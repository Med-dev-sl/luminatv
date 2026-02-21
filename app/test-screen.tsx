/**
 * API Test Screen Component
 * Add this to your app to test backend connectivity
 * 
 * Usage in app: import { APITestScreen } from '@/components/APITestScreen';
 */

import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  testBackendConnection,
  testBackendStatus,
  runAllAPITests,
} from '@/lib/api-test';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed';
  result?: any;
  error?: string;
  timestamp?: string;
}

export const APITestScreen = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const addTestResult = (name: string, status: 'passed' | 'failed', result?: any, error?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTests((prev) => [...prev, { name, status, result, error, timestamp }]);
  };

  const handleRunHealthCheck = async () => {
    setRunning(true);
    const result = await testBackendConnection();
    addTestResult(
      'Health Check',
      result.success ? 'passed' : 'failed',
      result.data,
      result.error
    );
    setRunning(false);
  };

  const handleRunStatus = async () => {
    setRunning(true);
    const result = await testBackendStatus();
    addTestResult(
      'Status Check',
      result.success ? 'passed' : 'failed',
      result.data,
      result.error
    );
    setRunning(false);
  };

  const handleRunAllTests = async () => {
    setRunning(true);
    setTests([]);
    
    const results = await runAllAPITests();
    
    if (results.health.success) {
      addTestResult('Backend Health', 'passed', results.health.data);
    } else {
      addTestResult('Backend Health', 'failed', undefined, results.health.error);
    }

    if (results.status.success) {
      addTestResult('Backend Status', 'passed', results.status.data);
    } else {
      addTestResult('Backend Status', 'failed', undefined, results.status.error);
    }

    setRunning(false);
  };

  const handleClearResults = () => {
    setTests([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Backend API Tests</Text>
        <Text style={styles.subtitle}>
          Test connection to Django backend
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, running && styles.buttonDisabled]}
          onPress={handleRunHealthCheck}
          disabled={running}
        >
          <Text style={styles.buttonText}>Health Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, running && styles.buttonDisabled]}
          onPress={handleRunStatus}
          disabled={running}
        >
          <Text style={styles.buttonText}>Status Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSuccess, running && styles.buttonDisabled]}
          onPress={handleRunAllTests}
          disabled={running}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleClearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        {tests.length === 0 ? (
          <Text style={styles.emptyText}>No tests run yet. Tap a button above to start.</Text>
        ) : (
          tests.map((test, index) => (
            <View
              key={index}
              style={[
                styles.testResult,
                test.status === 'passed' ? styles.resultPassed : styles.resultFailed,
              ]}
            >
              <Text style={styles.testName}>
                {test.status === 'passed' ? '✅' : '❌'} {test.name}
              </Text>
              <Text style={styles.testTime}>{test.timestamp}</Text>
              
              {test.result && (
                <Text style={styles.testData}>
                  {JSON.stringify(test.result, null, 2)}
                </Text>
              )}

              {test.error && (
                <Text style={styles.testError}>Error: {test.error}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    marginBottom: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSuccess: {
    backgroundColor: '#34C759',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
  },
  testResult: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultPassed: {
    borderLeftColor: '#34C759',
  },
  resultFailed: {
    borderLeftColor: '#FF3B30',
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  testData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  testError: {
    fontSize: 12,
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
