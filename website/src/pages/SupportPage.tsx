import { Mail, MessageCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'How does the AI photo verification work?',
    answer: 'When you take a photo of an attraction, our AI analyzes the image and compares it to our database of known attractions. It looks for distinctive features, architecture, and landmarks to verify your visit. The verification happens in seconds and works even without an internet connection once you\'re near the attraction.',
  },
  {
    question: 'How do I earn badges?',
    answer: 'Badges are earned by visiting attractions in a specific location. As you verify more visits in a city, country, or continent, you\'ll progress through bronze (25%), silver (50%), gold (75%), and platinum (100%) badge tiers. Visit your Progress screen to track your badge progress.',
  },
  {
    question: 'What\'s the difference between free and premium?',
    answer: 'Free users can verify up to 5 visits per day. Premium subscribers get unlimited verifications, access to exclusive features, and priority support. Premium is available as a monthly ($4.99) or annual ($47.90) subscription.',
  },
  {
    question: 'Can I use the app offline?',
    answer: 'You can browse attractions you\'ve previously viewed offline. However, visit verification and syncing new attractions requires an internet connection. We recommend downloading attraction data for your destination before traveling.',
  },
  {
    question: 'How do proximity notifications work?',
    answer: 'When enabled, the app uses your location to detect when you\'re near an attraction in our database. You\'ll receive a notification suggesting you visit and verify. You can customize notification settings in the app.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Settings > Account > Delete Account. This will permanently remove all your data including visits, badges, and reviews. This action cannot be undone.',
  },
  {
    question: 'My photo verification failed. What should I do?',
    answer: 'Make sure you\'re taking a clear photo of a distinctive part of the attraction. Avoid photos with too many people or obstructions. If the AI can\'t match with high confidence, you may be asked to confirm the attraction from suggestions.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'Subscriptions are managed through the App Store. Go to Settings > Apple ID > Subscriptions to manage or cancel your Wandr subscription. Cancellation takes effect at the end of your current billing period.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help?</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <a
            href="mailto:support@wandr-app.com"
            className="flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Support</h3>
              <p className="text-gray-600">support@wandr-app.com</p>
            </div>
          </a>

          <a
            href="mailto:feedback@wandr-app.com"
            className="flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
              <MessageCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Send Feedback</h3>
              <p className="text-gray-600">feedback@wandr-app.com</p>
            </div>
          </a>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="flex items-center mb-8">
            <HelpCircle className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still need help */}
        <div className="mt-16 text-center p-8 bg-gray-50 rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-4">
            Our support team typically responds within 24 hours.
          </p>
          <a
            href="mailto:support@wandr-app.com"
            className="btn-primary"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
