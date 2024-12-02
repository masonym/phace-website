export default function BrowsLashesNailsHero() {
  return (
    <section className="relative h-screen flex items-center justify-center bg-beige-100">
      <div className="absolute inset-0">
        <img
          src="/images/brows-lashes-nails/hero.jpg"
          alt="Brows, Lashes, and Nails"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-light mb-6">
          Brows, Lashes, and Nails
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Indulge in the ultimate beauty experience at Phace with our exquisite brow, lash, and nail services.
        </p>
      </div>
    </section>
  );
}
