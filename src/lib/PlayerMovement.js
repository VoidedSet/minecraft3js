import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BlockDict } from './Blocks';

export class Player {
    constructor(scene, camera) {


        this.camera = camera;
        this.scene = scene;
        this.controls = new PointerLockControls(camera, document.body);
        this.controls.object.position.set(0, 20, 0); // Start 20 units high

        this.position = this.controls.object.position;

        // UI elements
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');

        instructions.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
        });

        scene.add(this.controls.object);

        // Movement variables
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.initInput();
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 350;
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft':
                    this.velocity.y -= 350;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });
    }

    update(delta, blockId) {
        const velocity = this.velocity;
        const direction = this.direction;

        // Apply friction
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Apply gravity
        // velocity.y -= 9.8 * 1 * delta;

        // Input direction
        direction.z = Number(this.moveForward) - Number(this.moveBackward);
        direction.x = Number(this.moveRight) - Number(this.moveLeft);
        direction.normalize();

        if (this.moveForward || this.moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight) velocity.x -= direction.x * 400.0 * delta;

        this.controls.moveRight(-velocity.x * delta);
        this.controls.moveForward(-velocity.z * delta);

        this.position = this.controls.object.position;
        this.position.y += velocity.y * delta;

        // Get the block object from BlockDict using blockId
        const blockEntry = Object.values(BlockDict).find(b => b.id === blockId);

        // Simple ground collision if block is solid
        if ((blockEntry && blockEntry.isSolid) || this.position.y < 10) {
            velocity.y = 0;
            this.position.y = Math.max(this.position.y, 10); // don't let player fall below Y=10
            this.canJump = true;
        }
    }

    getControls() {
        return this.controls;
    }
}
