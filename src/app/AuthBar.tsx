'use client';

export default function AuthBar() {
  const handleSignIn = () => {
    window.location.href = '/login';
  };

  const handleSignOut = () => {
    window.location.href = '/';
  };

  // Mock session - always "logged in" for now
  const session = { user: { name: 'User', email: 'user@example.com' } };

  return (
    <div className="flex items-center gap-4">
      {session ? (
        <>
          <span>{session.user.name}</span>
          <button onClick={handleSignOut} className="px-4 py-2 bg-gray-200 rounded">
            Sign Out
          </button>
        </>
      ) : (
        <button onClick={handleSignIn} className="px-4 py-2 bg-blue-600 text-white rounded">
          Sign In
        </button>
      )}
    </div>
  );
}