import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Republic Day Volleyball and Throwball Tournament
          </h1>
          <p className="text-gray-600">
            Team Registration & Waiver System
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">I am a...</h2>

            <Link
              href="/login"
              className="flex items-center justify-between w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-colors"
            >
              <div>
                <p className="font-medium text-blue-900">Team Captain</p>
                <p className="text-sm text-blue-700">Manage your team roster</p>
              </div>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/admin-login"
              className="flex items-center justify-between w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition-colors"
            >
              <div>
                <p className="font-medium text-purple-900">Tournament Organizer</p>
                <p className="text-sm text-purple-700">Admin dashboard</p>
              </div>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Got an invite link from your captain?<br />
              Just use that link directly to register.
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>4 Leagues: PRO Volleyball • Regular Volleyball • 45+ Volleyball • Women Throwball</p>
        </div>
      </div>
    </div>
  );
}
