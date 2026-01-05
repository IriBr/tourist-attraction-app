import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('https://wandr-backend-k87hq.ondigitalocean.app/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Verification failed. The link may have expired.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-gray-600 mb-6">
                You can now open the Wandr app and start exploring.
              </p>
              <div className="space-y-4">
                <a
                  href="https://apps.apple.com/app/wandr/id6757339449"
                  className="btn-primary w-full"
                >
                  Open Wandr App
                </a>
                <Link to="/" className="btn-secondary w-full">
                  Go to Homepage
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  If your link has expired, you can request a new verification email from the app.
                </p>
                <Link to="/" className="btn-primary w-full">
                  Go to Homepage
                </Link>
                <a
                  href="mailto:support@wandr-app.com"
                  className="btn-secondary w-full"
                >
                  Contact Support
                </a>
              </div>
            </>
          )}
        </div>

        {/* App Store Badge */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">Don't have the app yet?</p>
          <a
            href="https://apps.apple.com/app/wandr/id6757339449"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="h-12 mx-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
