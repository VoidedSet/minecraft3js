import * as THREE from 'three';

export class PlayerMovement {
    constructor(player) {
        this.player = player;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.wantsToJump = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isFlying = false;

        this.lastSpacePress = 0;
        this.initInput();
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.code === 'KeyW') {
                event.preventDefault();
            }

            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'KeyQ': this.player.cycleMode(); break;
                case 'ControlLeft': this.isSprinting = true; break;
                case 'ShiftLeft': this.isCrouching = true; break;
                case 'Space': this.handleSpaceDown(); break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ControlLeft': this.isSprinting = false; break;
                case 'ShiftLeft': this.isCrouching = false; break;
                case 'Space': this.wantsToJump = false; break;
            }
        });
    }

    handleSpaceDown() {
        const now = performance.now();
        if (now - this.lastSpacePress < 300 && this.player.mode === 'creative') {
            this.isFlying = !this.isFlying;
            this.velocity.y = 0;
        }
        this.lastSpacePress = now;
        this.wantsToJump = true;
    }

    update(delta) {
        const velocity = this.velocity;
        const camDir = new THREE.Vector3();
        this.player.camera.getWorldDirection(camDir);

        const forward = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        this.direction.set(0, 0, 0);
        if (this.moveForward) this.direction.z += 1;
        if (this.moveBackward) this.direction.z -= 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;
        this.direction.normalize();

        const speed = 55 * (this.isSprinting ? 1.6 : this.isCrouching ? 0.6 : 1);

        if (this.isFlying || this.player.mode === 'spectator') {
            velocity.set(0, 0, 0);

            velocity.addScaledVector(camDir, this.direction.z * speed * delta);
            velocity.addScaledVector(right, this.direction.x * speed * delta);

            if (this.wantsToJump) velocity.y += (speed * 0.5) * delta;
            if (this.isCrouching) velocity.y -= (speed * 0.5) * delta;

            this.player.position.add(velocity);
            this.player.controls.object.position.copy(this.player.position).sub(new THREE.Vector3(0, 0.4, 0));
        } else {
            velocity.y -= 18 * delta;
            if (this.player.onGround && velocity.y < 0) velocity.y = 0;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.addScaledVector(forward, this.direction.z * speed * delta);
            velocity.addScaledVector(right, this.direction.x * speed * delta);

            if (this.wantsToJump && this.player.onGround) {
                velocity.y = 6.5;
                this.wantsToJump = false;
            }

            this.player.position.addScaledVector(velocity, delta);
            this.player.physics.update(velocity);
            this.player.controls.object.position.copy(this.player.position).sub(new THREE.Vector3(0, 0.4, 0));
        }
    }
}