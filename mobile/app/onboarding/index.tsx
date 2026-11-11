import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selections
  const [knowledgeLevel, setKnowledgeLevel] = useState('BEGINNER');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Tajweed', 'Fiqh']);
  const [preferredFormat, setPreferredFormat] = useState('COMBINATION');

  const levels = [
    { key: 'BEGINNER', title: 'Beginner', desc: 'Starting from Arabic letters, pronunciation, and basic wudu/prayer' },
    { key: 'BASIC', title: 'Basic Knowledge', desc: 'Can read Qur\'an slowly, know prayer basics, desire structured Tajweed' },
    { key: 'INTERMEDIATE', title: 'Intermediate', desc: 'Attended Madrassa previously, refreshing and deepening fiqh rulings' },
    { key: 'ADVANCED', title: 'Advanced / Tajweed Focus', desc: 'Classical texts, Ijazah preparation, or Arabic grammar' },
  ];

  const goalsList = [
    'Qur\'an Reading',
    'Tajweed Rules',
    'Fiqh',
    'Aqeedah',
    'Arabic Language',
    'Hadith Studies',
    'Seerah',
  ];

  const formats = [
    { key: 'ONE_ON_ONE', title: 'Personal Sheikh (1-on-1)', desc: 'Direct personalized mentorship & flexible live schedule' },
    { key: 'GROUP_MADRASSA', title: 'Group Madrassa Class', desc: 'Structured weekend classes with fellow learners (max 20)' },
    { key: 'COMBINATION', title: 'Combination (Recommended)', desc: '1-on-1 recitation + weekend group fiqh classes' },
  ];

  function toggleGoal(goal: string) {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter((g) => g !== goal));
      }
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      await api.saveProfile({
        knowledge_level: knowledgeLevel,
        learning_goals: selectedGoals,
        preferred_format: preferredFormat,
      });
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      <View className="flex-1">
        {/* Top Progress Header */}
        <View className="flex-row items-center justify-between px-5 py-3.5">
          {step > 1 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} className="p-1">
              <ArrowLeft size={20} color={isDark ? '#FFFFFF' : Colors.charcoal} />
            </TouchableOpacity>
          ) : (
            <View className="w-5" />
          )}

          <View className="flex-row gap-1.5 flex-1 mx-4">
            <View className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-royal' : isDark ? 'bg-amoled-border' : 'bg-slate-200'}`} />
            <View className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-royal' : isDark ? 'bg-amoled-border' : 'bg-slate-200'}`} />
            <View className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-royal' : isDark ? 'bg-amoled-border' : 'bg-slate-200'}`} />
          </View>

          <Text className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-sage'}`}>{step} of 3</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* STEP 1 */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)} className="flex-1">
              <Text className="text-[10px] font-extrabold tracking-wider text-royal mb-2">STEP 1 OF 3</Text>
              <Text className={`text-2xl font-extrabold leading-7 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Current Knowledge Level
              </Text>
              <Text className={`text-xs mt-1.5 mb-6 leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
                This helps Ghanaian scholars tailor their recitation pacing for you.
              </Text>

              <View className="gap-3">
                {levels.map((lvl) => {
                  const isSelected = knowledgeLevel === lvl.key;
                  return (
                    <TouchableOpacity
                      key={lvl.key}
                      className={`flex-row items-center border-2 rounded-2xl p-4.5 ${
                        isSelected
                          ? 'border-royal bg-sky-soft/30'
                          : isDark
                          ? 'bg-amoled-card border-amoled-border'
                          : 'bg-white border-slate-200'
                      }`}
                      onPress={() => setKnowledgeLevel(lvl.key)}
                      activeOpacity={0.85}
                    >
                      <View className="flex-1">
                        <Text className={`text-sm font-extrabold ${isSelected ? 'text-royal' : isDark ? 'text-white' : 'text-charcoal'}`}>
                          {lvl.title}
                        </Text>
                        <Text className={`text-[11px] mt-1 leading-4 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
                          {lvl.desc}
                        </Text>
                      </View>
                      <View
                        className={`w-5.5 h-5.5 rounded-full border-2 justify-center items-center ml-3 ${
                          isSelected ? 'bg-royal border-royal' : isDark ? 'border-amoled-border' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(300)} className="flex-1">
              <Text className="text-[10px] font-extrabold tracking-wider text-royal mb-2">STEP 2 OF 3</Text>
              <Text className={`text-2xl font-extrabold leading-7 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Learning Goals
              </Text>
              <Text className={`text-xs mt-1.5 mb-6 leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
                Select all the Islamic sciences you wish to study.
              </Text>

              <View className="flex-row flex-wrap gap-2.5">
                {goalsList.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <TouchableOpacity
                      key={goal}
                      className={`flex-row items-center border-2 px-4 py-3 rounded-2xl ${
                        isSelected
                          ? 'border-royal bg-sky-soft/30'
                          : isDark
                          ? 'bg-amoled-card border-amoled-border'
                          : 'bg-white border-slate-200'
                      }`}
                      onPress={() => toggleGoal(goal)}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-royal' : isDark ? 'text-white' : 'text-charcoal'}`}>
                        {goal}
                      </Text>
                      {isSelected ? <Check size={14} color={Colors.royalBlue} className="ml-1.5" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <Animated.View entering={FadeInDown.duration(300)} className="flex-1">
              <Text className="text-[10px] font-extrabold tracking-wider text-royal mb-2">STEP 3 OF 3</Text>
              <Text className={`text-2xl font-extrabold leading-7 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Preferred Learning Format
              </Text>
              <Text className={`text-xs mt-1.5 mb-6 leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
                Choose between private 1-on-1 sheikh sessions or interactive group classes.
              </Text>

              <View className="gap-3">
                {formats.map((fmt) => {
                  const isSelected = preferredFormat === fmt.key;
                  return (
                    <TouchableOpacity
                      key={fmt.key}
                      className={`flex-row items-center border-2 rounded-2xl p-4.5 ${
                        isSelected
                          ? 'border-royal bg-sky-soft/30'
                          : isDark
                          ? 'bg-amoled-card border-amoled-border'
                          : 'bg-white border-slate-200'
                      }`}
                      onPress={() => setPreferredFormat(fmt.key)}
                      activeOpacity={0.85}
                    >
                      <View className="flex-1">
                        <Text className={`text-sm font-extrabold ${isSelected ? 'text-royal' : isDark ? 'text-white' : 'text-charcoal'}`}>
                          {fmt.title}
                        </Text>
                        <Text className={`text-[11px] mt-1 leading-4 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
                          {fmt.desc}
                        </Text>
                      </View>
                      <View
                        className={`w-5.5 h-5.5 rounded-full border-2 justify-center items-center ml-3 ${
                          isSelected ? 'bg-royal border-royal' : isDark ? 'border-amoled-border' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View className={`p-5 border-t ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}>
          {step < 3 ? (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-royal rounded-2xl h-13 shadow-sm"
              onPress={() => setStep(step + 1)}
              activeOpacity={0.85}
            >
              <Text className="text-white text-sm font-extrabold">Continue</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-royal rounded-2xl h-13 shadow-sm"
              onPress={handleFinish}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white text-sm font-extrabold">Explore Classes & Teachers</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
