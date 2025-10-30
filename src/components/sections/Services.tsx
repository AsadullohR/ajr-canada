import React from 'react';

const services = [
  {
    title: 'Marriage Services',
    image: 'https://plus.unsplash.com/premium_photo-1673716788461-0aa43e5d2015?w=400&h=250&fit=crop&q=80',
    description: 'Our marriage services include Nikah ceremonies, marriage counseling, and marriage registration. We provide comprehensive support for couples starting their journey together in accordance with Islamic principles.',
    features: [
      'Nikah Ceremony',
      'Pre-marriage Counseling',
      'Marriage Documentation',
      'Islamic Marriage Certificate'
    ]
  },
  {
    title: 'Funeral Services',
    image: 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=400&h=250&fit=crop&q=80',
    description: 'We provide complete Islamic funeral services with respect and dignity. Our team assists families during difficult times with funeral arrangements, burial services, and necessary religious rites.',
    features: [
      'Ghusl Preparation',
      'Janazah Prayer',
      'Burial Arrangements',
      'Family Support'
    ]
  },
  {
    title: 'Community Services',
    image: '/images/community.jpg',
    description: "We offer various community services to support and strengthen our Muslim community. From social support to educational programs, we're here to help our community thrive.",
    features: [
      'Food Bank',
      'Youth Mentorship',
      'Senior Support',
      'New Muslim Support'
    ]
  }
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Supporting our community through life's important moments with comprehensive Islamic services.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="card overflow-hidden flex flex-col transform md:hover:scale-105 transition-transform duration-300">
              <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover object-top"
                  style={{ objectPosition: '50% 20%' }}
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-3 mt-auto">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="mt-8 btn btn-primary w-full justify-center"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}