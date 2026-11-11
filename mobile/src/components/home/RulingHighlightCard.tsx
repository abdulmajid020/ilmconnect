import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';

interface RulingHighlightCardProps {
  questions: any[];
  isDark: boolean;
}

export function RulingHighlightCard({ questions, isDark }: RulingHighlightCardProps) {
  const router = useRouter();

  return (
    <View className="px-6 mt-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-charcoal'}`}>
          Scholar Ruling Highlight
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/questions')}>
          <Text className="text-xs font-bold text-royal">Q&A Board</Text>
        </TouchableOpacity>
      </View>

      {questions.length > 0 ? (
        questions.slice(0, 1).map((q) => (
          <TouchableOpacity
            key={q.id}
            className={`rounded-3xl p-6 border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/questions')}
            activeOpacity={0.85}
          >
            <View className="flex-row justify-between items-center mb-2.5">
              <View className="bg-sky-soft px-3 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-royal uppercase">{q.subject}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 size={13} color={Colors.royalBlue} />
                <Text className="text-xs font-bold text-royal">Verified Scholar</Text>
              </View>
            </View>

            <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>{q.title}</Text>
            <Text className="text-xs leading-5 text-sage mt-2" numberOfLines={2}>
              {q.answer || q.content}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <View
          className={`rounded-3xl p-6 border shadow-sm items-center ${
            isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
          }`}
        >
          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
            No Community Questions Yet
          </Text>
          <Text className="text-xs text-sage text-center mt-1 leading-5">
            Have a question regarding prayer, fasting, or worship? Ask a verified scholar today.
          </Text>
          <TouchableOpacity
            className="bg-royal px-5 py-2.5 rounded-2xl mt-4"
            onPress={() => router.push('/(tabs)/questions')}
            activeOpacity={0.85}
          >
            <Text className="text-white text-xs font-bold">Ask Scholar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

