import { curriculum, getAllLessonIds, getLessonById } from '../content/curriculum'
import { GAMES_VOCAB_BANK, type VocabPair } from '../content/gamesVocab'
import { looksEnglish, looksSlovak, stripPronunciationHint } from './speak'

function normalizeKey(sk: string, en: string): string {
  return `${sk.trim().toLowerCase()}|${en.trim().toLowerCase()}`
}

function isLikelySlovak(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (looksSlovak(t)) return true
  return !looksEnglish(t)
}

function isLikelyEnglish(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (looksSlovak(t)) return false
  return looksEnglish(t) || /^[a-zA-Z0-9\s/',.!+\-…:/]+$/.test(t)
}

function cleanEnglishPrompt(prompt: string): string {
  let p = prompt.trim()
  p = p.replace(/^How do you say\s+/i, '')
  p = p.replace(/^What does\s+/i, '')
  p = p.replace(/\s+mean\??$/i, '')
  p = p.replace(/\s+means…?$/i, '')
  p = p.replace(/^Translate:\s*/i, '')
  p = p.replace(/^[“"]|[”"]$/g, '')
  p = p.replace(/^"|"$/g, '')
  return p.trim()
}

function addPair(map: Map<string, VocabPair>, sk: string, en: string) {
  const s = sk.trim()
  let e = en.trim()
  if (!s || !e) return
  if (s.length > 40 || e.length > 56) return
  if (!isLikelySlovak(s)) return
  if (!isLikelyEnglish(e) && looksSlovak(e)) return
  // Skip meta prompts that weren't cleaned well
  if (/^(how |what |which |tap |match |choose )/i.test(e)) return
  map.set(normalizeKey(s, e), { sk: s, en: e })
}

/** Pull Slovak↔English pairs from lesson exercises. */
export function extractPairsFromLessonIds(lessonIds: string[]): VocabPair[] {
  const map = new Map<string, VocabPair>()

  for (const id of lessonIds) {
    const found = getLessonById(id)
    if (!found) continue
    for (const ex of found.lesson.exercises) {
      if (ex.type === 'match_pairs') {
        for (const p of ex.pairs) addPair(map, p.left, p.right)
      } else if (ex.type === 'say_this') {
        addPair(map, ex.target, ex.meaning)
      } else if (ex.type === 'multiple_choice' || ex.type === 'word_match') {
        const correct = ex.options[ex.correctIndex]
        if (!correct) continue

        const quoted =
          ex.prompt.match(/[“"]([^”"]+)[”"]/)?.[1] ||
          ex.prompt.match(/"([^"]+)"/)?.[1]

        // "What does X mean?" → X is Slovak, correct is English
        if (quoted && isLikelySlovak(quoted) && isLikelyEnglish(correct)) {
          addPair(map, quoted, correct)
        } else if (isLikelySlovak(correct) && isLikelyEnglish(ex.prompt)) {
          addPair(map, correct, cleanEnglishPrompt(ex.prompt))
        }

        if (ex.promptHint) {
          const hintSk = stripPronunciationHint(ex.promptHint).split(/[—(]/)[0].trim()
          if (hintSk && isLikelySlovak(hintSk) && isLikelyEnglish(ex.prompt)) {
            addPair(map, hintSk, cleanEnglishPrompt(ex.prompt))
          }
        }
      } else if (ex.type === 'fill_blank' && ex.translation) {
        const blank = ex.options[ex.correctIndex]
        if (blank && isLikelySlovak(blank)) {
          const sentence = ex.sentence.replace('___', blank)
          if (sentence.split(/\s+/).length <= 4) {
            addPair(map, sentence, ex.translation)
          } else {
            addPair(map, blank, ex.translation)
          }
        }
      } else if (ex.type === 'translate_tiles') {
        const sk = ex.answer.join(' ')
        const en = ex.prompt.replace(/^Translate:\s*/i, '').trim()
        if (en && isLikelyEnglish(en)) addPair(map, sk, en)
      }
    }
  }

  return [...map.values()]
}

/**
 * Vocabulary for games: completed lessons preferred,
 * else unit-1 (beginner), always merged with games bank.
 */
export function getGameVocab(completedLessonIds: string[]): VocabPair[] {
  const map = new Map<string, VocabPair>()

  for (const p of GAMES_VOCAB_BANK) {
    map.set(normalizeKey(p.sk, p.en), p)
  }

  let ids = completedLessonIds.filter((id) => id !== 'practice-bonus')
  if (ids.length === 0) {
    const u1 = curriculum.find((u) => u.id === 'unit-1')
    ids = u1 ? u1.lessons.map((l) => l.id) : getAllLessonIds().slice(0, 4)
  }

  for (const p of extractPairsFromLessonIds(ids)) {
    map.set(normalizeKey(p.sk, p.en), p)
  }

  return [...map.values()]
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length))
}

/** Build MC options: correct English + distractors from other pairs. */
export function meaningOptions(correct: VocabPair, pool: VocabPair[], count = 4): string[] {
  const distractors = shuffle(
    pool.filter((p) => p.en !== correct.en && p.sk !== correct.sk),
  )
    .slice(0, count - 1)
    .map((p) => p.en)
  return shuffle([correct.en, ...distractors])
}

export type { VocabPair }
