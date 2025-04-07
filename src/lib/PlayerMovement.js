import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BlockDict } from './Blocks';

export class Player {
    constructor(scene, camera, chunkManager) {
        this.scene = scene;
        this.camera = camera;
        this.chunkManager = chunkManager;
        this.debugRay = false;

        this.controls = new PointerLockControls(camera, document.body);
        this.controls.object.position.set(0, 0, 0);
        scene.add(this.controls.object);
        this.position = this.controls.object.position;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.hotbar = [1, 2, 3, 3, 6, 6, 7, 8, 9];
        this.selectedSlot = 0;
        this.maxSlots = 9;


        this.initUI();
        this.initInput();
        this.initHotbarScroll();
        this.updateHotbarUI();
    }

    initUI() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        const crosshair = document.getElementById('crosshair');

        instructions.addEventListener('click', () => this.controls.lock());

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
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 50;
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft':
                    this.velocity.y -= 50;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.velocity.y -= 50; break;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) return;

            const maxDistance = 8;
            const stepSize = 0.1;

            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            const origin = this.camera.position.clone();

            let lastBlockPos = null;

            for (let d = 0; d < maxDistance; d += stepSize) {
                const pos = origin.clone().addScaledVector(direction, d);
                const blockPos = this.smartFloor(pos, direction);

                if (!blockPos || !lastBlockPos || !blockPos.equals(lastBlockPos)) {
                    lastBlockPos = blockPos.clone();

                    const blockId = this.chunkManager.returnBlockId(blockPos);
                    if (blockId !== 0) {
                        const placePos = blockPos.clone().add(direction.clone().negate().normalize()).floor();

                        if (!placePos || isNaN(placePos.x)) {
                            console.warn("Invalid placePos:", placePos);
                            return;
                        }

                        switch (event.button) {
                            case 0: // Left-click: place
                                this.chunkManager.placeBlockAt(this.hotbar[this.selectedSlot], placePos);
                                break;

                            case 1: // Middle-click: pick
                                this.hotbar[this.selectedSlot] = blockId;
                                this.updateHotbarUI?.();
                                break;

                            case 2: // Right-click: break
                                this.chunkManager.placeBlockAt(0, blockPos);
                                break;
                        }
                        break;
                    }
                }
            }
        });
    }

    smartFloor(pos, dir) {
        return new THREE.Vector3(
            dir.x < 0 ? Math.ceil(pos.x) - 1 : Math.floor(pos.x),
            dir.y < 0 ? Math.ceil(pos.y) - 1 : Math.floor(pos.y),
            dir.z < 0 ? Math.ceil(pos.z) - 1 : Math.floor(pos.z)
        );
    }

    initHotbarScroll() {
        window.addEventListener('wheel', (event) => {
            this.selectedSlot = (this.selectedSlot + (event.deltaY > 0 ? 1 : -1) + this.maxSlots) % this.maxSlots;
            this.updateHotbarUI();
        });
    }
    fillHotbar() {
        const blockValues = Object.values(BlockDict);
        for (let i = 0; i < this.maxSlots; i++) {
            this.hotbar[i] = blockValues[i % blockValues.length].id;
        }
        this.updateHotbarUI();
    }

    updateHotbarUI() {
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.getElementById(`slot${i + 1}`);
            const icon = document.getElementById(`icon${i + 1}`);

            const blockId = this.hotbar[i];
            const blockData = blockId != null
                ? Object.values(BlockDict).find(b => b.id === blockId)
                : null;

            if (slot) {
                slot.style.borderWidth = i === this.selectedSlot ? "3px" : "2px";
                slot.style.borderColor = i === this.selectedSlot ? "black" : "white";
            }

            if (icon) {
                if (blockData && blockData.uv && blockData.uv.top) {
                    const [u, v] = blockData.uv.top;
                    const texSize = 16;
                    icon.style.backgroundImage = "url('blocks.png')";
                    icon.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
                } else {
                    icon.style.backgroundImage = '';
                    icon.style.backgroundPosition = '';
                }
            }
        }
    }




    update(delta, blockId) {
        const velocity = this.velocity;
        const direction = this.direction;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(this.moveForward) - Number(this.moveBackward);
        direction.x = Number(this.moveRight) - Number(this.moveLeft);
        direction.normalize();

        if (this.moveForward || this.moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight) velocity.x -= direction.x * 400.0 * delta;

        this.controls.moveRight(-velocity.x * delta);
        this.controls.moveForward(-velocity.z * delta);
        this.position.y += velocity.y * delta;

        const blockEntry = Object.values(BlockDict).find(b => b.id === blockId);
        if ((blockEntry?.isSolid) || this.position.y < 10) {
            velocity.y = 0;
            this.position.y = Math.max(this.position.y, 10);
            this.canJump = true;
        }
    }

    getControls() {
        return this.controls;
    }
}
