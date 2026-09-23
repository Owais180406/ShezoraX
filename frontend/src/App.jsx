import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "";

/* =========================================================
   SPACE SCENE
========================================================= */

function SpaceScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return undefined;
    }

    /* =========================================================
       SCENE
    ========================================================= */

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x010207);

    scene.fog = new THREE.FogExp2(
      0x010207,
      0.0018
    );

    /* =========================================================
       CAMERA
    ========================================================= */

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      2200
    );

    const cameraHome = new THREE.Vector3(
      0,
      1.2,
      19
    );

    camera.position.copy(cameraHome);

    /* =========================================================
       RENDERER
    ========================================================= */

    const renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.05;

    renderer.shadowMap.enabled = true;

    /*
      PCFSoftShadowMap was removed in newer Three.js.
      PCFShadowMap is the supported replacement.
    */
    renderer.shadowMap.type =
      THREE.PCFShadowMap;

    mount.appendChild(renderer.domElement);

    /* =========================================================
       LIGHTING
       The Sun is invisible. Only its light is used.
    ========================================================= */

    const ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        0.018
      );

    scene.add(ambientLight);

    const sunLight =
      new THREE.DirectionalLight(
        0xfff4df,
        4.2
      );

    sunLight.position.set(
      18,
      9,
      14
    );

    sunLight.castShadow = true;

    scene.add(sunLight);

    const blueFill =
      new THREE.PointLight(
        0x426cff,
        0.035,
        80
      );

    blueFill.position.set(
      -18,
      -8,
      8
    );

    scene.add(blueFill);

    /* =========================================================
       TEXTURE LOADER
    ========================================================= */

    const textureLoader =
      new THREE.TextureLoader();

    /* =========================================================
       REALISTIC STAR FIELD
       
       Three independent depth layers:
       - extremely distant stars
       - medium stars
       - a small number of closer stars

       The shader is deliberately simple and safe.
       uPixelRatio is explicitly declared as a uniform.
    ========================================================= */

    const createRealisticStars = ({
      count,
      minRadius,
      maxRadius,
      minSize,
      maxSize,
      opacity,
      bandStrength,
    }) => {
      const geometry =
        new THREE.BufferGeometry();

      const positions =
        new Float32Array(count * 3);

      const colors =
        new Float32Array(count * 3);

      const sizes =
        new Float32Array(count);

      const starPalette = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xf5f1e8),
        new THREE.Color(0xdce9ff),
        new THREE.Color(0xc9dcff),
        new THREE.Color(0xffe0b5),
      ];

      for (
        let i = 0;
        i < count;
        i += 1
      ) {
        const radius =
          minRadius +
          Math.pow(
            Math.random(),
            0.58
          ) *
            (maxRadius -
              minRadius);

        const theta =
          Math.random() *
          Math.PI *
          2;

        /*
          Broad galactic concentration.
          This is intentionally subtle so it does not
          look like an artificial CSS galaxy.
        */

        let yBias;

        if (
          Math.random() <
          bandStrength
        ) {
          yBias =
            (Math.random() -
              0.5) *
            (0.10 +
              Math.random() *
                0.22);
        } else {
          yBias =
            Math.random() *
              2 -
            1;
        }

        yBias =
          THREE.MathUtils.clamp(
            yBias,
            -1,
            1
          );

        const ringRadius =
          Math.sqrt(
            Math.max(
              0,
              1 -
                yBias *
                  yBias
            )
          );

        positions[i * 3] =
          radius *
          ringRadius *
          Math.cos(theta);

        positions[i * 3 + 1] =
          radius *
          yBias;

        positions[i * 3 + 2] =
          radius *
          ringRadius *
          Math.sin(theta);

        /*
          Mostly white stars with very subtle
          natural temperature differences.
        */

        const randomValue =
          Math.random();

        let paletteIndex = 0;

        if (randomValue < 0.10) {
          paletteIndex = 1;
        } else if (
          randomValue < 0.18
        ) {
          paletteIndex = 2;
        } else if (
          randomValue < 0.22
        ) {
          paletteIndex = 3;
        } else if (
          randomValue < 0.25
        ) {
          paletteIndex = 4;
        }

        const color =
          starPalette[
            paletteIndex
          ];

        const brightness =
          0.72 +
          Math.random() *
            0.28;

        colors[i * 3] =
          color.r *
          brightness;

        colors[i * 3 + 1] =
          color.g *
          brightness;

        colors[i * 3 + 2] =
          color.b *
          brightness;

        /*
          Most stars remain very small.
          Only a tiny fraction become slightly
          brighter foreground stars.
        */

        const sizeRandom =
          Math.random();

        sizes[i] =
          minSize +
          Math.pow(
            sizeRandom,
            3.6
          ) *
            (maxSize -
              minSize);
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

      geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(
          sizes,
          1
        )
      );

      const material =
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: true,
          vertexColors: true,
          blending:
            THREE.AdditiveBlending,

          uniforms: {
            uPixelRatio: {
              value: Math.min(
                window.devicePixelRatio ||
                  1,
                2
              ),
            },

            uOpacity: {
              value: opacity,
            },
          },

          vertexShader: `
            attribute float size;

            uniform float uPixelRatio;

            varying vec3 vColor;

            void main() {
              vColor = color;

              vec4 mvPosition =
                modelViewMatrix *
                vec4(position, 1.0);

              float depth =
                max(
                  20.0,
                  -mvPosition.z
                );

              float depthScale =
                240.0 / depth;

              gl_PointSize =
                size *
                uPixelRatio *
                depthScale;

              gl_PointSize =
                clamp(
                  gl_PointSize,
                  0.45,
                  3.6
                );

              gl_Position =
                projectionMatrix *
                mvPosition;
            }
          `,

          fragmentShader: `
            uniform float uOpacity;

            varying vec3 vColor;

            void main() {
              vec2 point =
                gl_PointCoord -
                vec2(0.5);

              float distanceFromCenter =
                length(point);

              if (
                distanceFromCenter >
                0.5
              ) {
                discard;
              }

              float core =
                1.0 -
                smoothstep(
                  0.0,
                  0.18,
                  distanceFromCenter
                );

              float softEdge =
                1.0 -
                smoothstep(
                  0.12,
                  0.5,
                  distanceFromCenter
                );

              float alpha =
                (
                  core * 0.88 +
                  softEdge * 0.12
                ) *
                uOpacity;

              gl_FragColor =
                vec4(
                  vColor,
                  alpha
                );
            }
          `,
        });

      return new THREE.Points(
        geometry,
        material
      );
    };

    const farStars =
      createRealisticStars({
        count: 7600,
        minRadius: 240,
        maxRadius: 1100,
        minSize: 0.40,
        maxSize: 0.92,
        opacity: 0.64,
        bandStrength: 0.44,
      });

    const midStars =
      createRealisticStars({
        count: 2100,
        minRadius: 95,
        maxRadius: 420,
        minSize: 0.42,
        maxSize: 1.12,
        opacity: 0.50,
        bandStrength: 0.28,
      });

    const nearStars =
      createRealisticStars({
        count: 260,
        minRadius: 55,
        maxRadius: 180,
        minSize: 0.58,
        maxSize: 1.42,
        opacity: 0.38,
        bandStrength: 0.16,
      });

    scene.add(
      farStars,
      midStars,
      nearStars
    );

    /* =========================================================
       SUBTLE DEEP-SPACE NEBULA
    ========================================================= */

    const createNebulaTexture =
      () => {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = 512;
        canvas.height = 512;

        const ctx =
          canvas.getContext(
            "2d"
          );

        if (!ctx) {
          return null;
        }

        const image =
          ctx.createImageData(
            512,
            512
          );

        for (
          let y = 0;
          y < 512;
          y += 1
        ) {
          for (
            let x = 0;
            x < 512;
            x += 1
          ) {
            const dx =
              (x - 256) /
              256;

            const dy =
              (y - 256) /
              256;

            const distance =
              Math.sqrt(
                dx * dx +
                  dy * dy
              );

            const noiseA =
              Math.sin(
                x * 0.031 +
                  y * 0.013
              );

            const noiseB =
              Math.sin(
                x * 0.011 -
                  y * 0.027
              );

            const noise =
              (
                noiseA +
                noiseB +
                2
              ) /
              4;

            const strength =
              Math.max(
                0,
                1 -
                  distance *
                    1.35
              ) *
              (
                0.42 +
                noise *
                  0.58
              );

            const index =
              (y * 512 + x) *
              4;

            image.data[
              index
            ] =
              24 *
              strength;

            image.data[
              index + 1
            ] =
              52 *
              strength;

            image.data[
              index + 2
            ] =
              108 *
              strength;

            image.data[
              index + 3
            ] =
              72 *
              strength;
          }
        }

        ctx.putImageData(
          image,
          0,
          0
        );

        const texture =
          new THREE.CanvasTexture(
            canvas
          );

        texture.colorSpace =
          THREE.SRGBColorSpace;

        return texture;
      };

    const nebulaTexture =
      createNebulaTexture();

    let nebulaOne = null;
    let nebulaTwo = null;

    if (nebulaTexture) {
      const nebulaMaterial =
        new THREE.SpriteMaterial({
          map: nebulaTexture,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
          blending:
            THREE.AdditiveBlending,
        });

      nebulaOne =
        new THREE.Sprite(
          nebulaMaterial
        );

      nebulaOne.scale.set(
        70,
        42,
        1
      );

      nebulaOne.position.set(
        -35,
        16,
        -80
      );

      nebulaTwo =
        new THREE.Sprite(
          nebulaMaterial.clone()
        );

      nebulaTwo.material.opacity =
        0.055;

      nebulaTwo.scale.set(
        55,
        34,
        1
      );

      nebulaTwo.position.set(
        42,
        -18,
        -110
      );

      scene.add(
        nebulaOne,
        nebulaTwo
      );
    }

    /* =========================================================
       EARTH
       Existing Earth setup preserved.
    ========================================================= */

    const earthGroup =
      new THREE.Group();

    earthGroup.position.set(
      0,
      0,
      0
    );

    scene.add(earthGroup);

    const earthTexture =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
      );

    const earthNormal =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
      );

    const earthSpecular =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
      );

    const earthLights =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_lights_2048.png"
      );

    const earthGeometry =
      new THREE.SphereGeometry(
        4.6,
        128,
        128
      );

    const earthMaterial =
      new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: earthNormal,
        specularMap:
          earthSpecular,
        specular:
          new THREE.Color(
            0x777777
          ),
        shininess: 24,
      });

    const earth =
      new THREE.Mesh(
        earthGeometry,
        earthMaterial
      );

    earth.rotation.y =
      -0.6;

    earth.castShadow = true;
    earth.receiveShadow = true;

    earthGroup.add(earth);

    /* =========================================================
       EARTH NIGHT SIDE
    ========================================================= */

    const nightMaterial =
      new THREE.ShaderMaterial({
        uniforms: {
          uNightMap: {
            value: earthLights,
          },

          uSunDirection: {
            value:
              new THREE.Vector3(
                18,
                9,
                14
              ).normalize(),
          },
        },

        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldNormal;

          void main() {
            vUv = uv;

            vWorldNormal =
              normalize(
                mat3(modelMatrix) *
                normal
              );

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(
                position,
                1.0
              );
          }
        `,

        fragmentShader: `
          uniform sampler2D uNightMap;
          uniform vec3 uSunDirection;

          varying vec2 vUv;
          varying vec3 vWorldNormal;

          void main() {
            vec3 normal =
              normalize(
                vWorldNormal
              );

            float sunFacing =
              dot(
                normal,
                normalize(
                  uSunDirection
                )
              );

            float nightMask =
              1.0 -
              smoothstep(
                -0.16,
                0.12,
                sunFacing
              );

            vec4 city =
              texture2D(
                uNightMap,
                vUv
              );

            float alpha =
              city.a *
              city.r *
              0.72 *
              nightMask;

            gl_FragColor =
              vec4(
                city.rgb * 1.12,
                alpha
              );
          }
        `,

        transparent: true,
        blending:
          THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });

    const nightSide =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          4.615,
          128,
          128
        ),
        nightMaterial
      );

    nightSide.renderOrder = 2;

    earthGroup.add(
      nightSide
    );

    /* =========================================================
       EARTH CLOUDS
    ========================================================= */

    const cloudTexture =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
      );

    const cloudMaterial =
      new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      });

    const clouds =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          4.68,
          128,
          128
        ),
        cloudMaterial
      );

    earthGroup.add(
      clouds
    );

    /* =========================================================
       EARTH ATMOSPHERE
    ========================================================= */

    const atmosphereMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x5ba9ff,
        transparent: true,
        opacity: 0.105,
        side: THREE.BackSide,
        blending:
          THREE.AdditiveBlending,
        depthWrite: false,
      });

    const atmosphere =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          4.88,
          96,
          96
        ),
        atmosphereMaterial
      );

    earthGroup.add(
      atmosphere
    );

    /* =========================================================
       MOON
       Existing orbit preserved.
    ========================================================= */

    const moonOrbitGroup =
      new THREE.Group();

    moonOrbitGroup.rotation.z =
      -0.13;

    scene.add(
      moonOrbitGroup
    );

    const moonOrbitRadius =
      10.4;

    const moonTexture =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/moon_1024.jpg"
      );

    const moonMaterial =
      new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 1,
        metalness: 0,
      });

    const moon =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.28,
          96,
          96
        ),
        moonMaterial
      );

    moon.position.set(
      moonOrbitRadius,
      1.8,
      -1.5
    );

    moon.castShadow = true;
    moon.receiveShadow = true;

    moonOrbitGroup.add(
      moon
    );

    /* =========================================================
       MOON ORBIT INDICATOR
    ========================================================= */

    const moonOrbit =
      new THREE.Mesh(
        new THREE.RingGeometry(
          moonOrbitRadius -
            0.015,
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

    moonOrbit.rotation.x =
      Math.PI / 2;

    scene.add(
      moonOrbit
    );

    /* =========================================================
       NASA / ISS SATELLITE
       Preserved from previous version.
    ========================================================= */

    const issTextureLoader =
      new THREE.TextureLoader();

    const issTexture =
      issTextureLoader.load(
        "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/universe/2023/09/SpaceStation-1.png?crop=faces%2Cfocalpoint&fit=clip&h=3022&w=5250"
      );

    issTexture.colorSpace =
      THREE.SRGBColorSpace;

    const issMaterial =
      new THREE.SpriteMaterial({
        map: issTexture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: true,
      });

    const issSprite =
      new THREE.Sprite(
        issMaterial
      );

    issSprite.scale.set(
      4.8,
      2.76,
      1
    );

    scene.add(
      issSprite
    );

    let issOrbitAngle = 0;

    const issOrbitRadiusX =
      8.2;

    const issOrbitRadiusY =
      4.8;

    const issOrbitDepth =
      1.8;

    const updateISSOrbit =
      (elapsed) => {
        issOrbitAngle =
          elapsed * 0.28;

        const orbitX =
          Math.cos(
            issOrbitAngle
          ) *
          issOrbitRadiusX;

        const orbitY =
          Math.sin(
            issOrbitAngle
          ) *
            issOrbitRadiusY +
          0.4;

        const orbitZ =
          Math.sin(
            issOrbitAngle *
              1.15
          ) *
            issOrbitDepth -
          2.5;

        issSprite.position.x =
          orbitX;

        issSprite.position.y =
          orbitY;

        issSprite.position.z =
          orbitZ;

        issSprite.material.rotation =
          Math.sin(
            issOrbitAngle
          ) * 0.08;

        const depthScale =
          1 +
          Math.sin(
            issOrbitAngle
          ) * 0.08;

        issSprite.scale.set(
          4.8 * depthScale,
          2.76 * depthScale,
          1
        );
      };

    /* =========================================================
       MARS
       
       Only this distant planet is Mars.
       It stays in its own position.
       It rotates around its own Y axis only.
    ========================================================= */

    const marsTexture =
      textureLoader.load(
        "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/mars/preview.webp?w=2048"
      );

    marsTexture.colorSpace =
      THREE.SRGBColorSpace;

    marsTexture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    const marsMaterial =
      new THREE.MeshStandardMaterial({
        map: marsTexture,
        color: 0xffffff,
        roughness: 1,
        metalness: 0,
      });

    const distantPlanet =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          2.7,
          128,
          128
        ),
        marsMaterial
      );

    const positionMars =
      () => {
        const isMobile =
          window.innerWidth <=
          768;

        /*
          Mars remains separated from
          Earth/Moon/ISS while staying
          inside the visible frame.
        */

        if (isMobile) {
          distantPlanet.position.set(
            -5.8,
            -3.8,
            -24
          );
        } else {
          distantPlanet.position.set(
            -11.5,
            -5.5,
            -27
          );
        }
      };

    positionMars();

    distantPlanet.castShadow =
      true;

    distantPlanet.receiveShadow =
      true;

    scene.add(
      distantPlanet
    );

    /* =========================================================
       MARS ATMOSPHERE
    ========================================================= */

    const distantAtmosphere =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          2.79,
          96,
          96
        ),
        new THREE.MeshBasicMaterial({
          color: 0xb36b4a,
          transparent: true,
          opacity: 0.035,
          side: THREE.BackSide,
          blending:
            THREE.AdditiveBlending,
          depthWrite: false,
        })
      );

    distantPlanet.add(
      distantAtmosphere
    );

    /* =========================================================
       CAMERA INTERACTION
    ========================================================= */

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

    const setPointerTarget =
      (x, y) => {
        const safeX =
          THREE.MathUtils.clamp(
            x,
            -1,
            1
          );

        const safeY =
          THREE.MathUtils.clamp(
            y,
            -1,
            1
          );

        targetCamera.x =
          safeX * 1.35;

        targetCamera.y =
          1.2 -
          safeY * 0.85;

        targetCamera.lookX =
          safeX * 1.0;

        targetCamera.lookY =
          -safeY * 0.65;
      };

    const handleMouseMove =
      (event) => {
        setPointerTarget(
          (
            event.clientX /
              window.innerWidth -
            0.5
          ) * 2,

          (
            event.clientY /
              window.innerHeight -
            0.5
          ) * 2
        );
      };

    const handleTouchMove =
      (event) => {
        if (
          !event.touches ||
          !event.touches[0]
        ) {
          return;
        }

        const touch =
          event.touches[0];

        setPointerTarget(
          (
            touch.clientX /
              window.innerWidth -
            0.5
          ) * 2,

          (
            touch.clientY /
              window.innerHeight -
            0.5
          ) * 2
        );
      };

    const handleDeviceOrientation =
      (event) => {
        if (
          typeof event.gamma !==
            "number" ||
          typeof event.beta !==
            "number"
        ) {
          return;
        }

        const gamma =
          THREE.MathUtils.clamp(
            event.gamma / 35,
            -1,
            1
          );

        const beta =
          THREE.MathUtils.clamp(
            (event.beta - 45) /
              35,
            -1,
            1
          );

        setPointerTarget(
          gamma,
          beta
        );
      };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "touchmove",
      handleTouchMove,
      {
        passive: true,
      }
    );

    if (
      "DeviceOrientationEvent" in
      window
    ) {
      window.addEventListener(
        "deviceorientation",
        handleDeviceOrientation
      );
    }

    /* =========================================================
       ANIMATION
    ========================================================= */

    /*
      Use performance.now() instead of THREE.Clock.
      This removes the deprecated Clock warning.
    */

    const animationStart =
      performance.now();

    let animationId = null;

    const animate = (
      currentTime
    ) => {
      animationId =
        requestAnimationFrame(
          animate
        );

      const elapsed =
        (currentTime -
          animationStart) /
        1000;

      /* -----------------------------------------
         EARTH
      ----------------------------------------- */

      earth.rotation.y +=
        0.00055;

      /* -----------------------------------------
         CLOUDS
      ----------------------------------------- */

      clouds.rotation.y +=
        0.0008;

      /* -----------------------------------------
         EARTH NIGHT SIDE
      ----------------------------------------- */

      nightMaterial.uniforms.uSunDirection.value
        .copy(
          sunLight.position
        )
        .normalize();

      /* -----------------------------------------
         MOON
         Same invisible Sun creates the lighting
         and therefore the changing visible phase.
      ----------------------------------------- */

      moonOrbitGroup.rotation.y =
        elapsed * 0.025;

      moon.rotation.y +=
        0.0007;

      /* -----------------------------------------
         ISS
      ----------------------------------------- */

      updateISSOrbit(
        elapsed
      );

      /* -----------------------------------------
         MARS
         ONLY rotates on its own axis.
         Its position is never changed here.
      ----------------------------------------- */

      distantPlanet.rotation.y +=
        0.00035;

      /* -----------------------------------------
         NEBULA
      ----------------------------------------- */

      if (nebulaOne) {
        nebulaOne.material.rotation =
          Math.sin(
            elapsed * 0.025
          ) * 0.04;
      }

      if (nebulaTwo) {
        nebulaTwo.material.rotation =
          Math.cos(
            elapsed * 0.02
          ) * 0.035;
      }

      /* -----------------------------------------
         CAMERA SMOOTHING
      ----------------------------------------- */

      smoothCamera.x +=
        (
          targetCamera.x -
          smoothCamera.x
        ) * 0.028;

      smoothCamera.y +=
        (
          targetCamera.y -
          smoothCamera.y
        ) * 0.028;

      smoothCamera.lookX +=
        (
          targetCamera.lookX -
          smoothCamera.lookX
        ) * 0.028;

      smoothCamera.lookY +=
        (
          targetCamera.lookY -
          smoothCamera.lookY
        ) * 0.028;

      camera.position.x =
        smoothCamera.x;

      camera.position.y =
        smoothCamera.y;

      camera.position.z =
        cameraHome.z;

      camera.lookAt(
        smoothCamera.lookX,
        smoothCamera.lookY,
        0
      );

      renderer.render(
        scene,
        camera
      );
    };

    animate(
      performance.now()
    );

    /* =========================================================
       RESIZE
    ========================================================= */

    const handleResize =
      () => {
        camera.aspect =
          window.innerWidth /
          window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
          window.innerWidth,
          window.innerHeight
        );

        renderer.setPixelRatio(
          Math.min(
            window.devicePixelRatio ||
              1,
            2
          )
        );

        /*
          Update only Mars responsive
          placement.
        */

        positionMars();

        /*
          Keep star shader pixel ratio
          correct after resize.
        */

        const pixelRatio =
          Math.min(
            window.devicePixelRatio ||
              1,
            2
          );

        farStars.material.uniforms.uPixelRatio.value =
          pixelRatio;

        midStars.material.uniforms.uPixelRatio.value =
          pixelRatio;

        nearStars.material.uniforms.uPixelRatio.value =
          pixelRatio;
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    /* =========================================================
       CLEANUP
       
       IMPORTANT:
       No rocket event exists anymore.
       Therefore there is no handleRocketLaunch
       reference here.
    ========================================================= */

    return () => {
      if (
        animationId !== null
      ) {
        cancelAnimationFrame(
          animationId
        );
      }

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "touchmove",
        handleTouchMove
      );

      if (
        "DeviceOrientationEvent" in
        window
      ) {
        window.removeEventListener(
          "deviceorientation",
          handleDeviceOrientation
        );
      }

      window.removeEventListener(
        "resize",
        handleResize
      );

      /* Dispose renderer */

      renderer.dispose();

      /* Dispose star resources */

      farStars.geometry.dispose();
      farStars.material.dispose();

      midStars.geometry.dispose();
      midStars.material.dispose();

      nearStars.geometry.dispose();
      nearStars.material.dispose();

      /* Dispose Earth resources */

      earthGeometry.dispose();
      earthMaterial.dispose();

      nightSide.geometry.dispose();
      nightMaterial.dispose();

      cloudMaterial.dispose();
      clouds.geometry.dispose();

      atmosphereMaterial.dispose();
      atmosphere.geometry.dispose();

      /* Dispose Moon */

      moonMaterial.dispose();
      moon.geometry.dispose();

      moonOrbit.geometry.dispose();
      moonOrbit.material.dispose();

      /* Dispose ISS */

      issMaterial.dispose();

      /* Dispose Mars */

      marsMaterial.dispose();
      distantPlanet.geometry.dispose();

      distantAtmosphere.geometry.dispose();
      distantAtmosphere.material.dispose();

      /* Dispose nebula */

      if (nebulaOne) {
        nebulaOne.material.map?.dispose();
        nebulaOne.material.dispose();
      }

      if (nebulaTwo) {
        nebulaTwo.material.dispose();
      }

      /* Remove renderer */

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

/* =========================================================
   TIME / GREETING
========================================================= */

function getGreeting() {
  const hour =
    new Date().getHours();

  if (
    hour >= 5 &&
    hour < 12
  ) {
    return "Good Morning";
  }

  if (
    hour >= 12 &&
    hour < 17
  ) {
    return "Good Afternoon";
  }

  if (
    hour >= 17 &&
    hour < 21
  ) {
    return "Good Evening";
  }

  return "Good Night";
}

function formatTime(date) {
  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

function formatDate(date) {
  return date.toLocaleDateString(
    [],
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] =
    useState("Home");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(true);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const recognitionRef =
    useRef(null);

  /* =========================================================
     LIVE TIME
  ========================================================= */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* =========================================================
     SPEECH RECOGNITION
  ========================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-US";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.onstart =
      () => {
        setIsListening(
          true
        );
      };

    recognition.onend =
      () => {
        setIsListening(
          false
        );
      };

    recognition.onerror =
      () => {
        setIsListening(
          false
        );
      };

    recognition.onresult =
      (event) => {
        const transcript =
          event.results[0][0]
            .transcript;

        setMessage(
          transcript
        );
      };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        /* Already stopped */
      }
    };
  }, []);

  /* =========================================================
     TEXT TO SPEECH
  ========================================================= */

  const speakText =
    (text) => {
      if (
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      const voices =
        window.speechSynthesis.getVoices();

      const preferredVoice =
        voices.find(
          (voice) => {
            const name =
              voice.name.toLowerCase();

            return (
              voice.lang.startsWith(
                "en"
              ) &&
              (
                name.includes(
                  "female"
                ) ||
                name.includes(
                  "zira"
                ) ||
                name.includes(
                  "samantha"
                ) ||
                name.includes(
                  "aria"
                ) ||
                name.includes(
                  "jenny"
                )
              )
            );
          }
        );

      if (preferredVoice) {
        utterance.voice =
          preferredVoice;
      }

      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart =
        () => {
          setIsSpeaking(
            true
          );
        };

      utterance.onend =
        () => {
          setIsSpeaking(
            false
          );
        };

      utterance.onerror =
        () => {
          setIsSpeaking(
            false
          );
        };

      window.speechSynthesis.speak(
        utterance
      );
    };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage =
    async (
      customMessage
    ) => {
      const text =
        typeof customMessage ===
        "string"
          ? customMessage.trim()
          : message.trim();

      if (
        !text ||
        loading
      ) {
        return;
      }

      setActivePage(
        "AI Chat"
      );

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "user",
            text,
          },
        ]
      );

      setMessage("");

      setLoading(true);

      try {
        const response =
          await fetch(
            API_BASE +
              "/api/chat",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                message: text,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "AI response failed"
          );
        }

        const reply =
          data.reply ||
          "I received your message, but no response was returned.";

        setMessages(
          (previous) => [
            ...previous,
            {
              role: "ai",
              text: reply,
            },
          ]
        );

        speakText(reply);
      } catch (error) {
        console.error(
          "ShezoraX Chat Error:",
          error
        );

        const errorMessage =
          "I'm unable to connect to my AI service right now. Please check that the ShezoraX backend is running.";

        setMessages(
          (previous) => [
            ...previous,
            {
              role: "ai",
              text: errorMessage,
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     VOICE INPUT
  ========================================================= */

  const startListening =
    () => {
      if (
        !recognitionRef.current
      ) {
        alert(
          "Voice recognition is not supported in this browser."
        );

        return;
      }

      if (isListening) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* Already stopped */
        }

        return;
      }

      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(
          false
        );
      }
    };

  /* =========================================================
     STOP SPEAKING
  ========================================================= */

  const stopSpeaking =
    () => {
      if (
        "speechSynthesis" in
        window
      ) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(
        false
      );
    };

  /* =========================================================
     ENTER KEY
  ========================================================= */

  const handleKeyDown =
    (event) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }
    };

  /* =========================================================
     SUGGESTIONS
  ========================================================= */

  const suggestions = [
    "Explain something to me",
    "Help me plan my day",
    "Teach me about the universe",
    "Help me build a project",
  ];

  /* =========================================================
     MODULE RENDER
  ========================================================= */

  const renderModule =
    () => {
      if (
        activePage ===
        "Home"
      ) {
        return (
          <>
            <section className="hero-section">
              <div className="hero-content">
                <div className="status-pill">
                  <span className="status-dot" />
                  ShezoraX AI Online
                </div>

                <h1 className="greeting">
                  {getGreeting()},
                  Owais.
                </h1>

                <p className="hero-description">
                  Your intelligent
                  personal AI
                  workspace for
                  learning, creating,
                  exploring and
                  getting things done.
                </p>

                <div className="hero-time">
                  <strong>
                    {formatTime(
                      currentTime
                    )}
                  </strong>

                  <span>
                    {formatDate(
                      currentTime
                    )}
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
                      (isSpeaking
                        ? "active"
                        : "")
                    }
                    onClick={
                      isSpeaking
                        ? stopSpeaking
                        : startListening
                    }
                    type="button"
                  >
                    {isSpeaking
                      ? "Stop Voice"
                      : "Voice"}
                  </button>
                </div>

                <div className="conversation">
                  {messages.length ===
                    0 && (
                    <div className="empty-conversation">
                      <p>
                        Start a
                        conversation
                        with ShezoraX.
                      </p>
                    </div>
                  )}

                  {messages.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className={
                          "message-row " +
                          (item.role ===
                          "user"
                            ? "user-message"
                            : "ai-message")
                        }
                        key={index}
                      >
                        <div className="message-bubble">
                          {item.text}
                        </div>

                        {item.role ===
                          "ai" && (
                          <button
                            className="listen-button"
                            type="button"
                            onClick={() =>
                              speakText(
                                item.text
                              )
                            }
                          >
                            Listen
                          </button>
                        )}
                      </div>
                    )
                  )}

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
                    onChange={(
                      event
                    ) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
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
                        (isListening
                          ? "active"
                          : "")
                      }
                      onClick={
                        startListening
                      }
                    >
                      {isListening
                        ? "Listening"
                        : "Speak"}
                    </button>

                    <button
                      type="button"
                      className="send-button"
                      onClick={() =>
                        sendMessage()
                      }
                      disabled={
                        loading ||
                        !message.trim()
                      }
                      aria-label="Send message"
                      title="Send"
                    >
                      <span>
                        Send
                      </span>
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
                {suggestions.map(
                  (item) => (
                    <button
                      type="button"
                      className="suggestion-card"
                      key={item}
                      onClick={() =>
                        sendMessage(
                          item
                        )
                      }
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </section>
          </>
        );
      }

      if (
        activePage ===
        "AI Chat"
      ) {
        return (
          <section className="module-page">
            <div className="module-card">
              <span className="eyebrow">
                AI CHAT
              </span>

              <h1>
                Talk with ShezoraX
              </h1>

              <p>
                Ask questions,
                learn new concepts,
                plan projects or
                explore ideas through
                the AI assistant.
              </p>

              <button
                type="button"
                className="primary-module-button"
                onClick={() =>
                  setActivePage(
                    "Home"
                  )
                }
              >
                Open Chat
              </button>
            </div>
          </section>
        );
      }

      if (
        activePage ===
        "Create"
      ) {
        return (
          <section className="module-page">
            <div className="module-card">
              <span className="eyebrow">
                CREATE
              </span>

              <h1>
                Create with AI
              </h1>

              <p>
                Turn your ideas into
                websites, documents,
                concepts and creative
                projects.
              </p>
            </div>
          </section>
        );
      }

      if (
        activePage ===
        "Projects"
      ) {
        return (
          <section className="module-page">
            <div className="module-card">
              <span className="eyebrow">
                PROJECTS
              </span>

              <h1>
                Your Projects
              </h1>

              <p>
                Manage your personal
                AI projects and keep
                your work organized.
              </p>
            </div>
          </section>
        );
      }

      if (
        activePage ===
        "Knowledge"
      ) {
        return (
          <section className="module-page">
            <div className="module-card">
              <span className="eyebrow">
                KNOWLEDGE
              </span>

              <h1>
                Knowledge Universe
              </h1>

              <p>
                Explore science,
                technology, Earth,
                space, history,
                learning and more.
              </p>
            </div>
          </section>
        );
      }

      if (
        activePage ===
        "Settings"
      ) {
        return (
          <section className="module-page">
            <div className="module-card">
              <span className="eyebrow">
                SETTINGS
              </span>

              <h1>
                ShezoraX Settings
              </h1>

              <p>
                Customize your
                interface, voice and
                assistant experience.
              </p>

              <button
                type="button"
                className="primary-module-button"
                onClick={() =>
                  setDarkMode(
                    (previous) =>
                      !previous
                  )
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

  /* =========================================================
     MAIN APP UI
  ========================================================= */

  return (
    <div
      className={
        "app " +
        (darkMode
          ? "dark-mode"
          : "light-mode")
      }
    >
      <div className="real-universe-background">
        <SpaceScene />

        <div className="universe-overlay" />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-orbit">
            S
          </div>

          <div>
            <strong>
              ShezoraX
            </strong>

            <span>
              PERSONAL AI
            </span>
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
          ].map(
            (item) => (
              <button
                type="button"
                key={item}
                className={
                  activePage ===
                  item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActivePage(
                    item
                  )
                }
              >
                <span>
                  {item}
                </span>
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-status">
            <span className="status-dot" />

            <div>
              <strong>
                AI System
              </strong>

              <span>
                Online
              </span>
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

            <span>
              /
            </span>

            {activePage}
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={() =>
                setActivePage(
                  "AI Chat"
                )
              }
            >
              Search
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePage(
                  "Knowledge"
                )
              }
            >
              Knowledge
            </button>

            <button
              type="button"
              onClick={() =>
                setDarkMode(
                  (previous) =>
                    !previous
                )
              }
            >
              {darkMode
                ? "Light"
                : "Dark"}
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
