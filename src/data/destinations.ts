
export type Destination = {
  id: string
  name: string
  position: [number, number]
  address?: string
  video?: string // path under /public/videos
  notes: string[]
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'lossihoov',
    name: 'Kuressaare loss / Lossihoov',
    address: 'Lossi 1',
    position: [58.2497, 22.4856],
    video: '/videos/lossihoov.mp4',
    notes: [
      'Sillal võib olla tugev tuul – hoia mütsist kinni ja käsi käsipuul.',
      'Silda ületades on teekate ebatasane. Vaata hoolikalt jalgade ette.',
      'Suvel on palju turiste – liigu rahulikult ja ära torma.'
    ],
  },
  {
    id: 'haigla',
    name: 'Kuressaare Haigla',
    address: 'Aia 25',
    position: [58.2552, 22.4888],
    video: '/videos/haigla.mp4',
    notes: [
      'Haigla ees on kiirabide liikumine – ületa tee ainult ülekäigurajal.',
      'Talvel võib parklas olla libe. Kasuta taldaga jalanõusid.',
      'Jälgi tõstetud äärekive parkla sissesõidul.'
    ],
  },
  {
    id: 'bussijaam',
    name: 'Bussijaam',
    address: 'Tallinna 14',
    position: [58.2526, 22.4867],
    video: '/videos/bussijaam.mp4',
    notes: [
      'Bussid võivad läheneda mõlemalt poolt – vaata vasakule ja paremale.',
      'Platvormidel on kõrguste vahed. Astu rahulikult.',
      'Tipptunnil on rohkem rahvast – varu natuke lisaaega.'
    ],
  },
]
