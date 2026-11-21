// LOCK IN — 12-week bodyweight program (home, no equipment, beginner), plus guided yoga & stretching.
type L = { en: string; ru: string }
export type Unit = 'reps' | 'sec'

export interface Exercise {
  id: string
  name: L
  cues: L[]
  /** YouTube search used for the technique video */
  q: string
  unit: Unit
  /** done per side (L/R) */
  side?: boolean
}

const ex = (id: string, en: string, ru: string, q: string, unit: Unit, cues: [string, string][], side = false): Exercise => ({
  id, name: { en, ru }, q, unit, side, cues: cues.map(([e, r]) => ({ en: e, ru: r })),
})

// ---------- strength library ----------
const LIB: Exercise[] = [
  // push
  ex('wall_pushup', 'Wall push-up', 'Отжимания от стены', 'wall push up proper form', 'reps', [['Hands at shoulder height, body in one straight line', 'Руки на уровне плеч, тело — одна прямая линия'], ['Chest to the wall, elbows ~45°', 'Грудью к стене, локти под ~45°']]),
  ex('incline_pushup', 'Incline push-up', 'Отжимания от стола', 'incline push up proper form', 'reps', [['Hands on a sturdy table or sofa edge', 'Руки на устойчивом столе или краю дивана'], ['Squeeze glutes, lower chest to the edge', 'Ягодицы напряжены, опускайся грудью к краю']]),
  ex('knee_pushup', 'Knee push-up', 'Отжимания с колен', 'knee push up proper form', 'reps', [['Straight line from knees to head', 'Прямая линия от колен до головы'], ['Lower until chest is a fist from the floor', 'Опускайся, пока до пола не останется кулак']]),
  ex('pushup', 'Push-up', 'Отжимания', 'push up proper form beginner', 'reps', [['Hands under shoulders, core tight like a plank', 'Руки под плечами, корпус как в планке'], ['Full range: chest close to floor, lock out at top', 'Полная амплитуда: грудь к полу, вверху руки прямые']]),
  ex('decline_pushup', 'Decline push-up', 'Отжимания, ноги на возвышении', 'decline push up proper form', 'reps', [['Feet on sofa or chair, hands on floor', 'Ноги на диване или стуле, руки на полу'], ['Don’t let hips sag', 'Не провисай в пояснице']]),
  // squat
  ex('chair_squat', 'Chair squat', 'Присед на стул', 'box squat to chair bodyweight form', 'reps', [['Sit back until you touch the chair, then stand', 'Садись назад до касания стула и вставай'], ['Knees track over toes, chest up', 'Колени смотрят по носкам, грудь раскрыта']]),
  ex('squat', 'Bodyweight squat', 'Приседания', 'bodyweight squat proper form', 'reps', [['Feet shoulder-width, sit hips back and down', 'Стопы на ширине плеч, таз назад и вниз'], ['Go to parallel or lower, heels down', 'До параллели или ниже, пятки на полу']]),
  ex('split_squat', 'Split squat', 'Сплит-присед', 'split squat bodyweight form', 'reps', [['Long stance, drop the back knee straight down', 'Широкий шаг, опускай заднее колено вертикально вниз'], ['Front heel stays planted', 'Пятка передней ноги на полу']], true),
  ex('bulgarian', 'Bulgarian split squat', 'Болгарские выпады', 'bulgarian split squat bodyweight form', 'reps', [['Back foot on sofa, torso slightly forward', 'Задняя нога на диване, корпус чуть вперёд'], ['Control the way down, drive through front heel', 'Медленно вниз, вверх через пятку передней ноги']], true),
  ex('jump_squat', 'Jump squat', 'Приседания с выпрыгиванием', 'jump squat proper form', 'reps', [['Squat, then jump explosively', 'Присед — и взрывной прыжок вверх'], ['Land softly back into the squat', 'Мягко приземляйся обратно в присед']]),
  // hinge / glutes
  ex('glute_bridge', 'Glute bridge', 'Ягодичный мост', 'glute bridge proper form', 'reps', [['Feet close to glutes, push through heels', 'Стопы ближе к ягодицам, толкайся пятками'], ['Squeeze glutes 1 s at the top', 'Вверху сожми ягодицы на 1 секунду']]),
  ex('sl_bridge', 'Single-leg glute bridge', 'Мост на одной ноге', 'single leg glute bridge form', 'reps', [['Other leg straight up or knee to chest', 'Вторая нога вверх или колено к груди'], ['Keep hips level', 'Таз не перекашивается']], true),
  ex('hip_thrust', 'Hip thrust (on sofa)', 'Ягодичный мост с опорой на диван', 'bodyweight hip thrust couch form', 'reps', [['Upper back on sofa edge, chin tucked', 'Лопатки на краю дивана, подбородок к груди'], ['Lift until body is flat like a table', 'Поднимай таз до «столешницы»']]),
  ex('sl_hip_thrust', 'Single-leg hip thrust', 'Мост на одной ноге с опорой', 'single leg hip thrust bodyweight form', 'reps', [['Same setup, one foot on the floor', 'Та же опора, одна нога на полу'], ['Slow 2 s lowering', 'Опускайся медленно, 2 секунды']], true),
  // pull (no bar)
  ex('superman', 'Superman', 'Супермен', 'superman exercise proper form', 'reps', [['Lie face down, lift arms, chest and legs', 'Лёжа на животе, подними руки, грудь и ноги'], ['Hold 2 s at the top, neck neutral', 'Задержись на 2 секунды, шея нейтрально']]),
  ex('snow_angel', 'Prone snow angel', 'Ангел на животе', 'prone snow angels exercise', 'reps', [['Face down, arms hover off the floor', 'Лёжа на животе, руки над полом'], ['Sweep arms from hips to overhead', 'Веди руки от бёдер за голову и обратно']]),
  ex('ytw', 'Y-T-W raises', 'Подъёмы Y-T-W', 'prone y t w raises exercise', 'reps', [['Face down, make Y, T, then W with your arms', 'Лёжа на животе: руки буквой Y, затем T, затем W'], ['Squeeze shoulder blades each time', 'Каждый раз своди лопатки']]),
  ex('table_row', 'Table row', 'Тяга под столом', 'inverted row under table bodyweight', 'reps', [['Lie under a sturdy table, grip the edge', 'Ляг под устойчивый стол, возьмись за край'], ['Pull chest to the table, body straight', 'Тянись грудью к столу, тело прямое']]),
  // lunge
  ex('reverse_lunge', 'Reverse lunge', 'Выпады назад', 'reverse lunge proper form', 'reps', [['Step back, both knees ~90°', 'Шаг назад, оба колена ~90°'], ['Push through front heel to stand', 'Вставай, толкаясь пяткой передней ноги']], true),
  ex('lateral_lunge', 'Lateral lunge', 'Выпады в сторону', 'lateral lunge proper form', 'reps', [['Wide step to the side, sit into that hip', 'Широкий шаг в сторону, садись в это бедро'], ['Other leg stays straight', 'Вторая нога прямая']], true),
  ex('walking_lunge', 'Walking lunge', 'Выпады в движении', 'walking lunge proper form', 'reps', [['Long steps forward, upright torso', 'Длинные шаги вперёд, корпус прямо'], ['Back knee lightly kisses the floor', 'Заднее колено слегка касается пола']], true),
  // core A (anti-extension)
  ex('dead_bug', 'Dead bug', 'Мёртвый жук', 'dead bug exercise proper form', 'reps', [['Lower back pressed to the floor the whole time', 'Поясница всё время прижата к полу'], ['Extend opposite arm and leg slowly', 'Медленно вытягивай противоположные руку и ногу']], true),
  ex('plank', 'Plank', 'Планка', 'plank proper form', 'sec', [['Elbows under shoulders, body straight', 'Локти под плечами, тело прямое'], ['Squeeze glutes and abs, breathe', 'Напряги ягодицы и пресс, дыши']]),
  ex('hollow', 'Hollow hold', 'Лодочка на спине', 'hollow body hold beginner', 'sec', [['Lower back glued to the floor', 'Поясница прижата к полу'], ['Bend knees to make it easier', 'Согни колени, если тяжело']]),
  // core B (anti-rotation / lateral)
  ex('bird_dog', 'Bird dog', 'Птица-собака', 'bird dog exercise proper form', 'reps', [['On all fours, extend opposite arm and leg', 'На четвереньках вытяни противоположные руку и ногу'], ['Keep hips square, pause 2 s', 'Таз не разворачивается, пауза 2 секунды']], true),
  ex('side_plank', 'Side plank', 'Боковая планка', 'side plank proper form', 'sec', [['Elbow under shoulder, hips high', 'Локоть под плечом, таз высоко'], ['Start from knees if needed', 'Можно начать с колен']], true),
  ex('leg_raise', 'Lying leg raise', 'Подъём ног лёжа', 'lying leg raises proper form', 'reps', [['Hands under hips, lower back down', 'Руки под тазом, поясница прижата'], ['Lower legs slowly, don’t touch the floor', 'Медленно опускай ноги, не касаясь пола']]),
  // conditioning
  ex('jumping_jacks', 'Jumping jacks', 'Прыжки «звёздочка»', 'jumping jacks proper form', 'sec', [['Light on the balls of your feet', 'Легко, на носках'], ['Steady breathing', 'Ровное дыхание']]),
  ex('high_knees', 'High knees', 'Бег с высоким подниманием колен', 'high knees exercise form', 'sec', [['Knees to hip height, pump arms', 'Колени до уровня таза, работай руками'], ['Stay tall', 'Корпус прямо']]),
  ex('mountain_climber', 'Mountain climbers', 'Скалолаз', 'mountain climbers proper form', 'sec', [['Plank position, drive knees to chest', 'Из планки подтягивай колени к груди'], ['Hips low, quick feet', 'Таз не поднимай, быстрые ноги']]),
  ex('step_burpee', 'Step-back burpee', 'Бёрпи с шагом назад', 'step back burpee no jump', 'sec', [['Hands down, step feet back to plank', 'Руки на пол, шагом назад в планку'], ['Step in and stand tall', 'Шагом вперёд и выпрямись']]),
  ex('burpee', 'Burpee', 'Бёрпи', 'burpee proper form', 'sec', [['Jump back to plank, chest down optional', 'Прыжком в планку, грудь к полу по желанию'], ['Jump in, jump up', 'Прыжком к рукам и выпрыгни вверх']]),
  ex('skater', 'Skater hops', 'Конькобежец', 'skater jumps exercise form', 'sec', [['Leap side to side, land on one foot', 'Прыжки из стороны в сторону на одну ногу'], ['Soft landings', 'Мягкое приземление']]),
]

