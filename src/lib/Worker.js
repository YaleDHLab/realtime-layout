import { translations } from './data';
const cpuTsnePath = require('file-loader!./karpathy');

export class LayoutWorker {
  constructor(onData) {
    const self = this;
    const s = this.getString();
    const blob = new Blob([s], {type: 'application/javascript'});
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = e => onData(self.onMessage(e));
  }

  postMessage(data) {
    this.worker.postMessage({
      data: data,
      path: window.location.href.replace('index.html', '') + cpuTsnePath,
    });
  }

  onMessage(e) {
    if (!e.data.value) return;
    let d = new Float32Array(translations.length);
    for (let i=0; i<e.data.value.length; i++) {
      for (let j=0; j<e.data.value[i].length; j++) {
        d[2*i+j] = e.data.value[i][j];
      }
    }
    return d;
  }

  getString() {
    return `
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
  }
}