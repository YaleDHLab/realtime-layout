import * as THREE from 'three';
// points
export default class Points {
  constructor(translations, colors) {
    this.vert = `
    precision highp float;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float transitionPercent;
    uniform vec3 cameraPosition;
    uniform float pointScale;
    uniform float minPointScale;

    attribute vec3 position;
    attribute vec2 translation;
    attribute vec3 color;

    varying vec3 vColor;

    void main() {
      vec3 pos = position + vec3(translation, 0.0);
      pos.x -= 0.5; // center
      pos.y -= 0.5; // center
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = (pointScale / -mvPos.z);
      gl_PointSize = max(gl_PointSize, minPointScale);
      vColor = color;
    }
    `

    this.frag = `
    precision highp float;

    varying vec3 vColor;

    void main() {
      if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }
    `

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), true, 3));
    this.geometry.setAttribute('translation',
      new THREE.InstancedBufferAttribute(translations, 2, true, 1));
    this.geometry.setAttribute('color',
      new THREE.InstancedBufferAttribute(colors, 3, true, 1));

    this.material = new THREE.RawShaderMaterial({
      vertexShader: this.vert,
      fragmentShader: this.frag,
      uniforms: {
        pointScale: {
          type: 'f',
          value: (window.devicePixelRatio / 2) * 10,
        },
        minPointScale: {
          type: 'f',
          value: 5.0,
        }
      }
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }
}