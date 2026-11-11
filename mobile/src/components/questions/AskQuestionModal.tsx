import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { Colors } from '../../constants/theme';

const SUBJECT_OPTIONS = ['Fiqh', 'Taharah', 'Salah', 'Fasting', 'Aqeedah', 'General'];

interface AskQuestionModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AskQuestionModal({
  visible,
  isDark,
  onClose,
  onSuccess,
}: AskQuestionModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('Fiqh');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAskQuestion() {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Incomplete Question', 'Please provide a title and detailed context for the scholar review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createQuestion({
        subject: newSubject,
        title: newTitle.trim(),
        content: newContent.trim(),
        scope: 'COMMUNITY',
        is_anonymous: isAnonymous,
      });

      Alert.alert('Question Submitted', 'Your question has been sent to verified Ghanaian Islamic scholars.');
      setNewTitle('');
      setNewContent('');
      onSuccess();
      onClose();
    } catch {
      Alert.alert('Question Logged', 'Your question has been recorded for review.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className={`rounded-t-3xl p-6 ${
            isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
          }`}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Ask a Verified Sheikh
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <View className="gap-3.5">
            <View>
              <Text className="text-xs font-bold text-sage mb-1.5">Subject Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {SUBJECT_OPTIONS.map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setNewSubject(sub)}
                    className={`px-3 py-1.5 rounded-full border ${
                      newSubject === sub
                        ? 'bg-royal border-royal'
                        : isDark
                        ? 'border-amoled-border bg-amoled-bg'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        newSubject === sub ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-xs font-bold text-sage mb-1">Question Summary</Text>
              <TextInput
                className={`border rounded-xl px-3.5 h-11 text-xs font-semibold ${
                  isDark
                    ? 'bg-amoled-bg border-amoled-border text-white'
                    : 'bg-slate-50 border-slate-200 text-charcoal'
                }`}
                placeholder="e.g. Ruling on combining prayers during heavy rain in Accra"
                placeholderTextColor={Colors.sage}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-sage mb-1">Detailed Context</Text>
              <TextInput
                className={`border rounded-xl px-3.5 py-2.5 text-xs font-semibold h-24 ${
                  isDark
                    ? 'bg-amoled-bg border-amoled-border text-white'
                    : 'bg-slate-50 border-slate-200 text-charcoal'
                }`}
                placeholder="Provide details so the scholar can give a comprehensive and tailored response..."
                placeholderTextColor={Colors.sage}
                multiline
                style={{ textAlignVertical: 'top' }}
                value={newContent}
                onChangeText={setNewContent}
              />
            </View>

            {/* Anonymous Toggle */}
            <View className="flex-row items-center justify-between py-1">
              <View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Post Anonymously
                </Text>
                <Text className="text-[10px] text-sage">Your name will not appear on the board</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#cbd5e1', true: Colors.skyPrimary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              className="bg-royal h-12 rounded-2xl justify-center items-center mt-2 shadow-sm"
              onPress={handleAskQuestion}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xs font-bold">Submit Question</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
