/** Iran provinces — English slug + Persian label for validation. */
export const IRAN_PROVINCES = [
  { code: "tehran", en: "Tehran", fa: "تهران" },
  { code: "alborz", en: "Alborz", fa: "البرز" },
  { code: "isfahan", en: "Isfahan", fa: "اصفهان" },
  { code: "fars", en: "Fars", fa: "فارس" },
  { code: "khorasan-razavi", en: "Khorasan Razavi", fa: "خراسان رضوی" },
  { code: "east-azerbaijan", en: "East Azerbaijan", fa: "آذربایجان شرقی" },
  { code: "west-azerbaijan", en: "West Azerbaijan", fa: "آذربایجان غربی" },
  { code: "khuzestan", en: "Khuzestan", fa: "خوزستان" },
  { code: "mazandaran", en: "Mazandaran", fa: "مازندران" },
  { code: "gilan", en: "Gilan", fa: "گیلان" },
  { code: "kerman", en: "Kerman", fa: "کرمان" },
  { code: "sistan-baluchestan", en: "Sistan and Baluchestan", fa: "سیستان و بلوچستان" },
  { code: "kermanshah", en: "Kermanshah", fa: "کرمانشاه" },
  { code: "hormozgan", en: "Hormozgan", fa: "هرمزگان" },
  { code: "lorestan", en: "Lorestan", fa: "لرستان" },
  { code: "hamadan", en: "Hamadan", fa: "همدان" },
  { code: "kurdistan", en: "Kurdistan", fa: "کردستان" },
  { code: "ardabil", en: "Ardabil", fa: "اردبیل" },
  { code: "qom", en: "Qom", fa: "قم" },
  { code: "zanjan", en: "Zanjan", fa: "زنجان" },
  { code: "markazi", en: "Markazi", fa: "مرکزی" },
  { code: "qazvin", en: "Qazvin", fa: "قزوین" },
  { code: "golestan", en: "Golestan", fa: "گلستان" },
  { code: "semnan", en: "Semnan", fa: "سمنان" },
  { code: "yazd", en: "Yazd", fa: "یزد" },
  { code: "bushehr", en: "Bushehr", fa: "بوشهر" },
  { code: "ilam", en: "Ilam", fa: "ایلام" },
  { code: "chaharmahal-bakhtiari", en: "Chaharmahal and Bakhtiari", fa: "چهارمحال و بختیاری" },
  { code: "north-khorasan", en: "North Khorasan", fa: "خراسان شمالی" },
  { code: "south-khorasan", en: "South Khorasan", fa: "خراسان جنوبی" },
  { code: "kohgiluyeh-boyer-ahmad", en: "Kohgiluyeh and Boyer-Ahmad", fa: "کهگیلویه و بویراحمد" },
] as const

const PROVINCE_LOOKUP = new Set(
  IRAN_PROVINCES.flatMap((p) => [
    p.code,
    p.en.toLowerCase(),
    p.fa,
    p.fa.replace(/\s+/g, ""),
  ])
)

export function isKnownIranProvince(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  const compactFa = value.trim().replace(/\s+/g, "")

  return (
    PROVINCE_LOOKUP.has(normalized) ||
    PROVINCE_LOOKUP.has(value.trim()) ||
    PROVINCE_LOOKUP.has(compactFa)
  )
}
