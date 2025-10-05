import React from 'react';
import { Heart, Users, Flower } from 'lucide-react';

const services = [
  {
    title: 'Marriage Services',
    icon: Heart,
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
    icon: Flower,
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
    icon: Users,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Supporting our community through life's important moments with comprehensive Islamic services.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="card p-8 flex flex-col">
              <service.icon className="w-12 h-12 text-emerald-600 mb-6" />
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
          ))}
        </div>
      </div>
    </section>
  );
}