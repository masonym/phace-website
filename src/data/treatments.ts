export interface Treatment {
  id: number;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
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
}

export const treatments: Treatment[] = [
  {
    id: 1,
    name: "Sharplight Technology",
    slug: "sharplight",
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
        title: "Results Tailed to Your Needs",
        description: "Sharplight's proprietary Dynamic Pulse Control technology allows us to automatically configure laser treatments to guarantee the best outcomes for your unique needs."
      }
    ]
  },
  {
    id: 2,
    name: "Dermapen DP4",
    slug: "dermapen-dp4",
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
  ];
