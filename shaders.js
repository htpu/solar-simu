const SunShaders = {
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(p+vec3(0,0,0)), hash(p+vec3(1,0,0)),f.x),
                           mix(hash(p+vec3(0,1,0)), hash(p+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(p+vec3(0,0,1)), hash(p+vec3(1,0,1)),f.x),
                           mix(hash(p+vec3(0,1,1)), hash(p+vec3(1,1,1)),f.x),f.y),f.z);
        }

        void main() {
            float n = noise(vPosition * 0.4 + time * 0.15);
            vec3 color1 = vec3(1.0, 0.25, 0.0);
            vec3 color2 = vec3(1.0, 0.85, 0.0);
            vec3 finalColor = mix(color1, color2, n);
            float fresnel = pow(1.0 - dot(vNormal, vec3(0,0,1.0)), 2.5);
            gl_FragColor = vec4(finalColor + fresnel * 0.6, 1.0);
        }
    `
};
