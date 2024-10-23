function LoginForm({
  room,
  setRoom,
  username,
  setUsername,
  language,
  setLanguage,
  role,
  setRole,
  joinRoom,
}) {
  return (
    <div className="flex-grow flex items-center justify-center bg-[#09092d]">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4">
          <label
            htmlFor="room"
            className="block text-sm font-medium mb-1 text-white"
          >
            Conversation Code:
          </label>
          <input
            id="room"
            type="text"
            placeholder="Enter conversation code"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium mb-1 text-white"
          >
            Your Name:
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="language"
            className="block text-sm font-medium mb-1 text-white"
          >
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt-pt">Portuguese</option>
          </select>
        </div>
        <div className="mb-6">
          <label
            htmlFor="role"
            className="block text-sm font-medium mb-1 text-white"
          >
            Role:
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="agent">Agent</option>
            <option value="supervisor">Supervisor</option>
            <option value="user">User</option>
          </select>
        </div>
        <button
          onClick={joinRoom}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Join Conversation
        </button>
      </div>
    </div>
  );
}

export default LoginForm;
