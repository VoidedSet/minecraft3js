import * as THREE from 'three';

export class Environment {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.time = 0; // 0 to 1 = full day-night cycle

        // Enable shadows in renderer
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Ambient light
        this.ambient = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(this.ambient);

        // Directional sun light
        this.sun = new THREE.DirectionalLight(0xffffff, 1);
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

        // Moon sprite (optional)
        this.moon = new THREE.Sprite(new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true
        }));
        this.moon.scale.set(8, 8, 1);
        // scene.add(this.moon); // Keep commented if not used

        // Simple fog setup
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.25);
    }

    update(delta, playerPosition) {
        this.time += delta * 0.01;
        this.time %= 1;

        const angle = this.time * Math.PI * 2;
        const center = playerPosition;

        const sunX = Math.cos(angle) * 75;
        const sunY = Math.sin(angle) * 75;
        const moonX = Math.cos(angle + Math.PI) * 75;
        const moonY = Math.sin(angle + Math.PI) * 75;

        this.sun.position.set(center.x + sunX, center.y + sunY, center.z);
        this.sun.target.position.set(center.x, center.y, center.z);
        this.sun.target.updateMatrixWorld();

        this.moon.position.set(center.x + moonX, center.y + moonY, center.z);

        // Daylight logic
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

        this.ambient.intensity = THREE.MathUtils.lerp(0.1, 0.6, lightFactor);
        this.sun.intensity = THREE.MathUtils.lerp(0.0, 2.0, lightFactor);

        // Fog color transition
        const nightColor = new THREE.Color(0x000000);
        const dayColor = new THREE.Color(0x87ceeb);
        const sunsetColor = new THREE.Color(0xff8c42);

        const baseFog = new THREE.Color().lerpColors(nightColor, dayColor, lightFactor);
        const finalFog = baseFog.lerp(sunsetColor, sunsetFactor);

        this.scene.fog.color.copy(finalFog);
        this.scene.fog.density = THREE.MathUtils.lerp(0.03, 0.007, lightFactor);
        this.renderer.setClearColor(finalFog);

        // Moon visibility
        this.moon.material.opacity = this.time > 0.5 ? 1 - lightFactor : lightFactor;
    }
}
