export type ExerciseType =
  | 'multiple_choice'
  | 'word_match'
  | 'translate_tiles'
  | 'fill_blank'
  | 'match_pairs'
  | 'say_this'

export interface MultipleChoiceExercise {
  id: string
  type: 'multiple_choice'
  prompt: string
  promptHint?: string
  options: string[]
  correctIndex: number
}

export interface WordMatchExercise {
  id: string
  type: 'word_match'
  prompt: string
  promptHint?: string
  options: string[]
  correctIndex: number
}

export interface TranslateTilesExercise {
  id: string
  type: 'translate_tiles'
  prompt: string
  promptHint?: string
  /** Correct words in order */
  answer: string[]
  /** Extra distractor tiles */
  distractors?: string[]
}

export interface FillBlankExercise {
  id: string
  type: 'fill_blank'
  /** Sentence with ___ for the blank */
  sentence: string
  promptHint?: string
  options: string[]
  correctIndex: number
  translation?: string
}

export interface MatchPairsExercise {
  id: string
  type: 'match_pairs'
  prompt?: string
  pairs: { left: string; right: string }[]
}

export interface SayThisExercise {
  id: string
  type: 'say_this'
  /** Slovak word/phrase the user should say */
  target: string
  /** English meaning shown under the target */
  meaning: string
  /** Optional accepted variants (e.g. mama / matka) */
  acceptedAnswers?: string[]
}

export type Exercise =
  | MultipleChoiceExercise
  | WordMatchExercise
  | TranslateTilesExercise
  | FillBlankExercise
  | MatchPairsExercise
  | SayThisExercise

export interface Lesson {
  id: string
  title: string
  description: string
  xp: number
  exercises: Exercise[]
}

export interface Unit {
  id: string
  title: string
  description: string
  color: string
  lessons: Lesson[]
}
