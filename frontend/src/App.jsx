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

    /* =========================================================
       CINEMATIC SPACE SCENE
       Objects keep fixed 3D positions. Only the camera moves,
       so planets, Moon, satellite and spacecraft never collide
       just because the user moves the mouse/device.
    ========================================================= */

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010207);
    scene.fog = new THREE.FogExp2(0x010207, 0.0022);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      2200
    );

    const cameraHome = new THREE.Vector3(0, 1.2, 19);
    camera.position.copy(cameraHome);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    mount.appendChild(renderer.domElement);

    /* =========================================================
       LIGHTING — one strong sun + extremely subtle fill
    ========================================================= */

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.055);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4df, 4.2);
    sunLight.position.set(18, 9, 14);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const blueFill = new THREE.PointLight(0x426cff, 0.18, 80);
    blueFill.position.set(-18, -8, 8);
    scene.add(blueFill);

/* =========================================================
   NATURAL DEEP-SPACE STAR FIELD
   Only the universe background is changed.
   Earth / Moon / ISS / Mars are untouched.
========================================================= */

const createNaturalStars = (
  count,
  minRadius,
  maxRadius,
  baseSize,
  baseOpacity,
  seed
) => {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let randomSeed = seed;

  const random = () => {
    randomSeed =
      (randomSeed * 1664525 + 1013904223) % 4294967296;

    return randomSeed / 4294967296;
  };

  const starColor = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    /*
      Natural spherical distribution.
      Slightly deeper stars are more common,
      avoiding the artificial "flat galaxy wall" look.
    */
    const distribution = Math.pow(random(), 0.72);

    const radius =
      minRadius +
      distribution * (maxRadius - minRadius);

    const theta = random() * Math.PI * 2;
    const u = random() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));

    positions[i * 3] =
      radius * s * Math.cos(theta);

    positions[i * 3 + 1] =
      radius * s * Math.sin(theta);

    positions[i * 3 + 2] =
      radius * u;

    /*
      Realistic star colour variation:
      mostly white, with very subtle warm and
      blue-white stars.
    */
    const colorChance = random();

    if (colorChance < 0.055) {
      // Very subtle warm star
      starColor.setRGB(1.0, 0.86, 0.70);
    } else if (colorChance < 0.105) {
      // Very subtle blue-white star
      starColor.setRGB(0.72, 0.84, 1.0);
    } else {
      // Normal white star
      starColor.setRGB(1.0, 0.97, 0.92);
    }

    /*
      Small natural brightness variation.
      No neon colors and no artificial glowing blobs.
    */
    const brightness =
      0.55 + random() * 0.45;

    colors[i * 3] =
      starColor.r * brightness;

    colors[i * 3 + 1] =
      starColor.g * brightness;

    colors[i * 3 + 2] =
      starColor.b * brightness;
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const material = new THREE.PointsMaterial({
    size: baseSize,
    sizeAttenuation: true,
    transparent: true,
    opacity: baseOpacity,
    vertexColors: true,
    depthWrite: false,
    depthTest: true,
  });

  return new THREE.Points(
    geometry,
    material
  );
};


/*
  Three natural depth layers.
  The names remain farStars / midStars / nearStars
  so the rest of the existing scene stays stable.
*/

const farStars = createNaturalStars(
  7200,
  180,
  950,
  0.52,
  0.62,
  18473
);

const midStars = createNaturalStars(
  2200,
  90,
  400,
  0.72,
  0.42,
  92831
);

const nearStars = createNaturalStars(
  360,
  50,
  170,
  0.95,
  0.24,
  51729
);

scene.add(
  farStars,
  midStars,
  nearStars
);


/* =========================================================
   VERY SUBTLE DEEP-SPACE DUST
   No artificial blue galaxy / nebula shapes.
========================================================= */

const createSpaceDust = () => {
  const geometry = new THREE.BufferGeometry();

  const count = 650;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let randomSeed = 78321;

  const random = () => {
    randomSeed =
      (randomSeed * 1664525 + 1013904223) % 4294967296;

    return randomSeed / 4294967296;
  };

  for (let i = 0; i < count; i += 1) {
    const radius =
      260 + random() * 600;

    const theta =
      random() * Math.PI * 2;

    const u =
      random() * 2 - 1;

    const s =
      Math.sqrt(Math.max(0, 1 - u * u));

    positions[i * 3] =
      radius * s * Math.cos(theta);

    positions[i * 3 + 1] =
      radius * s * Math.sin(theta);

    positions[i * 3 + 2] =
      radius * u;

    const brightness =
      0.025 + random() * 0.035;

    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness * 0.96;
    colors[i * 3 + 2] = brightness * 0.92;
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(
      colors,
      3
    )
  );

  const material =
    new THREE.PointsMaterial({
      size: 1.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.16,
      vertexColors: true,
      depthWrite: false,
      depthTest: true,
    });

  return new THREE.Points(
    geometry,
    material
  );
};

const spaceDust =
  createSpaceDust();