// ---------- warm-up / cool-down / yoga / stretch (timed) ----------
const FLOW: Exercise[] = [
  ex('march', 'March in place', 'Ходьба на месте', '', 'sec', [['Swing your arms, breathe', 'Работай руками, дыши']]),
  ex('arm_circles', 'Arm circles', 'Круги руками', '', 'sec', [['Small to big, forward then back', 'От малых к большим, вперёд и назад']]),
  ex('hip_circles', 'Hip circles', 'Круги тазом', '', 'sec', [['Hands on hips, big slow circles', 'Руки на поясе, большие медленные круги']]),
  ex('cat_cow', 'Cat–cow', 'Кошка–корова', 'cat cow yoga pose', 'sec', [['Inhale: arch and look up', 'Вдох: прогнись и посмотри вверх'], ['Exhale: round the spine', 'Выдох: округли спину']]),
  ex('inchworm', 'Inchworm', 'Гусеница', 'inchworm exercise', 'sec', [['Walk hands out to plank and back', 'Шагай руками в планку и обратно']]),
  ex('wgs', 'World’s greatest stretch', 'Лучшая растяжка в мире', 'worlds greatest stretch', 'sec', [['Lunge, elbow to instep, rotate arm up', 'Выпад, локоть к стопе, рука вверх с поворотом'], ['Alternate sides', 'Чередуй стороны']]),
  ex('good_morning', 'Good mornings', 'Наклоны «гуд морнинг»', 'bodyweight good morning', 'sec', [['Hinge at hips, flat back', 'Наклон от таза, спина ровная']]),
  ex('childs_pose', 'Child’s pose', 'Поза ребёнка', 'childs pose yoga', 'sec', [['Knees wide, arms long, breathe into the back', 'Колени широко, руки вперёд, дыши в спину']]),
  ex('hamstring', 'Hamstring stretch', 'Растяжка задней поверхности бедра', 'standing hamstring stretch', 'sec', [['Heel forward, hinge until you feel the stretch', 'Пятка вперёд, наклон до ощущения растяжения']], true),
  ex('quad', 'Quad stretch', 'Растяжка передней поверхности бедра', 'standing quad stretch', 'sec', [['Heel to glute, knees together', 'Пятку к ягодице, колени вместе']], true),
  ex('chest_stretch', 'Doorway chest stretch', 'Растяжка груди в проёме', 'doorway chest stretch', 'sec', [['Forearms on the frame, lean forward gently', 'Предплечья на косяк, мягко подайся вперёд']]),
  ex('hip_flexor', 'Hip-flexor stretch', 'Растяжка сгибателей бедра', 'kneeling hip flexor stretch', 'sec', [['Half-kneel, tuck pelvis, shift forward', 'Полувыпад на колене, подкрути таз и подайся вперёд']], true),
  ex('figure4', 'Figure-4 stretch', 'Растяжка «четвёрка»', 'figure 4 stretch lying', 'sec', [['Ankle over knee, pull thigh to chest', 'Лодыжка на колено, тяни бедро к груди']], true),
  ex('breathing', 'Deep breathing', 'Глубокое дыхание', '', 'sec', [['4 s in, 6 s out', 'Вдох 4 секунды, выдох 6']]),
  ex('down_dog', 'Downward dog', 'Собака мордой вниз', 'downward dog beginner', 'sec', [['Hips high, press the floor away', 'Таз вверх, отталкивай пол руками'], ['Bend knees if hamstrings are tight', 'Согни колени, если тянет']]),
  ex('low_lunge', 'Low lunge', 'Низкий выпад', 'low lunge yoga pose', 'sec', [['Back knee down, sink hips forward', 'Заднее колено на полу, таз вниз и вперёд']], true),
  ex('cobra', 'Cobra', 'Кобра', 'cobra pose beginner', 'sec', [['Hands under shoulders, lift chest, elbows soft', 'Руки под плечами, подними грудь, локти мягкие']]),
  ex('warrior2', 'Warrior II', 'Воин II', 'warrior 2 pose', 'sec', [['Front knee over ankle, arms long', 'Переднее колено над стопой, руки длинные']], true),
  ex('triangle', 'Triangle', 'Треугольник', 'triangle pose beginner', 'sec', [['Straight legs, reach long then down', 'Ноги прямые, тянись вдаль, затем вниз']], true),
  ex('tree', 'Tree pose', 'Дерево', 'tree pose beginner', 'sec', [['Foot on calf or thigh, not the knee', 'Стопа на икру или бедро, не на колено']], true),
  ex('chair_pose', 'Chair pose', 'Поза стула', 'chair pose yoga', 'sec', [['Sit back, arms up, weight in heels', 'Садись назад, руки вверх, вес на пятках']]),
  ex('forward_fold', 'Forward fold', 'Наклон вперёд', 'standing forward fold', 'sec', [['Soft knees, let the head hang', 'Колени мягкие, голова свободно']]),
  ex('seated_twist', 'Seated twist', 'Скрутка сидя', 'seated spinal twist', 'sec', [['Sit tall, twist from the ribs', 'Спина прямая, скручивайся от рёбер']], true),
  ex('bridge_pose', 'Bridge pose', 'Мост (йога)', 'bridge pose yoga', 'sec', [['Lift hips, roll shoulders under', 'Подними таз, сведи лопатки под собой']]),
  ex('supine_twist', 'Supine twist', 'Скрутка лёжа', 'supine twist', 'sec', [['Knees to one side, look the other way', 'Колени в одну сторону, взгляд в другую']], true),
  ex('savasana', 'Savasana', 'Шавасана', '', 'sec', [['Lie still, relax every muscle', 'Лёжа неподвижно, расслабь всё тело']]),
  ex('neck', 'Neck stretch', 'Растяжка шеи', 'neck stretch', 'sec', [['Ear to shoulder, slow and gentle', 'Ухо к плечу, медленно и мягко']]),
  ex('shoulder_cross', 'Cross-body shoulder', 'Растяжка плеча', 'cross body shoulder stretch', 'sec', [['Pull arm across the chest', 'Тяни руку через грудь']], true),
  ex('triceps', 'Triceps stretch', 'Растяжка трицепса', 'overhead triceps stretch', 'sec', [['Elbow up, hand down the back', 'Локоть вверх, ладонь вниз по спине']], true),
  ex('pigeon', 'Pigeon', 'Голубь', 'pigeon pose beginner', 'sec', [['Front shin across, hips square, fold forward', 'Голень впереди поперёк, таз ровно, наклон вперёд']], true),
  ex('butterfly', 'Butterfly', 'Бабочка', 'butterfly stretch', 'sec', [['Soles together, let knees fall', 'Стопы вместе, колени вниз']]),
  ex('seated_fold', 'Seated forward fold', 'Наклон сидя', 'seated forward fold', 'sec', [['Long spine first, then fold', 'Сначала вытяни спину, потом наклон']]),
  ex('happy_baby', 'Happy baby', 'Счастливый ребёнок', 'happy baby pose', 'sec', [['Hold feet, knees toward armpits', 'Держи стопы, колени к подмышкам']]),
  ex('legs_wall', 'Legs up the wall', 'Ноги на стену', 'legs up the wall pose', 'sec', [['Hips close to the wall, breathe slowly', 'Таз ближе к стене, медленное дыхание']]),
]

