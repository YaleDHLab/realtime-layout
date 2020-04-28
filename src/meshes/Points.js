import * as THREE from 'three';
import { data, translations } from '../lib/data';

// points
export default class Points {
  constructor() {
    this.vert = `
    precision highp float;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float transitionPercent;
    uniform vec3 cameraPosition;
    uniform float pointScale;

    attribute vec3 position;
    attribute vec2 translation;

    void main() {
      vec3 pos = position + vec3(translation, 0.0);
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = (pointScale / -mvPos.z);
    }
    `

    this.frag = `
    precision highp float;

    void main() {
      if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    `

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), true, 3));
    this.geometry.setAttribute('translation',
      new THREE.InstancedBufferAttribute(translations, 2, true, 1));

    this.material = new THREE.RawShaderMaterial({
      vertexShader: this.vert,
      fragmentShader: this.frag,
      uniforms: {
        pointScale: {
          type: 'f',
          value: (window.devicePixelRatio / 2) * 20,
        },
      }
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }
}