import type { Locale } from "@/lib/i18n/config";

type Text = { en: string; ar: string };
type List = { en: string[]; ar: string[] };

export type Recipe = {
  slug: string;
  image: string;
  /** Which part of the photo stays in view when it is cropped (CSS object-position). */
  focus: string;
  color: string;
  minutes: number;
  serves: number;
  title: Text;
  intro: Text;
  ingredients: List;
  steps: List;
  /** Product slugs used in the recipe. */
  products: string[];
};

export const RECIPES: Recipe[] = [
  {
    slug: "fattoush-with-pomegranate-molasses",
    image: "/photos/trio-shelf.webp",
    focus: "50% 100%",
    color: "#a3213f",
    minutes: 20,
    serves: 4,
    title: { en: "Fattoush with pomegranate molasses", ar: "فتوش بدبس الرمان" },
    intro: {
      en: "The Lebanese salad everyone loves — crisp vegetables, toasted bread and a tangy dressing made with pure pomegranate molasses and cold-pressed olive oil.",
      ar: "السلطة اللبنانية التي يحبها الجميع — خضار مقرمشة وخبز محمّص وصلصة حامضة بدبس الرمان الصافي وزيت الزيتون المعصور على البارد.",
    },
    ingredients: {
      en: ["2 loaves Arabic bread, toasted", "1 lettuce, chopped", "2 tomatoes, 2 cucumbers, 5 radishes", "1 bunch parsley and fresh mint", "3 tbsp Ja'deer extra virgin olive oil", "2 tbsp Ja'deer pomegranate molasses", "1 lemon, 1 tsp sumac, salt"],
      ar: ["رغيفان من الخبز العربي المحمّص", "خسة مقطّعة", "حبتا بندورة، حبتا خيار، ٥ حبات فجل", "باقة بقدونس ونعنع طازج", "٣ ملاعق كبيرة زيت زيتون بكر ممتاز من جدير", "ملعقتان كبيرتان دبس رمان من جدير", "حبة ليمون، ملعقة صغيرة سماق، ملح"],
    },
    steps: {
      en: ["Chop all the vegetables and herbs into bite-size pieces.", "Whisk the olive oil, pomegranate molasses, lemon juice, sumac and salt.", "Toss the salad with the dressing, add the toasted bread and serve straight away."],
      ar: ["قطّع كل الخضار والأعشاب قطعاً صغيرة.", "اخفق زيت الزيتون ودبس الرمان وعصير الليمون والسماق والملح.", "اخلط السلطة مع الصلصة، أضف الخبز المحمّص وقدّمها فوراً."],
    },
    products: ["pomegranate-molasses", "extra-virgin-olive-oil"],
  },
  {
    slug: "iced-matcha-latte",
    image: "/photos/matcha.webp",
    focus: "50% 64%",
    color: "#2f6b47",
    minutes: 5,
    serves: 1,
    title: { en: "The perfect iced matcha latte", ar: "لاتيه الماتشا المثلّج المثالي" },
    intro: {
      en: "Calm, steady energy in a glass. Ceremonial-grade organic matcha, whisked smooth and poured over cold milk — with a touch of rose if you like.",
      ar: "طاقة هادئة ومتوازنة في كوب. ماتشا عضوية من الدرجة الاحتفالية، مخفوقة بنعومة فوق حليب بارد — مع لمسة ورد إذا أحببت.",
    },
    ingredients: {
      en: ["1 tsp Ja'deer Japanese matcha", "60 ml hot water (80°C)", "200 ml cold milk of your choice", "Ice", "1 tsp Ja'deer keto rose syrup (optional)"],
      ar: ["ملعقة صغيرة ماتشا يابانية من جدير", "٦٠ مل ماء ساخن (٨٠ درجة)", "٢٠٠ مل حليب بارد حسب اختيارك", "ثلج", "ملعقة صغيرة شراب ورد كيتو من جدير (اختياري)"],
    },
    steps: {
      en: ["Sift the matcha into a bowl and whisk with the hot water until frothy.", "Fill a glass with ice and milk, add the rose syrup if using.", "Pour the matcha over the milk and stir gently."],
      ar: ["انخل الماتشا في وعاء واخفقها مع الماء الساخن حتى تتكوّن رغوة.", "املأ كوباً بالثلج والحليب وأضف شراب الورد إذا رغبت.", "اسكب الماتشا فوق الحليب وحرّك بلطف."],
    },
    products: ["japanese-matcha", "keto-rose-syrup"],
  },
  {
    slug: "jallab-summer-cooler",
    image: "/photos/syrup-collection.webp",
    focus: "50% 78%",
    color: "#c2412d",
    minutes: 5,
    serves: 2,
    title: { en: "Jallab, the summer cooler", ar: "الجلاب، مشروب الصيف" },
    intro: {
      en: "Dates, grape molasses and rose water over crushed ice, topped with pine nuts and raisins — the taste of Lebanese summers.",
      ar: "تمر ودبس عنب وماء ورد فوق الثلج المجروش مع الصنوبر والزبيب — طعم الصيف اللبناني.",
    },
    ingredients: {
      en: ["100 ml Ja'deer jallab syrup", "400 ml cold water", "Crushed ice", "1 tbsp pine nuts", "1 tbsp golden raisins"],
      ar: ["١٠٠ مل شراب جلاب من جدير", "٤٠٠ مل ماء بارد", "ثلج مجروش", "ملعقة كبيرة صنوبر", "ملعقة كبيرة زبيب ذهبي"],
    },
    steps: {
      en: ["Mix the jallab syrup with the cold water.", "Fill two glasses with crushed ice and pour over the jallab.", "Top with pine nuts and raisins and serve with a spoon."],
      ar: ["اخلط شراب الجلاب مع الماء البارد.", "املأ كوبين بالثلج المجروش واسكب فوقه الجلاب.", "زيّنه بالصنوبر والزبيب وقدّمه مع ملعقة."],
    },
    products: ["jallab-syrup"],
  },
  {
    slug: "keto-bbq-chicken-wings",
    image: "/photos/keto-bbq-dip.webp",
    focus: "50% 52%",
    color: "#146b66",
    minutes: 45,
    serves: 4,
    title: { en: "Sticky keto BBQ chicken wings", ar: "أجنحة دجاج باربكيو كيتو" },
    intro: {
      en: "Crispy oven-baked wings glazed with smoky, sugar-free BBQ sauce. Game-night food that fits a keto lifestyle.",
      ar: "أجنحة مقرمشة في الفرن مدهونة بصلصة باربكيو مدخّنة بدون سكر. أكلة سهرة تناسب نظام الكيتو.",
    },
    ingredients: {
      en: ["1 kg chicken wings", "2 tbsp Ja'deer avocado oil", "1 tsp garlic powder, 1 tsp paprika, salt", "6 tbsp Ja'deer keto BBQ sauce"],
      ar: ["١ كغ أجنحة دجاج", "ملعقتان كبيرتان زيت أفوكادو من جدير", "ملعقة صغيرة بودرة ثوم، ملعقة صغيرة بابريكا، ملح", "٦ ملاعق كبيرة صلصة باربكيو كيتو من جدير"],
    },
    steps: {
      en: ["Toss the wings with avocado oil and spices.", "Bake at 220°C for 35 minutes, turning once, until crisp.", "Brush with keto BBQ sauce and bake 5 more minutes until sticky."],
      ar: ["اخلط الأجنحة مع زيت الأفوكادو والبهارات.", "اخبزها على حرارة ٢٢٠ درجة لمدة ٣٥ دقيقة مع قلبها مرة حتى تصبح مقرمشة.", "ادهنها بصلصة الباربكيو كيتو وأعدها للفرن ٥ دقائق حتى تلمع."],
    },
    products: ["keto-bbq-sauce", "organic-avocado-oil"],
  },
];

export function recipeText(recipe: Recipe, locale: Locale) {
  return {
    title: recipe.title[locale],
    intro: recipe.intro[locale],
    ingredients: recipe.ingredients[locale],
    steps: recipe.steps[locale],
  };
}
