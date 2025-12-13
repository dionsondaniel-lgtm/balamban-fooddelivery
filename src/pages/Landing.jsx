// src/pages/Landing.jsx
export default function Landing({ onShowLogin, onShowRegister }) {
  return (
    <div
      className="relative bg-cover bg-center h-screen"
      style={{ backgroundImage: "url(/dan.svg)" }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
        {/* Hero Text */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 animate-fadeInDown">
          FoodPapaDan
        </h1>
        <p className="text-xl md:text-2xl text-yellow-300 font-semibold animate-fadeInUp">
          Savor Every Bite, Delivered Lightning Fast!
        </p>
        <p className="text-lg md:text-xl text-white/90 animate-fadeInUp delay-200">
          Hot meals. Happy hearts. Right to your doorstep.
        </p>

        {/* Buttons */}
        <div className="flex gap-6 mt-8 animate-fadeInUp delay-400">
          <button
            onClick={onShowLogin}
            className="px-8 py-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 text-white font-semibold text-lg shadow-lg hover:bg-white/50 hover:scale-105 transition-all duration-300"
          >
            Login
          </button>
          <button
            onClick={onShowRegister}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all duration-300"
          >
            Register
          </button>
        </div>

        {/* Optional tagline animation */}
        <p className="mt-6 text-white/80 italic animate-bounce text-sm md:text-base">
          Bringing joy, one meal at a time 🍔🍕🥤
        </p>
      </div>

      {/* Animations (Tailwind) */}
      <style jsx>{`
        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 1s ease forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease forwards;
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
