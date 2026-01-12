import * as THREE from 'three';

export class Environment {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.time = 0; // 0 to 1 = full day-night cycle
        this.dimension = 'overworld';

        // Enable shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // --- Lights ---
        this.ambient = new THREE.AmbientLight(0xcccccc, 0.1);
        scene.add(this.ambient);

        this.sun = new THREE.DirectionalLight(0xffaff5, 1);
        this.sun.position.set(0, 100, 0);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(2048, 2048);
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 300;
        this.sun.shadow.camera.left = -150;
        this.sun.shadow.camera.right = 150;
        this.sun.shadow.camera.top = 150;
        this.sun.shadow.camera.bottom = -150;
        scene.add(this.sun);
        scene.add(this.sun.target);

        // --- Fog ---
        this.netherFogColor = 0x300505;
        this.scene.fog = new THREE.FogExp2(this.netherFogColor, 0.02);

        // --- Nether Particles ---
        this.particles = null;
        this.initNetherParticles();
    }

    initNetherParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];

        const color1 = new THREE.Color(0xaaaaaa); // Ash (Grey)
        const color2 = new THREE.Color(0xff4400); // Ember (Orange/Red)

        for (let i = 0; i < particleCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 100
            );

            velocities.push(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );

            const isEmber = Math.random() > 0.8;
            const col = isEmber ? color2 : color1;
            colors.push(col.r, col.g, col.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.userData = { velocities: velocities };

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.visible = false;
        this.particles.frustumCulled = false;
        this.scene.add(this.particles);
    }

    setDimension(dimension) {
        this.dimension = dimension;

        if (this.dimension === 'nether') {
            // --- NETHER SETTINGS ---
            this.renderer.setClearColor(0x200505);
            this.scene.fog = new THREE.FogExp2(0x300505, 0.02);

            // Set Lights to Nether Pink/Red
            this.ambient.color.setHex(0xcccccc);
            this.ambient.intensity = 0.4;
            this.sun.color.setHex(0xffaff5);
            this.sun.intensity = 1;

            if (this.particles) this.particles.visible = true;

        } else {
            // --- OVERWORLD SETTINGS ---
            // [FIX] Reset Sun and Ambient to White so they aren't pink
            this.sun.color.setHex(0xffffff);
            this.ambient.color.setHex(0xffffff);

            if (this.particles) this.particles.visible = false;
        }
    }

    update(delta, playerPosition) {
        const center = playerPosition;

        if (this.dimension === 'overworld') {
            // --- OVERWORLD DAYLIGHT CYCLE ---
            this.time += delta * 0.002;
            this.time %= 1;

            const angle = this.time * Math.PI * 2;
            const sunX = Math.cos(angle) * 75;
            const sunY = Math.sin(angle) * 75;

            this.sun.position.set(center.x + sunX, center.y + sunY, center.z);
            this.sun.target.position.set(center.x, center.y, center.z);
            this.sun.target.updateMatrixWorld();

            let lightFactor, sunsetFactor = 0;

            if (this.time < 0.1) {
                lightFactor = THREE.MathUtils.smoothstep(this.time, 0.0, 0.1);
                sunsetFactor = 1 - Math.abs((this.time - 0.05) / 0.05);
            } else if (this.time < 0.5) {
                lightFactor = 1;
            } else if (this.time < 0.6) {
                lightFactor = 1 - THREE.MathUtils.smoothstep(this.time, 0.5, 0.6);
                sunsetFactor = 1 - Math.abs((this.time - 0.55) / 0.05);
            } else {
                lightFactor = 0;
            }

            this.ambient.intensity = THREE.MathUtils.lerp(0.15, 0.6, lightFactor);
            this.sun.intensity = THREE.MathUtils.lerp(0.0, 2.0, lightFactor);

            const nightColor = new THREE.Color(0x000000);
            const dayColor = new THREE.Color(0x87ceeb);
            const sunsetColor = new THREE.Color(0xff8c42);

            const baseFog = new THREE.Color().lerpColors(nightColor, dayColor, lightFactor);
            const finalFog = baseFog.lerp(sunsetColor, sunsetFactor);

            if (this.scene.fog instanceof THREE.FogExp2) {
                this.scene.fog.color.copy(finalFog);
                this.scene.fog.density = THREE.MathUtils.lerp(0.02, 0.009, lightFactor);
            } else {
                this.scene.fog = new THREE.FogExp2(finalFog, 0.009);
            }

            if (this.time === 0) {
                this.renderer.setClearColor(0x00001f);
            } else {
                this.renderer.setClearColor(finalFog);
            }

        } else {
            // --- NETHER UPDATE ---
            this.sun.position.set(center.x + 50, center.y + 100, center.z + 50);
            this.sun.target.position.set(center.x, center.y, center.z);
            this.sun.target.updateMatrixWorld();

            if (this.particles) {
                const positions = this.particles.geometry.attributes.position.array;
                const velocities = this.particles.geometry.userData.velocities;

                const rangeH = 50;
                const rangeV = 30;
                const sizeH = rangeH * 2;
                const sizeV = rangeV * 2;

                for (let i = 0; i < positions.length / 3; i++) {
                    const ix = i * 3;
                    const iy = i * 3 + 1;
                    const iz = i * 3 + 2;

                    positions[ix] += velocities[ix];
                    positions[iy] += velocities[iy];
                    positions[iz] += velocities[iz];

                    // Wrap X
                    const dx = positions[ix] - (center.x - rangeH);
                    positions[ix] = (center.x - rangeH) + ((dx % sizeH) + sizeH) % sizeH;

                    // Wrap Y
                    const dy = positions[iy] - (center.y - rangeV);
                    positions[iy] = (center.y - rangeV) + ((dy % sizeV) + sizeV) % sizeV;

                    // Wrap Z
                    const dz = positions[iz] - (center.z - rangeH);
                    positions[iz] = (center.z - rangeH) + ((dz % sizeH) + sizeH) % sizeH;
                }

                this.particles.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
}