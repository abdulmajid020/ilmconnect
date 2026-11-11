import { useRouter } from 'expo-router';
import { Check, CheckCircle2, Clock, User, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useRequests } from '../../src/hooks/useRequests';

export default function RequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const { requests, setRequests, isLoading, refreshing, loadRequests, onRefresh, respondToRequest } =
    useRequests();

  // Accept modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [meetingSchedule, setMeetingSchedule] = useState('Fridays 5:00 PM GMT');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/xyz-1on1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccept() {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await respondToRequest(selectedRequest.id, {
        status: 'ACCEPTED',
        meeting_schedule: meetingSchedule,
        google_meet_link: meetLink,
      });
      Alert.alert('Request Accepted', 'Student has been notified and session scheduled.');
      setSelectedRequest(null);
    } catch {
      Alert.alert('Notice', 'Request marked accepted.');
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      setSelectedRequest(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline(reqId: string) {
    Alert.alert('Decline Request', 'Are you sure you want to decline this guidance request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await respondToRequest(reqId, {
              status: 'DECLINED',
              decline_reason: 'Sheikh schedule is currently full.',
            });
          } catch {}
          setRequests((prev) => prev.filter((r) => r.id !== reqId));
        },
      },
    ]);
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.skyPrimary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(350)} className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-royal">
            Student Inquiries
          </Text>
          <Text className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
            1-on-1 Guidance Requests
          </Text>
          <Text className={`text-xs mt-1 leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
            Learners seeking direct private mentoring with you.
          </Text>
        </Animated.View>

        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#027BFF" />
            <Text className="text-xs text-sage font-medium mt-3">Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View
            className={`rounded-3xl p-8 items-center border border-dashed ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-300'
            }`}
          >
            <View className="w-14 h-14 rounded-full bg-emerald-50 justify-center items-center mb-3">
              <CheckCircle2 size={28} color="#059669" />
            </View>
            <Text className={`text-base font-bold text-center ${isDark ? 'text-white' : 'text-charcoal'}`}>
              All Inquiries Answered
            </Text>
            <Text className="text-xs text-sage text-center mt-1 leading-5">
              You currently have no pending 1-on-1 student guidance requests.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {requests.map((r) => (
              <View
                key={r.id}
                className={`rounded-3xl p-5 border shadow-sm ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="bg-sky-soft px-3 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-royal uppercase">{r.subject}</Text>
                  </View>
                  <View className="flex-row items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <Clock size={10} color="#D97706" />
                    <Text className="text-[10px] font-bold text-amber-700">PENDING</Text>
                  </View>
                </View>

                {/* Learner Info */}
                <View className="flex-row items-center gap-2 mb-2">
                  <User size={14} color={Colors.royalBlue} />
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                    {r.learner?.full_name || 'Learner from Ghana'}
                  </Text>
                </View>

                {/* Message */}
                <Text className={`text-xs leading-5 p-3 rounded-2xl ${
                  isDark ? 'bg-amoled-bg text-slate-300' : 'bg-slate-50 text-charcoal'
                }`}>
                  "{r.learner_message || 'Requesting guidance in this subject.'}"
                </Text>

                {/* Decision Buttons */}
                <View className="flex-row gap-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-amoled-border">
                  <TouchableOpacity
                    className="flex-1 flex-row justify-center items-center gap-1.5 bg-royal rounded-xl h-11 shadow-sm"
                    onPress={() => setSelectedRequest(r)}
                    activeOpacity={0.85}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-extrabold">Accept & Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-4 justify-center items-center rounded-xl h-11 border ${
                      isDark ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                    }`}
                    onPress={() => handleDecline(r.id)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-red-500 text-xs font-bold">Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ACCEPT MODAL */}
      <Modal visible={!!selectedRequest} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${
              isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Schedule 1-on-1 Session
              </Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View>
                <Text className="text-xs font-bold text-sage mb-1">Weekly Meeting Schedule</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  value={meetingSchedule}
                  onChangeText={setMeetingSchedule}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-sage mb-1">Google Meet URL</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  value={meetLink}
                  onChangeText={setMeetLink}
                />
              </View>

              <TouchableOpacity
                className="bg-royal h-12 rounded-2xl justify-center items-center mt-3"
                onPress={handleAccept}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-extrabold">Confirm & Send Invitation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

