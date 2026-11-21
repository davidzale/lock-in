type Idea = { kind: 'place' | 'skill'; text: string }

const en: Idea[] = [
  { kind: 'place', text: 'A café in a district you never visit' },
  { kind: 'place', text: 'A museum or gallery you haven’t been to' },
  { kind: 'place', text: 'A sunrise viewpoint outside the city' },
  { kind: 'place', text: 'A local market early in the morning' },
  { kind: 'place', text: 'A day trip to a nearby town' },
  { kind: 'place', text: 'A new hiking trail' },
  { kind: 'place', text: 'A restaurant with a cuisine you’ve never tried' },
  { kind: 'place', text: 'A live music bar or a jazz night' },
  { kind: 'place', text: 'A bookstore you can browse for an hour' },
  { kind: 'place', text: 'A rooftop with a city view' },
  { kind: 'skill', text: 'Learn to cook one new dish properly' },
  { kind: 'skill', text: 'Juggle three balls' },
  { kind: 'skill', text: 'Touch typing — 50 WPM' },
  { kind: 'skill', text: 'Basic photo composition with your phone' },
  { kind: 'skill', text: 'Learn 5 chess openings' },
  { kind: 'skill', text: 'Shuffle a deck like a dealer' },
  { kind: 'skill', text: 'Basic first aid' },
  { kind: 'skill', text: 'Edit a short video in CapCut' },
  { kind: 'skill', text: 'Speed reading basics' },
  { kind: 'skill', text: 'Make proper espresso or pour-over coffee' },
]

const ru: Idea[] = [
  { kind: 'place', text: 'Кафе в районе, где ты никогда не бываешь' },
  { kind: 'place', text: 'Музей или галерея, где ты ещё не был' },
  { kind: 'place', text: 'Встретить рассвет на смотровой за городом' },
  { kind: 'place', text: 'Местный рынок рано утром' },
  { kind: 'place', text: 'Поездка на день в соседний город' },
  { kind: 'place', text: 'Новый маршрут для хайкинга' },
  { kind: 'place', text: 'Ресторан с кухней, которую ты не пробовал' },
  { kind: 'place', text: 'Бар с живой музыкой или джазовый вечер' },
  { kind: 'place', text: 'Книжный, где можно провести час' },
  { kind: 'place', text: 'Крыша с видом на город' },
  { kind: 'skill', text: 'Научиться готовить одно новое блюдо' },
  { kind: 'skill', text: 'Жонглировать тремя мячами' },
  { kind: 'skill', text: 'Слепая печать — 50 слов в минуту' },
  { kind: 'skill', text: 'Основы композиции для фото на телефон' },
  { kind: 'skill', text: 'Выучить 5 шахматных дебютов' },
  { kind: 'skill', text: 'Тасовать карты как крупье' },
  { kind: 'skill', text: 'Основы первой помощи' },
  { kind: 'skill', text: 'Смонтировать короткое видео в CapCut' },
  { kind: 'skill', text: 'Основы скорочтения' },
  { kind: 'skill', text: 'Сварить эспрессо или пуровер правильно' },
]

export const IDEAS: Record<'en' | 'ru', Idea[]> = { en, ru }
