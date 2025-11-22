import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Upload, Search, Trash2, Database, CheckCircle, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  useUploadToRag,
  useQueryRag,
  useListRagFiles,
  useDeleteFromRag,
  useRagStatus,
  useClearRagStore,
} from '@/lib/gemini-rag';

export default function RagDemoScreen() {
  const [storeName, setStoreName] = useState<string>('default_store');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // RAG hooks
  const { uploadFile } = useUploadToRag();
  const { query } = useQueryRag();
  const { files, totalFiles, isLoading: filesLoading } = useListRagFiles(storeName);
  const { deleteFile } = useDeleteFromRag();
  const { status, isOnline, message } = useRagStatus();
  const { clearStore } = useClearRagStore();

  const handleQuery = async () => {
    if (!question.trim()) return;

    setIsQuerying(true);
    setAnswer('');

    try {
      const result = await query(question, storeName);
      setAnswer(result.answer);
    } catch (error) {
      setAnswer(`Error: ${error instanceof Error ? error.message : 'Query failed'}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      await deleteFile(fileName, storeName);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleClearStore = async () => {
    try {
      await clearStore(storeName);
    } catch (error) {
      console.error('Clear store failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gemini RAG Demo</Text>
        <Text style={styles.subtitle}>
          Retrieval-Augmented Generation with File Search
        </Text>
      </View>

      {/* Service Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Database color={Colors.light.text} size={20} />
          <Text style={styles.statusTitle}>RAG Service Status</Text>
        </View>
        <View style={styles.statusRow}>
          {isOnline ? (
            <CheckCircle color="#10B981" size={16} />
          ) : (
            <XCircle color="#EF4444" size={16} />
          )}
          <Text style={[
            styles.statusText,
            { color: isOnline ? '#10B981' : '#EF4444' }
          ]}>
            {status.toUpperCase()}
          </Text>
        </View>
        {message && (
          <Text style={styles.statusMessage}>{message}</Text>
        )}
      </View>

      {/* Store Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Store Configuration</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Enter store name"
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
        />
        <Text style={styles.hint}>
          Files: {totalFiles} • Store: {storeName}
        </Text>
      </View>

      {/* Query Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Query RAG</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask a question about your documents..."
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (!isOnline || isQuerying) && styles.buttonDisabled
          ]}
          onPress={handleQuery}
          disabled={!isOnline || isQuerying}
        >
          {isQuerying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Search color="#FFFFFF" size={20} />
              <Text style={styles.buttonText}>Query</Text>
            </>
          )}
        </TouchableOpacity>

        {answer && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Answer:</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        )}
      </View>

      {/* Files List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Indexed Files</Text>
          <TouchableOpacity
            style={[
              styles.iconButton,
              (!isOnline || totalFiles === 0) && styles.buttonDisabled
            ]}
            onPress={handleClearStore}
            disabled={!isOnline || totalFiles === 0}
          >
            <Trash2 color="#EF4444" size={20} />
          </TouchableOpacity>
        </View>

        {filesLoading ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : files.length === 0 ? (
          <Text style={styles.emptyText}>No files indexed yet</Text>
        ) : (
          <View style={styles.filesList}>
            {files.map((file: any, index: number) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>{file.name || file}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteFile(file.name || file)}
                  style={styles.deleteButton}
                >
                  <Trash2 color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Upload Section (Placeholder) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Files</Text>
        <Text style={styles.hint}>
          File upload from React Native requires native file picker integration.
          Use the RAG service UI at http://localhost:5001 to upload files.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            // TODO: Implement file picker with expo-document-picker
            console.log('File upload requires expo-document-picker integration');
          }}
        >
          <Upload color={Colors.light.text} size={20} />
          <Text style={styles.secondaryButtonText}>Select File (Coming Soon)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  statusCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 12,
    color: Colors.light.text,
    opacity: 0.7,
    marginTop: 8,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.light.text,
    opacity: 0.6,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  answerContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  fileName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.5,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
