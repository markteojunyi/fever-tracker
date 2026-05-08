export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
          Password Reset Unavailable
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          This feature is being rebuilt with secure email verification. Please
          contact the administrator if you need to recover your account.
        </p>
        <p className="text-center text-gray-600 text-sm mt-4">
          <a href="/login" className="text-blue-500 hover:text-blue-700">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
