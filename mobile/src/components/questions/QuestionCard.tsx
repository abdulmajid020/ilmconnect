import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

interface QuestionCardProps {
  question: any;
  isDark: boolean;
  isTeacher: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAnswer: () => void;
}

export function QuestionCard({
  question,
  isDark,
  isTeacher,
  isExpanded,
  onToggleExpand,
  onAnswer,
}: QuestionCardProps) {
  const hasAnswers = question.answers && question.answers.length > 0;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      className={`rounded-3xl p-5 border mb-4 shadow-sm ${
        isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
      }`}
    >
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="bg-sky-soft px-3 py-1 rounded-md">
          <Text className="text-[10px] font-bold text-royal uppercase">{question.subject}</Text>
        </View>
        <Text className="text-xs font-semibold text-sage">
          {question.is_anonymous ? 'Anonymous Learner' : `Asked by ${question.author_name || 'Learner'}`}
        </Text>
      </View>

      <Text className={`text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>
        {question.title}
      </Text>
      <Text className="text-xs leading-5 text-sage mt-2">{question.content}</Text>

      {/* Answers Section */}
      {hasAnswers && (
        <View className={`mt-4 border-t pt-3 ${isDark ? 'border-amoled-border' : 'border-slate-100'}`}>
          <TouchableOpacity
            className="flex-row justify-between items-center"
            onPress={onToggleExpand}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={16} color={Colors.royalBlue} />
              <Text className="text-xs font-bold text-royal">
                {question.answers.length} Scholar {question.answers.length === 1 ? 'Ruling' : 'Rulings'}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={16} color={Colors.sage} />
            ) : (
              <ChevronDown size={16} color={Colors.sage} />
            )}
          </TouchableOpacity>

          {isExpanded && (
            <View className={`mt-3 rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              {question.answers.map((ans: any, idx: number) => (
                <View key={ans.id || idx} className="mb-2">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Text className="text-xs font-bold text-royal">{ans.teacher_name}</Text>
                    <CheckCircle2 size={13} color={Colors.royalBlue} />
                  </View>
                  <Text className={`text-xs leading-5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                    {ans.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Teacher Action: Answer Question */}
      {isTeacher && (
        <TouchableOpacity
          className="mt-3.5 py-2 px-3.5 bg-sky-soft rounded-xl flex-row items-center gap-1.5 self-start"
          onPress={onAnswer}
          activeOpacity={0.8}
        >
          <MessageSquare size={13} color={Colors.royalBlue} />
          <Text className="text-royal text-xs font-bold">Answer as Sheikh</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

