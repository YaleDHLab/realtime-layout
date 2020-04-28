import 'babel-polyfill'
import './assets/styles/style'
import { LayoutWorker } from './lib/worker';
import { data } from './lib/data';
import * as THREE from 'three';
import { App } from './app';
import Lights from './lights/Lights';
import Points from './meshes/Points';

const development = window.location.href.includes('localhost');
if (!development) {
  console.warn = () => {}
  console.log = () => {}
}

/**
* Initialize app
**/

const app = new App('#gl');
app.add('points', new Points());
app.add('lights', new Lights());
app.render();

/**
* Start the web worker
**/

const onData = data => {
  if (!data ||
      !data.length ||
      data.length != app.points.geometry.attributes.translation.array.length) return;
  app.points.geometry.attributes.translation.array = data;
  app.points.geometry.attributes.translation.needsUpdate = true;
}

const worker = new LayoutWorker(onData);
worker.postMessage(data);

/**
* Development
**/

if (development) {
  window.THREE = THREE;
  window.scene = app.scene;
  window.app = app;
}