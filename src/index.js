import 'babel-polyfill';
import './assets/styles/style';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs-core';
import * as tsne from '@tensorflow/tfjs-tsne';
import { UMAP } from 'umap-js';
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
  method: 'tsne-cpu',
  n: 1000,
}

/**
* Initialize the points
**/

const { data, translations, color, n } = getData(state);
app.add('points', new Points(translations, color));

/**
* Helpers
**/

const updatePositionBuffer = l => {
  app.points.geometry.attributes.translation.array = l;
  app.points.geometry.attributes.translation.needsUpdate = true;
}

const flatten = l => {
  let arr = [], n = 0;
  for (let i=0; i<l.length; i++) {
    for (let j=0; j<l[i].length; j++) arr[n++] = l[i][j];
  }
  return arr;
}

/**
* CPU TSNE
**/

if (state.method == 'tsne-cpu') {
  const onData = data => {
    if (data) updatePositionBuffer(new Float32Array(flatten(data.value)));
  }
  const worker = new LayoutWorker('tsne', onData);
  window.oworker = worker;
  worker.postMessage(data);
}

/**
* GPGPU TSNE
**/

if (state.method == 'tsne-gpu') {
  async function iterativeTsne() {
    const model = tsne.tsne(tf.tensor(data));
    await model.iterateKnn(model.knnIterations());
    for (let i=0; i<1000; ++i) {
      await model.iterate(1);
      updatePositionBuffer(new Float32Array(await model.coordinates().data()));
    }
  }
  iterativeTsne();
}

/**
* UMAP
**/

if (state.method == 'umap') {
  const onData = data => {
    if (data) updatePositionBuffer(new Float32Array(flatten(data.value)));
  }
  const worker = new LayoutWorker('umap', onData);
  worker.postMessage(data);
}

if (development) {
  window.scene = app.scene;
}