# Chat Application

## Overview

This project is a real-time chat application that allows users to join chat rooms and communicate based on their assigned roles (User, Agent, Supervisor). The application leverages modern web technologies such as React, Socket.io, and Tailwind CSS to provide an engaging user experience.

## Collaborators

- [LoadSmile](https://github.com/loadsmile)

## Features

- **Role-Based Access**: Users can join as either a User, Agent, or Supervisor. Each role has specific functionalities and access.
- **Real-Time Messaging**: Utilizes Socket.io for real-time communication between users in the same chat room.
- **Private Messaging**: Agents and Supervisors can send private messages to each other.
- **Multi-Language Support**: Users can select their preferred language from a dropdown menu.
- **Responsive Design**: Built with Tailwind CSS for a clean and responsive UI.

![screenshot](https://github.com/limatainer/translator/blob/main/translate.gif)

## Components

1. **LoginForm**:

   - Allows users to enter their conversation code, username, language, and role.
   - Validates input and manages state for agent and supervisor codes.

2. **Chat**:

   - Displays chat messages with timestamps and user roles.
   - Supports sending messages and toggling private messaging options.
   - Renders a sidebar for conversations and a knowledge base for agents and supervisors.

3. **App**:
   - Manages the overall application state including room details, user information, and message history.
   - Handles socket connections for real-time messaging.

## Installation

To get started with the project:

1. Clone the repository:

   ```bash
   git clone <https://github.com/limatainer/translator>
   cd <frontweb>
   cd <server>
   ```

2. Install dependencies:

   ```bash
   for server npm install
   for frontweb yarn
   ```

3. Set up the environment variable for the socket server URL in a `.env` file:

   ```plaintext
   VITE_SOCKET_SERVER_URL=http://localhost:3000
   ```

4. Start the development server and frontend:

   ```bash
   npm start and yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Enter a conversation code, your name, select a language, and choose your role (User, Agent, Supervisor).
2. Click "Join Conversation" to enter the chat room.
3. Send messages in the chat area; Agents and Supervisors can toggle private messaging.

## Technologies Used

- **React**: For building the user interface.
- **Socket.io**: For real-time communication.
- **Tailwind CSS**: For styling components.
- **JavaScript/TypeScript**: For application logic.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Feel free to customize this README further based on specific project requirements or additional features!