export const EX: Record<string, Exercise> = Object.fromEntries([...LIB, ...FLOW].map((e) => [e.id, e]))

/** a family is a progression ladder: easiest → hardest, each with a target range */
export interface Level { ex: string; lo: number; hi: number }
export const FAMILIES: Record<string, { name: L; levels: Level[] }> = {
  push: { name: { en: 'Push', ru: 'Жим' }, levels: [{ ex: 'wall_pushup', lo: 10, hi: 15 }, { ex: 'incline_pushup', lo: 8, hi: 12 }, { ex: 'knee_pushup', lo: 8, hi: 12 }, { ex: 'pushup', lo: 6, hi: 12 }, { ex: 'decline_pushup', lo: 8, hi: 12 }] },
  squat: { name: { en: 'Squat', ru: 'Присед' }, levels: [{ ex: 'chair_squat', lo: 10, hi: 15 }, { ex: 'squat', lo: 12, hi: 20 }, { ex: 'split_squat', lo: 8, hi: 12 }, { ex: 'bulgarian', lo: 8, hi: 12 }, { ex: 'jump_squat', lo: 10, hi: 15 }] },
  hinge: { name: { en: 'Glutes', ru: 'Ягодицы' }, levels: [{ ex: 'glute_bridge', lo: 12, hi: 20 }, { ex: 'sl_bridge', lo: 8, hi: 12 }, { ex: 'hip_thrust', lo: 12, hi: 20 }, { ex: 'sl_hip_thrust', lo: 8, hi: 12 }] },
  pull: { name: { en: 'Back', ru: 'Спина' }, levels: [{ ex: 'superman', lo: 10, hi: 15 }, { ex: 'snow_angel', lo: 8, hi: 12 }, { ex: 'ytw', lo: 6, hi: 10 }, { ex: 'table_row', lo: 6, hi: 12 }] },
  lunge: { name: { en: 'Lunge', ru: 'Выпады' }, levels: [{ ex: 'reverse_lunge', lo: 8, hi: 12 }, { ex: 'lateral_lunge', lo: 8, hi: 12 }, { ex: 'walking_lunge', lo: 10, hi: 14 }] },
  coreA: { name: { en: 'Core', ru: 'Пресс' }, levels: [{ ex: 'dead_bug', lo: 6, hi: 10 }, { ex: 'plank', lo: 20, hi: 45 }, { ex: 'hollow', lo: 15, hi: 30 }] },
  coreB: { name: { en: 'Obliques', ru: 'Косые' }, levels: [{ ex: 'bird_dog', lo: 6, hi: 10 }, { ex: 'side_plank', lo: 15, hi: 35 }, { ex: 'leg_raise', lo: 8, hi: 15 }] },
}
export const DAY_FAMILIES: Record<'A' | 'B', string[]> = {
  A: ['squat', 'push', 'hinge', 'pull', 'lunge', 'coreA'],
  B: ['lunge', 'push', 'hinge', 'pull', 'squat', 'coreB'],
}

