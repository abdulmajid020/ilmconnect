import { useCallback, useEffect, useState } from 'react';
import { QuestionsService } from '../services/questions.service';

export function useQuestions(selectedSubject = 'ALL') {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = selectedSubject === 'ALL' ? '' : selectedSubject;
      const res = await QuestionsService.listQuestions(filter).catch(() => []);
      setQuestions(Array.isArray(res) ? res : []);
    } catch {
      setQuestions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuestions();
  }, [loadQuestions]);

  return { questions, isLoading, refreshing, loadQuestions, onRefresh };
}
