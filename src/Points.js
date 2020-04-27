import * as THREE from 'three';
import karpathy from './karpathy';

// data
const n = 1000;
let d = [];
for (let i=0; i<n; i++) {
  d[i] = [Math.random(), Math.random(), Math.random()]
}
const translations = new Float32Array(n * 3);
const data = d;

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


    var s = `
      self.onmessage = function(event) {
        // load karpathy tsne (karpathy exports to window scope)
        window = this;
        importScripts(event.data.path);

        // initialize tsne
        var tsne = new tsnejs.tSNE({});
        tsne.initDataRaw(event.data.data);

        // stream results back to parent
        var process = function* () {
          for (var i=0; i<500; i++) {
            tsne.step();
            yield tsne.getSolution();
          }
        };

        const it = process();
        let result;
        do {
          postMessage(result = it.next());
        } while(!result.done);
      };
    `
    var blob = new Blob([s], {type: 'application/javascript'});
    var worker = new Worker(URL.createObjectURL(blob));

    var self = this;
    worker.onmessage = e => {
      if (!e.data.value) return;
      let d = new Float32Array(translations.length);
      for (let i=0; i<e.data.value.length; i++) {
        for (let j=0; j<e.data.value[i].length; j++) {
          d[2*i+j] = e.data.value[i][j];
        }
      }
      self.geometry.attributes.translation.array = d;
      self.geometry.attributes.translation.needsUpdate = true;
    }
    worker.postMessage({
      data: data,
      path: window.location.href + require('file-loader!./karpathy'),
    });
  }
}