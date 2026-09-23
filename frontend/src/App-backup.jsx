import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

const API_BASE =
window.location.hostname === "localhost" ||
window.location.hostname === "127.0.0.1"
? "http://localhost:5000"
: "";

function SpaceScene() {
const mountRef = useRef(null);

useEffect(() => {
const mount = mountRef.current;


if (!mount) return;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020308);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(0, 1.5, 18);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

mount.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
sunLight.position.set(8, 5, 10);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8fb7ff, 1.1, 100);
fillLight.position.set(-10, 5, 8);
scene.add(fillLight);

const starGeometry = new THREE.BufferGeometry();
const starCount = 14000;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i += 3) {
  const radius = 120 + Math.random() * 700;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i + 2] = radius * Math.cos(phi);
}

starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(starPositions, 3)
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.7,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.85,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const textureLoader = new THREE.TextureLoader();

const earthGroup = new THREE.Group();
earthGroup.position.set(0, 0, 0);
scene.add(earthGroup);

const earthTexture = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
);

const earthNormal = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
);

const earthSpecular = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
);

const earthGeometry = new THREE.SphereGeometry(4.6, 96, 96);

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  normalMap: earthNormal,
  specularMap: earthSpecular,
  specular: new THREE.Color(0x444444),
  shininess: 18,
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.rotation.y = -0.6;
earthGroup.add(earth);

const cloudTexture = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
);

const cloudGeometry = new THREE.SphereGeometry(4.68, 96, 96);

const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
});

const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
earthGroup.add(clouds);

const atmosphereGeometry = new THREE.SphereGeometry(4.85, 96, 96);

const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x4ca5ff,
  transparent: true,
  opacity: 0.11,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const atmosphere = new THREE.Mesh(
  atmosphereGeometry,
  atmosphereMaterial
);

earthGroup.add(atmosphere);

const moonGroup = new THREE.Group();
scene.add(moonGroup);

const moonTexture = textureLoader.load(
  "https://threejs.org/examples/textures/planets/moon_1024.jpg"
);

const moonGeometry = new THREE.SphereGeometry(1.35, 64, 64);

const moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  roughness: 1,
  metalness: 0,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(9, 1.8, -1);
moonGroup.add(moon);

const moonOrbitGeometry = new THREE.RingGeometry(7.5, 7.52, 128);

const moonOrbitMaterial = new THREE.MeshBasicMaterial({
  color: 0x7894b8,
  transparent: true,
  opacity: 0.16,
  side: THREE.DoubleSide,
});

const moonOrbit = new THREE.Mesh(
  moonOrbitGeometry,
  moonOrbitMaterial
);

moonOrbit.rotation.x = Math.PI / 2;
moonOrbit.position.y = 0;
scene.add(moonOrbit);

const satelliteGroup = new THREE.Group();
satelliteGroup.position.set(-9, 4, 1);
scene.add(satelliteGroup);

const satelliteBodyGeometry = new THREE.BoxGeometry(1.3, 0.9, 0.9);

const satelliteBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xb8c2cc,
  metalness: 0.75,
  roughness: 0.3,
});

const satelliteBody = new THREE.Mesh(
  satelliteBodyGeometry,
  satelliteBodyMaterial
);

satelliteGroup.add(satelliteBody);

const panelGeometry = new THREE.BoxGeometry(3.3, 0.08, 1.4);

const panelMaterial = new THREE.MeshStandardMaterial({
  color: 0x183c70,
  metalness: 0.4,
  roughness: 0.35,
});

const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
leftPanel.position.x = -2.1;
satelliteGroup.add(leftPanel);

const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
rightPanel.position.x = 2.1;
satelliteGroup.add(rightPanel);

const antennaGeometry = new THREE.CylinderGeometry(
  0.06,
  0.06,
  2.2,
  20
);

const antennaMaterial = new THREE.MeshStandardMaterial({
  color: 0xdce5ef,
  metalness: 0.8,
  roughness: 0.2,
});

const antenna = new THREE.Mesh(
  antennaGeometry,
  antennaMaterial
);

