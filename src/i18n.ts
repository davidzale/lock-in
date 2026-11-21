import { useCallback } from 'react'
import { useStore } from './store'

type Dict = Record<string, string>

const en: Dict = {
  'tab.today': 'Today', 'tab.calendar': 'Calendar', 'tab.finance': 'Finance', 'tab.sport': 'Sport', 'tab.growth': 'Growth',

  'common.add': 'Add', 'common.edit': 'Edit', 'common.save': 'Save', 'common.delete': 'Delete', 'common.date': 'Date',
  'common.note': 'Note', 'common.optional': 'Optional', 'common.week': 'Week', 'common.confirmDelete': 'Delete this item?',

  'today.title': 'Today', 'today.habits': 'Habits', 'today.weekGoals': 'Week goals', 'today.streak': 'Streak',
  'today.monthNet': 'Month net', 'today.day': 'Day', 'today.goals': 'Goals', 'today.noGoals': 'No goals for this period yet',
  'today.levelUp': 'Level up — the goal grew',

  'block.morning': 'Morning', 'block.day': 'Day', 'block.evening': 'Evening',
  'period.week': 'Week', 'period.month': 'Month', 'period.year': 'Year',

  'unit.min': 'min', 'unit.ml': 'ml', 'unit.pages': 'pages', 'unit.reps': 'reps', 'unit.steps': 'steps',
  'unit.d': 'd', 'unit.h': 'h', 'unit.m': 'm', 'unit.kg': 'kg',

  'habit.new': 'New habit', 'habit.edit': 'Edit habit', 'habit.name': 'Name', 'habit.block': 'Time of day',
  'habit.hasTarget': 'Has a target amount', 'habit.target': 'Target', 'habit.unit': 'Unit',
  'habit.autoGrow': 'Grow automatically', 'habit.autoGrowHint': 'If done on ≥80% of days in the period, the target increases by the step.',
  'habit.step': 'Step', 'habit.everyDays': 'Every N days', 'habit.max': 'Max',
  'habit.reminder': 'Reminder', 'habit.reminderHint': 'A push arrives at this time if the habit isn’t done yet (turn on Notifications in Settings).',

  'goal.new': 'New goal', 'goal.edit': 'Edit goal', 'goal.period': 'Period', 'goal.kind': 'Type', 'goal.title': 'Title',
  'goal.target': 'Target', 'goal.targetUsd': 'Target, USD', 'goal.progress': 'Progress',
  'goalKind.income': 'Income', 'goalKind.savings': 'Savings', 'goalKind.custom': 'Custom',
  'goalKind.income.hint': 'Counted automatically from your income in the period.',
  'goalKind.savings.hint': 'Counted automatically: income minus expenses in the period.',
  'goalKind.custom.hint': 'You update the progress yourself.',

  'quick.title': 'Quick add', 'quick.expense': 'Expense', 'quick.income': 'Income', 'quick.workout': 'Workout',
  'quick.metrics': 'Sleep & steps', 'quick.growth': 'Something new',

  'fin.amount': 'Amount', 'fin.category': 'Category', 'fin.incomeType': 'Income type', 'fin.monthLeft': 'Month net',
  'fin.balance': 'Balance', 'fin.fixed': 'Fixed', 'fin.variable': 'Variable', 'fin.income': 'Income', 'fin.expense': 'Expenses',
  'fin.rest': 'Other', 'fin.budgets': 'Monthly limits', 'fin.noBudgets': 'No limits yet — tap Edit to set them',
  'fin.budgetsHint': 'Monthly spending limit per category, in USD. Leave empty for no limit.',
  'fin.goals': 'Money goals', 'fin.newGoal': 'New money goal', 'fin.debtLeft': 'Left to pay', 'fin.noDebt': 'No debts', 'fin.debtTotal': 'Total debt, USD',
  'fin.saved': 'Saved', 'fin.paidOff': 'Paid off', 'fin.addToGoal': 'Amount, USD', 'fin.payDebt': 'Payment, USD', 'fin.withdraw': 'Take out',
  'fin.recurring': 'Recurring payments', 'fin.noRecurring': 'Subscriptions, rent and other monthly payments',
  'fin.newRecurring': 'New recurring payment', 'fin.everyMonth': 'Day {d} monthly', 'fin.dayOfMonth': 'Day of month',
  'fin.paid': 'Paid', 'fin.pay': 'Pay', 'fin.transactions': 'Transactions', 'fin.noTx': 'No transactions this month',

  'cat.food': 'Food', 'cat.housing': 'Housing', 'cat.transport': 'Transport', 'cat.entertainment': 'Fun', 'cat.health': 'Health',
  'cat.sport': 'Sport', 'cat.subscriptions': 'Subscriptions', 'cat.shopping': 'Shopping', 'cat.travel': 'Travel', 'cat.other': 'Other',
  'cat.fixed': 'Fixed income', 'cat.variable': 'Variable income',
  'fg.savings': 'Savings', 'fg.purchase': 'Purchase', 'fg.debt': 'Debt',

  'sport.type': 'Type', 'sport.minutes': 'Minutes', 'sport.minutesByDay': 'Minutes by day', 'sport.strengthN': '{n}/3 strength',
  'sport.program': 'Bodyweight program · Mon / Wed / Fri', 'sport.programSoon': 'Step-by-step plan with videos — coming in phase 3',
  'sport.thisMonth': 'This month', 'sport.noWorkouts': 'No workouts yet — tap + to log one', 'sport.recent': 'Recent',
  'sport.sleep': 'Sleep today', 'sport.sleepH': 'Sleep, hours', 'sport.steps': 'Steps', 'sport.weight': 'Body weight',
  'sport.weightHint': 'Once a month', 'wt.strength': 'Strength', 'wt.yoga': 'Yoga', 'wt.stretch': 'Stretching', 'wt.walk': 'Walk', 'wt.other': 'Other',

  'growth.place': 'New place', 'growth.skill': 'New skill', 'growth.speech': 'Speech', 'growth.lang': 'Languages',
  'growth.placeSat': 'Saturday', 'growth.placeToday': 'Today is the day', 'growth.setSkill': 'Set a skill',
  'growth.history': 'Last 26 weeks', 'growth.rows': 'Place · Skill · Speech · Lang', 'growth.idea': 'Idea for the week',
  'growth.take': 'Take', 'growth.another': 'Another', 'growth.placeQ': 'Where are you going?', 'growth.skillQ': 'What skill will you learn?',
  'growth.visited': 'Visited', 'growth.mastered': 'Mastered', 'growth.speechHint': 'Do any {n} of these this week.',
  'speech.camera': 'Talk to camera', 'speech.camera.d': '5 minutes on any topic, no script',
  'speech.retell': 'Retell a podcast', 'speech.retell.d': 'Listen, then retell the key ideas out loud',
  'speech.aloud': 'Read aloud', 'speech.aloud.d': '10 minutes, clear and expressive',
  'speech.explain': 'Explain a topic', 'speech.explain.d': 'Something complex — in 2 minutes',
  'speech.diction': 'Diction warm-up', 'speech.diction.d': 'Tongue twisters and articulation, 5 min',
  'lang.en': 'English', 'lang.fr': 'French', 'lang.de': 'German',

  'cal.today': 'Today',
  'push.needCloud': 'Sign in to Cloud sync above first.', 'push.title': 'Notifications', 'push.hint': 'Habit reminders at the time you set, events 15 min before, monthly summary on the 1st.',
  'push.onHint': 'On: habit reminders (time is set per habit), events 15 min before, monthly summary on the 1st.',
  'push.installFirst': 'Open LOCK IN from the Home Screen icon to enable notifications.', 'push.unsupported': 'This device doesn’t support web notifications.',
  'push.denied': 'Notifications are blocked — allow them in iPhone Settings → LOCK IN → Notifications.',
  'push.test': 'Send a test notification', 'push.testSent': 'Sent to {n} device(s)',

  'cal.new': 'New event', 'cal.connectHint': 'See your events and calls here and add new ones.', 'cal.needCloud': 'Sign in to cloud sync first (Settings).',
  'cal.connectBtn': 'Connect', 'cal.allDay': 'All day', 'cal.empty': 'No events this day', 'cal.join': 'Join call', 'cal.openGoogle': 'Open in Google Calendar',
  'cal.start': 'Start', 'cal.duration': 'Duration', 'cal.reminderNote': 'Google Calendar will remind you 15 minutes before.',
  'cal.disconnect': 'Disconnect', 'cal.disconnectQ': 'Disconnect Google Calendar?', 'today.now': 'now', 'today.inMin': 'in {n} min',
 'cal.connect': 'Google Calendar', 'cal.connectSoon': 'Events, calls and 15-min reminders — coming in phase 2',

  'stats.title': 'Stats', 'stats.eyebrow': 'All spheres', 'stats.habits': 'Habits', 'stats.avg': 'Average', 'stats.goodDays': '≥80% days',
  'stats.bestStreak': 'Best streak', 'stats.net': 'Net', 'stats.workouts': 'Workouts', 'stats.minutes': 'Minutes', 'stats.strength': 'Strength',
  'stats.avgSleep': 'Avg sleep', 'stats.avgSteps': 'Avg steps', 'stats.places': 'Places', 'stats.skills': 'Skills', 'stats.langMin': 'Language practice',
  'summary.title': 'Monthly summary', 'summary.vs': 'Deltas compared with {m}',

  'settings.title': 'Settings', 'settings.language': 'Language', 'settings.theme': 'Theme',
  'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.system': 'Auto',
  'settings.currencies': 'Currencies', 'settings.enabled': 'Enabled', 'settings.defaultExpense': 'Default for expenses',
  'settings.startBalance': 'Starting balance, USD', 'settings.startBalanceHint': 'Current: {v}. Balance = start + all income − all expenses.',
  'settings.habits': 'Daily habits', 'settings.growthTargets': 'Growth targets', 'settings.speechTarget': 'Speech activities per week (1–5)',
  'settings.minPerWeek': 'min per week', 'settings.data': 'Data',
  'settings.dataHint': 'With cloud sync on, data is saved automatically. Export makes an extra backup file.',
  'settings.export': 'Export', 'settings.import': 'Import', 'settings.importConfirm': 'Replace current data with the backup?',
  'settings.importError': 'This file is not a LOCK IN backup', 'settings.phase': 'phase 2',
  'cloud.offline': 'No connection — will sync automatically when you’re back online.', 'cloud.title': 'Cloud sync', 'cloud.hint': 'Sign in to back up your data and sync it between devices.', 'cloud.password': 'Password',
  'cloud.signIn': 'Sign in', 'cloud.signUp': 'Create account', 'cloud.pwHint': 'Password: at least 8 characters.',
  'cloud.checkEmail': 'Check your email and confirm the account, then sign in here.', 'cloud.syncNow': 'Sync now', 'cloud.signOut': 'Sign out',
  'cloud.last': 'Last sync:', 'cloud.status.off': 'Off', 'cloud.status.syncing': 'Syncing…', 'cloud.status.synced': 'Synced', 'cloud.status.error': 'Error',
}

