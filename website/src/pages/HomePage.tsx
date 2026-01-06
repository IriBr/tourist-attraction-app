import { Camera, MapPin, Trophy, Star, Shield, Globe } from 'lucide-react';
import logo from '../assets/logo.png';
import screenLogin from '../assets/screen-login.png';
import screenMap from '../assets/screen-map.jpg';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background - App branded colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-teal-700" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920')] bg-cover bg-center opacity-10" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Wandr Logo" className="w-24 h-24 md:w-32 md:h-32 rounded-3xl shadow-2xl" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Explore the World.
            <br />
            <span className="text-teal-200">Collect Memories.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
            Discover amazing attractions, verify your visits with AI-powered photo recognition,
            and earn badges as you explore the globe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://apps.apple.com/app/wandr/id6757339449"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-lg px-8 py-4"
            >
              Download for iOS
            </a>
            <a href="#features" className="btn-secondary bg-white/10 border-white text-white hover:bg-white/20">
              Learn More
            </a>
          </div>

          {/* App preview - Two phones */}
          <div className="mt-16 relative">
            <div className="flex justify-center gap-4 md:gap-8">
              {/* Phone 1 - Login Screen */}
              <div className="relative w-44 md:w-56">
                <div className="bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl">
                  <div className="bg-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                    <img
                      src={screenLogin}
                      alt="Wandr Login Screen"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
              {/* Phone 2 - Map Screen */}
              <div className="relative w-44 md:w-56 mt-8">
                <div className="bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl">
                  <div className="bg-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                    <img
                      src={screenMap}
                      alt="Wandr Map Screen"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading">Everything You Need to Explore</h2>
          <p className="section-subheading">
            Wandr combines powerful features to make your travel experiences unforgettable
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: 'AI Photo Verification',
                description: 'Simply take a photo of any attraction and our AI instantly verifies your visit. No QR codes or check-ins needed.',
              },
              {
                icon: MapPin,
                title: 'Discover Nearby',
                description: 'Find amazing attractions near you with real-time proximity alerts. Never miss a must-see location again.',
              },
              {
                icon: Trophy,
                title: 'Earn Badges',
                description: 'Collect bronze, silver, gold, and platinum badges as you explore cities, countries, and continents.',
              },
              {
                icon: Globe,
                title: 'World Map',
                description: 'Track your progress on a beautiful interactive world map. See where you\'ve been and plan where to go next.',
              },
              {
                icon: Star,
                title: 'Reviews & Ratings',
                description: 'Share your experiences and read reviews from fellow travelers. Help others discover hidden gems.',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your data is encrypted and never shared. We respect your privacy and keep your travel history safe.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-subheading">
            Start exploring in three simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Download & Sign Up',
                description: 'Get the app from the App Store and create your free account in seconds.',
                image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
              },
              {
                step: '02',
                title: 'Visit & Capture',
                description: 'Explore attractions around the world and take a photo when you arrive.',
                image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400',
              },
              {
                step: '03',
                title: 'Earn & Share',
                description: 'Get verified, earn badges, and share your adventures with friends.',
                image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <span className="text-5xl font-bold text-amber-200">{item.step}</span>
                    <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-amber-500 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '7,500+', label: 'Attractions' },
              { value: '50+', label: 'Countries' },
              { value: '200+', label: 'Cities' },
              { value: '6', label: 'Continents' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-amber-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading">Loved by Travelers</h2>
          <p className="section-subheading">
            See what explorers around the world are saying
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally, an app that makes travel feel like an adventure again! The badge system keeps me motivated to explore more.",
                author: "Sarah M.",
                location: "New York, USA",
              },
              {
                quote: "The AI photo recognition is incredible. I just snap a picture and it instantly knows where I am. Magic!",
                author: "Marco L.",
                location: "Rome, Italy",
              },
              {
                quote: "I've discovered so many hidden gems I would have walked right past. The proximity alerts are a game-changer.",
                author: "Yuki T.",
                location: "Tokyo, Japan",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Exploring?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Download Wandr today and begin your journey to discover the world's most amazing places.
          </p>
          <a
            href="https://apps.apple.com/app/wandr/id6757339449"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="h-14"
            />
          </a>
        </div>
      </section>
    </div>
  );
}
