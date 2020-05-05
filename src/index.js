import 'babel-polyfill';
import './assets/styles/style';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs-core';
import * as tsne from '@tensorflow/tfjs-tsne';
import { App } from './app';
import Lights from './lights/Lights';
import Points from './meshes/Points';
import { LayoutWorker } from './lib/worker';
import { getData } from './lib/data';

const development = window.location.href.includes('localhost');
if (!development) {
  console.warn = () => {}
  console.log = () => {}
}

/**
* Initialize app
**/

const app = new App('#gl');
app.render();

/**
* Initialize state
**/

const state = {
  method: 'gpu-tsne',
  perplexity: 16,
  n: 1000,
}

/**
* Initialize the points
**/

const { data, translations, color, n } = getData(state);
app.add('points', new Points(translations, color));

/**
* CPU TSNE
**/

if (state.method == 'cpu-tsne') {
  const onData = data => {
    if (!data) return;
    let d = new Float32Array(n*2);
    for (let i=0; i<data.value.length; i++) {
      for (let j=0; j<data.value[i].length; j++) {
        d[2*i+j] = data.value[i][j];
      }
    }
    app.points.geometry.attributes.translation.array = d;
    app.points.geometry.attributes.translation.needsUpdate = true;
  }
  const worker = new LayoutWorker(onData);
  worker.postMessage(data);
}

/**
* GPGPU TSNE
**/

if (state.method == 'gpu-tsne') {
  async function iterativeTsne() {
    const tensor = tf.tensor(data);
    const model = tsne.tsne(tensor, {
      perplexity: 18,
      exaggeration: 2,
      knnMode: 'bruteForce',
    });
    await model.iterateKnn(model.knnIterations());
    const tsneIterations = 1000;
    for (let i=0; i<tsneIterations; ++i) {
      await model.iterate(10);
      const positions = await model.coordinates().data();
      app.points.geometry.attributes.translation.array = new Float32Array(positions);
      app.points.geometry.attributes.translation.needsUpdate = true;
    }
  }
  iterativeTsne();
}

if (development) {
  window.scene = app.scene;
}