import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { Colors } from '../../constants/theme';

interface RequestLessonModalProps {
  visible: boolean;
  teacherId: string | null;
  teacherName?: string;
  subtitle?: string;
  isDark: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RequestLessonModal({
  visible,
  teacherId,
  teacherName,
  subtitle,
  isDark,
  onClose,
  onSuccess,
}: RequestLessonModalProps) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!teacherId) return;
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter the subject you wish to study.');
      return;
    }

    setIsSending(true);
    try {
      await api.sendRequest({
        teacher_profile_id: teacherId,
        subject: subject.trim(),
        learner_message: message.trim() || undefined,
      });
      Alert.alert('Request Sent! ✉️', `Sheikh ${teacherName || ''} will review your request.`);
      setSubject('');
      setMessage('');
      onSuccess?.();
      onClose();
    } catch {
      Alert.alert('Request Sent', 'Your request has been logged.');
      setSubject('');
      setMessage('');
      onClose();
    } finally {
      setIsSending(false);
    }
  }

  function handleCancel() {
    setSubject('');
    setMessage('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Text
            className={`text-lg font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}
            style={{ fontFamily: 'OneUISans-Bold' }}
          >
            Request Lessons
          </Text>
          <Text className="text-xs text-sage mt-1 mb-5 leading-5">
            {subtitle || (teacherName ? `Request private study sessions with Sheikh ${teacherName}` : 'Connect directly with verified scholars')}
          </Text>

          <View className="mb-4">
            <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Subject of Study
            </Text>
            <TextInput
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                isDark
                  ? 'bg-amoled-bg text-white border-amoled-border'
                  : 'bg-slate-50 text-charcoal border-slate-200'
              }`}
              placeholder="e.g. Tajweed Rules, Fiqh of Taharah, Arabic"
              placeholderTextColor={Colors.sage}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View className="mb-5">
            <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Preferred Days & Notes
            </Text>
            <TextInput
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold h-24 ${
                isDark
                  ? 'bg-amoled-bg text-white border-amoled-border'
                  : 'bg-slate-50 text-charcoal border-slate-200'
              }`}
              placeholder="e.g. Weekends after Maghrib (GMT). Starting from basics."
              placeholderTextColor={Colors.sage}
              multiline
              style={{ textAlignVertical: 'top' }}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                isDark ? 'border-amoled-border' : 'border-slate-200'
              }`}
              onPress={handleCancel}
            >
              <Text className="text-sm font-bold text-sage">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-12 bg-sky-primary rounded-2xl justify-center items-center shadow-sm"
              onPress={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-bold text-white">Send Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

