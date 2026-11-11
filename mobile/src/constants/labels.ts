export const LOCATION_TYPE_OPTIONS = [
  { key: 'MADRASSA', label: 'Madrassa' },
  { key: 'MOSQUE', label: 'Mosque' },
  { key: 'ISLAMIC_CENTER', label: 'Islamic Centre' },
  { key: 'HOME_STUDY', label: 'Home Study' },
] as const;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  MADRASSA: 'Madrassa',
  MOSQUE: 'Mosque',
  ISLAMIC_CENTER: 'Islamic Centre',
  HOME_STUDY: 'Home Study',
  ONLINE: 'Online',
};

export const FORMAT_LABELS: Record<string, string> = {
  All: 'All',
  in_person: 'In Person',
  online: 'Online',
  hybrid: 'Hybrid',
};

export const SUBJECT_OPTIONS = [
  'Fiqh',
  'Taharah',
  'Salah',
  'Fasting',
  'Aqeedah',
  'General',
] as const;
