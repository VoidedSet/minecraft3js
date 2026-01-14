import * as THREE from 'three';
import { PlayerPhysics } from '../player/PlayerPhysics.js';

export class BaseMob {
    constructor(world, startPos, config) {
        this.world = world;
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.onGround = false;

        this.config = config;
        this.health = config.health;
        this.walkSpeed = config.walk_speed;
        this.runSpeed = config.run_speed;

        const { width, height, depth } = config.collider;
        this.collider = {
            size: new THREE.Vector3(width, height, depth),
            offset: new THREE.Vector3(0, -height / 2, 0)
        };

        this.physics = new PlayerPhysics(this, world.chunkManager);
        this.physics.collider = this.collider;

        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.isDead = false;
        this.isBaby = false;

        this.buildMesh(config);
    }

    buildMesh(config) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);

        const { width, height, depth } = config.collider;

        if (config.model === 'quadruped') {
            this.buildQuadruped(width, height, depth, config.colors);
        } else if (config.model === 'humanoid') {
            this.buildHumanoid(width, height, depth, config.colors);
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

    buildQuadruped(w, h, d, colors) {
        const material = new THREE.MeshLambertMaterial({ color: colors.body });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.6, d), material);
        body.position.y = h * 0.7;
        this.mesh.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material);
        head.position.set(0, h * 0.9, d * 0.5);
        this.mesh.add(head);
        const legGeo = new THREE.BoxGeometry(0.25, h * 0.4, 0.25);
        [[-0.3, 0.4], [0.3, 0.4], [-0.3, -0.4], [0.3, -0.4]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, material);
            leg.position.set(x, h * 0.2, z);
            this.mesh.add(leg);
        });
    }

    buildHumanoid(w, h, d, colors) {
        const skin = new THREE.MeshLambertMaterial({ color: colors.skin });
        const shirt = new THREE.MeshLambertMaterial({ color: colors.shirt });
        const pants = new THREE.MeshLambertMaterial({ color: colors.pants });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skin);
        head.position.y = h * 0.9;
        this.mesh.add(head);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), shirt);
        body.position.y = h * 0.6;
        this.mesh.add(body);
        const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const leftArm = new THREE.Mesh(armGeo, skin);
        leftArm.position.set(-0.4, h * 0.7, 0.4);
        leftArm.rotation.x = -Math.PI / 2;
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, skin);
        rightArm.position.set(0.4, h * 0.7, 0.4);
        rightArm.rotation.x = -Math.PI / 2;
        this.mesh.add(rightArm);
        const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const leftLeg = new THREE.Mesh(legGeo, pants);
        leftLeg.position.set(-0.15, 0.4, 0);
        this.mesh.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, pants);
        rightLeg.position.set(0.15, 0.4, 0);
        this.mesh.add(rightLeg);
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
        if (new THREE.Vector2(this.velocity.x, this.velocity.z).length() > 0.1) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
        }
    }

    takeDamage(amount, attackerPos) {
        if (this.isDead) return;

        this.health -= amount;

        // 1. Knockback Calculation
        const knockbackDir = new THREE.Vector3()
            .subVectors(this.position, attackerPos) // Direction AWAY from attacker
            .normalize();

        this.velocity.x += knockbackDir.x * 6; // Horizontal force
        this.velocity.y += 4;                  // Vertical hop
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
                const oldColor = child.material.color.getHex();
                console.log(oldColor)
                child.material.color.setHex(0xff0000);
                setTimeout(() => {
                    if (child.material) child.material.color.setHex(0xffffff);
                }, 200);
            }
        });
    }

    die() {
        this.isDead = true;
        this.world.scene.remove(this.mesh);
    }
}