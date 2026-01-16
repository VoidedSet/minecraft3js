import * as THREE from 'three';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { Mobs } from './Mobs.js';

export class BaseMob {
    constructor(world, startPos, config, model) {
        this.world = world;
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.onGround = false;

        this.config = config;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.walkSpeed = config.walk_speed;
        this.runSpeed = config.run_speed;

        const { width, height, depth } = config.collider;
        this.collider = {
            size: new THREE.Vector3(width, height, depth),
            offset: new THREE.Vector3(0, -height / 2, 0)
        };

        this.physics = new PlayerPhysics(this, world.chunkManager);
        this.physics.collider = this.collider;

        this.isDead = false;
        this.isBaby = false;
        this.hasInteracted = false;

        this.buildMesh(config, model);
    }


    buildMesh(config, modelTemplate) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);

        const { width, height, depth } = config.collider;

        if (modelTemplate) {
            const model = modelTemplate.clone();

            model.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = false;
                        child.material.alphaTest = 0.5;
                        child.material.depthWrite = true;
                        child.material.side = THREE.FrontSide;
                    }
                }
            });

            this.mesh.add(model);
        }

        const hitboxGeo = new THREE.BoxGeometry(width, height, depth);
        const hitboxMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            visible: false
        });

        this.hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        this.hitbox.position.copy(this.collider.offset).negate();
        this.hitbox.userData.mobInstance = this;
        this.hitbox.name = "Hitbox";

        this.mesh.add(this.hitbox);
    }

    setFocused(isFocused) {
        if (this.hitbox) {
            this.hitbox.material.visible = isFocused;
        }
    }

    updatePhysics(delta) {
        this.velocity.y -= 18 * delta;
        if (this.onGround && this.velocity.y < 0) this.velocity.y = 0;
        this.position.addScaledVector(this.velocity, delta);
        this.physics.update(this.velocity);
        const friction = this.onGround ? 6.0 : 0.1;
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.z -= this.velocity.z * friction * delta;
        this.mesh.position.copy(this.position);

        // Simple rotation based on movement
        if (new THREE.Vector2(this.velocity.x, this.velocity.z).length() > 0.1) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
        }
    }

    takeDamage(amount, attackerPos) {
        if (this.isDead) return;

        this.health -= amount;

        // Knockback
        const knockbackDir = new THREE.Vector3()
            .subVectors(this.position, attackerPos)
            .normalize();

        this.velocity.x += knockbackDir.x * 6;
        this.velocity.y += 4;
        this.velocity.z += knockbackDir.z * 6;
        this.onGround = false;

        this.flashRed();

        if (this.health <= 0) {
            this.die();
        }
    }

    flashRed() {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.add(new THREE.Color("rgb(255, 0, 0)"));
                setTimeout(() => {
                    if (child.material) child.material.color.sub(new THREE.Color("rgb(255, 0, 0)"));
                }, 200);
            }
        });
    }

    die() {
        this.isDead = true;
        this.world.scene.remove(this.mesh);
    }
}