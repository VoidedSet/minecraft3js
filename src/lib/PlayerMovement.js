import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BlockDict } from './Blocks';

export class Player {
    constructor(scene, camera, chunkManager) {


        this.camera = camera;
        this.scene = scene;
        this.controls = new PointerLockControls(camera, document.body);
        this.controls.object.position.set(0, 20, 0); // Start 20 units high

        this.position = this.controls.object.position;

        // UI elements
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        const crosshair = document.getElementById('crosshair')

        instructions.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
            crosshair.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
            crosshair.style.display = 'none';
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

        this.hotbar = [9, 2, 4, 1, 3, 1, 1, 5, 6];
        this.selectedSlot = 0; // default to first slot
        this.maxSlots = 9;
        this.updateHotbarUI();
        this.initHotbarScroll();

        this.initInput();

        this.chunkManager = chunkManager;
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
                        this.velocity.y += 50;
                        this.canJump = false;
                        console.log(this.controls.object.position)
                    }
                    break;
                case 'ShiftLeft':
                    this.velocity.y -= 50;
                    break;
            }
        });
        document.addEventListener('mousedown', (event) => {
            if (this.controls.isLocked && event.button === 0) {
                const blockId = this.hotbar[this.selectedSlot];
                console.log("Place block with ID:", blockId);
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); // center of screen

                const intersects = raycaster.intersectObjects(this.scene.children, true); // true = recursive

                if (intersects.length > 0) {
                    const hit = intersects[0];

                    // Get the block position that was hit
                    const point = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
                    const targetPosition = new THREE.Vector3(
                        Math.floor(point.x),
                        Math.floor(point.y),
                        Math.floor(point.z)
                    );

                    const blockId = this.hotbar[this.selectedSlot];

                    // Call your custom block placing method
                    // this.placeBlock(targetPosition, blockId);
                    console.log(`Placing block ID ${blockId} at`, targetPosition);

                    this.chunkManager.placeBlockAt(blockId, targetPosition)
                }
            }
            if (this.controls.isLocked && event.button === 2) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); // center of screen

                const intersects = raycaster.intersectObjects(this.scene.children, true); // true = recursive

                if (intersects.length > 0) {
                    const hit = intersects[0];

                    // Get the block position that was hit
                    const point = hit.point.clone(); // ❌ don't add face.normal here
                    const targetPosition = new THREE.Vector3(
                        Math.floor(point.x),
                        Math.floor(point.y),
                        Math.floor(point.z));

                    const blockId = 0;

                    // Call your custom block placing method
                    // this.placeBlock(targetPosition, blockId);
                    console.log(`Placing block ID ${blockId} at`, targetPosition);

                    this.chunkManager.placeBlockAt(blockId, targetPosition)
                }
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
                case 'ShiftLeft':
                    this.velocity.y -= 50;
                    break;
            }
        });
    }
    initHotbarScroll() {
        window.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
                this.selectedSlot = (this.selectedSlot + 1) % this.maxSlots;
            } else {
                this.selectedSlot = (this.selectedSlot - 1 + this.maxSlots) % this.maxSlots;
            }
            this.updateHotbarUI();
        });
    }
    updateHotbarUI() {
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.getElementById(`slot${i + 1}`);
            if (slot) {
                slot.style.borderWidth = i === this.selectedSlot ? "3px" : "2px";
                slot.style.borderColor = i === this.selectedSlot ? "black" : "white";
            }
        }
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