antenna.rotation.z = Math.PI / 2;
antenna.position.y = 0.8;
satelliteGroup.add(antenna);

const dishGeometry = new THREE.SphereGeometry(
  0.7,
  32,
  16,
  0,
  Math.PI * 2,
  0,
  Math.PI / 2
);

const dishMaterial = new THREE.MeshStandardMaterial({
  color: 0xe4e8ed,
  metalness: 0.45,
  roughness: 0.35,
  side: THREE.DoubleSide,
});

const dish = new THREE.Mesh(dishGeometry, dishMaterial);
dish.rotation.x = Math.PI;
dish.position.set(0, -0.9, 0);
satelliteGroup.add(dish);

const spacecraftGroup = new THREE.Group();
spacecraftGroup.position.set(8, -4, -3);
spacecraftGroup.rotation.z = -0.18;
scene.add(spacecraftGroup);

const spacecraftBodyGeometry = new THREE.CylinderGeometry(
  0.75,
  1.05,
  3.8,
  32
);

const spacecraftBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xd5d8dc,
  metalness: 0.65,
  roughness: 0.3,
});

const spacecraftBody = new THREE.Mesh(
  spacecraftBodyGeometry,
  spacecraftBodyMaterial
);

spacecraftBody.rotation.z = Math.PI / 2;
spacecraftGroup.add(spacecraftBody);

const noseGeometry = new THREE.ConeGeometry(0.75, 1.8, 32);

const noseMaterial = new THREE.MeshStandardMaterial({
  color: 0xc7cbd1,
  metalness: 0.7,
  roughness: 0.28,
});

const nose = new THREE.Mesh(noseGeometry, noseMaterial);
nose.rotation.z = -Math.PI / 2;
nose.position.x = 2.7;
spacecraftGroup.add(nose);

const windowGeometry = new THREE.SphereGeometry(0.34, 24, 24);

const windowMaterial = new THREE.MeshStandardMaterial({
  color: 0x152b43,
  metalness: 0.55,
  roughness: 0.18,
});

const window1 = new THREE.Mesh(
  windowGeometry,
  windowMaterial
);

window1.scale.set(1, 0.4, 0.75);
window1.position.set(1.15, 0.55, 0);
spacecraftGroup.add(window1);

const window2 = new THREE.Mesh(
  windowGeometry,
  windowMaterial
);

window2.scale.set(1, 0.4, 0.75);
window2.position.set(0.25, 0.55, 0);
spacecraftGroup.add(window2);

const finGeometry = new THREE.BoxGeometry(1.3, 0.12, 0.7);

const finMaterial = new THREE.MeshStandardMaterial({
  color: 0x9da4ad,
  metalness: 0.55,
  roughness: 0.35,
});

const finTop = new THREE.Mesh(finGeometry, finMaterial);
finTop.position.set(-0.9, 0.9, 0);
finTop.rotation.z = -0.35;
spacecraftGroup.add(finTop);

const finBottom = new THREE.Mesh(finGeometry, finMaterial);
finBottom.position.set(-0.9, -0.9, 0);
finBottom.rotation.z = 0.35;
spacecraftGroup.add(finBottom);

const engineGeometry = new THREE.CylinderGeometry(
  0.42,
  0.55,
  0.8,
  32
);

const engineMaterial = new THREE.MeshBasicMaterial({
  color: 0x76b9ff,
  transparent: true,
  opacity: 0.85,
});

const engine = new THREE.Mesh(engineGeometry, engineMaterial);
engine.rotation.z = Math.PI / 2;
engine.position.x = -2.25;
spacecraftGroup.add(engine);

const distantPlanetGeometry = new THREE.SphereGeometry(
  2.3,
  64,
  64
);

const distantPlanetMaterial = new THREE.MeshStandardMaterial({
  color: 0x5c6878,
  roughness: 1,
  metalness: 0,
});

const distantPlanet = new THREE.Mesh(
  distantPlanetGeometry,
  distantPlanetMaterial
);

distantPlanet.position.set(-12, -6, -18);
scene.add(distantPlanet);

