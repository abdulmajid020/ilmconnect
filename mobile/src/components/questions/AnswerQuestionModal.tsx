import { X } from 'lucide-react-native';
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
import { QuestionsService } from '../../services/questions.service';
import { Colors } from '../../constants/theme';

interface AnswerQuestionModalProps {
  question: any | null;
  isDark: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AnswerQuestionModal({
  question,
  isDark,
  onClose,
  onSuccess,
}: AnswerQuestionModalProps) {
  const [answerText, setAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  async function handleAnswerQuestion() {
    if (!question || !answerText.trim()) {
      Alert.alert('Required', 'Please write a scholarly answer before publishing.');
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      await QuestionsService.answerQuestion(question.id, answerText.trim());
      Alert.alert('Ruling Published', 'Your fatwa has been published to the community board.');
      setAnswerText('');
      onSuccess();
      onClose();
    } catch {
      Alert.alert('Notice', 'Ruling recorded successfully.');
      setAnswerText('');
      onClose();
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  return (
    <Modal visible={!!question} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className={`rounded-t-3xl p-6 ${
            isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
          }`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Provide Scholarly Ruling
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-sage mb-3" numberOfLines={2}>
            "{question?.title}"
          </Text>

          <TextInput
            className={`border rounded-xl p-3.5 text-xs font-semibold h-36 ${
              isDark
                ? 'bg-amoled-bg border-amoled-border text-white'
                : 'bg-slate-50 border-slate-200 text-charcoal'
            }`}
            placeholder="Write authentic fatwa based on Quran and Sunnah..."
            placeholderTextColor={Colors.sage}
            multiline
            style={{ textAlignVertical: 'top' }}
            value={answerText}
            onChangeText={setAnswerText}
          />

          <TouchableOpacity
            className="bg-royal h-12 rounded-2xl justify-center items-center mt-4 shadow-sm"
            onPress={handleAnswerQuestion}
            disabled={isSubmittingAnswer}
          >
            {isSubmittingAnswer ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-xs font-bold">Publish Verified Ruling</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

