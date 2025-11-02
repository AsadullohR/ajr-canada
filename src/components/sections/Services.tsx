import { motion } from 'framer-motion';

const services = [
  {
    title: 'Marriages',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80',
    description: 'Whether you\'re looking to book your officiant or rent our space, we\'re here to help! Our marriage services include Nikah ceremonies, marriage counseling, and marriage registration.',
    link: '#contact'
  },
  {
    title: 'Outreach',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80',
    description: 'Our beautiful Islamic faith is a gift to all of humanity - Muslims and Non-Muslims alike. We invest in bringing our community programs and services to new communities.',
    link: '#contact'
  },
  {
    title: 'Mental Health',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop&q=80',
    description: 'AJR Cares is home to our wellness and social services department. We offer counseling, hospital visitations, food bank services and many events & programs.',
    link: '#contact'
  },
  {
    title: 'Food Bank',
    image: '/images/community.jpg',
    description: 'Serving our community for many years, our Food Bank serves hundreds of families on a monthly basis. With rising inflation and need, this service fills a great need for many in our community.',
    link: '#contact'
  },
  {
    title: 'Funerals',
    image: 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=800&h=600&fit=crop&q=80',
    description: 'Losing a loved one is indeed a difficult test. At AJR Canada, we want to help alleviate the logistical burden that comes with funerals so you can focus on being there for your loved ones and taking care of yourself.',
    link: '#contact'
  },
  {
    title: 'Halal Certification',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop&q=80',
    description: 'Over 1 Million Muslims in Canada want the peace of mind that comes from knowing that the food they eat is halal. Our aim at AJR Canada is to make that a reality. Learn more about what we do and how your establishment can get certified!',
    link: '#contact'
  },
  {
    title: 'Speakers',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop&q=80',
    description: 'At AJR Canada, we want to help you serve your communities through the highest quality programming. We\'re excited to offer you a multitude of high caliber and professional speakers that you can book for your next event or initiative!',
    link: '#contact'
  }
];

export function Services() {
  return (
    <section id="services" className="py-20 bg-emerald-900">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6">
            Our Services
          </h1>
        </div>

        {/* Services Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative h-[400px] md:h-[450px] rounded-lg overflow-hidden cursor-pointer border border-gray-700/30"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Dark Overlay - reduces on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-800/75 to-gray-700/60 transition-all duration-500 group-hover:from-gray-900/60 group-hover:via-gray-800/40 group-hover:to-gray-700/20"></div>
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col p-6 md:p-8">
                  {/* Service Title - Always visible at bottom */}
                  <div className="mt-auto">
                    <h3 className="text-3xl md:text-4xl font-sans font-bold text-white mb-4 transition-all duration-300">
                      {service.title}
                    </h3>
                    
                    {/* Description - Hidden initially, appears on hover */}
                    <div className="overflow-hidden">
                      <p className="text-white text-base md:text-lg leading-relaxed opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 mb-6">
                        {service.description}
                      </p>
                    </div>

                    {/* Learn More Button - Hidden initially, appears on hover */}
                    <div className="overflow-hidden">
                      <motion.a
                        href={service.link}
                        className="group/button relative inline-flex items-center justify-center px-6 py-3 text-base md:px-8 md:py-4 md:text-lg font-semibold text-white bg-transparent border-2 border-emerald-500 rounded-lg overflow-hidden hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>Learn More</span>
                      </motion.a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}