export const PROGRAM_WEEKS = 12
export function phase(week: number) {
  return week <= 4 ? 1 : week <= 8 ? 2 : 3
}
export function setsFor(week: number) {
  return week <= 8 ? 3 : 4
}
export function restFor(week: number) {
  return week <= 4 ? 60 : 75
}

// ---------- steps ----------
export type Step =
  | { kind: 'timed'; ex: string; sec: number; part: 'warmup' | 'finisher' | 'rest' | 'cooldown' | 'flow'; label?: string }
  | { kind: 'set'; ex: string; family: string; set: number; sets: number; lo: number; hi: number; rest: number }

const WARMUP: [string, number][] = [['march', 60], ['arm_circles', 45], ['hip_circles', 45], ['cat_cow', 45], ['inchworm', 60], ['wgs', 60], ['good_morning', 45], ['jumping_jacks', 60]]
const COOLDOWN: [string, number][] = [['childs_pose', 60], ['hamstring', 60], ['quad', 60], ['chest_stretch', 45], ['hip_flexor', 60], ['figure4', 60], ['breathing', 60]]
const FINISHER: Record<'A' | 'B', string[]> = { A: ['jumping_jacks', 'mountain_climber', 'high_knees', 'step_burpee'], B: ['skater', 'mountain_climber', 'jumping_jacks', 'step_burpee'] }

