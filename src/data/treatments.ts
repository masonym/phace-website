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
    description: "Sharplight is a singular technology aesthetic device powered by their flagship DPC technology which lets us treat a variety of indications such as skin rejuvenation, pigmented and vascular lesions, hair removal and acne.",
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
    description: "The Dermapen 4 is the world's most advanced microneedling technology, designed to improve skin texture, reduce scarring, and promote natural collagen production.",
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
    description: "Tixel is a revolutionary thermal fractional skin rejuvenation technology that uses heat to create micro-channels in the skin, promoting collagen production and skin renewal.",
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
    description: "Bela MD+ is an advanced skin health platform that combines diamond microdermabrasion, electroporation, and LED therapy for comprehensive skin rejuvenation.",
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
    id: 8,
    name: "Brow Lamination",
    slug: "brow-lamination",
    description: "A revolutionary beauty treatment designed to give your eyebrows a fuller, more defined look without the need for daily maintenance.",
    longDescription: `Brow lamination is a revolutionary beauty treatment designed to give your eyebrows a fuller, more defined look without the need for daily maintenance.

    During the procedure, your brow hairs are carefully brushed and set in place using a specialized chemical solution. This solution helps to relax the hair follicles, allowing the technician to reshape and style your brows to perfection.
    
    The result? Brows that appear thicker, fluffier, and beautifully groomed, with a sleek and uniform appearance that lasts for weeks.
    
    Whether you have sparse brows that need a boost or unruly hairs that need taming, brow lamination is the answer for achieving effortlessly flawless brows with minimal effort.`,
    imageMain: "/images/treatments/brow-lamination-main.jpg",
    imageSub: "/images/treatments/brow-lamination-sub.jpg",
    imageCard: "/images/treatments/brow-lamination-card.jpg"
  },
  {
    id: 9,
    name: "Brow Waxing",
    slug: "brow-waxing",
    description: "A popular grooming technique that involves the removal of unwanted hair from the eyebrow area using a gentle wax formula.",
    longDescription: `Brow waxing is a popular grooming technique that involves the removal of unwanted hair from the eyebrow area using a gentle wax formula.

    During the process, a thin layer of warm wax is applied to the desired areas of the brows, following the natural shape and contours. Once applied, a cloth or paper strip is pressed onto the wax and quickly pulled away, removing the hair from the root. This method ensures a clean and precise result, leaving behind smooth and well-defined brows.
    
    Brow waxing is an effective way to shape and sculpt the eyebrows, creating a polished and symmetrical appearance. With minimal discomfort and long-lasting results, brow waxing is the go-to solution for achieving perfectly groomed brows that frame the face beautifully.`,
    imageMain: "/images/treatments/brow-waxing-main.jpg",
    imageSub: "/images/treatments/brow-waxing-sub.jpg",
    imageCard: "/images/treatments/brow-waxing-card.jpg"
  },
  {
    id: 10,
    name: "Lash Lift",
    slug: "lash-lift",
    description: "A revolutionary cosmetic procedure designed to enhance the natural beauty of your lashes.",
    longDescription: `A lash lift is a revolutionary cosmetic procedure designed to enhance the natural beauty of your lashes.

    Using a specially formulated solution, our skilled technicians carefully lift and curl your lashes from the root, creating a stunning, wide-eyed effect that lasts for weeks.
    
    Unlike traditional lash extensions, a lash lift works with your existing lashes, providing a more natural yet equally dramatic result. With no need for mascara or curlers, you'll wake up each morning with perfectly curled lashes.
    
    The process is quick, painless, and safe, making it the perfect solution for those seeking low-maintenance, high-impact beauty.`,
    imageMain: "/images/treatments/lash-lift-main.jpg",
    imageSub: "/images/treatments/lash-lift-sub.jpg",
    imageCard: "/images/treatments/lash-lift-card.jpg"
  },
  {
    id: 11,
    name: "Lash Tint",
    slug: "lash-tint",
    description: "A cosmetic procedure designed to enhance the appearance of your eyelashes by darkening them.",
    longDescription: `A lash tint is a cosmetic procedure designed to enhance the appearance of your eyelashes by darkening them.

    During the treatment, a specially formulated dye is carefully applied to your lashes, giving them a darker, more defined look. This can be particularly beneficial for individuals with fair or light-colored lashes who desire a more dramatic and noticeable eyelash appearance without the need for mascara.
    
    The process is quick, typically taking about 15-20 minutes, and the results can last for several weeks. It's a perfect solution for those who want to wake up with naturally dark, defined lashes without the need for daily makeup application.`,
    imageMain: "/images/treatments/lash-tint-main.jpg",
    imageSub: "/images/treatments/lash-tint-sub.jpg",
    imageCard: "/images/treatments/lash-tint-card.jpg"
  },
  {
    id: 12,
    name: "Lash Extension",
    slug: "lash-extension",
    description: "A cosmetic enhancement where individual synthetic fibers are applied to your natural eyelashes, creating a fuller, longer, and more defined appearance.",
    longDescription: `Lash extensions are a cosmetic enhancement where individual synthetic fibers are applied to your natural eyelashes, creating a fuller, longer, and more defined appearance.

    The process involves meticulously bonding each extension to a single natural lash, resulting in a seamless, natural look.
    
    Clients can choose from various lengths, thicknesses, and styles to customize their desired outcome, whether it's a subtle boost of volume or a dramatic, eye-catching look.
    
    Lash extensions typically last for several weeks with proper care and maintenance, offering a low-maintenance solution for effortlessly beautiful lashes around the clock.`,
    imageMain: "/images/treatments/lash-extension-main.jpg",
    imageSub: "/images/treatments/lash-extension-sub.jpg",
    imageCard: "/images/treatments/lash-extension-card.jpg"
  },
  {
    id: 13,
    name: "Gel Nails",
    slug: "gel-nails",
    description: "A type of artificial nail extension that involves applying a gel polish to the natural nails to create a durable and long-lasting manicure.",
    longDescription: `Gel nails are a type of artificial nail extension that involves applying a gel polish to the natural nails to create a durable and long-lasting manicure.

    The gel polish is usually applied in layers and then cured under a UV or LED lamp to harden and bond to the nails.
    
    Gel nails are known for their glossy finish, flexibility, and resistance to chipping. They can be shaped and styled according to the individual's preference and can last for several weeks without losing their shine.
    
    Gel nails are popular for their natural look and ability to strengthen and protect the natural nails underneath.`,
    imageMain: "/images/treatments/gel-nails-main.jpg",
    imageSub: "/images/treatments/gel-nails-sub.jpg",
    imageCard: "/images/treatments/gel-nails-card.jpg"
  }
];