scene.add(spaceDust);

    /* =========================================================
       EARTH — primary hero object
    ========================================================= */

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

    const earthLights = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_lights_2048.png"
    );

    const earthGeometry = new THREE.SphereGeometry(
      4.6,
      128,
      128
    );

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      normalMap: earthNormal,
      specularMap: earthSpecular,
      specular: new THREE.Color(0x777777),
      shininess: 24,
    });

    const earth = new THREE.Mesh(
      earthGeometry,
      earthMaterial
    );

    earth.rotation.y = -0.6;
    earth.castShadow = true;
    earth.receiveShadow = true;
    earthGroup.add(earth);

    const nightMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: new THREE.Vector3(18, 9, 14).normalize() },
        uNightMap: { value: earthLights },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uNightMap;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float lightSide = dot(normalize(vNormal), normalize(normalMatrix * uSunDirection));
          float darkness = smoothstep(0.10, -0.18, lightSide);
          vec4 city = texture2D(uNightMap, vUv);
          float alpha = city.a * darkness * 0.52;
          gl_FragColor = vec4(city.rgb * 1.15, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const nightSide = new THREE.Mesh(
      new THREE.SphereGeometry(4.615, 128, 128),
      nightMaterial
    );

    earthGroup.add(nightSide);

    const cloudTexture = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
    );

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(4.68, 128, 128),
      cloudMaterial
    );

    earthGroup.add(clouds);

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x5ba9ff,
      transparent: true,
      opacity: 0.105,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(4.88, 96, 96),
      atmosphereMaterial
    );

    earthGroup.add(atmosphere);

    /* =========================================================
       MOON — fixed on a clean orbit, far from satellite
    ========================================================= */

    const moonOrbitGroup = new THREE.Group();
    moonOrbitGroup.rotation.z = -0.13;
    scene.add(moonOrbitGroup);

    const moonOrbitRadius = 10.4;

    const moonTexture = textureLoader.load(
      "https://threejs.org/examples/textures/planets/moon_1024.jpg"
    );

    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 1,
      metalness: 0,
    });

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1.28, 96, 96),
      moonMaterial
    );

    moon.position.set(
      moonOrbitRadius,
      1.8,
      -1.5
    );

    moon.castShadow = true;
    moon.receiveShadow = true;
    moonOrbitGroup.add(moon);

    /* Very subtle orbit indicator */
    const moonOrbit = new THREE.Mesh(
      new THREE.RingGeometry(
        moonOrbitRadius - 0.015,
        moonOrbitRadius,
        160
      ),
      new THREE.MeshBasicMaterial({
        color: 0x7185a8,
        transparent: true,
        opacity: 0.055,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );

    moonOrbit.rotation.x = Math.PI / 2;
    scene.add(moonOrbit);

    /* =========================================================
       NASA / ISS SATELLITE — preserved realistic NASA image
    ========================================================= */

    const issTextureLoader = new THREE.TextureLoader();
    const issTexture = issTextureLoader.load(
      "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/universe/2023/09/SpaceStation-1.png?crop=faces%2Cfocalpoint&fit=clip&h=3022&w=5250"
    );
    issTexture.colorSpace = THREE.SRGBColorSpace;

    const issMaterial = new THREE.SpriteMaterial({
      map: issTexture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: true,
    });

    const issSprite = new THREE.Sprite(issMaterial);
    issSprite.scale.set(4.8, 2.76, 1);
    scene.add(issSprite);

    let issOrbitAngle = 0;
    const issOrbitRadiusX = 8.2;
    const issOrbitRadiusY = 4.8;
    const issOrbitDepth = 1.8;

    const updateISSOrbit = (elapsed) => {
      issOrbitAngle = elapsed * 0.28;

      const orbitX = Math.cos(issOrbitAngle) * issOrbitRadiusX;
      const orbitY = Math.sin(issOrbitAngle) * issOrbitRadiusY + 0.4;
      const orbitZ = Math.sin(issOrbitAngle * 1.15) * issOrbitDepth - 2.5;

      issSprite.position.set(orbitX, orbitY, orbitZ);
      issSprite.material.rotation = Math.sin(issOrbitAngle) * 0.08;

      const depthScale = 1 + Math.sin(issOrbitAngle) * 0.08;
      issSprite.scale.set(4.8 * depthScale, 2.76 * depthScale, 1);
    };


    /* =========================================================
       MARS — realistic NASA texture, fixed in deep background
    ========================================================= */

    const marsTexture = textureLoader.load(
      "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/mars/preview.webp?w=2048"
    );
    marsTexture.colorSpace = THREE.SRGBColorSpace;
    marsTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const marsMaterial = new THREE.MeshStandardMaterial({
      map: marsTexture,
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
    });

    const distantPlanet = new THREE.Mesh(
      new THREE.SphereGeometry(2.7, 128, 128),
      marsMaterial
    );

    const positionMars = () => {
      const isMobile = window.innerWidth <= 768;
      distantPlanet.position.set(
        isMobile ? -5.8 : -11.5,
        isMobile ? -3.8 : -5.5,
        isMobile ? -24 : -27
      );
    };

    positionMars();
    distantPlanet.castShadow = true;
    distantPlanet.receiveShadow = true;
    scene.add(distantPlanet);

    const distantAtmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.79, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0xb36b4a,
        transparent: true,
        opacity: 0.035,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    distantPlanet.add(distantAtmosphere);

    /* =========================================================
       INTERACTION
       Camera moves; objects stay spatially stable.
    ========================================================= */

    const mouse = {
      x: 0,
      y: 0,
    };

    const targetCamera = {
      x: 0,
      y: 1.2,
      lookX: 0,
      lookY: 0,
    };

    const smoothCamera = {
      x: 0,
      y: 1.2,
      lookX: 0,
      lookY: 0,
    };

    const setPointerTarget = (x, y) => {
      const safeX = THREE.MathUtils.clamp(x, -1, 1);
      const safeY = THREE.MathUtils.clamp(y, -1, 1);

      mouse.x = safeX;
      mouse.y = safeY;

      targetCamera.x = safeX * 1.35;
      targetCamera.y = 1.2 - safeY * 0.85;
      targetCamera.lookX = safeX * 1.0;
      targetCamera.lookY = -safeY * 0.65;
    };

    const handleMouseMove = (event) => {
      setPointerTarget(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * 2
      );
    };

    const handleTouchMove = (event) => {
      if (!event.touches || !event.touches[0]) {
        return;
      }

      const touch = event.touches[0];

      setPointerTarget(
        (touch.clientX / window.innerWidth - 0.5) * 2,
        (touch.clientY / window.innerHeight - 0.5) * 2
      );
    };

    const handleDeviceOrientation = (event) => {
      if (
        typeof event.gamma !== "number" ||
        typeof event.beta !== "number"
      ) {
        return;
      }

      const gamma = THREE.MathUtils.clamp(
        event.gamma / 35,
        -1,
        1
      );

      const beta = THREE.MathUtils.clamp(
        (event.beta - 45) / 35,
        -1,
        1
      );

      setPointerTarget(gamma, beta);
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "touchmove",
      handleTouchMove,
      { passive: true }
    );

    if ("DeviceOrientationEvent" in window) {
      window.addEventListener(
        "deviceorientation",
        handleDeviceOrientation
      );
    }

    /* =========================================================
       ROCKET LAUNCH FROM SEND BUTTON
    ========================================================= */

    let launchActive = false;
    let launchStart = 0;
    let launchFrom = new THREE.Vector3();
    let launchTo = new THREE.Vector3();

    const handleRocketLaunch = () => {
      if (launchActive) return;

      launchActive = true;
      launchStart = performance.now();

      launchFrom.copy(spacecraftGroup.position);

      launchTo.set(
        spacecraftGroup.position.x + 13,
        spacecraftGroup.position.y + 7,
        spacecraftGroup.position.z - 18
      );

      flame.visible = true;
      flameCore.visible = true;
    };

    window.addEventListener(
      "shezorax:rocket-launch",
      handleRocketLaunch
    );

    /* =========================================================
       ANIMATION
    ========================================================= */

    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      earth.rotation.y += 0.00055;
      clouds.rotation.y += 0.0008;
      nightSide.rotation.y += 0.00055;

      moonOrbitGroup.rotation.y =
        elapsed * 0.025;

      moon.rotation.y += 0.0012;

      updateISSOrbit(elapsed);
      nightMaterial.uniforms.uSunDirection.value.copy(sunLight.position).normalize();

      distantPlanet.rotation.y += 0.00025;

      farStars.rotation.y += 0.000008;
      midStars.rotation.y -= 0.000012;
      nearStars.rotation.y += 0.000018;

      smoothCamera.x +=
        (targetCamera.x - smoothCamera.x) * 0.028;

      smoothCamera.y +=
        (targetCamera.y - smoothCamera.y) * 0.028;

      smoothCamera.lookX +=
        (targetCamera.lookX - smoothCamera.lookX) *
        0.028;

      smoothCamera.lookY +=
        (targetCamera.lookY - smoothCamera.lookY) *
        0.028;

      camera.position.x = smoothCamera.x;
      camera.position.y = smoothCamera.y;
      camera.position.z = cameraHome.z;

      camera.lookAt(
        smoothCamera.lookX,
        smoothCamera.lookY,
        0
      );


      /* Rocket launch trajectory */
      if (launchActive) {
        const elapsedLaunch =
          performance.now() - launchStart;

        const duration = 1450;
        const progress = THREE.MathUtils.clamp(
          elapsedLaunch / duration,
          0,
          1
        );

        const eased =
          1 - Math.pow(1 - progress, 3);

        spacecraftGroup.position.lerpVectors(
          launchFrom,
          launchTo,
          eased
        );

        spacecraftGroup.rotation.z =
          -0.18 - progress * 0.32;

        const flamePulse =
          0.82 +
          Math.sin(elapsedLaunch * 0.035) * 0.18;

        flame.scale.set(
          1,
          flamePulse,
          flamePulse
        );

        flameCore.scale.set(
          1,
          0.9 + flamePulse * 0.22,
          0.9 + flamePulse * 0.22
        );

        if (progress >= 1) {
          launchActive = false;
          flame.visible = false;
          flameCore.visible = false;

          spacecraftGroup.position.set(
            10.5,
            -5.2,
            -6.5
          );

          spacecraftGroup.rotation.z =
            -0.18;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    /* =========================================================
       RESIZE
    ========================================================= */

    const handleResize = () => {
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
      );

      positionMars();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    /* =========================================================
       CLEANUP
    ========================================================= */

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "touchmove",
        handleTouchMove
      );

      if (
        "DeviceOrientationEvent" in window
      ) {
        window.removeEventListener(
          "deviceorientation",
          handleDeviceOrientation
        );
      }

      window.removeEventListener(
        "shezorax:rocket-launch",
        handleRocketLaunch
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      renderer.dispose();

      if (
        mount.contains(
          renderer.domElement
        )
      ) {
        mount.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="real-space-scene"
    />
  );
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


const PROJECT_TYPES = [
  { id: "website", title: "Website / Web App", icon: "WEB", description: "Build websites, dashboards, portfolios and full web applications." },
  { id: "school", title: "School Project", icon: "SCH", description: "Create school assignments, experiments, reports and presentations." },
  { id: "university", title: "College / University", icon: "UNI", description: "Work on university assignments, FYPs, research and documentation." },
  { id: "software", title: "Software / Desktop App", icon: "APP", description: "Plan software products, desktop tools and utility applications." },
  { id: "ai", title: "AI Project", icon: "AI", description: "Design AI assistants, ML ideas, prompts and intelligent products." },
  { id: "mobile", title: "Mobile App", icon: "MOB", description: "Create Android, iOS and cross-platform mobile applications." },
  { id: "game", title: "Game Project", icon: "GAME", description: "Build game concepts, mechanics, stories and development plans." },
  { id: "data", title: "Data / Research", icon: "DATA", description: "Analyze data, plan research and prepare technical findings." },
  { id: "report", title: "Presentation / Report", icon: "DOC", description: "Create reports, presentations, proposals and structured documents." },
  { id: "design", title: "Design / Creative", icon: "DES", description: "Develop UI/UX, branding, creative concepts and visual direction." },
  { id: "custom", title: "Custom Project", icon: "NEW", description: "Start anything else with a completely custom AI workspace." },
];

function getProjectType(id) {
  return PROJECT_TYPES.find((item) => item.id === id) || PROJECT_TYPES[0];
}

const SETTINGS_LANGUAGES = [
  "English",
  "Chinese",
  "Japanese",
  "Arabic",
  "German",
  "French",
  "Urdu",
  "Spanish",
  "Portuguese",
  "Italian",
  "Korean",
  "Hindi",
  "Turkish",
  "Russian",
];

const SETTINGS_VOICES = [
  {
    id: "Zeenora",
    name: "Zeenora",
    gender: "Female",
    description: "ShezoraX female AI voice",
  },
  {
    id: "Faaz",
    name: "Faaz",
    gender: "Male",
    description: "ShezoraX male AI voice",
  },
];

const SETTINGS_SECTIONS = [
  {
    id: "General",
    icon: "⚙",
    title: "General",
    description: "Language, voice and general preferences",
  },
  {
    id: "Profile",
    icon: "◉",
    title: "Profile",
    description: "Manage your ShezoraX profile and account",
  },
  {
    id: "Google Account",
    icon: "G",
    title: "Google Account",
    description: "Manage your Google connection",
  },
  {
    id: "Apple ID",
    icon: "",
    title: "Apple ID",
    description: "Manage your Apple account connection",
  },
  {
    id: "Religion & Faith",
    icon: "☾",
    title: "Religion & Faith",
    description: "Manage faith and religious preferences",
  },
];

function App() {
  const [activePage, setActivePage] = useState("Home");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDraft, setProjectDraft] = useState("");
  const [projectMessages, setProjectMessages] = useState({});
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectListening, setProjectListening] = useState(false);
  const [projectTab, setProjectTab] = useState("chat");
  const [projectNotes, setProjectNotes] = useState({});
  const [projectCopied, setProjectCopied] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [autoSpeakProject, setAutoSpeakProject] = useState(true);

  const [settingsSection, setSettingsSection] = useState("General");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedVoice, setSelectedVoice] = useState("Zeenora");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);

  const voiceTargetRef = useRef("general");
  const recognitionRef = useRef(null);
  const chatInputRef = useRef(null);
  const projectInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* =========================================================
     LOCAL PROJECT MEMORY
     Keeps project chats and notes available after refresh.
     ========================================================= */
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("shezorax-project-messages");
      const savedNotes = localStorage.getItem("shezorax-project-notes");

      if (savedMessages) {
        setProjectMessages(JSON.parse(savedMessages));
      }

      if (savedNotes) {
        setProjectNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.warn("ShezoraX local project memory could not be restored.", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "shezorax-project-messages",
        JSON.stringify(projectMessages)
      );
    } catch (error) {
      console.warn("Project messages could not be saved.", error);
    }
  }, [projectMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "shezorax-project-notes",
        JSON.stringify(projectNotes)
      );
    } catch (error) {
      console.warn("Project notes could not be saved.", error);
    }
  }, [projectNotes]);

  /* =========================================================
     VOICE INPUT
     One recognition instance serves Home + every project chat.
     ========================================================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (voiceTargetRef.current === "project") {
        setProjectListening(true);
      } else {
        setIsListening(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setProjectListening(false);
    };

    recognition.onerror = (event) => {
      console.warn("ShezoraX voice recognition error:", event?.error);
      setIsListening(false);
      setProjectListening(false);
    };

    recognition.onresult = (event) => {
      const transcript =
        event?.results?.[0]?.[0]?.transcript?.trim() || "";

      if (!transcript) return;

      if (voiceTargetRef.current === "project") {
        setProjectDraft((previous) =>
          previous ? `${previous} ${transcript}` : transcript
        );
      } else {
        setMessage((previous) =>
          previous ? `${previous} ${transcript}` : transcript
        );
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }
      recognitionRef.current = null;
    };
  }, []);

  /* =========================================================
     VOICE OUTPUT
     ========================================================= */
  const speakText = (text, force = false) => {
    if (!("speechSynthesis" in window) || !text) {
      return;
    }

    if (!force && !voiceReplies) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const preferredVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();

      if (selectedVoice === "Zeenora") {
        return (
          voice.lang.startsWith("en") &&
          (
            name.includes("zira") ||
            name.includes("samantha") ||
            name.includes("aria") ||
            name.includes("jenny") ||
            name.includes("ava") ||
            name.includes("susan") ||
            name.includes("female")
          )
        );
      }

      return (
        voice.lang.startsWith("en") &&
        !(
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("aria") ||
          name.includes("jenny") ||
          name.includes("ava") ||
          name.includes("susan") ||
          name.includes("female")
        )
      );
    });

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.98;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSettingsSection = (section) => {
    setSettingsSection(section);
    setAccountOpen(false);
  };

  const handleDeleteAllChats = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all ShezoraX chats?"
    );

    if (!confirmed) return;

    setMessages([]);
    setProjectMessages({});
    setProjectNotes({});

    localStorage.removeItem("shezorax-project-messages");
    localStorage.removeItem("shezorax-project-notes");

    alert("All chats have been deleted.");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your ShezoraX account?"
    );

    if (!confirmed) return;

    alert(
      "Account deletion requires a real authentication backend. Your local project data can be removed separately."
    );
  };

  const handleLogoutAllDevices = () => {
    alert(
      "Log out of all devices requires a real authentication/session backend."
    );
  };

  const handleGoogleConnect = () => {
    setGoogleConnected(true);

    alert(
      "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication."
    );
  };

  const handleAppleConnect = () => {
    setAppleConnected(true);

    alert(
      "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication."
    );
  };

  const startListening = (target = "general") => {
    if (!recognitionRef.current) {
      alert(
        "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge."
      );
      return;
    }

    const currentlyListening =
      target === "project" ? projectListening : isListening;

    if (currentlyListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }
      return;
    }

    voiceTargetRef.current = target;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.warn("Voice recognition could not start:", error);
    }
  };

  /* =========================================================
     GENERAL AI CHAT
     ========================================================= */
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
      const response = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI response failed");
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

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          text:
            "I'm unable to connect to the AI service right now. Please check that the ShezoraX backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PROJECT AI CHAT
     Every project type has isolated context + voice.
     ========================================================= */
  const sendProjectMessage = async (customMessage) => {
    if (!selectedProject || projectLoading) {
      return;
    }

    const text =
      typeof customMessage === "string"
        ? customMessage.trim()
        : projectDraft.trim();

    if (!text) {
      return;
    }

    const project = getProjectType(selectedProject);
    const existing = projectMessages[selectedProject] || [];

    const userItem = {
      role: "user",
      text,
    };

    setProjectMessages((previous) => ({
      ...previous,
      [selectedProject]: [...existing, userItem],
    }));

    setProjectDraft("");
    setProjectLoading(true);
    setProjectTab("chat");

    try {
      const recentContext = [...existing, userItem]
        .slice(-10)
        .map(
          (item) =>
            `${item.role === "user" ? "User" : "ShezoraX"}: ${item.text}`
        )
        .join("\n");

      const savedNote = projectNotes[selectedProject] || "";

      const response = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            `You are ShezoraX working inside a ${project.title} workspace. ` +
            `Help the user plan, build and complete this project. ` +
            `Give practical, structured answers. Keep the project type in context. ` +
            `Do not pretend to create files or deploy code unless the user actually provides the required tools/files.\n\n` +
            `Project type: ${project.title}\n` +
            `Project notes: ${savedNote || "No saved notes yet."}\n\n` +
            `Recent conversation:\n${recentContext}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Project AI response failed"
        );
      }

      const reply =
        data.reply ||
        "I received your project request, but no response was returned.";

      setProjectMessages((previous) => ({
        ...previous,
        [selectedProject]: [
          ...(previous[selectedProject] || []),
          {
            role: "ai",
            text: reply,
          },
        ],
      }));

      if (autoSpeakProject) {
        speakText(reply);
      }
    } catch (error) {
      console.error("ShezoraX Project Error:", error);

      setProjectMessages((previous) => ({
        ...previous,
        [selectedProject]: [
          ...(previous[selectedProject] || []),
          {
            role: "ai",
            text:
              "I'm unable to connect to the AI service right now. Please check that the ShezoraX backend is running.",
          },
        ],
      }));
    } finally {
      setProjectLoading(false);
    }
  };

  const openProject = (projectId) => {
    setSelectedProject(projectId);
    setActivePage("Projects");
    setProjectDraft("");
    setProjectTab("chat");
    setAccountOpen(false);
  };

  const closeProject = () => {
    setSelectedProject(null);
    setProjectDraft("");
    setProjectTab("chat");
  };

  const clearProjectChat = () => {
    if (!selectedProject) return;

    const project = getProjectType(selectedProject);

    if (
      !window.confirm(
        `Clear the ${project.title} conversation?`
      )
    ) {
      return;
    }

    setProjectMessages((previous) => {
      const next = { ...previous };
      delete next[selectedProject];
      return next;
    });

    stopSpeaking();
  };

  const updateProjectNote = (value) => {
    if (!selectedProject) return;

    setProjectNotes((previous) => ({
      ...previous,
      [selectedProject]: value,
    }));
  };

  const copyProjectConversation = async () => {
    if (!selectedProject) return;

    const project = getProjectType(selectedProject);
    const chat = projectMessages[selectedProject] || [];

    if (!chat.length) {
      return;
    }

    const text = [
      `ShezoraX — ${project.title}`,
      "",
      ...chat.map(
        (item) =>
          `${item.role === "user" ? "You" : "ShezoraX"}:\n${item.text}`
      ),
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setProjectCopied(true);
      window.setTimeout(() => setProjectCopied(false), 1400);
    } catch (error) {
      console.warn("Could not copy project conversation.", error);
    }
  };

  const downloadProjectBrief = () => {
    if (!selectedProject) return;

    const project = getProjectType(selectedProject);
    const chat = projectMessages[selectedProject] || [];
    const note = projectNotes[selectedProject] || "";

    const content = [
      "SHEZORAX PROJECT BRIEF",
      "=======================",
      `Project Type: ${project.title}`,
      "",
      "Project Notes:",
      note || "No notes added.",
      "",
      "Conversation:",
      ...(
        chat.length
          ? chat.map(
              (item) =>
                `${item.role === "user" ? "You" : "ShezoraX"}:\n${item.text}\n`
            )
          : ["No conversation yet."]
      ),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `${project.id}-shezorax-project-brief.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const triggerRocketLaunch = (button) => {
    if (button) {
      button.classList.remove("rocket-launching");
      void button.offsetWidth;
      button.classList.add("rocket-launching");

      window.setTimeout(() => {
        button.classList.remove("rocket-launching");
      }, 900);
    }

    window.dispatchEvent(
      new CustomEvent("shezorax:rocket-launch")
    );
  };

  const handleGeneralKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleProjectKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendProjectMessage();
    }
  };

  const focusGeneralChat = () => {
    setActivePage("AI Chat");

    window.setTimeout(() => {
      chatInputRef.current?.focus();
    }, 40);
  };

  const suggestions = [
    "Explain something to me",
    "Help me plan my day",
    "Teach me about the universe",
    "Help me build a project",
  ];

  const renderGeneralChat = () => (
    <section className="chat-section module-chat-section">
      <div className="chat-card">
        <div className="chat-header">
          <div>
            <span className="eyebrow">PERSONAL AI</span>
            <h2>Talk with ShezoraX</h2>
          </div>

          <button
            type="button"
            className={
              "voice-button " +
              (isListening ? "active" : "")
            }
            onClick={() => startListening("general")}
          >
            {isListening ? "Listening…" : "Speak"}
          </button>
        </div>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="empty-chat-state">
              <span>READY</span>
              <strong>Start a conversation with ShezoraX.</strong>
              <p>
                Ask a question, explain a problem, or describe what you want
                to build.
              </p>
            </div>
          ) : (
            messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  "message-row " +
                  (item.role === "user"
                    ? "user-message"
                    : "ai-message")
                }
              >
                <span className="message-role">
                  {item.role === "user" ? "YOU" : "SHEZORAX"}
                </span>
                <div className="message-bubble">
                  {item.text}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message-row ai-message">
              <span className="message-role">SHEZORAX</span>
              <div className="message-bubble typing">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="prompt-box">
          <textarea
            ref={chatInputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleGeneralKeyDown}
            placeholder="Ask ShezoraX anything…"
            aria-label="Message ShezoraX"
            rows={3}
          />

          <div className="prompt-actions">
            <span>Enter to send · Shift + Enter for a new line</span>

            <div className="prompt-action-group">
              <button
                type="button"
                className={
                  "listen-button " +
                  (isListening ? "active" : "")
                }
                onClick={() => startListening("general")}
              >
                {isListening ? "Stop mic" : "Voice"}
              </button>

              <button
                type="button"
                className="send-button rocket-send-button"
                onClick={(event) => {
                  triggerRocketLaunch(event.currentTarget);
                  sendMessage();
                }}
                disabled={loading || !message.trim()}
                aria-label="Send message"
                title="Send"
              >
                <span className="send-rocket-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" role="img">
                    <path
                      d="M19.8 3.2c4.2.1 7.9 3.7 8.9 8.7.7 3.5-.2 6.8-2.8 9.3l-3.2 3.2-3.6-3.6-4.4 4.4-2.3-2.3 4.4-4.4-3.6-3.6 3.2-3.2c2.5-2.5 5.2-3.5 8.4-3.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M11.2 18.8 6 20.1l-1.8 5.7 5.7-1.8 1.3-5.2-5.7 1.8Z"
                      fill="currentColor"
                      opacity=".7"
                    />
                    <circle
                      cx="21.4"
                      cy="11.8"
                      r="2.1"
                      fill="#020308"
                    />
                    <path
                      d="M17.2 23.2c-.9 1.8-1.2 3.7-.8 5.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="send-rocket-label">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderProjectWorkspace = () => {
    if (!selectedProject) {
      return (
        <section className="module-page">
          <div className="module-card projects-module-card">
            <div className="module-heading-row">
              <div>
                <span className="eyebrow">PROJECTS</span>
                <h1>Build something with ShezoraX</h1>
                <p>
                  Choose a project type. Each workspace has its own AI chat,
                  voice input, voice replies, notes and saved conversation.
                </p>
              </div>
            </div>

            <div className="project-grid project-grid-wide">
              {PROJECT_TYPES.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-type-card"
                  onClick={() => openProject(project.id)}
                >
                  <span className="project-type-icon">
                    {project.icon}
                  </span>
                  <strong>{project.title}</strong>
                  <span>{project.description}</span>
                  <small>Open project workspace →</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    const project = getProjectType(selectedProject);
    const activeProjectMessages =
      projectMessages[selectedProject] || [];
    const currentNote = projectNotes[selectedProject] || "";

    return (
      <section className="module-page project-workspace-page">
        <div className="module-card project-workspace-card">
          <div className="project-workspace-head">
            <div>
              <button
                type="button"
                className="workspace-back-button"
                onClick={closeProject}
              >
                ← All Projects
              </button>

              <span className="eyebrow">PROJECT WORKSPACE</span>
              <h1>{project.title}</h1>
              <p>{project.description}</p>
            </div>

            <div className="workspace-head-actions">
              <button
                type="button"
                className="secondary-module-button"
                onClick={downloadProjectBrief}
              >
                Export
              </button>

              <button
                type="button"
                className="secondary-module-button danger-soft"
                onClick={clearProjectChat}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="project-tabs" role="tablist">
            {[
              ["chat", "AI Chat"],
              ["plan", "Project Plan"],
              ["notes", "Notes"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={projectTab === id}
                className={
                  projectTab === id ? "active" : ""
                }
                onClick={() => setProjectTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {projectTab === "chat" && (
            <div className="project-chat-panel">
              <div className="project-chat-conversation">
                {activeProjectMessages.length === 0 ? (
                  <div className="empty-chat-state project-empty-state">
                    <span>{project.icon}</span>
                    <strong>
                      Tell ShezoraX what you want to build.
                    </strong>
                    <p>
                      Describe your idea, requirements, deadline, technology,
                      assignment instructions or any problem you need solved.
                    </p>
                  </div>
                ) : (
                  activeProjectMessages.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={
                        "message-row " +
                        (item.role === "user"
                          ? "user-message"
                          : "ai-message")
                      }
                    >
                      <span className="message-role">
                        {item.role === "user"
                          ? "YOU"
                          : "SHEZORAX"}
                      </span>

                      <div className="message-bubble">
                        {item.text}
                      </div>

                      {item.role === "ai" && (
                        <button
                          type="button"
                          className="listen-button response-listen-button"
                          onClick={() => speakText(item.text, true)}
                        >
                          🔊 Speak
                        </button>
                      )}
                    </div>
                  ))
                )}

                {projectLoading && (
                  <div className="message-row ai-message">
                    <span className="message-role">SHEZORAX</span>
                    <div className="message-bubble typing">
                      Working on your project…
                    </div>
                  </div>
                )}
              </div>

              <div className="prompt-box project-prompt-box">
                <textarea
                  ref={projectInputRef}
                  value={projectDraft}
                  onChange={(event) =>
                    setProjectDraft(event.target.value)
                  }
                  onKeyDown={handleProjectKeyDown}
                  placeholder={`Describe your ${project.title.toLowerCase()} request…`}
                  aria-label={`Message ShezoraX about ${project.title}`}
                  rows={4}
                />

                <div className="prompt-actions">
                  <span>
                    {projectListening
                      ? "Listening… speak now"
                      : "Voice + text supported"}
                  </span>

                  <div className="prompt-action-group">
                    <button
                      type="button"
                      className={
                        "listen-button " +
                        (projectListening ? "active" : "")
                      }
                      onClick={() => startListening("project")}
                    >
                      {projectListening
                        ? "Stop mic"
                        : "Voice"}
                    </button>

                    <button
                      type="button"
                      className="send-button rocket-send-button"
                      onClick={(event) => {
                        triggerRocketLaunch(event.currentTarget);
                        sendProjectMessage();
                      }}
                      disabled={
                        projectLoading ||
                        !projectDraft.trim()
                      }
                      aria-label="Send project request"
                      title="Send project request"
                    >
                      <span
                        className="send-rocket-icon"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 32 32" role="img">
                          <path
                            d="M19.8 3.2c4.2.1 7.9 3.7 8.9 8.7.7 3.5-.2 6.8-2.8 9.3l-3.2 3.2-3.6-3.6-4.4 4.4-2.3-2.3 4.4-4.4-3.6-3.6 3.2-3.2c2.5-2.5 5.2-3.5 8.4-3.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M11.2 18.8 6 20.1l-1.8 5.7-2.3-2.3 1.8-5.7 5.2-1.3-1.8 5.7Z"
                            fill="currentColor"
                            opacity=".7"
                          />
                          <circle
                            cx="21.4"
                            cy="11.8"
                            r="2.1"
                            fill="#020308"
                          />
                          <path
                            d="M17.2 23.2c-.9 1.8-1.2 3.7-.8 5.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <span className="send-rocket-label">
                        Send
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {projectTab === "plan" && (
            <div className="project-plan-panel">
              <div className="plan-intro">
                <span className="eyebrow">WORKFLOW</span>
                <h2>Build your project step by step</h2>
                <p>
                  Use these stages to keep the project organized. You can ask
                  ShezoraX to handle any stage from the AI Chat tab.
                </p>
              </div>

              <div className="project-plan-grid">
                {[
                  ["01", "Define", "Explain the goal, audience and final result."],
                  ["02", "Plan", "Choose features, technology and milestones."],
                  ["03", "Build", "Create the code, content or project material."],
                  ["04", "Test", "Review errors, requirements and edge cases."],
                  ["05", "Polish", "Improve design, quality and presentation."],
                  ["06", "Deliver", "Prepare the final files, documentation or presentation."],
                ].map(([number, title, text]) => (
                  <button
                    type="button"
                    className="plan-step-card"
                    key={number}
                    onClick={() =>
                      sendProjectMessage(
                        `Help me with project stage ${number}: ${title}. ${text}`
                      )
                    }
                  >
                    <span>{number}</span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                    <em>Ask ShezoraX →</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          {projectTab === "notes" && (
            <div className="project-notes-panel">
              <div className="plan-intro">
                <span className="eyebrow">PROJECT MEMORY</span>
                <h2>Project notes</h2>
                <p>
                  Save requirements, links, deadlines, technologies or other
                  context. Notes stay on this device and are included in future
                  project AI requests.
                </p>
              </div>

              <textarea
                className="project-notes-input"
                value={currentNote}
                onChange={(event) =>
                  updateProjectNote(event.target.value)
                }
                placeholder="Example: React + Node.js, deadline Friday, must be mobile responsive…"
              />

              <div className="notes-footer">
                <span>
                  {currentNote.length} characters · saved locally
                </span>
                <button
                  type="button"
                  className="primary-module-button"
                  onClick={() => setProjectTab("chat")}
                >
                  Back to Chat
                </button>
              </div>
            </div>
          )}

          <div className="project-workspace-footer">
            <span>
              {project.title} ·{" "}
              {activeProjectMessages.length} messages
            </span>

            <button
              type="button"
              className="listen-button"
              onClick={copyProjectConversation}
              disabled={!activeProjectMessages.length}
            >
              {projectCopied ? "Copied" : "Copy conversation"}
            </button>
          </div>
        </div>
      </section>
    );
  };

  const renderModule = () => {
    if (activePage === "Home") {
      return (
        <>
          <section className="hero-section">
            <div className="hero-content">
              <div className="status-pill">
                <span className="status-dot" />
                ShezoraX AI Online
              </div>

              <h1 className="greeting">
                {getGreeting()}, Owais.
              </h1>

              <p className="hero-description">
                Your intelligent personal AI workspace for learning, creating,
                exploring and getting things done.
              </p>

              <div className="hero-time">
                <strong>{formatTime(currentTime)}</strong>
                <span>{formatDate(currentTime)}</span>
              </div>
            </div>
          </section>

          <section className="chat-section">
            <div className="chat-card">
              <div className="chat-header">
                <div>
                  <span className="eyebrow">PERSONAL AI</span>
                  <h2>What can I help you with?</h2>
                </div>

                <button
                  type="button"
                  className={
                    "voice-button " +
                    (isListening ? "active" : "")
                  }
                  onClick={() => startListening("general")}
                >
                  {isListening ? "Listening…" : "Speak"}
                </button>
              </div>

              <div className="conversation">
                {messages.length === 0 ? (
                  <div className="empty-chat-state">
                    <span>READY</span>
                    <strong>
                      Ask ShezoraX anything.
                    </strong>
                    <p>
                      You can also use the microphone or one of the quick
                      prompts below.
                    </p>
                  </div>
                ) : (
                  messages.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={
                        "message-row " +
                        (item.role === "user"
                          ? "user-message"
                          : "ai-message")
                      }
                    >
                      <span className="message-role">
                        {item.role === "user"
                          ? "YOU"
                          : "SHEZORAX"}
                      </span>
                      <div className="message-bubble">
                        {item.text}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="message-row ai-message">
                    <span className="message-role">SHEZORAX</span>
                    <div className="message-bubble typing">
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              <div className="prompt-box">
                <textarea
                  ref={chatInputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleGeneralKeyDown}
                  placeholder="Ask ShezoraX anything…"
                  rows={3}
                />

                <div className="prompt-actions">
                  <span>Voice input is available</span>

                  <div className="prompt-action-group">
                    <button
                      type="button"
                      className={
                        "listen-button " +
                        (isListening ? "active" : "")
                      }
                      onClick={() => startListening("general")}
                    >
                      {isListening ? "Stop mic" : "Voice"}
                    </button>

                    <button
                      type="button"
                      className="send-button rocket-send-button"
                      onClick={(event) => {
                        triggerRocketLaunch(event.currentTarget);
                        sendMessage();
                      }}
                      disabled={loading || !message.trim()}
                      aria-label="Launch and send message"
                      title="Launch & Send"
                    >
                      <span
                        className="send-rocket-icon"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 32 32" role="img">
                          <path
                            d="M19.8 3.2c4.2.1 7.9 3.7 8.9 8.7.7 3.5-.2 6.8-2.8 9.3l-3.2 3.2-3.6-3.6-4.4 4.4-2.3-2.3 4.4-4.4-3.6-3.6 3.2-3.2c2.5-2.5 5.2-3.5 8.4-3.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M11.2 18.8 6 20.1l-1.8 5.7-1.8 5.7 5.7-1.8 1.3-5.2Z"
                            fill="currentColor"
                            opacity=".7"
                          />
                          <circle
                            cx="21.4"
                            cy="11.8"
                            r="2.1"
                            fill="#020308"
                          />
                          <path
                            d="M17.2 23.2c-.9 1.8-1.2 3.7-.8 5.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <span className="send-rocket-label">Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="suggestion-section">
            <span className="eyebrow">EXPLORE SHEZORAX</span>

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
        <section className="module-page full-module-page">
          <div className="full-module-width">
            {renderGeneralChat()}
          </div>
        </section>
      );
    }

    if (activePage === "Create") {
      return (
        <section className="module-page">
          <div className="module-card create-module-card">
            <span className="eyebrow">CREATE</span>
            <h1>Choose what you want to create</h1>
            <p>
              Select a project type and ShezoraX will open a dedicated
              workspace with its own AI conversation and voice controls.
            </p>

            <div className="project-grid">
              {PROJECT_TYPES.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-type-card"
                  onClick={() => openProject(project.id)}
                >
                  <span className="project-type-icon">
                    {project.icon}
                  </span>
                  <strong>{project.title}</strong>
                  <span>{project.description}</span>
                  <small>Start with ShezoraX →</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activePage === "Projects") {
      return renderProjectWorkspace();
    }

    if (activePage === "Knowledge") {
      const topics = [
        "Universe & Space",
        "Earth",
        "Science",
        "Technology",
        "Programming",
        "History",
        "Mathematics",
        "Physics",
      ];

      return (
        <section className="module-page">
          <div className="module-card knowledge-module-card">
            <span className="eyebrow">KNOWLEDGE</span>
            <h1>Knowledge Universe</h1>
            <p>
              Pick a topic and ShezoraX will open the AI chat with a focused
              question.
            </p>

            <div className="knowledge-actions">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="project-type-card"
                  onClick={() =>
                    sendMessage(
                      `Teach me about ${topic}. Give me a clear, accurate and structured explanation.`
                    )
                  }
                >
                  <strong>{topic}</strong>
                  <span>Ask ShezoraX →</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

        if (activePage === "Settings") {
      return (
        <section className="module-page">
          <div className="settings-page">

            <div className="settings-header">
              <div>
                <span className="eyebrow">SETTINGS</span>
                <h1>Settings</h1>
                <p>
                  Manage your ShezoraX preferences, account and personal
                  experience.
                </p>
              </div>
            </div>

            <div className="settings-layout">

              <aside className="settings-sidebar">
                <div className="settings-sidebar-title">
                  Settings
                </div>

                <div className="settings-navigation">
                  {SETTINGS_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={
                        "settings-navigation-item " +
                        (settingsSection === section.id ? "active" : "")
                      }
                      onClick={() =>
                        handleSettingsSection(section.id)
                      }
                    >
                      <span className="settings-navigation-icon">
                        {section.icon}
                      </span>

                      <span className="settings-navigation-copy">
                        <strong>{section.title}</strong>
                        <small>{section.description}</small>
                      </span>

                      <span className="settings-navigation-arrow">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="settings-content">

                {settingsSection === "General" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">GENERAL</span>
                      <h2>General</h2>
                      <p>
                        Control the language and voice experience of
                        ShezoraX.
                      </p>
                    </div>

                    <div className="settings-group">

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>Language</strong>
                          <span>
                            Choose the language used throughout the
                            ShezoraX interface.
                          </span>
                        </div>

                        <select
                          className="settings-select"
                          value={selectedLanguage}
                          onChange={(event) =>
                            setSelectedLanguage(event.target.value)
                          }
                        >
                          {SETTINGS_LANGUAGES.map((language) => (
                            <option
                              key={language}
                              value={language}
                            >
                              {language}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="settings-item settings-item-column">
                        <div className="settings-item-copy">
                          <strong>Voice</strong>
                          <span>
                            Choose the AI voice ShezoraX uses for
                            spoken responses.
                          </span>
                        </div>

                        <div className="settings-voice-list">
                          {SETTINGS_VOICES.map((voice) => (
                            <button
                              key={voice.id}
                              type="button"
                              className={
                                "settings-voice-option " +
                                (selectedVoice === voice.id
                                  ? "active"
                                  : "")
                              }
                              onClick={() =>
                                setSelectedVoice(voice.id)
                              }
                            >
                              <span className="settings-voice-avatar">
                                {voice.gender === "Female"
                                  ? "♀"
                                  : "♂"}
                              </span>

                              <span className="settings-voice-copy">
                                <strong>{voice.name}</strong>
                                <small>
                                  {voice.gender} · {voice.description}
                                </small>
                              </span>

                              <span className="settings-check">
                                {selectedVoice === voice.id
                                  ? "✓"
                                  : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>AI voice replies</strong>
                          <span>
                            ShezoraX speaks general AI responses when
                            browser speech synthesis is available.
                          </span>
                        </div>

                        <button
                          type="button"
                          className={
                            "settings-toggle " +
                            (voiceReplies ? "active" : "")
                          }
                          onClick={() =>
                            setVoiceReplies(
                              (previous) => !previous
                            )
                          }
                          aria-pressed={voiceReplies}
                        >
                          {voiceReplies ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>Project voice replies</strong>
                          <span>
                            Automatically speak responses inside
                            project workspaces.
                          </span>
                        </div>

                        <button
                          type="button"
                          className={
                            "settings-toggle " +
                            (autoSpeakProject ? "active" : "")
                          }
                          onClick={() =>
                            setAutoSpeakProject(
                              (previous) => !previous
                            )
                          }
                          aria-pressed={autoSpeakProject}
                        >
                          {autoSpeakProject ? "ON" : "OFF"}
                        </button>
                      </div>

                    </div>

                    <div className="settings-actions">
                      <button
                        type="button"
                        className="primary-module-button"
                        onClick={() =>
                          speakText(
                            `Hello Owais. This is ${selectedVoice}.`,
                            true
                          )
                        }
                      >
                        Test Voice
                      </button>

                      <button
                        type="button"
                        className="secondary-module-button"
                        onClick={() =>
                          startListening("general")
                        }
                      >
                        Test Microphone
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Profile" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">PROFILE</span>
                      <h2>Profile</h2>
                      <p>
                        Manage your ShezoraX account and personal
                        data.
                      </p>
                    </div>

                    <div className="settings-group">

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>Google email</strong>
                          <span>
                            Connected account
                          </span>
                        </div>

                        <div className="settings-account-value">
                          ow••••@gmail.com
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-action-item"
                        onClick={handleLogoutAllDevices}
                      >
                        <span>
                          <strong>
                            Log out of all devices
                          </strong>
                          <small>
                            End active ShezoraX sessions on other
                            devices.
                          </small>
                        </span>

                        <b>→</b>
                      </button>

                      <button
                        type="button"
                        className="settings-action-item danger"
                        onClick={handleDeleteAllChats}
                      >
                        <span>
                          <strong>Delete all chats</strong>
                          <small>
                            Remove your ShezoraX conversations and
                            project chat memory from this device.
                          </small>
                        </span>

                        <b>→</b>
                      </button>

                      <button
                        type="button"
                        className="settings-action-item danger"
                        onClick={handleDeleteAccount}
                      >
                        <span>
                          <strong>Delete account</strong>
                          <small>
                            Permanently delete your ShezoraX account
                            when account authentication is connected.
                          </small>
                        </span>

                        <b>→</b>
                      </button>

                    </div>
                  </div>
                )}

                {settingsSection === "Google Account" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">
                        GOOGLE ACCOUNT
                      </span>

                      <h2>Google Account</h2>

                      <p>
                        Connect your Google account to use account
                        authentication with ShezoraX.
                      </p>
                    </div>

                    <div className="settings-provider-card google-provider">
                      <div className="settings-provider-icon">
                        G
                      </div>

                      <div className="settings-provider-copy">
                        <strong>Google</strong>

                        <span>
                          {googleConnected
                            ? "Google connection is ready."
                            : "Connect your Google account to ShezoraX."}
                        </span>

                        <small>
                          Real Google OAuth requires configured
                          authentication credentials.
                        </small>
                      </div>

                      <button
                        type="button"
                        className="settings-provider-button"
                        onClick={handleGoogleConnect}
                      >
                        {googleConnected
                          ? "Connected"
                          : "Continue with Google"}
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Apple ID" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">
                        APPLE ID
                      </span>

                      <h2>Apple ID</h2>

                      <p>
                        Connect your Apple ID to use Apple account
                        authentication with ShezoraX.
                      </p>
                    </div>

                    <div className="settings-provider-card apple-provider">
                      <div className="settings-provider-icon">
                        
                      </div>

                      <div className="settings-provider-copy">
                        <strong>Apple ID</strong>

                        <span>
                          {appleConnected
                            ? "Apple ID connection is ready."
                            : "Connect your Apple ID to ShezoraX."}
                        </span>

                        <small>
                          Real Apple Sign In requires configured
                          authentication credentials.
                        </small>
                      </div>

                      <button
                        type="button"
                        className="settings-provider-button"
                        onClick={handleAppleConnect}
                      >
                        {appleConnected
                          ? "Connected"
                          : "Continue with Apple"}
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Religion & Faith" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">
                        RELIGION & FAITH
                      </span>

                      <h2>Religion & Faith</h2>

                      <p>
                        Manage the religious and faith-related
                        preferences used by ShezoraX.
                      </p>
                    </div>

                    <div className="settings-group">

                      <div className="settings-info-card">
                        <strong>Faith preferences</strong>

                        <span>
                          This area is reserved for your religious
                          knowledge, prayer and faith-related
                          preferences.
                        </span>
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>Religious knowledge</strong>
                          <span>
                            ShezoraX can keep religious topics separate
                            from general application preferences.
                          </span>
                        </div>

                        <span className="settings-status">
                          Ready
                        </span>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="app dark-mode">
      <div className="real-universe-background">
        <SpaceScene />
        <div className="universe-overlay" />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-orbit">S</div>

          <div>
            <strong>ShezoraX</strong>
            <span>PERSONAL AI</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {[
            ["Home", "⌂"],
            ["AI Chat", "✦"],
            ["Create", "＋"],
            ["Projects", "▣"],
            ["Knowledge", "◎"],
            ["Settings", "⚙"],
          ].map(([item, icon]) => (
            <button
              type="button"
              key={item}
              className={activePage === item ? "active" : ""}
              onClick={() => {
                setActivePage(item);
                setAccountOpen(false);

                if (item !== "Projects") {
                  setSelectedProject(null);
                }
              }}
            >
              <span aria-hidden="true">{icon}</span>
              <span className="nav-label">{item}</span>
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
            onClick={() =>
              setAccountOpen((open) => !open)
            }
            aria-expanded={accountOpen}
            aria-label="Open ShezoraX account"
            title="Account"
          >
            <span className="profile-avatar">OA</span>

            <span className="profile-copy">
              <strong>Owais</strong>
              <span>Account</span>
            </span>

            <span className="profile-chevron">
              {accountOpen ? "⌃" : "⌄"}
            </span>
          </button>

          {accountOpen && (
            <div className="account-panel">
              <span className="eyebrow">ACCOUNT</span>
              <h3>Owais Ahmed Sheikh</h3>
              <p>
                Connect a provider to add account authentication to ShezoraX.
              </p>

              <button
                type="button"
                className="account-provider-button"
                onClick={() =>
                  alert(
                    "Google Sign-In UI is ready. Real Google OAuth requires a configured authentication provider/backend."
                  )
                }
              >
                <span>G</span>
                Continue with Google
              </button>

              <button
                type="button"
                className="account-provider-button"
                onClick={() =>
                  alert(
                    "Apple ID Sign-In UI is ready. Real Apple OAuth requires a configured authentication provider/backend."
                  )
                }
              >
                <span></span>
                Continue with Apple ID
              </button>

              <small>
                Provider authentication is intentionally not faked. OAuth
                credentials must be configured before real sign-in is enabled.
              </small>
            </div>
          )}
        </div>
      </aside>

      <main className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>ShezoraX</span>
            <b>/</b>
            <strong>
              {selectedProject && activePage === "Projects"
                ? getProjectType(selectedProject).title
                : activePage}
            </strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={focusGeneralChat}
              title="Open AI Chat"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage("Knowledge");
                setSelectedProject(null);
              }}
            >
              Knowledge
            </button>

            <button
              type="button"
              className="upgrade-button"
              onClick={() => setActivePage("Settings")}
            >
              Settings
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