export function strengthSteps(day: 'A' | 'B', week: number, levels: Record<string, number>): Step[] {
  const steps: Step[] = WARMUP.map(([e, s]) => ({ kind: 'timed', ex: e, sec: s, part: 'warmup' }))
  const sets = setsFor(week)
  const rest = restFor(week)
  for (const f of DAY_FAMILIES[day]) {
    const lv = FAMILIES[f].levels[Math.min(levels[f] ?? 0, FAMILIES[f].levels.length - 1)]
    for (let i = 1; i <= sets; i++) steps.push({ kind: 'set', ex: lv.ex, family: f, set: i, sets, lo: lv.lo, hi: lv.hi, rest })
  }
  // finisher: work/rest intervals, gets harder by phase
  const p = phase(week)
  const work = p === 1 ? 30 : 40
  const off = p === 1 ? 30 : 20
  const rounds = p === 1 ? 8 : p === 2 ? 10 : 12
  const moves = FINISHER[day].map((m) => (m === 'step_burpee' && p === 3 ? 'burpee' : m))
  for (let r = 0; r < rounds; r++) {
    steps.push({ kind: 'timed', ex: moves[r % moves.length], sec: work, part: 'finisher', label: `${r + 1}/${rounds}` })
    if (r < rounds - 1) steps.push({ kind: 'timed', ex: 'breathing', sec: off, part: 'rest' })
  }
  for (const [e, s] of COOLDOWN) steps.push({ kind: 'timed', ex: e, sec: s, part: 'cooldown' })
  return steps
}

