import Image from "next/image";

export default function InjectablesHero() {
  return (
    <section className="relative h-screen flex items-center justify-center bg-[#FFF5E6]">
      <div className="absolute inset-0">
        <Image
          src="/images/injectables/injectables-hero.webp"
          alt="Injectables"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light mb-6">
            Injectables
          </h1>
          <p className="text-xl md:text-2xl font-light">
            Learn about the top-notch injectable services administered by our experienced Naturopath Physician.
          </p>
        </div>
      </div>
    </section>
  );
}