const mouse = {
  x: 0,
  y: 0,
};

const handleMouseMove = (event) => {
  mouse.x =
    (event.clientX / window.innerWidth - 0.5) * 2;

  mouse.y =
    (event.clientY / window.innerHeight - 0.5) * 2;
};

window.addEventListener("mousemove", handleMouseMove);

const clock = new THREE.Clock();

let animationId;

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  earth.rotation.y += 0.0008;
  clouds.rotation.y += 0.0011;

  moonGroup.rotation.y = elapsed * 0.08;
  moon.rotation.y += 0.002;

  satelliteGroup.rotation.y += 0.005;
  satelliteGroup.rotation.x =
    Math.sin(elapsed * 0.7) * 0.18;

  spacecraftGroup.rotation.y =
    Math.sin(elapsed * 0.5) * 0.12;

  distantPlanet.rotation.y += 0.0004;
  stars.rotation.y += 0.00003;

  camera.position.x +=
    (mouse.x * 0.7 - camera.position.x) * 0.025;

  camera.position.y +=
    (-mouse.y * 0.45 + 1.5 - camera.position.y) *
    0.025;

  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
};

animate();

const handleResize = () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
};

window.addEventListener("resize", handleResize);

return () => {
  cancelAnimationFrame(animationId);

  window.removeEventListener(
    "mousemove",
    handleMouseMove
  );

  window.removeEventListener(
    "resize",
    handleResize
  );

  renderer.dispose();

  if (mount.contains(renderer.domElement)) {
    mount.removeChild(renderer.domElement);
  }
};


}, []);

return <div ref={mountRef} className="real-space-scene" />;
}

function getGreeting() {
const hour = new Date().getHours();

if (hour >= 5 && hour < 12) {
return "Good Morning";
}

if (hour >= 12 && hour < 17) {
return "Good Afternoon";
}

if (hour >= 17 && hour < 21) {
return "Good Evening";
}

return "Good Night";
}

function formatTime(date) {
return date.toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
second: "2-digit",
});
}

function formatDate(date) {
return date.toLocaleDateString([], {
weekday: "long",
day: "numeric",
month: "long",
year: "numeric",
});
}

function App() {
const [activePage, setActivePage] = useState("Home");
const [message, setMessage] = useState("");
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [darkMode, setDarkMode] = useState(true);
const [currentTime, setCurrentTime] = useState(new Date());

const recognitionRef = useRef(null);

useEffect(() => {
const timer = setInterval(() => {
setCurrentTime(new Date());
}, 1000);


return () => clearInterval(timer);


}, []);

useEffect(() => {
const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;


if (!SpeechRecognition) {
  return;
}

const recognition = new SpeechRecognition();

recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

recognition.onstart = () => {
  setIsListening(true);
};

recognition.onend = () => {
  setIsListening(false);
};

recognition.onerror = () => {
  setIsListening(false);
};

recognition.onresult = (event) => {
  const transcript =
    event.results[0][0].transcript;

  setMessage(transcript);
};

recognitionRef.current = recognition;

return () => {
  recognition.stop();
};


}, []);

const speakText = (text) => {
if (!("speechSynthesis" in window)) {
return;
}


window.speechSynthesis.cancel();

const utterance = new SpeechSynthesisUtterance(text);

const voices =
  window.speechSynthesis.getVoices();

const preferredVoice = voices.find((voice) => {
  const name = voice.name.toLowerCase();

  return (
    voice.lang.startsWith("en") &&
    (
      name.includes("female") ||
      name.includes("zira") ||
      name.includes("samantha") ||
      name.includes("aria") ||
      name.includes("jenny")
    )
  );
});

if (preferredVoice) {
  utterance.voice = preferredVoice;
}

utterance.rate = 1;
utterance.pitch = 1.05;
utterance.volume = 1;

utterance.onstart = () => {
  setIsSpeaking(true);
};

utterance.onend = () => {
  setIsSpeaking(false);
};

utterance.onerror = () => {
  setIsSpeaking(false);
};

window.speechSynthesis.speak(utterance);


};

const sendMessage = async (customMessage) => {
const text =
typeof customMessage === "string"
? customMessage.trim()
: message.trim();


if (!text || loading) {
  return;
}

setActivePage("AI Chat");

setMessages((previous) => [
  ...previous,
  {
    role: "user",
    text,
  },
]);

setMessage("");
setLoading(true);

try {
  const response = await fetch(
    API_BASE + "/api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "AI response failed"
    );
  }

  const reply =
    data.reply ||
    "I received your message, but no response was returned.";

  setMessages((previous) => [
    ...previous,
    {
      role: "ai",
      text: reply,
    },
  ]);

  speakText(reply);
} catch (error) {
  console.error("ShezoraX Chat Error:", error);

  const errorMessage =
    "I'm unable to connect to my AI service right now. Please check that the ShezoraX backend is running.";

  setMessages((previous) => [
    ...previous,
    {
      role: "ai",
      text: errorMessage,
    },
  ]);
} finally {
  setLoading(false);
}


};