const YOGA: [string, number][] = [
  ['childs_pose', 60], ['cat_cow', 90], ['down_dog', 60], ['low_lunge', 120], ['cobra', 45], ['childs_pose', 30], ['warrior2', 120],
  ['triangle', 90], ['tree', 90], ['chair_pose', 30], ['forward_fold', 60], ['seated_twist', 90], ['bridge_pose', 45], ['supine_twist', 90], ['savasana', 120],
]
const STRETCH: [string, number][] = [
  ['neck', 60], ['shoulder_cross', 90], ['triceps', 60], ['forward_fold', 60], ['quad', 90], ['hip_flexor', 120], ['pigeon', 150],
  ['butterfly', 60], ['seated_fold', 75], ['seated_twist', 90], ['figure4', 90], ['happy_baby', 60], ['legs_wall', 120],
]

/** guided flow scaled to the habit's current target (minutes); per-side poses are split L / R */
export function flowSteps(kind: 'yoga' | 'stretch', minutes: number): Step[] {
  const base = kind === 'yoga' ? YOGA : STRETCH
  const total = base.reduce((a, [, s]) => a + s, 0)
  const k = (minutes * 60) / total
  const out: Step[] = []
  for (const [e, s] of base) {
    const sec = Math.max(20, Math.round((s * k) / 5) * 5)
    if (EX[e].side) {
      out.push({ kind: 'timed', ex: e, sec: Math.round(sec / 2 / 5) * 5, part: 'flow', label: 'R' })
      out.push({ kind: 'timed', ex: e, sec: Math.round(sec / 2 / 5) * 5, part: 'flow', label: 'L' })
    } else out.push({ kind: 'timed', ex: e, sec, part: 'flow' })
  }
  return out
}

export const stepsDuration = (steps: Step[]) =>
  steps.reduce((a, s) => a + (s.kind === 'timed' ? s.sec : 45 + s.rest), 0)

export function videoUrl(e: Exercise, custom?: string) {
  if (custom) return custom
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(e.q || e.name.en)}`
}

export const exName = (id: string, lang: string) => EX[id]?.name[lang === 'ru' ? 'ru' : 'en'] ?? id
export const exCues = (id: string, lang: string) => (EX[id]?.cues || []).map((c) => c[lang === 'ru' ? 'ru' : 'en'])
