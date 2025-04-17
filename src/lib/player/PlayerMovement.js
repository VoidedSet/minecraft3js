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
        this.canJump = false;
        this.isSprinting = false;
        this.isDescending = false;

        this.wantsToJump = false;

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

        // Jump logic
        if (this.wantsToJump && this.player.onGround) {
            this.velocity.y = Math.max(this.velocity.y, 5);
            this.wantsToJump = false;
            this.player.onGround = false; // force off-ground to avoid double jumping
        }

        // Gravity
        if (!this.player.onGround) {
            this.velocity.y -= 12 * delta;
        } else if (this.isDescending) {
            this.velocity.y = -5;
        }

        // Smooth stop
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Movement direction
        direction.set(0, 0, 0);
        if (this.moveForward) direction.z += 1;
        if (this.moveBackward) direction.z -= 1;
        if (this.moveLeft) direction.x -= 1;
        if (this.moveRight) direction.x += 1;
        direction.normalize();

        // Get camera yaw
        const cameraYaw = new THREE.Vector3();
        this.player.camera.getWorldDirection(cameraYaw);
        cameraYaw.y = 0;
        cameraYaw.normalize();

        const right = new THREE.Vector3().crossVectors(cameraYaw, new THREE.Vector3(0, 1, 0)).normalize();
        const speed = 55 * (this.isSprinting ? 1.5 : 1);

        // Apply velocity
        velocity.addScaledVector(cameraYaw, direction.z * speed * delta);
        velocity.addScaledVector(right, direction.x * speed * delta);

        // Collision + ground detection
        this.player.physics.update(velocity);

        // Apply movement
        this.player.position.addScaledVector(velocity, delta);

        // Update camera position
        this.player.controls.object.position.copy(this.player.position).sub(new THREE.Vector3(0, 0.4, 0));
    }
}