const startListening = () => {
if (!recognitionRef.current) {
alert(
"Voice recognition is not supported in this browser."
);


  return;
}

if (isListening) {
  recognitionRef.current.stop();
  return;
}

recognitionRef.current.start();


};

const stopSpeaking = () => {
if ("speechSynthesis" in window) {
window.speechSynthesis.cancel();
}


setIsSpeaking(false);


};

const handleKeyDown = (event) => {
if (event.key === "Enter" && !event.shiftKey) {
event.preventDefault();
sendMessage();
}
};

const suggestions = [
"Explain something to me",
"Help me plan my day",
"Teach me about the universe",
"Help me build a project",
];

const renderModule = () => {
if (activePage === "Home") {
return (
<> <section className="hero-section"> <div className="hero-content"> <div className="status-pill"> <span className="status-dot" />
ShezoraX AI Online </div>

          <h1 className="greeting">
            {getGreeting()}, Owais.
          </h1>

          <p className="hero-description">
            Your intelligent personal AI workspace for
            learning, creating, exploring and getting things
            done.
          </p>

          <div className="hero-time">
            <strong>
              {formatTime(currentTime)}
            </strong>

            <span>
              {formatDate(currentTime)}
            </span>
          </div>
        </div>
      </section>

      <section className="chat-section">
        <div className="chat-card">
          <div className="chat-header">
            <div>
              <span className="eyebrow">
                PERSONAL AI
              </span>

              <h2>
                What can I help you with?
              </h2>
            </div>

            <button
              className={
                "voice-button " +
                (isSpeaking ? "active" : "")
              }
              onClick={
                isSpeaking
                  ? stopSpeaking
                  : startListening
              }
              type="button"
            >
              {isSpeaking ? "Stop Voice" : "Voice"}
            </button>
          </div>

          <div className="conversation">
            {messages.length === 0 && (
              <div className="empty-conversation">
                <p>
                  Start a conversation with ShezoraX.
                </p>
              </div>
            )}

            {messages.map((item, index) => (
              <div
                className={
                  "message-row " +
                  (item.role === "user"
                    ? "user-message"
                    : "ai-message")
                }
                key={index}
              >
                <div className="message-bubble">
                  {item.text}
                </div>

                {item.role === "ai" && (
                  <button
                    className="listen-button"
                    type="button"
                    onClick={() =>
                      speakText(item.text)
                    }
                  >
                    Listen
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="message-row ai-message">
                <div className="message-bubble typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <div className="prompt-box">
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening..."
                  : "Ask ShezoraX anything..."
              }
              rows="1"
            />

            <div className="prompt-actions">
              <button
                type="button"
                className={
                  "listen-button " +
                  (isListening ? "active" : "")
                }
                onClick={startListening}
              >
                {isListening
                  ? "Listening"
                  : "Speak"}
              </button>

              <button
                type="button"
                className="send-button"
                onClick={() => sendMessage()}
                disabled={
                  loading ||
                  !message.trim()
                }
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="suggestion-section">
        <span className="eyebrow">
          EXPLORE SHEZORAX
        </span>

        <div className="suggestion-grid">
          {suggestions.map((item) => (
            <button
              type="button"
              className="suggestion-card"
              key={item}
              onClick={() => sendMessage(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

if (activePage === "AI Chat") {
  return (
    <section className="module-page">
      <div className="module-card">
        <span className="eyebrow">
          AI CHAT
        </span>

        <h1>Talk with ShezoraX</h1>

        <p>
          Ask questions, learn new concepts, plan
          projects or explore ideas through the AI
          assistant.
        </p>

        <button
          type="button"
          className="primary-module-button"
          onClick={() => setActivePage("Home")}
        >
          Open Chat
        </button>
      </div>
    </section>
  );
}

if (activePage === "Create") {
  return (
    <section className="module-page">
      <div className="module-card">
        <span className="eyebrow">
          CREATE
        </span>

        <h1>Create with AI</h1>

        <p>
          Turn your ideas into websites, documents,
          concepts and creative projects.
        </p>
      </div>
    </section>
  );
}

if (activePage === "Projects") {
  return (
    <section className="module-page">
      <div className="module-card">
        <span className="eyebrow">
          PROJECTS
        </span>

        <h1>Your Projects</h1>

        <p>
          Manage your personal AI projects and keep
          your work organized.
        </p>
      </div>
    </section>
  );
}

if (activePage === "Knowledge") {
  return (
    <section className="module-page">
      <div className="module-card">
        <span className="eyebrow">
          KNOWLEDGE
        </span>

        <h1>Knowledge Universe</h1>

        <p>
          Explore science, technology, Earth, space,
          history, learning and more.
        </p>
      </div>
    </section>
  );
}

if (activePage === "Settings") {
  return (
    <section className="module-page">
      <div className="module-card">
        <span className="eyebrow">
          SETTINGS
        </span>

        <h1>ShezoraX Settings</h1>

        <p>
          Customize your interface, voice and
          assistant experience.
        </p>

        <button
          type="button"
          className="primary-module-button"
          onClick={() =>
            setDarkMode((previous) => !previous)
          }
        >
          {darkMode
            ? "Switch to Light Mode"
            : "Switch to Dark Mode"}
        </button>
      </div>
    </section>
  );
}

return null;


};

return (
<div
className={
"app " +
(darkMode ? "dark-mode" : "light-mode")
}
> <div className="real-universe-background"> <SpaceScene /> <div className="universe-overlay" /> </div>

```
  <aside className="sidebar">
    <div className="brand">
      <div className="brand-orbit">
        S
      </div>

      <div>
        <strong>ShezoraX</strong>
        <span>PERSONAL AI</span>
      </div>
    </div>

    <nav className="sidebar-nav">
      {[
        "Home",
        "AI Chat",
        "Create",
        "Projects",
        "Knowledge",
        "Settings",
      ].map((item) => (
        <button
          type="button"
          key={item}
          className={
            activePage === item
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePage(item)
          }
        >
          <span>{item}</span>
        </button>
      ))}
    </nav>

    <div className="sidebar-bottom">
      <div className="ai-status">
        <span className="status-dot" />

        <div>
          <strong>AI System</strong>
          <span>Online</span>
        </div>
      </div>

      <button
        type="button"
        className="profile-button"
      >
        OA
      </button>
    </div>
  </aside>

  <main className="app-shell">
    <header className="topbar">
      <div className="breadcrumb">
        ShezoraX
        <span>/</span>
        {activePage}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          onClick={() =>
            setActivePage("AI Chat")
          }
        >
          Search
        </button>

        <button
          type="button"
          onClick={() =>
            setActivePage("Knowledge")
          }
        >
          Knowledge
        </button>

        <button
          type="button"
          onClick={() =>
            setDarkMode((previous) => !previous)
          }
        >
          {darkMode ? "Light" : "Dark"}
        </button>

        <button
          type="button"
          className="upgrade-button"
        >
          Upgrade
        </button>
      </div>
    </header>

    <div className="main-content">
      {renderModule()}
    </div>
  </main>
</div>

);
}

export default App;
