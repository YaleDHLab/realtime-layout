import 'babel-polyfill'
import './assets/styles/style'
import { app } from './app'

function render() {
  requestAnimationFrame(render);
  app.stats.begin();
  app.renderer.render(app.scene, app.camera);
  app.controls.update();
  app.stats.end();
}

render();