const ru: Dict = {
  'tab.today': 'Сегодня', 'tab.calendar': 'Календарь', 'tab.finance': 'Финансы', 'tab.sport': 'Спорт', 'tab.growth': 'Рост',

  'common.add': 'Добавить', 'common.edit': 'Изменить', 'common.save': 'Сохранить', 'common.delete': 'Удалить', 'common.date': 'Дата',
  'common.note': 'Заметка', 'common.optional': 'Необязательно', 'common.week': 'Неделя', 'common.confirmDelete': 'Удалить?',

  'today.title': 'Сегодня', 'today.habits': 'Привычки', 'today.weekGoals': 'Цели недели', 'today.streak': 'Серия',
  'today.monthNet': 'За месяц', 'today.day': 'День', 'today.goals': 'Цели', 'today.noGoals': 'На этот период целей пока нет',
  'today.levelUp': 'Новый уровень — цель выросла',

  'block.morning': 'Утро', 'block.day': 'День', 'block.evening': 'Вечер',
  'period.week': 'Неделя', 'period.month': 'Месяц', 'period.year': 'Год',

  'unit.min': 'мин', 'unit.ml': 'мл', 'unit.pages': 'стр.', 'unit.reps': 'повт.', 'unit.steps': 'шагов',
  'unit.d': 'д', 'unit.h': 'ч', 'unit.m': 'м', 'unit.kg': 'кг',

  'habit.new': 'Новая привычка', 'habit.edit': 'Привычка', 'habit.name': 'Название', 'habit.block': 'Время дня',
  'habit.hasTarget': 'Есть норма (количество)', 'habit.target': 'Норма', 'habit.unit': 'Единица',
  'habit.autoGrow': 'Расти автоматически', 'habit.autoGrowHint': 'Если выполнено в ≥80% дней за период — норма увеличится на шаг.',
  'habit.step': 'Шаг', 'habit.everyDays': 'Каждые N дней', 'habit.max': 'Максимум',
  'habit.reminder': 'Напоминание', 'habit.reminderHint': 'Push придёт в это время, если привычка ещё не отмечена (включи Уведомления в Настройках).',

  'goal.new': 'Новая цель', 'goal.edit': 'Изменить цель', 'goal.period': 'Период', 'goal.kind': 'Тип', 'goal.title': 'Название',
  'goal.target': 'Цель', 'goal.targetUsd': 'Цель, USD', 'goal.progress': 'Прогресс',
  'goalKind.income': 'Доход', 'goalKind.savings': 'Накопления', 'goalKind.custom': 'Своя',
  'goalKind.income.hint': 'Считается автоматически по доходам за период.',
  'goalKind.savings.hint': 'Считается автоматически: доходы минус расходы за период.',
  'goalKind.custom.hint': 'Прогресс отмечаешь сам.',

  'quick.title': 'Быстро добавить', 'quick.expense': 'Расход', 'quick.income': 'Доход', 'quick.workout': 'Тренировка',
  'quick.metrics': 'Сон и шаги', 'quick.growth': 'Что-то новое',

  'fin.amount': 'Сумма', 'fin.category': 'Категория', 'fin.incomeType': 'Тип дохода', 'fin.monthLeft': 'Итог месяца',
  'fin.balance': 'Баланс', 'fin.fixed': 'Фикс.', 'fin.variable': 'Перем.', 'fin.income': 'Доходы', 'fin.expense': 'Расходы',
  'fin.rest': 'Прочее', 'fin.budgets': 'Лимиты на месяц', 'fin.noBudgets': 'Лимитов пока нет — нажми «Изменить»',
  'fin.budgetsHint': 'Лимит трат в месяц по категории, в USD. Пусто — без лимита.',
  'fin.goals': 'Финансовые цели', 'fin.newGoal': 'Новая финансовая цель', 'fin.debtLeft': 'Осталось выплатить', 'fin.noDebt': 'Долгов нет', 'fin.debtTotal': 'Сумма долга, USD',
  'fin.saved': 'Накоплено', 'fin.paidOff': 'Выплачено', 'fin.addToGoal': 'Сумма, USD', 'fin.payDebt': 'Платёж, USD', 'fin.withdraw': 'Снять',
  'fin.recurring': 'Регулярные платежи', 'fin.noRecurring': 'Подписки, аренда и другие ежемесячные платежи',
  'fin.newRecurring': 'Новый регулярный платёж', 'fin.everyMonth': '{d}-го числа', 'fin.dayOfMonth': 'Число месяца',
  'fin.paid': 'Оплачено', 'fin.pay': 'Оплатить', 'fin.transactions': 'Операции', 'fin.noTx': 'В этом месяце операций нет',

  'cat.food': 'Еда', 'cat.housing': 'Жильё', 'cat.transport': 'Транспорт', 'cat.entertainment': 'Развлечения', 'cat.health': 'Здоровье',
  'cat.sport': 'Спорт', 'cat.subscriptions': 'Подписки', 'cat.shopping': 'Покупки', 'cat.travel': 'Путешествия', 'cat.other': 'Прочее',
  'cat.fixed': 'Фиксированный доход', 'cat.variable': 'Переменный доход',
  'fg.savings': 'Накопления', 'fg.purchase': 'Покупка', 'fg.debt': 'Долг',

  'sport.type': 'Тип', 'sport.minutes': 'Минуты', 'sport.minutesByDay': 'Минуты по дням', 'sport.strengthN': 'силовые {n}/3',
  'sport.program': 'Программа с весом тела · Пн / Ср / Пт', 'sport.programSoon': 'Пошаговый план с видео — на 3 этапе',
  'sport.thisMonth': 'За месяц', 'sport.noWorkouts': 'Тренировок пока нет — нажми +', 'sport.recent': 'Последние',
  'sport.sleep': 'Сон сегодня', 'sport.sleepH': 'Сон, часов', 'sport.steps': 'Шаги', 'sport.weight': 'Вес тела',
  'sport.weightHint': 'Раз в месяц', 'wt.strength': 'Силовая', 'wt.yoga': 'Йога', 'wt.stretch': 'Растяжка', 'wt.walk': 'Прогулка', 'wt.other': 'Другое',

  'growth.place': 'Новое место', 'growth.skill': 'Новый навык', 'growth.speech': 'Речь', 'growth.lang': 'Языки',
  'growth.placeSat': 'В субботу', 'growth.placeToday': 'Сегодня — день', 'growth.setSkill': 'Выбрать навык',
  'growth.history': 'Последние 26 недель', 'growth.rows': 'Место · Навык · Речь · Языки', 'growth.idea': 'Идея на неделю',
  'growth.take': 'Взять', 'growth.another': 'Другая', 'growth.placeQ': 'Куда пойдёшь?', 'growth.skillQ': 'Какой навык осваиваешь?',
  'growth.visited': 'Сходил', 'growth.mastered': 'Освоил', 'growth.speechHint': 'Сделай любые {n} за неделю.',
  'speech.camera': 'Монолог на камеру', 'speech.camera.d': '5 минут на любую тему, без сценария',
  'speech.retell': 'Пересказ подкаста', 'speech.retell.d': 'Послушай и перескажи главное вслух',
  'speech.aloud': 'Чтение вслух', 'speech.aloud.d': '10 минут, чётко и с интонацией',
  'speech.explain': 'Объяснить тему', 'speech.explain.d': 'Что-то сложное — за 2 минуты',
  'speech.diction': 'Разминка дикции', 'speech.diction.d': 'Скороговорки и артикуляция, 5 мин',
  'lang.en': 'Английский', 'lang.fr': 'Французский', 'lang.de': 'Немецкий',

  'cal.today': 'Сегодня',
  'push.needCloud': 'Сначала войди в облако — карточка выше.', 'push.title': 'Уведомления', 'push.hint': 'Напоминания о привычках в твоё время, о событиях за 15 минут и итоги месяца 1-го числа.',
  'push.onHint': 'Включено: привычки (время задаётся у каждой), события за 15 минут, итоги месяца 1-го числа.',
  'push.installFirst': 'Открой LOCK IN с иконки на экране «Домой», чтобы включить уведомления.', 'push.unsupported': 'Это устройство не поддерживает веб-уведомления.',
  'push.denied': 'Уведомления запрещены — разреши их в Настройках iPhone → LOCK IN → Уведомления.',
  'push.test': 'Отправить тестовое уведомление', 'push.testSent': 'Отправлено на устройств: {n}',

  'cal.new': 'Новое событие', 'cal.connectHint': 'События и звонки появятся здесь, можно будет добавлять новые.', 'cal.needCloud': 'Сначала войди в облако (Настройки).',
  'cal.connectBtn': 'Подключить', 'cal.allDay': 'Весь день', 'cal.empty': 'В этот день событий нет', 'cal.join': 'Присоединиться к звонку', 'cal.openGoogle': 'Открыть в Google Календаре',
  'cal.start': 'Начало', 'cal.duration': 'Длительность', 'cal.reminderNote': 'Google Календарь напомнит за 15 минут.',
  'cal.disconnect': 'Отключить', 'cal.disconnectQ': 'Отключить Google Календарь?', 'today.now': 'сейчас', 'today.inMin': 'через {n} мин',
 'cal.connect': 'Google Календарь', 'cal.connectSoon': 'События, звонки и напоминания за 15 мин — на 2 этапе',

  'stats.title': 'Статистика', 'stats.eyebrow': 'Все сферы', 'stats.habits': 'Привычки', 'stats.avg': 'Среднее', 'stats.goodDays': 'Дни ≥80%',
  'stats.bestStreak': 'Лучшая серия', 'stats.net': 'Итог', 'stats.workouts': 'Тренировки', 'stats.minutes': 'Минуты', 'stats.strength': 'Силовые',
  'stats.avgSleep': 'Сон, ср.', 'stats.avgSteps': 'Шаги, ср.', 'stats.places': 'Места', 'stats.skills': 'Навыки', 'stats.langMin': 'Практика языков',
  'summary.title': 'Итоги месяца', 'summary.vs': 'Изменения по сравнению с: {m}',

  'settings.title': 'Настройки', 'settings.language': 'Язык', 'settings.theme': 'Тема',
  'theme.dark': 'Тёмная', 'theme.light': 'Светлая', 'theme.system': 'Авто',
  'settings.currencies': 'Валюты', 'settings.enabled': 'Включены', 'settings.defaultExpense': 'По умолчанию для расходов',
  'settings.startBalance': 'Стартовый баланс, USD', 'settings.startBalanceHint': 'Сейчас: {v}. Баланс = старт + все доходы − все расходы.',
  'settings.habits': 'Ежедневные привычки', 'settings.growthTargets': 'Нормы роста', 'settings.speechTarget': 'Активностей речи в неделю (1–5)',
  'settings.minPerWeek': 'мин в неделю', 'settings.data': 'Данные',
  'settings.dataHint': 'Когда включено облако, данные сохраняются автоматически. Экспорт — дополнительная копия файлом.',
  'settings.export': 'Экспорт', 'settings.import': 'Импорт', 'settings.importConfirm': 'Заменить текущие данные резервной копией?',
  'settings.importError': 'Это не резервная копия LOCK IN', 'settings.phase': 'этап 2',
  'cloud.offline': 'Нет связи — синхронизирую автоматически, когда появится интернет.', 'cloud.title': 'Облако', 'cloud.hint': 'Войди, чтобы данные сохранялись в облаке и синхронизировались между устройствами.', 'cloud.password': 'Пароль',
  'cloud.signIn': 'Войти', 'cloud.signUp': 'Создать аккаунт', 'cloud.pwHint': 'Пароль: минимум 8 символов.',
  'cloud.checkEmail': 'Проверь почту и подтверди аккаунт, затем войди здесь.', 'cloud.syncNow': 'Синхронизировать', 'cloud.signOut': 'Выйти',
  'cloud.last': 'Синхронизировано:', 'cloud.status.off': 'Выкл', 'cloud.status.syncing': 'Синхронизация…', 'cloud.status.synced': 'Готово', 'cloud.status.error': 'Ошибка',
}

export const dict = { en, ru }

export function useT() {
  const lang = useStore((s) => s.lang)
  return useCallback(
    (k: string, vars?: Record<string, string | number>) => {
      let s = dict[lang][k] ?? en[k] ?? k
      if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, String(b))
      return s
    },
    [lang],
  )
}
