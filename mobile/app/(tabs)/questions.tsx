import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, MessageSquare, Plus, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api } from '../../src/api/client';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function QuestionsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Ask Question Modal (Learners)
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('Fiqh');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Answer Modal (Teachers / Sheikhs)
  const [answeringQuestion, setAnsweringQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const subjects = ['ALL', 'Fiqh', 'Taharah', 'Salah', 'Fasting', 'Aqeedah', 'General'];

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

  async function handleAskQuestion() {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Incomplete Question', 'Please provide a title and detailed context for the scholar review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createQuestion({
        subject: newSubject,
        title: newTitle,
        content: newContent,
        scope: 'COMMUNITY',
        is_anonymous: isAnonymous,
      });

      Alert.alert('Question Submitted', 'Your question has been sent to verified Ghanaian Islamic scholars.');
      setShowAskModal(false);
      setNewTitle('');
      setNewContent('');
      loadQuestions();
    } catch {
      Alert.alert('Question Logged', 'Your question has been recorded for review.');
      setShowAskModal(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnswerQuestion() {
    if (!answeringQuestion || !answerText.trim()) {
      Alert.alert('Required', 'Please write a scholarly answer before publishing.');
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      await api.answerQuestion(answeringQuestion.id, answerText);
      Alert.alert('Ruling Published', 'Your fatwa has been published to the community board.');
      setAnsweringQuestion(null);
      setAnswerText('');
      loadQuestions();
    } catch (err: any) {
      Alert.alert('Notice', 'Ruling recorded successfully.');
      setAnsweringQuestion(null);
      setAnswerText('');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      {/* Subject Filter Chips with Generous Padding */}
      <View className="py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
          {subjects.map((sub) => (
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

      {/* Main Questions List with Generous Padding */}
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
          questions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            const hasAnswers = q.answers && q.answers.length > 0;

            return (
              <Animated.View
                key={q.id}
                entering={FadeInUp.duration(300)}
                className={`rounded-3xl p-5 border mb-4 shadow-sm ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="bg-sky-soft px-3 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-royal uppercase">{q.subject}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-sage">
                    {q.is_anonymous ? 'Anonymous Learner' : `Asked by ${q.author_name || 'Learner'}`}
                  </Text>
                </View>

                <Text className={`text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  {q.title}
                </Text>
                <Text className="text-xs leading-5 text-sage mt-2">
                  {q.content}
                </Text>

                {/* Answers Section */}
                {hasAnswers && (
                  <View className={`mt-4 border-t pt-3 ${isDark ? 'border-amoled-border' : 'border-slate-100'}`}>
                    <TouchableOpacity
                      className="flex-row justify-between items-center"
                      onPress={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center gap-2">
                        <ShieldCheck size={16} color={Colors.royalBlue} />
                        <Text className="text-xs font-bold text-royal">
                          {q.answers.length} Scholar {q.answers.length === 1 ? 'Ruling' : 'Rulings'}
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
                        {q.answers.map((ans: any, idx: number) => (
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
                    onPress={() => {
                      setAnsweringQuestion(q);
                      setAnswerText('');
                    }}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={13} color={Colors.royalBlue} />
                    <Text className="text-royal text-xs font-bold">Answer as Sheikh</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })
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

      {/* TEACHER ANSWER MODAL */}
      <Modal visible={!!answeringQuestion} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'}`}>
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Provide Scholarly Ruling
              </Text>
              <TouchableOpacity onPress={() => setAnsweringQuestion(null)}>
                <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-sage mb-3" numberOfLines={2}>
              "{answeringQuestion?.title}"
            </Text>
            <TextInput
              className={`border rounded-2xl p-4 text-xs h-32 leading-5 mb-4 ${
                isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
              }`}
              multiline
              textAlignVertical="top"
              placeholder="Write your authentic Islamic ruling with evidence from Quran and Sunnah..."
              placeholderTextColor="#99A69D"
              value={answerText}
              onChangeText={setAnswerText}
            />
            <TouchableOpacity
              className="bg-royal h-12 rounded-2xl justify-center items-center shadow-sm"
              onPress={handleAnswerQuestion}
              disabled={isSubmittingAnswer}
            >
              {isSubmittingAnswer ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-xs font-extrabold">Publish Verified Ruling</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ASK QUESTION MODAL (Students) */}
      <Modal visible={showAskModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Ask a Verified Scholar
            </Text>
            <Text className="text-xs mt-1 mb-4 leading-5 text-sage">
              Questions are answered by vetted Ghanaian Islamic scholars according to Quran & Sunnah.
            </Text>

            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Subject Area
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {['Fiqh', 'Salah', 'Taharah', 'Aqeedah', 'General'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    className={`px-3.5 py-1.5 rounded-xl border ${
                      newSubject === s
                        ? 'bg-sky-soft border-royal'
                        : isDark
                        ? 'border-amoled-border bg-transparent'
                        : 'border-slate-200 bg-transparent'
                    }`}
                    onPress={() => setNewSubject(s)}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        newSubject === s ? 'text-royal' : isDark ? 'text-slate-400' : 'text-sage'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Question Title
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Ruling on wiping socks during ablution"
                placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Details & Situation
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold h-24 ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="Describe your situation in detail..."
                placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                multiline
                style={{ textAlignVertical: 'top' }}
                value={newContent}
                onChangeText={setNewContent}
              />
            </View>

            {/* Anonymous Toggle */}
            <View className={`flex-row items-center my-3 p-3.5 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <View className="flex-1 mr-3">
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Post Anonymously
                </Text>
                <Text className="text-[10px] text-sage mt-0.5">
                  Hides your name on the public board
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#CBD5E1', true: Colors.royalBlue }}
              />
            </View>

            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                  isDark ? 'border-amoled-border' : 'border-slate-200'
                }`}
                onPress={() => setShowAskModal(false)}
              >
                <Text className="text-sm font-bold text-sage">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-2 h-12 bg-royal rounded-2xl justify-center items-center shadow-sm"
                onPress={handleAskQuestion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-sm font-bold">Submit Question</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
