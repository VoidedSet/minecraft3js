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
        this.isDescending = false;
        this.isFlying = false;

        this.initInput();
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space': this.wantsToJump = true; break;
                case 'ShiftLeft': this.isDescending = true; break;
                case 'ControlLeft': this.isSprinting = true; break;
                case 'KeyQ': this.isFlying = !this.isFlying; break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.isDescending = false; break;
                case 'ControlLeft': this.isSprinting = false; break;
            }
        });
    }

    update(delta) {
        const velocity = this.velocity;
        const direction = this.direction;

        const camDir = new THREE.Vector3();
        this.player.camera.getWorldDirection(camDir);
        camDir.normalize();

        const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        // Clear direction every frame
        direction.set(0, 0, 0);
        if (this.moveForward) direction.z += 1;
        if (this.moveBackward) direction.z -= 1;
        if (this.moveLeft) direction.x -= 1;
        if (this.moveRight) direction.x += 1;

        direction.normalize();

        // Movement speed
        const speed = 55 * (this.isSprinting ? 1.5 : 1);

        if (this.isFlying) {
            // Reset velocity
            velocity.set(0, 0, 0);

            // Fly in camera direction
            velocity.addScaledVector(camDir, direction.z * speed * delta);
            velocity.addScaledVector(right, direction.x * speed * delta);

            // Vertical control
            if (this.wantsToJump) velocity.y += speed * delta;
            if (this.isDescending) velocity.y -= speed * delta;

            // Apply
            this.player.position.add(velocity);
            this.player.controls.object.position.copy(this.player.position).sub(new THREE.Vector3(0, 0.4, 0));

            // Reset jump
            this.wantsToJump = false;

        } else {
            // Not flying = grounded movement
            if (this.wantsToJump && this.player.onGround) {
                velocity.y = 5;
                this.wantsToJump = false;
            }

            velocity.y -= 12 * delta; // Gravity
            if (this.player.onGround && velocity.y < 0) velocity.y = 0;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.addScaledVector(camDir, direction.z * speed * delta);
            velocity.addScaledVector(right, direction.x * speed * delta);

            this.player.position.addScaledVector(velocity, delta);
            this.player.physics.update(velocity);
            this.player.controls.object.position.copy(this.player.position).sub(new THREE.Vector3(0, 0.4, 0));
        }
    }
}
