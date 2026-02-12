import { CONFIG } from '../Config.js';

export class PostProcessSystem {
    constructor() {
        this.glitchPass = null;
        this.asciiPass = null;

        this.glitchTimer = 0;
        this.glitchPhase = 0; // 0: None, 1: Wild, 2: Decay, 3: Echo
        this.asciiDurationTimer = 0;

        this.shortBurst = false; // Deterministic glitch flag

        this.forced = {
            glitch: false,
            wild: false,
            ascii: false
        };
    }

    setPasses(glitchPass, asciiPass) {
        this.glitchPass = glitchPass;
        this.asciiPass = asciiPass;
    }

    update(deltaTime) {
        // Manual override check
        if (this.forced.glitch || this.forced.ascii) {
            if (this.glitchPass) {
                this.glitchPass.enabled = this.forced.glitch;
                this.glitchPass.goWild = this.forced.wild;
            }
            if (this.asciiPass) {
                this.asciiPass.enabled = this.forced.ascii;
            }
            return; // SKIP AUTOMATION
        }

        if (this.glitchTimer > 0) {
            this.glitchTimer -= deltaTime;

            // Handle ASCII Duration
            if (this.asciiDurationTimer > 0) {
                this.asciiDurationTimer -= deltaTime;
                if (this.asciiPass) this.asciiPass.enabled = true;
            } else {
                if (this.asciiPass) this.asciiPass.enabled = false;
            }

            // Phase 0: SHORT BURST (Deterministic)
            if (this.shortBurst) {
                if (this.glitchPass) {
                    this.glitchPass.enabled = true;
                    this.glitchPass.goWild = true;
                }
                return;
            }

            // Phase 1: IMPACT - Total Chaos
            if (this.glitchTimer > (CONFIG.GLITCH.PHASE_2_DURATION + CONFIG.GLITCH.PHASE_3_DURATION)) {
                this.glitchPhase = 1;
                // High probability in Phase 1
                if (this.glitchPass) {
                    // Drastically Reduced Density: 20% chance to be active (Clean Strobe)
                    const active = Math.random() < 0.4;
                    this.glitchPass.enabled = active;
                    if (active) {
                        this.glitchPass.goWild = (Math.random() < 0.8);
                    }
                }
                // Trigger ASCII with high probability
                if (this.asciiDurationTimer <= 0 && this.asciiPass) {
                    // Tuned: 10% chance (Less invasive)
                    if (Math.random() < 0.1) {
                        this.asciiDurationTimer = 0.1 + Math.random() * 0.2;
                        this.asciiPass.uniforms['scale'].value = CONFIG.VISUAL.ASCII.SCALE;
                    }
                }
            }
            // Phase 2: DECAY - Cooldown
            else if (this.glitchTimer > CONFIG.GLITCH.PHASE_3_DURATION) {
                this.glitchPhase = 2;
                // Occasional Glitch Spikes (Logic Tuned)
                if (Math.random() < 0.05) {
                    if (this.glitchPass) {
                        this.glitchPass.enabled = true;
                        this.glitchPass.goWild = (Math.random() < 0.2);
                    }
                    if (this.asciiDurationTimer <= 0 && this.asciiPass && Math.random() < 0.2) {
                        this.asciiDurationTimer = 0.05 + Math.random() * 0.1;
                        this.asciiPass.uniforms['scale'].value = CONFIG.VISUAL.ASCII.SCALE;
                    }
                } else {
                    if (this.glitchPass) this.glitchPass.enabled = false;
                }
            }
            // Phase 3: LONG ECHO - Ghostly particles
            else {
                this.glitchPhase = 3;
                // Very Rare Flickers
                if (Math.random() < 0.01) {
                    if (this.glitchPass) {
                        this.glitchPass.enabled = true;
                        this.glitchPass.goWild = false;
                    }
                } else {
                    if (this.glitchPass) this.glitchPass.enabled = false;
                }

                // Very Rare ASCII
                if (this.asciiDurationTimer <= 0 && this.asciiPass) {
                    if (Math.random() < 0.01) {
                        this.asciiDurationTimer = 0.1 + Math.random() * 0.2;
                        this.asciiPass.uniforms['scale'].value = CONFIG.VISUAL.ASCII.SCALE;
                    }
                }
            }
        } else {
            // Cleanup
            this.shortBurst = false;
            if (this.asciiDurationTimer > 0) {
                this.asciiDurationTimer -= deltaTime;
                if (this.asciiPass) this.asciiPass.enabled = true;
            } else {
                if (this.asciiPass) this.asciiPass.enabled = false;
            }

            if (this.glitchPass) {
                this.glitchPass.enabled = false;
                this.glitchPass.goWild = false;
            }
            this.glitchPhase = 0;
        }
    }

    triggerMitosis() {
        this.shortBurst = true;
        this.glitchTimer = CONFIG.GLITCH.TRIGGER.MITOSIS_DURATION;
        this.asciiDurationTimer = 0;
    }

    triggerExplosion() {
        if (this.glitchPass) {
            this.glitchTimer = CONFIG.GLITCH.PHASE_1_DURATION + CONFIG.GLITCH.PHASE_2_DURATION + CONFIG.GLITCH.PHASE_3_DURATION;
            this.glitchPhase = 1; // Start Impact
            this.glitchPass.enabled = true;
            this.glitchPass.goWild = true; // Start HARD
        }
    }
}
