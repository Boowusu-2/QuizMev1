# **Quiz Me**

Quiz Me is a real-time quiz application built with React Native that leverages UDP communication to facilitate a live buzzer (ring) system. This app allows a moderator (server) and contestants (clients) to interact seamlessly over a local network.

# Features

Dual Mode Operation:The app can run in two modes:

Server Mode (Quiz Moderator): Listens for incoming ring messages (team names) from contestants, displays the order of responses (with the fastest ring on top), and can reset rounds by sending reset commands to clients.

Client Mode (Contestants): Allows users to enter their team name and "ring in" for a question. Once rung, the button is disabled for 10 seconds to prevent multiple submissions.

Real-Time Communication:Uses the react-native-udp library to send and receive UDP messages across devices on the same local network.

Unicast Reset Functionality:The server tracks connected clients and can send a unicast reset message to each client, re-enabling their ring button for the next round.

Configurable Network Settings:Automatically retrieves the device’s local IP using react-native-network-info.

# How It Works

Server Mode:

The moderator’s device binds to a specific UDP port (8888).

Contestants send their team names via UDP.

The server collects and displays the received names in order based on the time of arrival.

A "Reset Round" function sends a reset command to all connected clients, allowing them to ring in again.

Client Mode:

Contestant devices bind to a different UDP port (8887) and send their team names to the server’s IP address.

Once a client rings in, the ring button is disabled for 10 seconds to prevent repeat submissions.

Clients listen for a reset command from the server to re-enable the ring button.

# Getting Started

## Prerequisites

Node.js and npm/yarn

React Native CLI

Android Studio (for Android emulator) or Xcode (for iOS)

### The necessary dependencies:

react-native-udp

react-native-network-info

# Installation
Clone the repository:

bash
Copy
Edit
git clone https://github.com/Boowusu-2/QuizMe.git
cd QuizMev1
Install dependencies:

bash
Copy
Edit
npm install
# or
yarn install
Link native modules (if needed):

bash
Copy
Edit
npx react-native link
Run the app on your desired device:

bash
Copy
Edit
npx react-native run-android
# or
npx react-native run-ios
Usage
Switch Modes:
Use the on-screen button to switch between Server and Client modes.

# Server Mode:

The server displays its IP address—share this with contestants.
As contestants ring in, their team names appear in order.
Use the "Reset Round" button to clear the current responses and enable contestants to ring in again.

# Client Mode:

Enter the server’s IP and your team name.
Press the ring button to send your response.
The button will disable for 10 seconds after you ring in and will automatically re-enable afterward.
Contributing
Contributions are welcome! Please open an issue or submit a pull request if you have suggestions or improvements.

# License
This project is licensed under the MIT License.



