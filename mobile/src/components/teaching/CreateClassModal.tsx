import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../api/client';

interface CreateClassModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

export function CreateClassModal({
  visible,
  isDark,
  onClose,
  onClassCreated,
}: CreateClassModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Tajweed');
  const [schedule, setSchedule] = useState('Saturdays 7:00 PM GMT');
  const [meetLink, setMeetLink] = useState('');
  const [capacity] = useState('20');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateClass() {
    if (!title.trim() || !subject.trim()) {
      Alert.alert('Required Fields', 'Please enter a class title and subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createClass({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || `Weekly Islamic Madrassa circle in ${subject}.`,
        recurring_schedule: schedule.trim(),
        default_meet_link: meetLink.trim() || 'https://meet.google.com/new',
        capacity: parseInt(capacity, 10) || 20,
        level: 'BEGINNER',
        visibility: 'PUBLIC',
        enrollment_mode: 'OPEN',
      });
      setTitle('');
      setDescription('');
      Alert.alert('Success', 'Madrassa class published successfully.');
      onClassCreated();
      onClose();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Created local preview session.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className={`rounded-t-3xl p-6 ${
            isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
          }`}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
              New Madrassa Class
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <View className="gap-3">
            <View>
              <Text className="text-xs font-bold text-sage mb-1">Class Title</Text>
              <TextInput
                className={`border rounded-xl px-3.5 h-11 text-sm ${
                  isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Al-Jazariyyah Tajweed Circle"
                placeholderTextColor="#99A69D"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-sage mb-1">Subject</Text>
              <TextInput
                className={`border rounded-xl px-3.5 h-11 text-sm ${
                  isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Tajweed, Fiqh, Tafseer"
                placeholderTextColor="#99A69D"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-sage mb-1">Weekly Schedule</Text>
              <TextInput
                className={`border rounded-xl px-3.5 h-11 text-sm ${
                  isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Sundays 7:30 PM GMT"
                placeholderTextColor="#99A69D"
                value={schedule}
                onChangeText={setSchedule}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-sage mb-1">Google Meet Link</Text>
              <TextInput
                className={`border rounded-xl px-3.5 h-11 text-sm ${
                  isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="https://meet.google.com/xyz-uvwx-rst"
                placeholderTextColor="#99A69D"
                value={meetLink}
                onChangeText={setMeetLink}
              />
            </View>

            <TouchableOpacity
              className="bg-royal h-12 rounded-2xl justify-center items-center mt-3"
              onPress={handleCreateClass}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-extrabold">Publish Class</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

