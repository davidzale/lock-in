import { useCallback } from 'react'
import { useStore } from './store'

type Dict = Record<string, string>

const en: Dict = {
  'tab.today': 'Today', 'tab.calendar': 'Calendar', 'tab.finance': 'Finance', 'tab.sport': 'Sport', 'tab.growth': 'Growth',

  'common.add': 'Add', 'common.edit': 'Edit', 'common.save': 'Save', 'common.delete': 'Delete', 'common.date': 'Date',
  'common.note': 'Note', 'common.optional': 'Optional', 'common.week': 'Week', 'common.confirmDelete': 'Delete this item?',

  'today.title': 'Today', 'today.incomeGoal': 'Income goal', 'goal.emptyHint': 'Books, courses, habits — anything you can count', 'goal.titlePh': 'Read books, finish a course…', 'today.habits': 'Habits', 'today.weekGoals': 'Week goals', 'today.streak': 'Streak',
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

  'common.cancel': 'Cancel', 'fin.spending': 'Spending', 'fin.editTx': 'Edit transaction', 'fin.monthGoal': 'Month goal', 'fin.yearGoal': 'Year goal',
  'fin.monthGoalHint': 'Applies to this month and carries over to the next months until you change it.', 'fin.yearGoalHint': 'Income target for this calendar year.',
  'fin.budgetsHint2': 'Spending limits for this month, in USD. They carry over to the next months until you change them.',
  'fin.payQ': 'Confirm payment', 'fin.payHint': 'This records the expense in this month. You can edit or delete it later in Transactions.', 'fin.confirmPay': 'Yes, paid',
  'fin.dueLeft': 'Still to pay this month:', 'fin.amountFrom': 'A new amount applies from this month on; earlier months keep the old one.',
  'fin.yearSaved': 'Saved this year', 'fin.earned': 'Earned', 'fin.spent': 'Spent', 'fin.saveRate': 'Saved %', 'fin.avgIncome': 'Avg income / month',
  'fin.needPerMonth': 'To reach it: {v} per month', 'fin.perMonthTill': '{v}/mo till {d}', 'fin.byMonth': 'By month', 'fin.deadline': 'By (optional)', 'fin.goalPh': 'Car, savings, trip…',
  'fin.amount': 'Amount', 'fin.category': 'Category', 'fin.incomeType': 'Income type', 'fin.monthLeft': 'Month net',
  'fin.balance': 'Balance', 'fin.fixed': 'Fixed', 'fin.variable': 'Variable', 'fin.income': 'Income', 'fin.expense': 'Expenses',
  'fin.rest': 'Other', 'fin.budgets': 'Monthly limits', 'fin.noBudgets': 'No limits yet — tap Edit to set them',
  'fin.budgetsHint': 'Monthly spending limit per category, in USD. Leave empty for no limit.',
  'fin.goals': 'Global goals', 'fin.newGoal': 'New money goal', 'fin.debtLeft': 'Left to pay', 'fin.noDebt': 'No debts', 'fin.debtTotal': 'Total debt, USD',
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
  'sport.spineTitle': 'Built for your spine', 'sport.spineText': 'The program is adapted for scoliosis and kyphosis: more upper-back and posture work, chest and thoracic opening, symmetric core stability, no loaded twisting or hard jumps. Move slowly and with control. Stop if you feel sharp pain, numbness or tingling. A physiotherapist can tell you if one side needs extra work — then do more on that side in side planks and single-leg moves.',
  'sport.setsPer': '{n} sets each', 'sport.phase': 'phase', 'sport.program12': '12-week program', 'sport.resume': 'Resume workout', 'sport.strength': 'Strength',
  'sport.nextOn': 'next:', 'sport.again': 'Do it again', 'sport.startProgram': 'Start the program', 'sport.morning': 'Morning', 'sport.evening': 'Evening',
  'sport.levels': 'Your levels', 'sport.levelsHint': 'tap to see', 'sport.records': 'Personal records',
  'sport.levelRule': 'Hit the top of the range in every set two workouts in a row and you move up a level automatically. You can also switch level by hand.',
  'sport.current': 'Current', 'sport.setLevel': 'Use this level', 'sport.myVideo': 'My video link (optional)',
  'sess.yoga': 'Morning yoga', 'sess.stretch': 'Evening stretch', 'sess.day': 'Day', 'sess.start': 'Start', 'sess.warmup': 'Warm-up',
  'sess.strength': 'Strength', 'sess.finisher': 'Finisher', 'sess.cooldown': 'Cool-down', 'sess.rest': 'Rest', 'sess.flow': '',
  'sess.poses': 'poses', 'sess.sets': 'Sets', 'sess.reps': 'Reps', 'sess.repsShort': 'reps', 'sess.seconds': 'sec', 'sess.perSide': 'each side',
  'sess.setOf': 'set {a} of {b}', 'sess.target': 'Target', 'sess.video': 'Technique video', 'sess.hideVideo': 'Hide video', 'sess.logSet': 'Set done',
  'sess.startTimer': 'Start timer', 'sess.stopTimer': 'Stop timer', 'sess.skipRest': 'Skip', 'sess.next': 'Next', 'sess.left': 'left side', 'sess.right': 'right side',
  'sess.exitQ': 'Leave the workout?', 'sess.finishNow': 'Finish and save', 'sess.later': 'Pause — continue later', 'sess.discard': 'Discard', 'sess.continue': 'Keep going',
  'sess.doneTitle': 'Workout complete', 'sess.levelUp': 'Level up!', 'sess.newPrs': 'New records',

  'ai.needCloud': 'Sign in to Cloud sync in Settings to use the assistant.', 'ai.title': 'Assistant', 'ai.placeholder': 'e.g. “spent 25 lari on groceries, did yoga and meditation, slept 7 hours”',
  'ai.hintMic': 'Tap the mic and speak, or type. I’ll show what I understood before saving.', 'ai.hintKeyboard': 'Tap the mic on the iPhone keyboard and say e.g. “coffee 12 lari, taxi 8 lari”.',
  'ai.send': 'Send', 'ai.thinking': 'Thinking…', 'ai.apply': 'Apply ({n})', 'ai.again': 'Redo', 'ai.done': 'Done', 'ai.micError': 'Microphone unavailable — use the mic on the keyboard.',

  'push.needCloud': 'Sign in to Cloud sync above first.', 'push.title': 'Notifications', 'push.hint': 'Habit reminders at the time you set, events 15 min before, monthly summary on the 1st.',
  'push.onHint': 'On: habit reminders (time is set per habit), events 15 min before, monthly summary on the 1st.',
  'push.installFirst': 'Open LOCK IN from the Home Screen icon to enable notifications.', 'push.unsupported': 'This device doesn’t support web notifications.',
  'push.denied': 'Notifications are blocked — allow them in iPhone Settings → LOCK IN → Notifications.',
  'push.test': 'Send a test notification', 'push.testSent': 'Sent to {n} device(s)',

  'cal.guests': 'Guests (email, optional)', 'cal.badEmail': 'Check this email: {e}', 'cal.addMeet': 'Add Google Meet link', 'cal.inviteNote': 'Guests get an email invitation from Google Calendar. You’ll be reminded 15 minutes before.',
  'cal.noScope': 'Google didn’t give access to the calendar. Tap Connect and tick the calendar checkbox on Google’s screen.', 'cal.notConnected': 'Google Calendar isn’t connected — tap Connect on the Calendar tab.',
  'cal.edit': 'Edit event', 'cal.deleteQ': 'Delete this event? Guests will be notified.',
  'cal.new': 'New event', 'cal.connectHint': 'See your events and calls here and add new ones.', 'cal.needCloud': 'Sign in to cloud sync first (Settings).',
  'cal.connectBtn': 'Connect', 'cal.allDay': 'All day', 'cal.empty': 'No events this day', 'cal.join': 'Join call', 'cal.openGoogle': 'Open in Google Calendar',
  'cal.start': 'Start', 'cal.duration': 'Duration', 'cal.reminderNote': 'Google Calendar will remind you 15 minutes before.',
  'cal.disconnect': 'Disconnect', 'cal.disconnectQ': 'Disconnect Google Calendar?', 'today.now': 'now', 'today.noMoreEvents': 'No more events today', 'today.inMin': 'in {n} min',
 'cal.connect': 'Google Calendar', 'cal.connectSoon': 'Events, calls and 15-min reminders — coming in phase 2',

  'stats.title': 'Stats', 'stats.eyebrow': 'All spheres', 'stats.habits': 'Habits', 'stats.avg': 'Average', 'stats.goodDays': '≥80% days',
  'stats.bestStreak': 'Best streak', 'stats.net': 'Net', 'stats.workouts': 'Workouts', 'stats.minutes': 'Minutes', 'stats.strength': 'Strength',
  'stats.avgSleep': 'Avg sleep', 'stats.avgSteps': 'Avg steps', 'stats.places': 'Places', 'stats.skills': 'Skills', 'stats.langMin': 'Language practice',
  'summary.title': 'Monthly summary', 'summary.vs': 'Compared with last month',

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

  'today.title': 'Сегодня', 'today.incomeGoal': 'Цель дохода', 'goal.emptyHint': 'Книги, курсы, привычки — всё, что можно посчитать', 'goal.titlePh': 'Прочитать книг, пройти курс…', 'today.habits': 'Привычки', 'today.weekGoals': 'Цели недели', 'today.streak': 'Серия',
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

  'common.cancel': 'Отмена', 'fin.spending': 'Траты', 'fin.editTx': 'Изменить операцию', 'fin.monthGoal': 'Цель на месяц', 'fin.yearGoal': 'Цель на год',
  'fin.monthGoalHint': 'Действует с этого месяца и переносится на следующие, пока не изменишь.', 'fin.yearGoalHint': 'Цель по доходу на этот календарный год.',
  'fin.budgetsHint2': 'Лимиты трат на этот месяц, в USD. Переносятся на следующие месяцы, пока не изменишь.',
  'fin.payQ': 'Подтверди оплату', 'fin.payHint': 'Расход запишется в этот месяц. Потом его можно изменить или удалить в «Операциях».', 'fin.confirmPay': 'Да, оплачено',
  'fin.dueLeft': 'Ещё к оплате в этом месяце:', 'fin.amountFrom': 'Новая сумма действует с этого месяца; в прошлых месяцах остаётся старая.',
  'fin.yearSaved': 'Отложено за год', 'fin.earned': 'Заработано', 'fin.spent': 'Потрачено', 'fin.saveRate': 'Отложено %', 'fin.avgIncome': 'Доход в среднем / мес',
  'fin.needPerMonth': 'Чтобы успеть: {v} в месяц', 'fin.perMonthTill': '{v}/мес до {d}', 'fin.byMonth': 'По месяцам', 'fin.deadline': 'Срок (необязательно)', 'fin.goalPh': 'Машина, копилка, поездка…',
  'fin.amount': 'Сумма', 'fin.category': 'Категория', 'fin.incomeType': 'Тип дохода', 'fin.monthLeft': 'Итог месяца',
  'fin.balance': 'Баланс', 'fin.fixed': 'Фикс.', 'fin.variable': 'Перем.', 'fin.income': 'Доходы', 'fin.expense': 'Расходы',
  'fin.rest': 'Прочее', 'fin.budgets': 'Лимиты на месяц', 'fin.noBudgets': 'Лимитов пока нет — нажми «Изменить»',
  'fin.budgetsHint': 'Лимит трат в месяц по категории, в USD. Пусто — без лимита.',
  'fin.goals': 'Глобальные цели', 'fin.newGoal': 'Новая финансовая цель', 'fin.debtLeft': 'Осталось выплатить', 'fin.noDebt': 'Долгов нет', 'fin.debtTotal': 'Сумма долга, USD',
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
  'sport.spineTitle': 'Программа под твою спину', 'sport.spineText': 'Программа адаптирована под сколиоз и кифоз: больше работы на верх спины и осанку, раскрытие груди и грудного отдела, симметричная стабилизация корпуса, без скручиваний под нагрузкой и жёстких прыжков. Двигайся медленно и подконтрольно. Остановись, если появится резкая боль, онемение или покалывание. Физиотерапевт подскажет, нужна ли одной стороне дополнительная работа — тогда делай на эту сторону больше в боковой планке и упражнениях на одну ногу.',
  'sport.setsPer': 'по {n} подхода', 'sport.phase': 'фаза', 'sport.program12': 'Программа на 12 недель', 'sport.resume': 'Продолжить тренировку', 'sport.strength': 'Силовая',
  'sport.nextOn': 'след.:', 'sport.again': 'Пройти ещё раз', 'sport.startProgram': 'Начать программу', 'sport.morning': 'Утро', 'sport.evening': 'Вечер',
  'sport.levels': 'Твои уровни', 'sport.levelsHint': 'нажми, чтобы открыть', 'sport.records': 'Личные рекорды',
  'sport.levelRule': 'Сделай верх диапазона во всех подходах две тренировки подряд — и уровень повысится сам. Уровень можно сменить и вручную.',
  'sport.current': 'Текущий', 'sport.setLevel': 'Выбрать уровень', 'sport.myVideo': 'Своё видео (ссылка, необязательно)',
  'sess.yoga': 'Утренняя йога', 'sess.stretch': 'Вечерняя растяжка', 'sess.day': 'День', 'sess.start': 'Начать', 'sess.warmup': 'Разминка',
  'sess.strength': 'Силовая часть', 'sess.finisher': 'Финишер', 'sess.cooldown': 'Заминка', 'sess.rest': 'Отдых', 'sess.flow': '',
  'sess.poses': 'поз', 'sess.sets': 'Подходы', 'sess.reps': 'Повторения', 'sess.repsShort': 'повт.', 'sess.seconds': 'сек', 'sess.perSide': 'на сторону',
  'sess.setOf': 'подход {a} из {b}', 'sess.target': 'Цель', 'sess.video': 'Видео техники', 'sess.hideVideo': 'Скрыть видео', 'sess.logSet': 'Подход сделан',
  'sess.startTimer': 'Запустить таймер', 'sess.stopTimer': 'Остановить таймер', 'sess.skipRest': 'Пропустить', 'sess.next': 'Далее', 'sess.left': 'левая сторона', 'sess.right': 'правая сторона',
  'sess.exitQ': 'Выйти из тренировки?', 'sess.finishNow': 'Завершить и сохранить', 'sess.later': 'Пауза — продолжу позже', 'sess.discard': 'Отменить тренировку', 'sess.continue': 'Продолжить',
  'sess.doneTitle': 'Тренировка завершена', 'sess.levelUp': 'Новый уровень!', 'sess.newPrs': 'Новые рекорды',

  'ai.needCloud': 'Чтобы пользоваться помощником, войди в облако в Настройках.', 'ai.title': 'Помощник', 'ai.placeholder': 'Например: «потратил 25 лари на продукты, сделал йогу и медитацию, спал 7 часов»',
  'ai.hintMic': 'Нажми на микрофон и говори, или напиши. Перед сохранением я покажу, что понял.', 'ai.hintKeyboard': 'Нажми микрофон на клавиатуре iPhone и скажи, например: «кофе 12 лари, такси 8 лари».',
  'ai.send': 'Отправить', 'ai.thinking': 'Думаю…', 'ai.apply': 'Применить ({n})', 'ai.again': 'Заново', 'ai.done': 'Готово', 'ai.micError': 'Микрофон недоступен — продиктуй через микрофон на клавиатуре.',

  'push.needCloud': 'Сначала войди в облако — карточка выше.', 'push.title': 'Уведомления', 'push.hint': 'Напоминания о привычках в твоё время, о событиях за 15 минут и итоги месяца 1-го числа.',
  'push.onHint': 'Включено: привычки (время задаётся у каждой), события за 15 минут, итоги месяца 1-го числа.',
  'push.installFirst': 'Открой LOCK IN с иконки на экране «Домой», чтобы включить уведомления.', 'push.unsupported': 'Это устройство не поддерживает веб-уведомления.',
  'push.denied': 'Уведомления запрещены — разреши их в Настройках iPhone → LOCK IN → Уведомления.',
  'push.test': 'Отправить тестовое уведомление', 'push.testSent': 'Отправлено на устройств: {n}',

  'cal.guests': 'Гости (email, необязательно)', 'cal.badEmail': 'Проверь email: {e}', 'cal.addMeet': 'Добавить ссылку Google Meet', 'cal.inviteNote': 'Гостям придёт приглашение на почту от Google Календаря. Тебе — напоминание за 15 минут.',
  'cal.noScope': 'Google не дал доступ к календарю. Нажми «Подключить» и на экране Google поставь галочку у календаря.', 'cal.notConnected': 'Google Календарь не подключён — нажми «Подключить» на вкладке «Календарь».',
  'cal.edit': 'Изменить событие', 'cal.deleteQ': 'Удалить событие? Гости получат уведомление.',
  'cal.new': 'Новое событие', 'cal.connectHint': 'События и звонки появятся здесь, можно будет добавлять новые.', 'cal.needCloud': 'Сначала войди в облако (Настройки).',
  'cal.connectBtn': 'Подключить', 'cal.allDay': 'Весь день', 'cal.empty': 'В этот день событий нет', 'cal.join': 'Присоединиться к звонку', 'cal.openGoogle': 'Открыть в Google Календаре',
  'cal.start': 'Начало', 'cal.duration': 'Длительность', 'cal.reminderNote': 'Google Календарь напомнит за 15 минут.',
  'cal.disconnect': 'Отключить', 'cal.disconnectQ': 'Отключить Google Календарь?', 'today.now': 'сейчас', 'today.noMoreEvents': 'Сегодня событий больше нет', 'today.inMin': 'через {n} мин',
 'cal.connect': 'Google Календарь', 'cal.connectSoon': 'События, звонки и напоминания за 15 мин — на 2 этапе',

  'stats.title': 'Статистика', 'stats.eyebrow': 'Все сферы', 'stats.habits': 'Привычки', 'stats.avg': 'Среднее', 'stats.goodDays': 'Дни ≥80%',
  'stats.bestStreak': 'Лучшая серия', 'stats.net': 'Итог', 'stats.workouts': 'Тренировки', 'stats.minutes': 'Минуты', 'stats.strength': 'Силовые',
  'stats.avgSleep': 'Сон, ср.', 'stats.avgSteps': 'Шаги, ср.', 'stats.places': 'Места', 'stats.skills': 'Навыки', 'stats.langMin': 'Практика языков',
  'summary.title': 'Итоги месяца', 'summary.vs': 'Сравнение с прошлым месяцем',

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
