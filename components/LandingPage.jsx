import { Link } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth";

/* ---------- Small building blocks ---------- */

export function ChefLogo({ size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-brand-600"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 4C13.5 4 11.5 5.5 10.5 7.5C9.5 7 8 7 7 8C5.5 9.5 5.5 12 6.5 13.5C5 14.5 4 16.5 4 19C4 22.3 6.7 25 10 25H22C25.3 25 28 22.3 28 19C28 16.5 27 14.5 25.5 13.5C26.5 12 26.5 9.5 25 8C24 7 22.5 7 21.5 7.5C20.5 5.5 18.5 4 16 4Z"
          stroke="#D3451B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 21C13.5 22.5 18.5 22.5 20 21" stroke="#D3451B" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 12V16M14 14H18" stroke="#E4572E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function BrandMark({ compact = false }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2.5 font-bold tracking-tight text-warm-900 ${
        compact ? "text-xl" : "text-2xl"
      }`}
    >
      <ChefLogo size={compact ? 32 : 40} />
      <span>
        Chef<span className="text-brand-600">Claude</span>
      </span>
    </Link>
  );
}

function CheckBullet() {
  return (
    <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

const FEATURES = [
  {
    title: "AI-Powered Recipes",
    body: "Get unique recipes from your ingredients",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Save Favorites",
    body: "Keep your best recipes in one place",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Plan Your Meals",
    body: "Create and manage weekly meal plans",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Smart Shopping Lists",
    body: "Automatically generate ingredient lists",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const STEPS = [
  { n: 1, emoji: "🥗", title: "Add Ingredients", body: "Enter the ingredients you have or a dish name you want to cook." },
  { n: 2, emoji: "🤖", title: "AI Generates Recipe", body: "Our AI creates a personalized recipe with detailed instructions." },
  { n: 3, emoji: "📑", title: "Save & Organize", body: "Save your favorite recipes and organize them easily." },
  { n: 4, emoji: "🛒", title: "Plan & Shop", body: "Create meal plans and generate shopping lists automatically." },
];

const SHOWCASE = [
  {
    title: "Creamy Garlic Pasta",
    difficulty: "Easy",
    time: "25 mins",
    servings: "4 servings",
    ingredients: "6 ingredients needed",
    body: "A rich pasta with toasted garlic, parmesan cream, and fresh garden herbs for quick weeknights.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHbtKV1_lFnX-o5f6dkstTbaaXos8Xv3s3pMMhQcfvK17ozAFTSwrQTyGGdE-si0sSMN0pghSu1ZHzkoNBtxb0BF-g58Pyqb4m3B1ONEj5r17sFMfFRSvpA9lkVhBeGVFdWpjz--iICiokg-Dwa7IHy782tYNwBXf0XR-0V8Ew3VLAMRqqj_96dLp2KldAL0Bm9opfl45go3dZhzEB5jgLqCSi2m8NQo0NDHKREfmQNDNc3CGDk-JA",
  },
  {
    title: "Paneer Butter Masala",
    difficulty: "Medium",
    time: "40 mins",
    servings: "3 servings",
    ingredients: "8 ingredients needed",
    body: "Silky aromatic tomato gravy infused with cashews, fenugreek, and soft cottage cheese cubes.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDblJHbGGsJI-HVh18WEivumy-6_Qql3tqw4egSzZYwdhOJeILkp_uBUzuVrPTu581ZCc0QM3PTrxxk14gsAIV9Yfsau8SeH94f9XyiovpumH6ZcQqS2qpq4gGpAjpbyMylAU0Yuni-VsrDot1c2GHhMDdWbEPzAR6mjXZZOWDwQ3Jbw8uDrLOGVhU9FC1-ZR7a8abozdUzcwIq9EEaKxPM959bNVIUB8B2Y3APdQBt7lr58MMmxEv8",
  },
  {
    title: "Vegetable Fried Rice",
    difficulty: "Easy",
    time: "20 mins",
    servings: "2 servings",
    ingredients: "5 ingredients needed",
    body: "Crisp stir-fried seasonal vegetables and jasmine rice tossed with fragrant sesame soy reduction.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxo_htlxmcTWH2M6J8ZHKU0ToTgAZyKNYeMI0Fsgo341Vo-GTUpZP1U45tqNlbFd7Dy90BJrGCFfBX1b8fb7GdlKS4g8B6ELDPbwH_OLZ6xxdI7_QUvJAsvrOp1mrEK4HMSdTE6Y-6YsWPKVfEY-Vfut-UG6HGW7yDoUASww0cD6Oxxt5gfo_kyZ5W5KEpvKs5HPgG1HTkNyKKgE8LixVSDbMEcEey3EAcL00WsxMdDc5vUCPO6KkR",
  },
];

/* ---------- Page ---------- */

export default function LandingPage() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";
  const primaryTarget = isAuthenticated ? "/" : "/register";
  const primaryLabel = isAuthenticated ? "Open Chef Claude" : "Get Started Free";

  return (
    <div className="min-h-screen bg-white text-warm-900 antialiased selection:bg-brand-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <BrandMark />

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-warm-600">
            <a className="text-brand-600 font-semibold border-b-2 border-brand-600 pb-1" href="#home">Home</a>
            <a className="hover:text-brand-600 transition-colors" href="#features">Features</a>
            <a className="hover:text-brand-600 transition-colors" href="#how-it-works">How it Works</a>
            <a className="hover:text-brand-600 transition-colors" href="#recipes">Recipes</a>
            <a className="hover:text-brand-600 transition-colors" href="#about">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-sm"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-brand-600 text-brand-600 hover:bg-brand-50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="home" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col items-start z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-xs font-semibold uppercase tracking-wide mb-6">
                  <svg className="w-4 h-4 fill-brand-600" viewBox="0 0 24 24">
                    <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                  </svg>
                  AI-Powered Recipe Generator
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-warm-900 tracking-tight leading-[1.15] mb-5">
                  Turn Your Ingredients Into{" "}
                  <span className="text-brand-600">Delicious Recipes</span>
                </h1>

                <p className="text-base sm:text-lg text-warm-600 leading-relaxed mb-8 max-w-lg">
                  ChefClaude uses AI to create personalized, step-by-step recipes from the ingredients you have.
                  Save your favorites, plan meals, and generate shopping lists — all in one place.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto">
                  <Link
                    to={primaryTarget}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {primaryLabel}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-base font-semibold border border-warm-200 text-warm-900 hover:bg-brand-50 hover:border-brand-200 transition-all bg-white"
                  >
                    <svg className="w-4 h-4 text-brand-600 fill-brand-600" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    See How It Works
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-warm-900">
                  <div className="flex items-center gap-2">
                    <CheckBullet />
                    Free to use
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckBullet />
                    AI-powered
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckBullet />
                    Save your recipes
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 relative flex justify-center items-center">
                <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-warm-200 bg-warm-50/50">
                  <img
                    alt="Chef Claude — recipe preview"
                    className="w-full h-auto object-cover object-center hover:scale-[1.01] transition-transform duration-500"
                    src="./landingPage.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section id="features" className="bg-brand-50 border-y border-brand-200 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-brand-200">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-center gap-4 px-2 lg:px-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-brand-200">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 text-base">{feature.title}</h4>
                    <p className="text-xs sm:text-sm text-warm-600 mt-0.5">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-warm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3 block">
              Simple &amp; Easy
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-warm-900 tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-warm-600 max-w-2xl mx-auto mb-16">
              Get from ingredients to a delicious recipe in just a few simple steps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch relative">
              {STEPS.map((step, index) => (
                <div
                  key={step.n}
                  className="relative bg-white rounded-2xl p-6 border border-warm-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
                >
                  <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold text-sm flex items-center justify-center self-start mb-4">
                    {step.n}
                  </span>
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-6 text-3xl">
                    {step.emoji}
                  </div>
                  <h3 className="text-lg font-bold text-warm-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-warm-600 leading-relaxed">{step.body}</p>
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-brand-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recipe showcase */}
        <section id="recipes" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2 block">
                Instant Inspiration
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-warm-900 tracking-tight mb-4">
                What Will You Cook Today?
              </h2>
              <p className="text-warm-600 text-base">
                Find inspiration for your next homemade meal or let our smart chef craft custom dishes right now.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {SHOWCASE.map((recipe) => (
                <div
                  key={recipe.title}
                  className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-subtle hover:shadow-lg transition-all flex flex-col group"
                >
                  <div className="h-52 bg-warm-100 overflow-hidden relative">
                    <img
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={recipe.img}
                    />
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-brand-600 px-3 py-1 rounded-full text-xs font-bold">
                      {recipe.difficulty}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-xs text-warm-600 mb-2 font-medium">
                        <span>⏱ {recipe.time}</span>
                        <span>•</span>
                        <span>👥 {recipe.servings}</span>
                      </div>
                      <h3 className="text-xl font-bold text-warm-900 mb-2 group-hover:text-brand-600 transition-colors">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-warm-600 leading-relaxed">{recipe.body}</p>
                    </div>
                    <div className="pt-6 mt-6 border-t border-warm-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-600">{recipe.ingredients}</span>
                      <Link
                        to={primaryTarget}
                        className="text-brand-600 font-bold text-sm group-hover:translate-x-1 transition-transform"
                      >
                        Cook Now →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                to={primaryTarget}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-all border border-brand-200"
              >
                Create Your Own Recipe →
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="about" className="py-20 lg:py-28 bg-warm-50 border-t border-warm-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-6 relative">
                <div className="rounded-3xl overflow-hidden shadow-xl border border-warm-200">
                  <img
                    alt="Home cook preparing fresh produce"
                    className="w-full h-[420px] object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnRhC7wekptFnvORO557OrixibejvM0VnqyPIL3KHy3HgDT_ieo4umeogq99aDm2RlB1DW8SLsSIKxVXr2QxktsVrg2oJPfH15kOwVo1H2mo6GBIEFls41nu9C2pJ_T8hBlodG-ZXQjLpLnxkXM7Cq-ZeXIWwv3GUr6DbUb2BkNqwwOvwucur8Bmrr_dc9S3qtCNVOqwIRbXBpz_ns6ndn70jG2Oz2CIgIM_6eiMoScrobpfv0rF5W"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-card-float border border-warm-200 hidden sm:block">
                  <p className="text-2xl font-extrabold text-brand-600">0%</p>
                  <p className="text-xs font-semibold text-warm-600">Food Waste Goal</p>
                </div>
              </div>

              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2 block">
                  Your Kitchen, Reimagined
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-warm-900 tracking-tight mb-4 leading-tight">
                  Less Guesswork. More Delicious Meals.
                </h2>
                <p className="text-base text-warm-600 mb-8 leading-relaxed">
                  Chef Claude helps you make the most of what you have, keep recipes organized, and turn meal
                  planning into a simpler everyday routine.
                </p>

                <div className="space-y-6 mb-8">
                  {[
                    {
                      title: "Cook with what you have",
                      body: "Eliminate food waste by turning pantry staples into gourmet dinners without emergency supermarket runs.",
                    },
                    {
                      title: "Keep your favorite recipes close",
                      body: "Never lose that one dish you loved again. Organize culinary discoveries into clean, shareable digital cookbooks.",
                    },
                    {
                      title: "Make grocery shopping more organized",
                      body: "Auto-compiled lists sorted by produce department make weekly shopping rapid and predictable.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-warm-900 text-base">{item.title}</h4>
                        <p className="text-sm text-warm-600 mt-1 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to={primaryTarget}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-all"
                >
                  Start Cooking Smarter →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-16 sm:py-20 bg-brand-600 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-700 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Your Next Favorite Recipe Starts Here.
            </h2>
            <p className="text-brand-100 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
              Bring your ingredients. Discover something delicious. Join thousands of enthusiastic home cooks
              cooking smarter every day.
            </p>
            <Link
              to={primaryTarget}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-base font-bold bg-white text-brand-600 hover:bg-brand-50 hover:shadow-xl transition-all shadow-lg"
            >
              {primaryLabel} →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-warm-200 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-warm-200">
            <div className="flex items-center gap-2.5">
              <ChefLogo size={32} />
              <span className="text-xl font-bold tracking-tight text-warm-900">
                Chef<span className="text-brand-600">Claude</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-warm-600">
              <a className="hover:text-brand-600 transition-colors" href="#home">Home</a>
              <a className="hover:text-brand-600 transition-colors" href="#features">Features</a>
              <a className="hover:text-brand-600 transition-colors" href="#how-it-works">How it Works</a>
              <a className="hover:text-brand-600 transition-colors" href="#recipes">Recipes</a>
              <Link className="hover:text-brand-600 transition-colors" to="/login">Login</Link>
              <Link className="hover:text-brand-600 transition-colors" to="/register">Sign Up</Link>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-warm-600">
            <p>AI-powered recipes, meal planning, and smarter shopping for your everyday kitchen.</p>
            <p>© 2026 Chef Claude. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}