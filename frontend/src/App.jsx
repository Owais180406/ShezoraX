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
          float lightSide = dot(normalize(vNormal), normalize(uSunDirection));
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
       SPACECRAFT — small rocket that launches when user sends chat
    ========================================================= */

    const spacecraftGroup = new THREE.Group();

    const bodyGeometry = new THREE.ConeGeometry(0.18, 0.6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = -Math.PI / 2;
    spacecraftGroup.add(body);

    const flameGeometry = new THREE.ConeGeometry(0.12, 0.4, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.rotation.z = Math.PI / 2;
    flame.position.x = -0.5;
    flame.visible = false;
    spacecraftGroup.add(flame);

    const flameCoreGeometry = new THREE.ConeGeometry(0.06, 0.25, 8);
    const flameCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.9,
    });
    const flameCore = new THREE.Mesh(flameCoreGeometry, flameCoreMaterial);
    flameCore.rotation.z = Math.PI / 2;
    flameCore.position.x = -0.45;
    flameCore.visible = false;
    spacecraftGroup.add(flameCore);

    spacecraftGroup.position.set(10.5, -5.2, -6.5);
    spacecraftGroup.rotation.z = -0.18;
    scene.add(spacecraftGroup);

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

function getCreateTool(id) {
  return (
    CREATE_TOOLS.find((item) => item.id === id) ||
    CREATE_TOOLS[0]
  );
}


const CREATE_TOOLS = [
  {
    id: "image-create",
    title: "Image Create",
    icon: "IMG",
    description: "Create images, concepts, scenes, portraits and visual ideas with AI.",
    suggestions: [
      "Create a cinematic space scene",
      "Create a professional profile image",
      "Create a futuristic city concept",
      "Create a realistic product image",
    ],
  },
  {
    id: "video-create",
    title: "Video Create",
    icon: "VID",
    description: "Plan and create video concepts, scenes, scripts and visual directions.",
    suggestions: [
      "Create a cinematic video concept",
      "Create a short promotional video",
      "Create a futuristic story video",
      "Create a social media video idea",
    ],
  },
  {
    id: "image-editing",
    title: "Photo / Image Editing",
    icon: "EDIT",
    description: "Improve, transform, retouch and creatively edit images.",
    suggestions: [
      "Improve this image professionally",
      "Remove unwanted objects",
      "Create a cinematic color grade",
      "Turn this image into a different style",
    ],
  },
  {
    id: "resume-cv",
    title: "Resume / CV",
    icon: "CV",
    description: "Create professional resumes, CVs, cover letters and career documents.",
    suggestions: [
      "Create a modern ATS-friendly CV",
      "Improve my professional summary",
      "Write a strong cover letter",
      "Improve my work experience section",
    ],
  },
  {
    id: "content-writing",
    title: "Content Writing",
    icon: "TXT",
    description: "Write articles, blogs, descriptions, captions and professional content.",
    suggestions: [
      "Write a professional blog post",
      "Create an engaging article",
      "Write a product description",
      "Create a detailed content outline",
    ],
  },
  {
    id: "presentation",
    title: "Presentation Maker",
    icon: "PPT",
    description: "Create slide structures, presentation content and speaker notes.",
    suggestions: [
      "Create a professional presentation",
      "Build a 10-slide presentation structure",
      "Write speaker notes for my slides",
      "Create a presentation outline",
    ],
  },
  {
    id: "document-creator",
    title: "Document Creator",
    icon: "DOC",
    description: "Create professional documents, proposals, letters and structured files.",
    suggestions: [
      "Create a professional proposal",
      "Write a formal document",
      "Create a business document",
      "Turn my notes into a structured document",
    ],
  },
  {
    id: "story-script",
    title: "Story & Script Writer",
    icon: "STORY",
    description: "Create stories, screenplays, scripts, characters and fictional worlds.",
    suggestions: [
      "Create a science-fiction story",
      "Write a short film script",
      "Create interesting characters",
      "Build a cinematic story outline",
    ],
  },
  {
    id: "social-media",
    title: "Social Media Creator",
    icon: "SOC",
    description: "Create captions, posts, content ideas and social media campaigns.",
    suggestions: [
      "Create an Instagram content plan",
      "Write a professional LinkedIn post",
      "Create 10 social media captions",
      "Create a one-week content calendar",
    ],
  },
  {
    id: "logo-branding",
    title: "Logo & Branding",
    icon: "BRAND",
    description: "Develop brand identities, logo concepts, names, colors and visual direction.",
    suggestions: [
      "Create a modern brand identity",
      "Develop a logo concept",
      "Create a brand color direction",
      "Build a complete branding concept",
    ],
  },
  {
    id: "music-audio",
    title: "Music & Audio",
    icon: "AUDIO",
    description: "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.",
    suggestions: [
      "Create a cinematic music concept",
      "Write lyrics for a song",
      "Create a podcast intro",
      "Write a professional voice-over script",
    ],
  },
  {
    id: "ui-visual-design",
    title: "UI / Visual Design",
    icon: "UI",
    description: "Create interface concepts, visual systems, layouts and design directions.",
    suggestions: [
      "Create a modern dashboard design",
      "Create a mobile app UI concept",
      "Design a futuristic landing page",
      "Create a visual design system",
    ],
  },
  {
    id: "diagram-infographic",
    title: "Diagram & Infographic",
    icon: "DIAG",
    description: "Create diagrams, flowcharts, infographics and visual explanations.",
    suggestions: [
      "Create a process flowchart",
      "Create an educational infographic",
      "Explain this topic with a diagram",
      "Create a professional system diagram",
    ],
  },
  {
    id: "email-message",
    title: "Email & Message Writer",
    icon: "MAIL",
    description: "Write professional emails, messages, replies, invitations and announcements.",
    suggestions: [
      "Write a professional email",
      "Write a polite reply",
      "Create a formal request",
      "Write a professional announcement",
    ],
  },
  {
    id: "study-material",
    title: "Study Material Creator",
    icon: "STUDY",
    description: "Create general study notes, flashcards, quizzes and revision material.",
    suggestions: [
      "Create revision notes",
      "Create flashcards",
      "Create a practice quiz",
      "Turn these notes into questions",
    ],
  },
  {
    id: "research-report",
    title: "Research & Report Writer",
    icon: "REPORT",
    description: "Create general reports, structured research writing and analytical documents.",
    suggestions: [
      "Create a structured report",
      "Turn my information into a research-style document",
      "Create an executive summary",
      "Organize this information into sections",
    ],
  },
  {
    id: "document-converter",
    title: "Document Converter",
    icon: "CONVERT",
    description: "Plan document transformations, formatting changes and content conversions.",
    suggestions: [
      "Convert this content into a professional format",
      "Turn notes into a formal document",
      "Convert this text into a structured outline",
      "Reformat this document professionally",
    ],
  },
  {
    id: "template-creator",
    title: "Template Creator",
    icon: "TEMP",
    description: "Create reusable templates for documents, posts, emails, planning and more.",
    suggestions: [
      "Create a professional email template",
      "Create a social media template",
      "Create a professional document template",
      "Create a reusable planning template",
    ],
  },
];

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

const LANGUAGE_LOCALES = {
  English: "en-US",
  Chinese: "zh-CN",
  Japanese: "ja-JP",
  Arabic: "ar-SA",
  German: "de-DE",
  French: "fr-FR",
  Urdu: "ur-PK",
  Spanish: "es-ES",
  Portuguese: "pt-PT",
  Italian: "it-IT",
  Korean: "ko-KR",
  Hindi: "hi-IN",
  Turkish: "tr-TR",
  Russian: "ru-RU",
};

/*
  ShezoraX UI translations.

  English is kept as the fallback language.
  The keys are English UI phrases used throughout the application.
*/
const UI_TRANSLATIONS = {
  English: {
    Home: "Home",
    "AI Chat": "AI Chat",
    Create: "Create",
    Projects: "Projects",
    Knowledge: "Knowledge",
    Settings: "Settings",

    "AI System": "AI System",
    Online: "Online",
    Account: "Account",
    Search: "Search",

    General: "General",
    Profile: "Profile",
    "Google Account": "Google Account",
    "Apple ID": "Apple ID",
    "Religion & Faith": "Religion & Faith",

    Language: "Language",
    Voice: "Voice",
    "Choose the language used throughout the ShezoraX interface.":
      "Choose the language used throughout the ShezoraX interface.",
    "Control the language and voice experience of ShezoraX.":
      "Control the language and voice experience of ShezoraX.",
    "Choose the AI voice ShezoraX uses for spoken responses.":
      "Choose the AI voice ShezoraX uses for spoken responses.",

    Connected: "Connected",
    Ready: "Ready",
    "Continue with Google": "Continue with Google",
    "Continue with Apple ID": "Continue with Apple ID",
    "Continue with Apple": "Continue with Apple",

    "Good Morning": "Good Morning",
    "Good Afternoon": "Good Afternoon",
    "Good Evening": "Good Evening",
    "Good Night": "Good Night",

    "Send": "Send",
    "Clear": "Clear",
    "Cancel": "Cancel",
    "Save": "Save",
    "Delete": "Delete",
    "Close": "Close",
    "Back": "Back",
    "Open": "Open",

    "AI System Online": "AI System Online",

    "Female": "Female",
    "Male": "Male",

    "Website / Web App": "Website / Web App",
    "School Project": "School Project",
    "College / University": "College / University",
    "Software / Desktop App": "Software / Desktop App",
    "Mobile App": "Mobile App",
    "Game Project": "Game Project",
    "Data / Research": "Data / Research",
    "Presentation / Report": "Presentation / Report",
    "Design / Creative": "Design / Creative",
    "Custom Project": "Custom Project",

    "Image Create": "Image Create",
    "Video Create": "Video Create",
    "Photo / Image Editing": "Photo / Image Editing",
    "Resume / CV": "Resume / CV",
    "Content Writing": "Content Writing",
    "Presentation Maker": "Presentation Maker",
    "Document Creator": "Document Creator",
    "Story & Script Writer": "Story & Script Writer",
    "Social Media Creator": "Social Media Creator",
    "Logo & Branding": "Logo & Branding",
    "Music & Audio": "Music & Audio",
    "UI / Visual Design": "UI / Visual Design",
    "Template Creator": "Template Creator",

    "Religion": "Religion",
    "Religious knowledge": "Religious knowledge",
    "Faith preferences": "Faith preferences",

    "Coming soon": "Coming soon",
    "Prayer times": "Prayer times",
    "Get notifications for daily prayer times based on your location.": "Get notifications for daily prayer times based on your location.",
    "Qibla direction": "Qibla direction",
    "Find the direction of prayer using your device compass.": "Find the direction of prayer using your device compass.",
    "Daily verses": "Daily verses",
    "Receive daily religious verses and reflections in your feed.": "Receive daily religious verses and reflections in your feed.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Configure how ShezoraX integrates faith-based guidance into your experience.",
    "Islam": "Islam",
    "Christianity": "Christianity",
    "Judaism": "Judaism",
    "Hinduism": "Hinduism",
    "Buddhism": "Buddhism",
    "Sikhism": "Sikhism",
    "Jainism": "Jainism",
    "Baháʼí Faith": "Baháʼí Faith",
    "Taoism": "Taoism",
    "Confucianism": "Confucianism",
    "Shinto": "Shinto",
    "Zoroastrianism": "Zoroastrianism",
    "Other / Spiritual": "Other / Spiritual",
    "No preference": "No preference",

    "ShezoraX AI Online": "ShezoraX AI Online",
    "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.":
      "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.",
    "PERSONAL AI": "PERSONAL AI",
    "What can I help you with?": "What can I help you with?",
    "Listening\u2026": "Listening\u2026",
    "Speak": "Speak",
    "READY": "READY",
    "Ask ShezoraX anything.": "Ask ShezoraX anything.",
    "You can also use the microphone or one of the quick prompts below.":
      "You can also use the microphone or one of the quick prompts below.",
    "YOU": "YOU",
    "SHEZORAX": "SHEZORAX",
    "Thinking\u2026": "Thinking\u2026",
    "Ask ShezoraX anything\u2026": "Ask ShezoraX anything\u2026",
    "Voice input is available": "Voice input is available",
    "Stop mic": "Stop mic",
    "Enter to send \u00b7 Shift + Enter for a new line":
      "Enter to send \u00b7 Shift + Enter for a new line",
    "Explain something to me": "Explain something to me",
    "Help me plan my day": "Help me plan my day",
    "Teach me about the universe": "Teach me about the universe",
    "Help me build a project": "Help me build a project",
    "EXPLORE SHEZORAX": "EXPLORE SHEZORAX",
    "Talk with ShezoraX": "Talk with ShezoraX",
    "Start a conversation with ShezoraX.":
      "Start a conversation with ShezoraX.",
    "Ask a question, explain a problem, or describe what you want to build.":
      "Ask a question, explain a problem, or describe what you want to build.",
    "Message ShezoraX": "Message ShezoraX",

    "PROJECTS": "PROJECTS",
    "Build something with ShezoraX": "Build something with ShezoraX",
    "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.":
      "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.",
    "Open project workspace \u2192": "Open project workspace \u2192",
    "\u2190 All Projects": "\u2190 All Projects",
    "PROJECT WORKSPACE": "PROJECT WORKSPACE",
    "Export": "Export",
    "Project Plan": "Project Plan",
    "Notes": "Notes",
    "Tell ShezoraX what you want to build.":
      "Tell ShezoraX what you want to build.",
    "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.":
      "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.",
    "Working on your project\u2026": "Working on your project\u2026",
    "Listening\u2026 speak now": "Listening\u2026 speak now",
    "Voice + text supported": "Voice + text supported",
    "WORKFLOW": "WORKFLOW",
    "Build your project step by step": "Build your project step by step",
    "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.":
      "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.",
    "Define": "Define",
    "Explain the goal, audience and final result.":
      "Explain the goal, audience and final result.",
    "Plan": "Plan",
    "Choose features, technology and milestones.":
      "Choose features, technology and milestones.",
    "Build": "Build",
    "Create the code, content or project material.":
      "Create the code, content or project material.",
    "Test": "Test",
    "Review errors, requirements and edge cases.":
      "Review errors, requirements and edge cases.",
    "Polish": "Polish",
    "Improve design, quality and presentation.":
      "Improve design, quality and presentation.",
    "Deliver": "Deliver",
    "Prepare the final files, documentation or presentation.":
      "Prepare the final files, documentation or presentation.",
    "Ask ShezoraX \u2192": "Ask ShezoraX \u2192",
    "PROJECT MEMORY": "PROJECT MEMORY",
    "Project notes": "Project notes",
    "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.":
      "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.",
    "Example: React + Node.js, deadline Friday, must be mobile responsive\u2026":
      "Example: React + Node.js, deadline Friday, must be mobile responsive\u2026",
    "characters \u00b7 saved locally": "characters \u00b7 saved locally",
    "Back to Chat": "Back to Chat",
    "messages": "messages",
    "Copied": "Copied",
    "Copy conversation": "Copy conversation",

    "CREATE": "CREATE",
    "Create something amazing": "Create something amazing",
    "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.":
      "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.",
    "Open workspace \u2192": "Open workspace \u2192",
    "\u2190 All Create Tools": "\u2190 All Create Tools",
    "CREATE WORKSPACE": "CREATE WORKSPACE",
    "What would you like to create?": "What would you like to create?",
    "Start with your own request or choose one of the suggestions for this creation tool.":
      "Start with your own request or choose one of the suggestions for this creation tool.",
    "Listening": "Listening",
    "SUGGESTIONS": "SUGGESTIONS",
    "Try one of these": "Try one of these",

    "Universe & Space": "Universe & Space",
    "Earth": "Earth",
    "Science": "Science",
    "Technology": "Technology",
    "Programming": "Programming",
    "History": "History",
    "Mathematics": "Mathematics",
    "Physics": "Physics",
    "KNOWLEDGE": "KNOWLEDGE",
    "Knowledge Universe": "Knowledge Universe",
    "Pick a topic and ShezoraX will open the AI chat with a focused question.":
      "Pick a topic and ShezoraX will open the AI chat with a focused question.",

    "SETTINGS": "SETTINGS",
    "Manage your ShezoraX preferences, account and personal experience.":
      "Manage your ShezoraX preferences, account and personal experience.",
    "GENERAL": "GENERAL",
    "Language, voice and general preferences":
      "Language, voice and general preferences",
    "AI voice replies": "AI voice replies",
    "ShezoraX speaks general AI responses when browser speech synthesis is available.":
      "ShezoraX speaks general AI responses when browser speech synthesis is available.",
    "ON": "ON",
    "OFF": "OFF",
    "Project voice replies": "Project voice replies",
    "Automatically speak responses inside project workspaces.":
      "Automatically speak responses inside project workspaces.",
    "Test Voice": "Test Voice",
    "Test Microphone": "Test Microphone",
    "CREATOR": "CREATOR",
    "Connect & Follow": "Connect & Follow",
    "Stay updated with my latest work and projects.":
      "Stay updated with my latest work and projects.",
    "GitHub": "GitHub",
    "Explore my projects": "Explore my projects",
    "Facebook": "Facebook",
    "Connect with me": "Connect with me",
    "Instagram": "Instagram",
    "Follow my journey": "Follow my journey",
    "LinkedIn": "LinkedIn",
    "Connect professionally": "Connect professionally",
    "Follow for updates": "Follow for updates",
    "Portfolio": "Portfolio",
    "View my work": "View my work",
    "PROFILE": "PROFILE",
    "Manage your ShezoraX account and personal data.":
      "Manage your ShezoraX account and personal data.",
    "Your name": "Your name",
    "How ShezoraX should greet you": "How ShezoraX should greet you",
    "Enter your name": "Enter your name",
    "Google email": "Google email",
    "Connected account": "Connected account",
    "Log out of all devices": "Log out of all devices",
    "End active ShezoraX sessions on other devices.":
      "End active ShezoraX sessions on other devices.",
    "Delete all chats": "Delete all chats",
    "Remove your ShezoraX conversations and project chat memory from this device.":
      "Remove your ShezoraX conversations and project chat memory from this device.",
    "Delete account": "Delete account",
    "Permanently delete your ShezoraX account when account authentication is connected.":
      "Permanently delete your ShezoraX account when account authentication is connected.",
    "GOOGLE ACCOUNT": "GOOGLE ACCOUNT",
    "Connect your Google account to use account authentication with ShezoraX.":
      "Connect your Google account to use account authentication with ShezoraX.",
    "Google": "Google",
    "Google connection is ready.": "Google connection is ready.",
    "Connect your Google account to ShezoraX.":
      "Connect your Google account to ShezoraX.",
    "Real Google OAuth requires configured authentication credentials.":
      "Real Google OAuth requires configured authentication credentials.",
    "APPLE ID": "APPLE ID",
    "Connect your Apple ID to use Apple account authentication with ShezoraX.":
      "Connect your Apple ID to use Apple account authentication with ShezoraX.",
    "Apple ID connection is ready.": "Apple ID connection is ready.",
    "Connect your Apple ID to ShezoraX.": "Connect your Apple ID to ShezoraX.",
    "Real Apple Sign In requires configured authentication credentials.":
      "Real Apple Sign In requires configured authentication credentials.",
    "RELIGION & FAITH": "RELIGION & FAITH",
    "Manage the religious and faith-related preferences used by ShezoraX.":
      "Manage the religious and faith-related preferences used by ShezoraX.",
    "This area is reserved for your religious knowledge, prayer and faith-related preferences.":
      "This area is reserved for your religious knowledge, prayer and faith-related preferences.",
    "ShezoraX can keep religious topics separate from general application preferences.":
      "ShezoraX can keep religious topics separate from general application preferences.",

    "ShezoraX female AI voice": "ShezoraX female AI voice",
    "ShezoraX male AI voice": "ShezoraX male AI voice",
    "Connect with Creator": "Connect with Creator",
    "Follow the creator behind ShezoraX": "Follow the creator behind ShezoraX",

    "Build websites, dashboards, portfolios and full web applications.":
      "Build websites, dashboards, portfolios and full web applications.",
    "Create school assignments, experiments, reports and presentations.":
      "Create school assignments, experiments, reports and presentations.",
    "Work on university assignments, FYPs, research and documentation.":
      "Work on university assignments, FYPs, research and documentation.",
    "Plan software products, desktop tools and utility applications.":
      "Plan software products, desktop tools and utility applications.",
    "Build AI assistants, ML ideas, prompts and intelligent products.":
      "Build AI assistants, ML ideas, prompts and intelligent products.",
    "Create Android, iOS and cross-platform mobile applications.":
      "Create Android, iOS and cross-platform mobile applications.",
    "Build game concepts, mechanics, stories and development plans.":
      "Build game concepts, mechanics, stories and development plans.",
    "Analyze data, plan research and prepare technical findings.":
      "Analyze data, plan research and prepare technical findings.",
    "Create reports, presentations, proposals and structured documents.":
      "Create reports, presentations, proposals and structured documents.",
    "Develop UI/UX, branding, creative concepts and visual direction.":
      "Develop UI/UX, branding, creative concepts and visual direction.",
    "Start anything else with a completely custom AI workspace.":
      "Start anything else with a completely custom AI workspace.",

    "Create images, concepts, scenes, portraits and visual ideas with AI.":
      "Create images, concepts, scenes, portraits and visual ideas with AI.",
    "Plan and create video concepts, scenes, scripts and visual directions.":
      "Plan and create video concepts, scenes, scripts and visual directions.",
    "Improve, transform, retouch and creatively edit images.":
      "Improve, transform, retouch and creatively edit images.",
    "Create professional resumes, CVs, cover letters and career documents.":
      "Create professional resumes, CVs, cover letters and career documents.",
    "Write articles, blogs, descriptions, captions and professional content.":
      "Write articles, blogs, descriptions, captions and professional content.",
    "Create slide structures, presentation content and speaker notes.":
      "Create slide structures, presentation content and speaker notes.",
    "Create professional documents, proposals, letters and structured files.":
      "Create professional documents, proposals, letters and structured files.",
    "Create stories, screenplays, scripts, characters and fictional worlds.":
      "Create stories, screenplays, scripts, characters and fictional worlds.",
    "Create captions, posts, content ideas and social media campaigns.":
      "Create captions, posts, content ideas and social media campaigns.",
    "Develop brand identities, logo concepts, names, colors and visual direction.":
      "Develop brand identities, logo concepts, names, colors and visual direction.",
    "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.":
      "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.",
    "Create interface concepts, visual systems, layouts and design directions.":
      "Create interface concepts, visual systems, layouts and design directions.",
    "Create diagrams, flowcharts, infographics and visual explanations.":
      "Create diagrams, flowcharts, infographics and visual explanations.",
    "Email & Message Writer": "Email & Message Writer",
    "Write professional emails, messages, replies, invitations and announcements.":
      "Write professional emails, messages, replies, invitations and announcements.",
    "Create general study notes, flashcards, quizzes and revision material.":
      "Create general study notes, flashcards, quizzes and revision material.",
    "Research & Report Writer": "Research & Report Writer",
    "Create general reports, structured research writing and analytical documents.":
      "Create general reports, structured research writing and analytical documents.",
    "Document Converter": "Document Converter",
    "Plan document transformations, formatting changes and content conversions.":
      "Plan document transformations, formatting changes and content conversions.",
    "Create reusable templates for documents, posts, emails, planning and more.":
      "Create reusable templates for documents, posts, emails, planning and more.",

    "Create a cinematic space scene": "Create a cinematic space scene",
    "Create a professional profile image": "Create a professional profile image",
    "Create a futuristic city concept": "Create a futuristic city concept",
    "Create a realistic product image": "Create a realistic product image",
    "Create a cinematic video concept": "Create a cinematic video concept",
    "Create a short promotional video": "Create a short promotional video",
    "Create a futuristic story video": "Create a futuristic story video",
    "Create a social media video idea": "Create a social media video idea",
    "Improve this image professionally": "Improve this image professionally",
    "Remove unwanted objects": "Remove unwanted objects",
    "Create a cinematic color grade": "Create a cinematic color grade",
    "Turn this image into a different style": "Turn this image into a different style",
    "Create a modern ATS-friendly CV": "Create a modern ATS-friendly CV",
    "Improve my professional summary": "Improve my professional summary",
    "Write a strong cover letter": "Write a strong cover letter",
    "Improve my work experience section": "Improve my work experience section",
    "Write a professional blog post": "Write a professional blog post",
    "Create an engaging article": "Create an engaging article",
    "Write a product description": "Write a product description",
    "Create a detailed content outline": "Create a detailed content outline",
    "Create a professional presentation": "Create a professional presentation",
    "Build a 10-slide presentation structure": "Build a 10-slide presentation structure",
    "Write speaker notes for my slides": "Write speaker notes for my slides",
    "Create a presentation outline": "Create a presentation outline",
    "Create a professional proposal": "Create a professional proposal",
    "Write a formal document": "Write a formal document",
    "Create a business document": "Create a business document",
    "Turn my notes into a structured document": "Turn my notes into a structured document",
    "Create a science-fiction story": "Create a science-fiction story",
    "Write a short film script": "Write a short film script",
    "Create interesting characters": "Create interesting characters",
    "Build a cinematic story outline": "Build a cinematic story outline",
    "Create an Instagram content plan": "Create an Instagram content plan",
    "Write a professional LinkedIn post": "Write a professional LinkedIn post",
    "Create 10 social media captions": "Create 10 social media captions",
    "Create a one-week content calendar": "Create a one-week content calendar",
    "Create a modern brand identity": "Create a modern brand identity",
    "Develop a logo concept": "Develop a logo concept",
    "Create a brand color direction": "Create a brand color direction",
    "Build a complete branding concept": "Build a complete branding concept",
    "Create a cinematic music concept": "Create a cinematic music concept",
    "Write lyrics for a song": "Write lyrics for a song",
    "Create a podcast intro": "Create a podcast intro",
    "Write a professional voice-over script": "Write a professional voice-over script",
    "Create a modern dashboard design": "Create a modern dashboard design",
    "Create a mobile app UI concept": "Create a mobile app UI concept",
    "Design a futuristic landing page": "Design a futuristic landing page",
    "Create a visual design system": "Create a visual design system",
    "Create a process flowchart": "Create a process flowchart",
    "Create an educational infographic": "Create an educational infographic",
    "Explain this topic with a diagram": "Explain this topic with a diagram",
    "Create a professional system diagram": "Create a professional system diagram",
    "Write a professional email": "Write a professional email",
    "Write a polite reply": "Write a polite reply",
    "Create a formal request": "Create a formal request",
    "Write a professional announcement": "Write a professional announcement",
    "Create revision notes": "Create revision notes",
    "Create flashcards": "Create flashcards",
    "Create a practice quiz": "Create a practice quiz",
    "Turn these notes into questions": "Turn these notes into questions",
    "Create a structured report": "Create a structured report",
    "Turn my information into a research-style document": "Turn my information into a research-style document",
    "Create an executive summary": "Create an executive summary",
    "Organize this information into sections": "Organize this information into sections",
    "Convert this content into a professional format": "Convert this content into a professional format",
    "Turn notes into a formal document": "Turn notes into a formal document",
    "Convert this text into a structured outline": "Convert this text into a structured outline",
    "Reformat this document professionally": "Reformat this document professionally",
    "Create a professional email template": "Create a professional email template",
    "Create a social media template": "Create a social media template",
    "Create a professional document template": "Create a professional document template",
    "Create a reusable planning template": "Create a reusable planning template",

    "AI Project": "AI Project",

    "Are you sure you want to delete all ShezoraX chats?":
      "Are you sure you want to delete all ShezoraX chats?",
    "All chats have been deleted.": "All chats have been deleted.",
    "Are you sure you want to delete your ShezoraX account?":
      "Are you sure you want to delete your ShezoraX account?",
    "Account deletion requires a real authentication backend. Your local project data can be removed separately.":
      "Account deletion requires a real authentication backend. Your local project data can be removed separately.",
    "Log out of all devices requires a real authentication/session backend.":
      "Log out of all devices requires a real authentication/session backend.",
    "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.":
      "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.",
    "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.":
      "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.",
    "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.":
      "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.",
    "I received your message, but no response was returned.":
      "I received your message, but no response was returned.",
    "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.":
      "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.",
    "I received your project request, but no response was returned.":
      "I received your project request, but no response was returned.",
    "I received your creation request, but no response was returned.":
      "I received your creation request, but no response was returned.",
    "Full-Stack Developer & AI Engineer \u2014 the mind behind":
      "Full-Stack Developer & AI Engineer \u2014 the mind behind",
    "Connect a provider to add account authentication to ShezoraX.":
      "Connect a provider to add account authentication to ShezoraX.",
  },

Chinese: {
  // Navigation & System
  "Home": "首页",
  "AI Chat": "AI 聊天",
  "Create": "创建",
  "Projects": "项目",
  "Knowledge": "知识库",
  "Settings": "设置",
  "AI System": "AI 系统",
  "Online": "在线",
  "Account": "账户",
  "Search": "搜索",
  "General": "常规",
  "Profile": "个人资料",
  "Google Account": "Google 账户",
  "Apple ID": "Apple ID",
  "Religion & Faith": "宗教与信仰",
  "Language": "语言",
  "Voice": "语音",
  "Choose the language used throughout the ShezoraX interface.": "选择在整个 ShezoraX 界面中使用的语言。",
  "Control the language and voice experience of ShezoraX.": "控制 ShezoraX 的语言和语音体验。",
  "Choose the AI voice ShezoraX uses for spoken responses.": "选择 ShezoraX 用于语音回复的 AI 语音。",
  "Connected": "已连接",
  "Ready": "就绪",
  "Continue with Google": "使用 Google 继续",
  "Continue with Apple ID": "使用 Apple ID 继续",
  "Continue with Apple": "使用 Apple 继续",
  "Good Morning": "早上好",
  "Good Afternoon": "下午好",
  "Good Evening": "晚上好",
  "Good Night": "晚安",
  "Send": "发送",
  "Clear": "清除",
  "Cancel": "取消",
  "Save": "保存",
  "Delete": "删除",
  "Close": "关闭",
  "Back": "返回",
  "Open": "打开",
  "AI System Online": "AI 系统在线",
  "Female": "女性",
  "Male": "男性",

  // Status & Hero
  "ShezoraX AI Online": "ShezoraX AI 在线",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "您智能的个人 AI 工作空间，用于学习、创建、探索和完成任务。",
  "PERSONAL AI": "个人 AI",
  "What can I help you with?": "我能帮您什么？",
  "Listening…": "正在聆听…",
  "Speak": "说话",
  "READY": "就绪",
  "Ask ShezoraX anything.": "向 ShezoraX 提问任何问题。",
  "You can also use the microphone or one of the quick prompts below.": "您也可以使用麦克风或以下快速提示之一。",
  "YOU": "您",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "正在思考…",
  "Ask ShezoraX anything…": "向 ShezoraX 提问任何问题…",
  "Voice input is available": "语音输入可用",
  "Stop mic": "停止麦克风",
  "Enter to send · Shift + Enter for a new line": "按 Enter 发送 · Shift + Enter 换行",

  // Suggestions
  "Explain something to me": "给我解释一些事情",
  "Help me plan my day": "帮我规划我的一天",
  "Teach me about the universe": "教我了解宇宙",
  "Help me build a project": "帮我构建一个项目",
  "EXPLORE SHEZORAX": "探索 SHEZORAX",

  // Chat
  "Talk with ShezoraX": "与 ShezoraX 对话",
  "Start a conversation with ShezoraX.": "开始与 ShezoraX 对话。",
  "Ask a question, explain a problem, or describe what you want to build.": "提问、解释问题，或描述您想要构建的内容。",
  "Message ShezoraX": "给 ShezoraX 发消息",

  // Projects
  "PROJECTS": "项目",
  "Build something with ShezoraX": "使用 ShezoraX 构建一些东西",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "选择项目类型。每个工作空间都有自己的 AI 聊天、语音输入、语音回复、笔记和保存的对话。",
  "Open project workspace →": "打开项目工作空间 →",
  "← All Projects": "← 所有项目",
  "PROJECT WORKSPACE": "项目工作空间",
  "Export": "导出",
  "Project Plan": "项目计划",
  "Notes": "笔记",
  "Tell ShezoraX what you want to build.": "告诉 ShezoraX 您想要构建什么。",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "描述您的想法、需求、截止日期、技术、任务说明或您需要解决的任何问题。",
  "Working on your project…": "正在处理您的项目…",
  "Listening… speak now": "正在聆听…请说话",
  "Voice + text supported": "支持语音 + 文本",
  "WORKFLOW": "工作流程",
  "Build your project step by step": "逐步构建您的项目",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "使用这些阶段来保持项目有序。您可以要求 ShezoraX 从 AI 聊天选项卡处理任何阶段。",
  "Define": "定义",
  "Explain the goal, audience and final result.": "解释目标、受众和最终结果。",
  "Plan": "计划",
  "Choose features, technology and milestones.": "选择功能、技术和里程碑。",
  "Build": "构建",
  "Create the code, content or project material.": "创建代码、内容或项目材料。",
  "Test": "测试",
  "Review errors, requirements and edge cases.": "审查错误、需求和边缘情况。",
  "Polish": "完善",
  "Improve design, quality and presentation.": "改进设计、质量和展示。",
  "Deliver": "交付",
  "Prepare the final files, documentation or presentation.": "准备最终文件、文档或演示文稿。",
  "Ask ShezoraX →": "询问 ShezoraX →",
  "PROJECT MEMORY": "项目记忆",
  "Project notes": "项目笔记",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "保存需求、链接、截止日期、技术或其他上下文。笔记保留在此设备上，并包含在未来的项目 AI 请求中。",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "示例：React + Node.js，截止日期周五，必须移动响应式…",
  "characters · saved locally": "字符 · 本地保存",
  "Back to Chat": "返回聊天",
  "messages": "消息",
  "Copied": "已复制",
  "Copy conversation": "复制对话",

  // Project Types
  "Website / Web App": "网站 / Web 应用",
  "School Project": "学校项目",
  "College / University": "学院 / 大学",
  "Software / Desktop App": "软件 / 桌面应用",
  "Mobile App": "移动应用",
  "Game Project": "游戏项目",
  "Data / Research": "数据 / 研究",
  "Presentation / Report": "演示文稿 / 报告",
  "Design / Creative": "设计 / 创意",
  "Custom Project": "自定义项目",
  "Build websites, dashboards, portfolios and full web applications.": "构建网站、仪表板、作品集和完整的 Web 应用程序。",
  "Create school assignments, experiments, reports and presentations.": "创建学校作业、实验、报告和演示文稿。",
  "Work on university assignments, FYPs, research and documentation.": "处理大学作业、毕业项目、研究和文档。",
  "Plan software products, desktop tools and utility applications.": "规划软件产品、桌面工具和实用应用程序。",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "构建 AI 助手、机器学习想法、提示和智能产品。",
  "Create Android, iOS and cross-platform mobile applications.": "创建 Android、iOS 和跨平台移动应用程序。",
  "Build game concepts, mechanics, stories and development plans.": "构建游戏概念、机制、故事和开发计划。",
  "Analyze data, plan research and prepare technical findings.": "分析数据、规划研究并准备技术发现。",
  "Create reports, presentations, proposals and structured documents.": "创建报告、演示文稿、提案和结构化文档。",
  "Develop UI/UX, branding, creative concepts and visual direction.": "开发 UI/UX、品牌、创意概念和视觉方向。",
  "Start anything else with a completely custom AI workspace.": "使用完全自定义的 AI 工作空间开始任何其他项目。",

  // Create
  "CREATE": "创建",
  "Create something amazing": "创建一些令人惊叹的东西",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "选择创建工具。每个工具都会打开自己的专注 ShezoraX AI 工作空间，提供相关建议和聊天。",
  "Open workspace →": "打开工作空间 →",
  "← All Create Tools": "← 所有创建工具",
  "CREATE WORKSPACE": "创建工作空间",
  "What would you like to create?": "您想创建什么？",
  "Start with your own request or choose one of the suggestions for this creation tool.": "从您自己的请求开始，或选择此创建工具的建议之一。",
  "Listening": "正在聆听",
  "SUGGESTIONS": "建议",
  "Try one of these": "尝试其中一个",

  // Create Tools
  "Image Create": "图像创建",
  "Video Create": "视频创建",
  "Photo / Image Editing": "照片 / 图像编辑",
  "Resume / CV": "简历 / CV",
  "Content Writing": "内容写作",
  "Presentation Maker": "演示文稿制作",
  "Document Creator": "文档创建",
  "Story & Script Writer": "故事与脚本写作",
  "Social Media Creator": "社交媒体创建",
  "Logo & Branding": "标志与品牌",
  "Music & Audio": "音乐与音频",
  "UI / Visual Design": "UI / 视觉设计",
  "Diagram & Infographic": "图表与信息图",
  "Email & Message Writer": "邮件与消息写作",
  "Study Notes & Flashcards": "学习笔记与抽认卡",
  "Research & Report Writer": "研究与报告写作",
  "Document Converter": "文档转换器",
  "Template Creator": "模板创建",
  "AI Project": "AI 项目",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "使用 AI 创建图像、概念、场景、肖像和视觉想法。",
  "Plan and create video concepts, scenes, scripts and visual directions.": "规划和创建视频概念、场景、脚本和视觉方向。",
  "Improve, transform, retouch and creatively edit images.": "改进、转换、修饰和创意编辑图像。",
  "Create professional resumes, CVs, cover letters and career documents.": "创建专业简历、CV、求职信和职业文档。",
  "Write articles, blogs, descriptions, captions and professional content.": "撰写文章、博客、描述、标题和专业内容。",
  "Create slide structures, presentation content and speaker notes.": "创建幻灯片结构、演示文稿内容和演讲者笔记。",
  "Create professional documents, proposals, letters and structured files.": "创建专业文档、提案、信件和结构化文件。",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "创建故事、剧本、脚本、角色和虚构世界。",
  "Create captions, posts, content ideas and social media campaigns.": "创建标题、帖子、内容想法和社交媒体活动。",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "开发品牌标识、标志概念、名称、颜色和视觉方向。",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "创建音乐概念、歌词、声音想法、语音脚本和音频方向。",
  "Create interface concepts, visual systems, layouts and design directions.": "创建界面概念、视觉系统、布局和设计方向。",
  "Create diagrams, flowcharts, infographics and visual explanations.": "创建图表、流程图、信息图和视觉解释。",
  "Write professional emails, messages, replies, invitations and announcements.": "撰写专业邮件、消息、回复、邀请和公告。",
  "Create general study notes, flashcards, quizzes and revision material.": "创建一般学习笔记、抽认卡、测验和复习材料。",
  "Create general reports, structured research writing and analytical documents.": "创建一般报告、结构化研究写作和分析文档。",
  "Plan document transformations, formatting changes and content conversions.": "规划文档转换、格式更改和内容转换。",
  "Create reusable templates for documents, posts, emails, planning and more.": "为文档、帖子、邮件、规划等创建可重用模板。",

  // Create Tool Suggestions
  "Create a cinematic space scene": "创建电影级太空场景",
  "Create a professional profile image": "创建专业个人资料图像",
  "Create a futuristic city concept": "创建未来城市概念",
  "Create a realistic product image": "创建逼真产品图像",
  "Create a cinematic video concept": "创建电影级视频概念",
  "Create a short promotional video": "创建简短宣传视频",
  "Create a futuristic story video": "创建未来故事视频",
  "Create a social media video idea": "创建社交媒体视频想法",
  "Improve this image professionally": "专业改进此图像",
  "Remove unwanted objects": "删除不需要的对象",
  "Create a cinematic color grade": "创建电影级色彩分级",
  "Turn this image into a different style": "将此图像转换为不同风格",
  "Create a modern ATS-friendly CV": "创建现代 ATS 友好简历",
  "Improve my professional summary": "改进我的专业摘要",
  "Write a strong cover letter": "撰写有力的求职信",
  "Improve my work experience section": "改进我的工作经验部分",
  "Write a professional blog post": "撰写专业博客文章",
  "Create an engaging article": "创建引人入胜的文章",
  "Write a product description": "撰写产品描述",
  "Create a detailed content outline": "创建详细内容大纲",
  "Create a professional presentation": "创建专业演示文稿",
  "Build a 10-slide presentation structure": "构建 10 张幻灯片演示结构",
  "Write speaker notes for my slides": "为我的幻灯片撰写演讲者笔记",
  "Create a presentation outline": "创建演示文稿大纲",
  "Create a professional proposal": "创建专业提案",
  "Write a formal document": "撰写正式文档",
  "Create a business document": "创建商业文档",
  "Turn my notes into a structured document": "将我的笔记转换为结构化文档",
  "Create a science-fiction story": "创建科幻故事",
  "Write a short film script": "撰写短片剧本",
  "Create interesting characters": "创建有趣的角色",
  "Build a cinematic story outline": "构建电影级故事大纲",
  "Create an Instagram content plan": "创建 Instagram 内容计划",
  "Write a professional LinkedIn post": "撰写专业 LinkedIn 帖子",
  "Create 10 social media captions": "创建 10 个社交媒体标题",
  "Create a one-week content calendar": "创建一周内容日历",
  "Create a modern brand identity": "创建现代品牌标识",
  "Develop a logo concept": "开发标志概念",
  "Create a brand color direction": "创建品牌颜色方向",
  "Build a complete branding concept": "构建完整品牌概念",
  "Create a cinematic music concept": "创建电影级音乐概念",
  "Write lyrics for a song": "为歌曲写歌词",
  "Create a podcast intro": "创建播客介绍",
  "Write a professional voice-over script": "撰写专业配音脚本",
  "Create a modern dashboard design": "创建现代仪表板设计",
  "Create a mobile app UI concept": "创建移动应用 UI 概念",
  "Design a futuristic landing page": "设计未来登陆页面",
  "Create a visual design system": "创建视觉设计系统",
  "Create a process flowchart": "创建流程图",
  "Create an educational infographic": "创建教育信息图",
  "Explain this topic with a diagram": "用图表解释这个主题",
  "Create a professional system diagram": "创建专业系统图",
  "Write a professional email": "撰写专业邮件",
  "Write a polite reply": "撰写礼貌回复",
  "Create a formal request": "创建正式请求",
  "Write a professional announcement": "撰写专业公告",
  "Create revision notes": "创建复习笔记",
  "Create flashcards": "创建抽认卡",
  "Create a practice quiz": "创建练习测验",
  "Turn these notes into questions": "将这些笔记转换为问题",
  "Create a structured report": "创建结构化报告",
  "Turn my information into a research-style document": "将我的信息转换为研究风格文档",
  "Create an executive summary": "创建执行摘要",
  "Organize this information into sections": "将此信息组织成章节",
  "Convert this content into a professional format": "将此内容转换为专业格式",
  "Turn notes into a formal document": "将笔记转换为正式文档",
  "Convert this text into a structured outline": "将此文本转换为结构化大纲",
  "Reformat this document professionally": "专业重新格式化此文档",
  "Create a professional email template": "创建专业邮件模板",
  "Create a social media template": "创建社交媒体模板",
  "Create a professional document template": "创建专业文档模板",
  "Create a reusable planning template": "创建可重用规划模板",

  // Knowledge
  "Universe & Space": "宇宙与太空",
  "Earth": "地球",
  "Science": "科学",
  "Technology": "技术",
  "Programming": "编程",
  "History": "历史",
  "Mathematics": "数学",
  "Physics": "物理",
  "KNOWLEDGE": "知识库",
  "Knowledge Universe": "知识宇宙",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "选择一个主题，ShezoraX 将打开 AI 聊天并提出专注问题。",

  // Settings
  "SETTINGS": "设置",
  "Manage your ShezoraX preferences, account and personal experience.": "管理您的 ShezoraX 偏好、账户和个人体验。",
  "GENERAL": "常规",
  "Language, voice and general preferences": "语言、语音和常规偏好",
  "AI voice replies": "AI 语音回复",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "当浏览器语音合成可用时，ShezoraX 会朗读一般 AI 回复。",
  "ON": "开",
  "OFF": "关",
  "Project voice replies": "项目语音回复",
  "Automatically speak responses inside project workspaces.": "在项目工作空间内自动朗读回复。",
  "Test Voice": "测试语音",
  "Test Microphone": "测试麦克风",
  "CREATOR": "创建者",
  "Connect & Follow": "连接与关注",
  "Stay updated with my latest work and projects.": "了解我的最新工作和项目。",
  "GitHub": "GitHub",
  "Explore my projects": "探索我的项目",
  "Facebook": "Facebook",
  "Connect with me": "与我连接",
  "Instagram": "Instagram",
  "Follow my journey": "关注我的旅程",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "专业连接",
  "X": "X",
  "Follow for updates": "关注以获取更新",
  "Portfolio": "作品集",
  "View my work": "查看我的作品",
  "PROFILE": "个人资料",
  "Manage your ShezoraX account and personal data.": "管理您的 ShezoraX 账户和个人数据。",
  "Your name": "您的姓名",
  "How ShezoraX should greet you": "ShezoraX 应该如何称呼您",
  "Enter your name": "输入您的姓名",
  "Google email": "Google 邮箱",
  "Connected account": "已连接账户",
  "Log out of all devices": "从所有设备注销",
  "End active ShezoraX sessions on other devices.": "在其他设备上结束活动的 ShezoraX 会话。",
  "Delete all chats": "删除所有聊天",
  "Remove your ShezoraX conversations and project chat memory from this device.": "从此设备删除您的 ShezoraX 对话和项目聊天记忆。",
  "Delete account": "删除账户",
  "Permanently delete your ShezoraX account when account authentication is connected.": "当账户身份验证连接时，永久删除您的 ShezoraX 账户。",
  "GOOGLE ACCOUNT": "GOOGLE 账户",
  "Connect your Google account to use account authentication with ShezoraX.": "连接您的 Google 账户以在 ShezoraX 中使用账户身份验证。",
  "Google": "Google",
  "Google connection is ready.": "Google 连接已就绪。",
  "Connect your Google account to ShezoraX.": "将您的 Google 账户连接到 ShezoraX。",
  "Real Google OAuth requires configured authentication credentials.": "真实的 Google OAuth 需要配置的身份验证凭据。",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "连接您的 Apple ID 以在 ShezoraX 中使用 Apple 账户身份验证。",
  "Apple ID connection is ready.": "Apple ID 连接已就绪。",
  "Connect your Apple ID to ShezoraX.": "将您的 Apple ID 连接到 ShezoraX。",
  "Real Apple Sign In requires configured authentication credentials.": "真实的 Apple 登录需要配置的身份验证凭据。",
  "RELIGION & FAITH": "宗教与信仰",
  "Manage the religious and faith-related preferences used by ShezoraX.": "管理 ShezoraX 使用的宗教和信仰相关偏好。",
  "Faith preferences": "信仰偏好",

    "Coming soon": "即将推出",
    "Prayer times": "祈祷时间",
    "Get notifications for daily prayer times based on your location.": "根据您的位置获取每日祈祷时间通知。",
    "Qibla direction": "朝拜方向",
    "Find the direction of prayer using your device compass.": "使用设备指南针查找祈祷方向。",
    "Daily verses": "每日经文",
    "Receive daily religious verses and reflections in your feed.": "在您的信息流中接收每日宗教经文和反思。",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "配置ShezoraX如何将基于信仰的指导融入您的体验。",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "此区域保留给您的宗教知识、祈祷和信仰相关偏好。",
  "Religious knowledge": "宗教知识",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX 可以将宗教主题与一般应用偏好分开。",
  "Religion": "宗教",
  "Islam": "伊斯兰教",
  "Christianity": "基督教",
  "Judaism": "犹太教",
  "Hinduism": "印度教",
  "Buddhism": "佛教",
  "Sikhism": "锡克教",
  "Jainism": "耆那教",
  "Baháʼí Faith": "巴哈伊信仰",
  "Taoism": "道教",
  "Confucianism": "儒教",
  "Shinto": "神道教",
  "Zoroastrianism": "祆教",
  "Other / Spiritual": "其他 / 精神",
  "No preference": "无偏好",

  // Voices & Creator
  "ShezoraX female AI voice": "ShezoraX 女性 AI 语音",
  "ShezoraX male AI voice": "ShezoraX 男性 AI 语音",
  "Connect with Creator": "与创建者连接",
  "Follow the creator behind ShezoraX": "关注 ShezoraX 背后的创建者",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "您确定要删除所有 ShezoraX 聊天吗？",
  "All chats have been deleted.": "所有聊天已被删除。",
  "Are you sure you want to delete your ShezoraX account?": "您确定要删除您的 ShezoraX 账户吗？",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "账户删除需要真实的身份验证后端。您的本地项目数据可以单独删除。",
  "Log out of all devices requires a real authentication/session backend.": "从所有设备注销需要真实的身份验证/会话后端。",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google 账户连接 UI 已就绪。实时身份验证需要真实的 Google OAuth 凭据。",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID 连接 UI 已就绪。实时身份验证需要真实的 Apple 登录凭据。",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "此浏览器不支持语音识别。请尝试 Google Chrome 或 Microsoft Edge。",
  "I received your message, but no response was returned.": "我收到了您的消息，但没有返回回复。",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "我目前无法连接到 AI 服务。请检查 ShezoraX 后端是否正在运行。",
  "I received your project request, but no response was returned.": "我收到了您的项目请求，但没有返回回复。",
  "I received your creation request, but no response was returned.": "我收到了您的创建请求，但没有返回回复。",
"Full-Stack Developer & AI Engineer — the mind behind": "全栈开发者与 AI 工程师 — 背后的创造者",
"Connect a provider to add account authentication to ShezoraX.": "连接服务提供商以为 ShezoraX 添加账户认证。",

  },

Korean: {
  // Navigation & System
  "Home": "홈",
  "AI Chat": "AI 채팅",
  "Create": "만들기",
  "Projects": "프로젝트",
  "Knowledge": "지식",
  "Settings": "설정",
  "AI System": "AI 시스템",
  "Online": "온라인",
  "Account": "계정",
  "Search": "검색",
  "General": "일반",
  "Profile": "프로필",
  "Google Account": "Google 계정",
  "Apple ID": "Apple ID",
  "Religion & Faith": "종교 및 신앙",
  "Language": "언어",
  "Voice": "음성",
  "Choose the language used throughout the ShezoraX interface.": "ShezoraX 인터페이스 전체에서 사용할 언어를 선택하세요.",
  "Control the language and voice experience of ShezoraX.": "ShezoraX의 언어 및 음성 환경을 제어하세요.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "ShezoraX가 음성 응답에 사용할 AI 음성을 선택하세요.",
  "Connected": "연결됨",
  "Ready": "준비 완료",
  "Continue with Google": "Google로 계속",
  "Continue with Apple ID": "Apple ID로 계속",
  "Continue with Apple": "Apple로 계속",
  "Good Morning": "좋은 아침입니다",
  "Good Afternoon": "좋은 오후입니다",
  "Good Evening": "좋은 저녁입니다",
  "Good Night": "안녕히 주무세요",
  "Send": "보내기",
  "Clear": "지우기",
  "Cancel": "취소",
  "Save": "저장",
  "Delete": "삭제",
  "Close": "닫기",
  "Back": "뒤로",
  "Open": "열기",
  "AI System Online": "AI 시스템 온라인",
  "Female": "여성",
  "Male": "남성",

  // Status & Hero
  "ShezoraX AI Online": "ShezoraX AI 온라인",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "학습, 창작, 탐색 및 업무 완료를 위한 지능형 개인 AI 작업 공간입니다.",
  "PERSONAL AI": "개인 AI",
  "What can I help you with?": "무엇을 도와드릴까요?",
  "Listening…": "듣고 있습니다…",
  "Speak": "말씀하세요",
  "READY": "준비 완료",
  "Ask ShezoraX anything.": "ShezoraX에게 무엇이든 물어보세요.",
  "You can also use the microphone or one of the quick prompts below.": "마이크를 사용하거나 아래의 빠른 프롬프트 중 하나를 선택할 수도 있습니다.",
  "YOU": "사용자",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "생각 중…",
  "Ask ShezoraX anything…": "ShezoraX에게 무엇이든 물어보세요…",
  "Voice input is available": "음성 입력 사용 가능",
  "Stop mic": "마이크 중지",
  "Enter to send · Shift + Enter for a new line": "Enter로 보내기 · Shift + Enter로 줄 바꿈",

  // Suggestions
  "Explain something to me": "저에게 뭔가를 설명해 주세요",
  "Help me plan my day": "하루 계획을 세워주세요",
  "Teach me about the universe": "우주에 대해 가르쳐 주세요",
  "Help me build a project": "프로젝트 구축을 도와주세요",
  "EXPLORE SHEZORAX": "SHEZORAX 탐색",

  // Chat
  "Talk with ShezoraX": "ShezoraX와 대화하기",
  "Start a conversation with ShezoraX.": "ShezoraX와 대화를 시작하세요.",
  "Ask a question, explain a problem, or describe what you want to build.": "질문을 하거나, 문제를 설명하거나, 구축하고 싶은 것을 설명하세요.",
  "Message ShezoraX": "ShezoraX에게 메시지 보내기",

  // Projects
  "PROJECTS": "프로젝트",
  "Build something with ShezoraX": "ShezoraX로 무언가를 만들어 보세요",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "프로젝트 유형을 선택하세요. 각 작업 공간에는 자체 AI 채팅, 음성 입력, 음성 응답, 메모 및 저장된 대화가 있습니다.",
  "Open project workspace →": "프로젝트 작업 공간 열기 →",
  "← All Projects": "← 모든 프로젝트",
  "PROJECT WORKSPACE": "프로젝트 작업 공간",
  "Export": "내보내기",
  "Project Plan": "프로젝트 계획",
  "Notes": "메모",
  "Tell ShezoraX what you want to build.": "ShezoraX에게 만들고 싶은 것을 알려주세요.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "아이디어, 요구 사항, 마감일, 기술, 과제 지침 또는 해결이 필요한 문제를 설명하세요.",
  "Working on your project…": "프로젝트 작업 중…",
  "Listening… speak now": "듣고 있습니다… 지금 말씀해 주세요",
  "Voice + text supported": "음성 + 텍스트 지원",
  "WORKFLOW": "워크플로",
  "Build your project step by step": "단계별로 프로젝트 구축",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "이 단계를 사용하여 프로젝트를 체계적으로 유지하세요. AI 채팅 탭에서 ShezoraX에게 모든 단계를 처리하도록 요청할 수 있습니다.",
  "Define": "정의",
  "Explain the goal, audience and final result.": "목표, 대상 및 최종 결과를 설명하세요.",
  "Plan": "계획",
  "Choose features, technology and milestones.": "기능, 기술 및 마일스톤을 선택하세요.",
  "Build": "구축",
  "Create the code, content or project material.": "코드, 콘텐츠 또는 프로젝트 자료를 만드세요.",
  "Test": "테스트",
  "Review errors, requirements and edge cases.": "오류, 요구 사항 및 엣지 케이스를 검토하세요.",
  "Polish": "연마",
  "Improve design, quality and presentation.": "디자인, 품질 및 프레젠테이션을 개선하세요.",
  "Deliver": "납품",
  "Prepare the final files, documentation or presentation.": "최종 파일, 문서 또는 프레젠테이션을 준비하세요.",
  "Ask ShezoraX →": "ShezoraX에게 묻기 →",
  "PROJECT MEMORY": "프로젝트 메모리",
  "Project notes": "프로젝트 메모",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "요구 사항, 링크, 마감일, 기술 또는 기타 컨텍스트를 저장하세요. 메모는 이 기기에 유지되며 향후 프로젝트 AI 요청에 포함됩니다.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "예: React + Node.js, 마감 금요일, 모바일 반응형 필수…",
  "characters · saved locally": "자 · 로컬 저장됨",
  "Back to Chat": "채팅으로 돌아가기",
  "messages": "메시지",
  "Copied": "복사됨",
  "Copy conversation": "대화 복사",

  // Project Types
  "Website / Web App": "웹사이트 / 웹 앱",
  "School Project": "학교 프로젝트",
  "College / University": "대학 / 대학교",
  "Software / Desktop App": "소프트웨어 / 데스크톱 앱",
  "Mobile App": "모바일 앱",
  "Game Project": "게임 프로젝트",
  "Data / Research": "데이터 / 연구",
  "Presentation / Report": "프레젠테이션 / 보고서",
  "Design / Creative": "디자인 / 크리에이티브",
  "Custom Project": "사용자 정의 프로젝트",
  "Build websites, dashboards, portfolios and full web applications.": "웹사이트, 대시보드, 포트폴리오 및 완전한 웹 애플리케이션을 구축합니다.",
  "Create school assignments, experiments, reports and presentations.": "학교 과제, 실험, 보고서 및 프레젠테이션을 만듭니다.",
  "Work on university assignments, FYPs, research and documentation.": "대학 과제, 졸업 프로젝트, 연구 및 문서를 작업합니다.",
  "Plan software products, desktop tools and utility applications.": "소프트웨어 제품, 데스크톱 도구 및 유틸리티 애플리케이션을 계획합니다.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "AI 어시스턴트, 머신러닝 아이디어, 프롬프트 및 지능형 제품을 구축합니다.",
  "Create Android, iOS and cross-platform mobile applications.": "Android, iOS 및 크로스 플랫폼 모바일 애플리케이션을 만듭니다.",
  "Build game concepts, mechanics, stories and development plans.": "게임 컨셉, 메커니즘, 스토리 및 개발 계획을 구축합니다.",
  "Analyze data, plan research and prepare technical findings.": "데이터를 분석하고, 연구를 계획하고, 기술적 결과를 준비합니다.",
  "Create reports, presentations, proposals and structured documents.": "보고서, 프레젠테이션, 제안서 및 구조화된 문서를 만듭니다.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "UI/UX, 브랜딩, 크리에이티브 컨셉 및 비주얼 디렉션을 개발합니다.",
  "Start anything else with a completely custom AI workspace.": "완전히 사용자 정의된 AI 작업 공간으로 다른 모든 것을 시작하세요.",

  // Create
  "CREATE": "만들기",
  "Create something amazing": "놀라운 것을 만들어 보세요",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "만들기 도구를 선택하세요. 각 도구는 관련 제안 및 채팅과 함께 자체 집중 ShezoraX AI 작업 공간을 엽니다.",
  "Open workspace →": "작업 공간 열기 →",
  "← All Create Tools": "← 모든 만들기 도구",
  "CREATE WORKSPACE": "작업 공간 만들기",
  "What would you like to create?": "무엇을 만들고 싶으신가요?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "자체 요청으로 시작하거나 이 만들기 도구의 제안 중 하나를 선택하세요.",
  "Listening": "듣고 있습니다",
  "SUGGESTIONS": "제안",
  "Try one of these": "이 중 하나를 시도해 보세요",

  // Create Tools
  "Image Create": "이미지 만들기",
  "Video Create": "동영상 만들기",
  "Photo / Image Editing": "사진 / 이미지 편집",
  "Resume / CV": "이력서 / CV",
  "Content Writing": "콘텐츠 작성",
  "Presentation Maker": "프레젠테이션 제작",
  "Document Creator": "문서 만들기",
  "Story & Script Writer": "스토리 & 대본 작성",
  "Social Media Creator": "소셜 미디어 만들기",
  "Logo & Branding": "로고 & 브랜딩",
  "Music & Audio": "음악 & 오디오",
  "UI / Visual Design": "UI / 비주얼 디자인",
  "Diagram & Infographic": "다이어그램 & 인포그래픽",
  "Email & Message Writer": "이메일 & 메시지 작성",
  "Study Notes & Flashcards": "학습 메모 & 플래시카드",
  "Research & Report Writer": "연구 & 보고서 작성",
  "Document Converter": "문서 변환",
  "Template Creator": "템플릿 만들기",
  "AI Project": "AI 프로젝트",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "AI로 이미지, 컨셉, 장면, 초상화 및 비주얼 아이디어를 만듭니다.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "비디오 컨셉, 장면, 대본 및 비주얼 디렉션을 계획하고 만듭니다.",
  "Improve, transform, retouch and creatively edit images.": "이미지를 개선, 변환, 보정 및 창의적으로 편집합니다.",
  "Create professional resumes, CVs, cover letters and career documents.": "전문적인 이력서, CV, 커버 레터 및 경력 문서를 만듭니다.",
  "Write articles, blogs, descriptions, captions and professional content.": "기사, 블로그, 설명, 캡션 및 전문 콘텐츠를 작성합니다.",
  "Create slide structures, presentation content and speaker notes.": "슬라이드 구조, 프레젠테이션 콘텐츠 및 발표자 노트를 만듭니다.",
  "Create professional documents, proposals, letters and structured files.": "전문적인 문서, 제안서, 편지 및 구조화된 파일을 만듭니다.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "스토리, 시나리오, 대본, 캐릭터 및 가상 세계를 만듭니다.",
  "Create captions, posts, content ideas and social media campaigns.": "캡션, 게시물, 콘텐츠 아이디어 및 소셜 미디어 캠페인을 만듭니다.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "브랜드 아이덴티티, 로고 컨셉, 이름, 색상 및 비주얼 디렉션을 개발합니다.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "음악 컨셉, 가사, 사운드 아이디어, 음성 대본 및 오디오 디렉션을 만듭니다.",
  "Create interface concepts, visual systems, layouts and design directions.": "인터페이스 컨셉, 비주얼 시스템, 레이아웃 및 디자인 디렉션을 만듭니다.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "다이어그램, 흐름도, 인포그래픽 및 비주얼 설명을 만듭니다.",
  "Write professional emails, messages, replies, invitations and announcements.": "전문적인 이메일, 메시지, 답장, 초대장 및 공지사항을 작성합니다.",
  "Create general study notes, flashcards, quizzes and revision material.": "일반 학습 메모, 플래시카드, 퀴즈 및 복습 자료를 만듭니다.",
  "Create general reports, structured research writing and analytical documents.": "일반 보고서, 구조화된 연구 글쓰기 및 분석 문서를 만듭니다.",
  "Plan document transformations, formatting changes and content conversions.": "문서 변환, 서식 변경 및 콘텐츠 변환을 계획합니다.",
  "Create reusable templates for documents, posts, emails, planning and more.": "문서, 게시물, 이메일, 계획 등을 위한 재사용 가능한 템플릿을 만듭니다.",

  // Create Tool Suggestions
  "Create a cinematic space scene": "시네마틱 우주 장면 만들기",
  "Create a professional profile image": "전문적인 프로필 이미지 만들기",
  "Create a futuristic city concept": "미래 도시 컨셉 만들기",
  "Create a realistic product image": "실사 제품 이미지 만들기",
  "Create a cinematic video concept": "시네마틱 비디오 컨셉 만들기",
  "Create a short promotional video": "짧은 홍보 비디오 만들기",
  "Create a futuristic story video": "미래 스토리 비디오 만들기",
  "Create a social media video idea": "소셜 미디어 비디오 아이디어 만들기",
  "Improve this image professionally": "이 이미지를 전문적으로 개선",
  "Remove unwanted objects": "원하지 않는 객체 제거",
  "Create a cinematic color grade": "시네마틱 컬러 그레이딩 만들기",
  "Turn this image into a different style": "이 이미지를 다른 스타일로 변환",
  "Create a modern ATS-friendly CV": "현대적인 ATS 친화적 이력서 만들기",
  "Improve my professional summary": "전문 요약 개선",
  "Write a strong cover letter": "강력한 커버 레터 작성",
  "Improve my work experience section": "경력 섹션 개선",
  "Write a professional blog post": "전문적인 블로그 게시물 작성",
  "Create an engaging article": "매력적인 기사 만들기",
  "Write a product description": "제품 설명 작성",
  "Create a detailed content outline": "상세한 콘텐츠 개요 만들기",
  "Create a professional presentation": "전문적인 프레젠테이션 만들기",
  "Build a 10-slide presentation structure": "10슬라이드 프레젠테이션 구조 구축",
  "Write speaker notes for my slides": "슬라이드 발표자 노트 작성",
  "Create a presentation outline": "프레젠테이션 개요 만들기",
  "Create a professional proposal": "전문적인 제안서 만들기",
  "Write a formal document": "격식 있는 문서 작성",
  "Create a business document": "비즈니스 문서 만들기",
  "Turn my notes into a structured document": "메모를 구조화된 문서로 변환",
  "Create a science-fiction story": "SF 스토리 만들기",
  "Write a short film script": "단편 영화 대본 작성",
  "Create interesting characters": "흥미로운 캐릭터 만들기",
  "Build a cinematic story outline": "시네마틱 스토리 개요 구축",
  "Create an Instagram content plan": "Instagram 콘텐츠 계획 만들기",
  "Write a professional LinkedIn post": "전문적인 LinkedIn 게시물 작성",
  "Create 10 social media captions": "소셜 미디어 캡션 10개 만들기",
  "Create a one-week content calendar": "1주 콘텐츠 캘린더 만들기",
  "Create a modern brand identity": "현대적인 브랜드 아이덴티티 만들기",
  "Develop a logo concept": "로고 컨셉 개발",
  "Create a brand color direction": "브랜드 컬러 디렉션 만들기",
  "Build a complete branding concept": "완전한 브랜딩 컨셉 구축",
  "Create a cinematic music concept": "시네마틱 음악 컨셉 만들기",
  "Write lyrics for a song": "노래 가사 작성",
  "Create a podcast intro": "팟캐스트 인트로 만들기",
  "Write a professional voice-over script": "전문적인 나레이션 대본 작성",
  "Create a modern dashboard design": "현대적인 대시보드 디자인 만들기",
  "Create a mobile app UI concept": "모바일 앱 UI 컨셉 만들기",
  "Design a futuristic landing page": "미래적인 랜딩 페이지 디자인",
  "Create a visual design system": "비주얼 디자인 시스템 만들기",
  "Create a process flowchart": "프로세스 흐름도 만들기",
  "Create an educational infographic": "교육용 인포그래픽 만들기",
  "Explain this topic with a diagram": "다이어그램으로 이 주제 설명",
  "Create a professional system diagram": "전문적인 시스템 다이어그램 만들기",
  "Write a professional email": "전문적인 이메일 작성",
  "Write a polite reply": "정중한 답장 작성",
  "Create a formal request": "격식 있는 요청 만들기",
  "Write a professional announcement": "전문적인 공지사항 작성",
  "Create revision notes": "복습 노트 만들기",
  "Create flashcards": "플래시카드 만들기",
  "Create a practice quiz": "연습 퀴즈 만들기",
  "Turn these notes into questions": "이 메모를 문제로 변환",
  "Create a structured report": "구조화된 보고서 만들기",
  "Turn my information into a research-style document": "내 정보를 연구 스타일 문서로 변환",
  "Create an executive summary": "경영진 요약 만들기",
  "Organize this information into sections": "이 정보를 섹션으로 정리",
  "Convert this content into a professional format": "이 콘텐츠를 전문적인 형식으로 변환",
  "Turn notes into a formal document": "메모를 격식 있는 문서로 변환",
  "Convert this text into a structured outline": "이 텍스트를 구조화된 개요로 변환",
  "Reformat this document professionally": "이 문서를 전문적으로 재구성",
  "Create a professional email template": "전문적인 이메일 템플릿 만들기",
  "Create a social media template": "소셜 미디어 템플릿 만들기",
  "Create a professional document template": "전문적인 문서 템플릿 만들기",
  "Create a reusable planning template": "재사용 가능한 계획 템플릿 만들기",

  // Knowledge
  "Universe & Space": "우주와 우주 공간",
  "Earth": "지구",
  "Science": "과학",
  "Technology": "기술",
  "Programming": "프로그래밍",
  "History": "역사",
  "Mathematics": "수학",
  "Physics": "물리학",
  "KNOWLEDGE": "지식",
  "Knowledge Universe": "지식의 우주",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "주제를 선택하면 ShezoraX가 집중된 질문으로 AI 채팅을 엽니다.",

  // Settings
  "SETTINGS": "설정",
  "Manage your ShezoraX preferences, account and personal experience.": "ShezoraX 환경설정, 계정 및 개인 경험을 관리하세요.",
  "GENERAL": "일반",
  "Language, voice and general preferences": "언어, 음성 및 일반 환경설정",
  "AI voice replies": "AI 음성 응답",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "브라우저 음성 합성이 사용 가능할 때 ShezoraX가 일반 AI 응답을 읽어줍니다.",
  "ON": "켜기",
  "OFF": "끄기",
  "Project voice replies": "프로젝트 음성 응답",
  "Automatically speak responses inside project workspaces.": "프로젝트 작업 공간 내에서 응답을 자동으로 읽어줍니다.",
  "Test Voice": "음성 테스트",
  "Test Microphone": "마이크 테스트",
  "CREATOR": "크리에이터",
  "Connect & Follow": "연결 및 팔로우",
  "Stay updated with my latest work and projects.": "최신 작업 및 프로젝트에 대한 업데이트를 받으세요.",
  "GitHub": "GitHub",
  "Explore my projects": "프로젝트 탐색",
  "Facebook": "Facebook",
  "Connect with me": "연결하기",
  "Instagram": "Instagram",
  "Follow my journey": "여정 팔로우",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "전문적으로 연결",
  "X": "X",
  "Follow for updates": "팔로우하여 업데이트 받기",
  "Portfolio": "포트폴리오",
  "View my work": "작업 보기",
  "PROFILE": "프로필",
  "Manage your ShezoraX account and personal data.": "ShezoraX 계정 및 개인 데이터를 관리하세요.",
  "Your name": "이름",
  "How ShezoraX should greet you": "ShezoraX가 당신을 어떻게 부를지",
  "Enter your name": "이름을 입력하세요",
  "Google email": "Google 이메일",
  "Connected account": "연결된 계정",
  "Log out of all devices": "모든 디바이스에서 로그아웃",
  "End active ShezoraX sessions on other devices.": "다른 디바이스에서 활성 ShezoraX 세션을 종료합니다.",
  "Delete all chats": "모든 채팅 삭제",
  "Remove your ShezoraX conversations and project chat memory from this device.": "이 디바이스에서 ShezoraX 대화 및 프로젝트 채팅 메모리를 삭제합니다.",
  "Delete account": "계정 삭제",
  "Permanently delete your ShezoraX account when account authentication is connected.": "계정 인증이 연결되면 ShezoraX 계정을 영구 삭제합니다.",
  "GOOGLE ACCOUNT": "GOOGLE 계정",
  "Connect your Google account to use account authentication with ShezoraX.": "ShezoraX에서 계정 인증을 사용하려면 Google 계정을 연결하세요.",
  "Google": "Google",
  "Google connection is ready.": "Google 연결이 준비되었습니다.",
  "Connect your Google account to ShezoraX.": "Google 계정을 ShezoraX에 연결하세요.",
  "Real Google OAuth requires configured authentication credentials.": "실제 Google OAuth에는 구성된 인증 자격 증명이 필요합니다.",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "ShezoraX에서 Apple 계정 인증을 사용하려면 Apple ID를 연결하세요.",
  "Apple ID connection is ready.": "Apple ID 연결이 준비되었습니다.",
  "Connect your Apple ID to ShezoraX.": "Apple ID를 ShezoraX에 연결하세요.",
  "Real Apple Sign In requires configured authentication credentials.": "실제 Apple 로그인에는 구성된 인증 자격 증명이 필요합니다.",
  "RELIGION & FAITH": "종교 및 신앙",
  "Manage the religious and faith-related preferences used by ShezoraX.": "ShezoraX에서 사용하는 종교 및 신앙 관련 환경설정을 관리합니다.",
  "Faith preferences": "신앙 환경설정",

    "Coming soon": "곧 출시",
    "Prayer times": "기도 시간",
    "Get notifications for daily prayer times based on your location.": "위치에 따라 일일 기도 시간 알림을 받으세요.",
    "Qibla direction": "키블라 방향",
    "Find the direction of prayer using your device compass.": "장치 나침반을 사용하여 기도 방향을 찾으세요.",
    "Daily verses": "일일 경전",
    "Receive daily religious verses and reflections in your feed.": "피드에서 일일 종교 경전과 묵상을 받으세요.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "ShezoraX가 신앙 기반 안내를 경험에 통합하는 방식을 구성하세요.",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "이 영역은 종교적 지식, 기도 및 신앙 관련 환경설정을 위해 예약되어 있습니다.",
  "Religious knowledge": "종교적 지식",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX는 종교적 주제를 일반 애플리케이션 환경설정과 별도로 유지할 수 있습니다.",
  "Religion": "종교",
  "Islam": "이슬람교",
  "Christianity": "기독교",
  "Judaism": "유대교",
  "Hinduism": "힌두교",
  "Buddhism": "불교",
  "Sikhism": "시크교",
  "Jainism": "자이나교",
  "Baháʼí Faith": "바하이교",
  "Taoism": "도교",
  "Confucianism": "유교",
  "Shinto": "신토",
  "Zoroastrianism": "조로아스터교",
  "Other / Spiritual": "기타 / 영성",
  "No preference": "선호 없음",

  // Voices & Creator
  "ShezoraX female AI voice": "ShezoraX 여성 AI 음성",
  "ShezoraX male AI voice": "ShezoraX 남성 AI 음성",
  "Connect with Creator": "크리에이터와 연결",
  "Follow the creator behind ShezoraX": "ShezoraX 뒤의 크리에이터 팔로우",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "모든 ShezoraX 채팅을 삭제하시겠습니까?",
  "All chats have been deleted.": "모든 채팅이 삭제되었습니다.",
  "Are you sure you want to delete your ShezoraX account?": "ShezoraX 계정을 삭제하시겠습니까?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "계정 삭제에는 실제 인증 백엔드가 필요합니다. 로컬 프로젝트 데이터는 별도로 제거할 수 있습니다.",
  "Log out of all devices requires a real authentication/session backend.": "모든 디바이스에서 로그아웃하려면 실제 인증/세션 백엔드가 필요합니다.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google 계정 연결 UI가 준비되었습니다. 라이브 인증에는 실제 Google OAuth 자격 증명이 필요합니다.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID 연결 UI가 준비되었습니다. 라이브 인증에는 실제 Apple 로그인 자격 증명이 필요합니다.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "이 브라우저에서는 음성 인식이 지원되지 않습니다. Google Chrome 또는 Microsoft Edge를 사용해 보세요.",
  "I received your message, but no response was returned.": "메시지를 받았지만 응답이 반환되지 않았습니다.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "현재 AI 서비스에 연결할 수 없습니다. ShezoraX 백엔드가 실행 중인지 확인해 주세요.",
  "I received your project request, but no response was returned.": "프로젝트 요청을 받았지만 응답이 반환되지 않았습니다.",
  "I received your creation request, but no response was returned.": "만들기 요청을 받았지만 응답이 반환되지 않았습니다.",
"Full-Stack Developer & AI Engineer — the mind behind": "풀스택 개발자 & AI 엔지니어 —背后的 창조자",
"Connect a provider to add account authentication to ShezoraX.": "ShezoraX에 계정 인증을 추가하려면 제공업체를 연결하세요.",

  },

Japanese: {
  // Navigation & System
  "Home": "ホーム",
  "AI Chat": "AI チャット",
  "Create": "作成",
  "Projects": "プロジェクト",
  "Knowledge": "ナレッジ",
  "Settings": "設定",
  "AI System": "AI システム",
  "Online": "オンライン",
  "Account": "アカウント",
  "Search": "検索",
  "General": "一般",
  "Profile": "プロフィール",
  "Google Account": "Google アカウント",
  "Apple ID": "Apple ID",
  "Religion & Faith": "宗教と信仰",
  "Language": "言語",
  "Voice": "音声",
  "Choose the language used throughout the ShezoraX interface.": "ShezoraX インターフェース全体で使用される言語を選択してください。",
  "Control the language and voice experience of ShezoraX.": "ShezoraX の言語と音声体験を制御します。",
  "Choose the AI voice ShezoraX uses for spoken responses.": "ShezoraX が音声応答に使用する AI 音声を選択してください。",
  "Connected": "接続済み",
  "Ready": "準備完了",
  "Continue with Google": "Google で続行",
  "Continue with Apple ID": "Apple ID で続行",
  "Continue with Apple": "Apple で続行",
  "Good Morning": "おはようございます",
  "Good Afternoon": "こんにちは",
  "Good Evening": "こんばんは",
  "Good Night": "おやすみなさい",
  "Send": "送信",
  "Clear": "クリア",
  "Cancel": "キャンセル",
  "Save": "保存",
  "Delete": "削除",
  "Close": "閉じる",
  "Back": "戻る",
  "Open": "開く",
  "AI System Online": "AI システム オンライン",
  "Female": "女性",
  "Male": "男性",

  // Status & Hero
  "ShezoraX AI Online": "ShezoraX AI オンライン",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "学習、作成、探索、タスク完了のためのインテリジェントなパーソナル AI ワークスペース。",
  "PERSONAL AI": "パーソナル AI",
  "What can I help you with?": "お手伝いできることは何ですか？",
  "Listening…": "聞いています…",
  "Speak": "話す",
  "READY": "準備完了",
  "Ask ShezoraX anything.": "ShezoraX に何でも聞いてください。",
  "You can also use the microphone or one of the quick prompts below.": "マイクまたは以下のクイックプロンプトのいずれかを使用することもできます。",
  "YOU": "あなた",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "考え中…",
  "Ask ShezoraX anything…": "ShezoraX に何でも聞いてください…",
  "Voice input is available": "音声入力が利用可能です",
  "Stop mic": "マイクを停止",
  "Enter to send · Shift + Enter for a new line": "Enter で送信 · Shift + Enter で改行",

  // Suggestions
  "Explain something to me": "何か説明してください",
  "Help me plan my day": "一日の計画を手伝ってください",
  "Teach me about the universe": "宇宙について教えてください",
  "Help me build a project": "プロジェクトの構築を手伝ってください",
  "EXPLORE SHEZORAX": "SHEZORAX を探索",

  // Chat
  "Talk with ShezoraX": "ShezoraX と話す",
  "Start a conversation with ShezoraX.": "ShezoraX と会話を始めましょう。",
  "Ask a question, explain a problem, or describe what you want to build.": "質問をする、問題を説明する、または構築したいものを記述してください。",
  "Message ShezoraX": "ShezoraX にメッセージ",

  // Projects
  "PROJECTS": "プロジェクト",
  "Build something with ShezoraX": "ShezoraX で何かを構築しましょう",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "プロジェクトタイプを選択してください。各ワークスペースには独自の AI チャット、音声入力、音声応答、メモ、保存された会話があります。",
  "Open project workspace →": "プロジェクトワークスペースを開く →",
  "← All Projects": "← すべてのプロジェクト",
  "PROJECT WORKSPACE": "プロジェクトワークスペース",
  "Export": "エクスポート",
  "Project Plan": "プロジェクト計画",
  "Notes": "メモ",
  "Tell ShezoraX what you want to build.": "ShezoraX に構築したいものを教えてください。",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "アイデア、要件、期限、技術、課題の指示、または解決が必要な問題を記述してください。",
  "Working on your project…": "プロジェクトに取り組んでいます…",
  "Listening… speak now": "聞いています…今話してください",
  "Voice + text supported": "音声 + テキスト対応",
  "WORKFLOW": "ワークフロー",
  "Build your project step by step": "プロジェクトを段階的に構築",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "これらのステージを使用してプロジェクトを整理してください。AI チャットタブから ShezoraX に任意のステージを処理させることができます。",
  "Define": "定義",
  "Explain the goal, audience and final result.": "目標、対象者、最終結果を説明してください。",
  "Plan": "計画",
  "Choose features, technology and milestones.": "機能、技術、マイルストーンを選択してください。",
  "Build": "構築",
  "Create the code, content or project material.": "コード、コンテンツ、またはプロジェクト資料を作成してください。",
  "Test": "テスト",
  "Review errors, requirements and edge cases.": "エラー、要件、エッジケースを確認してください。",
  "Polish": "磨き上げ",
  "Improve design, quality and presentation.": "デザイン、品質、プレゼンテーションを改善してください。",
  "Deliver": "納品",
  "Prepare the final files, documentation or presentation.": "最終ファイル、ドキュメント、またはプレゼンテーションを準備してください。",
  "Ask ShezoraX →": "ShezoraX に聞く →",
  "PROJECT MEMORY": "プロジェクトメモリ",
  "Project notes": "プロジェクトメモ",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "要件、リンク、期限、技術、その他のコンテキストを保存してください。メモはこのデバイスに保持され、将来のプロジェクト AI リクエストに含まれます。",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "例：React + Node.js、期限は金曜日、モバイルレスポンシブ必須…",
  "characters · saved locally": "文字 · ローカル保存",
  "Back to Chat": "チャットに戻る",
  "messages": "メッセージ",
  "Copied": "コピーしました",
  "Copy conversation": "会話をコピー",

  // Project Types
  "Website / Web App": "ウェブサイト / Web アプリ",
  "School Project": "学校プロジェクト",
  "College / University": "大学 / 高等教育",
  "Software / Desktop App": "ソフトウェア / デスクトップアプリ",
  "Mobile App": "モバイルアプリ",
  "Game Project": "ゲームプロジェクト",
  "Data / Research": "データ / 研究",
  "Presentation / Report": "プレゼンテーション / レポート",
  "Design / Creative": "デザイン / クリエイティブ",
  "Custom Project": "カスタムプロジェクト",
  "Build websites, dashboards, portfolios and full web applications.": "ウェブサイト、ダッシュボード、ポートフォリオ、完全な Web アプリケーションを構築します。",
  "Create school assignments, experiments, reports and presentations.": "学校の課題、実験、レポート、プレゼンテーションを作成します。",
  "Work on university assignments, FYPs, research and documentation.": "大学の課題、卒業研究、研究、ドキュメントに取り組みます。",
  "Plan software products, desktop tools and utility applications.": "ソフトウェア製品、デスクトップツール、ユーティリティアプリケーションを計画します。",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "AI アシスタント、機械学習アイデア、プロンプト、インテリジェント製品を構築します。",
  "Create Android, iOS and cross-platform mobile applications.": "Android、iOS、クロスプラットフォームのモバイルアプリケーションを作成します。",
  "Build game concepts, mechanics, stories and development plans.": "ゲームコンセプト、メカニクス、ストーリー、開発計画を構築します。",
  "Analyze data, plan research and prepare technical findings.": "データを分析し、研究を計画し、技術的な発見を準備します。",
  "Create reports, presentations, proposals and structured documents.": "レポート、プレゼンテーション、提案、構造化ドキュメントを作成します。",
  "Develop UI/UX, branding, creative concepts and visual direction.": "UI/UX、ブランディング、クリエイティブコンセプト、ビジュアルディレクションを開発します。",
  "Start anything else with a completely custom AI workspace.": "完全にカスタムな AI ワークスペースで他の何でも始めましょう。",

  // Create
  "CREATE": "作成",
  "Create something amazing": "素晴らしいものを作成しましょう",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "作成ツールを選択してください。各ツールは関連する提案とチャットを含む独自のフォーカスされた ShezoraX AI ワークスペースを開きます。",
  "Open workspace →": "ワークスペースを開く →",
  "← All Create Tools": "← すべての作成ツール",
  "CREATE WORKSPACE": "ワークスペース作成",
  "What would you like to create?": "何を作成したいですか？",
  "Start with your own request or choose one of the suggestions for this creation tool.": "独自のリクエストから始めるか、この作成ツールの提案のいずれかを選択してください。",
  "Listening": "聞いています",
  "SUGGESTIONS": "提案",
  "Try one of these": "これらのいずれかを試してください",

  // Create Tools
  "Image Create": "画像作成",
  "Video Create": "動画作成",
  "Photo / Image Editing": "写真 / 画像編集",
  "Resume / CV": "履歴書 / CV",
  "Content Writing": "コンテンツライティング",
  "Presentation Maker": "プレゼンテーションメーカー",
  "Document Creator": "ドキュメント作成",
  "Story & Script Writer": "ストーリー & 脚本作成",
  "Social Media Creator": "ソーシャルメディア作成",
  "Logo & Branding": "ロゴ & ブランディング",
  "Music & Audio": "音楽 & オーディオ",
  "UI / Visual Design": "UI / ビジュアルデザイン",
  "Diagram & Infographic": "図解 & インフォグラフィック",
  "Email & Message Writer": "メール & メッセージ作成",
  "Study Notes & Flashcards": "学習メモ & フラッシュカード",
  "Research & Report Writer": "研究 & レポート作成",
  "Document Converter": "ドキュメント変換",
  "Template Creator": "テンプレート作成",
  "AI Project": "AI プロジェクト",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "AI で画像、コンセプト、シーン、ポートレート、ビジュアルアイデアを作成します。",
  "Plan and create video concepts, scenes, scripts and visual directions.": "動画コンセプト、シーン、脚本、ビジュアルディレクションを計画・作成します。",
  "Improve, transform, retouch and creatively edit images.": "画像を改善、変換、レタッチ、クリエイティブに編集します。",
  "Create professional resumes, CVs, cover letters and career documents.": "プロフェッショナルな履歴書、CV、カバーレター、キャリアドキュメントを作成します。",
  "Write articles, blogs, descriptions, captions and professional content.": "記事、ブログ、説明、キャプション、プロフェッショナルコンテンツを執筆します。",
  "Create slide structures, presentation content and speaker notes.": "スライド構成、プレゼンテーション内容、スピーカーノートを作成します。",
  "Create professional documents, proposals, letters and structured files.": "プロフェッショナルなドキュメント、提案書、手紙、構造化ファイルを作成します。",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "ストーリー、脚本、スクリプト、キャラクター、架空の世界を作成します。",
  "Create captions, posts, content ideas and social media campaigns.": "キャプション、投稿、コンテンツアイデア、ソーシャルメディアキャンペーンを作成します。",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "ブランドアイデンティティ、ロゴコンセプト、名前、カラー、ビジュアルディレクションを開発します。",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "音楽コンセプト、歌詞、サウンドアイデア、ボイススクリプト、オーディオディレクションを作成します。",
  "Create interface concepts, visual systems, layouts and design directions.": "インターフェースコンセプト、ビジュアルシステム、レイアウト、デザインディレクションを作成します。",
  "Create diagrams, flowcharts, infographics and visual explanations.": "図解、フローチャート、インフォグラフィック、ビジュアル説明を作成します。",
  "Write professional emails, messages, replies, invitations and announcements.": "プロフェッショナルなメール、メッセージ、返信、招待状、案内を作成します。",
  "Create general study notes, flashcards, quizzes and revision material.": "一般的な学習メモ、フラッシュカード、クイズ、復習資料を作成します。",
  "Create general reports, structured research writing and analytical documents.": "一般的なレポート、構造化された研究文書、分析ドキュメントを作成します。",
  "Plan document transformations, formatting changes and content conversions.": "ドキュメント変換、フォーマット変更、コンテンツ変換を計画します。",
  "Create reusable templates for documents, posts, emails, planning and more.": "ドキュメント、投稿、メール、計画などの再利用可能なテンプレートを作成します。",

  // Create Tool Suggestions
  "Create a cinematic space scene": "映画的な宇宙シーンを作成",
  "Create a professional profile image": "プロフェッショナルなプロフィール画像を作成",
  "Create a futuristic city concept": "未来的な都市コンセプトを作成",
  "Create a realistic product image": "リアルな製品画像を作成",
  "Create a cinematic video concept": "映画的な動画コンセプトを作成",
  "Create a short promotional video": "短いプロモーション動画を作成",
  "Create a futuristic story video": "未来的なストーリー動画を作成",
  "Create a social media video idea": "ソーシャルメディア動画のアイデアを作成",
  "Improve this image professionally": "この画像をプロフェッショナルに改善",
  "Remove unwanted objects": "不要なオブジェクトを除去",
  "Create a cinematic color grade": "映画的なカラーグレーディングを作成",
  "Turn this image into a different style": "この画像を別のスタイルに変換",
  "Create a modern ATS-friendly CV": "現代的な ATS 対応履歴書を作成",
  "Improve my professional summary": "プロフェッショナルサマリーを改善",
  "Write a strong cover letter": "強力なカバーレターを執筆",
  "Improve my work experience section": "職歴セクションを改善",
  "Write a professional blog post": "プロフェッショナルなブログ記事を執筆",
  "Create an engaging article": "魅力的な記事を作成",
  "Write a product description": "製品説明を執筆",
  "Create a detailed content outline": "詳細なコンテンツアウトラインを作成",
  "Create a professional presentation": "プロフェッショナルなプレゼンテーションを作成",
  "Build a 10-slide presentation structure": "10 スライドのプレゼンテーション構造を構築",
  "Write speaker notes for my slides": "スライドのスピーカーノートを執筆",
  "Create a presentation outline": "プレゼンテーションアウトラインを作成",
  "Create a professional proposal": "プロフェッショナルな提案書を作成",
  "Write a formal document": "フォーマルなドキュメントを執筆",
  "Create a business document": "ビジネスドキュメントを作成",
  "Turn my notes into a structured document": "メモを構造化ドキュメントに変換",
  "Create a science-fiction story": "SF ストーリーを作成",
  "Write a short film script": "短編映画の脚本を執筆",
  "Create interesting characters": "興味深いキャラクターを作成",
  "Build a cinematic story outline": "映画的なストーリーアウトラインを構築",
  "Create an Instagram content plan": "Instagram コンテンツプランを作成",
  "Write a professional LinkedIn post": "プロフェッショナルな LinkedIn 投稿を執筆",
  "Create 10 social media captions": "10 個のソーシャルメディアキャプションを作成",
  "Create a one-week content calendar": "1 週間のコンテンツカレンダーを作成",
  "Create a modern brand identity": "現代的なブランドアイデンティティを作成",
  "Develop a logo concept": "ロゴコンセプトを開発",
  "Create a brand color direction": "ブランドカラーディレクションを作成",
  "Build a complete branding concept": "完全なブランディングコンセプトを構築",
  "Create a cinematic music concept": "映画的な音楽コンセプトを作成",
  "Write lyrics for a song": "曲の歌詞を執筆",
  "Create a podcast intro": "ポッドキャストイントロを作成",
  "Write a professional voice-over script": "プロフェッショナルなナレーションスクリプトを執筆",
  "Create a modern dashboard design": "現代的なダッシュボードデザインを作成",
  "Create a mobile app UI concept": "モバイルアプリ UI コンセプトを作成",
  "Design a futuristic landing page": "未来的なランディングページをデザイン",
  "Create a visual design system": "ビジュアルデザインシステムを作成",
  "Create a process flowchart": "プロセスフローチャートを作成",
  "Create an educational infographic": "教育用インフォグラフィックを作成",
  "Explain this topic with a diagram": "図解でこのトピックを説明",
  "Create a professional system diagram": "プロフェッショナルなシステム図を作成",
  "Write a professional email": "プロフェッショナルなメールを執筆",
  "Write a polite reply": "丁寧な返信を執筆",
  "Create a formal request": "フォーマルなリクエストを作成",
  "Write a professional announcement": "プロフェッショナルな案内を執筆",
  "Create revision notes": "復習ノートを作成",
  "Create flashcards": "フラッシュカードを作成",
  "Create a practice quiz": "練習クイズを作成",
  "Turn these notes into questions": "これらのメモを問題に変換",
  "Create a structured report": "構造化されたレポートを作成",
  "Turn my information into a research-style document": "情報を研究スタイルのドキュメントに変換",
  "Create an executive summary": "エグゼクティブサマリーを作成",
  "Organize this information into sections": "この情報をセクションに整理",
  "Convert this content into a professional format": "このコンテンツをプロフェッショナルなフォーマットに変換",
  "Turn notes into a formal document": "メモをフォーマルなドキュメントに変換",
  "Convert this text into a structured outline": "このテキストを構造化アウトラインに変換",
  "Reformat this document professionally": "このドキュメントをプロフェッショナルに再フォーマット",
  "Create a professional email template": "プロフェッショナルなメールテンプレートを作成",
  "Create a social media template": "ソーシャルメディアテンプレートを作成",
  "Create a professional document template": "プロフェッショナルなドキュメントテンプレートを作成",
  "Create a reusable planning template": "再利用可能な計画テンプレートを作成",

  // Knowledge
  "Universe & Space": "宇宙と宇宙空間",
  "Earth": "地球",
  "Science": "科学",
  "Technology": "テクノロジー",
  "Programming": "プログラミング",
  "History": "歴史",
  "Mathematics": "数学",
  "Physics": "物理学",
  "KNOWLEDGE": "ナレッジ",
  "Knowledge Universe": "知識の宇宙",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "トピックを選ぶと、ShezoraX がフォーカスされた質問で AI チャットを開きます。",

  // Settings
  "SETTINGS": "設定",
  "Manage your ShezoraX preferences, account and personal experience.": "ShezoraX の設定、アカウント、個人体験を管理します。",
  "GENERAL": "一般",
  "Language, voice and general preferences": "言語、音声、一般設定",
  "AI voice replies": "AI 音声応答",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ブラウザの音声合成が利用可能な場合、ShezoraX は一般的な AI 応答を読み上げます。",
  "ON": "オン",
  "OFF": "オフ",
  "Project voice replies": "プロジェクト音声応答",
  "Automatically speak responses inside project workspaces.": "プロジェクトワークスペース内で応答を自動的に読み上げます。",
  "Test Voice": "音声テスト",
  "Test Microphone": "マイクテスト",
  "CREATOR": "クリエイター",
  "Connect & Follow": "つながる & フォロー",
  "Stay updated with my latest work and projects.": "最新の作品やプロジェクトの最新情報を受け取りましょう。",
  "GitHub": "GitHub",
  "Explore my projects": "プロジェクトを探索",
  "Facebook": "Facebook",
  "Connect with me": "つながる",
  "Instagram": "Instagram",
  "Follow my journey": "私の旅をフォロー",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "プロフェッショナルにつながる",
  "X": "X",
  "Follow for updates": "フォローして最新情報を受け取る",
  "Portfolio": "ポートフォリオ",
  "View my work": "作品を見る",
  "PROFILE": "プロフィール",
  "Manage your ShezoraX account and personal data.": "ShezoraX アカウントと個人データを管理します。",
  "Your name": "あなたの名前",
  "How ShezoraX should greet you": "ShezoraX があなたをどのように呼ぶか",
  "Enter your name": "名前を入力してください",
  "Google email": "Google メール",
  "Connected account": "接続されたアカウント",
  "Log out of all devices": "すべてのデバイスからログアウト",
  "End active ShezoraX sessions on other devices.": "他のデバイスでアクティブな ShezoraX セッションを終了します。",
  "Delete all chats": "すべてのチャットを削除",
  "Remove your ShezoraX conversations and project chat memory from this device.": "このデバイスから ShezoraX の会話とプロジェクトチャットメモリを削除します。",
  "Delete account": "アカウントを削除",
  "Permanently delete your ShezoraX account when account authentication is connected.": "アカウント認証が接続されている場合、ShezoraX アカウントを完全に削除します。",
  "GOOGLE ACCOUNT": "GOOGLE アカウント",
  "Connect your Google account to use account authentication with ShezoraX.": "ShezoraX でアカウント認証を使用するために Google アカウントを接続してください。",
  "Google": "Google",
  "Google connection is ready.": "Google 接続の準備ができています。",
  "Connect your Google account to ShezoraX.": "Google アカウントを ShezoraX に接続してください。",
  "Real Google OAuth requires configured authentication credentials.": "実際の Google OAuth には設定済みの認証資格情報が必要です。",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "ShezoraX で Apple アカウント認証を使用するために Apple ID を接続してください。",
  "Apple ID connection is ready.": "Apple ID 接続の準備ができています。",
  "Connect your Apple ID to ShezoraX.": "Apple ID を ShezoraX に接続してください。",
  "Real Apple Sign In requires configured authentication credentials.": "実際の Apple サインインには設定済みの認証資格情報が必要です。",
  "RELIGION & FAITH": "宗教と信仰",
  "Manage the religious and faith-related preferences used by ShezoraX.": "ShezoraX が使用する宗教および信仰関連の設定を管理します。",
  "Faith preferences": "信仰設定",

    "Coming soon": "近日公開",
    "Prayer times": "礼拝時間",
    "Get notifications for daily prayer times based on your location.": "場所に基づいて毎日の礼拝時間の通知を受け取ります。",
    "Qibla direction": "キブラの方向",
    "Find the direction of prayer using your device compass.": "デバイスのコンパスを使用して礼拝の方向を見つけます。",
    "Daily verses": "毎日の聖句",
    "Receive daily religious verses and reflections in your feed.": "フィードで毎日の宗教的な聖句と黙想を受け取ります。",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "ShezoraXが信仰に基づく指導を体験に統合する方法を設定します。",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "このエリアはあなたの宗教的知識、祈り、信仰関連の設定のために予約されています。",
  "Religious knowledge": "宗教的知識",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX は宗教的トピックを一般的なアプリケーション設定から分けて保持できます。",
  "Religion": "宗教",
  "Islam": "イスラム教",
  "Christianity": "キリスト教",
  "Judaism": "ユダヤ教",
  "Hinduism": "ヒンドゥー教",
  "Buddhism": "仏教",
  "Sikhism": "シク教",
  "Jainism": "ジャイナ教",
  "Baháʼí Faith": "バハーイー教",
  "Taoism": "道教",
  "Confucianism": "儒教",
  "Shinto": "神道",
  "Zoroastrianism": "ゾロアスター教",
  "Other / Spiritual": "その他 / スピリチュアル",
  "No preference": "希望なし",

  // Voices & Creator
  "ShezoraX female AI voice": "ShezoraX 女性 AI 音声",
  "ShezoraX male AI voice": "ShezoraX 男性 AI 音声",
  "Connect with Creator": "クリエイターとつながる",
  "Follow the creator behind ShezoraX": "ShezoraX の背後にいるクリエイターをフォロー",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "すべての ShezoraX チャットを削除してもよろしいですか？",
  "All chats have been deleted.": "すべてのチャットが削除されました。",
  "Are you sure you want to delete your ShezoraX account?": "ShezoraX アカウントを削除してもよろしいですか？",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "アカウント削除には実際の認証バックエンドが必要です。ローカルプロジェクトデータは個別に削除できます。",
  "Log out of all devices requires a real authentication/session backend.": "すべてのデバイスからログアウトするには実際の認証/セッションバックエンドが必要です。",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google アカウント接続 UI の準備ができています。ライブ認証には実際の Google OAuth 資格情報が必要です。",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID 接続 UI の準備ができています。ライブ認証には実際の Apple サインイン資格情報が必要です。",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "このブラウザでは音声認識がサポートされていません。Google Chrome または Microsoft Edge をお試しください。",
  "I received your message, but no response was returned.": "メッセージを受信しましたが、応答が返されませんでした。",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "現在 AI サービスに接続できません。ShezoraX バックエンドが実行されていることを確認してください。",
  "I received your project request, but no response was returned.": "プロジェクトリクエストを受信しましたが、応答が返されませんでした。",
  "I received your creation request, but no response was returned.": "作成リクエストを受信しましたが、応答が返されませんでした。",
"Full-Stack Developer & AI Engineer — the mind behind": "フルスタック開発者＆AIエンジニア — その背後にある存在",
"Connect a provider to add account authentication to ShezoraX.": "ShezoraXにアカウント認証を追加するには、プロバイダーを接続してください。",

  },

Arabic: {
// Navigation & System
"Home": "الرئيسية",
"AI Chat": "محادثة الذكاء الاصطناعي",
"Create": "إنشاء",
"Projects": "المشاريع",
"Knowledge": "المعرفة",
"Settings": "الإعدادات",
"AI System": "نظام الذكاء الاصطناعي",
"Online": "متصل",
"Account": "الحساب",
"Search": "بحث",
"General": "عام",
"Profile": "الملف الشخصي",
"Google Account": "حساب Google",
"Apple ID": "Apple ID",
"Religion & Faith": "الدين والإيمان",
"Language": "اللغة",
"Voice": "الصوت",
"Choose the language used throughout the ShezoraX interface.": "اختر اللغة المستخدمة في واجهة ShezoraX بالكامل.",
"Control the language and voice experience of ShezoraX.": "تحكم في تجربة اللغة والصوت في ShezoraX.",
"Choose the AI voice ShezoraX uses for spoken responses.": "اختر صوت الذكاء الاصطناعي الذي يستخدمه ShezoraX للردود المنطوقة.",
"Connected": "متصل",
"Ready": "جاهز",
"Continue with Google": "المتابعة باستخدام Google",
"Continue with Apple ID": "المتابعة باستخدام Apple ID",
"Continue with Apple": "المتابعة باستخدام Apple",
"Good Morning": "صباح الخير",
"Good Afternoon": "مساء الخير",
"Good Evening": "مساء الخير",
"Good Night": "تصبح على خير",
"Send": "إرسال",
"Clear": "مسح",
"Cancel": "إلغاء",
"Save": "حفظ",
"Delete": "حذف",
"Close": "إغلاق",
"Back": "رجوع",
"Open": "فتح",
"AI System Online": "نظام الذكاء الاصطناعي متصل",
"Female": "أنثى",
"Male": "ذكر",

// Status & Hero
"ShezoraX AI Online": "ShezoraX AI متصل",
"Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "مساحة العمل الذكية الشخصية للتعلم والإنشاء والاستكشاف وإنجاز المهام.",
"PERSONAL AI": "ذكاء اصطناعي شخصي",
"What can I help you with?": "كيف يمكنني مساعدتك؟",
"Listening…": "جارٍ الاستماع…",
"Speak": "تحدث",
"READY": "جاهز",
"Ask ShezoraX anything.": "اسأل ShezoraX أي شيء.",
"You can also use the microphone or one of the quick prompts below.": "يمكنك أيضاً استخدام الميكروفون أو أحد الاقتراحات السريعة أدناه.",
"YOU": "أنت",
"SHEZORAX": "SHEZORAX",
"Thinking…": "جارٍ التفكير…",
"Ask ShezoraX anything…": "اسأل ShezoraX أي شيء…",
"Voice input is available": "الإدخال الصوتي متاح",
"Stop mic": "إيقاف الميكروفون",
"Enter to send · Shift + Enter for a new line": "Enter للإرسال · Shift + Enter لسطر جديد",

// Suggestions
"Explain something to me": "اشرح لي شيئاً",
"Help me plan my day": "ساعدني في تخطيط يومي",
"Teach me about the universe": "علمني عن الكون",
"Help me build a project": "ساعدني في بناء مشروع",
"EXPLORE SHEZORAX": "استكشف SHEZORAX",

// Chat
"Talk with ShezoraX": "تحدث مع ShezoraX",
"Start a conversation with ShezoraX.": "ابدأ محادثة مع ShezoraX.",
"Ask a question, explain a problem, or describe what you want to build.": "اطرح سؤالاً أو اشرح مشكلة أو صف ما تريد بناءه.",
"Message ShezoraX": "راسل ShezoraX",

// Projects
"PROJECTS": "المشاريع",
"Build something with ShezoraX": "ابنِ شيئاً مع ShezoraX",
"Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "اختر نوع المشروع. كل مساحة عمل تحتوي على محادثة ذكاء اصطناعي وإدخال صوتي وردود صوتية وملاحظات ومحادثات محفوظة.",
"Open project workspace →": "فتح مساحة عمل المشروع ←",
"← All Projects": "← جميع المشاريع",
"PROJECT WORKSPACE": "مساحة عمل المشروع",
"Export": "تصدير",
"Project Plan": "خطة المشروع",
"Notes": "ملاحظات",
"Tell ShezoraX what you want to build.": "أخبر ShezoraX بما تريد بناءه.",
"Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "صف فكرتك ومتطلباتك والموعد النهائي والتقنية وتعليمات المهمة أو أي مشكلة تحتاج إلى حل.",
"Working on your project…": "جارٍ العمل على مشروعك…",
"Listening… speak now": "جارٍ الاستماع… تحدث الآن",
"Voice + text supported": "الصوت والنص مدعومان",
"WORKFLOW": "سير العمل",
"Build your project step by step": "ابنِ مشروعك خطوة بخطوة",
"Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "استخدم هذه المراحل للحفاظ على تنظيم المشروع. يمكنك طلب مساعدة ShezoraX في أي مرحلة من تبويب محادثة الذكاء الاصطناعي.",
"Define": "التحديد",
"Explain the goal, audience and final result.": "اشرح الهدف والجمهور والنتيجة النهائية.",
"Plan": "التخطيط",
"Choose features, technology and milestones.": "اختر الميزات والتقنية والمراحل الرئيسية.",
"Build": "البناء",
"Create the code, content or project material.": "أنشئ الكود أو المحتوى أو مواد المشروع.",
"Test": "الاختبار",
"Review errors, requirements and edge cases.": "راجع الأخطاء والمتطلبات والحالات الخاصة.",
"Polish": "التحسين",
"Improve design, quality and presentation.": "حسّن التصميم والجودة والعرض.",
"Deliver": "التسليم",
"Prepare the final files, documentation or presentation.": "جهّز الملفات النهائية أو التوثيق أو العرض التقديمي.",
"Ask ShezoraX →": "اسأل ShezoraX ←",
"PROJECT MEMORY": "ذاكرة المشروع",
"Project notes": "ملاحظات المشروع",
"Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "احفظ المتطلبات والروابط والمواعيد النهائية والتقنيات أو أي سياق آخر. تبقى الملاحظات على هذا الجهاز وتُضمّن في طلبات الذكاء الاصطناعي المستقبلية للمشروع.",
"Example: React + Node.js, deadline Friday, must be mobile responsive…": "مثال: React + Node.js، الموعد النهائي يوم الجمعة، يجب أن يكون متجاوباً مع الأجهزة المحمولة…",
"characters · saved locally": "أحرف · محفوظ محلياً",
"Back to Chat": "العودة إلى المحادثة",
"messages": "رسائل",
"Copied": "تم النسخ",
"Copy conversation": "نسخ المحادثة",

// Project Types
"Website / Web App": "موقع ويب / تطبيق ويب",
"School Project": "مشروع مدرسي",
"College / University": "كلية / جامعة",
"Software / Desktop App": "برنامج / تطبيق سطح المكتب",
"Mobile App": "تطبيق جوال",
"Game Project": "مشروع لعبة",
"Data / Research": "بيانات / بحث",
"Presentation / Report": "عرض تقديمي / تقرير",
"Design / Creative": "تصميم / إبداعي",
"Custom Project": "مشروع مخصص",
"Build websites, dashboards, portfolios and full web applications.": "ابنِ مواقع الويب ولوحات التحكم والمعارض الشخصية وتطبيقات الويب الكاملة.",
"Create school assignments, experiments, reports and presentations.": "أنشئ الواجبات المدرسية والتجارب والتقارير والعروض التقديمية.",
"Work on university assignments, FYPs, research and documentation.": "اعمل على واجبات الجامعة ومشاريع التخرج والبحث والتوثيق.",
"Plan software products, desktop tools and utility applications.": "خطط لمنتجات البرامج وأدوات سطح المكتب وتطبيقات الخدمات.",
"Build AI assistants, ML ideas, prompts and intelligent products.": "ابنِ مساعدي ذكاء اصطناعي وأفكار تعلم آلي وأوامر ومنتجات ذكية.",
"Create Android, iOS and cross-platform mobile applications.": "أنشئ تطبيقات جوال لنظامي Android وiOS وعبر المنصات.",
"Build game concepts, mechanics, stories and development plans.": "ابنِ مفاهيم الألعاب والآليات والقصص وخطط التطوير.",
"Analyze data, plan research and prepare technical findings.": "حلل البيانات وخطط للبحث وأعد النتائج التقنية.",
"Create reports, presentations, proposals and structured documents.": "أنشئ التقارير والعروض التقديمية والمقترحات والمستندات المنظمة.",
"Develop UI/UX, branding, creative concepts and visual direction.": "طور واجهات المستخدم والعلامات التجارية والمفاهيم الإبداعية والاتجاه البصري.",
"Start anything else with a completely custom AI workspace.": "ابدأ أي شيء آخر بمساحة عمل ذكاء اصطناعي مخصصة بالكامل.",

// Create
"CREATE": "إنشاء",
"Create something amazing": "أنشئ شيئاً مذهلاً",
"Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "اختر أداة إنشاء. كل أداة تفتح مساحة عمل ShezoraX AI خاصة بها مع اقتراحات ومحادثات ذات صلة.",
"Open workspace →": "فتح مساحة العمل ←",
"← All Create Tools": "← جميع أدوات الإنشاء",
"CREATE WORKSPACE": "مساحة عمل الإنشاء",
"What would you like to create?": "ماذا تريد أن تنشئ؟",
"Start with your own request or choose one of the suggestions for this creation tool.": "ابدأ بطلبك الخاص أو اختر أحد الاقتراحات لأداة الإنشاء هذه.",
"Listening": "جارٍ الاستماع",
"SUGGESTIONS": "الاقتراحات",
"Try one of these": "جرب أحد هذه",

// Create Tools
"Image Create": "إنشاء الصور",
"Video Create": "إنشاء الفيديو",
"Photo / Image Editing": "تحرير الصور",
"Resume / CV": "السيرة الذاتية",
"Content Writing": "كتابة المحتوى",
"Presentation Maker": "صانع العروض التقديمية",
"Document Creator": "منشئ المستندات",
"Story & Script Writer": "كاتب القصص والسيناريوهات",
"Social Media Creator": "منشئ محتوى التواصل الاجتماعي",
"Logo & Branding": "الشعار والعلامة التجارية",
"Music & Audio": "الموسيقى والصوت",
"UI / Visual Design": "تصميم الواجهات / التصميم البصري",
"Diagram & Infographic": "المخططات والرسوم البيانية",
"Email & Message Writer": "كاتب الرسائل والبريد الإلكتروني",
"Study Notes & Flashcards": "ملاحظات دراسية وبطاقات تعليمية",
"Research & Report Writer": "كاتب الأبحاث والتقارير",
"Document Converter": "محوّل المستندات",
"Template Creator": "منشئ القوالب",
"AI Project": "مشروع ذكاء اصطناعي",
"Create images, concepts, scenes, portraits and visual ideas with AI.": "أنشئ صوراً ومفاهيم ومشاهد ولوحات وأفكاراً بصرية باستخدام الذكاء الاصطناعي.",
"Plan and create video concepts, scenes, scripts and visual directions.": "خطط وأنشئ مفاهيم الفيديو والمشاهد والسيناريوهات والاتجاهات البصرية.",
"Improve, transform, retouch and creatively edit images.": "حسّن الصور وحوّلها وعدّلها بإبداع.",
"Create professional resumes, CVs, cover letters and career documents.": "أنشئ سيراً ذاتية ورسائل تغطية ومستندات مهنية احترافية.",
"Write articles, blogs, descriptions, captions and professional content.": "اكتب مقالات ومدونات وأوصافاً وتعليقات ومحتوى احترافياً.",
"Create slide structures, presentation content and speaker notes.": "أنشئ هياكل الشرائح ومحتوى العروض التقديمية وملاحظات المتحدث.",
"Create professional documents, proposals, letters and structured files.": "أنشئ مستندات ومقترحات ورسائل وملفات منظمة احترافية.",
"Create stories, screenplays, scripts, characters and fictional worlds.": "أنشئ قصصاً وسيناريوهات وأعمالاً درامية وشخصيات وعوالم خيالية.",
"Create captions, posts, content ideas and social media campaigns.": "أنشئ تعليقات ومنشورات وأفكار محتوى وحملات تواصل اجتماعي.",
"Develop brand identities, logo concepts, names, colors and visual direction.": "طور هويات العلامات التجارية ومفاهيم الشعارات والأسماء والألوان والاتجاه البصري.",
"Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "أنشئ مفاهيم موسيقية وكلمات وأفكاراً صوتية ونصوصاً صوتية واتجاهاً صوتياً.",
"Create interface concepts, visual systems, layouts and design directions.": "أنشئ مفاهيم الواجهات والأنظمة البصرية والتخطيطات واتجاهات التصميم.",
"Create diagrams, flowcharts, infographics and visual explanations.": "أنشئ مخططات ورسومًا انسيابية ورسومًا بيانية وشرحًا بصريًا.",
"Write professional emails, messages, replies, invitations and announcements.": "اكتب رسائل بريد إلكتروني ورسائل وردود ودعوات وإعلانات احترافية.",
"Create general study notes, flashcards, quizzes and revision material.": "أنشئ ملاحظات دراسية وبطاقات تعليمية واختبارات ومواد مراجعة.",
"Create general reports, structured research writing and analytical documents.": "أنشئ تقارير عامة وكتابة بحثية منظمة ومستندات تحليلية.",
"Plan document transformations, formatting changes and content conversions.": "خطط لتحويلات المستندات وتغييرات التنسيق وتحويلات المحتوى.",
"Create reusable templates for documents, posts, emails, planning and more.": "أنشئ قوالب قابلة لإعادة الاستخدام للمستندات والمنشورات والبريد الإلكتروني والتخطيط وغيرها.",

// Create Tool Suggestions
"Create a cinematic space scene": "أنشئ مشهداً سينمائياً للفضاء",
"Create a professional profile image": "أنشئ صورة ملف شخصي احترافية",
"Create a futuristic city concept": "أنشئ مفهوماً لمدينة مستقبلية",
"Create a realistic product image": "أنشئ صورة منتج واقعية",
"Create a cinematic video concept": "أنشئ مفهوماً لفيديو سينمائي",
"Create a short promotional video": "أنشئ فيديو ترويجياً قصيراً",
"Create a futuristic story video": "أنشئ فيديو قصة مستقبلية",
"Create a social media video idea": "أنشئ فكرة فيديو للتواصل الاجتماعي",
"Improve this image professionally": "حسّن هذه الصورة باحترافية",
"Remove unwanted objects": "أزل العناصر غير المرغوب فيها",
"Create a cinematic color grade": "أنشئ تدرج ألوان سينمائي",
"Turn this image into a different style": "حوّل هذه الصورة إلى نمط مختلف",
"Create a modern ATS-friendly CV": "أنشئ سيرة ذاتية حديثة متوافقة مع أنظمة التوظيف",
"Improve my professional summary": "حسّن ملخصي المهني",
"Write a strong cover letter": "اكتب رسالة تغطية قوية",
"Improve my work experience section": "حسّن قسم خبرتي العملية",
"Write a professional blog post": "اكتب مقال مدونة احترافياً",
"Create an engaging article": "أنشئ مقالاً جذاباً",
"Write a product description": "اكتب وصفاً لمنتج",
"Create a detailed content outline": "أنشئ هيكلاً مفصلاً للمحتوى",
"Create a professional presentation": "أنشئ عرضاً تقديمياً احترافياً",
"Build a 10-slide presentation structure": "ابنِ هيكلاً لعرض تقديمي من 10 شرائح",
"Write speaker notes for my slides": "اكتب ملاحظات المتحدث لشرائحي",
"Create a presentation outline": "أنشئ هيكلاً لعرض تقديمي",
"Create a professional proposal": "أنشئ مقترحاً احترافياً",
"Write a formal document": "اكتب مستنداً رسمياً",
"Create a business document": "أنشئ مستند عمل",
"Turn my notes into a structured document": "حوّل ملاحظاتي إلى مستند منظم",
"Create a science-fiction story": "أنشئ قصة خيال علمي",
"Write a short film script": "اكتب سيناريو لفيلم قصير",
"Create interesting characters": "أنشئ شخصيات مثيرة للاهتمام",
"Build a cinematic story outline": "ابنِ هيكلاً لقصة سينمائية",
"Create an Instagram content plan": "أنشئ خطة محتوى لـ Instagram",
"Write a professional LinkedIn post": "اكتب منشوراً مهنياً لـ LinkedIn",
"Create 10 social media captions": "أنشئ 10 تعليقات للتواصل الاجتماعي",
"Create a one-week content calendar": "أنشئ تقويماً أسبوعياً للمحتوى",
"Create a modern brand identity": "أنشئ هوية علامة تجارية حديثة",
"Develop a logo concept": "طور مفهوماً لشعار",
"Create a brand color direction": "أنشئ اتجاهاً لألوان العلامة التجارية",
"Build a complete branding concept": "ابنِ مفهوماً متكاملاً للعلامة التجارية",
"Create a cinematic music concept": "أنشئ مفهوماً موسيقياً سينمائياً",
"Write lyrics for a song": "اكتب كلمات لأغنية",
"Create a podcast intro": "أنشئ مقدمة بودكاست",
"Write a professional voice-over script": "اكتب نص تعليق صوتي احترافي",
"Create a modern dashboard design": "أنشئ تصميم لوحة تحكم حديثة",
"Create a mobile app UI concept": "أنشئ مفهوماً لواجهة تطبيق جوال",
"Design a futuristic landing page": "صمم صفحة هبوط مستقبلية",
"Create a visual design system": "أنشئ نظام تصميم بصري",
"Create a process flowchart": "أنشئ مخطط انسيابي لعملية",
"Create an educational infographic": "أنشئ رسماً بيانياً تعليمياً",
"Explain this topic with a diagram": "اشرح هذا الموضوع بمخطط",
"Create a professional system diagram": "أنشئ مخطط نظام احترافياً",
"Write a professional email": "اكتب بريد إلكتروني احترافياً",
"Write a polite reply": "اكتب رداً مهذباً",
"Create a formal request": "أنشئ طلباً رسمياً",
"Write a professional announcement": "اكتب إعلاناً احترافياً",
"Create revision notes": "أنشئ ملاحظات مراجعة",
"Create flashcards": "أنشئ بطاقات تعليمية",
"Create a practice quiz": "أنشئ اختباراً تدريبياً",
"Turn these notes into questions": "حوّل هذه الملاحظات إلى أسئلة",
"Create a structured report": "أنشئ تقريراً منظماً",
"Turn my information into a research-style document": "حوّل معلوماتي إلى مستند بأسلوب بحثي",
"Create an executive summary": "أنشئ ملخصاً تنفيذياً",
"Organize this information into sections": "نظم هذه المعلومات في أقسام",
"Convert this content into a professional format": "حوّل هذا المحتوى إلى تنسيق احترافي",
"Turn notes into a formal document": "حوّل الملاحظات إلى مستند رسمي",
"Convert this text into a structured outline": "حوّل هذا النص إلى هيكل منظم",
"Reformat this document professionally": "أعد تنسيق هذا المستند باحترافية",
"Create a professional email template": "أنشئ قالب بريد إلكتروني احترافياً",
"Create a social media template": "أنشئ قالب تواصل اجتماعي",
"Create a professional document template": "أنشئ قالب مستند احترافياً",
"Create a reusable planning template": "أنشئ قالب تخطيط قابل لإعادة الاستخدام",

// Knowledge
"Universe & Space": "الكون والفضاء",
"Earth": "الأرض",
"Science": "العلوم",
"Technology": "التكنولوجيا",
"Programming": "البرمجة",
"History": "التاريخ",
"Mathematics": "الرياضيات",
"Physics": "الفيزياء",
"KNOWLEDGE": "المعرفة",
"Knowledge Universe": "عالم المعرفة",
"Pick a topic and ShezoraX will open the AI chat with a focused question.": "اختر موضوعاً وسيفتح ShezoraX محادثة الذكاء الاصطناعي بسؤال محدد.",

// Settings
"SETTINGS": "الإعدادات",
"Manage your ShezoraX preferences, account and personal experience.": "أدر تفضيلات ShezoraX وحسابك وتجربتك الشخصية.",
"GENERAL": "عام",
"Language, voice and general preferences": "اللغة والصوت والتفضيلات العامة",
"AI voice replies": "ردود الصوت بالذكاء الاصطناعي",
"ShezoraX speaks general AI responses when browser speech synthesis is available.": "ينطق ShezoraX ردود الذكاء الاصطناعي العامة عندما يكون تركيب الكلام في المتصفح متاحاً.",
"ON": "تشغيل",
"OFF": "إيقاف",
"Project voice replies": "ردود صوت المشروع",
"Automatically speak responses inside project workspaces.": "نطق الردود تلقائياً داخل مساحات عمل المشروع.",
"Test Voice": "اختبار الصوت",
"Test Microphone": "اختبار الميكروفون",
"CREATOR": "المبدع",
"Connect & Follow": "تواصل وتابع",
"Stay updated with my latest work and projects.": "ابقَ على اطلاع بأحدث أعمالي ومشاريعي.",
"GitHub": "GitHub",
"Explore my projects": "استكشف مشاريعي",
"Facebook": "Facebook",
"Connect with me": "تواصل معي",
"Instagram": "Instagram",
"Follow my journey": "تابع رحلتي",
"LinkedIn": "LinkedIn",
"Connect professionally": "تواصل مهنياً",
"X": "X",
"Follow for updates": "تابع للحصول على التحديثات",
"Portfolio": "المعرض",
"View my work": "شاهد أعمالي",
"PROFILE": "الملف الشخصي",
"Manage your ShezoraX account and personal data.": "أدر حساب ShezoraX وبياناتك الشخصية.",
"Your name": "اسمك",
"How ShezoraX should greet you": "كيف يجب أن يحييك ShezoraX",
"Enter your name": "أدخل اسمك",
"Google email": "بريد Google الإلكتروني",
"Connected account": "الحساب المتصل",
"Log out of all devices": "تسجيل الخروج من جميع الأجهزة",
"End active ShezoraX sessions on other devices.": "إنهاء جلسات ShezoraX النشطة على الأجهزة الأخرى.",
"Delete all chats": "حذف جميع المحادثات",
"Remove your ShezoraX conversations and project chat memory from this device.": "أزل محادثات ShezoraX وذاكرة محادثة المشروع من هذا الجهاز.",
"Delete account": "حذف الحساب",
"Permanently delete your ShezoraX account when account authentication is connected.": "احذف حساب ShezoraX نهائياً عند ربط مصادقة الحساب.",
"GOOGLE ACCOUNT": "حساب GOOGLE",
"Connect your Google account to use account authentication with ShezoraX.": "اربط حساب Google لاستخدام مصادقة الحساب مع ShezoraX.",
"Google": "Google",
"Google connection is ready.": "اتصال Google جاهز.",
"Connect your Google account to ShezoraX.": "اربط حساب Google بـ ShezoraX.",
"Real Google OAuth requires configured authentication credentials.": "يتطلب Google OAuth الفعلي بيانات اعتماد مصادقة مهيأة.",
"APPLE ID": "APPLE ID",
"Connect your Apple ID to use Apple account authentication with ShezoraX.": "اربط Apple ID لاستخدام مصادقة حساب Apple مع ShezoraX.",
"Apple ID connection is ready.": "اتصال Apple ID جاهز.",
"Connect your Apple ID to ShezoraX.": "اربط Apple ID بـ ShezoraX.",
"Real Apple Sign In requires configured authentication credentials.": "يتطلب تسجيل دخول Apple الفعلي بيانات اعتماد مصادقة مهيأة.",
"RELIGION & FAITH": "الدين والإيمان",
"Manage the religious and faith-related preferences used by ShezoraX.": "أدر التفضيلات الدينية وتفضيلات الإيمان التي يستخدمها ShezoraX.",
"Faith preferences": "تفضيلات الإيمان",

    "Coming soon": "قريباً",
    "Prayer times": "أوقات الصلاة",
    "Get notifications for daily prayer times based on your location.": "احصل على إشعارات بأوقات الصلاة اليومية بناءً على موقعك.",
    "Qibla direction": "اتجاه القبلة",
    "Find the direction of prayer using your device compass.": "ابحث عن اتجاه الصلاة باستخدام بوصلة جهازك.",
    "Daily verses": "الآيات اليومية",
    "Receive daily religious verses and reflections in your feed.": "تلقي الآيات الدينية اليومية والتأملات في خلاصتك.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "قم بتكوين كيفية دمج ShezoraX للإرشاد القائم على الإيمان في تجربتك.",
"This area is reserved for your religious knowledge, prayer and faith-related preferences.": "هذه المنطقة مخصصة لمعرفتك الدينية وصلواتك وتفضيلات الإيمان.",
"Religious knowledge": "المعرفة الدينية",
"ShezoraX can keep religious topics separate from general application preferences.": "يمكن لـ ShezoraX إبقاء المواضيع الدينية منفصلة عن تفضيلات التطبيق العامة.",
"Religion": "الدين",
"Islam": "الإسلام",
"Christianity": "المسيحية",
"Judaism": "اليهودية",
"Hinduism": "الهندوسية",
"Buddhism": "البوذية",
"Sikhism": "السيخية",
"Jainism": "الجينية",
"Baháʼí Faith": "الديانة البهائية",
"Taoism": "الطاوية",
"Confucianism": "الكونفوشيوسية",
"Shinto": "الشنتو",
"Zoroastrianism": "الزرادشتية",
"Other / Spiritual": "أخرى / روحية",
"No preference": "لا تفضيل",

// Voices & Creator
"ShezoraX female AI voice": "صوت أنثى ShezoraX بالذكاء الاصطناعي",
"ShezoraX male AI voice": "صوت ذكر ShezoraX بالذكاء الاصطناعي",
"Connect with Creator": "تواصل مع المبدع",
"Follow the creator behind ShezoraX": "تابع المبدع وراء ShezoraX",

// Alerts
"Are you sure you want to delete all ShezoraX chats?": "هل أنت متأكد من أنك تريد حذف جميع محادثات ShezoraX؟",
"All chats have been deleted.": "تم حذف جميع المحادثات.",
"Are you sure you want to delete your ShezoraX account?": "هل أنت متأكد من أنك تريد حذف حساب ShezoraX الخاص بك؟",
"Account deletion requires a real authentication backend. Your local project data can be removed separately.": "يتطلب حذف الحساب خادم مصادقة حقيقي. يمكن إزالة بيانات المشروع المحلية بشكل منفصل.",
"Log out of all devices requires a real authentication/session backend.": "يتطلب تسجيل الخروج من جميع الأجهزة خادم مصادقة/جلسات حقيقي.",
"Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "واجهة ربط حساب Google جاهزة. مطلوب بيانات اعتماد Google OAuth الفعلية للمصادقة الحية.",
"Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "واجهة ربط Apple ID جاهزة. مطلوب بيانات اعتماد تسجيل دخول Apple الفعلية للمصادقة الحية.",
"Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "التعرف على الصوت غير مدعوم في هذا المتصفح. جرب Google Chrome أو Microsoft Edge.",
"I received your message, but no response was returned.": "تلقيت رسالتك ولكن لم يتم إرجاع أي رد.",
"I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "لا يمكنني الاتصال بخدمة الذكاء الاصطناعي حالياً. يرجى التحقق من أن خادم ShezoraX يعمل.",
"I received your project request, but no response was returned.": "تلقيت طلب المشروع الخاص بك ولكن لم يتم إرجاع أي رد.",
"I received your creation request, but no response was returned.": "تلقيت طلب الإنشاء الخاص بك ولكن لم يتم إرجاع أي رد.",

"Full-Stack Developer & AI Engineer — the mind behind": "مطور متكامل ومهندس ذكاء اصطناعي — العقل المدبر وراء",
"Connect a provider to add account authentication to ShezoraX.": "قم بتوصيل مزود خدمة لإضافة مصادقة الحساب إلى ShezoraX.",

  },

German: {
  // NAVIGATION
  "Home": "Startseite",
  "AI Chat": "KI-Chat",
  "Create": "Erstellen",
  "Projects": "Projekte",
  "Knowledge": "Wissen",
  "Settings": "Einstellungen",
  "AI System": "KI-System",
  "Online": "Online",
  "Account": "Konto",
  "Search": "Suche",
  "General": "Allgemein",
  "Profile": "Profil",
  "Google Account": "Google-Konto",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Religion & Glaube",
  "Language": "Sprache",
  "Voice": "Stimme",
  "Connected": "Verbunden",
  "Ready": "Bereit",
  "Continue with Google": "Mit Google fortfahren",
  "Continue with Apple ID": "Mit Apple ID fortfahren",
  "Continue with Apple": "Mit Apple fortfahren",
  "Good Morning": "Guten Morgen",
  "Good Afternoon": "Guten Tag",
  "Good Evening": "Guten Abend",
  "Good Night": "Gute Nacht",
  "Send": "Senden",
  "Clear": "Leeren",
  "Cancel": "Abbrechen",
  "Save": "Speichern",
  "Delete": "Löschen",
  "Close": "Schließen",
  "Back": "Zurück",
  "Open": "Öffnen",
  "Female": "Weiblich",
  "Male": "Männlich",
  "AI System Online": "KI-System Online",

  // DESCRIPTIONS
  "Choose the language used throughout the ShezoraX interface.": "Wählen Sie die Sprache, die in der gesamten ShezoraX-Oberfläche verwendet wird.",
  "Control the language and voice experience of ShezoraX.": "Steuern Sie das Sprach- und Stimmerlebnis von ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Wählen Sie die KI-Stimme, die ShezoraX für gesprochene Antworten verwendet.",

  // STATUS & HERO
  "ShezoraX AI Online": "ShezoraX KI Online",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Ihr intelligenter persönlicher KI-Arbeitsbereich zum Lernen, Erstellen, Entdecken und Erledigen.",
  "PERSONAL AI": "PERSÖNLICHE KI",
  "What can I help you with?": "Wobei kann ich Ihnen helfen?",
  "Listening\u2026": "Höre zu\u2026",
  "Speak": "Sprechen",
  "READY": "BEREIT",
  "Ask ShezoraX anything.": "Fragen Sie ShezoraX alles.",
  "You can also use the microphone or one of the quick prompts below.": "Sie können auch das Mikrofon oder einen der schnellen Prompts unten verwenden.",
  "YOU": "SIE",
  "SHEZORAX": "SHEZORAX",
  "Thinking\u2026": "Denke nach\u2026",
  "Ask ShezoraX anything\u2026": "Fragen Sie ShezoraX alles\u2026",
  "Voice input is available": "Spracheingabe ist verfügbar",
  "Stop mic": "Mikrofon stoppen",
  "Enter to send \u00b7 Shift + Enter for a new line": "Eingabe zum Senden \u00b7 Shift + Eingabe für eine neue Zeile",

  // SUGGESTIONS
  "Explain something to me": "Erkläre mir etwas",
  "Help me plan my day": "Hilf mir, meinen Tag zu planen",
  "Teach me about the universe": "Bringe mir etwas über das Universum bei",
  "Help me build a project": "Hilf mir, ein Projekt aufzubauen",
  "EXPLORE SHEZORAX": "SHEZORAX ENTDECKEN",

  // CHAT
  "Talk with ShezoraX": "Mit ShezoraX sprechen",
  "Start a conversation with ShezoraX.": "Starten Sie ein Gespräch mit ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Stellen Sie eine Frage, erklären Sie ein Problem oder beschreiben Sie, was Sie erstellen möchten.",
  "Message ShezoraX": "ShezoraX schreiben",

  // PROJECTS
  "PROJECTS": "PROJEKTE",
  "Build something with ShezoraX": "Erstellen Sie etwas mit ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Wählen Sie einen Projekttyp. Jeder Arbeitsbereich hat einen eigenen KI-Chat, Spracheingabe, Sprachantworten, Notizen und gespeicherte Gespräche.",
  "Open project workspace \u2192": "Projektarbeitsbereich öffnen \u2192",
  "\u2190 All Projects": "\u2190 Alle Projekte",
  "PROJECT WORKSPACE": "PROJEKTARBEITSBEREICH",
  "Export": "Exportieren",
  "Project Plan": "Projektplan",
  "Notes": "Notizen",
  "Tell ShezoraX what you want to build.": "Sagen Sie ShezoraX, was Sie erstellen möchten.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Beschreiben Sie Ihre Idee, Anforderungen, Frist, Technologie, Aufgabenanweisungen oder jedes Problem, das gelöst werden muss.",
  "Working on your project\u2026": "Arbeite an Ihrem Projekt\u2026",
  "Listening\u2026 speak now": "Höre zu\u2026 sprechen Sie jetzt",
  "Voice + text supported": "Sprache + Text unterstützt",
  "WORKFLOW": "ARBEITSABLAUF",
  "Build your project step by step": "Erstellen Sie Ihr Projekt Schritt für Schritt",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Verwenden Sie diese Phasen, um das Projekt organisiert zu halten. Sie können ShezoraX bitten, jede Phase über den KI-Chat-Tab zu bearbeiten.",

  // WORKFLOW STEPS
  "Define": "Definieren",
  "Explain the goal, audience and final result.": "Erklären Sie das Ziel, die Zielgruppe und das Endergebnis.",
  "Plan": "Planen",
  "Choose features, technology and milestones.": "Wählen Sie Funktionen, Technologie und Meilensteine.",
  "Build": "Erstellen",
  "Create the code, content or project material.": "Erstellen Sie den Code, Inhalt oder das Projektmaterial.",
  "Test": "Testen",
  "Review errors, requirements and edge cases.": "Überprüfen Sie Fehler, Anforderungen und Sonderfälle.",
  "Polish": "Verfeinern",
  "Improve design, quality and presentation.": "Verbessern Sie Design, Qualität und Präsentation.",
  "Deliver": "Liefern",
  "Prepare the final files, documentation or presentation.": "Bereiten Sie die endgültigen Dateien, Dokumentation oder Präsentation vor.",
  "Ask ShezoraX \u2192": "ShezoraX fragen \u2192",

  // NOTES
  "PROJECT MEMORY": "PROJEKTSPEICHER",
  "Project notes": "Projektnotizen",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Speichern Sie Anforderungen, Links, Fristen, Technologien oder anderen Kontext. Notizen bleiben auf diesem Gerät und werden in zukünftige Projekt-KI-Anfragen einbezogen.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive\u2026": "Beispiel: React + Node.js, Frist Freitag, muss mobilfreundlich sein\u2026",
  "characters \u00b7 saved locally": "Zeichen \u00b7 lokal gespeichert",
  "Back to Chat": "Zurück zum Chat",
  "messages": "Nachrichten",
  "Copied": "Kopiert",
  "Copy conversation": "Gespräch kopieren",

  // CREATE
  "CREATE": "ERSTELLEN",
  "Create something amazing": "Erstellen Sie etwas Außergewöhnliches",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Wählen Sie ein Erstellungswerkzeug. Jedes Werkzeug öffnet einen eigenen fokussierten ShezoraX KI-Arbeitsbereich mit relevanten Vorschlägen und Chat.",
  "Open workspace \u2192": "Arbeitsbereich öffnen \u2192",
  "\u2190 All Create Tools": "\u2190 Alle Erstellungswerkzeuge",
  "CREATE WORKSPACE": "ERSTELLUNGSARBEITSBEREICH",
  "What would you like to create?": "Was möchten Sie erstellen?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Beginnen Sie mit einer eigenen Anfrage oder wählen Sie einen der Vorschläge für dieses Erstellungswerkzeug.",
  "Listening": "Höre zu",
  "SUGGESTIONS": "VORSCHLÄGE",
  "Try one of these": "Probieren Sie einen dieser aus",

  // KNOWLEDGE
  "Universe & Space": "Universum & Weltraum",
  "Earth": "Erde",
  "Science": "Wissenschaft",
  "Technology": "Technologie",
  "Programming": "Programmierung",
  "History": "Geschichte",
  "Mathematics": "Mathematik",
  "Physics": "Physik",
  "KNOWLEDGE": "WISSEN",
  "Knowledge Universe": "Wissensuniversum",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Wählen Sie ein Thema und ShezoraX öffnet den KI-Chat mit einer gezielten Frage.",

  // SETTINGS
  "SETTINGS": "EINSTELLUNGEN",
  "Manage your ShezoraX preferences, account and personal experience.": "Verwalten Sie Ihre ShezoraX-Einstellungen, Ihr Konto und Ihre persönliche Erfahrung.",
  "GENERAL": "ALLGEMEIN",
  "Language, voice and general preferences": "Sprach-, Stimm- und allgemeine Einstellungen",
  "AI voice replies": "KI-Sprachantworten",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX spricht allgemeine KI-Antworten, wenn die Browser-Sprachsynthese verfügbar ist.",
  "ON": "AN",
  "OFF": "AUS",
  "Project voice replies": "Projekt-Sprachantworten",
  "Automatically speak responses inside project workspaces.": "Antworten in Projektarbeitsbereichen automatisch vorlesen.",
  "Test Voice": "Stimme testen",
  "Test Microphone": "Mikrofon testen",
  "CREATOR": "ERSTELLER",
  "Connect & Follow": "Verbinden & Folgen",
  "Stay updated with my latest work and projects.": "Bleiben Sie auf dem Laufenden über meine neuesten Arbeiten und Projekte.",
  "GitHub": "GitHub",
  "Explore my projects": "Meine Projekte entdecken",
  "Facebook": "Facebook",
  "Connect with me": "Mit mir verbinden",
  "Instagram": "Instagram",
  "Follow my journey": "Meiner Reise folgen",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Professionell verbinden",
  "X": "X",
  "Follow for updates": "Für Updates folgen",
  "Portfolio": "Portfolio",
  "View my work": "Meine Arbeiten ansehen",
  "PROFILE": "PROFIL",
  "Manage your ShezoraX account and personal data.": "Verwalten Sie Ihr ShezoraX-Konto und Ihre persönlichen Daten.",
  "Your name": "Ihr Name",
  "How ShezoraX should greet you": "Wie ShezoraX Sie begrüßen soll",
  "Enter your name": "Geben Sie Ihren Namen ein",
  "Google email": "Google-E-Mail",
  "Connected account": "Verbundenes Konto",
  "Log out of all devices": "Von allen Geräten abmelden",
  "End active ShezoraX sessions on other devices.": "Aktive ShezoraX-Sitzungen auf anderen Geräten beenden.",
  "Delete all chats": "Alle Chats löschen",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Entfernen Sie Ihre ShezoraX-Gespräche und den Projekt-Chat-Speicher von diesem Gerät.",
  "Delete account": "Konto löschen",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Löschen Sie Ihr ShezoraX-Konto dauerhaft, wenn die Kontoauthentifizierung verbunden ist.",

  // GOOGLE
  "GOOGLE ACCOUNT": "GOOGLE-KONTO",
  "Connect your Google account to use account authentication with ShezoraX.": "Verbinden Sie Ihr Google-Konto, um die Kontoauthentifizierung mit ShezoraX zu verwenden.",
  "Google": "Google",
  "Google connection is ready.": "Google-Verbindung ist bereit.",
  "Connect your Google account to ShezoraX.": "Verbinden Sie Ihr Google-Konto mit ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "Echtes Google OAuth erfordert konfigurierte Authentifizierungsdaten.",

  // APPLE
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Verbinden Sie Ihre Apple ID, um die Apple-Kontoauthentifizierung mit ShezoraX zu verwenden.",
  "Apple ID connection is ready.": "Apple ID-Verbindung ist bereit.",
  "Connect your Apple ID to ShezoraX.": "Verbinden Sie Ihre Apple ID mit ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "Echtes Apple Sign In erfordert konfigurierte Authentifizierungsdaten.",

  // RELIGION
  "RELIGION & FAITH": "RELIGION & GLAUBE",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Verwalten Sie die religiösen und glaubensbezogenen Einstellungen, die von ShezoraX verwendet werden.",
  "Faith preferences": "Glaubenseinstellungen",

    "Coming soon": "Demnächst",
    "Prayer times": "Gebetszeiten",
    "Get notifications for daily prayer times based on your location.": "Erhalten Sie Benachrichtigungen über tägliche Gebetszeiten basierend auf Ihrem Standort.",
    "Qibla direction": "Qibla-Richtung",
    "Find the direction of prayer using your device compass.": "Finden Sie die Gebetsrichtung mit Ihrem Gerätkompass.",
    "Daily verses": "Tägliche Verse",
    "Receive daily religious verses and reflections in your feed.": "Erhalten Sie tägliche religiöse Verse und Reflexionen in Ihrem Feed.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Konfigurieren Sie, wie ShezoraX glaubensbasierte Anleitung in Ihre Erfahrung integriert.",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Dieser Bereich ist für Ihr religiöses Wissen, Gebet und glaubensbezogene Einstellungen reserviert.",
  "Religious knowledge": "Religiöses Wissen",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX kann religiöse Themen von den allgemeinen Anwendungseinstellungen getrennt halten.",

  // VOICES
  "ShezoraX female AI voice": "ShezoraX weibliche KI-Stimme",
  "ShezoraX male AI voice": "ShezoraX männliche KI-Stimme",
  "Connect with Creator": "Mit dem Ersteller verbinden",
  "Follow the creator behind ShezoraX": "Folgen Sie dem Ersteller hinter ShezoraX",

  // PROJECT TYPE DESCRIPTIONS
  "Build websites, dashboards, portfolios and full web applications.": "Erstellen Sie Websites, Dashboards, Portfolios und vollständige Webanwendungen.",
  "Create school assignments, experiments, reports and presentations.": "Erstellen Sie Schulaufgaben, Experimente, Berichte und Präsentationen.",
  "Work on university assignments, FYPs, research and documentation.": "Arbeiten Sie an Universitätsaufgaben, Abschlussarbeiten, Forschung und Dokumentation.",
  "Plan software products, desktop tools and utility applications.": "Planen Sie Softwareprodukte, Desktop-Tools und Dienstprogramme.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Erstellen Sie KI-Assistenten, ML-Ideen, Prompts und intelligente Produkte.",
  "Create Android, iOS and cross-platform mobile applications.": "Erstellen Sie Android-, iOS- und plattformübergreifende mobile Anwendungen.",
  "Build game concepts, mechanics, stories and development plans.": "Erstellen Sie Spielkonzepte, Mechaniken, Geschichten und Entwicklungspläne.",
  "Analyze data, plan research and prepare technical findings.": "Analysieren Sie Daten, planen Sie Forschung und bereiten Sie technische Ergebnisse vor.",
  "Create reports, presentations, proposals and structured documents.": "Erstellen Sie Berichte, Präsentationen, Vorschläge und strukturierte Dokumente.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Entwickeln Sie UI/UX, Branding, kreative Konzepte und visuelle Richtung.",
  "Start anything else with a completely custom AI workspace.": "Starten Sie alles andere mit einem vollständig benutzerdefinierten KI-Arbeitsbereich.",

  // CREATE TOOL DESCRIPTIONS
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Erstellen Sie Bilder, Konzepte, Szenen, Porträts und visuelle Ideen mit KI.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Planen und erstellen Sie Videokonzepte, Szenen, Skripte und visuelle Richtungen.",
  "Improve, transform, retouch and creatively edit images.": "Verbessern, transformieren, retuschieren und kreativ Bilder bearbeiten.",
  "Create professional resumes, CVs, cover letters and career documents.": "Erstellen Sie professionelle Lebensläufe, CVs, Anschreiben und Karrieredokumente.",
  "Write articles, blogs, descriptions, captions and professional content.": "Schreiben Sie Artikel, Blogs, Beschreibungen, Bildunterschriften und professionelle Inhalte.",
  "Create slide structures, presentation content and speaker notes.": "Erstellen Sie Folienstrukturen, Präsentationeninhalte und Sprechernotizen.",
  "Create professional documents, proposals, letters and structured files.": "Erstellen Sie professionelle Dokumente, Vorschläge, Briefe und strukturierte Dateien.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Erstellen Sie Geschichten, Drehbücher, Skripte, Charaktere und fiktive Welten.",
  "Create captions, posts, content ideas and social media campaigns.": "Erstellen Sie Bildunterschriften, Beiträge, Inhaltideen und Social-Media-Kampagnen.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Entwickeln Sie Markenidentitäten, Logokonzepte, Namen, Farben und visuelle Richtung.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Erstellen Sie Musikkonzepte, Liedtexte, Klangideen, Stimmen-Skripte und Audioregie.",
  "Create interface concepts, visual systems, layouts and design directions.": "Erstellen Sie Oberflächekonzepte, visuelle Systeme, Layouts und Designrichtungen.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Erstellen Sie Diagramme, Flussdiagramme, Infografiken und visuelle Erklärungen.",
  "Write professional emails, messages, replies, invitations and announcements.": "Schreiben Sie professionelle E-Mails, Nachrichten, Antworten, Einladungen und Ankündigungen.",
  "Create general study notes, flashcards, quizzes and revision material.": "Erstellen Sie allgemeine Lernnotizen, Karteikarten, Quizze und Überarbeitungsmaterial.",
  "Create general reports, structured research writing and analytical documents.": "Erstellen Sie allgemeine Berichte, strukturierte Forschungsarbeiten und analytische Dokumente.",
  "Plan document transformations, formatting changes and content conversions.": "Planen Sie Dokumentumwandlungen, Formatierungsänderungen und Inhaltsumrechnungen.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Erstellen Sie wiederverwendbare Vorlagen für Dokumente, Beiträge, E-Mails, Planung und mehr.",

  // MISSING TITLES
  "Email & Message Writer": "E-Mail- & Nachrichtenschreiber",
  "Research & Report Writer": "Forschungs- & Berichtschreiber",
  "Document Converter": "Dokumentkonverter",
  "AI Project": "KI-Projekt",

  // ALL 72 SUGGESTIONS
  "Create a cinematic space scene": "Erstelle eine kinematische Weltraumszene",
  "Create a professional profile image": "Erstelle ein professionelles Profilbild",
  "Create a futuristic city concept": "Erstelle ein futuristisches Stadtkonzept",
  "Create a realistic product image": "Erstelle ein realistisches Produktbild",
  "Create a cinematic video concept": "Erstelle ein kinematisches Videokonzept",
  "Create a short promotional video": "Erstelle ein kurzes Werbevideo",
  "Create a futuristic story video": "Erstelle ein futuristisches Geschichte-Video",
  "Create a social media video idea": "Erstelle eine Social-Media-Videoidee",
  "Improve this image professionally": "Verbessere dieses Bild professionell",
  "Remove unwanted objects": "Entferne unerwünschte Objekte",
  "Create a cinematic color grade": "Erstelle eine kinematische Farbkorrektur",
  "Turn this image into a different style": "Verwandle dieses Bild in einen anderen Stil",
  "Create a modern ATS-friendly CV": "Erstelle einen modernen ATS-freundlichen Lebenslauf",
  "Improve my professional summary": "Verbessere meine professionelle Zusammenfassung",
  "Write a strong cover letter": "Schreibe ein starkes Anschreiben",
  "Improve my work experience section": "Verbessere meinen Berufserfahrungsbereich",
  "Write a professional blog post": "Schreibe einen professionellen Blogbeitrag",
  "Create an engaging article": "Erstelle einen fesselnden Artikel",
  "Write a product description": "Schreibe eine Produktbeschreibung",
  "Create a detailed content outline": "Erstelle einen detaillierten Inhaltsüberblick",
  "Create a professional presentation": "Erstelle eine professionelle Präsentation",
  "Build a 10-slide presentation structure": "Erstelle eine 10-Folien-Präsentationsstruktur",
  "Write speaker notes for my slides": "Schreibe Sprechernotizen für meine Folien",
  "Create a presentation outline": "Erstelle einen Präsentationsüberblick",
  "Create a professional proposal": "Erstelle einen professionellen Vorschlag",
  "Write a formal document": "Schreibe ein formelles Dokument",
  "Create a business document": "Erstelle ein Geschäftsdokument",
  "Turn my notes into a structured document": "Verwandle meine Notizen in ein strukturiertes Dokument",
  "Create a science-fiction story": "Erstelle eine Science-Fiction-Geschichte",
  "Write a short film script": "Schreibe ein Kurzfilm-Drehbuch",
  "Create interesting characters": "Erstelle interessante Charaktere",
  "Build a cinematic story outline": "Erstelle einen kinematischen Geschichtenüberblick",
  "Create an Instagram content plan": "Erstelle einen Instagram-Inhaltsplan",
  "Write a professional LinkedIn post": "Schreibe einen professionellen LinkedIn-Beitrag",
  "Create 10 social media captions": "Erstelle 10 Social-Media-Bildunterschriften",
  "Create a one-week content calendar": "Erstelle einen einwöchigen Inhaltskalender",
  "Create a modern brand identity": "Erstelle eine moderne Markenidentität",
  "Develop a logo concept": "Entwickle ein Logokonzept",
  "Create a brand color direction": "Erstelle eine Markenfarbrichtung",
  "Build a complete branding concept": "Erstelle ein vollständiges Branding-Konzept",
  "Create a cinematic music concept": "Erstelle ein kinematisches Musikkonzept",
  "Write lyrics for a song": "Schreibe Liedtexte für einen Song",
  "Create a podcast intro": "Erstelle ein Podcast-Intro",
  "Write a professional voice-over script": "Schreibe ein professionelles Voiceover-Skript",
  "Create a modern dashboard design": "Erstelle ein modernes Dashboard-Design",
  "Create a mobile app UI concept": "Erstelle ein mobiles App-UI-Konzept",
  "Design a futuristic landing page": "Entwerfe eine futuristische Landingpage",
  "Create a visual design system": "Erstelle ein visuelles Design-System",
  "Create a process flowchart": "Erstelle ein Prozessflussdiagramm",
  "Create an educational infographic": "Erstelle eine lehrreiche Infografik",
  "Explain this topic with a diagram": "Erkläre dieses Thema mit einem Diagramm",
  "Create a professional system diagram": "Erstelle ein professionelles Systemdiagramm",
  "Write a professional email": "Schreibe eine professionelle E-Mail",
  "Write a polite reply": "Schreibe eine höfliche Antwort",
  "Create a formal request": "Erstelle eine formelle Anfrage",
  "Write a professional announcement": "Schreibe eine professionelle Ankündigung",
  "Create revision notes": "Erstelle Überarbeitungsnotizen",
  "Create flashcards": "Erstelle Karteikarten",
  "Create a practice quiz": "Erstelle ein Übungsquiz",
  "Turn these notes into questions": "Verwandle diese Notizen in Fragen",
  "Create a structured report": "Erstelle einen strukturierten Bericht",
  "Turn my information into a research-style document": "Verwandle meine Informationen in ein forschungsartiges Dokument",
  "Create an executive summary": "Erstelle eine Zusammenfassung",
  "Organize this information into sections": "Organisiere diese Informationen in Abschnitte",
  "Convert this content into a professional format": "Konvertiere diesen Inhalt in ein professionelles Format",
  "Turn notes into a formal document": "Verwandle Notizen in ein formelles Dokument",
  "Convert this text into a structured outline": "Konvertiere diesen Text in einen strukturierten Überblick",
  "Reformat this document professionally": "Formatiere dieses Dokument professionell um",
  "Create a professional email template": "Erstelle eine professionelle E-Mail-Vorlage",
  "Create a social media template": "Erstelle eine Social-Media-Vorlage",
  "Create a professional document template": "Erstelle eine professionelle Dokumentvorlage",
  "Create a reusable planning template": "Erstelle eine wiederverwendbare Planungsvorlage",

  // ALERTS
  "Are you sure you want to delete all ShezoraX chats?": "Sind Sie sicher, dass Sie alle ShezoraX-Chats löschen möchten?",
  "All chats have been deleted.": "Alle Chats wurden gelöscht.",
  "Are you sure you want to delete your ShezoraX account?": "Sind Sie sicher, dass Sie Ihr ShezoraX-Konto löschen möchten?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "Die Kontolöschung erfordert ein echtes Authentifizierungs-Backend. Ihre lokalen Projektdaten können separat entfernt werden.",
  "Log out of all devices requires a real authentication/session backend.": "Die Abmeldung von allen Geräten erfordert ein echtes Authentifizierungs-/Sitzungs-Backend.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Die Benutzeroberfläche für die Google-Kontoverbindung ist bereit. Für die Live-Authentifizierung werden echte Google OAuth-Anmeldedaten benötigt.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Die Benutzeroberfläche für die Apple ID-Verbindung ist bereit. Für die Live-Authentifizierung werden echte Apple Sign In-Anmeldedaten benötigt.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "Spracherkennung wird in diesem Browser nicht unterstützt. Versuchen Sie Google Chrome oder Microsoft Edge.",
  "I received your message, but no response was returned.": "Ich habe Ihre Nachricht erhalten, aber keine Antwort zurückbekommen.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Ich kann mich gerade nicht mit dem KI-Dienst verbinden. Bitte überprüfen Sie, ob das ShezoraX-Backend läuft.",
  "I received your project request, but no response was returned.": "Ich habe Ihre Projektanfrage erhalten, aber keine Antwort zurückbekommen.",
  "I received your creation request, but no response was returned.": "Ich habe Ihre Erstellungsanfrage erhalten, aber keine Antwort zurückbekommen.",

  // EXISTING DATA KEYS
  "Website / Web App": "Website / Webanwendung",
  "School Project": "Schulprojekt",
  "College / University": "Hochschule / Universität",
  "Software / Desktop App": "Software / Desktopanwendung",
  "Mobile App": "Mobile App",
  "Game Project": "Spielprojekt",
  "Data / Research": "Daten / Forschung",
  "Presentation / Report": "Präsentation / Bericht",
  "Design / Creative": "Design / Kreativ",
  "Custom Project": "Benutzerdefiniertes Projekt",
  "Image Create": "Bild erstellen",
  "Video Create": "Video erstellen",
  "Photo / Image Editing": "Foto-/Bildbearbeitung",
  "Resume / CV": "Lebenslauf / CV",
  "Content Writing": "Inhaltsschreibung",
  "Presentation Maker": "Präsentationsersteller",
  "Document Creator": "Dokumentenersteller",
  "Story & Script Writer": "Geschichten- & Drehbuchautor",
  "Social Media Creator": "Social-Media-Ersteller",
  "Logo & Branding": "Logo & Branding",
  "Music & Audio": "Musik & Audio",
  "UI / Visual Design": "UI / Visuelles Design",
  "Template Creator": "Vorlagenersteller",
  "Religion": "Religion",
  "Religious knowledge": "Religiöses Wissen",
  "Faith preferences": "Glaubenseinstellungen",

    "Coming soon": "Bientôt disponible",
    "Prayer times": "Heures de prière",
    "Get notifications for daily prayer times based on your location.": "Recevez des notifications pour les heures de prière quotidiennes en fonction de votre emplacement.",
    "Qibla direction": "Direction de la Qibla",
    "Find the direction of prayer using your device compass.": "Trouvez la direction de la prière en utilisant la boussole de votre appareil.",
    "Daily verses": "Versets quotidiens",
    "Receive daily religious verses and reflections in your feed.": "Recevez des versets religieux quotidiens et des réflexions dans votre flux.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Configurez comment ShezoraX intègre les conseils basés sur la foi dans votre expérience.",
  "Islam": "Islam",
  "Christianity": "Christentum",
  "Judaism": "Judentum",
  "Hinduism": "Hinduismus",
  "Buddhism": "Buddhismus",
  "Sikhism": "Sikhismus",
  "Jainism": "Jainismus",
  "Bahá\u02bc\u00ed Faith": "Bahá\u02bc\u00ed-Glaube",
  "Taoism": "Taoismus",
  "Confucianism": "Konfuzianismus",
  "Shinto": "Shinto",
  "Zoroastrianism": "Zoroastrismus",
  "Other / Spiritual": "Andere / Spirituell",
  "No preference": "Keine Präferenz",

"Full-Stack Developer & AI Engineer — the mind behind": "Full-Stack-Entwickler & AI-Ingenieur — der Kopf hinter",
"Connect a provider to add account authentication to ShezoraX.": "Verbinden Sie einen Anbieter, um die Kontoauthentifizierung zu ShezoraX hinzuzufügen.",

  },

French: {
  // NAVIGATION
  "Home": "Accueil",
  "AI Chat": "Chat IA",
  "Create": "Créer",
  "Projects": "Projets",
  "Knowledge": "Connaissances",
  "Settings": "Paramètres",
  "AI System": "Système IA",
  "Online": "En ligne",
  "Account": "Compte",
  "Search": "Recherche",
  "General": "Général",
  "Profile": "Profil",
  "Google Account": "Compte Google",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Religion & Foi",
  "Language": "Langue",
  "Voice": "Voix",
  "Connected": "Connecté",
  "Ready": "Prêt",
  "Continue with Google": "Continuer avec Google",
  "Continue with Apple ID": "Continuer avec Apple ID",
  "Continue with Apple": "Continuer avec Apple",
  "Good Morning": "Bonjour",
  "Good Afternoon": "Bon après-midi",
  "Good Evening": "Bonsoir",
  "Good Night": "Bonne nuit",
  "Send": "Envoyer",
  "Clear": "Effacer",
  "Cancel": "Annuler",
  "Save": "Enregistrer",
  "Delete": "Supprimer",
  "Close": "Fermer",
  "Back": "Retour",
  "Open": "Ouvrir",
  "Female": "Féminin",
  "Male": "Masculin",
  "AI System Online": "Système IA en ligne",

  // DESCRIPTIONS
  "Choose the language used throughout the ShezoraX interface.": "Choisissez la langue utilisée dans toute l'interface ShezoraX.",
  "Control the language and voice experience of ShezoraX.": "Contrôlez l'expérience linguistique et vocale de ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Choisissez la voix IA que ShezoraX utilise pour les réponses vocales.",

  // STATUS & HERO
  "ShezoraX AI Online": "ShezoraX IA en ligne",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Votre espace de travail IA personnel intelligent pour apprendre, créer, explorer et accomplir des tâches.",
  "PERSONAL AI": "IA PERSONNELLE",
  "What can I help you with?": "Comment puis-je vous aider ?",
  "Listening\u2026": "Écoute en cours\u2026",
  "Speak": "Parler",
  "READY": "PRÊT",
  "Ask ShezoraX anything.": "Demandez n'importe quoi à ShezoraX.",
  "You can also use the microphone or one of the quick prompts below.": "Vous pouvez également utiliser le microphone ou l'un des prompts rapides ci-dessous.",
  "YOU": "VOUS",
  "SHEZORAX": "SHEZORAX",
  "Thinking\u2026": "Réflexion en cours\u2026",
  "Ask ShezoraX anything\u2026": "Demandez n'importe quoi à ShezoraX\u2026",
  "Voice input is available": "La saisie vocale est disponible",
  "Stop mic": "Arrêter le micro",
  "Enter to send \u00b7 Shift + Enter for a new line": "Entrée pour envoyer \u00b7 Shift + Entrée pour une nouvelle ligne",

  // SUGGESTIONS
  "Explain something to me": "Expliquez-moi quelque chose",
  "Help me plan my day": "Aidez-moi à planifier ma journée",
  "Teach me about the universe": "Apprenez-moi sur l'univers",
  "Help me build a project": "Aidez-moi à construire un projet",
  "EXPLORE SHEZORAX": "EXPLORER SHEZORAX",

  // CHAT
  "Talk with ShezoraX": "Parler avec ShezoraX",
  "Start a conversation with ShezoraX.": "Commencez une conversation avec ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Posez une question, expliquez un problème ou décrivez ce que vous voulez construire.",
  "Message ShezoraX": "Écrire à ShezoraX",

  // PROJECTS
  "PROJECTS": "PROJETS",
  "Build something with ShezoraX": "Construisez quelque chose avec ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Choisissez un type de projet. Chaque espace de travail a son propre chat IA, saisie vocale, réponses vocales, notes et conversations enregistrées.",
  "Open project workspace \u2192": "Ouvrir l'espace de travail du projet \u2192",
  "\u2190 All Projects": "\u2190 Tous les projets",
  "PROJECT WORKSPACE": "ESPACE DE TRAVAIL DU PROJET",
  "Export": "Exporter",
  "Project Plan": "Plan du projet",
  "Notes": "Notes",
  "Tell ShezoraX what you want to build.": "Dites à ShezoraX ce que vous voulez construire.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Décrivez votre idée, vos exigences, votre délai, votre technologie, vos instructions de travail ou tout problème que vous devez résoudre.",
  "Working on your project\u2026": "Travail en cours sur votre projet\u2026",
  "Listening\u2026 speak now": "Écoute en cours\u2026 parlez maintenant",
  "Voice + text supported": "Voix + texte pris en charge",
  "WORKFLOW": "FLUX DE TRAVAIL",
  "Build your project step by step": "Construisez votre projet étape par étape",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Utilisez ces étapes pour garder le projet organisé. Vous pouvez demander à ShezoraX de gérer n'importe quelle étape depuis l'onglet Chat IA.",

  // WORKFLOW STEPS
  "Define": "Définir",
  "Explain the goal, audience and final result.": "Expliquez l'objectif, le public et le résultat final.",
  "Plan": "Planifier",
  "Choose features, technology and milestones.": "Choisissez les fonctionnalités, la technologie et les étapes clés.",
  "Build": "Construire",
  "Create the code, content or project material.": "Créez le code, le contenu ou le matériel du projet.",
  "Test": "Tester",
  "Review errors, requirements and edge cases.": "Vérifiez les erreurs, les exigences et les cas limites.",
  "Polish": "Peaufiner",
  "Improve design, quality and presentation.": "Améliorez le design, la qualité et la présentation.",
  "Deliver": "Livrer",
  "Prepare the final files, documentation or presentation.": "Préparez les fichiers finaux, la documentation ou la présentation.",
  "Ask ShezoraX \u2192": "Demander à ShezoraX \u2192",

  // NOTES
  "PROJECT MEMORY": "MÉMOIRE DU PROJET",
  "Project notes": "Notes du projet",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Enregistrez les exigences, les liens, les délais, les technologies ou tout autre contexte. Les notes restent sur cet appareil et sont incluses dans les futures demandes IA du projet.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive\u2026": "Exemple : React + Node.js, délai vendredi, doit être responsive\u2026",
  "characters \u00b7 saved locally": "caractères \u00b7 enregistrés localement",
  "Back to Chat": "Retour au chat",
  "messages": "messages",
  "Copied": "Copié",
  "Copy conversation": "Copier la conversation",

  // CREATE
  "CREATE": "CRÉER",
  "Create something amazing": "Créez quelque chose d'incroyable",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Choisissez un outil de création. Chaque outil ouvre son propre espace de travail IA ShezoraX avec des suggestions pertinentes et un chat.",
  "Open workspace \u2192": "Ouvrir l'espace de travail \u2192",
  "\u2190 All Create Tools": "\u2190 Tous les outils de création",
  "CREATE WORKSPACE": "ESPACE DE TRAVAIL DE CRÉATION",
  "What would you like to create?": "Que souhaitez-vous créer ?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Commencez avec votre propre demande ou choisissez l'une des suggestions pour cet outil de création.",
  "Listening": "Écoute en cours",
  "SUGGESTIONS": "SUGGESTIONS",
  "Try one of these": "Essayez l'un de ces",

  // KNOWLEDGE
  "Universe & Space": "Univers & Espace",
  "Earth": "Terre",
  "Science": "Science",
  "Technology": "Technologie",
  "Programming": "Programmation",
  "History": "Histoire",
  "Mathematics": "Mathématiques",
  "Physics": "Physique",
  "KNOWLEDGE": "CONNAISSANCES",
  "Knowledge Universe": "Univers des connaissances",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Choisissez un sujet et ShezoraX ouvrira le chat IA avec une question ciblée.",

  // SETTINGS
  "SETTINGS": "PARAMÈTRES",
  "Manage your ShezoraX preferences, account and personal experience.": "Gérez vos préférences ShezoraX, votre compte et votre expérience personnelle.",
  "GENERAL": "GÉNÉRAL",
  "Language, voice and general preferences": "Préférences de langue, de voix et générales",
  "AI voice replies": "Réponses vocales IA",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX prononce les réponses IA générales lorsque la synthèse vocale du navigateur est disponible.",
  "ON": "ACTIVÉ",
  "OFF": "DÉSACTIVÉ",
  "Project voice replies": "Réponses vocales du projet",
  "Automatically speak responses inside project workspaces.": "Prononcer automatiquement les réponses dans les espaces de travail de projet.",
  "Test Voice": "Tester la voix",
  "Test Microphone": "Tester le microphone",
  "CREATOR": "CRÉATEUR",
  "Connect & Follow": "Se connecter & Suivre",
  "Stay updated with my latest work and projects.": "Restez à jour avec mes derniers travaux et projets.",
  "GitHub": "GitHub",
  "Explore my projects": "Explorer mes projets",
  "Facebook": "Facebook",
  "Connect with me": "Se connecter avec moi",
  "Instagram": "Instagram",
  "Follow my journey": "Suivre mon parcours",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Se connecter professionnellement",
  "X": "X",
  "Follow for updates": "Suivre pour les mises à jour",
  "Portfolio": "Portfolio",
  "View my work": "Voir mes travaux",
  "PROFILE": "PROFIL",
  "Manage your ShezoraX account and personal data.": "Gérez votre compte ShezoraX et vos données personnelles.",
  "Your name": "Votre nom",
  "How ShezoraX should greet you": "Comment ShezoraX doit vous saluer",
  "Enter your name": "Entrez votre nom",
  "Google email": "E-mail Google",
  "Connected account": "Compte connecté",
  "Log out of all devices": "Se déconnecter de tous les appareils",
  "End active ShezoraX sessions on other devices.": "Terminer les sessions ShezoraX actives sur les autres appareils.",
  "Delete all chats": "Supprimer toutes les conversations",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Supprimer vos conversations ShezoraX et la mémoire du chat de projet de cet appareil.",
  "Delete account": "Supprimer le compte",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Supprimer définitivement votre compte ShezoraX lorsque l'authentification du compte est connectée.",

  // GOOGLE
  "GOOGLE ACCOUNT": "COMPTE GOOGLE",
  "Connect your Google account to use account authentication with ShezoraX.": "Connectez votre compte Google pour utiliser l'authentification de compte avec ShezoraX.",
  "Google": "Google",
  "Google connection is ready.": "La connexion Google est prête.",
  "Connect your Google account to ShezoraX.": "Connectez votre compte Google à ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "Un vrai Google OAuth nécessite des identifiants d'authentification configurés.",

  // APPLE
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Connectez votre Apple ID pour utiliser l'authentification de compte Apple avec ShezoraX.",
  "Apple ID connection is ready.": "La connexion Apple ID est prête.",
  "Connect your Apple ID to ShezoraX.": "Connectez votre Apple ID à ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "Un vrai Apple Sign In nécessite des identifiants d'authentification configurés.",

  // RELIGION
  "RELIGION & FAITH": "RELIGION & FOI",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Gérez les préférences religieuses et liées à la foi utilisées par ShezoraX.",
  "Faith preferences": "Préférences de foi",

    "Coming soon": "جلد آ رہا ہے",
    "Prayer times": "نماز کے اوقات",
    "Get notifications for daily prayer times based on your location.": "اپنے مقام کی بنیاد پر روزانہ نماز کے اوقات کی اطلاعات حاصل کریں۔",
    "Qibla direction": "قبلہ کی سمت",
    "Find the direction of prayer using your device compass.": "اپنے آلے کے کمپاس کا استعمال کرتے ہوئے نماز کی سمت تلاش کریں۔",
    "Daily verses": "روزانہ آیات",
    "Receive daily religious verses and reflections in your feed.": "اپنی فیڈ میں روزانہ مذہبی آیات اور تفکرات حاصل کریں۔",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "ترتیب دیں کہ ShezoraX ایمان پر مبنی رہنمائی کو اپنے تجربے میں کیسے شامل کرتا ہے۔",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Cette zone est réservée à vos connaissances religieuses, prières et préférences liées à la foi.",
  "Religious knowledge": "Connaissances religieuses",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX peut garder les sujets religieux séparés des préférences générales de l'application.",

  // VOICES
  "ShezoraX female AI voice": "Voix IA féminine ShezoraX",
  "ShezoraX male AI voice": "Voix IA masculine ShezoraX",
  "Connect with Creator": "Se connecter avec le créateur",
  "Follow the creator behind ShezoraX": "Suivez le créateur derrière ShezoraX",

  // PROJECT TYPE DESCRIPTIONS
  "Build websites, dashboards, portfolios and full web applications.": "Construisez des sites web, des tableaux de bord, des portfolios et des applications web complètes.",
  "Create school assignments, experiments, reports and presentations.": "Créez des devoirs scolaires, des expériences, des rapports et des présentations.",
  "Work on university assignments, FYPs, research and documentation.": "Travaillez sur des devoirs universitaires, des projets de fin d'études, de la recherche et de la documentation.",
  "Plan software products, desktop tools and utility applications.": "Planifiez des produits logiciels, des outils de bureau et des applications utilitaires.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Construisez des assistants IA, des idées ML, des prompts et des produits intelligents.",
  "Create Android, iOS and cross-platform mobile applications.": "Créez des applications mobiles Android, iOS et multiplateformes.",
  "Build game concepts, mechanics, stories and development plans.": "Construisez des concepts de jeux, des mécaniques, des histoires et des plans de développement.",
  "Analyze data, plan research and prepare technical findings.": "Analysez des données, planifiez de la recherche et préparez des résultats techniques.",
  "Create reports, presentations, proposals and structured documents.": "Créez des rapports, des présentations, des propositions et des documents structurés.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Développez l'UI/UX, le branding, des concepts créatifs et une direction visuelle.",
  "Start anything else with a completely custom AI workspace.": "Commencez n'importe quoi d'autre avec un espace de travail IA entièrement personnalisé.",

  // CREATE TOOL DESCRIPTIONS
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Créez des images, des concepts, des scènes, des portraits et des idées visuelles avec l'IA.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Planifiez et créez des concepts vidéo, des scènes, des scripts et des directions visuelles.",
  "Improve, transform, retouch and creatively edit images.": "Améliorez, transformez, retouchez et modifiez creatively des images.",
  "Create professional resumes, CVs, cover letters and career documents.": "Créez des CV professionnels, des lettres de motivation et des documents de carrière.",
  "Write articles, blogs, descriptions, captions and professional content.": "Rédigez des articles, des blogs, des descriptions, des légendes et du contenu professionnel.",
  "Create slide structures, presentation content and speaker notes.": "Créez des structures de diapositives, du contenu de présentation et des notes du présentateur.",
  "Create professional documents, proposals, letters and structured files.": "Créez des documents professionnels, des propositions, des lettres et des fichiers structurés.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Créez des histoires, des scénarios, des scripts, des personnages et des mondes fictifs.",
  "Create captions, posts, content ideas and social media campaigns.": "Créez des légendes, des publications, des idées de contenu et des campagnes de médias sociaux.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Développez des identités de marque, des concepts de logo, des noms, des couleurs et une direction visuelle.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Créez des concepts musicaux, des paroles, des idées sonores, des scripts vocaux et une direction audio.",
  "Create interface concepts, visual systems, layouts and design directions.": "Créez des concepts d'interface, des systèmes visuels, des mises en page et des directions de design.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Créez des diagrammes, des organigrammes, des infographies et des explications visuelles.",
  "Write professional emails, messages, replies, invitations and announcements.": "Rédigez des e-mails professionnels, des messages, des réponses, des invitations et des annonces.",
  "Create general study notes, flashcards, quizzes and revision material.": "Créez des notes d'étude générales, des fiches, des quiz et du matériel de révision.",
  "Create general reports, structured research writing and analytical documents.": "Créez des rapports généraux, des écrits de recherche structurés et des documents analytiques.",
  "Plan document transformations, formatting changes and content conversions.": "Planifiez des transformations de documents, des changements de formatage et des conversions de contenu.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Créez des modèles réutilisables pour des documents, des publications, des e-mails, de la planification et plus encore.",

  // MISSING TITLES
  "Email & Message Writer": "Rédacteur d'e-mails et de messages",
  "Research & Report Writer": "Rédacteur de recherche et de rapports",
  "Document Converter": "Convertisseur de documents",
  "AI Project": "Projet IA",

  // ALL 72 SUGGESTIONS
  "Create a cinematic space scene": "Créer une scène spatiale cinématographique",
  "Create a professional profile image": "Créer une image de profil professionnelle",
  "Create a futuristic city concept": "Créer un concept de ville futuriste",
  "Create a realistic product image": "Créer une image de produit réaliste",
  "Create a cinematic video concept": "Créer un concept vidéo cinématographique",
  "Create a short promotional video": "Créer une courte vidéo promotionnelle",
  "Create a futuristic story video": "Créer une vidéo d'histoire futuriste",
  "Create a social media video idea": "Créer une idée de vidéo pour les réseaux sociaux",
  "Improve this image professionally": "Améliorer cette image professionnellement",
  "Remove unwanted objects": "Supprimer les objets indésirables",
  "Create a cinematic color grade": "Créer un étalonnage cinématographique",
  "Turn this image into a different style": "Transformer cette image dans un style différent",
  "Create a modern ATS-friendly CV": "Créer un CV moderne compatible ATS",
  "Improve my professional summary": "Améliorer mon résumé professionnel",
  "Write a strong cover letter": "Rédiger une lettre de motivation percutante",
  "Improve my work experience section": "Améliorer ma section expérience professionnelle",
  "Write a professional blog post": "Rédiger un article de blog professionnel",
  "Create an engaging article": "Créer un article captivant",
  "Write a product description": "Rédiger une description de produit",
  "Create a detailed content outline": "Créer un plan de contenu détaillé",
  "Create a professional presentation": "Créer une présentation professionnelle",
  "Build a 10-slide presentation structure": "Construire une structure de présentation de 10 diapositives",
  "Write speaker notes for my slides": "Rédiger des notes du présentateur pour mes diapositives",
  "Create a presentation outline": "Créer un plan de présentation",
  "Create a professional proposal": "Créer une proposition professionnelle",
  "Write a formal document": "Rédiger un document formel",
  "Create a business document": "Créer un document commercial",
  "Turn my notes into a structured document": "Transformer mes notes en un document structuré",
  "Create a science-fiction story": "Créer une histoire de science-fiction",
  "Write a short film script": "Rédiger un script de court métrage",
  "Create interesting characters": "Créer des personnages intéressants",
  "Build a cinematic story outline": "Construire un plan d'histoire cinématographique",
  "Create an Instagram content plan": "Créer un plan de contenu Instagram",
  "Write a professional LinkedIn post": "Rédiger une publication LinkedIn professionnelle",
  "Create 10 social media captions": "Créer 10 légendes pour les réseaux sociaux",
  "Create a one-week content calendar": "Créer un calendrier de contenu d'une semaine",
  "Create a modern brand identity": "Créer une identité de marque moderne",
  "Develop a logo concept": "Développer un concept de logo",
  "Create a brand color direction": "Créer une direction de couleurs de marque",
  "Build a complete branding concept": "Construire un concept de branding complet",
  "Create a cinematic music concept": "Créer un concept musical cinématographique",
  "Write lyrics for a song": "Écrire les paroles d'une chanson",
  "Create a podcast intro": "Créer une intro de podcast",
  "Write a professional voice-over script": "Rédiger un script de voix off professionnel",
  "Create a modern dashboard design": "Créer un design de tableau de bord moderne",
  "Create a mobile app UI concept": "Créer un concept d'interface d'application mobile",
  "Design a futuristic landing page": "Concevoir une page d'accueil futuriste",
  "Create a visual design system": "Créer un système de design visuel",
  "Create a process flowchart": "Créer un organigramme de processus",
  "Create an educational infographic": "Créer une infographie éducative",
  "Explain this topic with a diagram": "Expliquer ce sujet avec un diagramme",
  "Create a professional system diagram": "Créer un diagramme de système professionnel",
  "Write a professional email": "Rédiger un e-mail professionnel",
  "Write a polite reply": "Rédiger une réponse polie",
  "Create a formal request": "Créer une demande formelle",
  "Write a professional announcement": "Rédiger une annonce professionnelle",
  "Create revision notes": "Créer des notes de révision",
  "Create flashcards": "Créer des fiches de révision",
  "Create a practice quiz": "Créer un quiz d'entraînement",
  "Turn these notes into questions": "Transformer ces notes en questions",
  "Create a structured report": "Créer un rapport structuré",
  "Turn my information into a research-style document": "Transformer mes informations en un document de style recherche",
  "Create an executive summary": "Créer un résumé exécutif",
  "Organize this information into sections": "Organiser ces informations en sections",
  "Convert this content into a professional format": "Convertir ce contenu en un format professionnel",
  "Turn notes into a formal document": "Transformer des notes en un document formel",
  "Convert this text into a structured outline": "Convertir ce texte en un plan structuré",
  "Reformat this document professionally": "Reformater ce document professionnellement",
  "Create a professional email template": "Créer un modèle d'e-mail professionnel",
  "Create a social media template": "Créer un modèle de médias sociaux",
  "Create a professional document template": "Créer un modèle de document professionnel",
  "Create a reusable planning template": "Créer un modèle de planification réutilisable",

  // ALERTS
  "Are you sure you want to delete all ShezoraX chats?": "Êtes-vous sûr de vouloir supprimer toutes les conversations ShezoraX ?",
  "All chats have been deleted.": "Toutes les conversations ont été supprimées.",
  "Are you sure you want to delete your ShezoraX account?": "Êtes-vous sûr de vouloir supprimer votre compte ShezoraX ?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "La suppression du compte nécessite un vrai backend d'authentification. Vos données de projet locales peuvent être supprimées séparément.",
  "Log out of all devices requires a real authentication/session backend.": "La déconnexion de tous les appareils nécessite un vrai backend d'authentification/de session.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "L'interface de connexion au compte Google est prête. De vrais identifiants Google OAuth sont requis pour l'authentification en direct.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "L'interface de connexion Apple ID est prête. De vrais identifiants Apple Sign In sont requis pour l'authentification en direct.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "La reconnaissance vocale n'est pas prise en charge dans ce navigateur. Essayez Google Chrome ou Microsoft Edge.",
  "I received your message, but no response was returned.": "J'ai reçu votre message, mais aucune réponse n'a été retournée.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Je ne peux pas me connecter au service IA pour le moment. Veuillez vérifier que le backend ShezoraX est en cours d'exécution.",
  "I received your project request, but no response was returned.": "J'ai reçu votre demande de projet, mais aucune réponse n'a été retournée.",
  "I received your creation request, but no response was returned.": "J'ai reçu votre demande de création, mais aucune réponse n'a été retournée.",

  // EXISTING DATA KEYS
  "Website / Web App": "Site web / Application web",
  "School Project": "Projet scolaire",
  "College / University": "Collège / Université",
  "Software / Desktop App": "Logiciel / Application de bureau",
  "Mobile App": "Application mobile",
  "Game Project": "Projet de jeu",
  "Data / Research": "Données / Recherche",
  "Presentation / Report": "Présentation / Rapport",
  "Design / Creative": "Design / Créatif",
  "Custom Project": "Projet personnalisé",
  "Image Create": "Création d'image",
  "Video Create": "Création de vidéo",
  "Photo / Image Editing": "Retouche photo / image",
  "Resume / CV": "CV / Curriculum vitae",
  "Content Writing": "Rédaction de contenu",
  "Presentation Maker": "Créateur de présentations",
  "Document Creator": "Créateur de documents",
  "Story & Script Writer": "Rédacteur d'histoires et de scripts",
  "Social Media Creator": "Créateur de médias sociaux",
  "Logo & Branding": "Logo & Branding",
  "Music & Audio": "Musique & Audio",
  "UI / Visual Design": "UI / Design visuel",
  "Template Creator": "Créateur de modèles",
  "Religion": "Religion",
  "Religious knowledge": "Connaissances religieuses",
  "Faith preferences": "Préférences de foi",

    "Coming soon": "Próximamente",
    "Prayer times": "Horarios de oración",
    "Get notifications for daily prayer times based on your location.": "Recibe notificaciones de los horarios de oración diarios según tu ubicación.",
    "Qibla direction": "Dirección de la Qibla",
    "Find the direction of prayer using your device compass.": "Encuentra la dirección de oración usando la brújula de tu dispositivo.",
    "Daily verses": "Versículos diarios",
    "Receive daily religious verses and reflections in your feed.": "Recibe versículos religiosos diarios y reflexiones en tu feed.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Configura cómo ShezoraX integra la guía basada en la fe en tu experiencia.",
  "Islam": "Islam",
  "Christianity": "Christianisme",
  "Judaism": "Judaïsme",
  "Hinduism": "Hindouisme",
  "Buddhism": "Bouddhisme",
  "Sikhism": "Sikhisme",
  "Jainism": "Jaïnisme",
  "Bahá\u02bc\u00ed Faith": "Foi bahá\u02bc\u00ede",
  "Taoism": "Taoïsme",
  "Confucianism": "Confucianisme",
  "Shinto": "Shintoïsme",
  "Zoroastrianism": "Zoroastrisme",
  "Other / Spiritual": "Autre / Spirituel",
  "No preference": "Aucune préférence",

"Full-Stack Developer & AI Engineer — the mind behind": "Développeur Full-Stack & Ingénieur IA — le créateur derrière",
"Connect a provider to add account authentication to ShezoraX.": "Connectez un fournisseur pour ajouter l'authentification de compte à ShezoraX.",

  },

Urdu: {
// Navigation & System
"Home": "ہوم",
"AI Chat": "اے آئی چیٹ",
"Create": "بنائیں",
"Projects": "پروجیکٹس",
"Knowledge": "علم",
"Settings": "ترتیبات",
"AI System": "اے آئی سسٹم",
"Online": "آن لائن",
"Account": "اکاؤنٹ",
"Search": "تلاش",
"General": "عمومی",
"Profile": "پروفائل",
"Google Account": "Google اکاؤنٹ",
"Apple ID": "Apple ID",
"Religion & Faith": "مذہب اور ایمان",
"Language": "زبان",
"Voice": "آواز",
"Choose the language used throughout the ShezoraX interface.": "ShezoraX انٹرفیس میں استعمال ہونے والی زبان منتخب کریں۔",
"Control the language and voice experience of ShezoraX.": "ShezoraX کے زبان اور آواز کے تجربے کو کنٹرول کریں۔",
"Choose the AI voice ShezoraX uses for spoken responses.": "وہ اے آئی آواز منتخب کریں جو ShezoraX بولنے والے جوابات کے لیے استعمال کرتا ہے۔",
"Connected": "منسلک",
"Ready": "تیار",
"Continue with Google": "Google کے ساتھ جاری رکھیں",
"Continue with Apple ID": "Apple ID کے ساتھ جاری رکھیں",
"Continue with Apple": "Apple کے ساتھ جاری رکھیں",
"Good Morning": "صبح بخیر",
"Good Afternoon": "دوپہر بخیر",
"Good Evening": "شام بخیر",
"Good Night": "شب بخیر",
"Send": "بھیجیں",
"Clear": "صاف کریں",
"Cancel": "منسوخ کریں",
"Save": "محفوظ کریں",
"Delete": "حذف کریں",
"Close": "بند کریں",
"Back": "واپس",
"Open": "کھولیں",
"AI System Online": "اے آئی سسٹم آن لائن",
"Female": "خاتون",
"Male": "مرد",

// Status & Hero
"ShezoraX AI Online": "ShezoraX AI آن لائن",
"Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "سیکھنے، بنانے، دریافت کرنے اور کام مکمل کرنے کے لیے آپ کا ذہین ذاتی اے آئی ورک اسپیس۔",
"PERSONAL AI": "ذاتی اے آئی",
"What can I help you with?": "میں آپ کی کیا مدد کر سکتا ہوں؟",
"Listening…": "سن رہا ہوں…",
"Speak": "بولیں",
"READY": "تیار",
"Ask ShezoraX anything.": "ShezoraX سے کچھ بھی پوچھیں۔",
"You can also use the microphone or one of the quick prompts below.": "آپ مائیکروفون یا نیچے دیے گئے فوری تجاویز میں سے کوئی بھی استعمال کر سکتے ہیں۔",
"YOU": "آپ",
"SHEZORAX": "SHEZORAX",
"Thinking…": "سوچ رہا ہوں…",
"Ask ShezoraX anything…": "ShezoraX سے کچھ بھی پوچھیں…",
"Voice input is available": "صوتی ان پٹ دستیاب ہے",
"Stop mic": "مائیک بند کریں",
"Enter to send · Shift + Enter for a new line": "بھیجنے کے لیے Enter · نئی لائن کے لیے Shift + Enter",

// Suggestions
"Explain something to me": "مجھے کچھ سمجھائیں",
"Help me plan my day": "میرا دن منصوبہ بند کرنے میں مدد کریں",
"Teach me about the universe": "مجھے کائنات کے بارے میں سکھائیں",
"Help me build a project": "مجھے پروجیکٹ بنانے میں مدد کریں",
"EXPLORE SHEZORAX": "SHEZORAX دریافت کریں",

// Chat
"Talk with ShezoraX": "ShezoraX سے بات کریں",
"Start a conversation with ShezoraX.": "ShezoraX سے گفتگو شروع کریں۔",
"Ask a question, explain a problem, or describe what you want to build.": "سوال پوچھیں، مسئلہ بیان کریں، یا بتائیں کہ آپ کیا بنانا چاہتے ہیں۔",
"Message ShezoraX": "ShezoraX کو پیغام بھیجیں",

// Projects
"PROJECTS": "پروجیکٹس",
"Build something with ShezoraX": "ShezoraX کے ساتھ کچھ بنائیں",
"Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "پروجیکٹ کی قسم منتخب کریں۔ ہر ورک اسپیس میں اپنی اے آئی چیٹ، صوتی ان پٹ، صوتی جوابات، نوٹس اور محفوظ گفتگو ہوتی ہے۔",
"Open project workspace →": "پروجیکٹ ورک اسپیس کھولیں →",
"← All Projects": "← تمام پروجیکٹس",
"PROJECT WORKSPACE": "پروجیکٹ ورک اسپیس",
"Export": "ایکسپورٹ",
"Project Plan": "پروجیکٹ پلان",
"Notes": "نوٹس",
"Tell ShezoraX what you want to build.": "ShezoraX کو بتائیں کہ آپ کیا بنانا چاہتے ہیں۔",
"Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "اپنا خیال، ضروریات، آخری تاریخ، ٹیکنالوجی، اسائنمنٹ کی ہدایات یا کوئی بھی مسئلہ بیان کریں جسے آپ حل کرنا چاہتے ہیں۔",
"Working on your project…": "آپ کے پروجیکٹ پر کام ہو رہا ہے…",
"Listening… speak now": "سن رہا ہوں… اب بولیں",
"Voice + text supported": "صوتی + ٹیکسٹ سپورٹڈ",
"WORKFLOW": "ورک فلو",
"Build your project step by step": "اپنا پروجیکٹ قدم بہ قدم بنائیں",
"Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "پروجیکٹ کو منظم رکھنے کے لیے یہ مراحل استعمال کریں۔ آپ ShezoraX سے اے آئی چیٹ ٹیب میں کوئی بھی مرحلہ سنبھالنے کو کہہ سکتے ہیں۔",
"Define": "تعریف",
"Explain the goal, audience and final result.": "مقصد، سامعین اور حتمی نتیجہ بیان کریں۔",
"Plan": "منصوبہ",
"Choose features, technology and milestones.": "خصوصیات، ٹیکنالوجی اور سنگ میل منتخب کریں۔",
"Build": "تعمیر",
"Create the code, content or project material.": "کوڈ، مواد یا پروجیکٹ کا سامان بنائیں۔",
"Test": "جانچ",
"Review errors, requirements and edge cases.": "غلطیوں، ضروریات اور خاص معاملات کا جائزہ لیں۔",
"Polish": "بہتری",
"Improve design, quality and presentation.": "ڈیزائن، معیار اور پیشکش کو بہتر بنائیں۔",
"Deliver": "حوالہ",
"Prepare the final files, documentation or presentation.": "حتمی فائلیں، دستاویزات یا پریزنٹیشن تیار کریں۔",
"Ask ShezoraX →": "ShezoraX سے پوچھیں →",
"PROJECT MEMORY": "پروجیکٹ میموری",
"Project notes": "پروجیکٹ نوٹس",
"Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "ضروریات، لنکس، آخری تاریخیں، ٹیکنالوجیز یا دیگر سیاق محفوظ کریں۔ نوٹس اس ڈیوائس پر رہتے ہیں اور مستقبل کے پروجیکٹ اے آئی درخواستوں میں شامل کیے جاتے ہیں۔",
"Example: React + Node.js, deadline Friday, must be mobile responsive…": "مثال: React + Node.js، آخری تاریخ جمعہ، موبائل کے مطابق ہونا ضروری…",
"characters · saved locally": "حروف · مقامی طور پر محفوظ",
"Back to Chat": "چیٹ پر واپس",
"messages": "پیغامات",
"Copied": "کاپی ہو گیا",
"Copy conversation": "گفتگو کاپی کریں",

// Project Types
"Website / Web App": "ویب سائٹ / ویب ایپ",
"School Project": "اسکول پروجیکٹ",
"College / University": "کالج / یونیورسٹی",
"Software / Desktop App": "سافٹ ویئر / ڈیسک ٹاپ ایپ",
"Mobile App": "موبائل ایپ",
"Game Project": "گیم پروجیکٹ",
"Data / Research": "ڈیٹا / تحقیق",
"Presentation / Report": "پریزنٹیشن / رپورٹ",
"Design / Creative": "ڈیزائن / تخلیقی",
"Custom Project": "اپنی مرضی کا پروجیکٹ",
"Build websites, dashboards, portfolios and full web applications.": "ویب سائٹس، ڈیش بورڈز، پورٹ فولیوز اور مکمل ویب ایپلیکیشنز بنائیں۔",
"Create school assignments, experiments, reports and presentations.": "اسکول کی اسائنمنٹس، تجربات، رپورٹس اور پریزنٹیشنز بنائیں۔",
"Work on university assignments, FYPs, research and documentation.": "یونیورسٹی کی اسائنمنٹس، ایف وائی پیز، تحقیق اور دستاویزات پر کام کریں۔",
"Plan software products, desktop tools and utility applications.": "سافٹ ویئر مصنوعات، ڈیسک ٹاپ ٹولز اور یوٹیلیٹی ایپلیکیشنز کی منصوبہ بندی کریں۔",
"Build AI assistants, ML ideas, prompts and intelligent products.": "اے آئی اسسٹنٹ، ایم ایل آئیڈیاز، پرامپٹس اور ذہین مصنوعات بنائیں۔",
"Create Android, iOS and cross-platform mobile applications.": "Android، iOS اور کراس پلیٹ فارم موبائل ایپلیکیشنز بنائیں۔",
"Build game concepts, mechanics, stories and development plans.": "گیم کے تصورات، میکینکس، کہانیاں اور ترقیاتی منصوبے بنائیں۔",
"Analyze data, plan research and prepare technical findings.": "ڈیٹا کا تجزیہ کریں، تحقیق کی منصوبہ بندی کریں اور تکنیکی نتائج تیار کریں۔",
"Create reports, presentations, proposals and structured documents.": "رپورٹس، پریزنٹیشنز، تجاویز اور منظم دستاویزات بنائیں۔",
"Develop UI/UX, branding, creative concepts and visual direction.": "UI/UX، برانڈنگ، تخلیقی تصورات اور بصری سمت تیار کریں۔",
"Start anything else with a completely custom AI workspace.": "مکمل طور پر اپنی مرضی کے اے آئی ورک اسپیس کے ساتھ کوئی بھی چیز شروع کریں۔",

// Create
"CREATE": "بنائیں",
"Create something amazing": "کچھ شاندار بنائیں",
"Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "تخلیقی ٹول منتخب کریں۔ ہر ٹول اپنی مخصوص ShezoraX AI ورک اسپیس کھولتا ہے متعلقہ تجاویز اور چیٹ کے ساتھ۔",
"Open workspace →": "ورک اسپیس کھولیں →",
"← All Create Tools": "← تمام تخلیقی ٹولز",
"CREATE WORKSPACE": "تخلیقی ورک اسپیس",
"What would you like to create?": "آپ کیا بنانا چاہیں گے؟",
"Start with your own request or choose one of the suggestions for this creation tool.": "اپنی درخواست سے شروع کریں یا اس تخلیقی ٹول کے لیے تجاویز میں سے کوئی ایک منتخب کریں۔",
"Listening": "سن رہا ہوں",
"SUGGESTIONS": "تجاویز",
"Try one of these": "ان میں سے ایک آزمائیں",

// Create Tools
"Image Create": "تصویر بنائیں",
"Video Create": "ویڈیو بنائیں",
"Photo / Image Editing": "تصویر کی ایڈیٹنگ",
"Resume / CV": "ریزیومے / سی وی",
"Content Writing": "مواد لکھنا",
"Presentation Maker": "پریزنٹیشن بنانے والا",
"Document Creator": "دستاویز بنانے والا",
"Story & Script Writer": "کہانی اور اسکرپٹ لکھنے والا",
"Social Media Creator": "سوشل میڈیا مواد بنانے والا",
"Logo & Branding": "لوگو اور برانڈنگ",
"Music & Audio": "موسیقی اور آڈیو",
"UI / Visual Design": "UI / بصری ڈیزائن",
"Diagram & Infographic": "ڈایاگرام اور انفوگرافک",
"Email & Message Writer": "ای میل اور پیغام لکھنے والا",
"Study Notes & Flashcards": "مطالعہ کے نوٹس اور فلیش کارڈز",
"Research & Report Writer": "تحقیق اور رپورٹ لکھنے والا",
"Document Converter": "دستاویز کنورٹر",
"Template Creator": "ٹیمپلیٹ بنانے والا",
"AI Project": "اے آئی پروجیکٹ",
"Create images, concepts, scenes, portraits and visual ideas with AI.": "اے آئی کے ساتھ تصاویر، تصورات، مناظر، پورٹریٹس اور بصری خیالات بنائیں۔",
"Plan and create video concepts, scenes, scripts and visual directions.": "ویڈیو کے تصورات، مناظر، اسکرپٹس اور بصری سمتوں کی منصوبہ بندی اور تخلیق کریں۔",
"Improve, transform, retouch and creatively edit images.": "تصاویر کو بہتر بنائیں، تبدیل کریں، ریٹچ کریں اور تخلیقی طور پر ایڈٹ کریں۔",
"Create professional resumes, CVs, cover letters and career documents.": "پیشہ ورانہ ریزیومے، سی ویز، کور لیٹرز اور کیریئر دستاویزات بنائیں۔",
"Write articles, blogs, descriptions, captions and professional content.": "مضامین، بلاگز، تفصیلات، کیپشنز اور پیشہ ورانہ مواد لکھیں۔",
"Create slide structures, presentation content and speaker notes.": "سلائیڈ کی ساخت، پریزنٹیشن کا مواد اور اسپیکر نوٹس بنائیں۔",
"Create professional documents, proposals, letters and structured files.": "پیشہ ورانہ دستاویزات، تجاویز، خطوط اور منظم فائلیں بنائیں۔",
"Create stories, screenplays, scripts, characters and fictional worlds.": "کہانیاں، اسکرین پلے، اسکرپٹس، کردار اور خیالی دنیاؤں بنائیں۔",
"Create captions, posts, content ideas and social media campaigns.": "کیپشنز، پوسٹس، مواد کے خیالات اور سوشل میڈیا مہمات بنائیں۔",
"Develop brand identities, logo concepts, names, colors and visual direction.": "برانڈ شناخت، لوگو کے تصورات، نام، رنگ اور بصری سمت تیار کریں۔",
"Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "موسیقی کے تصورات، بول، آواز کے خیالات، صوتی اسکرپٹس اور آڈیو سمت بنائیں۔",
"Create interface concepts, visual systems, layouts and design directions.": "انٹرفیس کے تصورات، بصری نظام، لے آؤٹس اور ڈیزائن کی سمت بنائیں۔",
"Create diagrams, flowcharts, infographics and visual explanations.": "ڈایاگرام، فلوچارٹس، انفوگرافکس اور بصری وضاحتیں بنائیں۔",
"Write professional emails, messages, replies, invitations and announcements.": "پیشہ ورانہ ای میلز، پیغامات، جوابات، دعوت نامے اور اعلانات لکھیں۔",
"Create general study notes, flashcards, quizzes and revision material.": "عمومی مطالعہ نوٹس، فلیش کارڈز، کوئزز اور نظرثانی کا مواد بنائیں۔",
"Create general reports, structured research writing and analytical documents.": "عمومی رپورٹس، منظم تحقیقی تحریر اور تجزیاتی دستاویزات بنائیں۔",
"Plan document transformations, formatting changes and content conversions.": "دستاویز کی تبدیلیوں، فارمیٹنگ کی تبدیلیوں اور مواد کی تبدیلیوں کی منصوبہ بندی کریں۔",
"Create reusable templates for documents, posts, emails, planning and more.": "دستاویزات، پوسٹس، ای میلز، منصوبہ بندی اور مزید کے لیے دوبارہ استعمال کے قابل ٹیمپلیٹس بنائیں۔",

// Create Tool Suggestions
"Create a cinematic space scene": "ایک فلمی خلا کا منظر بنائیں",
"Create a professional profile image": "ایک پیشہ ورانہ پروفائل تصویر بنائیں",
"Create a futuristic city concept": "ایک مستقبل کا شہر کا تصور بنائیں",
"Create a realistic product image": "ایک حقیقت پسندانہ مصنوعات کی تصویر بنائیں",
"Create a cinematic video concept": "ایک فلمی ویڈیو کا تصور بنائیں",
"Create a short promotional video": "ایک مختصر پروموشنل ویڈیو بنائیں",
"Create a futuristic story video": "ایک مستقبل کی کہانی کی ویڈیو بنائیں",
"Create a social media video idea": "سوشل میڈیا ویڈیو کا خیال بنائیں",
"Improve this image professionally": "اس تصویر کو پیشہ ورانہ طور پر بہتر بنائیں",
"Remove unwanted objects": "غیر ضروری اشیاء ہٹائیں",
"Create a cinematic color grade": "ایک فلمی کلر گریڈ بنائیں",
"Turn this image into a different style": "اس تصویر کو مختلف انداز میں تبدیل کریں",
"Create a modern ATS-friendly CV": "ایک جدید ATS کے مطابق سی وی بنائیں",
"Improve my professional summary": "میرا پیشہ ورانہ خلاصہ بہتر بنائیں",
"Write a strong cover letter": "ایک مضبوط کور لیٹر لکھیں",
"Improve my work experience section": "میرے کام کے تجربے کا حصہ بہتر بنائیں",
"Write a professional blog post": "ایک پیشہ ورانہ بلاگ پوسٹ لکھیں",
"Create an engaging article": "ایک دلچسپ مضمون بنائیں",
"Write a product description": "مصنوعات کی تفصیل لکھیں",
"Create a detailed content outline": "ایک تفصیلی مواد کا خاکہ بنائیں",
"Create a professional presentation": "ایک پیشہ ورانہ پریزنٹیشن بنائیں",
"Build a 10-slide presentation structure": "10 سلائیڈز کی پریزنٹیشن کی ساخت بنائیں",
"Write speaker notes for my slides": "میری سلائیڈز کے لیے اسپیکر نوٹس لکھیں",
"Create a presentation outline": "پریزنٹیشن کا خاکہ بنائیں",
"Create a professional proposal": "ایک پیشہ ورانہ تجویز بنائیں",
"Write a formal document": "ایک باضابطہ دستاویز لکھیں",
"Create a business document": "ایک کاروباری دستاویز بنائیں",
"Turn my notes into a structured document": "میرے نوٹس کو منظم دستاویز میں تبدیل کریں",
"Create a science-fiction story": "ایک سائنس فکشن کہانی بنائیں",
"Write a short film script": "ایک مختصر فلم کی اسکرپٹ لکھیں",
"Create interesting characters": "دلچسپ کردار بنائیں",
"Build a cinematic story outline": "ایک فلمی کہانی کا خاکہ بنائیں",
"Create an Instagram content plan": "Instagram کے لیے مواد کی منصوبہ بندی بنائیں",
"Write a professional LinkedIn post": "LinkedIn کے لیے پیشہ ورانہ پوسٹ لکھیں",
"Create 10 social media captions": "سوشل میڈیا کے لیے 10 کیپشنز بنائیں",
"Create a one-week content calendar": "ایک ہفتے کا مواد کیلنڈر بنائیں",
"Create a modern brand identity": "ایک جدید برانڈ شناخت بنائیں",
"Develop a logo concept": "لوگو کا تصور تیار کریں",
"Create a brand color direction": "برانڈ کلر کی سمت بنائیں",
"Build a complete branding concept": "مکمل برانڈنگ کا تصور بنائیں",
"Create a cinematic music concept": "ایک فلمی موسیقی کا تصور بنائیں",
"Write lyrics for a song": "گانے کے لیے بول لکھیں",
"Create a podcast intro": "پوڈکاسٹ کا تعارف بنائیں",
"Write a professional voice-over script": "ایک پیشہ ورانہ وائس اوور اسکرپٹ لکھیں",
"Create a modern dashboard design": "ایک جدید ڈیش بورڈ ڈیزائن بنائیں",
"Create a mobile app UI concept": "موبائل ایپ UI کا تصور بنائیں",
"Design a futuristic landing page": "ایک مستقبل کا لینڈنگ پیج ڈیزائن کریں",
"Create a visual design system": "ایک بصری ڈیزائن سسٹم بنائیں",
"Create a process flowchart": "ایک عمل کا فلوچارٹ بنائیں",
"Create an educational infographic": "ایک تعلیمی انفوگرافک بنائیں",
"Explain this topic with a diagram": "اس موضوع کو ڈایاگرام سے سمجھائیں",
"Create a professional system diagram": "ایک پیشہ ورانہ سسٹم ڈایاگرام بنائیں",
"Write a professional email": "ایک پیشہ ورانہ ای میل لکھیں",
"Write a polite reply": "ایک شائستہ جواب لکھیں",
"Create a formal request": "ایک باضابطہ درخواست بنائیں",
"Write a professional announcement": "ایک پیشہ ورانہ اعلان لکھیں",
"Create revision notes": "نظرثانی کے نوٹس بنائیں",
"Create flashcards": "فلیش کارڈز بنائیں",
"Create a practice quiz": "ایک پریکٹس کوئز بنائیں",
"Turn these notes into questions": "ان نوٹس کو سوالات میں تبدیل کریں",
"Create a structured report": "ایک منظم رپورٹ بنائیں",
"Turn my information into a research-style document": "میری معلومات کو تحقیقی طرز کی دستاویز میں تبدیل کریں",
"Create an executive summary": "ایک ایگزیکٹو سمیری بنائیں",
"Organize this information into sections": "اس معلومات کو حصوں میں منظم کریں",
"Convert this content into a professional format": "اس مواد کو پیشہ ورانہ فارمیٹ میں تبدیل کریں",
"Turn notes into a formal document": "نوٹس کو باضابطہ دستاویز میں تبدیل کریں",
"Convert this text into a structured outline": "اس متن کو منظم خاکے میں تبدیل کریں",
"Reformat this document professionally": "اس دستاویز کو پیشہ ورانہ طور پر دوبارہ فارمیٹ کریں",
"Create a professional email template": "ایک پیشہ ورانہ ای میل ٹیمپلیٹ بنائیں",
"Create a social media template": "ایک سوشل میڈیا ٹیمپلیٹ بنائیں",
"Create a professional document template": "ایک پیشہ ورانہ دستاویز ٹیمپلیٹ بنائیں",
"Create a reusable planning template": "ایک دوبارہ استعمال کے قابل منصوبہ بندی کا ٹیمپلیٹ بنائیں",

// Knowledge
"Universe & Space": "کائنات اور خلا",
"Earth": "زمین",
"Science": "سائنس",
"Technology": "ٹیکنالوجی",
"Programming": "پروگرامنگ",
"History": "تاریخ",
"Mathematics": "ریاضی",
"Physics": "طبیعیات",
"KNOWLEDGE": "علم",
"Knowledge Universe": "علم کی کائنات",
"Pick a topic and ShezoraX will open the AI chat with a focused question.": "ایک موضوع منتخب کریں اور ShezoraX مخصوص سوال کے ساتھ اے آئی چیٹ کھولے گا۔",

// Settings
"SETTINGS": "ترتیبات",
"Manage your ShezoraX preferences, account and personal experience.": "اپنی ShezoraX ترجیحات، اکاؤنٹ اور ذاتی تجربے کا انتظام کریں۔",
"GENERAL": "عمومی",
"Language, voice and general preferences": "زبان، آواز اور عمومی ترجیحات",
"AI voice replies": "اے آئی صوتی جوابات",
"ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX عام اے آئی جوابات بولتا ہے جب براؤزر کی اسپیچ سنتھیسس دستیاب ہو۔",
"ON": "چالو",
"OFF": "بند",
"Project voice replies": "پروجیکٹ صوتی جوابات",
"Automatically speak responses inside project workspaces.": "پروجیکٹ ورک اسپیسز میں خودکار طور پر جوابات بولیں۔",
"Test Voice": "آواز کی جانچ",
"Test Microphone": "مائیکروفون کی جانچ",
"CREATOR": "تخلیق کار",
"Connect & Follow": "منسلک ہوں اور فالو کریں",
"Stay updated with my latest work and projects.": "میرے تازہ ترین کام اور پروجیکٹس سے باخبر رہیں۔",
"GitHub": "GitHub",
"Explore my projects": "میرے پروجیکٹس دیکھیں",
"Facebook": "Facebook",
"Connect with me": "مجھ سے منسلک ہوں",
"Instagram": "Instagram",
"Follow my journey": "میرا سفر فالو کریں",
"LinkedIn": "LinkedIn",
"Connect professionally": "پیشہ ورانہ طور پر منسلک ہوں",
"X": "X",
"Follow for updates": "اپ ڈیٹس کے لیے فالو کریں",
"Portfolio": "پورٹ فولیو",
"View my work": "میرا کام دیکھیں",
"PROFILE": "پروفائل",
"Manage your ShezoraX account and personal data.": "اپنا ShezoraX اکاؤنٹ اور ذاتی ڈیٹا کا انتظام کریں۔",
"Your name": "آپ کا نام",
"How ShezoraX should greet you": "ShezoraX آپ کو کیسے سلام کرے",
"Enter your name": "اپنا نام درج کریں",
"Google email": "Google ای میل",
"Connected account": "منسلک اکاؤنٹ",
"Log out of all devices": "تمام ڈیوائسز سے لاگ آؤٹ",
"End active ShezoraX sessions on other devices.": "دیگر ڈیوائسز پر فعال ShezoraX سیشنز ختم کریں۔",
"Delete all chats": "تمام چیٹس حذف کریں",
"Remove your ShezoraX conversations and project chat memory from this device.": "اس ڈیوائس سے اپنی ShezoraX گفتگو اور پروجیکٹ چیٹ میموری ہٹائیں۔",
"Delete account": "اکاؤنٹ حذف کریں",
"Permanently delete your ShezoraX account when account authentication is connected.": "جب اکاؤنٹ کی تصدیق منسلک ہو تو اپنا ShezoraX اکاؤنٹ مستقل طور پر حذف کریں۔",
"GOOGLE ACCOUNT": "GOOGLE اکاؤنٹ",
"Connect your Google account to use account authentication with ShezoraX.": "ShezoraX کے ساتھ اکاؤنٹ کی تصدیق استعمال کرنے کے لیے اپنا Google اکاؤنٹ منسلک کریں۔",
"Google": "Google",
"Google connection is ready.": "Google کنکشن تیار ہے۔",
"Connect your Google account to ShezoraX.": "اپنا Google اکاؤنٹ ShezoraX سے منسلک کریں۔",
"Real Google OAuth requires configured authentication credentials.": "حقیقی Google OAuth کے لیے تشکیل شدہ تصدیقی اسناد درکار ہیں۔",
"APPLE ID": "APPLE ID",
"Connect your Apple ID to use Apple account authentication with ShezoraX.": "ShezoraX کے ساتھ Apple اکاؤنٹ کی تصدیق استعمال کرنے کے لیے اپنا Apple ID منسلک کریں۔",
"Apple ID connection is ready.": "Apple ID کنکشن تیار ہے۔",
"Connect your Apple ID to ShezoraX.": "اپنا Apple ID ShezoraX سے منسلک کریں۔",
"Real Apple Sign In requires configured authentication credentials.": "حقیقی Apple Sign In کے لیے تشکیل شدہ تصدیقی اسناد درکار ہیں۔",
"RELIGION & FAITH": "مذہب اور ایمان",
"Manage the religious and faith-related preferences used by ShezoraX.": "ShezoraX کے ذریعے استعمال ہونے والی مذہبی اور ایمان سے متعلق ترجیحات کا انتظام کریں۔",
"Faith preferences": "ایمان کی ترجیحات",

    "Coming soon": "Em breve",
    "Prayer times": "Horários de oração",
    "Get notifications for daily prayer times based on your location.": "Receba notificações dos horários de oração diários com base na sua localização.",
    "Qibla direction": "Direção da Qibla",
    "Find the direction of prayer using your device compass.": "Encontre a direção da oração usando a bússola do seu dispositivo.",
    "Daily verses": "Versículos diários",
    "Receive daily religious verses and reflections in your feed.": "Receba versículos religiosos diários e reflexões no seu feed.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Configure como o ShezoraX integra a orientação baseada na fé em sua experiência.",
"This area is reserved for your religious knowledge, prayer and faith-related preferences.": "یہ حصہ آپ کے مذہبی علم، دعا اور ایمان سے متعلق ترجیحات کے لیے محفوظ ہے۔",
"Religious knowledge": "مذہبی علم",
"ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX مذہبی موضوعات کو عمومی ایپلیکیشن ترجیحات سے الگ رکھ سکتا ہے۔",
"Religion": "مذہب",
"Islam": "اسلام",
"Christianity": "مسیحیت",
"Judaism": "یہودیت",
"Hinduism": "ہندومت",
"Buddhism": "بدھ مت",
"Sikhism": "سکھ مت",
"Jainism": "جین مت",
"Baháʼí Faith": "بہائی عقیدہ",
"Taoism": "تاؤ مت",
"Confucianism": "کنفیوشس مت",
"Shinto": "شنٹو",
"Zoroastrianism": "زرادشتیت",
"Other / Spiritual": "دیگر / روحانی",
"No preference": "کوئی ترجیح نہیں",

// Voices & Creator
"ShezoraX female AI voice": "ShezoraX خاتون اے آئی آواز",
"ShezoraX male AI voice": "ShezoraX مرد اے آئی آواز",
"Connect with Creator": "تخلیق کار سے منسلک ہوں",
"Follow the creator behind ShezoraX": "ShezoraX کے پیچھے تخلیق کار کو فالو کریں",

// Alerts
"Are you sure you want to delete all ShezoraX chats?": "کیا آپ واقعی تمام ShezoraX چیٹس حذف کرنا چاہتے ہیں؟",
"All chats have been deleted.": "تمام چیٹس حذف کر دی گئی ہیں۔",
"Are you sure you want to delete your ShezoraX account?": "کیا آپ واقعی اپنا ShezoraX اکاؤنٹ حذف کرنا چاہتے ہیں؟",
"Account deletion requires a real authentication backend. Your local project data can be removed separately.": "اکاؤنٹ حذف کرنے کے لیے حقیقی تصدیقی بیک اینڈ درکار ہے۔ آپ کا مقامی پروجیکٹ ڈیٹا الگ سے ہٹایا جا سکتا ہے۔",
"Log out of all devices requires a real authentication/session backend.": "تمام ڈیوائسز سے لاگ آؤٹ کے لیے حقیقی تصدیقی/سیشن بیک اینڈ درکار ہے۔",
"Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google اکاؤنٹ کنکشن کا UI تیار ہے۔ براہ راست تصدیق کے لیے حقیقی Google OAuth اسناد درکار ہیں۔",
"Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID کنکشن کا UI تیار ہے۔ براہ راست تصدیق کے لیے حقیقی Apple Sign In اسناد درکار ہیں۔",
"Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "اس براؤزر میں صوتی شناخت سپورٹ نہیں ہے۔ Google Chrome یا Microsoft Edge آزمائیں۔",
"I received your message, but no response was returned.": "مجھے آپ کا پیغام موصول ہوا لیکن کوئی جواب نہیں ملا۔",
"I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "میں اس وقت اے آئی سروس سے منسلک نہیں ہو سکتا۔ براہ کرم چیک کریں کہ ShezoraX بیک اینڈ چل رہا ہے۔",
"I received your project request, but no response was returned.": "مجھے آپ کی پروجیکٹ درخواست موصول ہوئی لیکن کوئی جواب نہیں ملا۔",
"I received your creation request, but no response was returned.": "مجھے آپ کی تخلیقی درخواست موصول ہوئی لیکن کوئی جواب نہیں ملا۔",

"Full-Stack Developer & AI Engineer — the mind behind": "فل اسٹیک ڈیولپر اور AI انجینئر — کے پیچھے ذہن",
"Connect a provider to add account authentication to ShezoraX.": "ShezoraX میں اکاؤنٹ کی توثیق شامل کرنے کے لیے ایک فراہم کنندہ سے جڑیں۔",

  },

Spanish: {
  // NAVIGATION
  "Home": "Inicio",
  "AI Chat": "Chat IA",
  "Create": "Crear",
  "Projects": "Proyectos",
  "Knowledge": "Conocimiento",
  "Settings": "Configuración",
  "AI System": "Sistema IA",
  "Online": "En línea",
  "Account": "Cuenta",
  "Search": "Buscar",
  "General": "General",
  "Profile": "Perfil",
  "Google Account": "Cuenta de Google",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Religión y Fe",
  "Language": "Idioma",
  "Voice": "Voz",
  "Connected": "Conectado",
  "Ready": "Listo",
  "Continue with Google": "Continuar con Google",
  "Continue with Apple ID": "Continuar con Apple ID",
  "Continue with Apple": "Continuar con Apple",
  "Good Morning": "Buenos días",
  "Good Afternoon": "Buenas tardes",
  "Good Evening": "Buenas noches",
  "Good Night": "Buenas noches",
  "Send": "Enviar",
  "Clear": "Borrar",
  "Cancel": "Cancelar",
  "Save": "Guardar",
  "Delete": "Eliminar",
  "Close": "Cerrar",
  "Back": "Volver",
  "Open": "Abrir",
  "Female": "Femenino",
  "Male": "Masculino",
  "AI System Online": "Sistema IA en línea",

  // DESCRIPTIONS
  "Choose the language used throughout the ShezoraX interface.": "Elige el idioma utilizado en toda la interfaz de ShezoraX.",
  "Control the language and voice experience of ShezoraX.": "Controla la experiencia de idioma y voz de ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Elige la voz de IA que ShezoraX usa para las respuestas habladas.",

  // STATUS & HERO
  "ShezoraX AI Online": "ShezoraX IA en línea",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Tu espacio de trabajo IA personal inteligente para aprender, crear, explorar y realizar tareas.",
  "PERSONAL AI": "IA PERSONAL",
  "What can I help you with?": "¿En qué puedo ayudarte?",
  "Listening\u2026": "Escuchando\u2026",
  "Speak": "Hablar",
  "READY": "LISTO",
  "Ask ShezoraX anything.": "Pregúntale cualquier cosa a ShezoraX.",
  "You can also use the microphone or one of the quick prompts below.": "También puedes usar el micrófono o uno de los prompts rápidos a continuación.",
  "YOU": "TÚ",
  "SHEZORAX": "SHEZORAX",
  "Thinking\u2026": "Pensando\u2026",
  "Ask ShezoraX anything\u2026": "Pregúntale cualquier cosa a ShezoraX\u2026",
  "Voice input is available": "La entrada de voz está disponible",
  "Stop mic": "Detener micrófono",
  "Enter to send \u00b7 Shift + Enter for a new line": "Enter para enviar \u00b7 Shift + Enter para una nueva línea",

  // SUGGESTIONS
  "Explain something to me": "Explícame algo",
  "Help me plan my day": "Ayúdame a planificar mi día",
  "Teach me about the universe": "Enséñame sobre el universo",
  "Help me build a project": "Ayúdame a construir un proyecto",
  "EXPLORE SHEZORAX": "EXPLORAR SHEZORAX",

  // CHAT
  "Talk with ShezoraX": "Hablar con ShezoraX",
  "Start a conversation with ShezoraX.": "Inicia una conversación con ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Haz una pregunta, explica un problema o describe lo que quieres construir.",
  "Message ShezoraX": "Escribir a ShezoraX",

  // PROJECTS
  "PROJECTS": "PROYECTOS",
  "Build something with ShezoraX": "Construye algo con ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Elige un tipo de proyecto. Cada espacio de trabajo tiene su propio chat IA, entrada de voz, respuestas de voz, notas y conversaciones guardadas.",
  "Open project workspace \u2192": "Abrir espacio de trabajo del proyecto \u2192",
  "\u2190 All Projects": "\u2190 Todos los proyectos",
  "PROJECT WORKSPACE": "ESPACIO DE TRABAJO DEL PROYECTO",
  "Export": "Exportar",
  "Project Plan": "Plan del proyecto",
  "Notes": "Notas",
  "Tell ShezoraX what you want to build.": "Dile a ShezoraX lo que quieres construir.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Describe tu idea, requisitos, plazo, tecnología, instrucciones de la tarea o cualquier problema que necesites resolver.",
  "Working on your project\u2026": "Trabajando en tu proyecto\u2026",
  "Listening\u2026 speak now": "Escuchando\u2026 habla ahora",
  "Voice + text supported": "Voz + texto compatible",
  "WORKFLOW": "FLUJO DE TRABAJO",
  "Build your project step by step": "Construye tu proyecto paso a paso",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Usa estas etapas para mantener el proyecto organizado. Puedes pedirle a ShezoraX que maneje cualquier etapa desde la pestaña de Chat IA.",

  // WORKFLOW STEPS
  "Define": "Definir",
  "Explain the goal, audience and final result.": "Explica el objetivo, la audiencia y el resultado final.",
  "Plan": "Planificar",
  "Choose features, technology and milestones.": "Elige funciones, tecnología y hitos.",
  "Build": "Construir",
  "Create the code, content or project material.": "Crea el código, contenido o material del proyecto.",
  "Test": "Probar",
  "Review errors, requirements and edge cases.": "Revisa errores, requisitos y casos extremos.",
  "Polish": "Pulir",
  "Improve design, quality and presentation.": "Mejora el diseño, la calidad y la presentación.",
  "Deliver": "Entregar",
  "Prepare the final files, documentation or presentation.": "Prepara los archivos finales, la documentación o la presentación.",
  "Ask ShezoraX \u2192": "Preguntar a ShezoraX \u2192",

  // NOTES
  "PROJECT MEMORY": "MEMORIA DEL PROYECTO",
  "Project notes": "Notas del proyecto",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Guarda requisitos, enlaces, plazos, tecnologías u otro contexto. Las notas permanecen en este dispositivo y se incluyen en futuras solicitudes de IA del proyecto.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive\u2026": "Ejemplo: React + Node.js, plazo viernes, debe ser responsive\u2026",
  "characters \u00b7 saved locally": "caracteres \u00b7 guardados localmente",
  "Back to Chat": "Volver al chat",
  "messages": "mensajes",
  "Copied": "Copiado",
  "Copy conversation": "Copiar conversación",

  // CREATE
  "CREATE": "CREAR",
  "Create something amazing": "Crea algo increíble",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Elige una herramienta de creación. Cada herramienta abre su propio espacio de trabajo IA de ShezoraX con sugerencias relevantes y chat.",
  "Open workspace \u2192": "Abrir espacio de trabajo \u2192",
  "\u2190 All Create Tools": "\u2190 Todas las herramientas de creación",
  "CREATE WORKSPACE": "ESPACIO DE TRABAJO DE CREACIÓN",
  "What would you like to create?": "¿Qué te gustaría crear?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Comienza con tu propia solicitud o elige una de las sugerencias para esta herramienta de creación.",
  "Listening": "Escuchando",
  "SUGGESTIONS": "SUGERENCIAS",
  "Try one of these": "Prueba una de estas",

  // KNOWLEDGE
  "Universe & Space": "Universo y Espacio",
  "Earth": "Tierra",
  "Science": "Ciencia",
  "Technology": "Tecnología",
  "Programming": "Programación",
  "History": "Historia",
  "Mathematics": "Matemáticas",
  "Physics": "Física",
  "KNOWLEDGE": "CONOCIMIENTO",
  "Knowledge Universe": "Universo del conocimiento",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Elige un tema y ShezoraX abrirá el chat IA con una pregunta enfocada.",

  // SETTINGS
  "SETTINGS": "CONFIGURACIÓN",
  "Manage your ShezoraX preferences, account and personal experience.": "Gestiona tus preferencias de ShezoraX, tu cuenta y experiencia personal.",
  "GENERAL": "GENERAL",
  "Language, voice and general preferences": "Preferencias de idioma, voz y generales",
  "AI voice replies": "Respuestas de voz IA",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX pronuncia las respuestas generales de IA cuando la síntesis de voz del navegador está disponible.",
  "ON": "ACTIVADO",
  "OFF": "DESACTIVADO",
  "Project voice replies": "Respuestas de voz del proyecto",
  "Automatically speak responses inside project workspaces.": "Pronunciar automáticamente las respuestas dentro de los espacios de trabajo de proyectos.",
  "Test Voice": "Probar voz",
  "Test Microphone": "Probar micrófono",
  "CREATOR": "CREADOR",
  "Connect & Follow": "Conectar y Seguir",
  "Stay updated with my latest work and projects.": "Mantente al día con mis últimos trabajos y proyectos.",
  "GitHub": "GitHub",
  "Explore my projects": "Explorar mis proyectos",
  "Facebook": "Facebook",
  "Connect with me": "Conectar conmigo",
  "Instagram": "Instagram",
  "Follow my journey": "Seguir mi camino",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Conectar profesionalmente",
  "X": "X",
  "Follow for updates": "Seguir para actualizaciones",
  "Portfolio": "Portafolio",
  "View my work": "Ver mis trabajos",
  "PROFILE": "PERFIL",
  "Manage your ShezoraX account and personal data.": "Gestiona tu cuenta de ShezoraX y tus datos personales.",
  "Your name": "Tu nombre",
  "How ShezoraX should greet you": "Cómo debe saludarte ShezoraX",
  "Enter your name": "Ingresa tu nombre",
  "Google email": "Correo de Google",
  "Connected account": "Cuenta conectada",
  "Log out of all devices": "Cerrar sesión en todos los dispositivos",
  "End active ShezoraX sessions on other devices.": "Finalizar las sesiones activas de ShezoraX en otros dispositivos.",
  "Delete all chats": "Eliminar todos los chats",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Eliminar tus conversaciones de ShezoraX y la memoria del chat de proyectos de este dispositivo.",
  "Delete account": "Eliminar cuenta",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Eliminar permanentemente tu cuenta de ShezoraX cuando la autenticación de cuenta esté conectada.",

  // GOOGLE
  "GOOGLE ACCOUNT": "CUENTA DE GOOGLE",
  "Connect your Google account to use account authentication with ShezoraX.": "Conecta tu cuenta de Google para usar la autenticación de cuenta con ShezoraX.",
  "Google": "Google",
  "Google connection is ready.": "La conexión de Google está lista.",
  "Connect your Google account to ShezoraX.": "Conecta tu cuenta de Google a ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "Un Google OAuth real requiere credenciales de autenticación configuradas.",

  // APPLE
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Conecta tu Apple ID para usar la autenticación de cuenta Apple con ShezoraX.",
  "Apple ID connection is ready.": "La conexión de Apple ID está lista.",
  "Connect your Apple ID to ShezoraX.": "Conecta tu Apple ID a ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "Un Apple Sign In real requiere credenciales de autenticación configuradas.",

  // RELIGION
  "RELIGION & FAITH": "RELIGIÓN Y FE",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Gestiona las preferencias religiosas y relacionadas con la fe utilizadas por ShezoraX.",
  "Faith preferences": "Preferencias de fe",

    "Coming soon": "Prossimamente",
    "Prayer times": "Orari di preghiera",
    "Get notifications for daily prayer times based on your location.": "Ricevi notifiche per gli orari di preghiera giornalieri in base alla tua posizione.",
    "Qibla direction": "Direzione della Qibla",
    "Find the direction of prayer using your device compass.": "Trova la direzione della preghiera usando la bussola del tuo dispositivo.",
    "Daily verses": "Versetti quotidiani",
    "Receive daily religious verses and reflections in your feed.": "Ricevi versetti religiosi quotidiani e riflessioni nel tuo feed.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Configura come ShezoraX integra la guida basata sulla fede nella tua esperienza.",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Esta área está reservada para tu conocimiento religioso, oración y preferencias relacionadas con la fe.",
  "Religious knowledge": "Conocimiento religioso",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX puede mantener los temas religiosos separados de las preferencias generales de la aplicación.",

  // VOICES
  "ShezoraX female AI voice": "Voz IA femenina de ShezoraX",
  "ShezoraX male AI voice": "Voz IA masculina de ShezoraX",
  "Connect with Creator": "Conectar con el creador",
  "Follow the creator behind ShezoraX": "Sigue al creador detrás de ShezoraX",

  // PROJECT TYPE DESCRIPTIONS
  "Build websites, dashboards, portfolios and full web applications.": "Construye sitios web, paneles de control, portafolios y aplicaciones web completas.",
  "Create school assignments, experiments, reports and presentations.": "Crea tareas escolares, experimentos, informes y presentaciones.",
  "Work on university assignments, FYPs, research and documentation.": "Trabaja en tareas universitarias, proyectos de fin de grado, investigación y documentación.",
  "Plan software products, desktop tools and utility applications.": "Planifica productos de software, herramientas de escritorio y aplicaciones de utilidad.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Construye asistentes IA, ideas de ML, prompts y productos inteligentes.",
  "Create Android, iOS and cross-platform mobile applications.": "Crea aplicaciones móviles para Android, iOS y multiplataforma.",
  "Build game concepts, mechanics, stories and development plans.": "Construye conceptos de juegos, mecánicas, historias y planes de desarrollo.",
  "Analyze data, plan research and prepare technical findings.": "Analiza datos, planifica investigación y prepara hallazgos técnicos.",
  "Create reports, presentations, proposals and structured documents.": "Crea informes, presentaciones, propuestas y documentos estructurados.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Desarrolla UI/UX, branding, conceptos creativos y dirección visual.",
  "Start anything else with a completely custom AI workspace.": "Comienza cualquier otra cosa con un espacio de trabajo IA completamente personalizado.",

  // CREATE TOOL DESCRIPTIONS
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Crea imágenes, conceptos, escenas, retratos e ideas visuales con IA.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Planifica y crea conceptos de video, escenas, guiones y direcciones visuales.",
  "Improve, transform, retouch and creatively edit images.": "Mejora, transforma, retoca y edita creativamente imágenes.",
  "Create professional resumes, CVs, cover letters and career documents.": "Crea currículums profesionales, CVs, cartas de presentación y documentos de carrera.",
  "Write articles, blogs, descriptions, captions and professional content.": "Escribe artículos, blogs, descripciones, subtítulos y contenido profesional.",
  "Create slide structures, presentation content and speaker notes.": "Crea estructuras de diapositivas, contenido de presentación y notas del ponente.",
  "Create professional documents, proposals, letters and structured files.": "Crea documentos profesionales, propuestas, cartas y archivos estructurados.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Crea historias, guiones cinematográficos, scripts, personajes y mundos ficticios.",
  "Create captions, posts, content ideas and social media campaigns.": "Crea subtítulos, publicaciones, ideas de contenido y campañas de redes sociales.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Desarrolla identidades de marca, conceptos de logo, nombres, colores y dirección visual.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Crea conceptos musicales, letras, ideas sonoras, guiones de voz y dirección de audio.",
  "Create interface concepts, visual systems, layouts and design directions.": "Crea conceptos de interfaz, sistemas visuales, diseños y direcciones de diseño.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Crea diagramas, diagramas de flujo, infografías y explicaciones visuales.",
  "Write professional emails, messages, replies, invitations and announcements.": "Escribe correos electrónicos profesionales, mensajes, respuestas, invitaciones y anuncios.",
  "Create general study notes, flashcards, quizzes and revision material.": "Crea notas de estudio generales, tarjetas de estudio, cuestionarios y material de repaso.",
  "Create general reports, structured research writing and analytical documents.": "Crea informes generales, escritos de investigación estructurados y documentos analíticos.",
  "Plan document transformations, formatting changes and content conversions.": "Planifica transformaciones de documentos, cambios de formato y conversiones de contenido.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Crea plantillas reutilizables para documentos, publicaciones, correos electrónicos, planificación y más.",

  // MISSING TITLES
  "Email & Message Writer": "Escritor de correos y mensajes",
  "Research & Report Writer": "Escritor de investigación e informes",
  "Document Converter": "Conversor de documentos",
  "AI Project": "Proyecto IA",

  // ALL 72 SUGGESTIONS
  "Create a cinematic space scene": "Crear una escena espacial cinematográfica",
  "Create a professional profile image": "Crear una imagen de perfil profesional",
  "Create a futuristic city concept": "Crear un concepto de ciudad futurista",
  "Create a realistic product image": "Crear una imagen de producto realista",
  "Create a cinematic video concept": "Crear un concepto de video cinematográfico",
  "Create a short promotional video": "Crear un video promocional corto",
  "Create a futuristic story video": "Crear un video de historia futurista",
  "Create a social media video idea": "Crear una idea de video para redes sociales",
  "Improve this image professionally": "Mejorar esta imagen profesionalmente",
  "Remove unwanted objects": "Eliminar objetos no deseados",
  "Create a cinematic color grade": "Crear una corrección de color cinematográfica",
  "Turn this image into a different style": "Convertir esta imagen en un estilo diferente",
  "Create a modern ATS-friendly CV": "Crear un CV moderno compatible con ATS",
  "Improve my professional summary": "Mejorar mi resumen profesional",
  "Write a strong cover letter": "Escribir una carta de presentación sólida",
  "Improve my work experience section": "Mejorar mi sección de experiencia laboral",
  "Write a professional blog post": "Escribir una publicación de blog profesional",
  "Create an engaging article": "Crear un artículo atractivo",
  "Write a product description": "Escribir una descripción de producto",
  "Create a detailed content outline": "Crear un esquema de contenido detallado",
  "Create a professional presentation": "Crear una presentación profesional",
  "Build a 10-slide presentation structure": "Construir una estructura de presentación de 10 diapositivas",
  "Write speaker notes for my slides": "Escribir notas del ponente para mis diapositivas",
  "Create a presentation outline": "Crear un esquema de presentación",
  "Create a professional proposal": "Crear una propuesta profesional",
  "Write a formal document": "Escribir un documento formal",
  "Create a business document": "Crear un documento comercial",
  "Turn my notes into a structured document": "Convertir mis notas en un documento estructurado",
  "Create a science-fiction story": "Crear una historia de ciencia ficción",
  "Write a short film script": "Escribir un guion de cortometraje",
  "Create interesting characters": "Crear personajes interesantes",
  "Build a cinematic story outline": "Construir un esquema de historia cinematográfica",
  "Create an Instagram content plan": "Crear un plan de contenido para Instagram",
  "Write a professional LinkedIn post": "Escribir una publicación profesional de LinkedIn",
  "Create 10 social media captions": "Crear 10 subtítulos para redes sociales",
  "Create a one-week content calendar": "Crear un calendario de contenido de una semana",
  "Create a modern brand identity": "Crear una identidad de marca moderna",
  "Develop a logo concept": "Desarrollar un concepto de logo",
  "Create a brand color direction": "Crear una dirección de colores de marca",
  "Build a complete branding concept": "Construir un concepto de branding completo",
  "Create a cinematic music concept": "Crear un concepto musical cinematográfico",
  "Write lyrics for a song": "Escribir la letra de una canción",
  "Create a podcast intro": "Crear una intro de podcast",
  "Write a professional voice-over script": "Escribir un guion de voz en off profesional",
  "Create a modern dashboard design": "Crear un diseño de panel de control moderno",
  "Create a mobile app UI concept": "Crear un concepto de UI de aplicación móvil",
  "Design a futuristic landing page": "Diseñar una página de aterrizaje futurista",
  "Create a visual design system": "Crear un sistema de diseño visual",
  "Create a process flowchart": "Crear un diagrama de flujo de proceso",
  "Create an educational infographic": "Crear una infografía educativa",
  "Explain this topic with a diagram": "Explicar este tema con un diagrama",
  "Create a professional system diagram": "Crear un diagrama de sistema profesional",
  "Write a professional email": "Escribir un correo electrónico profesional",
  "Write a polite reply": "Escribir una respuesta educada",
  "Create a formal request": "Crear una solicitud formal",
  "Write a professional announcement": "Escribir un anuncio profesional",
  "Create revision notes": "Crear notas de repaso",
  "Create flashcards": "Crear tarjetas de estudio",
  "Create a practice quiz": "Crear un cuestionario de práctica",
  "Turn these notes into questions": "Convertir estas notas en preguntas",
  "Create a structured report": "Crear un informe estructurado",
  "Turn my information into a research-style document": "Convertir mi información en un documento estilo investigación",
  "Create an executive summary": "Crear un resumen ejecutivo",
  "Organize this information into sections": "Organizar esta información en secciones",
  "Convert this content into a professional format": "Convertir este contenido en un formato profesional",
  "Turn notes into a formal document": "Convertir notas en un documento formal",
  "Convert this text into a structured outline": "Convertir este texto en un esquema estructurado",
  "Reformat this document professionally": "Reformatear este documento profesionalmente",
  "Create a professional email template": "Crear una plantilla de correo electrónico profesional",
  "Create a social media template": "Crear una plantilla de redes sociales",
  "Create a professional document template": "Crear una plantilla de documento profesional",
  "Create a reusable planning template": "Crear una plantilla de planificación reutilizable",

  // ALERTS
  "Are you sure you want to delete all ShezoraX chats?": "¿Estás seguro de que quieres eliminar todos los chats de ShezoraX?",
  "All chats have been deleted.": "Todos los chats han sido eliminados.",
  "Are you sure you want to delete your ShezoraX account?": "¿Estás seguro de que quieres eliminar tu cuenta de ShezoraX?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "La eliminación de la cuenta requiere un backend de autenticación real. Los datos locales de tu proyecto pueden eliminarse por separado.",
  "Log out of all devices requires a real authentication/session backend.": "Cerrar sesión en todos los dispositivos requiere un backend de autenticación/sesión real.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "La interfaz de conexión de cuenta de Google está lista. Se requieren credenciales reales de Google OAuth para la autenticación en vivo.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "La interfaz de conexión de Apple ID está lista. Se requieren credenciales reales de Apple Sign In para la autenticación en vivo.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "El reconocimiento de voz no es compatible con este navegador. Prueba Google Chrome o Microsoft Edge.",
  "I received your message, but no response was returned.": "Recibí tu mensaje, pero no se devolvió ninguna respuesta.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "No puedo conectarme al servicio de IA en este momento. Por favor, verifica que el backend de ShezoraX esté funcionando.",
  "I received your project request, but no response was returned.": "Recibí tu solicitud de proyecto, pero no se devolvió ninguna respuesta.",
  "I received your creation request, but no response was returned.": "Recibí tu solicitud de creación, pero no se devolvió ninguna respuesta.",

  // EXISTING DATA KEYS
  "Website / Web App": "Sitio web / Aplicación web",
  "School Project": "Proyecto escolar",
  "College / University": "Universidad",
  "Software / Desktop App": "Software / Aplicación de escritorio",
  "Mobile App": "Aplicación móvil",
  "Game Project": "Proyecto de juego",
  "Data / Research": "Datos / Investigación",
  "Presentation / Report": "Presentación / Informe",
  "Design / Creative": "Diseño / Creativo",
  "Custom Project": "Proyecto personalizado",
  "Image Create": "Crear imagen",
  "Video Create": "Crear video",
  "Photo / Image Editing": "Edición de foto / imagen",
  "Resume / CV": "Currículum / CV",
  "Content Writing": "Redacción de contenido",
  "Presentation Maker": "Creador de presentaciones",
  "Document Creator": "Creador de documentos",
  "Story & Script Writer": "Escritor de historias y guiones",
  "Social Media Creator": "Creador de redes sociales",
  "Logo & Branding": "Logo y Branding",
  "Music & Audio": "Música y Audio",
  "UI / Visual Design": "UI / Diseño visual",
  "Template Creator": "Creador de plantillas",
  "Religion": "Religión",
  "Religious knowledge": "Conocimiento religioso",
  "Faith preferences": "Preferencias de fe",

    "Coming soon": "जल्द आ रहा है",
    "Prayer times": "प्रार्थना का समय",
    "Get notifications for daily prayer times based on your location.": "अपने स्थान के आधार पर दैनिक प्रार्थना समय की सूचनाएं प्राप्त करें।",
    "Qibla direction": "क़िबला की दिशा",
    "Find the direction of prayer using your device compass.": "अपने डिवाइस कंपास का उपयोग करके प्रार्थना की दिशा खोजें।",
    "Daily verses": "दैनिक श्लोक",
    "Receive daily religious verses and reflections in your feed.": "अपनी फ़ीड में दैनिक धार्मिक श्लोक और चिंतन प्राप्त करें।",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "कॉन्फ़िगर करें कि ShezoraX विश्वास-आधारित मार्गदर्शन को आपके अनुभव में कैसे एकीकृत करता है।",
  "Islam": "Islam",
  "Christianity": "Cristianismo",
  "Judaism": "Judaísmo",
  "Hinduism": "Hinduismo",
  "Buddhism": "Budismo",
  "Sikhism": "Sijismo",
  "Jainism": "Jainismo",
  "Bahá\u02bc\u00ed Faith": "Fe Bahá\u02bc\u00ed",
  "Taoism": "Taoísmo",
  "Confucianism": "Confucianismo",
  "Shinto": "Sintoísmo",
  "Zoroastrianism": "Zoroastrismo",
  "Other / Spiritual": "Otro / Espiritual",
  "No preference": "Sin preferencia",

"Full-Stack Developer & AI Engineer — the mind behind": "Desarrollador Full-Stack e Ingeniero de IA — la mente detrás de",
"Connect a provider to add account authentication to ShezoraX.": "Conecta un proveedor para agregar autenticación de cuenta a ShezoraX.",

  },

Portuguese: {
  // Navigation
  "Home": "Início",
  "AI Chat": "Chat IA",
  "Create": "Criar",
  "Projects": "Projetos",
  "Knowledge": "Conhecimento",
  "Settings": "Configurações",
  "AI System": "Sistema IA",
  "Online": "Online",
  "Account": "Conta",
  "Search": "Pesquisar",
  "General": "Geral",
  "Profile": "Perfil",
  "Google Account": "Conta Google",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Religião e Fé",
  "Language": "Idioma",
  "Voice": "Voz",

  // Long keys
  "Choose the language used throughout the ShezoraX interface.": "Escolha o idioma usado em toda a interface do ShezoraX.",
  "Control the language and voice experience of ShezoraX.": "Controle o idioma e a experiência de voz do ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Escolha a voz de IA que o ShezoraX usa para respostas faladas.",

  // Status
  "Connected": "Conectado",
  "Ready": "Pronto",
  "Continue with Google": "Continuar com Google",
  "Continue with Apple ID": "Continuar com Apple ID",
  "Continue with Apple": "Continuar com Apple",
  "Good Morning": "Bom dia",
  "Good Afternoon": "Boa tarde",
  "Good Evening": "Boa noite",
  "Good Night": "Boa noite",
  "Send": "Enviar",
  "Clear": "Limpar",
  "Cancel": "Cancelar",
  "Save": "Salvar",
  "Delete": "Excluir",
  "Close": "Fechar",
  "Back": "Voltar",
  "Open": "Abrir",
  "AI System Online": "Sistema IA Online",
  "Female": "Feminino",
  "Male": "Masculino",

  // Hero
  "ShezoraX AI Online": "ShezoraX IA Online",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Seu espaço de trabalho pessoal de IA inteligente para aprender, criar, explorar e realizar tarefas.",
  "PERSONAL AI": "IA PESSOAL",
  "What can I help you with?": "Como posso ajudá-lo?",
  "Listening…": "Ouvindo…",
  "Speak": "Falar",
  "READY": "PRONTO",
  "Ask ShezoraX anything.": "Pergunte qualquer coisa ao ShezoraX.",
  "You can also use the microphone or one of the quick prompts below.": "Você também pode usar o microfone ou um dos prompts rápidos abaixo.",
  "YOU": "VOCÊ",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "Pensando…",
  "Ask ShezoraX anything…": "Pergunte qualquer coisa ao ShezoraX…",
  "Voice input is available": "Entrada de voz está disponível",
  "Stop mic": "Parar microfone",
  "Enter to send · Shift + Enter for a new line": "Enter para enviar · Shift + Enter para nova linha",

  // Suggestions
  "Explain something to me": "Explique algo para mim",
  "Help me plan my day": "Ajude-me a planejar meu dia",
  "Teach me about the universe": "Ensine-me sobre o universo",
  "Help me build a project": "Ajude-me a construir um projeto",
  "EXPLORE SHEZORAX": "EXPLORAR SHEZORAX",

  // Chat
  "Talk with ShezoraX": "Converse com ShezoraX",
  "Start a conversation with ShezoraX.": "Inicie uma conversa com ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Faça uma pergunta, explique um problema ou descreva o que deseja construir.",
  "Message ShezoraX": "Mensagem para ShezoraX",

  // Projects
  "PROJECTS": "PROJETOS",
  "Build something with ShezoraX": "Construa algo com ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Escolha um tipo de projeto. Cada espaço de trabalho tem seu próprio chat de IA, entrada de voz, respostas de voz, notas e conversa salva.",
  "Open project workspace →": "Abrir espaço de trabalho do projeto →",
  "← All Projects": "← Todos os Projetos",
  "PROJECT WORKSPACE": "ESPAÇO DE TRABALHO DO PROJETO",
  "Export": "Exportar",
  "Project Plan": "Plano do Projeto",
  "Notes": "Notas",
  "Tell ShezoraX what you want to build.": "Diga ao ShezoraX o que deseja construir.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Descreva sua ideia, requisitos, prazo, tecnologia, instruções da tarefa ou qualquer problema que precise resolver.",
  "Working on your project…": "Trabalhando no seu projeto…",
  "Listening… speak now": "Ouvindo… fale agora",
  "Voice + text supported": "Voz + texto suportado",
  "WORKFLOW": "FLUXO DE TRABALHO",
  "Build your project step by step": "Construa seu projeto passo a passo",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Use estas etapas para manter o projeto organizado. Você pode pedir ao ShezoraX para lidar com qualquer etapa na aba Chat IA.",
  "Define": "Definir",
  "Explain the goal, audience and final result.": "Explique o objetivo, o público e o resultado final.",
  "Plan": "Planejar",
  "Choose features, technology and milestones.": "Escolha recursos, tecnologia e marcos.",
  "Build": "Construir",
  "Create the code, content or project material.": "Crie o código, conteúdo ou material do projeto.",
  "Test": "Testar",
  "Review errors, requirements and edge cases.": "Revise erros, requisitos e casos extremos.",
  "Polish": "Aprimorar",
  "Improve design, quality and presentation.": "Melhore o design, qualidade e apresentação.",
  "Deliver": "Entregar",
  "Prepare the final files, documentation or presentation.": "Prepare os arquivos finais, documentação ou apresentação.",
  "Ask ShezoraX →": "Pergunte ao ShezoraX →",
  "PROJECT MEMORY": "MEMÓRIA DO PROJETO",
  "Project notes": "Notas do projeto",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Salve requisitos, links, prazos, tecnologias ou outro contexto. As notas permanecem neste dispositivo e são incluídas em futuras solicitações de IA do projeto.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "Exemplo: React + Node.js, prazo sexta-feira, deve ser responsivo para dispositivos móveis…",
  "characters · saved locally": "caracteres · salvo localmente",
  "Back to Chat": "Voltar ao Chat",
  "messages": "mensagens",
  "Copied": "Copiado",
  "Copy conversation": "Copiar conversa",

  // Project Types
  "Website / Web App": "Site / Aplicação Web",
  "School Project": "Projeto Escolar",
  "College / University": "Faculdade / Universidade",
  "Software / Desktop App": "Software / Aplicação Desktop",
  "Mobile App": "Aplicativo Móvel",
  "Game Project": "Projeto de Jogo",
  "Data / Research": "Dados / Pesquisa",
  "Presentation / Report": "Apresentação / Relatório",
  "Design / Creative": "Design / Criativo",
  "Custom Project": "Projeto Personalizado",
  "Build websites, dashboards, portfolios and full web applications.": "Construa sites, painéis, portfólios e aplicações web completas.",
  "Create school assignments, experiments, reports and presentations.": "Crie tarefas escolares, experimentos, relatórios e apresentações.",
  "Work on university assignments, FYPs, research and documentation.": "Trabalhe em tarefas universitárias, TCCs, pesquisa e documentação.",
  "Plan software products, desktop tools and utility applications.": "Planeje produtos de software, ferramentas desktop e aplicações utilitárias.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Construa assistentes de IA, ideias de ML, prompts e produtos inteligentes.",
  "Create Android, iOS and cross-platform mobile applications.": "Crie aplicativos móveis para Android, iOS e multiplataforma.",
  "Build game concepts, mechanics, stories and development plans.": "Construa conceitos de jogos, mecânicas, histórias e planos de desenvolvimento.",
  "Analyze data, plan research and prepare technical findings.": "Analise dados, planeje pesquisas e prepare descobertas técnicas.",
  "Create reports, presentations, proposals and structured documents.": "Crie relatórios, apresentações, propostas e documentos estruturados.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Desenvolva UI/UX, identidade visual, conceitos criativos e direção visual.",
  "Start anything else with a completely custom AI workspace.": "Comece qualquer outra coisa com um espaço de trabalho de IA completamente personalizado.",

  // Create
  "CREATE": "CRIAR",
  "Create something amazing": "Crie algo incrível",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Escolha uma ferramenta de criação. Cada ferramenta abre seu próprio espaço de trabalho focado do ShezoraX IA com sugestões e chat relevantes.",
  "Open workspace →": "Abrir espaço de trabalho →",
  "← All Create Tools": "← Todas as Ferramentas de Criação",
  "CREATE WORKSPACE": "ESPAÇO DE TRABALHO DE CRIAÇÃO",
  "What would you like to create?": "O que você gostaria de criar?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Comece com sua própria solicitação ou escolha uma das sugestões para esta ferramenta de criação.",
  "Listening": "Ouvindo",
  "SUGGESTIONS": "SUGESTÕES",
  "Try one of these": "Experimente uma destas",

  // Create Tools
  "Image Create": "Criação de Imagem",
  "Video Create": "Criação de Vídeo",
  "Photo / Image Editing": "Edição de Foto / Imagem",
  "Resume / CV": "Currículo / CV",
  "Content Writing": "Escrita de Conteúdo",
  "Presentation Maker": "Criador de Apresentações",
  "Document Creator": "Criador de Documentos",
  "Story & Script Writer": "Escritor de Histórias e Roteiros",
  "Social Media Creator": "Criador de Mídia Social",
  "Logo & Branding": "Logo e Marca",
  "Music & Audio": "Música e Áudio",
  "UI / Visual Design": "Design de UI / Visual",
  "Diagram & Infographic": "Diagrama e Infográfico",
  "Email & Message Writer": "Escritor de E-mails e Mensagens",
  "Study Notes & Flashcards": "Notas de Estudo e Flashcards",
  "Research & Report Writer": "Escritor de Pesquisa e Relatórios",
  "Document Converter": "Conversor de Documentos",
  "Template Creator": "Criador de Modelos",
  "AI Project": "Projeto de IA",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Crie imagens, conceitos, cenas, retratos e ideias visuais com IA.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Planeje e crie conceitos de vídeo, cenas, roteiros e direções visuais.",
  "Improve, transform, retouch and creatively edit images.": "Melhore, transforme, retogue e edite imagens criativamente.",
  "Create professional resumes, CVs, cover letters and career documents.": "Crie currículos profissionais, CVs, cartas de apresentação e documentos de carreira.",
  "Write articles, blogs, descriptions, captions and professional content.": "Escreva artigos, blogs, descrições, legendas e conteúdo profissional.",
  "Create slide structures, presentation content and speaker notes.": "Crie estruturas de slides, conteúdo de apresentações e notas do apresentador.",
  "Create professional documents, proposals, letters and structured files.": "Crie documentos profissionais, propostas, cartas e arquivos estruturados.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Crie histórias, roteiros de cinema, scripts, personagens e mundos fictícios.",
  "Create captions, posts, content ideas and social media campaigns.": "Crie legendas, posts, ideias de conteúdo e campanhas de mídia social.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Desenvolva identidades de marca, conceitos de logo, nomes, cores e direção visual.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Crie conceitos musicais, letras, ideias sonoras, roteiros de voz e direção de áudio.",
  "Create interface concepts, visual systems, layouts and design directions.": "Crie conceitos de interface, sistemas visuais, layouts e direções de design.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Crie diagramas, fluxogramas, infográficos e explicações visuais.",
  "Write professional emails, messages, replies, invitations and announcements.": "Escreva e-mails profissionais, mensagens, respostas, convites e anúncios.",
  "Create general study notes, flashcards, quizzes and revision material.": "Crie notas de estudo gerais, flashcards, questionários e material de revisão.",
  "Create general reports, structured research writing and analytical documents.": "Crie relatórios gerais, escrita de pesquisa estruturada e documentos analíticos.",
  "Plan document transformations, formatting changes and content conversions.": "Planeje transformações de documentos, alterações de formatação e conversões de conteúdo.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Crie modelos reutilizáveis para documentos, posts, e-mails, planejamento e mais.",

  // Create Tool Suggestions
  "Create a cinematic space scene": "Crie uma cena espacial cinematográfica",
  "Create a professional profile image": "Crie uma imagem de perfil profissional",
  "Create a futuristic city concept": "Crie um conceito de cidade futurista",
  "Create a realistic product image": "Crie uma imagem realista de produto",
  "Create a cinematic video concept": "Crie um conceito de vídeo cinematográfico",
  "Create a short promotional video": "Crie um vídeo promocional curto",
  "Create a futuristic story video": "Crie um vídeo de história futurista",
  "Create a social media video idea": "Crie uma ideia de vídeo para mídia social",
  "Improve this image professionally": "Melhore esta imagem profissionalmente",
  "Remove unwanted objects": "Remova objetos indesejados",
  "Create a cinematic color grade": "Crie uma colorização cinematográfica",
  "Turn this image into a different style": "Transforme esta imagem em um estilo diferente",
  "Create a modern ATS-friendly CV": "Crie um currículo moderno compatível com ATS",
  "Improve my professional summary": "Melhore meu resumo profissional",
  "Write a strong cover letter": "Escreva uma carta de apresentação impactante",
  "Improve my work experience section": "Melhore minha seção de experiência profissional",
  "Write a professional blog post": "Escreva uma postagem de blog profissional",
  "Create an engaging article": "Crie um artigo envolvente",
  "Write a product description": "Escreva uma descrição de produto",
  "Create a detailed content outline": "Crie um esboço detalhado de conteúdo",
  "Create a professional presentation": "Crie uma apresentação profissional",
  "Build a 10-slide presentation structure": "Construa uma estrutura de apresentação com 10 slides",
  "Write speaker notes for my slides": "Escreva notas do apresentador para meus slides",
  "Create a presentation outline": "Crie um esboço de apresentação",
  "Create a professional proposal": "Crie uma proposta profissional",
  "Write a formal document": "Escreva um documento formal",
  "Create a business document": "Crie um documento empresarial",
  "Turn my notes into a structured document": "Transforme minhas notas em um documento estruturado",
  "Create a science-fiction story": "Crie uma história de ficção científica",
  "Write a short film script": "Escreva um roteiro de curta-metragem",
  "Create interesting characters": "Crie personagens interessantes",
  "Build a cinematic story outline": "Construa um esboço de história cinematográfica",
  "Create an Instagram content plan": "Crie um plano de conteúdo para Instagram",
  "Write a professional LinkedIn post": "Escreva uma postagem profissional para LinkedIn",
  "Create 10 social media captions": "Crie 10 legendas para mídia social",
  "Create a one-week content calendar": "Crie um calendário de conteúdo de uma semana",
  "Create a modern brand identity": "Crie uma identidade de marca moderna",
  "Develop a logo concept": "Desenvolva um conceito de logo",
  "Create a brand color direction": "Crie uma direção de cores da marca",
  "Build a complete branding concept": "Construa um conceito completo de marca",
  "Create a cinematic music concept": "Crie um conceito musical cinematográfico",
  "Write lyrics for a song": "Escreva letras para uma música",
  "Create a podcast intro": "Crie uma introdução de podcast",
  "Write a professional voice-over script": "Escreva um roteiro profissional de narração",
  "Create a modern dashboard design": "Crie um design moderno de painel",
  "Create a mobile app UI concept": "Crie um conceito de UI para aplicativo móvel",
  "Design a futuristic landing page": "Projete uma landing page futurista",
  "Create a visual design system": "Crie um sistema de design visual",
  "Create a process flowchart": "Crie um fluxograma de processo",
  "Create an educational infographic": "Crie um infográfico educacional",
  "Explain this topic with a diagram": "Explique este tópico com um diagrama",
  "Create a professional system diagram": "Crie um diagrama de sistema profissional",
  "Write a professional email": "Escreva um e-mail profissional",
  "Write a polite reply": "Escreva uma resposta educada",
  "Create a formal request": "Crie uma solicitação formal",
  "Write a professional announcement": "Escreva um anúncio profissional",
  "Create revision notes": "Crie notas de revisão",
  "Create flashcards": "Crie flashcards",
  "Create a practice quiz": "Crie um questionário de prática",
  "Turn these notes into questions": "Transforme estas notas em perguntas",
  "Create a structured report": "Crie um relatório estruturado",
  "Turn my information into a research-style document": "Transforme minhas informações em um documento de estilo de pesquisa",
  "Create an executive summary": "Crie um resumo executivo",
  "Organize this information into sections": "Organize estas informações em seções",
  "Convert this content into a professional format": "Converta este conteúdo em um formato profissional",
  "Turn notes into a formal document": "Transforme notas em um documento formal",
  "Convert this text into a structured outline": "Converta este texto em um esboço estruturado",
  "Reformat this document professionally": "Reformate este documento profissionalmente",
  "Create a professional email template": "Crie um modelo de e-mail profissional",
  "Create a social media template": "Crie um modelo de mídia social",
  "Create a professional document template": "Crie um modelo de documento profissional",
  "Create a reusable planning template": "Crie um modelo de planejamento reutilizável",

  // Knowledge
  "Universe & Space": "Universo e Espaço",
  "Earth": "Terra",
  "Science": "Ciência",
  "Technology": "Tecnologia",
  "Programming": "Programação",
  "History": "História",
  "Mathematics": "Matemática",
  "Physics": "Física",
  "KNOWLEDGE": "CONHECIMENTO",
  "Knowledge Universe": "Universo do Conhecimento",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Escolha um tópico e o ShezoraX abrirá o chat de IA com uma pergunta focada.",

  // Settings
  "SETTINGS": "CONFIGURAÇÕES",
  "Manage your ShezoraX preferences, account and personal experience.": "Gerencie suas preferências, conta e experiência pessoal do ShezoraX.",
  "GENERAL": "GERAL",
  "Language, voice and general preferences": "Idioma, voz e preferências gerais",
  "AI voice replies": "Respostas de voz da IA",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX fala respostas gerais de IA quando a síntese de fala do navegador está disponível.",
  "ON": "LIGADO",
  "OFF": "DESLIGADO",
  "Project voice replies": "Respostas de voz do projeto",
  "Automatically speak responses inside project workspaces.": "Falar automaticamente as respostas dentro dos espaços de trabalho do projeto.",
  "Test Voice": "Testar Voz",
  "Test Microphone": "Testar Microfone",
  "CREATOR": "CRIADOR",
  "Connect & Follow": "Conecte-se e Siga",
  "Stay updated with my latest work and projects.": "Fique atualizado com meus trabalhos e projetos mais recentes.",
  "GitHub": "GitHub",
  "Explore my projects": "Explore meus projetos",
  "Facebook": "Facebook",
  "Connect with me": "Conecte-se comigo",
  "Instagram": "Instagram",
  "Follow my journey": "Siga minha jornada",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Conecte-se profissionalmente",
  "X": "X",
  "Follow for updates": "Siga para atualizações",
  "Portfolio": "Portfólio",
  "View my work": "Veja meu trabalho",
  "PROFILE": "PERFIL",
  "Manage your ShezoraX account and personal data.": "Gerencie sua conta e dados pessoais do ShezoraX.",
  "Your name": "Seu nome",
  "How ShezoraX should greet you": "Como ShezoraX deve saudá-lo",
  "Enter your name": "Digite seu nome",
  "Google email": "E-mail do Google",
  "Connected account": "Conta conectada",
  "Log out of all devices": "Sair de todos os dispositivos",
  "End active ShezoraX sessions on other devices.": "Encerre sessões ativas do ShezoraX em outros dispositivos.",
  "Delete all chats": "Excluir todas as conversas",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Remova suas conversas do ShezoraX e a memória de chat do projeto deste dispositivo.",
  "Delete account": "Excluir conta",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Exclua permanentemente sua conta ShezoraX quando a autenticação da conta estiver conectada.",
  "GOOGLE ACCOUNT": "CONTA GOOGLE",
  "Connect your Google account to use account authentication with ShezoraX.": "Conecte sua conta Google para usar a autenticação de conta com ShezoraX.",
  "Google": "Google",
  "Google connection is ready.": "A conexão com Google está pronta.",
  "Connect your Google account to ShezoraX.": "Conecte sua conta Google ao ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "O Google OAuth real requer credenciais de autenticação configuradas.",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Conecte seu Apple ID para usar a autenticação de conta Apple com ShezoraX.",
  "Apple ID connection is ready.": "A conexão com Apple ID está pronta.",
  "Connect your Apple ID to ShezoraX.": "Conecte seu Apple ID ao ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "O Apple Sign In real requer credenciais de autenticação configuradas.",
  "RELIGION & FAITH": "RELIIGIÃO E FÉ",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Gerencie as preferências religiosas e de fé usadas pelo ShezoraX.",
  "Faith preferences": "Preferências de fé",

    "Coming soon": "Yakında",
    "Prayer times": "Namaz vakitleri",
    "Get notifications for daily prayer times based on your location.": "Konumunuza göre günlük namaz vakitleri bildirimleri alın.",
    "Qibla direction": "Kıble yönü",
    "Find the direction of prayer using your device compass.": "Cihaz pusulasını kullanarak namaz yönünü bulun.",
    "Daily verses": "Günlük ayetler",
    "Receive daily religious verses and reflections in your feed.": "Akışınızda günlük dini ayetler ve düşünceler alın.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "ShezoraX'in inanç tabanlı rehberliği deneyiminize nasıl entegre ettiğini yapılandırın.",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Esta área é reservada para seu conhecimento religioso, oração e preferências relacionadas à fé.",
  "Religious knowledge": "Conhecimento religioso",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX pode manter tópicos religiosos separados das preferências gerais do aplicativo.",
  "Religion": "Religião",
  "Islam": "Islamismo",
  "Christianity": "Cristianismo",
  "Judaism": "Judaísmo",
  "Hinduism": "Hinduísmo",
  "Buddhism": "Budismo",
  "Sikhism": "Siquismo",
  "Jainism": "Jainismo",
  "Baháʼí Faith": "Fé Baháʼí",
  "Taoism": "Taoísmo",
  "Confucianism": "Confucionismo",
  "Shinto": "Xintoísmo",
  "Zoroastrianism": "Zoroastrismo",
  "Other / Spiritual": "Outro / Espiritual",
  "No preference": "Sem preferência",

  // Voices
  "ShezoraX female AI voice": "Voz feminina de IA do ShezoraX",
  "ShezoraX male AI voice": "Voz masculina de IA do ShezoraX",
  "Connect with Creator": "Conecte-se com o Criador",
  "Follow the creator behind ShezoraX": "Siga o criador por trás do ShezoraX",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "Tem certeza de que deseja excluir todas as conversas do ShezoraX?",
  "All chats have been deleted.": "Todas as conversas foram excluídas.",
  "Are you sure you want to delete your ShezoraX account?": "Tem certeza de que deseja excluir sua conta ShezoraX?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "A exclusão da conta requer um backend de autenticação real. Seus dados locais do projeto podem ser removidos separadamente.",
  "Log out of all devices requires a real authentication/session backend.": "Sair de todos os dispositivos requer um backend de autenticação/sessão real.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "A interface de conexão da conta Google está pronta. Credenciais reais do Google OAuth são necessárias para autenticação ativa.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "A interface de conexão do Apple ID está pronta. Credenciais reais do Apple Sign In são necessárias para autenticação ativa.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "O reconhecimento de voz não é suportado neste navegador. Tente o Google Chrome ou Microsoft Edge.",
  "I received your message, but no response was returned.": "Recebi sua mensagem, mas nenhuma resposta foi retornada.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Não consigo me conectar ao serviço de IA no momento. Verifique se o backend do ShezoraX está em execução.",
  "I received your project request, but no response was returned.": "Recebi sua solicitação de projeto, mas nenhuma resposta foi retornada.",
  "I received your creation request, but no response was returned.": "Recebi sua solicitação de criação, mas nenhuma resposta foi retornada.",
"Full-Stack Developer & AI Engineer — the mind behind": "Desenvolvedor Full-Stack e Engenheiro de IA — a mente por trás de",
"Connect a provider to add account authentication to ShezoraX.": "Conecte um provedor para adicionar autenticação de conta ao ShezoraX.",

  },

Italian: {
  // Navigation
  "Home": "Home",
  "AI Chat": "Chat IA",
  "Create": "Crea",
  "Projects": "Progetti",
  "Knowledge": "Conoscenza",
  "Settings": "Impostazioni",
  "AI System": "Sistema IA",
  "Online": "Online",
  "Account": "Account",
  "Search": "Cerca",
  "General": "Generale",
  "Profile": "Profilo",
  "Google Account": "Account Google",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Religione e Fede",
  "Language": "Lingua",
  "Voice": "Voce",

  // Long keys
  "Choose the language used throughout the ShezoraX interface.": "Scegli la lingua utilizzata in tutta l'interfaccia di ShezoraX.",
  "Control the language and voice experience of ShezoraX.": "Controlla la lingua e l'esperienza vocale di ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Scegli la voce IA che ShezoraX utilizza per le risposte parlate.",

  // Status
  "Connected": "Connesso",
  "Ready": "Pronto",
  "Continue with Google": "Continua con Google",
  "Continue with Apple ID": "Continua con Apple ID",
  "Continue with Apple": "Continua con Apple",
  "Good Morning": "Buongiorno",
  "Good Afternoon": "Buon pomeriggio",
  "Good Evening": "Buonasera",
  "Good Night": "Buonanotte",
  "Send": "Invia",
  "Clear": "Cancella",
  "Cancel": "Annulla",
  "Save": "Salva",
  "Delete": "Elimina",
  "Close": "Chiudi",
  "Back": "Indietro",
  "Open": "Apri",
  "AI System Online": "Sistema IA Online",
  "Female": "Femminile",
  "Male": "Maschile",

  // Hero
  "ShezoraX AI Online": "ShezoraX IA Online",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Il tuo spazio di lavoro IA personale intelligente per imparare, creare, esplorare e portare a termine le attività.",
  "PERSONAL AI": "IA PERSONALE",
  "What can I help you with?": "Come posso aiutarti?",
  "Listening…": "In ascolto…",
  "Speak": "Parla",
  "READY": "PRONTO",
  "Ask ShezoraX anything.": "Chiedi qualsiasi cosa a ShezoraX.",
  "You can also use the microphone or one of the quick prompts below.": "Puoi anche usare il microfono o uno dei suggerimenti rapidi qui sotto.",
  "YOU": "TU",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "Sto pensando…",
  "Ask ShezoraX anything…": "Chiedi qualsiasi cosa a ShezoraX…",
  "Voice input is available": "L'input vocale è disponibile",
  "Stop mic": "Ferma microfono",
  "Enter to send · Shift + Enter for a new line": "Invio per inviare · Shift + Invio per una nuova riga",

  // Suggestions
  "Explain something to me": "Spiegami qualcosa",
  "Help me plan my day": "Aiutami a pianificare la mia giornata",
  "Teach me about the universe": "Insegnami sull'universo",
  "Help me build a project": "Aiutami a costruire un progetto",
  "EXPLORE SHEZORAX": "ESPLORA SHEZORAX",

  // Chat
  "Talk with ShezoraX": "Parla con ShezoraX",
  "Start a conversation with ShezoraX.": "Inizia una conversazione con ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Fai una domanda, spiega un problema o descrivi cosa vuoi costruire.",
  "Message ShezoraX": "Scrivi a ShezoraX",

  // Projects
  "PROJECTS": "PROGETTI",
  "Build something with ShezoraX": "Costruisci qualcosa con ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Scegli un tipo di progetto. Ogni spazio di lavoro ha la propria chat IA, input vocale, risposte vocali, note e conversazioni salvate.",
  "Open project workspace →": "Apri spazio di lavoro del progetto →",
  "← All Projects": "← Tutti i Progetti",
  "PROJECT WORKSPACE": "SPAZIO DI LAVORO DEL PROGETTO",
  "Export": "Esporta",
  "Project Plan": "Piano del Progetto",
  "Notes": "Note",
  "Tell ShezoraX what you want to build.": "Dì a ShezoraX cosa vuoi costruire.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Descrivi la tua idea, requisiti, scadenza, tecnologia, istruzioni dell'incarico o qualsiasi problema che devi risolvere.",
  "Working on your project…": "Sto lavorando al tuo progetto…",
  "Listening… speak now": "In ascolto… parla ora",
  "Voice + text supported": "Voce + testo supportato",
  "WORKFLOW": "FLUSSO DI LAVORO",
  "Build your project step by step": "Costruisci il tuo progetto passo dopo passo",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Usa queste fasi per mantenere il progetto organizzato. Puoi chiedere a ShezoraX di gestire qualsiasi fase dalla scheda Chat IA.",
  "Define": "Definisci",
  "Explain the goal, audience and final result.": "Spiega l'obiettivo, il pubblico e il risultato finale.",
  "Plan": "Pianifica",
  "Choose features, technology and milestones.": "Scegli funzionalità, tecnologia e traguardi.",
  "Build": "Costruisci",
  "Create the code, content or project material.": "Crea il codice, il contenuto o il materiale del progetto.",
  "Test": "Testa",
  "Review errors, requirements and edge cases.": "Rivedi errori, requisiti e casi limite.",
  "Polish": "Raffina",
  "Improve design, quality and presentation.": "Migliora il design, la qualità e la presentazione.",
  "Deliver": "Consegna",
  "Prepare the final files, documentation or presentation.": "Prepara i file finali, la documentazione o la presentazione.",
  "Ask ShezoraX →": "Chiedi a ShezoraX →",
  "PROJECT MEMORY": "MEMORIA DEL PROGETTO",
  "Project notes": "Note del progetto",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Salva requisiti, link, scadenze, tecnologie o altro contesto. Le note rimangono su questo dispositivo e sono incluse nelle future richieste IA del progetto.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "Esempio: React + Node.js, scadenza venerdì, deve essere responsive per dispositivi mobili…",
  "characters · saved locally": "caratteri · salvati localmente",
  "Back to Chat": "Torna alla Chat",
  "messages": "messaggi",
  "Copied": "Copiato",
  "Copy conversation": "Copia conversazione",

  // Project Types
  "Website / Web App": "Sito / Applicazione Web",
  "School Project": "Progetto Scolastico",
  "College / University": "Università / College",
  "Software / Desktop App": "Software / Applicazione Desktop",
  "Mobile App": "App Mobile",
  "Game Project": "Progetto Gioco",
  "Data / Research": "Dati / Ricerca",
  "Presentation / Report": "Presentazione / Report",
  "Design / Creative": "Design / Creativo",
  "Custom Project": "Progetto Personalizzato",
  "Build websites, dashboards, portfolios and full web applications.": "Costruisci siti web, dashboard, portfolio e applicazioni web complete.",
  "Create school assignments, experiments, reports and presentations.": "Crea compiti scolastici, esperimenti, report e presentazioni.",
  "Work on university assignments, FYPs, research and documentation.": "Lavora su incarichi universitari, tesi, ricerca e documentazione.",
  "Plan software products, desktop tools and utility applications.": "Pianifica prodotti software, strumenti desktop e applicazioni utility.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Costruisci assistenti IA, idee di ML, prompt e prodotti intelligenti.",
  "Create Android, iOS and cross-platform mobile applications.": "Crea applicazioni mobili per Android, iOS e multipiattaforma.",
  "Build game concepts, mechanics, stories and development plans.": "Costruisci concetti di gioco, meccaniche, storie e piani di sviluppo.",
  "Analyze data, plan research and prepare technical findings.": "Analizza dati, pianifica ricerche e prepara risultati tecnici.",
  "Create reports, presentations, proposals and structured documents.": "Crea report, presentazioni, proposte e documenti strutturati.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Sviluppa UI/UX, branding, concetti creativi e direzione visiva.",
  "Start anything else with a completely custom AI workspace.": "Inizia qualsiasi altra cosa con uno spazio di lavoro IA completamente personalizzato.",

  // Create
  "CREATE": "CREA",
  "Create something amazing": "Crea qualcosa di straordinario",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Scegli uno strumento di creazione. Ogni strumento apre il proprio spazio di lavoro ShezoraX IA focalizzato con suggerimenti e chat pertinenti.",
  "Open workspace →": "Apri spazio di lavoro →",
  "← All Create Tools": "← Tutti gli Strumenti di Creazione",
  "CREATE WORKSPACE": "SPAZIO DI LAVORO DI CREAZIONE",
  "What would you like to create?": "Cosa vorresti creare?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Inizia con la tua richiesta o scegli uno dei suggerimenti per questo strumento di creazione.",
  "Listening": "In ascolto",
  "SUGGESTIONS": "SUGGERIMENTI",
  "Try one of these": "Prova uno di questi",

  // Create Tools
  "Image Create": "Creazione Immagine",
  "Video Create": "Creazione Video",
  "Photo / Image Editing": "Modifica Foto / Immagine",
  "Resume / CV": "Curriculum / CV",
  "Content Writing": "Scrittura di Contenuti",
  "Presentation Maker": "Creatore di Presentazioni",
  "Document Creator": "Creatore di Documenti",
  "Story & Script Writer": "Scrittore di Storie e Sceneggiature",
  "Social Media Creator": "Creatore di Contenuti Social",
  "Logo & Branding": "Logo e Branding",
  "Music & Audio": "Musica e Audio",
  "UI / Visual Design": "Design UI / Visivo",
  "Diagram & Infographic": "Diagramma e Infografica",
  "Email & Message Writer": "Scrittore di Email e Messaggi",
  "Study Notes & Flashcards": "Note di Studio e Flashcard",
  "Research & Report Writer": "Scrittore di Ricerca e Report",
  "Document Converter": "Convertitore di Documenti",
  "Template Creator": "Creatore di Modelli",
  "AI Project": "Progetto IA",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Crea immagini, concetti, scene, ritratti e idee visive con l'IA.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Pianifica e crea concetti video, scene, sceneggiature e direzioni visive.",
  "Improve, transform, retouch and creatively edit images.": "Migliora, trasforma, ritocca e modifica creativamente le immagini.",
  "Create professional resumes, CVs, cover letters and career documents.": "Crea curriculum professionali, CV, lettere di presentazione e documenti di carriera.",
  "Write articles, blogs, descriptions, captions and professional content.": "Scrivi articoli, blog, descrizioni, didascalie e contenuti professionali.",
  "Create slide structures, presentation content and speaker notes.": "Crea strutture di slide, contenuti di presentazioni e note del relatore.",
  "Create professional documents, proposals, letters and structured files.": "Crea documenti professionali, proposte, lettere e file strutturati.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Crea storie, sceneggiature, script, personaggi e mondi immaginari.",
  "Create captions, posts, content ideas and social media campaigns.": "Crea didascalie, post, idee di contenuto e campagne sui social media.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Sviluppa identità di marca, concetti di logo, nomi, colori e direzione visiva.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Crea concetti musicali, testi, idee sonore, script vocali e direzione audio.",
  "Create interface concepts, visual systems, layouts and design directions.": "Crea concetti di interfaccia, sistemi visivi, layout e direzioni di design.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Crea diagrammi, flowchart, infografiche e spiegazioni visive.",
  "Write professional emails, messages, replies, invitations and announcements.": "Scrivi email professionali, messaggi, risposte, inviti e annunci.",
  "Create general study notes, flashcards, quizzes and revision material.": "Crea note di studio generali, flashcard, quiz e materiale di revisione.",
  "Create general reports, structured research writing and analytical documents.": "Crea report generali, scrittura di ricerca strutturata e documenti analitici.",
  "Plan document transformations, formatting changes and content conversions.": "Pianifica trasformazioni di documenti, modifiche di formattazione e conversioni di contenuto.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Crea modelli riutilizzabili per documenti, post, email, pianificazione e altro.",

  // Create Tool Suggestions
  "Create a cinematic space scene": "Crea una scena spaziale cinematografica",
  "Create a professional profile image": "Crea un'immagine di profilo professionale",
  "Create a futuristic city concept": "Crea un concetto di città futuristica",
  "Create a realistic product image": "Crea un'immagine realistica di prodotto",
  "Create a cinematic video concept": "Crea un concetto video cinematografico",
  "Create a short promotional video": "Crea un breve video promozionale",
  "Create a futuristic story video": "Crea un video di storia futuristica",
  "Create a social media video idea": "Crea un'idea di video per i social media",
  "Improve this image professionally": "Migliora questa immagine professionalmente",
  "Remove unwanted objects": "Rimuovi oggetti indesiderati",
  "Create a cinematic color grade": "Crea una color correction cinematografica",
  "Turn this image into a different style": "Trasforma questa immagine in uno stile diverso",
  "Create a modern ATS-friendly CV": "Crea un curriculum moderno compatibile con ATS",
  "Improve my professional summary": "Migliora il mio sommario professionale",
  "Write a strong cover letter": "Scrivi una lettera di presentazione efficace",
  "Improve my work experience section": "Migliora la mia sezione esperienza lavorativa",
  "Write a professional blog post": "Scrivi un post di blog professionale",
  "Create an engaging article": "Crea un articolo coinvolgente",
  "Write a product description": "Scrivi una descrizione di prodotto",
  "Create a detailed content outline": "Crea una struttura dettagliata dei contenuti",
  "Create a professional presentation": "Crea una presentazione professionale",
  "Build a 10-slide presentation structure": "Costruisci una struttura di presentazione con 10 slide",
  "Write speaker notes for my slides": "Scrivi note del relatore per le mie slide",
  "Create a presentation outline": "Crea una struttura di presentazione",
  "Create a professional proposal": "Crea una proposta professionale",
  "Write a formal document": "Scrivi un documento formale",
  "Create a business document": "Crea un documento aziendale",
  "Turn my notes into a structured document": "Trasforma le mie note in un documento strutturato",
  "Create a science-fiction story": "Crea una storia di fantascienza",
  "Write a short film script": "Scrivi una sceneggiatura per cortometraggio",
  "Create interesting characters": "Crea personaggi interessanti",
  "Build a cinematic story outline": "Costruisci una struttura di storia cinematografica",
  "Create an Instagram content plan": "Crea un piano di contenuti per Instagram",
  "Write a professional LinkedIn post": "Scrivi un post professionale per LinkedIn",
  "Create 10 social media captions": "Crea 10 didascalie per i social media",
  "Create a one-week content calendar": "Crea un calendario di contenuti di una settimana",
  "Create a modern brand identity": "Crea un'identità di marca moderna",
  "Develop a logo concept": "Sviluppa un concetto di logo",
  "Create a brand color direction": "Crea una direzione di colori del brand",
  "Build a complete branding concept": "Costruisci un concetto di branding completo",
  "Create a cinematic music concept": "Crea un concetto musicale cinematografico",
  "Write lyrics for a song": "Scrivi il testo di una canzone",
  "Create a podcast intro": "Crea un'introduzione per podcast",
  "Write a professional voice-over script": "Scrivi uno script professionale per voice-over",
  "Create a modern dashboard design": "Crea un design moderno per dashboard",
  "Create a mobile app UI concept": "Crea un concetto di UI per app mobile",
  "Design a futuristic landing page": "Progetta una landing page futuristica",
  "Create a visual design system": "Crea un sistema di design visivo",
  "Create a process flowchart": "Crea un flowchart di processo",
  "Create an educational infographic": "Crea un'infografica educativa",
  "Explain this topic with a diagram": "Spiega questo argomento con un diagramma",
  "Create a professional system diagram": "Crea un diagramma di sistema professionale",
  "Write a professional email": "Scrivi un'email professionale",
  "Write a polite reply": "Scrivi una risposta educata",
  "Create a formal request": "Crea una richiesta formale",
  "Write a professional announcement": "Scrivi un annuncio professionale",
  "Create revision notes": "Crea note di revisione",
  "Create flashcards": "Crea flashcard",
  "Create a practice quiz": "Crea un quiz di pratica",
  "Turn these notes into questions": "Trasforma queste note in domande",
  "Create a structured report": "Crea un report strutturato",
  "Turn my information into a research-style document": "Trasforma le mie informazioni in un documento in stile ricerca",
  "Create an executive summary": "Crea un sommario esecutivo",
  "Organize this information into sections": "Organizza queste informazioni in sezioni",
  "Convert this content into a professional format": "Converti questo contenuto in un formato professionale",
  "Turn notes into a formal document": "Trasforma le note in un documento formale",
  "Convert this text into a structured outline": "Converti questo testo in una struttura organizzata",
  "Reformat this document professionally": "Riformatta questo documento professionalmente",
  "Create a professional email template": "Crea un modello di email professionale",
  "Create a social media template": "Crea un modello per i social media",
  "Create a professional document template": "Crea un modello di documento professionale",
  "Create a reusable planning template": "Crea un modello di pianificazione riutilizzabile",

  // Knowledge
  "Universe & Space": "Universo e Spazio",
  "Earth": "Terra",
  "Science": "Scienza",
  "Technology": "Tecnologia",
  "Programming": "Programmazione",
  "History": "Storia",
  "Mathematics": "Matematica",
  "Physics": "Fisica",
  "KNOWLEDGE": "CONOSCENZA",
  "Knowledge Universe": "Universo della Conoscenza",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Scegli un argomento e ShezoraX aprirà la chat IA con una domanda mirata.",

  // Settings
  "SETTINGS": "IMPOSTAZIONI",
  "Manage your ShezoraX preferences, account and personal experience.": "Gestisci le tue preferenze, il tuo account e la tua esperienza personale di ShezoraX.",
  "GENERAL": "GENERALE",
  "Language, voice and general preferences": "Lingua, voce e preferenze generali",
  "AI voice replies": "Risposte vocali IA",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX pronuncia le risposte generali dell'IA quando la sintesi vocale del browser è disponibile.",
  "ON": "ON",
  "OFF": "OFF",
  "Project voice replies": "Risposte vocali del progetto",
  "Automatically speak responses inside project workspaces.": "Pronuncia automaticamente le risposte all'interno degli spazi di lavoro del progetto.",
  "Test Voice": "Testa Voce",
  "Test Microphone": "Testa Microfono",
  "CREATOR": "CREATORE",
  "Connect & Follow": "Connettiti e Segui",
  "Stay updated with my latest work and projects.": "Rimani aggiornato sui miei ultimi lavori e progetti.",
  "GitHub": "GitHub",
  "Explore my projects": "Esplora i miei progetti",
  "Facebook": "Facebook",
  "Connect with me": "Connettiti con me",
  "Instagram": "Instagram",
  "Follow my journey": "Segui il mio percorso",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Connettiti professionalmente",
  "X": "X",
  "Follow for updates": "Segui per gli aggiornamenti",
  "Portfolio": "Portfolio",
  "View my work": "Guarda i miei lavori",
  "PROFILE": "PROFILO",
  "Manage your ShezoraX account and personal data.": "Gestisci il tuo account e i tuoi dati personali di ShezoraX.",
  "Your name": "Il tuo nome",
  "How ShezoraX should greet you": "Come ShezoraX dovrebbe salutarti",
  "Enter your name": "Inserisci il tuo nome",
  "Google email": "Email Google",
  "Connected account": "Account connesso",
  "Log out of all devices": "Disconnetti da tutti i dispositivi",
  "End active ShezoraX sessions on other devices.": "Termina le sessioni attive di ShezoraX su altri dispositivi.",
  "Delete all chats": "Elimina tutte le chat",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Rimuovi le tue conversazioni di ShezoraX e la memoria delle chat di progetto da questo dispositivo.",
  "Delete account": "Elimina account",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Elimina definitivamente il tuo account ShezoraX quando l'autenticazione dell'account è collegata.",
  "GOOGLE ACCOUNT": "ACCOUNT GOOGLE",
  "Connect your Google account to use account authentication with ShezoraX.": "Collega il tuo account Google per utilizzare l'autenticazione dell'account con ShezoraX.",
  "Google": "Google",
  "Google connection is ready.": "La connessione Google è pronta.",
  "Connect your Google account to ShezoraX.": "Collega il tuo account Google a ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "Il vero Google OAuth richiede credenziali di autenticazione configurate.",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Collega il tuo Apple ID per utilizzare l'autenticazione dell'account Apple con ShezoraX.",
  "Apple ID connection is ready.": "La connessione Apple ID è pronta.",
  "Connect your Apple ID to ShezoraX.": "Collega il tuo Apple ID a ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "Il vero Apple Sign In richiede credenziali di autenticazione configurate.",
  "RELIGION & FAITH": "RELIGIONE E FEDE",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Gestisci le preferenze religiose e relative alla fede utilizzate da ShezoraX.",
  "Faith preferences": "Preferenze di fede",

    "Coming soon": "Скоро",
    "Prayer times": "Время молитвы",
    "Get notifications for daily prayer times based on your location.": "Получайте уведомления о ежедневном времени молитвы в зависимости от вашего местоположения.",
    "Qibla direction": "Направление Киблы",
    "Find the direction of prayer using your device compass.": "Найдите направление молитвы с помощью компаса вашего устройства.",
    "Daily verses": "Ежедневные стихи",
    "Receive daily religious verses and reflections in your feed.": "Получайте ежедневные религиозные стихи и размышления в своей ленте.",
    "Configure how ShezoraX integrates faith-based guidance into your experience.": "Настройте, как ShezoraX интегрирует руководство на основе веры в ваш опыт.",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Quest'area è riservata alle tue conoscenze religiose, alla preghiera e alle preferenze relative alla fede.",
  "Religious knowledge": "Conoscenza religiosa",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX può mantenere gli argomenti religiosi separati dalle preferenze generali dell'applicazione.",
  "Religion": "Religione",
  "Islam": "Islam",
  "Christianity": "Cristianesimo",
  "Judaism": "Ebraismo",
  "Hinduism": "Induismo",
  "Buddhism": "Buddismo",
  "Sikhism": "Sikhismo",
  "Jainism": "Giainismo",
  "Baháʼí Faith": "Fede Baháʼí",
  "Taoism": "Taoismo",
  "Confucianism": "Confucianesimo",
  "Shinto": "Shintoismo",
  "Zoroastrianism": "Zoroastrismo",
  "Other / Spiritual": "Altro / Spirituale",
  "No preference": "Nessuna preferenza",

  // Voices
  "ShezoraX female AI voice": "Voce IA femminile di ShezoraX",
  "ShezoraX male AI voice": "Voce IA maschile di ShezoraX",
  "Connect with Creator": "Connettiti con il Creatore",
  "Follow the creator behind ShezoraX": "Segui il creatore dietro ShezoraX",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "Sei sicuro di voler eliminare tutte le chat di ShezoraX?",
  "All chats have been deleted.": "Tutte le chat sono state eliminate.",
  "Are you sure you want to delete your ShezoraX account?": "Sei sicuro di voler eliminare il tuo account ShezoraX?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "L'eliminazione dell'account richiede un backend di autenticazione reale. I tuoi dati locali del progetto possono essere rimossi separatamente.",
  "Log out of all devices requires a real authentication/session backend.": "La disconnessione da tutti i dispositivi richiede un backend di autenticazione/sessione reale.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "L'interfaccia di connessione dell'account Google è pronta. Sono richieste credenziali Google OAuth reali per l'autenticazione attiva.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "L'interfaccia di connessione dell'Apple ID è pronta. Sono richieste credenziali Apple Sign In reali per l'autenticazione attiva.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "Il riconoscimento vocale non è supportato in questo browser. Prova Google Chrome o Microsoft Edge.",
  "I received your message, but no response was returned.": "Ho ricevuto il tuo messaggio, ma nessuna risposta è stata restituita.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Non riesco a connettermi al servizio IA in questo momento. Verifica che il backend di ShezoraX sia in esecuzione.",
  "I received your project request, but no response was returned.": "Ho ricevuto la tua richiesta di progetto, ma nessuna risposta è stata restituita.",
  "I received your creation request, but no response was returned.": "Ho ricevuto la tua richiesta di creazione, ma nessuna risposta è stata restituita.",
"Full-Stack Developer & AI Engineer — the mind behind": "Sviluppatore Full-Stack e Ingegnere IA — la mente dietro",
"Connect a provider to add account authentication to ShezoraX.": "Connetti un provider per aggiungere l'autenticazione dell'account a ShezoraX.",

  },

Hindi: {
// Navigation & System
"Home": "होम",
"AI Chat": "AI चैट",
"Create": "बनाएं",
"Projects": "प्रोजेक्ट्स",
"Knowledge": "ज्ञान",
"Settings": "सेटिंग्स",
"AI System": "AI सिस्टम",
"Online": "ऑनलाइन",
"Account": "खाता",
"Search": "खोजें",
"General": "सामान्य",
"Profile": "प्रोफ़ाइल",
"Google Account": "Google खाता",
"Apple ID": "Apple ID",
"Religion & Faith": "धर्म और आस्था",
"Language": "भाषा",
"Voice": "आवाज़",
"Choose the language used throughout the ShezoraX interface.": "ShezoraX इंटरफ़ेस में उपयोग की जाने वाली भाषा चुनें।",
"Control the language and voice experience of ShezoraX.": "ShezoraX के भाषा और आवाज़ अनुभव को नियंत्रित करें।",
"Choose the AI voice ShezoraX uses for spoken responses.": "वह AI आवाज़ चुनें जो ShezoraX बोली जाने वाली प्रतिक्रियाओं के लिए उपयोग करता है।",
"Connected": "कनेक्टेड",
"Ready": "तैयार",
"Continue with Google": "Google के साथ जारी रखें",
"Continue with Apple ID": "Apple ID के साथ जारी रखें",
"Continue with Apple": "Apple के साथ जारी रखें",
"Good Morning": "सुप्रभात",
"Good Afternoon": "नमस्कार",
"Good Evening": "शुभ संध्या",
"Good Night": "शुभ रात्रि",
"Send": "भेजें",
"Clear": "साफ़ करें",
"Cancel": "रद्द करें",
"Save": "सहेजें",
"Delete": "हटाएं",
"Close": "बंद करें",
"Back": "वापस",
"Open": "खोलें",
"AI System Online": "AI सिस्टम ऑनलाइन",
"Female": "महिला",
"Male": "पुरुष",

// Status & Hero
"ShezoraX AI Online": "ShezoraX AI ऑनलाइन",
"Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "सीखने, बनाने, खोजने और काम पूरा करने के लिए आपका बुद्धिमान व्यक्तिगत AI कार्यक्षेत्र।",
"PERSONAL AI": "व्यक्तिगत AI",
"What can I help you with?": "मैं आपकी क्या मदद कर सकता हूँ?",
"Listening…": "सुन रहा हूँ…",
"Speak": "बोलें",
"READY": "तैयार",
"Ask ShezoraX anything.": "ShezoraX से कुछ भी पूछें।",
"You can also use the microphone or one of the quick prompts below.": "आप माइक्रोफ़ोन या नीचे दिए गए त्वरित सुझावों में से किसी एक का भी उपयोग कर सकते हैं।",
"YOU": "आप",
"SHEZORAX": "SHEZORAX",
"Thinking…": "सोच रहा हूँ…",
"Ask ShezoraX anything…": "ShezoraX से कुछ भी पूछें…",
"Voice input is available": "वॉइस इनपुट उपलब्ध है",
"Stop mic": "माइक बंद करें",
"Enter to send · Shift + Enter for a new line": "भेजने के लिए Enter · नई लाइन के लिए Shift + Enter",

// Suggestions
"Explain something to me": "मुझे कुछ समझाएं",
"Help me plan my day": "मेरा दिन योजना बनाने में मदद करें",
"Teach me about the universe": "मुझे ब्रह्मांड के बारे में सिखाएं",
"Help me build a project": "मुझे प्रोजेक्ट बनाने में मदद करें",
"EXPLORE SHEZORAX": "SHEZORAX खोजें",

// Chat
"Talk with ShezoraX": "ShezoraX से बात करें",
"Start a conversation with ShezoraX.": "ShezoraX से बातचीत शुरू करें।",
"Ask a question, explain a problem, or describe what you want to build.": "सवाल पूछें, समस्या समझाएं, या बताएं कि आप क्या बनाना चाहते हैं।",
"Message ShezoraX": "ShezoraX को संदेश भेजें",

// Projects
"PROJECTS": "प्रोजेक्ट्स",
"Build something with ShezoraX": "ShezoraX के साथ कुछ बनाएं",
"Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "प्रोजेक्ट प्रकार चुनें। प्रत्येक कार्यक्षेत्र में अपना AI चैट, वॉइस इनपुट, वॉइस रिप्लाई, नोट्स और सहेजी गई बातचीत होती है।",
"Open project workspace →": "प्रोजेक्ट कार्यक्षेत्र खोलें →",
"← All Projects": "← सभी प्रोजेक्ट्स",
"PROJECT WORKSPACE": "प्रोजेक्ट कार्यक्षेत्र",
"Export": "निर्यात",
"Project Plan": "प्रोजेक्ट योजना",
"Notes": "नोट्स",
"Tell ShezoraX what you want to build.": "ShezoraX को बताएं कि आप क्या बनाना चाहते हैं।",
"Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "अपना विचार, आवश्यकताएं, अंतिम तिथि, तकनीक, असाइनमेंट निर्देश या कोई भी समस्या बताएं जिसे आप हल करना चाहते हैं।",
"Working on your project…": "आपके प्रोजेक्ट पर काम हो रहा है…",
"Listening… speak now": "सुन रहा हूँ… अब बोलें",
"Voice + text supported": "वॉइस + टेक्स्ट समर्थित",
"WORKFLOW": "वर्कफ़्लो",
"Build your project step by step": "अपना प्रोजेक्ट कदम दर कदम बनाएं",
"Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "प्रोजेक्ट को व्यवस्थित रखने के लिए इन चरणों का उपयोग करें। आप AI चैट टैब से ShezoraX को कोई भी चरण संभालने के लिए कह सकते हैं।",
"Define": "परिभाषा",
"Explain the goal, audience and final result.": "लक्ष्य, दर्शक और अंतिम परिणाम बताएं।",
"Plan": "योजना",
"Choose features, technology and milestones.": "सुविधाएं, तकनीक और मील के पत्थर चुनें।",
"Build": "निर्माण",
"Create the code, content or project material.": "कोड, सामग्री या प्रोजेक्ट सामग्री बनाएं।",
"Test": "परीक्षण",
"Review errors, requirements and edge cases.": "त्रुटियों, आवश्यकताओं और विशेष स्थितियों की समीक्षा करें।",
"Polish": "निखार",
"Improve design, quality and presentation.": "डिज़ाइन, गुणवत्ता और प्रस्तुति में सुधार करें।",
"Deliver": "डिलीवरी",
"Prepare the final files, documentation or presentation.": "अंतिम फ़ाइलें, दस्तावेज़ या प्रस्तुति तैयार करें।",
"Ask ShezoraX →": "ShezoraX से पूछें →",
"PROJECT MEMORY": "प्रोजेक्ट मेमोरी",
"Project notes": "प्रोजेक्ट नोट्स",
"Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "आवश्यकताएं, लिंक, अंतिम तिथियां, तकनीकें या अन्य संदर्भ सहेजें। नोट्स इस डिवाइस पर रहते हैं और भविष्य के प्रोजेक्ट AI अनुरोधों में शामिल किए जाते हैं।",
"Example: React + Node.js, deadline Friday, must be mobile responsive…": "उदाहरण: React + Node.js, अंतिम तिथि शुक्रवार, मोबाइल रेस्पॉन्सिव होना ज़रूरी…",
"characters · saved locally": "अक्षर · स्थानीय रूप से सहेजा गया",
"Back to Chat": "चैट पर वापस",
"messages": "संदेश",
"Copied": "कॉपी हो गया",
"Copy conversation": "बातचीत कॉपी करें",

// Project Types
"Website / Web App": "वेबसाइट / वेब ऐप",
"School Project": "स्कूल प्रोजेक्ट",
"College / University": "कॉलेज / विश्वविद्यालय",
"Software / Desktop App": "सॉफ़्टवेयर / डेस्कटॉप ऐप",
"Mobile App": "मोबाइल ऐप",
"Game Project": "गेम प्रोजेक्ट",
"Data / Research": "डेटा / अनुसंधान",
"Presentation / Report": "प्रस्तुति / रिपोर्ट",
"Design / Creative": "डिज़ाइन / रचनात्मक",
"Custom Project": "कस्टम प्रोजेक्ट",
"Build websites, dashboards, portfolios and full web applications.": "वेबसाइट, डैशबोर्ड, पोर्टफोलियो और पूर्ण वेब एप्लिकेशन बनाएं।",
"Create school assignments, experiments, reports and presentations.": "स्कूल असाइनमेंट, प्रयोग, रिपोर्ट और प्रस्तुतियां बनाएं।",
"Work on university assignments, FYPs, research and documentation.": "विश्वविद्यालय असाइनमेंट, FYP, अनुसंधान और दस्तावेज़ीकरण पर काम करें।",
"Plan software products, desktop tools and utility applications.": "सॉफ़्टवेयर उत्पाद, डेस्कटॉप टूल और उपयोगिता एप्लिकेशन की योजना बनाएं।",
"Build AI assistants, ML ideas, prompts and intelligent products.": "AI असिस्टेंट, ML विचार, प्रॉम्प्ट और बुद्धिमान उत्पाद बनाएं।",
"Create Android, iOS and cross-platform mobile applications.": "Android, iOS और क्रॉस-प्लेटफ़ॉर्म मोबाइल एप्लिकेशन बनाएं।",
"Build game concepts, mechanics, stories and development plans.": "गेम अवधारणाएं, मैकेनिक्स, कहानियां और विकास योजनाएं बनाएं।",
"Analyze data, plan research and prepare technical findings.": "डेटा का विश्लेषण करें, अनुसंधान की योजना बनाएं और तकनीकी निष्कर्ष तैयार करें।",
"Create reports, presentations, proposals and structured documents.": "रिपोर्ट, प्रस्तुतियां, प्रस्ताव और संरचित दस्तावेज़ बनाएं।",
"Develop UI/UX, branding, creative concepts and visual direction.": "UI/UX, ब्रांडिंग, रचनात्मक अवधारणाएं और दृश्य दिशा विकसित करें।",
"Start anything else with a completely custom AI workspace.": "पूरी तरह से कस्टम AI कार्यक्षेत्र के साथ कुछ भी शुरू करें।",

// Create
"CREATE": "बनाएं",
"Create something amazing": "कुछ शानदार बनाएं",
"Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "रचनात्मक टूल चुनें। प्रत्येक टूल अपना विशिष्ट ShezoraX AI कार्यक्षेत्र खोलता है प्रासंगिक सुझावों और चैट के साथ।",
"Open workspace →": "कार्यक्षेत्र खोलें →",
"← All Create Tools": "← सभी रचनात्मक टूल",
"CREATE WORKSPACE": "रचनात्मक कार्यक्षेत्र",
"What would you like to create?": "आप क्या बनाना चाहेंगे?",
"Start with your own request or choose one of the suggestions for this creation tool.": "अपने अनुरोध से शुरू करें या इस रचनात्मक टूल के लिए सुझावों में से एक चुनें।",
"Listening": "सुन रहा हूँ",
"SUGGESTIONS": "सुझाव",
"Try one of these": "इनमें से एक आज़माएं",

// Create Tools
"Image Create": "छवि बनाएं",
"Video Create": "वीडियो बनाएं",
"Photo / Image Editing": "फ़ोटो / छवि संपादन",
"Resume / CV": "रेज़्यूमे / CV",
"Content Writing": "सामग्री लेखन",
"Presentation Maker": "प्रस्तुति निर्माता",
"Document Creator": "दस्तावेज़ निर्माता",
"Story & Script Writer": "कहानी और पटकथा लेखक",
"Social Media Creator": "सोशल मीडिया निर्माता",
"Logo & Branding": "लोगो और ब्रांडिंग",
"Music & Audio": "संगीत और ऑडियो",
"UI / Visual Design": "UI / दृश्य डिज़ाइन",
"Diagram & Infographic": "आरेख और इन्फोग्राफ़िक",
"Email & Message Writer": "ईमेल और संदेश लेखक",
"Study Notes & Flashcards": "अध्ययन नोट्स और फ़्लैशकार्ड",
"Research & Report Writer": "अनुसंधान और रिपोर्ट लेखक",
"Document Converter": "दस्तावेज़ कनवर्टर",
"Template Creator": "टेम्पलेट निर्माता",
"AI Project": "AI प्रोजेक्ट",
"Create images, concepts, scenes, portraits and visual ideas with AI.": "AI के साथ छवियां, अवधारणाएं, दृश्य, चित्र और दृश्य विचार बनाएं।",
"Plan and create video concepts, scenes, scripts and visual directions.": "वीडियो अवधारणाओं, दृश्यों, स्क्रिप्ट और दृश्य दिशाओं की योजना बनाएं और बनाएं।",
"Improve, transform, retouch and creatively edit images.": "छवियों को बेहतर बनाएं, बदलें, रीटच करें और रचनात्मक रूप से संपादित करें।",
"Create professional resumes, CVs, cover letters and career documents.": "पेशेवर रेज़्यूमे, CV, कवर लेटर और करियर दस्तावेज़ बनाएं।",
"Write articles, blogs, descriptions, captions and professional content.": "लेख, ब्लॉग, विवरण, कैप्शन और पेशेवर सामग्री लिखें।",
"Create slide structures, presentation content and speaker notes.": "स्लाइड संरचना, प्रस्तुति सामग्री और वक्ता नोट्स बनाएं।",
"Create professional documents, proposals, letters and structured files.": "पेशेवर दस्तावेज़, प्रस्ताव, पत्र और संरचित फ़ाइलें बनाएं।",
"Create stories, screenplays, scripts, characters and fictional worlds.": "कहानियां, पटकथाएं, स्क्रिप्ट, पात्र और काल्पनिक दुनिया बनाएं।",
"Create captions, posts, content ideas and social media campaigns.": "कैप्शन, पोस्ट, सामग्री विचार और सोशल मीडिया अभियान बनाएं।",
"Develop brand identities, logo concepts, names, colors and visual direction.": "ब्रांड पहचान, लोगो अवधारणाएं, नाम, रंग और दृश्य दिशा विकसित करें।",
"Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "संगीत अवधारणाएं, गीत, ध्वनि विचार, वॉइस स्क्रिप्ट और ऑडियो दिशा बनाएं।",
"Create interface concepts, visual systems, layouts and design directions.": "इंटरफ़ेस अवधारणाएं, दृश्य सिस्टम, लेआउट और डिज़ाइन दिशाएं बनाएं।",
"Create diagrams, flowcharts, infographics and visual explanations.": "आरेख, फ़्लोचार्ट, इन्फोग्राफ़िक्स और दृश्य व्याख्याएं बनाएं।",
"Write professional emails, messages, replies, invitations and announcements.": "पेशेवर ईमेल, संदेश, उत्तर, निमंत्रण और घोषणाएं लिखें।",
"Create general study notes, flashcards, quizzes and revision material.": "सामान्य अध्ययन नोट्स, फ़्लैशकार्ड, क्विज़ और पुनरीक्षण सामग्री बनाएं।",
"Create general reports, structured research writing and analytical documents.": "सामान्य रिपोर्ट, संरचित अनुसंधान लेखन और विश्लेषणात्मक दस्तावेज़ बनाएं।",
"Plan document transformations, formatting changes and content conversions.": "दस्तावेज़ रूपांतरण, स्वरूपण परिवर्तन और सामग्री रूपांतरण की योजना बनाएं।",
"Create reusable templates for documents, posts, emails, planning and more.": "दस्तावेज़, पोस्ट, ईमेल, योजना और अधिक के लिए पुन: प्रयोज्य टेम्पलेट बनाएं।",

// Create Tool Suggestions
"Create a cinematic space scene": "एक सिनेमाई अंतरिक्ष दृश्य बनाएं",
"Create a professional profile image": "एक पेशेवर प्रोफ़ाइल छवि बनाएं",
"Create a futuristic city concept": "एक भविष्यवादी शहर की अवधारणा बनाएं",
"Create a realistic product image": "एक यथार्थवादी उत्पाद छवि बनाएं",
"Create a cinematic video concept": "एक सिनेमाई वीडियो अवधारणा बनाएं",
"Create a short promotional video": "एक छोटा प्रचार वीडियो बनाएं",
"Create a futuristic story video": "एक भविष्यवादी कहानी का वीडियो बनाएं",
"Create a social media video idea": "सोशल मीडिया वीडियो का विचार बनाएं",
"Improve this image professionally": "इस छवि को पेशेवर रूप से बेहतर बनाएं",
"Remove unwanted objects": "अवांछित वस्तुएं हटाएं",
"Create a cinematic color grade": "एक सिनेमाई कलर ग्रेड बनाएं",
"Turn this image into a different style": "इस छवि को एक अलग शैली में बदलें",
"Create a modern ATS-friendly CV": "एक आधुनिक ATS-अनुकूल CV बनाएं",
"Improve my professional summary": "मेरा पेशेवर सारांश बेहतर बनाएं",
"Write a strong cover letter": "एक मज़बूत कवर लेटर लिखें",
"Improve my work experience section": "मेरे कार्य अनुभव अनुभाग को बेहतर बनाएं",
"Write a professional blog post": "एक पेशेवर ब्लॉग पोस्ट लिखें",
"Create an engaging article": "एक आकर्षक लेख बनाएं",
"Write a product description": "उत्पाद विवरण लिखें",
"Create a detailed content outline": "एक विस्तृत सामग्री रूपरेखा बनाएं",
"Create a professional presentation": "एक पेशेवर प्रस्तुति बनाएं",
"Build a 10-slide presentation structure": "10-स्लाइड प्रस्तुति संरचना बनाएं",
"Write speaker notes for my slides": "मेरी स्लाइड्स के लिए वक्ता नोट्स लिखें",
"Create a presentation outline": "प्रस्तुति की रूपरेखा बनाएं",
"Create a professional proposal": "एक पेशेवर प्रस्ताव बनाएं",
"Write a formal document": "एक औपचारिक दस्तावेज़ लिखें",
"Create a business document": "एक व्यावसायिक दस्तावेज़ बनाएं",
"Turn my notes into a structured document": "मेरे नोट्स को एक संरचित दस्तावेज़ में बदलें",
"Create a science-fiction story": "एक विज्ञान गल्प कहानी बनाएं",
"Write a short film script": "एक लघु फिल्म की पटकथा लिखें",
"Create interesting characters": "दिलचस्प पात्र बनाएं",
"Build a cinematic story outline": "एक सिनेमाई कहानी की रूपरेखा बनाएं",
"Create an Instagram content plan": "Instagram के लिए सामग्री योजना बनाएं",
"Write a professional LinkedIn post": "LinkedIn के लिए पेशेवर पोस्ट लिखें",
"Create 10 social media captions": "सोशल मीडिया के लिए 10 कैप्शन बनाएं",
"Create a one-week content calendar": "एक सप्ताह की सामग्री कैलेंडर बनाएं",
"Create a modern brand identity": "एक आधुनिक ब्रांड पहचान बनाएं",
"Develop a logo concept": "लोगो अवधारणा विकसित करें",
"Create a brand color direction": "ब्रांड रंग दिशा बनाएं",
"Build a complete branding concept": "एक पूर्ण ब्रांडिंग अवधारणा बनाएं",
"Create a cinematic music concept": "एक सिनेमाई संगीत अवधारणा बनाएं",
"Write lyrics for a song": "गाने के लिए गीत लिखें",
"Create a podcast intro": "पॉडकास्ट का परिचय बनाएं",
"Write a professional voice-over script": "एक पेशेवर वॉइस-ओवर स्क्रिप्ट लिखें",
"Create a modern dashboard design": "एक आधुनिक डैशबोर्ड डिज़ाइन बनाएं",
"Create a mobile app UI concept": "मोबाइल ऐप UI अवधारणा बनाएं",
"Design a futuristic landing page": "एक भविष्यवादी लैंडिंग पेज डिज़ाइन करें",
"Create a visual design system": "एक दृश्य डिज़ाइन सिस्टम बनाएं",
"Create a process flowchart": "एक प्रक्रिया फ़्लोचार्ट बनाएं",
"Create an educational infographic": "एक शैक्षिक इन्फोग्राफ़िक बनाएं",
"Explain this topic with a diagram": "इस विषय को आरेख से समझाएं",
"Create a professional system diagram": "एक पेशेवर सिस्टम आरेख बनाएं",
"Write a professional email": "एक पेशेवर ईमेल लिखें",
"Write a polite reply": "एक विनम्र उत्तर लिखें",
"Create a formal request": "एक औपचारिक अनुरोध बनाएं",
"Write a professional announcement": "एक पेशेवर घोषणा लिखें",
"Create revision notes": "पुनरीक्षण नोट्स बनाएं",
"Create flashcards": "फ़्लैशकार्ड बनाएं",
"Create a practice quiz": "एक अभ्यास क्विज़ बनाएं",
"Turn these notes into questions": "इन नोट्स को प्रश्नों में बदलें",
"Create a structured report": "एक संरचित रिपोर्ट बनाएं",
"Turn my information into a research-style document": "मेरी जानकारी को अनुसंधान शैली के दस्तावेज़ में बदलें",
"Create an executive summary": "एक कार्यकारी सारांश बनाएं",
"Organize this information into sections": "इस जानकारी को अनुभागों में व्यवस्थित करें",
"Convert this content into a professional format": "इस सामग्री को पेशेवर प्रारूप में बदलें",
"Turn notes into a formal document": "नोट्स को औपचारिक दस्तावेज़ में बदलें",
"Convert this text into a structured outline": "इस पाठ को संरचित रूपरेखा में बदलें",
"Reformat this document professionally": "इस दस्तावेज़ को पेशेवर रूप से पुन: स्वरूपित करें",
"Create a professional email template": "एक पेशेवर ईमेल टेम्पलेट बनाएं",
"Create a social media template": "एक सोशल मीडिया टेम्पलेट बनाएं",
"Create a professional document template": "एक पेशेवर दस्तावेज़ टेम्पलेट बनाएं",
"Create a reusable planning template": "एक पुन: प्रयोज्य योजना टेम्पलेट बनाएं",

// Knowledge
"Universe & Space": "ब्रह्मांड और अंतरिक्ष",
"Earth": "पृथ्वी",
"Science": "विज्ञान",
"Technology": "प्रौद्योगिकी",
"Programming": "प्रोग्रामिंग",
"History": "इतिहास",
"Mathematics": "गणित",
"Physics": "भौतिकी",
"KNOWLEDGE": "ज्ञान",
"Knowledge Universe": "ज्ञान ब्रह्मांड",
"Pick a topic and ShezoraX will open the AI chat with a focused question.": "एक विषय चुनें और ShezoraX एक केंद्रित प्रश्न के साथ AI चैट खोलेगा।",

// Settings
"SETTINGS": "सेटिंग्स",
"Manage your ShezoraX preferences, account and personal experience.": "अपनी ShezoraX प्राथमिकताएं, खाता और व्यक्तिगत अनुभव प्रबंधित करें।",
"GENERAL": "सामान्य",
"Language, voice and general preferences": "भाषा, आवाज़ और सामान्य प्राथमिकताएं",
"AI voice replies": "AI वॉइस रिप्लाई",
"ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX सामान्य AI प्रतिक्रियाएं बोलता है जब ब्राउज़र स्पीच सिंथेसिस उपलब्ध हो।",
"ON": "चालू",
"OFF": "बंद",
"Project voice replies": "प्रोजेक्ट वॉइस रिप्लाई",
"Automatically speak responses inside project workspaces.": "प्रोजेक्ट कार्यक्षेत्र में स्वचालित रूप से प्रतिक्रियाएं बोलें।",
"Test Voice": "आवाज़ परीक्षण",
"Test Microphone": "माइक्रोफ़ोन परीक्षण",
"CREATOR": "निर्माता",
"Connect & Follow": "जुड़ें और फ़ॉलो करें",
"Stay updated with my latest work and projects.": "मेरे नवीनतम काम और प्रोजेक्ट्स से अपडेट रहें।",
"GitHub": "GitHub",
"Explore my projects": "मेरे प्रोजेक्ट्स देखें",
"Facebook": "Facebook",
"Connect with me": "मुझसे जुड़ें",
"Instagram": "Instagram",
"Follow my journey": "मेरी यात्रा फ़ॉलो करें",
"LinkedIn": "LinkedIn",
"Connect professionally": "पेशेवर रूप से जुड़ें",
"X": "X",
"Follow for updates": "अपडेट के लिए फ़ॉलो करें",
"Portfolio": "पोर्टफोलियो",
"View my work": "मेरा काम देखें",
"PROFILE": "प्रोफ़ाइल",
"Manage your ShezoraX account and personal data.": "अपना ShezoraX खाता और व्यक्तिगत डेटा प्रबंधित करें।",
"Your name": "आपका नाम",
"How ShezoraX should greet you": "ShezoraX आपको कैसे संबोधित करे",
"Enter your name": "अपना नाम दर्ज करें",
"Google email": "Google ईमेल",
"Connected account": "कनेक्टेड खाता",
"Log out of all devices": "सभी डिवाइस से लॉग आउट",
"End active ShezoraX sessions on other devices.": "अन्य डिवाइस पर सक्रिय ShezoraX सत्र समाप्त करें।",
"Delete all chats": "सभी चैट हटाएं",
"Remove your ShezoraX conversations and project chat memory from this device.": "इस डिवाइस से अपनी ShezoraX बातचीत और प्रोजेक्ट चैट मेमोरी हटाएं।",
"Delete account": "खाता हटाएं",
"Permanently delete your ShezoraX account when account authentication is connected.": "जब खाता प्रमाणीकरण कनेक्ट हो तो अपना ShezoraX खाता स्थायी रूप से हटाएं।",
"GOOGLE ACCOUNT": "GOOGLE खाता",
"Connect your Google account to use account authentication with ShezoraX.": "ShezoraX के साथ खाता प्रमाणीकरण उपयोग करने के लिए अपना Google खाता कनेक्ट करें।",
"Google": "Google",
"Google connection is ready.": "Google कनेक्शन तैयार है।",
"Connect your Google account to ShezoraX.": "अपना Google खाता ShezoraX से कनेक्ट करें।",
"Real Google OAuth requires configured authentication credentials.": "वास्तविक Google OAuth के लिए कॉन्फ़िगर किए गए प्रमाणीकरण क्रेडेंशियल आवश्यक हैं।",
"APPLE ID": "APPLE ID",
"Connect your Apple ID to use Apple account authentication with ShezoraX.": "ShezoraX के साथ Apple खाता प्रमाणीकरण उपयोग करने के लिए अपना Apple ID कनेक्ट करें।",
"Apple ID connection is ready.": "Apple ID कनेक्शन तैयार है।",
"Connect your Apple ID to ShezoraX.": "अपना Apple ID ShezoraX से कनेक्ट करें।",
"Real Apple Sign In requires configured authentication credentials.": "वास्तविक Apple Sign In के लिए कॉन्फ़िगर किए गए प्रमाणीकरण क्रेडेंशियल आवश्यक हैं।",
"RELIGION & FAITH": "धर्म और आस्था",
"Manage the religious and faith-related preferences used by ShezoraX.": "ShezoraX द्वारा उपयोग की जाने वाली धार्मिक और आस्था से संबंधित प्राथमिकताओं का प्रबंधन करें।",
"Faith preferences": "आस्था प्राथमिकताएं",
"This area is reserved for your religious knowledge, prayer and faith-related preferences.": "यह क्षेत्र आपके धार्मिक ज्ञान, प्रार्थना और आस्था से संबंधित प्राथमिकताओं के लिए आरक्षित है।",
"Religious knowledge": "धार्मिक ज्ञान",
"ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX धार्मिक विषयों को सामान्य एप्लिकेशन प्राथमिकताओं से अलग रख सकता है।",
"Religion": "धर्म",
"Islam": "इस्लाम",
"Christianity": "ईसाई धर्म",
"Judaism": "यहूदी धर्म",
"Hinduism": "हिंदू धर्म",
"Buddhism": "बौद्ध धर्म",
"Sikhism": "सिख धर्म",
"Jainism": "जैन धर्म",
"Baháʼí Faith": "बहाई धर्म",
"Taoism": "ताओ धर्म",
"Confucianism": "कन्फ्यूशियस धर्म",
"Shinto": "शिंटो",
"Zoroastrianism": "पारसी धर्म",
"Other / Spiritual": "अन्य / आध्यात्मिक",
"No preference": "कोई प्राथमिकता नहीं",

// Voices & Creator
"ShezoraX female AI voice": "ShezoraX महिला AI आवाज़",
"ShezoraX male AI voice": "ShezoraX पुरुष AI आवाज़",
"Connect with Creator": "निर्माता से जुड़ें",
"Follow the creator behind ShezoraX": "ShezoraX के पीछे के निर्माता को फ़ॉलो करें",

// Alerts
"Are you sure you want to delete all ShezoraX chats?": "क्या आप वाकई सभी ShezoraX चैट हटाना चाहते हैं?",
"All chats have been deleted.": "सभी चैट हटा दी गई हैं।",
"Are you sure you want to delete your ShezoraX account?": "क्या आप वाकई अपना ShezoraX खाता हटाना चाहते हैं?",
"Account deletion requires a real authentication backend. Your local project data can be removed separately.": "खाता हटाने के लिए वास्तविक प्रमाणीकरण बैकएंड आवश्यक है। आपका स्थानीय प्रोजेक्ट डेटा अलग से हटाया जा सकता है।",
"Log out of all devices requires a real authentication/session backend.": "सभी डिवाइस से लॉग आउट के लिए वास्तविक प्रमाणीकरण/सत्र बैकएंड आवश्यक है।",
"Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google खाता कनेक्शन UI तैयार है। लाइव प्रमाणीकरण के लिए वास्तविक Google OAuth क्रेडेंशियल आवश्यक हैं।",
"Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID कनेक्शन UI तैयार है। लाइव प्रमाणीकरण के लिए वास्तविक Apple Sign In क्रेडेंशियल आवश्यक हैं।",
"Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "इस ब्राउज़र में वॉइस रिकग्निशन समर्थित नहीं है। Google Chrome या Microsoft Edge आज़माएं।",
"I received your message, but no response was returned.": "मुझे आपका संदेश मिला, लेकिन कोई प्रतिक्रिया नहीं मिली।",
"I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "मैं अभी AI सेवा से कनेक्ट नहीं हो पा रहा हूँ। कृपया जांचें कि ShezoraX बैकएंड चल रहा है।",
"I received your project request, but no response was returned.": "मुझे आपका प्रोजेक्ट अनुरोध मिला, लेकिन कोई प्रतिक्रिया नहीं मिली।",
"I received your creation request, but no response was returned.": "मुझे आपका रचनात्मक अनुरोध मिला, लेकिन कोई प्रतिक्रिया नहीं मिली।",

"Full-Stack Developer & AI Engineer — the mind behind": "फुल-स्टैक डेवलपर और AI इंजीनियर — के पीछे का दिमाग",
"Connect a provider to add account authentication to ShezoraX.": "ShezoraX में खाता प्रमाणीकरण जोड़ने के लिए एक प्रदाता से कनेक्ट करें।",

  },

Turkish: {
  // Navigation
  "Home": "Ana Sayfa",
  "AI Chat": "Yapay Zeka Sohbeti",
  "Create": "Oluştur",
  "Projects": "Projeler",
  "Knowledge": "Bilgi",
  "Settings": "Ayarlar",
  "AI System": "Yapay Zeka Sistemi",
  "Online": "Çevrimiçi",
  "Account": "Hesap",
  "Search": "Ara",
  "General": "Genel",
  "Profile": "Profil",
  "Google Account": "Google Hesabı",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Din ve İnanç",
  "Language": "Dil",
  "Voice": "Ses",

  // Long keys
  "Choose the language used throughout the ShezoraX interface.": "ShezoraX arayüzünde kullanılan dili seçin.",
  "Control the language and voice experience of ShezoraX.": "ShezoraX'in dil ve ses deneyimini kontrol edin.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "ShezoraX'in sözlü yanıtlar için kullandığı yapay zeka sesini seçin.",

  // Status
  "Connected": "Bağlandı",
  "Ready": "Hazır",
  "Continue with Google": "Google ile Devam Et",
  "Continue with Apple ID": "Apple ID ile Devam Et",
  "Continue with Apple": "Apple ile Devam Et",
  "Good Morning": "Günaydın",
  "Good Afternoon": "İyi öğlenler",
  "Good Evening": "İyi akşamlar",
  "Good Night": "İyi geceler",
  "Send": "Gönder",
  "Clear": "Temizle",
  "Cancel": "İptal",
  "Save": "Kaydet",
  "Delete": "Sil",
  "Close": "Kapat",
  "Back": "Geri",
  "Open": "Aç",
  "AI System Online": "Yapay Zeka Sistemi Çevrimiçi",
  "Female": "Kadın",
  "Male": "Erkek",

  // Hero
  "ShezoraX AI Online": "ShezoraX Yapay Zeka Çevrimiçi",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Öğrenmek, yaratmak, keşfetmek ve işlerinizi halletmek için akıllı kişisel yapay zeka çalışma alanınız.",
  "PERSONAL AI": "KİŞİSEL YAPAY ZEKA",
  "What can I help you with?": "Size nasıl yardımcı olabilirim?",
  "Listening…": "Dinleniyor…",
  "Speak": "Konuş",
  "READY": "HAZIR",
  "Ask ShezoraX anything.": "ShezoraX'e her şeyi sorun.",
  "You can also use the microphone or one of the quick prompts below.": "Mikrofonu veya aşağıdaki hızlı önerilerden birini de kullanabilirsiniz.",
  "YOU": "SİZ",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "Düşünüyor…",
  "Ask ShezoraX anything…": "ShezoraX'e her şeyi sorun…",
  "Voice input is available": "Ses girişi kullanılabilir",
  "Stop mic": "Mikrofonu Durdur",
  "Enter to send · Shift + Enter for a new line": "Göndermek için Enter · Yeni satır için Shift + Enter",

  // Suggestions
  "Explain something to me": "Bana bir şey açıkla",
  "Help me plan my day": "Günümü planlamama yardım et",
  "Teach me about the universe": "Bana evreni öğret",
  "Help me build a project": "Bir proje oluşturmama yardım et",
  "EXPLORE SHEZORAX": "SHEZORAX'İ KEŞFET",

  // Chat
  "Talk with ShezoraX": "ShezoraX ile Konuş",
  "Start a conversation with ShezoraX.": "ShezoraX ile bir sohbet başlatın.",
  "Ask a question, explain a problem, or describe what you want to build.": "Bir soru sorun, bir sorunu açıklayın veya ne oluşturmak istediğinizi tanımlayın.",
  "Message ShezoraX": "ShezoraX'e Mesaj Gönder",

  // Projects
  "PROJECTS": "PROJELER",
  "Build something with ShezoraX": "ShezoraX ile bir şey inşa edin",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Bir proje türü seçin. Her çalışma alanının kendi yapay zeka sohbeti, ses girişi, sesli yanıtları, notları ve kaydedilmiş konuşması vardır.",
  "Open project workspace →": "Proje çalışma alanını aç →",
  "← All Projects": "← Tüm Projeler",
  "PROJECT WORKSPACE": "PROJE ÇALIŞMA ALANI",
  "Export": "Dışa Aktar",
  "Project Plan": "Proje Planı",
  "Notes": "Notlar",
  "Tell ShezoraX what you want to build.": "ShezoraX'e ne oluşturmak istediğinizi söyleyin.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Fikrinizi, gereksinimlerinizi, son tarihini, teknolojiyi, görev talimatlarını veya çözülmesi gereken herhangi bir sorunu açıklayın.",
  "Working on your project…": "Projeniz üzerinde çalışılıyor…",
  "Listening… speak now": "Dinleniyor… şimdi konuşun",
  "Voice + text supported": "Ses + metin desteklenir",
  "WORKFLOW": "İŞ AKIŞI",
  "Build your project step by step": "Projenizi adım adım oluşturun",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Projeyi düzenli tutmak için bu aşamaları kullanın. ShezoraX'ten Yapay Zeka Sohbeti sekmesinden herhangi bir aşamayı yönetmesini isteyebilirsiniz.",
  "Define": "Tanımla",
  "Explain the goal, audience and final result.": "Hedefi, kitleyi ve nihai sonucu açıklayın.",
  "Plan": "Planla",
  "Choose features, technology and milestones.": "Özellikleri, teknolojiyi ve kilometre taşlarını seçin.",
  "Build": "İnşa Et",
  "Create the code, content or project material.": "Kodu, içeriği veya proje materyalini oluşturun.",
  "Test": "Test Et",
  "Review errors, requirements and edge cases.": "Hataları, gereksinimleri ve uç durumları inceleyin.",
  "Polish": "Cilala",
  "Improve design, quality and presentation.": "Tasarımı, kaliteyi ve sunumu iyileştirin.",
  "Deliver": "Teslim Et",
  "Prepare the final files, documentation or presentation.": "Nihai dosyaları, belgeleri veya sunumu hazırlayın.",
  "Ask ShezoraX →": "ShezoraX'e Sor →",
  "PROJECT MEMORY": "PROJE HAFIZASI",
  "Project notes": "Proje notları",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Gereksinimleri, bağlantıları, son tarihleri, teknolojileri veya diğer bağlamları kaydedin. Notlar bu cihazda kalır ve gelecekteki proje yapay zeka isteklerine dahil edilir.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "Örnek: React + Node.js, son tarih Cuma, mobil uyumlu olmalı…",
  "characters · saved locally": "karakter · yerel olarak kaydedildi",
  "Back to Chat": "Sohbete Geri Dön",
  "messages": "mesajlar",
  "Copied": "Kopyalandı",
  "Copy conversation": "Konuşmayı kopyala",

  // Project Types
  "Website / Web App": "Web Sitesi / Web Uygulaması",
  "School Project": "Okul Projesi",
  "College / University": "Üniversite / Yüksekokul",
  "Software / Desktop App": "Yazılım / Masaüstü Uygulaması",
  "Mobile App": "Mobil Uygulama",
  "Game Project": "Oyun Projesi",
  "Data / Research": "Veri / Araştırma",
  "Presentation / Report": "Sunum / Rapor",
  "Design / Creative": "Tasarım / Yaratıcı",
  "Custom Project": "Özel Proje",
  "Build websites, dashboards, portfolios and full web applications.": "Web siteleri, panoları, portföyler ve tam web uygulamaları oluşturun.",
  "Create school assignments, experiments, reports and presentations.": "Okul ödevleri, deneyler, raporlar ve sunumlar oluşturun.",
  "Work on university assignments, FYPs, research and documentation.": "Üniversite ödevleri, bitirme projeleri, araştırma ve belgelendirme üzerinde çalışın.",
  "Plan software products, desktop tools and utility applications.": "Yazılım ürünleri, masaüstü araçları ve yardımcı uygulamalar planlayın.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Yapay zeka asistanları, makine öğrenimi fikirleri, promptlar ve akıllı ürünler oluşturun.",
  "Create Android, iOS and cross-platform mobile applications.": "Android, iOS ve çapraz platform mobil uygulamalar oluşturun.",
  "Build game concepts, mechanics, stories and development plans.": "Oyun kavramları, mekanikleri, hikayeleri ve geliştirme planları oluşturun.",
  "Analyze data, plan research and prepare technical findings.": "Verileri analiz edin, araştırmaları planlayın ve teknik bulguları hazırlayın.",
  "Create reports, presentations, proposals and structured documents.": "Raporlar, sunumlar, teklifler ve yapılandırılmış belgeler oluşturun.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "UI/UX, marka kimliği, yaratıcı kavramlar ve görsel yön geliştirin.",
  "Start anything else with a completely custom AI workspace.": "Tamamen özel bir yapay zeka çalışma alanıyla başka herhangi bir şeye başlayın.",

  // Create
  "CREATE": "OLUŞTUR",
  "Create something amazing": "Harika bir şey oluşturun",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Bir oluşturma aracı seçin. Her araç, ilgili öneriler ve sohbet ile kendi odaklı ShezoraX Yapay Zeka çalışma alanını açar.",
  "Open workspace →": "Çalışma alanını aç →",
  "← All Create Tools": "← Tüm Oluşturma Araçları",
  "CREATE WORKSPACE": "OLUŞTURMA ÇALIŞMA ALANI",
  "What would you like to create?": "Ne oluşturmak istersiniz?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Kendi isteğinizle başlayın veya bu oluşturma aracı için önerilerden birini seçin.",
  "Listening": "Dinleniyor",
  "SUGGESTIONS": "ÖNERİLER",
  "Try one of these": "Bunlardan birini deneyin",

  // Create Tools
  "Image Create": "Görsel Oluşturma",
  "Video Create": "Video Oluşturma",
  "Photo / Image Editing": "Fotoğraf / Görsel Düzenleme",
  "Resume / CV": "Özgeçmiş / CV",
  "Content Writing": "İçerik Yazımı",
  "Presentation Maker": "Sunum Oluşturucu",
  "Document Creator": "Belge Oluşturucu",
  "Story & Script Writer": "Hikaye ve Senaryo Yazarı",
  "Social Media Creator": "Sosyal Medya İçerik Üreticisi",
  "Logo & Branding": "Logo ve Markalama",
  "Music & Audio": "Müzik ve Ses",
  "UI / Visual Design": "UI / Görsel Tasarım",
  "Diagram & Infographic": "Diyagram ve İnfografik",
  "Email & Message Writer": "E-posta ve Mesaj Yazarı",
  "Study Notes & Flashcards": "Ders Notları ve Flashkartlar",
  "Research & Report Writer": "Araştırma ve Rapor Yazarı",
  "Document Converter": "Belge Dönüştürücü",
  "Template Creator": "Şablon Oluşturucu",
  "AI Project": "Yapay Zeka Projesi",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Yapay zeka ile görseller, kavramlar, sahneler, portreler ve görsel fikirler oluşturun.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Video kavramlarını, sahneleri, senaryoları ve görsel yönergeleri planlayın ve oluşturun.",
  "Improve, transform, retouch and creatively edit images.": "Görselleri iyileştirin, dönüştürün, rötuşlayın ve yaratıcı bir şekilde düzenleyin.",
  "Create professional resumes, CVs, cover letters and career documents.": "Profesyonel özgeçmişler, CV'ler, ön yazılar ve kariyer belgeleri oluşturun.",
  "Write articles, blogs, descriptions, captions and professional content.": "Makaleler, bloglar, açıklamalar, başlıklar ve profesyonel içerikler yazın.",
  "Create slide structures, presentation content and speaker notes.": "Slayt yapıları, sunum içeriği ve konuşmacı notları oluşturun.",
  "Create professional documents, proposals, letters and structured files.": "Profesyonel belgeler, teklifler, mektuplar ve yapılandırılmış dosyalar oluşturun.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Hikayeler, senaryolar, scriptler, karakterler ve kurgusal dünyalar oluşturun.",
  "Create captions, posts, content ideas and social media campaigns.": "Başlıklar, paylaşımlar, içerik fikirleri ve sosyal medya kampanyaları oluşturun.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Marka kimlikleri, logo kavramları, isimler, renkler ve görsel yön geliştirin.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Müzik kavramları, şarkı sözleri, ses fikirleri, ses scriptleri ve ses yönetimi oluşturun.",
  "Create interface concepts, visual systems, layouts and design directions.": "Arayüz kavramları, görsel sistemler, düzenler ve tasarım yönergeleri oluşturun.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Diyagramlar, akış şemaları, infografikler ve görsel açıklamalar oluşturun.",
  "Write professional emails, messages, replies, invitations and announcements.": "Profesyonel e-postalar, mesajlar, yanıtlar, davetiyeler ve duyurular yazın.",
  "Create general study notes, flashcards, quizzes and revision material.": "Genel ders notları, flashkartlar, sınavlar ve tekrar materyalleri oluşturun.",
  "Create general reports, structured research writing and analytical documents.": "Genel raporlar, yapılandırılmış araştırma yazıları ve analitik belgeler oluşturun.",
  "Plan document transformations, formatting changes and content conversions.": "Belge dönüşümlerini, biçimlendirme değişikliklerini ve içerik dönüştürmelerini planlayın.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Belgeler, paylaşımlar, e-postalar, planlama ve daha fazlası için yeniden kullanılabilir şablonlar oluşturun.",

  // Create Tool Suggestions
  "Create a cinematic space scene": "Sinematik bir uzay sahnesi oluşturun",
  "Create a professional profile image": "Profesyonel bir profil görseli oluşturun",
  "Create a futuristic city concept": "Fütüristik bir şehir kavramı oluşturun",
  "Create a realistic product image": "Gerçekçi bir ürün görseli oluşturun",
  "Create a cinematic video concept": "Sinematik bir video kavramı oluşturun",
  "Create a short promotional video": "Kısa bir tanıtım videosu oluşturun",
  "Create a futuristic story video": "Fütüristik bir hikaye videosu oluşturun",
  "Create a social media video idea": "Bir sosyal medya videosu fikri oluşturun",
  "Improve this image professionally": "Bu görseli profesyonel olarak iyileştirin",
  "Remove unwanted objects": "İstenmeyen nesneleri kaldırın",
  "Create a cinematic color grade": "Sinematik bir renk düzeni oluşturun",
  "Turn this image into a different style": "Bu görseli farklı bir stile dönüştürün",
  "Create a modern ATS-friendly CV": "Modern ve ATS uyumlu bir özgeçmiş oluşturun",
  "Improve my professional summary": "Profesyonel özetimi iyileştirin",
  "Write a strong cover letter": "Güçlü bir ön yazı yazın",
  "Improve my work experience section": "İş deneyimi bölümümü iyileştirin",
  "Write a professional blog post": "Profesyonel bir blog yazısı yazın",
  "Create an engaging article": "İlgi çekici bir makale oluşturun",
  "Write a product description": "Bir ürün açıklaması yazın",
  "Create a detailed content outline": "Detaylı bir içerik taslağı oluşturun",
  "Create a professional presentation": "Profesyonel bir sunum oluşturun",
  "Build a 10-slide presentation structure": "10 slaytlık bir sunum yapısı oluşturun",
  "Write speaker notes for my slides": "Slaytlarım için konuşmacı notları yazın",
  "Create a presentation outline": "Bir sunum taslağı oluşturun",
  "Create a professional proposal": "Profesyonel bir teklif oluşturun",
  "Write a formal document": "Resmi bir belge yazın",
  "Create a business document": "Bir iş belgesi oluşturun",
  "Turn my notes into a structured document": "Notlarımı yapılandırılmış bir belgeye dönüştürün",
  "Create a science-fiction story": "Bir bilim kurgu hikayesi oluşturun",
  "Write a short film script": "Bir kısa film senaryosu yazın",
  "Create interesting characters": "İlginç karakterler oluşturun",
  "Build a cinematic story outline": "Sinematik bir hikaye taslağı oluşturun",
  "Create an Instagram content plan": "Bir Instagram içerik planı oluşturun",
  "Write a professional LinkedIn post": "Profesyonel bir LinkedIn paylaşımı yazın",
  "Create 10 social media captions": "10 sosyal medya başlığı oluşturun",
  "Create a one-week content calendar": "Bir haftalık içerik takvimi oluşturun",
  "Create a modern brand identity": "Modern bir marka kimliği oluşturun",
  "Develop a logo concept": "Bir logo kavramı geliştirin",
  "Create a brand color direction": "Bir marka renk yönü oluşturun",
  "Build a complete branding concept": "Eksiksiz bir markalama kavramı oluşturun",
  "Create a cinematic music concept": "Sinematik bir müzik kavramı oluşturun",
  "Write lyrics for a song": "Bir şarkı için söz yazın",
  "Create a podcast intro": "Bir podcast girişi oluşturun",
  "Write a professional voice-over script": "Profesyonel bir seslendirme scripti yazın",
  "Create a modern dashboard design": "Modern bir panel tasarımı oluşturun",
  "Create a mobile app UI concept": "Bir mobil uygulama UI kavramı oluşturun",
  "Design a futuristic landing page": "Fütüristik bir açılış sayfası tasarlayın",
  "Create a visual design system": "Bir görsel tasarım sistemi oluşturun",
  "Create a process flowchart": "Bir süreç akış şeması oluşturun",
  "Create an educational infographic": "Eğitici bir infografik oluşturun",
  "Explain this topic with a diagram": "Bu konuyu bir diyagramla açıklayın",
  "Create a professional system diagram": "Profesyonel bir sistem diyagramı oluşturun",
  "Write a professional email": "Profesyonel bir e-posta yazın",
  "Write a polite reply": "Kibar bir yanıt yazın",
  "Create a formal request": "Resmi bir istek oluşturun",
  "Write a professional announcement": "Profesyonel bir duyuru yazın",
  "Create revision notes": "Tekrar notları oluşturun",
  "Create flashcards": "Flashkartlar oluşturun",
  "Create a practice quiz": "Bir alıştırma sınavı oluşturun",
  "Turn these notes into questions": "Bu notları sorulara dönüştürün",
  "Create a structured report": "Yapılandırılmış bir rapor oluşturun",
  "Turn my information into a research-style document": "Bilgilerimi araştırma tarzı bir belgeye dönüştürün",
  "Create an executive summary": "Bir yönetici özeti oluşturun",
  "Organize this information into sections": "Bu bilgileri bölümlere ayırın",
  "Convert this content into a professional format": "Bu içeriği profesyonel bir formata dönüştürün",
  "Turn notes into a formal document": "Notları resmi bir belgeye dönüştürün",
  "Convert this text into a structured outline": "Bu metni yapılandırılmış bir taslağa dönüştürün",
  "Reformat this document professionally": "Bu belgeyi profesyonel olarak yeniden biçimlendirin",
  "Create a professional email template": "Profesyonel bir e-posta şablonu oluşturun",
  "Create a social media template": "Bir sosyal medya şablonu oluşturun",
  "Create a professional document template": "Profesyonel bir belge şablonu oluşturun",
  "Create a reusable planning template": "Yeniden kullanılabilir bir planlama şablonu oluşturun",

  // Knowledge
  "Universe & Space": "Evren ve Uzay",
  "Earth": "Dünya",
  "Science": "Bilim",
  "Technology": "Teknoloji",
  "Programming": "Programlama",
  "History": "Tarih",
  "Mathematics": "Matematik",
  "Physics": "Fizik",
  "KNOWLEDGE": "BİLGİ",
  "Knowledge Universe": "Bilgi Evreni",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Bir konu seçin ve ShezoraX odaklı bir soruyla yapay zeka sohbetini açacaktır.",

  // Settings
  "SETTINGS": "AYARLAR",
  "Manage your ShezoraX preferences, account and personal experience.": "ShezoraX tercihlerinizi, hesabınızı ve kişisel deneyiminizi yönetin.",
  "GENERAL": "GENEL",
  "Language, voice and general preferences": "Dil, ses ve genel tercihler",
  "AI voice replies": "Yapay zeka sesli yanıtları",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX, tarayıcı konuşma sentezi kullanılabilir olduğunda genel yapay zeka yanıtlarını seslendirir.",
  "ON": "AÇIK",
  "OFF": "KAPALI",
  "Project voice replies": "Proje sesli yanıtları",
  "Automatically speak responses inside project workspaces.": "Proje çalışma alanlarında yanıtları otomatik olarak seslendirin.",
  "Test Voice": "Sesi Test Et",
  "Test Microphone": "Mikrofonu Test Et",
  "CREATOR": "İÇERİK ÜRETİCİSİ",
  "Connect & Follow": "Bağlanın ve Takip Edin",
  "Stay updated with my latest work and projects.": "En son çalışmalarım ve projelerimden haberdar olun.",
  "GitHub": "GitHub",
  "Explore my projects": "Projelerimi keşfedin",
  "Facebook": "Facebook",
  "Connect with me": "Benimle bağlanın",
  "Instagram": "Instagram",
  "Follow my journey": "Yolculuğumu takip edin",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Profesyonel olarak bağlanın",
  "X": "X",
  "Follow for updates": "Güncellemeler için takip edin",
  "Portfolio": "Portföy",
  "View my work": "Çalışmalarımı görüntüleyin",
  "PROFILE": "PROFİL",
  "Manage your ShezoraX account and personal data.": "ShezoraX hesabınızı ve kişisel verilerinizi yönetin.",
  "Your name": "Adınız",
  "How ShezoraX should greet you": "ShezoraX size nasıl hitap etmeli",
  "Enter your name": "Adınızı girin",
  "Google email": "Google e-postası",
  "Connected account": "Bağlı hesap",
  "Log out of all devices": "Tüm cihazlardan çıkış yap",
  "End active ShezoraX sessions on other devices.": "Diğer cihazlardaki aktif ShezoraX oturumlarını sonlandırın.",
  "Delete all chats": "Tüm sohbetleri sil",
  "Remove your ShezoraX conversations and project chat memory from this device.": "ShezoraX konuşmalarınızı ve proje sohbet hafızasını bu cihazdan kaldırın.",
  "Delete account": "Hesabı sil",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Hesap kimlik doğrulaması bağlandığında ShezoraX hesabınızı kalıcı olarak silin.",
  "GOOGLE ACCOUNT": "GOOGLE HESABI",
  "Connect your Google account to use account authentication with ShezoraX.": "ShezoraX ile hesap kimlik doğrulaması kullanmak için Google hesabınızı bağlayın.",
  "Google": "Google",
  "Google connection is ready.": "Google bağlantısı hazır.",
  "Connect your Google account to ShezoraX.": "Google hesabınızı ShezoraX'e bağlayın.",
  "Real Google OAuth requires configured authentication credentials.": "Gerçek Google OAuth, yapılandırılmış kimlik doğrulama bilgileri gerektirir.",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "ShezoraX ile Apple hesabı kimlik doğrulaması kullanmak için Apple ID'nizi bağlayın.",
  "Apple ID connection is ready.": "Apple ID bağlantısı hazır.",
  "Connect your Apple ID to ShezoraX.": "Apple ID'nizi ShezoraX'e bağlayın.",
  "Real Apple Sign In requires configured authentication credentials.": "Gerçek Apple Sign In, yapılandırılmış kimlik doğrulama bilgileri gerektirir.",
  "RELIGION & FAITH": "DİN VE İNANÇ",
  "Manage the religious and faith-related preferences used by ShezoraX.": "ShezoraX tarafından kullanılan dini ve inançla ilgili tercihleri yönetin.",
  "Faith preferences": "İnanç tercihleri",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Bu alan dini bilginiz, dua ve inançla ilgili tercihleriniz için ayrılmıştır.",
  "Religious knowledge": "Dini bilgi",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX, dini konuları genel uygulama tercihlerinden ayrı tutabilir.",
  "Religion": "Din",
  "Islam": "İslam",
  "Christianity": "Hristiyanlık",
  "Judaism": "Yahudilik",
  "Hinduism": "Hinduizm",
  "Buddhism": "Budizm",
  "Sikhism": "Sihizm",
  "Jainism": "Jainizm",
  "Baháʼí Faith": "Baháʼí İnançı",
  "Taoism": "Taoizm",
  "Confucianism": "Konfüçyüsçülük",
  "Shinto": "Şintoizm",
  "Zoroastrianism": "Zerdüştlük",
  "Other / Spiritual": "Diğer / Manevi",
  "No preference": "Tercih yok",

  // Voices
  "ShezoraX female AI voice": "ShezoraX kadın yapay zeka sesi",
  "ShezoraX male AI voice": "ShezoraX erkek yapay zeka sesi",
  "Connect with Creator": "İçerik Üreticisiyle Bağlanın",
  "Follow the creator behind ShezoraX": "ShezoraX'in arkasındaki içerik üreticisini takip edin",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "Tüm ShezoraX sohbetlerini silmek istediğinizden emin misiniz?",
  "All chats have been deleted.": "Tüm sohbetler silindi.",
  "Are you sure you want to delete your ShezoraX account?": "ShezoraX hesabınızı silmek istediğinizden emin misiniz?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "Hesap silme işlemi gerçek bir kimlik doğrulama arka ucu gerektirir. Yerel proje verileriniz ayrı olarak kaldırılabilir.",
  "Log out of all devices requires a real authentication/session backend.": "Tüm cihazlardan çıkış yapmak gerçek bir kimlik doğrulama/oturum arka ucu gerektirir.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Google hesabı bağlantı arayüzü hazır. Canlı kimlik doğrulama için gerçek Google OAuth kimlik bilgileri gereklidir.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Apple ID bağlantı arayüzü hazır. Canlı kimlik doğrulama için gerçek Apple Sign In kimlik bilgileri gereklidir.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "Ses tanıma bu tarayıcıda desteklenmiyor. Google Chrome veya Microsoft Edge deneyin.",
  "I received your message, but no response was returned.": "Mesajınızı aldım, ancak herhangi bir yanıt dönmedi.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Şu anda yapay zeka hizmetine bağlanamıyorum. Lütfen ShezoraX arka ucunun çalıştığını kontrol edin.",
  "I received your project request, but no response was returned.": "Proje isteğinizi aldım, ancak herhangi bir yanıt dönmedi.",
  "I received your creation request, but no response was returned.": "Oluşturma isteğinizi aldım, ancak herhangi bir yanıt dönmedi.",
"Full-Stack Developer & AI Engineer — the mind behind": "Full-Stack Geliştirici ve AI Mühendisi — arkasındaki zeka",
"Connect a provider to add account authentication to ShezoraX.": "ShezoraX'a hesap kimlik doğrulaması eklemek için bir sağlayıcı bağlayın.",

  },

Russian: {
  // Navigation
  "Home": "Главная",
  "AI Chat": "ИИ Чат",
  "Create": "Создать",
  "Projects": "Проекты",
  "Knowledge": "Знания",
  "Settings": "Настройки",
  "AI System": "Система ИИ",
  "Online": "В сети",
  "Account": "Аккаунт",
  "Search": "Поиск",
  "General": "Общие",
  "Profile": "Профиль",
  "Google Account": "Аккаунт Google",
  "Apple ID": "Apple ID",
  "Religion & Faith": "Религия и Вера",
  "Language": "Язык",
  "Voice": "Голос",

  // Long keys
  "Choose the language used throughout the ShezoraX interface.": "Выберите язык, используемый во всём интерфейсе ShezoraX.",
  "Control the language and voice experience of ShezoraX.": "Управляйте языком и голосовым опытом ShezoraX.",
  "Choose the AI voice ShezoraX uses for spoken responses.": "Выберите голос ИИ, который ShezoraX использует для голосовых ответов.",

  // Status
  "Connected": "Подключено",
  "Ready": "Готово",
  "Continue with Google": "Продолжить с Google",
  "Continue with Apple ID": "Продолжить с Apple ID",
  "Continue with Apple": "Продолжить с Apple",
  "Good Morning": "Доброе утро",
  "Good Afternoon": "Добрый день",
  "Good Evening": "Добрый вечер",
  "Good Night": "Спокойной ночи",
  "Send": "Отправить",
  "Clear": "Очистить",
  "Cancel": "Отмена",
  "Save": "Сохранить",
  "Delete": "Удалить",
  "Close": "Закрыть",
  "Back": "Назад",
  "Open": "Открыть",
  "AI System Online": "Система ИИ в сети",
  "Female": "Женский",
  "Male": "Мужской",

  // Hero
  "ShezoraX AI Online": "ShezoraX ИИ в сети",
  "Your intelligent personal AI workspace for learning, creating, exploring and getting things done.": "Ваше интеллектуальное персональное рабочее пространство ИИ для обучения, создания, исследования и выполнения задач.",
  "PERSONAL AI": "ПЕРСОНАЛЬНЫЙ ИИ",
  "What can I help you with?": "Чем могу помочь?",
  "Listening…": "Слушаю…",
  "Speak": "Говорите",
  "READY": "ГОТОВ",
  "Ask ShezoraX anything.": "Спросите ShezoraX что угодно.",
  "You can also use the microphone or one of the quick prompts below.": "Вы также можете использовать микрофон или один из быстрых подсказок ниже.",
  "YOU": "ВЫ",
  "SHEZORAX": "SHEZORAX",
  "Thinking…": "Думаю…",
  "Ask ShezoraX anything…": "Спросите ShezoraX что угодно…",
  "Voice input is available": "Голосовой ввод доступен",
  "Stop mic": "Остановить микрофон",
  "Enter to send · Shift + Enter for a new line": "Enter для отправки · Shift + Enter для новой строки",

  // Suggestions
  "Explain something to me": "Объясните мне что-нибудь",
  "Help me plan my day": "Помогите спланировать мой день",
  "Teach me about the universe": "Расскажите мне о вселенной",
  "Help me build a project": "Помогите создать проект",
  "EXPLORE SHEZORAX": "ИССЛЕДОВАТЬ SHEZORAX",

  // Chat
  "Talk with ShezoraX": "Общайтесь с ShezoraX",
  "Start a conversation with ShezoraX.": "Начните разговор с ShezoraX.",
  "Ask a question, explain a problem, or describe what you want to build.": "Задайте вопрос, объясните проблему или опишите, что вы хотите создать.",
  "Message ShezoraX": "Написать ShezoraX",

  // Projects
  "PROJECTS": "ПРОЕКТЫ",
  "Build something with ShezoraX": "Создайте что-нибудь с ShezoraX",
  "Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.": "Выберите тип проекта. Каждое рабочее пространство имеет свой ИИ чат, голосовой ввод, голосовые ответы, заметки и сохранённые разговоры.",
  "Open project workspace →": "Открыть рабочее пространство проекта →",
  "← All Projects": "← Все проекты",
  "PROJECT WORKSPACE": "РАБОЧЕЕ ПРОСТРАНСТВО ПРОЕКТА",
  "Export": "Экспорт",
  "Project Plan": "План проекта",
  "Notes": "Заметки",
  "Tell ShezoraX what you want to build.": "Скажите ShezoraX, что вы хотите создать.",
  "Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.": "Опишите свою идею, требования, сроки, технологии, инструкции к заданию или любую проблему, которую нужно решить.",
  "Working on your project…": "Работаю над вашим проектом…",
  "Listening… speak now": "Слушаю… говорите",
  "Voice + text supported": "Голос + текст поддерживается",
  "WORKFLOW": "РАБОЧИЙ ПРОЦЕСС",
  "Build your project step by step": "Создавайте проект шаг за шагом",
  "Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.": "Используйте эти этапы для организации проекта. Вы можете попросить ShezoraX выполнить любой этап на вкладке ИИ Чат.",
  "Define": "Определить",
  "Explain the goal, audience and final result.": "Объясните цель, аудиторию и конечный результат.",
  "Plan": "Планировать",
  "Choose features, technology and milestones.": "Выберите функции, технологии и контрольные точки.",
  "Build": "Создавать",
  "Create the code, content or project material.": "Создайте код, контент или материал проекта.",
  "Test": "Тестировать",
  "Review errors, requirements and edge cases.": "Проверьте ошибки, требования и граничные случаи.",
  "Polish": "Доработать",
  "Improve design, quality and presentation.": "Улучшите дизайн, качество и презентацию.",
  "Deliver": "Доставить",
  "Prepare the final files, documentation or presentation.": "Подготовьте итоговые файлы, документацию или презентацию.",
  "Ask ShezoraX →": "Спросить ShezoraX →",
  "PROJECT MEMORY": "ПАМЯТЬ ПРОЕКТА",
  "Project notes": "Заметки проекта",
  "Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.": "Сохраняйте требования, ссылки, сроки, технологии или другой контекст. Заметки остаются на этом устройстве и включаются в будущие запросы ИИ проекта.",
  "Example: React + Node.js, deadline Friday, must be mobile responsive…": "Пример: React + Node.js, срок пятница, должна быть мобильная адаптация…",
  "characters · saved locally": "символов · сохранено локально",
  "Back to Chat": "Вернуться в чат",
  "messages": "сообщения",
  "Copied": "Скопировано",
  "Copy conversation": "Копировать разговор",

  // Project Types
  "Website / Web App": "Веб-сайт / Веб-приложение",
  "School Project": "Школьный проект",
  "College / University": "Колледж / Университет",
  "Software / Desktop App": "Программное обеспечение / Настольное приложение",
  "Mobile App": "Мобильное приложение",
  "Game Project": "Игровой проект",
  "Data / Research": "Данные / Исследование",
  "Presentation / Report": "Презентация / Отчёт",
  "Design / Creative": "Дизайн / Творчество",
  "Custom Project": "Пользовательский проект",
  "Build websites, dashboards, portfolios and full web applications.": "Создавайте веб-сайты, панели инструментов, портфолио и полноценные веб-приложения.",
  "Create school assignments, experiments, reports and presentations.": "Создавайте школьные задания, эксперименты, отчёты и презентации.",
  "Work on university assignments, FYPs, research and documentation.": "Работайте над университетскими заданиями, дипломными проектами, исследованиями и документацией.",
  "Plan software products, desktop tools and utility applications.": "Планируйте программные продукты, настольные инструменты и утилиты.",
  "Build AI assistants, ML ideas, prompts and intelligent products.": "Создавайте ИИ-ассистентов, идеи машинного обучения, промпты и интеллектуальные продукты.",
  "Create Android, iOS and cross-platform mobile applications.": "Создавайте мобильные приложения для Android, iOS и кроссплатформенные приложения.",
  "Build game concepts, mechanics, stories and development plans.": "Создавайте игровые концепции, механики, истории и планы разработки.",
  "Analyze data, plan research and prepare technical findings.": "Анализируйте данные, планируйте исследования и подготавливайте технические результаты.",
  "Create reports, presentations, proposals and structured documents.": "Создавайте отчёты, презентации, предложения и структурированные документы.",
  "Develop UI/UX, branding, creative concepts and visual direction.": "Разрабатывайте UI/UX, брендинг, креативные концепции и визуальное направление.",
  "Start anything else with a completely custom AI workspace.": "Начните что угодно с полностью настраиваемым рабочим пространством ИИ.",

  // Create
  "CREATE": "СОЗДАТЬ",
  "Create something amazing": "Создайте что-то удивительное",
  "Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.": "Выберите инструмент создания. Каждый инструмент открывает своё фокусное рабочее пространство ShezoraX ИИ с релевантными предложениями и чатом.",
  "Open workspace →": "Открыть рабочее пространство →",
  "← All Create Tools": "← Все инструменты создания",
  "CREATE WORKSPACE": "РАБОЧЕЕ ПРОСТРАНСТВО СОЗДАНИЯ",
  "What would you like to create?": "Что бы вы хотели создать?",
  "Start with your own request or choose one of the suggestions for this creation tool.": "Начните с собственного запроса или выберите одно из предложений для этого инструмента создания.",
  "Listening": "Слушаю",
  "SUGGESTIONS": "ПРЕДЛОЖЕНИЯ",
  "Try one of these": "Попробуйте одно из этих",

  // Create Tools
  "Image Create": "Создание изображений",
  "Video Create": "Создание видео",
  "Photo / Image Editing": "Редактирование фото / изображений",
  "Resume / CV": "Резюме / CV",
  "Content Writing": "Написание контента",
  "Presentation Maker": "Создание презентаций",
  "Document Creator": "Создание документов",
  "Story & Script Writer": "Автор историй и сценариев",
  "Social Media Creator": "Создатель контента для соцсетей",
  "Logo & Branding": "Логотип и брендинг",
  "Music & Audio": "Музыка и аудио",
  "UI / Visual Design": "UI / Визуальный дизайн",
  "Diagram & Infographic": "Диаграмма и инфографика",
  "Email & Message Writer": "Автор писем и сообщений",
  "Study Notes & Flashcards": "Учебные заметки и карточки",
  "Research & Report Writer": "Автор исследований и отчётов",
  "Document Converter": "Конвертер документов",
  "Template Creator": "Создатель шаблонов",
  "AI Project": "ИИ Проект",
  "Create images, concepts, scenes, portraits and visual ideas with AI.": "Создавайте изображения, концепции, сцены, портреты и визуальные идеи с помощью ИИ.",
  "Plan and create video concepts, scenes, scripts and visual directions.": "Планируйте и создавайте видео-концепции, сцены, сценарии и визуальные направления.",
  "Improve, transform, retouch and creatively edit images.": "Улучшайте, трансформируйте, ретушируйте и творчески редактируйте изображения.",
  "Create professional resumes, CVs, cover letters and career documents.": "Создавайте профессиональные резюме, CV, сопроводительные письма и карьерные документы.",
  "Write articles, blogs, descriptions, captions and professional content.": "Пишите статьи, блоги, описания, подписи и профессиональный контент.",
  "Create slide structures, presentation content and speaker notes.": "Создавайте структуры слайдов, содержание презентаций и заметки докладчика.",
  "Create professional documents, proposals, letters and structured files.": "Создавайте профессиональные документы, предложения, письма и структурированные файлы.",
  "Create stories, screenplays, scripts, characters and fictional worlds.": "Создавайте истории, сценарии, скрипты, персонажей и вымышленные миры.",
  "Create captions, posts, content ideas and social media campaigns.": "Создавайте подписи, посты, идеи контента и кампании в социальных сетях.",
  "Develop brand identities, logo concepts, names, colors and visual direction.": "Разрабатывайте идентичность бренда, концепции логотипов, названия, цвета и визуальное направление.",
  "Create music concepts, lyrics, sound ideas, voice scripts and audio direction.": "Создавайте музыкальные концепции, тексты песен, звуковые идеи, голосовые сценарии и аудио-направление.",
  "Create interface concepts, visual systems, layouts and design directions.": "Создавайте концепции интерфейсов, визуальные системы, макеты и направления дизайна.",
  "Create diagrams, flowcharts, infographics and visual explanations.": "Создавайте диаграммы, блок-схемы, инфографику и визуальные объяснения.",
  "Write professional emails, messages, replies, invitations and announcements.": "Пишите профессиональные письма, сообщения, ответы, приглашения и объявления.",
  "Create general study notes, flashcards, quizzes and revision material.": "Создавайте общие учебные заметки, карточки, тесты и материал для повторения.",
  "Create general reports, structured research writing and analytical documents.": "Создавайте общие отчёты, структурированные исследовательские работы и аналитические документы.",
  "Plan document transformations, formatting changes and content conversions.": "Планируйте трансформации документов, изменения форматирования и конвертацию контента.",
  "Create reusable templates for documents, posts, emails, planning and more.": "Создавайте многоразовые шаблоны для документов, постов, писем, планирования и многого другого.",

  // Create Tool Suggestions
  "Create a cinematic space scene": "Создайте кинематографическую космическую сцену",
  "Create a professional profile image": "Создайте профессиональное изображение профиля",
  "Create a futuristic city concept": "Создайте концепт футуристического города",
  "Create a realistic product image": "Создайте реалистичное изображение продукта",
  "Create a cinematic video concept": "Создайте кинематографическую видео-концепцию",
  "Create a short promotional video": "Создайте короткий рекламный ролик",
  "Create a futuristic story video": "Создайте видео с футуристической историей",
  "Create a social media video idea": "Создайте идею видео для социальных сетей",
  "Improve this image professionally": "Профессионально улучшите это изображение",
  "Remove unwanted objects": "Удалите нежелательные объекты",
  "Create a cinematic color grade": "Создайте кинематографическую цветокоррекцию",
  "Turn this image into a different style": "Преобразуйте это изображение в другой стиль",
  "Create a modern ATS-friendly CV": "Создайте современное резюме, совместимое с ATS",
  "Improve my professional summary": "Улучшите моё профессиональное резюме",
  "Write a strong cover letter": "Напишите сильное сопроводительное письмо",
  "Improve my work experience section": "Улучшите мой раздел опыта работы",
  "Write a professional blog post": "Напишите профессиональную статью в блог",
  "Create an engaging article": "Создайте увлекательную статью",
  "Write a product description": "Напишите описание продукта",
  "Create a detailed content outline": "Создайте подробный план контента",
  "Create a professional presentation": "Создайте профессиональную презентацию",
  "Build a 10-slide presentation structure": "Создайте структуру презентации из 10 слайдов",
  "Write speaker notes for my slides": "Напишите заметки докладчика для моих слайдов",
  "Create a presentation outline": "Создайте план презентации",
  "Create a professional proposal": "Создайте профессиональное предложение",
  "Write a formal document": "Напишите официальный документ",
  "Create a business document": "Создайте деловой документ",
  "Turn my notes into a structured document": "Преобразуйте мои заметки в структурированный документ",
  "Create a science-fiction story": "Создайте научно-фантастическую историю",
  "Write a short film script": "Напишите сценарий короткометражного фильма",
  "Create interesting characters": "Создайте интересных персонажей",
  "Build a cinematic story outline": "Создайте кинематографический план истории",
  "Create an Instagram content plan": "Создайте контент-план для Instagram",
  "Write a professional LinkedIn post": "Напишите профессиональный пост для LinkedIn",
  "Create 10 social media captions": "Создайте 10 подписей для социальных сетей",
  "Create a one-week content calendar": "Создайте контент-календарь на одну неделю",
  "Create a modern brand identity": "Создайте современную идентичность бренда",
  "Develop a logo concept": "Разработайте концепцию логотипа",
  "Create a brand color direction": "Создайте цветовое направление бренда",
  "Build a complete branding concept": "Создайте полную концепцию брендинга",
  "Create a cinematic music concept": "Создайте кинематографическую музыкальную концепцию",
  "Write lyrics for a song": "Напишите текст песни",
  "Create a podcast intro": "Создайте вступление для подкаста",
  "Write a professional voice-over script": "Напишите профессиональный сценарий для озвучки",
  "Create a modern dashboard design": "Создайте современный дизайн панели управления",
  "Create a mobile app UI concept": "Создайте концепцию UI мобильного приложения",
  "Design a futuristic landing page": "Спроектируйте футуристическую лендинг-страницу",
  "Create a visual design system": "Создайте систему визуального дизайна",
  "Create a process flowchart": "Создайте блок-схему процесса",
  "Create an educational infographic": "Создайте образовательную инфографику",
  "Explain this topic with a diagram": "Объясните эту тему с помощью диаграммы",
  "Create a professional system diagram": "Создайте профессиональную диаграмму системы",
  "Write a professional email": "Напишите профессиональное письмо",
  "Write a polite reply": "Напишите вежливый ответ",
  "Create a formal request": "Создайте официальный запрос",
  "Write a professional announcement": "Напишите профессиональное объявление",
  "Create revision notes": "Создайте заметки для повторения",
  "Create flashcards": "Создайте карточки для запоминания",
  "Create a practice quiz": "Создайте практический тест",
  "Turn these notes into questions": "Преобразуйте эти заметки в вопросы",
  "Create a structured report": "Создайте структурированный отчёт",
  "Turn my information into a research-style document": "Преобразуйте мою информацию в документ в стиле исследования",
  "Create an executive summary": "Создайте краткое резюме для руководства",
  "Organize this information into sections": "Организуйте эту информацию в разделы",
  "Convert this content into a professional format": "Преобразуйте этот контент в профессиональный формат",
  "Turn notes into a formal document": "Преобразуйте заметки в официальный документ",
  "Convert this text into a structured outline": "Преобразуйте этот текст в структурированный план",
  "Reformat this document professionally": "Профессионально переформатируйте этот документ",
  "Create a professional email template": "Создайте профессиональный шаблон письма",
  "Create a social media template": "Создайте шаблон для социальных сетей",
  "Create a professional document template": "Создайте профессиональный шаблон документа",
  "Create a reusable planning template": "Создайте многоразовый шаблон планирования",

  // Knowledge
  "Universe & Space": "Вселенная и Космос",
  "Earth": "Земля",
  "Science": "Наука",
  "Technology": "Технологии",
  "Programming": "Программирование",
  "History": "История",
  "Mathematics": "Математика",
  "Physics": "Физика",
  "KNOWLEDGE": "ЗНАНИЯ",
  "Knowledge Universe": "Вселенная Знаний",
  "Pick a topic and ShezoraX will open the AI chat with a focused question.": "Выберите тему, и ShezoraX откроет ИИ чат с конкретным вопросом.",

  // Settings
  "SETTINGS": "НАСТРОЙКИ",
  "Manage your ShezoraX preferences, account and personal experience.": "Управляйте своими предпочтениями, аккаунтом и персональным опытом ShezoraX.",
  "GENERAL": "ОБЩИЕ",
  "Language, voice and general preferences": "Язык, голос и общие предпочтения",
  "AI voice replies": "Голосовые ответы ИИ",
  "ShezoraX speaks general AI responses when browser speech synthesis is available.": "ShezoraX озвучивает общие ответы ИИ, когда доступен синтез речи браузера.",
  "ON": "ВКЛ",
  "OFF": "ВЫКЛ",
  "Project voice replies": "Голосовые ответы проекта",
  "Automatically speak responses inside project workspaces.": "Автоматически озвучивать ответы в рабочих пространствах проектов.",
  "Test Voice": "Тест голоса",
  "Test Microphone": "Тест микрофона",
  "CREATOR": "СОЗДАТЕЛЬ",
  "Connect & Follow": "Подключайтесь и Следите",
  "Stay updated with my latest work and projects.": "Будьте в курсе моих последних работ и проектов.",
  "GitHub": "GitHub",
  "Explore my projects": "Изучите мои проекты",
  "Facebook": "Facebook",
  "Connect with me": "Свяжитесь со мной",
  "Instagram": "Instagram",
  "Follow my journey": "Следите за моим путём",
  "LinkedIn": "LinkedIn",
  "Connect professionally": "Профессиональное подключение",
  "X": "X",
  "Follow for updates": "Следите за обновлениями",
  "Portfolio": "Портфолио",
  "View my work": "Посмотрите мои работы",
  "PROFILE": "ПРОФИЛЬ",
  "Manage your ShezoraX account and personal data.": "Управляйте своим аккаунтом и персональными данными ShezoraX.",
  "Your name": "Ваше имя",
  "How ShezoraX should greet you": "Как ShezoraX должен вас приветствовать",
  "Enter your name": "Введите ваше имя",
  "Google email": "Email Google",
  "Connected account": "Подключённый аккаунт",
  "Log out of all devices": "Выйти из всех устройств",
  "End active ShezoraX sessions on other devices.": "Завершить активные сеансы ShezoraX на других устройствах.",
  "Delete all chats": "Удалить все чаты",
  "Remove your ShezoraX conversations and project chat memory from this device.": "Удалить ваши разговоры ShezoraX и память чатов проекта с этого устройства.",
  "Delete account": "Удалить аккаунт",
  "Permanently delete your ShezoraX account when account authentication is connected.": "Безвозвратно удалить ваш аккаунт ShezoraX, когда подключена аутентификация аккаунта.",
  "GOOGLE ACCOUNT": "АККАУНТ GOOGLE",
  "Connect your Google account to use account authentication with ShezoraX.": "Подключите ваш аккаунт Google для использования аутентификации с ShezoraX.",
  "Google": "Google",
  "Google connection is ready.": "Подключение Google готово.",
  "Connect your Google account to ShezoraX.": "Подключите ваш аккаунт Google к ShezoraX.",
  "Real Google OAuth requires configured authentication credentials.": "Для реального Google OAuth требуются настроенные учётные данные аутентификации.",
  "APPLE ID": "APPLE ID",
  "Connect your Apple ID to use Apple account authentication with ShezoraX.": "Подключите ваш Apple ID для использования аутентификации Apple с ShezoraX.",
  "Apple ID connection is ready.": "Подключение Apple ID готово.",
  "Connect your Apple ID to ShezoraX.": "Подключите ваш Apple ID к ShezoraX.",
  "Real Apple Sign In requires configured authentication credentials.": "Для реального Apple Sign In требуются настроенные учётные данные аутентификации.",
  "RELIGION & FAITH": "РЕЛИГИЯ И ВЕРА",
  "Manage the religious and faith-related preferences used by ShezoraX.": "Управляйте религиозными предпочтениями и предпочтениями веры, используемыми ShezoraX.",
  "Faith preferences": "Предпочтения веры",
  "This area is reserved for your religious knowledge, prayer and faith-related preferences.": "Эта область предназначена для ваших религиозных знаний, молитв и предпочтений, связанных с верой.",
  "Religious knowledge": "Религиозные знания",
  "ShezoraX can keep religious topics separate from general application preferences.": "ShezoraX может отделять религиозные темы от общих предпочтений приложения.",
  "Religion": "Религия",
  "Islam": "Ислам",
  "Christianity": "Христианство",
  "Judaism": "Иудаизм",
  "Hinduism": "Индуизм",
  "Buddhism": "Буддизм",
  "Sikhism": "Сикхизм",
  "Jainism": "Джайнизм",
  "Baháʼí Faith": "Вера Бахаи",
  "Taoism": "Даосизм",
  "Confucianism": "Конфуцианство",
  "Shinto": "Синтоизм",
  "Zoroastrianism": "Зороастризм",
  "Other / Spiritual": "Другое / Духовное",
  "No preference": "Без предпочтений",

  // Voices
  "ShezoraX female AI voice": "Женский голос ИИ ShezoraX",
  "ShezoraX male AI voice": "Мужской голос ИИ ShezoraX",
  "Connect with Creator": "Связаться с Создателем",
  "Follow the creator behind ShezoraX": "Следите за создателем ShezoraX",

  // Alerts
  "Are you sure you want to delete all ShezoraX chats?": "Вы уверены, что хотите удалить все чаты ShezoraX?",
  "All chats have been deleted.": "Все чаты были удалены.",
  "Are you sure you want to delete your ShezoraX account?": "Вы уверены, что хотите удалить свой аккаунт ShezoraX?",
  "Account deletion requires a real authentication backend. Your local project data can be removed separately.": "Удаление аккаунта требует реального бэкенда аутентификации. Ваши локальные данные проекта могут быть удалены отдельно.",
  "Log out of all devices requires a real authentication/session backend.": "Выход из всех устройств требует реального бэкенда аутентификации/сессий.",
  "Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.": "Интерфейс подключения аккаунта Google готов. Для живой аутентификации требуются реальные учётные данные Google OAuth.",
  "Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.": "Интерфейс подключения Apple ID готов. Для живой аутентификации требуются реальные учётные данные Apple Sign In.",
  "Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.": "Голосовое распознавание не поддерживается в этом браузере. Попробуйте Google Chrome или Microsoft Edge.",
  "I received your message, but no response was returned.": "Я получил ваше сообщение, но ответ не был возвращён.",
  "I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running.": "Я не могу подключиться к сервису ИИ прямо сейчас. Пожалуйста, проверьте, что бэкенд ShezoraX запущен.",
  "I received your project request, but no response was returned.": "Я получил ваш запрос проекта, но ответ не был возвращён.",
  "I received your creation request, but no response was returned.": "Я получил ваш запрос на создание, но ответ не был возвращён.",
"Full-Stack Developer & AI Engineer — the mind behind": "Full-Stack разработчик и AI-инженер — разум, стоящий за",
"Connect a provider to add account authentication to ShezoraX.": "Подключите провайдера, чтобы добавить аутентификацию учётной записи в ShezoraX.",

  },

};

const translateUI = (language, key) => {
  return (
    UI_TRANSLATIONS[language]?.[key] ??
    UI_TRANSLATIONS.English?.[key] ??
    key
  );
};

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
    icon: "google",
    title: "Google Account",
    description: "Manage your Google connection",
  },
  {
    id: "Apple ID",
    icon: "apple",
    title: "Apple ID",
    description: "Manage your Apple account connection",
  },
  {
    id: "Religion & Faith",
    icon: "☯",
    title: "Religion & Faith",
    description: "Manage faith and religious preferences",
  },
  {
    id: "Creator",
    icon: "✦",
    title: "Connect with Creator",
    description: "Follow the creator behind ShezoraX",
  },
];

function App() {
  const t = (key) =>
  translateUI(selectedLanguage, key);

  const [activePage, setActivePage] = useState("Home");
  const [userName, setUserName] = useState(() => {
    try {
      const savedName = localStorage.getItem("shezorax-user-name");
      return savedName || "User";
    } catch {
      return "User";
    }
  });
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCreateTool, setSelectedCreateTool] = useState(null);
  const [projectDraft, setProjectDraft] = useState("");
  const [projectMessages, setProjectMessages] = useState({});
  
  const [createDraft, setCreateDraft] = useState("");
  const [createMessages, setCreateMessages] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createListening, setCreateListening] = useState(false);

const openCreateTool = (toolId) => {
  setSelectedCreateTool(toolId);
  setActivePage("Create");
  setCreateDraft("");
  setAccountOpen(false);
};

const closeCreateTool = () => {
  setSelectedCreateTool(null);
  setCreateDraft("");
};

const clearCreateChat = () => {
  if (!selectedCreateTool) {
    return;
  }

  const tool = getCreateTool(selectedCreateTool);

  if (
    !window.confirm(
      `${t("Clear")} ${t(tool.title)}?`
    )
  ) {
    return;
  }

  setCreateMessages((previous) => {
    const next = { ...previous };
    delete next[selectedCreateTool];
    return next;
  });

  stopSpeaking();
};

  const [projectLoading, setProjectLoading] = useState(false);
  const [projectListening, setProjectListening] = useState(false);
  const [projectTab, setProjectTab] = useState("chat");
  const [projectNotes, setProjectNotes] = useState({});
  const [projectCopied, setProjectCopied] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [autoSpeakProject, setAutoSpeakProject] = useState(true);

  const [settingsSection, setSettingsSection] = useState("General");
  const settingsContentRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
  try {
    const savedLanguage = localStorage.getItem(
      "shezorax-language"
    );

    return SETTINGS_LANGUAGES.includes(savedLanguage)
      ? savedLanguage
      : "English";
  } catch {
    return "English";
  }
});

useEffect(() => {
  try {
    localStorage.setItem(
      "shezorax-language",
      selectedLanguage
    );

    document.documentElement.lang =
      LANGUAGE_LOCALES[selectedLanguage] || "en-US";

    document.documentElement.dir =
      selectedLanguage === "Arabic" ||
      selectedLanguage === "Urdu"
        ? "rtl"
        : "ltr";
  } catch (error) {
    console.warn(
      "ShezoraX language preference could not be saved.",
      error
    );
  }
}, [selectedLanguage]);

useEffect(() => {
  try {
    localStorage.setItem("shezorax-user-name", userName);
  } catch (error) {
    console.warn("ShezoraX user name could not be saved.", error);
  }
}, [userName]);

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activePage, selectedProject, selectedCreateTool]);

  useEffect(() => {
    if (
      activePage !== "Settings" ||
      !window.matchMedia("(max-width: 850px)").matches
    ) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      settingsContentRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [settingsSection]);

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

recognition.lang =
  LANGUAGE_LOCALES[selectedLanguage] || "en-US";
recognition.continuous = false;
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onstart = () => {
  if (voiceTargetRef.current === "project") {
    setProjectListening(true);
  } else if (voiceTargetRef.current === "create") {
    setCreateListening(true);
  } else {
    setIsListening(true);
  }
};

recognition.onend = () => {
  setIsListening(false);
  setProjectListening(false);
  setCreateListening(false);
};

recognition.onerror = (event) => {
  console.warn(
    "ShezoraX voice recognition error:",
    event?.error
  );

  setIsListening(false);
  setProjectListening(false);
  setCreateListening(false);
};

recognition.onresult = (event) => {
  const transcript =
    event?.results?.[0]?.[0]?.transcript?.trim() || "";

  if (!transcript) return;

  if (voiceTargetRef.current === "project") {
    setProjectDraft((previous) =>
      previous ? `${previous} ${transcript}` : transcript
    );
  } else if (voiceTargetRef.current === "create") {
    setCreateDraft((previous) =>
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
}, [selectedLanguage]);

  /* =========================================================
     VOICE OUTPUT
     ========================================================= */

  /* =========================================================
     CREATE MESSAGES PERSISTENCE
     ========================================================= */
  useEffect(() => {
    try {
      const savedCreateMessages = localStorage.getItem(
        "shezorax-create-messages"
      );
      if (savedCreateMessages) {
        setCreateMessages(JSON.parse(savedCreateMessages));
      }
    } catch (error) {
      console.warn("ShezoraX create memory could not be restored.", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "shezorax-create-messages",
        JSON.stringify(createMessages)
      );
    } catch (error) {
      console.warn("Create messages could not be saved.", error);
    }
  }, [createMessages]);

  const speakText = (text, force = false) => {
    if (!("speechSynthesis" in window) || !text) {
      return;
    }

    if (!force && !voiceReplies) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const targetLang = LANGUAGE_LOCALES[selectedLanguage] || "en-US";
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();

    const preferredVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      const langMatches = voice.lang.startsWith(targetLang.split("-")[0]);

      if (selectedVoice === "Zeenora") {
        return (
          langMatches &&
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
        langMatches &&
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
      t("Are you sure you want to delete all ShezoraX chats?")
    );

    if (!confirmed) return;

    setMessages([]);
    setProjectMessages({});
    setProjectNotes({});
    setCreateMessages({});

    localStorage.removeItem("shezorax-project-messages");
    localStorage.removeItem("shezorax-project-notes");
    localStorage.removeItem("shezorax-create-messages");

    alert(t("All chats have been deleted."));
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      t("Are you sure you want to delete your ShezoraX account?")
    );

    if (!confirmed) return;

    alert(
      t("Account deletion requires a real authentication backend. Your local project data can be removed separately.")
    );
  };

  const handleLogoutAllDevices = () => {
    alert(
      t("Log out of all devices requires a real authentication/session backend.")
    );
  };

  const handleGoogleConnect = () => {
    setGoogleConnected(true);

    alert(
      t("Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.")
    );
  };

  const handleAppleConnect = () => {
    setAppleConnected(true);

    alert(
      t("Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.")
    );
  };

  const startListening = (target = "general") => {
    if (!recognitionRef.current) {
      alert(
        t("Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.")
      );
      return;
    }

    const currentlyListening =
  target === "project"
    ? projectListening
    : target === "create"
      ? createListening
      : isListening;

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
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI response failed");
      }

      const reply =
        data.reply ||
        t("I received your message, but no response was returned.");

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
            t("I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running."),
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
        t("I received your project request, but no response was returned.");

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
              t("I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running."),
          },
        ],
      }));
    } finally {
      setProjectLoading(false);
    }
  };

  /* =========================================================
     CREATE AI CHAT
     Every Create tool has its own isolated AI context.
     ========================================================= */
  const sendCreateMessage = async (customMessage) => {
    if (!selectedCreateTool || createLoading) {
      return;
    }

    const text =
      typeof customMessage === "string"
        ? customMessage.trim()
        : createDraft.trim();

    if (!text) {
      return;
    }

    const tool = getCreateTool(selectedCreateTool);
    const existing = createMessages[selectedCreateTool] || [];

    const userItem = {
      role: "user",
      text,
    };

    setCreateMessages((previous) => ({
      ...previous,
      [selectedCreateTool]: [...existing, userItem],
    }));

    setCreateDraft("");
    setCreateLoading(true);

    try {
      const recentContext = [...existing, userItem]
        .slice(-10)
        .map(
          (item) =>
            `${item.role === "user" ? "User" : "ShezoraX"}: ${item.text}`
        )
        .join("\n");

      const response = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            `You are ShezoraX working inside the "${tool.title}" creation workspace. ` +
            `This is a creative productivity tool, not a software development or academic project workspace. ` +
            `Help the user create, write, plan, improve or structure content related specifically to this tool. ` +
            `Give practical and useful answers. ` +
            `Do not move the user into coding, school projects, college projects, university projects or software development work. ` +
            `If the request is outside this creation tool, explain briefly and keep the response focused on the current creation category.\n\n` +
            `Creation tool: ${tool.title}\n` +
            `Recent conversation:\n${recentContext}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Create AI response failed"
        );
      }

      const reply =
        data.reply ||
        t("I received your creation request, but no response was returned.");

      setCreateMessages((previous) => ({
        ...previous,
        [selectedCreateTool]: [
          ...(previous[selectedCreateTool] || []),
          {
            role: "ai",
            text: reply,
          },
        ],
      }));

      speakText(reply);
    } catch (error) {
      console.error("ShezoraX Create Error:", error);

      setCreateMessages((previous) => ({
        ...previous,
        [selectedCreateTool]: [
          ...(previous[selectedCreateTool] || []),
          {
            role: "ai",
            text:
              t("I am unable to connect to the AI service right now. Please check that the ShezoraX backend is running."),
          },
        ],
      }));
    } finally {
      setCreateLoading(false);
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
        `${t("Clear")} ${t(project.title)}?`
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

    const handleCreateKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendCreateMessage();
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
            <span className="eyebrow">{t("PERSONAL AI")}</span>
            <h2>{t("Talk with ShezoraX")}</h2>
          </div>

          <button
            type="button"
            className={
              "voice-button " +
              (isListening ? "active" : "")
            }
            onClick={() => startListening("general")}
          >
            {isListening ? t("Listening\u2026") : t("Speak")}
          </button>
        </div>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="empty-chat-state">
              <span>{t("READY")}</span>
              <strong>{t("Start a conversation with ShezoraX.")}</strong>
              <p>
                {t("Ask a question, explain a problem, or describe what you want to build.")}
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
                  {item.role === "user" ? t("YOU") : t("SHEZORAX")}
                </span>
                <div className="message-bubble">
                  {item.text}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message-row ai-message">
              <span className="message-role">{t("SHEZORAX")}</span>
              <div className="message-bubble typing">
                {t("Thinking\u2026")}
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
            placeholder={t("Ask ShezoraX anything\u2026")}
            aria-label={t("Message ShezoraX")}
            rows={3}
          />

          <div className="prompt-actions">
            <span>{t("Enter to send \u00b7 Shift + Enter for a new line")}</span>

            <div className="prompt-action-group">
              <button
                type="button"
                className={
                  "listen-button " +
                  (isListening ? "active" : "")
                }
                onClick={() => startListening("general")}
              >
                {isListening ? t("Stop mic") : t("Voice")}
              </button>

              <button
                type="button"
                className="send-button"
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                aria-label={t("Send")}
                title={t("Send")}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
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
                <span className="eyebrow">{t("PROJECTS")}</span>
                <h1>{t("Build something with ShezoraX")}</h1>
                <p>
                  {t("Choose a project type. Each workspace has its own AI chat, voice input, voice replies, notes and saved conversation.")}
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
                  <strong>{t(project.title)}</strong>
                  <span>{t(project.description)}</span>
                  <small>{t("Open project workspace \u2192")}</small>
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
                {t("\u2190 All Projects")}
              </button>

              <span className="eyebrow">{t("PROJECT WORKSPACE")}</span>
              <h1>{t(project.title)}</h1>
              <p>{t(project.description)}</p>
            </div>

            <div className="workspace-head-actions">
              <button
                type="button"
                className="secondary-module-button"
                onClick={downloadProjectBrief}
              >
                {t("Export")}
              </button>

              <button
                type="button"
                className="secondary-module-button danger-soft"
                onClick={clearProjectChat}
              >
                {t("Clear")}
              </button>
            </div>
          </div>

          <div className="project-tabs" role="tablist">
            {[
              ["chat", t("AI Chat")],
              ["plan", t("Project Plan")],
              ["notes", t("Notes")],
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
                {t(label)}
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
                      {t("Tell ShezoraX what you want to build.")}
                    </strong>
                    <p>
                      {t("Describe your idea, requirements, deadline, technology, assignment instructions or any problem you need solved.")}
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
                          ? t("YOU")
                          : t("SHEZORAX")}
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
                          {t("Speak")}
                        </button>
                      )}
                    </div>
                  ))
                )}

                {projectLoading && (
                  <div className="message-row ai-message">
                    <span className="message-role">{t("SHEZORAX")}</span>
                    <div className="message-bubble typing">
                      {t("Working on your project\u2026")}
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
                      ? t("Listening\u2026 speak now")
                      : t("Voice + text supported")}
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
                        ? t("Stop mic")
                        : t("Voice")}
                    </button>

                    <button
                      type="button"
                      className="send-button"
                      onClick={sendProjectMessage}
                      disabled={
                        projectLoading ||
                        !projectDraft.trim()
                      }
                      aria-label={t("Send")}
                      title={t("Send")}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {projectTab === "plan" && (
            <div className="project-plan-panel">
              <div className="plan-intro">
                <span className="eyebrow">{t("WORKFLOW")}</span>
                <h2>{t("Build your project step by step")}</h2>
                <p>
                  {t("Use these stages to keep the project organized. You can ask ShezoraX to handle any stage from the AI Chat tab.")}
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
                    <strong>{t(title)}</strong>
                    <small>{t(text)}</small>
                    <em>{t("Ask ShezoraX \u2192")}</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          {projectTab === "notes" && (
            <div className="project-notes-panel">
              <div className="plan-intro">
                <span className="eyebrow">{t("PROJECT MEMORY")}</span>
                <h2>{t("Project notes")}</h2>
                <p>
                  {t("Save requirements, links, deadlines, technologies or other context. Notes stay on this device and are included in future project AI requests.")}
                </p>
              </div>

              <textarea
                className="project-notes-input"
                value={currentNote}
                onChange={(event) =>
                  updateProjectNote(event.target.value)
                }
                placeholder={t("Example: React + Node.js, deadline Friday, must be mobile responsive\u2026")}
              />

              <div className="notes-footer">
                <span>
                  {currentNote.length} {t("characters \u00b7 saved locally")}
                </span>
                <button
                  type="button"
                  className="primary-module-button"
                  onClick={() => setProjectTab("chat")}
                >
                  {t("Back to Chat")}
                </button>
              </div>
            </div>
          )}

          <div className="project-workspace-footer">
            <span>
              {project.title} ·{" "}
              {activeProjectMessages.length} {t("messages")}
            </span>

            <button
              type="button"
              className="listen-button"
              onClick={copyProjectConversation}
              disabled={!activeProjectMessages.length}
            >
              {projectCopied ? t("Copied") : t("Copy conversation")}
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
                {t("ShezoraX AI Online")}
              </div>

              <h1 className="greeting">
                {t(getGreeting())}, {userName}.
              </h1>

              <p className="hero-description">
                {t("Your intelligent personal AI workspace for learning, creating, exploring and getting things done.")}
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
                  <span className="eyebrow">{t("PERSONAL AI")}</span>
                  <h2>{t("What can I help you with?")}</h2>
                </div>

                <button
                  type="button"
                  className={
                    "voice-button " +
                    (isListening ? "active" : "")
                  }
                  onClick={() => startListening("general")}
                >
                  {isListening ? t("Listening\u2026") : t("Speak")}
                </button>
              </div>

              <div className="conversation">
                {messages.length === 0 ? (
                  <div className="empty-chat-state">
                    <span>{t("READY")}</span>
                    <strong>
                      {t("Ask ShezoraX anything.")}
                    </strong>
                    <p>
                      {t("You can also use the microphone or one of the quick prompts below.")}
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
                          ? t("YOU")
                          : t("SHEZORAX")}
                      </span>
                      <div className="message-bubble">
                        {item.text}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="message-row ai-message">
                    <span className="message-role">{t("SHEZORAX")}</span>
                    <div className="message-bubble typing">
                      {t("Thinking\u2026")}
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
                  placeholder={t("Ask ShezoraX anything\u2026")}
                  rows={3}
                />

                <div className="prompt-actions">
                  <span>{t("Voice input is available")}</span>

                  <div className="prompt-action-group">
                    <button
                      type="button"
                      className={
                        "listen-button " +
                        (isListening ? "active" : "")
                      }
                      onClick={() => startListening("general")}
                    >
                      {isListening ? t("Stop mic") : t("Voice")}
                    </button>

                    <button
                      type="button"
                      className="send-button"
                      onClick={sendMessage}
                      disabled={loading || !message.trim()}
                      aria-label={t("Send")}
                      title={t("Send")}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="suggestion-section">
            <span className="eyebrow">{t("EXPLORE SHEZORAX")}</span>

            <div className="suggestion-grid">
              {suggestions.map((item) => (
                <button
                  type="button"
                  className="suggestion-card"
                  key={item}
                  onClick={() => sendMessage(item)}
                >
                  {t(item)}
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
  return renderCreateWorkspace();
}

function renderCreateWorkspace() {
    if (!selectedCreateTool) {
      return (
        <section className="module-page create-tools-page">
          <div className="module-card create-tools-card">
            <div className="module-heading-row create-tools-heading">
              <div>
                <span className="eyebrow">{t("CREATE")}</span>
                <h1>{t("Create something amazing")}</h1>
                <p>
                  {t("Choose a creation tool. Each tool opens its own focused ShezoraX AI workspace with relevant suggestions and chat.")}
                </p>
              </div>
            </div>

            <div className="create-tools-grid">
              {CREATE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className="create-tool-card"
                  onClick={() => openCreateTool(tool.id)}
                >
                  <span className="create-tool-icon">
                    {tool.icon}
                  </span>

                  <div className="create-tool-copy">
                    <strong>{t(tool.title)}</strong>
                    <span>{t(tool.description)}</span>
                  </div>

                  <small>
                    {t("Open workspace \u2192")}
                  </small>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    const tool = getCreateTool(selectedCreateTool);
    const activeCreateMessages =
      createMessages[selectedCreateTool] || [];

    return (
      <section className="module-page create-workspace-page">
        <div className="module-card create-workspace-card">
          <div className="create-workspace-head">
            <div>
              <button
                type="button"
                className="workspace-back-button"
                onClick={closeCreateTool}
              >
                {t("\u2190 All Create Tools")}
              </button>

              <span className="eyebrow">
                {t("CREATE WORKSPACE")}
              </span>

              <h1>{t(tool.title)}</h1>

              <p>
                {t(tool.description)}
              </p>
            </div>

            <div className="workspace-head-actions">
              <button
                type="button"
                className="secondary-module-button danger-soft"
                onClick={clearCreateChat}
              >
                {t("Clear")}
              </button>
            </div>
          </div>

          <div className="create-workspace-layout">
            <div className="create-chat-panel">
              <div className="create-chat-conversation">
                {activeCreateMessages.length === 0 ? (
                  <div className="empty-chat-state create-empty-state">
                    <span>{tool.icon}</span>

                    <strong>
                      {t("What would you like to create?")}
                    </strong>

                    <p>
                      {t("Start with your own request or choose one of the suggestions for this creation tool.")}
                    </p>
                  </div>
                ) : (
                  activeCreateMessages.map((item, index) => (
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
                          ? t("YOU")
                          : t("SHEZORAX")}
                      </span>

                      <div className="message-bubble">
                        {item.text}
                      </div>

                      {item.role === "ai" && (
                        <button
                          type="button"
                          className="listen-button response-listen-button"
                          onClick={() =>
                            speakText(item.text, true)
                          }
                        >
                          {t("Speak")}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="prompt-box create-prompt-box">
                <textarea
                  ref={chatInputRef}
                  value={createDraft}
                  onChange={(event) =>
                    setCreateDraft(event.target.value)
                  }
                  onKeyDown={handleCreateKeyDown}
                  placeholder={`Tell ShezoraX what you want to create with ${tool.title}...`}
                  rows={4}
                />

                <div className="prompt-action-group">
                  <button
                    type="button"
                    className={
                      "listen-button " +
                      (createListening ? "active" : "")
                    }
                    onClick={() =>
                      startListening("create")
                    }
                  >
                    {createListening
                      ? t("Listening")
                      : t("Speak")}
                  </button>

                  <button
                    type="button"
                    className="send-button"
                    onClick={sendCreateMessage}
                    disabled={
                      createLoading ||
                      !createDraft.trim()
                    }
                    aria-label={t("Send")}
                    title={t("Send")}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <aside className="create-suggestions-panel">
              <span className="eyebrow">
                {t("SUGGESTIONS")}
              </span>

              <h2>
                {t("Try one of these")}
              </h2>

              <p>
                {t("Focused ideas for")} {t(tool.title)}.
              </p>

              <div className="create-suggestions-list">
                {tool.suggestions.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="create-suggestion-item"
                      onClick={() =>
                        sendCreateMessage(
                          suggestion
                        )
                      }
                    >
                      <span>{t(suggestion)}</span>
                      <small>→</small>
                    </button>
                  )
                )}
              </div>
            </aside>
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
            <span className="eyebrow">{t("KNOWLEDGE")}</span>
            <h1>{t("Knowledge Universe")}</h1>
            <p>
              {t("Pick a topic and ShezoraX will open the AI chat with a focused question.")}
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
                  <strong>{t(topic)}</strong>
                  <span>{t("Ask ShezoraX \u2192")}</span>
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
                <span className="eyebrow">{t("SETTINGS")}</span>
                <h1>{t("Settings")}</h1>
                <p>
                  {t("Manage your ShezoraX preferences, account and personal experience.")}
                </p>
              </div>
            </div>

            <div className="settings-layout">

              <aside className="settings-sidebar">
                <div className="settings-sidebar-title">
                  {t("Settings")}
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
                      <span className={`settings-navigation-icon settings-icon-${section.icon}`}>
  {section.icon === "google" ? (
    <svg
      className="settings-google-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
      />
      <path
        fill="#34A853"
        d="M12 21.82c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.52A9.74 9.74 0 0 0 12 21.82Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.92a5.86 5.86 0 0 1 0-3.74V7.66H3.29a9.83 9.83 0 0 0 0 8.78l3.25-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.15c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.25 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.71 5.48l3.25 2.52C7.31 7.87 9.46 6.15 12 6.15Z"
      />
    </svg>
  ) : section.icon === "apple" ? (
    <svg
      className="settings-apple-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.07-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.81 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.07ZM12.03 7.25C11.88 5.02 13.69 3.18 15.78 3c.29 2.58-2.34 4.5-3.75 4.25Z"
      />
    </svg>
  ) : (
    section.icon
  )}
</span>

                      <span className="settings-navigation-copy">
                        <strong>{t(section.title)}</strong>
                        <small>{t(section.description)}</small>
                      </span>

                      <span className="settings-navigation-arrow">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="settings-content" ref={settingsContentRef}>

                {settingsSection === "General" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">{t("GENERAL")}</span>
                      <h2>{t("General")}</h2>
                      <p>
                        {t("Control the language and voice experience of ShezoraX.")}
                      </p>
                    </div>

                    <div className="settings-group">

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>{t("Language")}</strong>
                          <span>
                            {t("Choose the language used throughout the ShezoraX interface.")}
                          </span>
                        </div>

                        <select
  className="settings-select"
  value={selectedLanguage}
  onChange={(event) => {
    setSelectedLanguage(event.target.value);
  }}
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
                          <strong>{t("Voice")}</strong>
                          <span>
                            {t("Choose the AI voice ShezoraX uses for spoken responses.")}
                          </span>
                        </div>

                        <div className="settings-voice-list">
                          {SETTINGS_VOICES.map((voice) => {
                            const isFemale = voice.gender === "Female";
                            const genderClass = isFemale ? "female" : "male";
                            const isActive = selectedVoice === voice.id;

                            return (
                              <button
                                key={voice.id}
                                type="button"
                                className={
                                  "settings-voice-option " +
                                  genderClass +
                                  (isActive ? " active" : "")
                                }
                                onClick={() =>
                                  setSelectedVoice(voice.id)
                                }
                              >
                                <span className={"settings-voice-avatar " + genderClass}>
                                  {isFemale ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
                                      <path d="M8 14c0-1 .5-2 1.5-2.5" />
                                      <path d="M16 14c0-1-.5-2-1.5-2.5" />
                                      <path d="M9 18h6" />
                                      <path d="M10 22h4" />
                                      <path d="M12 14v4" />
                                      <path d="M12 18v4" />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
                                      <path d="M8.5 11.5C7 12 6 13.5 6 15" />
                                      <path d="M15.5 11.5C17 12 18 13.5 18 15" />
                                      <path d="M6 15v3c0 1 1 2 2 2h8c1 0 2-1 2-2v-3" />
                                      <path d="M12 12v8" />
                                    </svg>
                                  )}
                                </span>

                                <span className="settings-voice-copy">
                                  <strong>{voice.name}</strong>
                                  <small>
                                    {t(voice.gender)} {"\u00b7"} {t(voice.description)}
                                  </small>
                                </span>

                                <span className={"settings-check" + (isActive ? " active " + genderClass : "")}>
                                  {isActive && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>{t("AI voice replies")}</strong>
                          <span>
                            {t("ShezoraX speaks general AI responses when browser speech synthesis is available.")}
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
                          {voiceReplies ? t("ON") : t("OFF")}
                        </button>
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>{t("Project voice replies")}</strong>
                          <span>
                            {t("Automatically speak responses inside project workspaces.")}
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
                          {autoSpeakProject ? t("ON") : t("OFF")}
                        </button>
                      </div>

                    </div>

                    <div className="settings-actions">
                      <button
                        type="button"
                        className="primary-module-button"
                        onClick={() =>
                          speakText(
                            `Hello ${userName}. This is ${selectedVoice}.`,
                            true
                          )
                        }
                      >
                        {t("Test Voice")}
                      </button>

                      <button
                        type="button"
                        className="secondary-module-button"
                        onClick={() =>
                          startListening("general")
                        }
                      >
                        {t("Test Microphone")}
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Creator" && (
                <div className="creator-connect-card">
                  <div className="creator-profile-header">
                    <div className="creator-avatar">
                      <img src="/favicon.svg" alt="ShezoraX" />
                    </div>
                    <div className="creator-profile-info">
                      <span className="eyebrow">{t("CREATOR")}</span>
                      <h3>{userName}</h3>
                      <p>
                        {t("Full-Stack Developer & AI Engineer \u2014 the mind behind")}
                        <strong> ShezoraX</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="creator-connect-heading">
                    <h4>{t("Connect & Follow")}</h4>
                    <p>{t("Stay updated with my latest work and projects.")}</p>
                  </div>

  <div className="creator-social-links">
    <a
      href="https://github.com/Owais180406"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-social-link"
    >
      <span className="creator-social-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.22-3.37-1.22-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.08 0-1.12.39-2.03 1.02-2.75-.1-.26-.44-1.3.1-2.71 0 0 .83-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.95c.84 0 1.69.12 2.48.36 1.92-1.32 2.75-1.05 2.75-1.05.54 1.41.2 2.45.1 2.71.63.72 1.02 1.63 1.02 2.75 0 3.94-2.35 4.81-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
  </svg>
</span>
      <span className="creator-social-copy">
        <strong>{t("GitHub")}</strong>
        <small>{t("Explore my projects")}</small>
      </span>
      <span className="creator-social-arrow">↗</span>
    </a>

    <a
  href="https://www.facebook.com/profile.php?id=100093070689027"
  target="_blank"
  rel="noopener noreferrer"
  className="creator-social-link"
>
  <span className="creator-social-icon" aria-hidden="true">
    <svg
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path
    d="M13.35 21v-7.95h2.65l.42-3.1h-3.07V8.02c0-.9.25-1.5 1.48-1.5h1.7V3.75c-.3-.04-1.3-.13-2.48-.13-2.45 0-4.13 1.5-4.13 4.27v2.06H7.2v3.1h2.72V21h3.43Z"
  />
</svg>
  </span>

  <span className="creator-social-copy">
    <strong>{t("Facebook")}</strong>
    <small>{t("Connect with me")}</small>
  </span>

  <span className="creator-social-arrow">↗</span>
</a>

    <a
      href="https://www.instagram.com/owaisahmed_sheikh/"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-social-link"
    >
      <span className="creator-social-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      cx="17.5"
      cy="6.5"
      r="1"
      fill="currentColor"
    />
  </svg>
</span>
      <span className="creator-social-copy">
        <strong>{t("Instagram")}</strong>
        <small>{t("Follow my journey")}</small>
      </span>
      <span className="creator-social-arrow">↗</span>
    </a>

    <a
      href="https://www.linkedin.com/in/owais-ahmed-sheikh-723085352/"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-social-link"
    >
      <span className="creator-social-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.2 7.1A2.1 2.1 0 1 0 5.2 3a2.1 2.1 0 0 0 0 4.1ZM3.4 21h3.6V9.1H3.4V21ZM9.2 9.1h3.5v1.63h.05c.49-.93 1.68-1.91 3.45-1.91 3.69 0 4.37 2.43 4.37 5.59V21H17v-5.85c0-1.39-.03-3.18-1.94-3.18-1.94 0-2.24 1.51-2.24 3.08V21H9.2V9.1Z" />
  </svg>
</span>
      <span className="creator-social-copy">
        <strong>{t("LinkedIn")}</strong>
        <small>{t("Connect professionally")}</small>
      </span>
      <span className="creator-social-arrow">↗</span>
    </a>

    <a
      href="https://x.com/OwaisAhmed27976"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-social-link"
    >
      <span className="creator-social-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.24-8.28L2.8 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.9h1.73L8.27 3.97H6.41L17.8 19.9Z" />
  </svg>
</span>
      <span className="creator-social-copy">
        <strong>{t("X")}</strong>
        <small>{t("Follow for updates")}</small>
      </span>
      <span className="creator-social-arrow">↗</span>
    </a>

    <a
      href="https://my-project-pfmw.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-social-link"
    >
      <span className="creator-social-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M3.5 12h17M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
</span>
      <span className="creator-social-copy">
        <strong>{t("Portfolio")}</strong>
        <small>{t("View my work")}</small>
      </span>
      <span className="creator-social-arrow">↗</span>
    </a>
  </div>
</div>
                )}

                {settingsSection === "Profile" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">{t("PROFILE")}</span>
                      <h2>{t("Profile")}</h2>
                      <p>
                        {t("Manage your ShezoraX account and personal data.")}
                      </p>
                    </div>

                    <div className="settings-group">

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>{t("Your name")}</strong>
                          <span>
                            {t("How ShezoraX should greet you")}
                          </span>
                        </div>

                        <input
                          type="text"
                          className="settings-text-input"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder={t("Enter your name")}
                          maxLength={50}
                        />
                      </div>

                      <div className="settings-item">
                        <div className="settings-item-copy">
                          <strong>{t("Google email")}</strong>
                          <span>
                            {t("Connected account")}
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
                          <strong>{t("Log out of all devices")}</strong>
                          <small>
                            {t("End active ShezoraX sessions on other devices.")}
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
                          <strong>{t("Delete all chats")}</strong>
                          <small>
                            {t("Remove your ShezoraX conversations and project chat memory from this device.")}
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
                          <strong>{t("Delete account")}</strong>
                          <small>
                            {t("Permanently delete your ShezoraX account when account authentication is connected.")}
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
                        {t("GOOGLE ACCOUNT")}
                      </span>

                      <h2>{t("Google Account")}</h2>

                      <p>
                        {t("Connect your Google account to use account authentication with ShezoraX.")}
                      </p>
                    </div>

                    <div className="settings-provider-card google-provider">
                      <div className="settings-provider-icon">
                        G
                      </div>

                      <div className="settings-provider-copy">
                        <strong>{t("Google")}</strong>

                        <span>
                          {googleConnected
                            ? t("Google connection is ready.")
                            : t("Connect your Google account to ShezoraX.")}
                        </span>

                        <small>
                          {t("Real Google OAuth requires configured authentication credentials.")}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="settings-provider-button"
                        onClick={handleGoogleConnect}
                      >
                        {googleConnected
                          ? t("Connected")
                          : t("Continue with Google")}
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Apple ID" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">
                        {t("APPLE ID")}
                      </span>

                      <h2>{t("Apple ID")}</h2>

                      <p>
                        {t("Connect your Apple ID to use Apple account authentication with ShezoraX.")}
                      </p>
                    </div>

                    <div className="settings-provider-card apple-provider">
                      <div className="settings-provider-icon">
                        
                      </div>

                      <div className="settings-provider-copy">
                        <strong>{t("Apple ID")}</strong>

                        <span>
                          {appleConnected
                            ? t("Apple ID connection is ready.")
                            : t("Connect your Apple ID to ShezoraX.")}
                        </span>

                        <small>
                          {t("Real Apple Sign In requires configured authentication credentials.")}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="settings-provider-button"
                        onClick={handleAppleConnect}
                      >
                        {appleConnected
                          ? t("Connected")
                          : t("Continue with Apple")}
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === "Religion & Faith" && (
                  <div className="settings-section-content">
                    <div className="settings-section-heading">
                      <span className="eyebrow">
                        {t("RELIGION & FAITH")}
                      </span>

                      <h2>{t("Religion & Faith")}</h2>

                      <p>
                        {t("Manage the religious and faith-related preferences used by ShezoraX.")}
                      </p>
                    </div>

                    <div className="religion-faith-hero">
                      <div className="religion-faith-hero-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>

                      <h3>{t("Faith preferences")}</h3>

                      <p>
                        {t("This area is reserved for your religious knowledge, prayer and faith-related preferences. Configure how ShezoraX integrates faith-based guidance into your experience.")}
                      </p>
                    </div>

                    <div className="religion-faith-grid">

                      <div className="religion-faith-card">
                        <div className="religion-faith-card-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8" />
                            <path d="M8 11h6" />
                          </svg>
                        </div>

                        <strong>{t("Religious knowledge")}</strong>
                        <span>{t("ShezoraX can keep religious topics separate from general application preferences.")}</span>

                        <div className="card-status available">
                          <span className="card-status-dot"></span>
                          {t("Ready")}
                        </div>
                      </div>

                      <div className="religion-faith-card">
                        <div className="religion-faith-card-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>

                        <strong>{t("Prayer times")}</strong>
                        <span>{t("Get notifications for daily prayer times based on your location.")}</span>

                        <div className="card-status coming-soon">
                          <span className="card-status-dot"></span>
                          {t("Coming soon")}
                        </div>
                      </div>

                      <div className="religion-faith-card">
                        <div className="religion-faith-card-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                          </svg>
                        </div>

                        <strong>{t("Qibla direction")}</strong>
                        <span>{t("Find the direction of prayer using your device compass.")}</span>

                        <div className="card-status coming-soon">
                          <span className="card-status-dot"></span>
                          {t("Coming soon")}
                        </div>
                      </div>

                      <div className="religion-faith-card">
                        <div className="religion-faith-card-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                            <path d="M20 12H12V2" />
                          </svg>
                        </div>

                        <strong>{t("Daily verses")}</strong>
                        <span>{t("Receive daily religious verses and reflections in your feed.")}</span>

                        <div className="card-status coming-soon">
                          <span className="card-status-dot"></span>
                          {t("Coming soon")}
                        </div>
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
          <img src="/favicon.svg" alt="ShezoraX" className="brand-logo" />
          <div>
            <strong>ShezoraX</strong>
            <span>{t("PERSONAL AI")}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {[
            ["Home", "home"],
            ["AI Chat", "chat"],
            ["Create", "create"],
            ["Projects", "projects"],
            ["Knowledge", "knowledge"],
            ["Settings", "settings"],
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
              <span className="nav-icon" aria-hidden="true">
                {icon === "home" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4V14h-7v7.5H4.5A1.5 1.5 0 0 1 3 20z" />
                  </svg>
                )}
                {icon === "chat" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4.255-.964L3 20l1.338-3.346C3.493 15.48 3 14.28 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    <circle cx="8.5" cy="13" r="1" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
                    <circle cx="15.5" cy="13" r="1" fill="currentColor" stroke="none" />
                  </svg>
                )}
                {icon === "create" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                    <path d="M12 5v14" strokeWidth="2.2" />
                  </svg>
                )}
                {icon === "projects" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                )}
                {icon === "knowledge" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" />
                  </svg>
                )}
                {icon === "settings" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                )}
              </span>
              <span className="nav-label">
  {t(item)}
</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-status">
            <span className="status-dot" />

            <div>
              <strong>{t("AI System")}</strong>
              <span>{t("Online")}</span>
            </div>
          </div>

          <button
            type="button"
            className="profile-button"
            onClick={() =>
              setAccountOpen((open) => !open)
            }
            aria-expanded={accountOpen}
            aria-label={t("Account")}
            title={t("Account")}
          >
            <span className="profile-avatar">OA</span>

            <span className="profile-copy">
              <strong>{userName}</strong>
              <span>{t("Account")}</span>
            </span>

            <span className="profile-chevron">
              {accountOpen ? "⌃" : "⌄"}
            </span>
          </button>

          {accountOpen && (
            <div className="account-panel">
              <span className="eyebrow">{t("ACCOUNT")}</span>
              <h3>{userName}</h3>
              <p>
                {t("Connect a provider to add account authentication to ShezoraX.")}
              </p>

              <button
  type="button"
  className="account-provider-button account-google-button"
  onClick={() =>
    alert(
      t("Google account connection UI is ready. Real Google OAuth credentials are required for live authentication.")
    )
  }
>
  <span className="account-provider-logo google-provider-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img">
      <path
        d="M21.35 12.27c0-.72-.06-1.43-.18-2.1H12v3.98h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.27Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.79c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.53A9.74 9.74 0 0 0 12 21.79Z"
        fill="#34A853"
      />
      <path
        d="M6.51 13.88A5.86 5.86 0 0 1 6.2 12c0-.65.11-1.28.31-1.88V7.59H3.27A9.73 9.73 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.41l3.24-2.53Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.09c1.43 0 2.72.49 3.74 1.45l2.8-2.8C16.84 3.12 14.63 2.21 12 2.21a9.74 9.74 0 0 0-8.73 5.38l3.24 2.53C7.29 7.81 9.45 6.09 12 6.09Z"
        fill="#EA4335"
      />
    </svg>
  </span>

  <span className="account-provider-label">
    {t("Continue with Google")}
  </span>
</button>

<button
  type="button"
  className="account-provider-button account-apple-button"
  onClick={() =>
    alert(
      t("Apple ID connection UI is ready. Real Apple Sign In credentials are required for live authentication.")
    )
  }
>
  <span className="account-provider-logo apple-provider-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img">
      <path
        d="M16.77 12.76c.02 2.18 1.91 2.9 1.93 2.91-.02.05-.3 1.03-1 2.03-.6.86-1.22 1.72-2.2 1.74-.96.02-1.27-.56-2.37-.56-1.1 0-1.44.54-2.35.58-.95.03-1.68-.93-2.29-1.79-1.25-1.77-2.21-5-0.92-7.18.64-1.08 1.78-1.76 3.01-1.78.94-.02 1.83.63 2.37.63.54 0 1.55-.78 2.62-.66.45.02 1.72.18 2.53 1.35-.07.04-1.51.88-1.33 2.78Zm-1.72-5.42c.49-.59.82-1.41.73-2.23-.71.03-1.56.47-2.07 1.06-.45.52-.84 1.36-.74 2.16.79.06 1.59-.4 2.08-.99Z"
        fill="currentColor"
      />
    </svg>
  </span>

  <span className="account-provider-label">
    {t("Continue with Apple ID")}
  </span>
</button>

              <small>
                {t("Provider authentication is intentionally not faked. OAuth credentials must be configured before real sign-in is enabled.")}
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
    ? t(getProjectType(selectedProject).title)
    : t(activePage)}
</strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={focusGeneralChat}
              title={t("AI Chat")}
            >
              {t("Search")}
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage("Knowledge");
                setSelectedProject(null);
              }}
            >
              {t("Knowledge")}
            </button>

            <button
              type="button"
              className="upgrade-button"
              onClick={() => setActivePage("Settings")}
            >
              {t("Settings")}
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
