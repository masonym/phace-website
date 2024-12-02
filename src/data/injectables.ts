interface InjectableService {
  title: string;
  image: string;
  whatIs: {
    question: string;
    content: string[];
  };
  howWorks: {
    question: string;
    content: string[];
  };
  description: string[];
}

export const injectableServices: InjectableService[] = [
  {
    title: "Neuromodulators",
    image: "/images/injectables/neuromodulators.webp",
    whatIs: {
      question: "What are neuromodulator injections?",
      content: [
        "Neuromodulator injections are minimally-invasive procedures designed to temporarily relax certain muscles.",
        "They primarily target dynamic wrinkles—the lines and creases in your face that form due to repetitive movements like frowning, squinting, and smiling.",
        "These injections work by interrupting the signal between the nerve and the muscle, causing the muscle to relax.",
        "The most well-known neuromodulators include Botox, Dysport, Jeuveau, and Xeomin.",
        "Their effects typically last from 3 to 4 months"
      ]
    },
    howWorks: {
      question: "How do neuromodulator injections work?",
      content: [
        "These weaken the contraction of muscles that lead to wrinkles. By relaxing the muscles responsible for dynamic wrinkles, neuromodulators smooth out lines and create a refreshed appearance."
      ]
    },
    description: [
      "Neuromodulator injections are minimally-invasive procedures designed to temporarily relax certain muscles.",
      "They primarily target dynamic wrinkles—the lines and creases in your face that form due to repetitive movements like frowning, squinting, and smiling.",
      "These injections work by interrupting the signal between the nerve and the muscle, causing the muscle to relax.",
      "The most well-known neuromodulators include Botox, Dysport, Jeuveau, and Xeomin.",
      "Their effects typically last from 3 to 4 months",
      "These weaken the contraction of muscles that lead to wrinkles. By relaxing the muscles responsible for dynamic wrinkles, neuromodulators smooth out lines and create a refreshed appearance."
    ]
  },
  {
    title: "Dermal Fillers",
    image: "/images/injectables/dermal-fillers.webp",
    whatIs: {
      question: "What are dermal fillers?",
      content: [
        "Dermal fillers are injections that plump up wrinkles and smooth lines on your face.",
        "They are commonly used to reduce signs of aging, minimize skin depressions, and address fine lines and deep wrinkles.",
        "These fillers can restore volume and enhance facial features, providing a more youthful appearance. The procedure is non-surgical, quick, and typically produces immediate results.",
        "Depending on the type of filler used, the effects can last from months to years"
      ]
    },
    howWorks: {
      question: "How do dermal fillers work?",
      content: [
        "Dermal fillers come in various forms, including hyaluronic acid (HA), calcium hydroxylapatite (Radiesse), poly-L-lactic acid (Sculptra), and more. These substances are injected just beneath the skin to add volume or reduce wrinkles. Common treatment areas include around the eyes, mouth, nose, cheeks, jawline, and chin."
      ]
    },
    description: [
      "Dermal fillers are injections that plump up wrinkles and smooth lines on your face.",
      "They are commonly used to reduce signs of aging, minimize skin depressions, and address fine lines and deep wrinkles.",
      "These fillers can restore volume and enhance facial features, providing a more youthful appearance. The procedure is non-surgical, quick, and typically produces immediate results.",
      "Depending on the type of filler used, the effects can last from months to years",
      "Dermal fillers come in various forms, including hyaluronic acid (HA), calcium hydroxylapatite (Radiesse), poly-L-lactic acid (Sculptra), and more. These substances are injected just beneath the skin to add volume or reduce wrinkles. Common treatment areas include around the eyes, mouth, nose, cheeks, jawline, and chin."
    ]
  },
  {
    title: "Platelet-rich plasma",
    image: "/images/injectables/prp.webp",
    whatIs: {
      question: "What are platelet-rich plasma (PRP) injections?",
      content: [
        "Platelet-rich plasma (PRP) therapy is an innovative treatment that harnesses the natural healing power of a patient's own blood to promote tissue repair and rejuvenation. The process begins with a simple blood draw from the patient.",
        "Once collected, the blood is spun in a centrifuge to separate its components. The middle layer, known as the \"buffy coat,\" contains concentrated platelets and growth factors. These platelets play a crucial role in clotting and tissue repair. PRP injections are particularly effective for addressing skin concerns, such as fine lines, wrinkles, and volume loss.",
        "By injecting PRP into targeted areas, we stimulate collagen production, enhance skin texture, and improve overall complexion."
      ]
    },
    howWorks: {
      question: "How do platelet-rich plasma injections work?",
      content: [
        "After creating platelet-rich plasma from the patient's blood, we inject it into specific areas of concern.",
        "The growth factors released by platelets promote cellular repair, increase blood flow, and reduce inflammation. PRP treatments are safe because they use the patient's own tissues, minimizing the risk of allergic reactions.",
        "While results vary, patients typically notice improvements in skin texture, volume, and overall appearance within several weeks to months after treatment."
      ]
    },
    description: [
      "Platelet-rich plasma (PRP) therapy is an innovative treatment that harnesses the natural healing power of a patient's own blood to promote tissue repair and rejuvenation. The process begins with a simple blood draw from the patient.",
      "Once collected, the blood is spun in a centrifuge to separate its components. The middle layer, known as the \"buffy coat,\" contains concentrated platelets and growth factors. These platelets play a crucial role in clotting and tissue repair. PRP injections are particularly effective for addressing skin concerns, such as fine lines, wrinkles, and volume loss.",
      "By injecting PRP into targeted areas, we stimulate collagen production, enhance skin texture, and improve overall complexion.",
      "After creating platelet-rich plasma from the patient's blood, we inject it into specific areas of concern.",
      "The growth factors released by platelets promote cellular repair, increase blood flow, and reduce inflammation. PRP treatments are safe because they use the patient's own tissues, minimizing the risk of allergic reactions.",
      "While results vary, patients typically notice improvements in skin texture, volume, and overall appearance within several weeks to months after treatment."
    ]
  }
];
