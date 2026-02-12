import * as THREE from 'three';

/**
 * AsciiShader
 * Procedurally generates text-like patterns based on luminance.
 * 
 * Uniforms:
 * - tDiffuse: Texture
 * - resolution: Vector2
 * - scale: float (Character size logic)
 * - opacity: float
 */
export const AsciiShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2() },
        'scale': { value: 1.0 }, // Character density
        'uColor': { value: new THREE.Color(0x00ff33) }, // Matrix Green Default
        'opacity': { value: 1.0 }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float scale;
        uniform vec3 uColor;
        uniform float opacity;
        varying vec2 vUv;

        // Pattern matching function
        // Returns 1.0 if pixel 'p' is inside the character shape defined for 'level'
        float getCharacter(int level, vec2 p) {
            // p is in range [-1, 1] for x and y
            
            // 0: Space
            if (level == 0) return 0.0;
            
            // 1: Dot .
            if (level == 1) {
                 return step(length(p - vec2(0.0, -0.6)), 0.15);
            }
            // 2: Colon :
            if (level == 2) {
                 return step(length(p - vec2(0.0, -0.4)), 0.15) + step(length(p - vec2(0.0, 0.4)), 0.15);
            }
            // 3: Minus -
            if (level == 3) {
                 return step(abs(p.y), 0.1) * step(abs(p.x), 0.6);
            }
            // 4: Plus +
            if (level == 4) {
                 return max(step(abs(p.y), 0.1) * step(abs(p.x), 0.6), 
                           step(abs(p.x), 0.1) * step(abs(p.y), 0.6));
            }
            // 5: Star *
            if (level == 5) {
                 vec2 r1 = vec2(p.x * 0.5 - p.y * 0.866, p.x * 0.866 + p.y * 0.5); // rotate 60
                 vec2 r2 = vec2(p.x * 0.5 + p.y * 0.866, -p.x * 0.866 + p.y * 0.5); // rotate -60
                 float l1 = step(abs(p.x), 0.1) * step(abs(p.y), 0.6); // |
                 float l2 = step(abs(r1.x), 0.1) * step(abs(r1.y), 0.6); // /
                 float l3 = step(abs(r2.x), 0.1) * step(abs(r2.y), 0.6); // \
                 return max(max(l1, l2), l3);
            }
            // 6: 'o' (Small circle)
            if (level == 6) {
                 float d = length(p);
                 return step(abs(d - 0.4), 0.12);
            }
            // 7: '8' (Double circle)
            if (level == 7) {
                 float d1 = length(p - vec2(0.0, 0.35));
                 float d2 = length(p - vec2(0.0, -0.35));
                 return max(step(abs(d1 - 0.25), 0.1), step(abs(d2 - 0.25), 0.1));
            }
            // 8: Block @ (Full fill mostly)
            if (level >= 8) {
                 // return 1.0; 
                 // Let's make it an @-like shape: outer circle + inner a
                 float d = length(p);
                 float outer = step(abs(d - 0.5), 0.15);
                 float middle = step(length(p - vec2(0.1, -0.1)), 0.2);
                 return max(outer, middle);
            }
            return 0.0;
        }

        void main() {
            vec2 uv = vUv;
            // Grid setup
            vec2 cell = resolution / scale; 
            vec2 grid_uv = floor(uv * cell) / cell;
            
            // Sample luminance
            vec4 color = texture2D(tDiffuse, grid_uv);
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

            // Quantize level (0 to 8)
            int level = int(gray * 9.0);
            
            // Local UV for drawing (-1 to 1)
            vec2 local_uv = fract(uv * cell) * 2.0 - 1.0; 

            // Get character mask
            float charMask = getCharacter(level, local_uv);
            
            // Coloring
            vec3 asciiColor = uColor * charMask * (0.5 + gray * 0.5);
            
            // Output
            gl_FragColor = vec4(asciiColor, 1.0);
        }
    `
};
