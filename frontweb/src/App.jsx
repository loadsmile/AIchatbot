import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import UserChat from './components/UserChat';
import AgentChat from './components/AgentChat';
import SupervisorChat from './components/SupervisorChat';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5177';

const socket = io(SOCKET_SERVER_URL);

function App() {
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('en');
  const [role, setRole] = useState('agent');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('messageHistory', (history) => {
      setMessages(history);
    });

    return () => {
      socket.off('message');
      socket.off('messageHistory');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const joinRoom = () => {
    if (room && username && language && role) {
      socket.emit('join', { room, username, language, role });
      setJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      if (isPrivate && (role === 'supervisor' || role === 'agent')) {
        const targetRole = role === 'supervisor' ? 'agent' : 'supervisor';
        socket.emit('privateMessage', {
          room,
          message,
          targetRole,
        });
      } else {
        socket.emit('chatMessage', { room, message, language });
      }
      setMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#09092d] min-h-screen text-white flex flex-col">
      <Header />
      {!joined ? (
        <LoginForm
          room={room}
          setRoom={setRoom}
          username={username}
          setUsername={setUsername}
          language={language}
          setLanguage={setLanguage}
          role={role}
          setRole={setRole}
          joinRoom={joinRoom}
        />
      ) : (
        <>
          {role === 'user' && (
            <UserChat
              messages={messages}
              username={username}
              sendMessage={sendMessage}
              message={message}
              setMessage={setMessage}
              formatTimestamp={formatTimestamp}
              messagesEndRef={messagesEndRef}
            />
          )}
          {role === 'agent' && (
            <AgentChat
              messages={messages}
              username={username}
              sendMessage={sendMessage}
              message={message}
              setMessage={setMessage}
              formatTimestamp={formatTimestamp}
              messagesEndRef={messagesEndRef}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
            />
          )}
          {role === 'supervisor' && (
            <SupervisorChat
              messages={messages}
              username={username}
              sendMessage={sendMessage}
              message={message}
              setMessage={setMessage}
              formatTimestamp={formatTimestamp}
              messagesEndRef={messagesEndRef}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;