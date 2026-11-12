export interface Treatment {
  id: number;
  name: string;
  /** Shorter name for the large page headings when the full name is long */
  shortName?: string;
  /** Line shown under the hero heading, e.g. the product and device used */
  subtitle?: string;
  tagline?: string;
  slug: string;
  /** Keyword matched against booking category names in Square for "Book" links */
  bookingCategory?: string;
  /** Square category ID for "Book" links; takes priority over bookingCategory */
  bookingCategoryId?: string;
  description: string;
  longDescription?: string;
  /** Heading for the benefits list; defaults to "BENEFITS" */
  benefitsTitle?: string;
  benefits?: string[];
  duration?: string;
  price?: number;
  imageMain: string;
  imageSub: string;
  imageCard: string;
  cards?: {
    title: string;
    description: string;
  }[];
  /** Questions shown in an FAQ section; each answer is a list of paragraphs */
  faqs?: {
    question: string;
    answer: string[];
  }[];
}

export const treatments: Treatment[] = [
  {
    id: 1,
    name: "Sharplight Technology",
    slug: "sharplight",
    bookingCategory: "laser",
    description: "SharpLight designs and manufactures non-invasive aesthetic medical solutions for a broad range of treatments such as hair removal, body and facial contouring, acne improvement, pigmented and vascular lesion reduction, and tattoo removal.",
    longDescription: `
    Step into the future of hair removal with SharpLight's cutting-edge technologies. Say goodbye to the traditional methods of plucking, waxing, and shaving, and welcome a new era of long-term hair reduction. The innovative Dynamic Pulse Control (DPC) and DPC Flow technologies are designed to deliver permanent results, catering to all skin types, including dark skin, throughout the year. Enjoy a swift, comfortable treatment experience that's virtually painless.

    SharpLight's treatment involves a targeted light beam that safely penetrates the skin, reaching the melanin in the hair follicles. This precise energy is strong enough to disable the follicle, preventing regrowth, while preserving the surrounding skin's integrity.`,
    benefits: [
      "Permanent hair reduction",
      "Suitable for all skin types",
      "Virtually painless treatment",
      "Fast treatment times",
      "Year-round treatment capability"
    ],
    duration: "30-60 minutes",
    price: 199,
    imageMain: "/images/treatments/sharplight.webp",
    imageSub: "/images/treatments/sharplight-sub.webp",
    imageCard: "/images/treatments/sharplight-card.webp",
    cards: [
      {
        title: "Advanced Technology",
        description: "Sharplight is a singular technology aesthetic device powered by their flagship DPC technology which lets us treat a variety of indications such as skin rejuvenation, pigmented and vascular lesions, hair removal and acne."
      },
      {
        title: "Versatile Treatment",
        description: "Sharplight's variety of configurations can facilitate a range of thermal effects, such as selective tissue heating to achieve neocollagenesis, or increased heat to stimulate epidermal regeneration"
      },
      {
        title: "Comfortable Experience",
        description: "The Sharplight RapidDPC technology allows for faster treatment times without compromising on quality or pain levels."
      },
      {
        title: "Results Tailored to Your Needs",
        description: "Sharplight's proprietary Dynamic Pulse Control technology allows us to automatically configure laser treatments to guarantee the best outcomes for your unique needs."
      }
    ]
  },
  {
    id: 2,
    name: "Dermapen DP4",
    slug: "dermapen-dp4",
    bookingCategory: "microneedling",
    description: "Advance your skincare with the fastest microneedling device in history. The Dp4 is a small hand-held device that can create thousands of micro-punctures per second to stimulate your skin's natural ability to heal itself, signaling for collagen and elastin production.",
    longDescription: `
    Unveil the secret to youthful, radiant skin with the Dp4 by Dermapen, the pinnacle of microneedling technology. This FDA-cleared device revolutionizes skin rejuvenation by creating millions of fine, vertical micro-channels at unparalleled speeds, significantly faster than comparable devices.

    The Dp4 not only treats facial acne scars with its dedicated Scar Treatment setting but also addresses a myriad of skin concerns, from fine lines and wrinkles to enlarged pores and stretch marks.

    Its advanced oscillating vertical needle technology ensures precise, safe, and comfortable treatments, promoting natural collagen and elastin production.

    With the Dp4, experience the ultimate in skin transformation, where cutting-edge innovation meets clinical efficacy. Embrace the future of beauty with Dermapen's trailblazing solution for a flawless complexion.`,
    benefits: [
      "Reduces fine lines and wrinkles",
      "Improves skin texture and firmness",
      "Minimizes acne scarring",
      "Promotes natural collagen production",
      "Minimal downtime"
    ],
    duration: "45-60 minutes",
    price: 249,
    imageMain: "/images/treatments/dp4.webp",
    imageSub: "/images/treatments/dp4-sub.webp",
    imageCard: "/images/treatments/dp4-card.webp",
    cards: [
      {
        title: "Advanced Microneedling",
        description: "The Dp4 microneedling pen is a revolutionary advanced microneedling system designed to provide you with the best possible results at a speed unlike any other. ​The Dp4 device glides over the skin, creating millions of fine fractional channels up to 104% faster than other microneedling devices. These channels can carry up to 80% more topical nutrients deeper into the skin."
      },
      {
        title: "Precise Control",
        description: "Dp4 generates millions of fine micro-channels with a 16-needle cartridge in an up and down motion, which allows you feel as comfortable as possible during your treatment with precision and safety."
      },
      {
        title: "Virtually Painless",
        description: "Traditional dermal-rolling techniques proved to be bloody and painful, requiring the application of topical anaesthetic cream before treatments. With Dp4, there’s no comparison. It’s the most comfortable, virtually pain-free microneedling treatment available. Just lay back and enjoy stunning results."
      },
      {
        title: "Proven Results",
        description: "Microneedling is clinically proven to treat face lines & wrinkles, acne & facial scars, aging & sun damage skin, pigmentation, enlarged pores, rosacea, body scars, stretch marks, and hair loss."
      }
    ]
  },
  {
    id: 3,
    name: "Tixel Skin Resurfacing",
    slug: "tixel",
    bookingCategory: "tixel",
    description: "Tixel skin resurfacing is a \"thermo-mechanical ablative treatment\" which uses heat on your skin to create controlled damage that stimulates your body to produce collagen and rejuvenate the skin.",
    longDescription: `
Compared to some of the sophisticated sorts of technology on the market, which work off radiofrequency energy, or use focused ultrasound, or miniature lightning bolts of ‘plasma’ energy, Tixel is very straightforward.

​All Tixel uses is heat - nothing fancy. The main treatment head of the device is 1cm square, and packed into that space are 81 titanium rods with gently pointed ends; there’s also a smaller treatment head with 24 pins for getting into nooks and crannies. The titanium rods are heated up to 400 degrees C, then lightly touched onto the skin to create trauma in the skin to stimulate production of collagen and elastin fibres.`,
    benefits: [
      "Skin tightening and rejuvenation",
      "Reduced appearance of fine lines",
      "Improved skin texture",
      "Enhanced product absorption",
      "Minimal downtime"
    ],
    duration: "30-45 minutes",
    price: 299,
    imageMain: "/images/treatments/tixel.webp",
    imageSub: "/images/treatments/tixel-sub.webp",
    imageCard: "/images/treatments/tixel-card.webp",
    cards: [
      {
        title: "Thermal Technology",
        description: "Tixel skin resurfacing helps improve the texture and tone of your skin. Thermal energy stimulates collagen and elastin fibre production in the treated area to smooth out wrinkles and fine lines."
      },
      {
        title: "Versatile Treatment",
        description: "Tixel skin resurfacing is versatile, and has no trouble interacting with a wide variety of skin types. The device can be adjusted by our expert aestheticians to precisely and effectively treat any concern."
      },
      {
        title: "Minimal Downtime",
        description: "Tixel skin resurfacing requires minimal downtime due it's non-invasive nature, and patients can expect to experience minimal swelling after the treatment."
      },
      {
        title: "Affordable Treatment",
        description: "Tixel skin resurfacing is affordable compared to traditional laser resurfacing. If you want to achieve smoother skin without breaking the bank, Tixel skin resurfacing is perfect."
      }
    ]
  },
  {
    id: 4,
    name: "Bela MD+",
    slug: "bela-md",
    bookingCategory: "facial",
    description: "BELA MD+ Facials are the perfect solution to easy and accessible exfoliation. BELA MD+ combines medical-grade dermabrasion, serum infusion, microcurrent technology, and hydrogen water delivery, to create a perfectly tailored serum infusion to best suit your skin.",
    longDescription: `
    The Bela MD+ Advanced medical-grade facial is simple, fast, comfortable and effective. It’s made up of 6 distinct steps: a diamond-tip microdermabrasion, a hydrogen water infusion & antioxidant boost, an ultrasonic extraction, face and neck toning, a targeted serum infusion, and finally electroporation.

​Discover the transformative power of BELA MD’s skincare technology, designed to rejuvenate and enhance your skin’s natural beauty. The Aqua handpiece, equipped with diamond tips, performs a medical-grade exfoliation, revealing a smoother, brighter complexion and allowing deeper penetration of BELA MD's advanced serums. The innovative Hydrogen therapy module infuses hydrogen-rich water into the skin, reducing oxidative stress and promoting a radiant, hydrated look.

​The system features a closed-loop delivery with the Aqua handpiece, ensuring precise infusion of bio-infusion serums or hydrogen water, while the Ultrasonic Skin Scrubber employs ultrasonic vibrations to cleanse pores deeply. Experience a relaxing massage with the BELA MD Y Handpiece, which combines rotating massage balls and micro-current technology for a toned, lifted appearance. Lastly, our electroporation technique enhances serum absorption, ensuring that active ingredients reach the deeper layers of your skin for maximum efficacy.
    `,
    benefits: [
      "Deep exfoliation",
      "Enhanced product absorption",
      "Improved skin texture",
      "Customizable treatments",
      "No downtime"
    ],
    duration: "45-60 minutes",
    price: 179,
    imageMain: "/images/treatments/bela.webp",
    imageSub: "/images/treatments/bela-sub.webp",
    imageCard: "/images/treatments/bela-card.webp",
    cards: [
      {
        title: "Flexible Treatments",
        description: "BELA MD+ has the flexibility to meet the needs of anyone, with customizable treatment modalities and targeted serums that can address any skin concern."
      },
      {
        title: "Collagen Boost",
        description: "A BELA MD+ facial also stimulates blood flow to the surface of the skin which enhances elasticity, promotes muscle toning and stimulates collagen production. Using an antioxidant hydrogen water to hydrate and revitalize from beneath the surface, producing an anti-inflammatory effect and revitalizes the skin"
      },
      {
        title: "Tailored Treatments",
        description: "Each multi-functional BELA MD+ serum is designed to target common skin concerns, while providing an overall improvement in skin quality. We take your specific skin goals into account, and provide treatment options that are directly tailored to your skin."
      },
      {
        title: "Immediate Results",
        description: "This advanced medical-grade facial is fast, comfortable, and effective. The treatment is non-invasive and incurs no downtime at all, making it a perfect introduction to medical aesthetics."
      }
    ]
  },
  {
    id: 5,
    name: "Mesotherapy with Teosyal Redensity 1 + Vital Injector",
    shortName: "Mesotherapy",
    subtitle: "with Teosyal Redensity 1 + Vital Injector II",
    tagline: "Hydration, skin quality and rejuvenation from within.",
    slug: "mesotherapy",
    bookingCategoryId: "JD45JLMLL6XRE6TNMZECAYW5",
    description: "Mesotherapy with Teosyal Redensity 1 and the Vital Injector is an injectable skin booster treatment designed to improve skin hydration, texture, elasticity and overall skin quality. It helps create smoother, firmer, more radiant-looking skin without adding volume or changing your natural features.",
    longDescription: `
    Healthy-looking skin is about more than what we see on the surface. As we age, changes in hydration, collagen and elasticity can contribute to fine lines, uneven texture and skin that looks less firm and radiant.

    Mesotherapy with Teosyal Redensity 1 is an injectable skin booster treatment designed to improve hydration, texture, elasticity and overall skin quality. Rather than adding volume or changing facial contours, the focus is on supporting smoother, more supple and refreshed-looking skin.

    At Phace, we use the Vital Injector II, a precision-controlled injection device, to deliver small, measured amounts of Redensity 1 into the skin. It is an automated, vacuum-assisted device that delivers controlled micro-injections at a consistent, adjustable depth.

    Using gentle suction, the device temporarily lifts and stabilizes the skin while delivering measured amounts of Redensity 1 beneath the surface. This allows for precise, consistent product placement across the treatment area. The device is designed to make the injection process more efficient and comfortable, although temporary redness, swelling, bruising and tenderness are still possible.`,
    benefitsTitle: "WHAT IT CAN HELP WITH",
    benefits: [
      "Dehydrated or dull-looking skin",
      "Fine lines and early signs of aging",
      "Uneven or rough skin texture",
      "Reduced elasticity and firmness",
      "Crepey-looking skin"
    ],
    imageMain: "/images/treatments/mesotherapy.webp",
    imageSub: "/images/treatments/mesotherapy-sub.webp",
    imageCard: "/images/treatments/mesotherapy-card.webp",
    cards: [
      {
        title: "A Skin Booster",
        description: "An injectable treatment focused on improving hydration, texture, elasticity and overall skin quality for smoother, firmer, more radiant-looking skin."
      },
      {
        title: "Not a Filler",
        description: "Unlike traditional dermal fillers, Redensity 1 is not used to add volume or change facial contours. It works on the appearance and quality of the skin itself."
      },
      {
        title: "Precise Delivery",
        description: "The Vital Injector II delivers small, measured micro-injections at a consistent, adjustable depth for even product placement across the treatment area."
      },
      {
        title: "Face, Neck, Décolletage & Hands",
        description: "Treat skin quality concerns in several areas. Suitability and the amount of product depend on the area, your skin concerns and your treatment plan."
      }
    ],
    faqs: [
      {
        question: "What is Teosyal Redensity 1?",
        answer: [
          "Teosyal Redensity 1 is a skin booster formulated with non-cross-linked hyaluronic acid and a combination of amino acids, antioxidants, vitamins and minerals.",
          "Hyaluronic acid is naturally present in our skin and plays an important role in retaining moisture. Its ability to attract and bind water makes it particularly useful in treatments focused on hydration and skin quality.",
          "Unlike traditional dermal fillers, which are commonly used to restore volume or enhance facial contours, Redensity 1 is intended to improve the appearance and quality of the skin itself."
        ]
      },
      {
        question: "What areas can be treated?",
        answer: [
          "Mesotherapy can be used to address skin quality concerns in several areas, including the face, neck, décolletage and hands.",
          "Treatment suitability and the amount of product required will depend on the area being treated, your skin concerns and your individual treatment plan."
        ]
      },
      {
        question: "What can I expect during treatment?",
        answer: [
          "We begin by assessing your skin, discussing your concerns and determining whether mesotherapy is an appropriate option for you.",
          "A topical numbing cream may be applied before treatment to help minimize discomfort.",
          "Using the Vital Injector II, small amounts of Teosyal Redensity 1 are delivered through a series of micro-injections across the selected treatment area.",
          "You may experience temporary redness, small raised bumps, swelling or bruising following your appointment. These effects generally improve as the skin settles, although recovery varies from person to person."
        ]
      },
      {
        question: "How many treatments will I need?",
        answer: [
          "For most clients, we recommend an initial series of three treatments, spaced approximately three to four weeks apart.",
          "Some individuals may benefit from a different treatment schedule depending on their skin concerns, goals and response.",
          "Because skin quality improvements are gradual and cumulative, a series of treatments is generally recommended rather than expecting a dramatic change after one appointment.",
          "Maintenance treatments may be recommended every four to six months, depending on your individual results and how your skin responds."
        ]
      },
      {
        question: "How long do results last?",
        answer: [
          "Results vary depending on factors such as age, skin condition, lifestyle and the number of treatments completed.",
          "Improvements in hydration and skin appearance may develop progressively throughout your treatment series. Maintenance appointments can help support those results over time.",
          "As with any skin treatment, results are individual, and no specific outcome or duration can be guaranteed."
        ]
      },
      {
        question: "Is mesotherapy right for me?",
        answer: [
          "If your skin is feeling dehydrated, looking dull or beginning to show changes in texture and elasticity, mesotherapy may be worth exploring.",
          "At Phace, we're not interested in changing what makes your face yours. Our goal is to help you feel confident in your skin through thoughtful treatment recommendations, realistic expectations and an approach grounded in skin health.",
          "Curious whether Mesotherapy with Teosyal Redensity 1 is right for you? Get in touch with Phace to learn more or arrange a consultation."
        ]
      }
    ]
  },
  ];
