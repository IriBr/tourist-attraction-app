export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: January 5, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Wandr ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
              the security of your personal information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
              <li><strong>Profile Information:</strong> Optional profile photo and display name</li>
              <li><strong>Reviews and Content:</strong> Reviews, ratings, and photos you submit for attractions</li>
              <li><strong>Payment Information:</strong> When you subscribe to premium features, payment processing is handled securely by Stripe</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Location Data:</strong> With your permission, we collect your location to show nearby attractions and enable visit verification</li>
              <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
              <li><strong>Usage Data:</strong> How you interact with the app, features you use, and attractions you visit</li>
              <li><strong>Photos:</strong> Photos you take for visit verification are processed by our AI and not stored on our servers after verification</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>To provide and maintain the Wandr service</li>
              <li>To verify your visits to attractions using AI-powered photo recognition</li>
              <li>To show you nearby attractions and send proximity notifications</li>
              <li>To track your progress and award badges</li>
              <li>To process payments for premium subscriptions</li>
              <li>To send you important updates about your account</li>
              <li>To improve and optimize our services</li>
              <li>To respond to your inquiries and provide customer support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> We work with trusted third parties (Stripe for payments, Anthropic for AI processing, Resend for emails) who help us operate our services</li>
              <li><strong>Public Content:</strong> Reviews and ratings you submit may be visible to other users</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information,
              including encryption in transit and at rest. However, no method of transmission over the Internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Access and Update:</strong> You can access and update your account information through the app settings</li>
              <li><strong>Delete Account:</strong> You can request deletion of your account by contacting support</li>
              <li><strong>Location Services:</strong> You can disable location services, though some features may be limited</li>
              <li><strong>Push Notifications:</strong> You can manage notification preferences in your device settings</li>
              <li><strong>Marketing Emails:</strong> You can unsubscribe from marketing emails at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your personal information for as long as your account is active or as needed to provide
              you services. We may retain certain information as required by law or for legitimate business purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              Wandr is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If we learn we have collected such information, we will
              delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-600 mb-4">
              Your information may be transferred to and processed in countries other than your country of
              residence. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="text-gray-600">
              Email: <a href="mailto:privacy@wandr-app.com" className="text-primary-600 hover:underline">privacy@wandr-app.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
