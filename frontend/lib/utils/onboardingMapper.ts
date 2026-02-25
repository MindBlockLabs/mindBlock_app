// Map frontend display values to backend enum values

export const mapChallengeLevel = (level: string): string => {
  const mapping: Record<string, string> = {
    'BEGINNER': 'beginner',
    'INTERMEDIATE': 'intermediate',
    'ADVANCED': 'advanced',
    'EXPERT': 'expert',
  };
  return mapping[level] || level;
};

export const mapChallengeType = (type: string): string => {
  const mapping: Record<string, string> = {
    'CODING': 'Coding Challenges',
    'LOGIC': 'Logic Puzzle',
    'BLOCKCHAIN': 'Blockchain',
  };
  return mapping[type] || type;
};

export const mapReferralSource = (source: string): string => {
  const mapping: Record<string, string> = {
    'Google Search': 'Google Search',
    'X (formerly called Twitter)': 'X/Twitter',
    'Facebook / Instagram': 'Other',
    'Friends / family': 'Friends',
    'Play Store': 'Other',
    'App Store': 'Other',
    'News / article / blog': 'Other',
    'Youtube': 'Other',
    'Others': 'Other',
  };
  return mapping[source] || 'Other';
};

export const mapAgeGroup = (age: string): string => {
  const mapping: Record<string, string> = {
    'From 10 to 17 years old': '10-17 years old',
    '18 to 24 years old': '18-24 years old',
    '25 to 34 years old': '25-34 years old',
    '35 to 44 years old': '35-44 years old',
    '45 to 54 years old': '45-54 years old',
    '55 to 64 years old': '55-64 years old',
    '65+': '65+ years old',
  };
  return mapping[age] || age;
};
