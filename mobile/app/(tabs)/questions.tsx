import { HelpCircle, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../src/api/client';
import { AnswerQuestionModal } from '../../src/components/questions/AnswerQuestionModal';
import { AskQuestionModal } from '../../src/components/questions/AskQuestionModal';
import { QuestionCard } from '../../src/components/questions/QuestionCard';
import { SUBJECT_OPTIONS } from '../../src/constants/labels';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const SUBJECTS = ['ALL', ...SUBJECT_OPTIONS];

export default function QuestionsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Modals
  const [showAskModal, setShowAskModal] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, [selectedSubject]);

  async function loadQuestions() {
    setIsLoading(true);
    try {
      const filter = selectedSubject === 'ALL' ? '' : selectedSubject;
      const res = await api.listQuestions(filter).catch(() => []);
      setQuestions(Array.isArray(res) ? res : []);
    } catch {
      setQuestions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      {/* Subject Filter Chips */}
      <View className="py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {SUBJECTS.map((sub) => (
            <TouchableOpacity
              key={sub}
              className={`px-4 py-2 rounded-full border-2 ${
                selectedSubject === sub
                  ? 'bg-royal border-royal'
                  : isDark
                  ? 'bg-transparent border-amoled-border'
                  : 'bg-transparent border-slate-200'
              }`}
              onPress={() => setSelectedSubject(sub)}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedSubject === sub ? 'text-white' : 'text-sage'
                }`}
              >
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Questions List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadQuestions();
              setRefreshing(false);
            }}
            tintColor={Colors.skyPrimary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.skyPrimary} className="mt-12" />
        ) : questions.length === 0 ? (
          <View
            className={`rounded-3xl p-8 items-center border mt-4 ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
          >
            <HelpCircle size={32} color={Colors.sage} />
            <Text className={`text-sm font-bold mt-3 ${isDark ? 'text-white' : 'text-charcoal'}`}>
              No Questions Yet
            </Text>
            <Text className="text-xs text-center text-sage mt-1.5 leading-5">
              {selectedSubject === 'ALL'
                ? 'Be the first to ask a verified scholar a religious or worship question.'
                : `No questions found under ${selectedSubject}.`}
            </Text>
          </View>
        ) : (
          questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isDark={isDark}
              isTeacher={isTeacher}
              isExpanded={expandedQuestionId === q.id}
              onToggleExpand={() =>
                setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)
              }
              onAnswer={() => setAnsweringQuestion(q)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Ask Button (Learners Only) */}
      {!isTeacher && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 flex-row items-center gap-2 bg-royal px-5 py-3.5 rounded-full shadow-lg shadow-royal/40"
          onPress={() => setShowAskModal(true)}
          activeOpacity={0.9}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold">Ask a Question</Text>
        </TouchableOpacity>
      )}

      {/* Ask Question Modal */}
      <AskQuestionModal
        visible={showAskModal}
        isDark={isDark}
        onClose={() => setShowAskModal(false)}
        onSuccess={loadQuestions}
      />

      {/* Teacher Answer Modal */}
      <AnswerQuestionModal
        question={answeringQuestion}
        isDark={isDark}
        onClose={() => setAnsweringQuestion(null)}
        onSuccess={loadQuestions}
      />
    </View>
  );
}
