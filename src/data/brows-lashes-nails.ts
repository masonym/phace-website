interface Service {
  title: string;
  description: string;
  process?: string;
  benefits?: string;
  image: string;
}

export const browServices: Service[] = [
  {
    title: "Brow Lamination",
    description: "A revolutionary beauty treatment designed to give your eyebrows a fuller, more defined look without the need for daily maintenance.",
    process: "During the procedure, your brow hairs are carefully brushed and set in place using a specialized chemical solution. This solution helps to relax the hair follicles, allowing the technician to reshape and style your brows to perfection.",
    benefits: "The result? Brows that appear thicker, fluffier, and beautifully groomed, with a sleek and uniform appearance that lasts for weeks.",
    image: "/images/brows-lashes-nails/brow-lamination.webp"
  },
  {
    title: "Brow Waxing",
    description: "A popular grooming technique that involves the removal of unwanted hair from the eyebrow area using a gentle wax formula.",
    process: "During the process, a thin layer of warm wax is applied to the desired areas of the brows, following the natural shape and contours. Once applied, a cloth or paper strip is pressed onto the wax and quickly pulled away, removing the hair from the root. This method ensures a clean and precise result, leaving behind smooth and well-defined brows.",
    benefits: "Brow waxing is an effective way to shape and sculpt the eyebrows, creating a polished and symmetrical appearance. With minimal discomfort and long-lasting results, brow waxing is the go-to solution for achieving perfectly groomed brows that frame the face beautifully.",
    image: "/images/brows-lashes-nails/brow-waxing.webp"
  }
];

export const lashServices: Service[] = [
  {
    title: "Lash Lift",
    description: "A revolutionary cosmetic procedure designed to enhance the natural beauty of your lashes.",
    process: "Using a specially formulated solution, our skilled technicians carefully lift and curl your lashes from the root, creating a stunning, wide-eyed effect that lasts for weeks.",
    benefits: "Unlike traditional lash extensions, a lash lift works with your existing lashes, providing a more natural yet equally dramatic result. With no need for mascara or curlers, you'll wake up each morning with perfectly curled lashes.",
    image: "/images/brows-lashes-nails/lash-lift.webp"
  },
  {
    title: "Lash Tint",
    description: "A cosmetic procedure designed to enhance the appearance of your eyelashes by darkening them.",
    process: "During the treatment, a specially formulated dye is carefully applied to your lashes, giving them a darker, more defined look. This can be particularly beneficial for individuals with fair or light-colored lashes who desire a more dramatic and noticeable eyelash appearance without the need for mascara.",
    benefits: "The process is quick, typically taking about 15-20 minutes, and the results can last for several weeks. It's a perfect solution for those who want to wake up with naturally dark, defined lashes without the need for daily makeup application.",
    image: "/images/brows-lashes-nails/lash-tint.webp"
  },
  {
    title: "Lash Extension",
    description: "A cosmetic enhancement where individual synthetic fibers are applied to your natural eyelashes, creating a fuller, longer, and more defined appearance.",
    process: "The process involves meticulously bonding each extension to a single natural lash, resulting in a seamless, natural look.",
    benefits: "Clients can choose from various lengths, thicknesses, and styles to customize their desired outcome, whether it's a subtle boost of volume or a dramatic, eye-catching look. Lash extensions typically last for several weeks with proper care and maintenance, offering a low-maintenance solution for effortlessly beautiful lashes around the clock.",
    image: "/images/brows-lashes-nails/lash-extension.webp"
  }
];

export const nailServices: Service[] = [
  {
    title: "Gel Nails",
    description: "A type of artificial nail extension that involves applying a gel polish to the natural nails to create a durable and long-lasting manicure.",
    process: "The gel polish is usually applied in layers and then cured under a UV or LED lamp to harden and bond to the nails.",
    benefits: "Gel nails are known for their glossy finish, flexibility, and resistance to chipping. They can be shaped and styled according to the individual's preference and can last for several weeks without losing their shine. Gel nails are popular for their natural look and ability to strengthen and protect the natural nails underneath.",
    image: "/images/brows-lashes-nails/gel-nails.webp"
  }
];
