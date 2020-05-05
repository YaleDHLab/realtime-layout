const cpuTsnePath = require('file-loader!./karpathy');

export class LayoutWorker {
  constructor(onData) {
    const self = this;
    const s = this.getString('cpu');
    const blob = new Blob([s], {type: 'application/javascript'});
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = e => onData(self.onMessage(e));
  }

  postMessage(data) {
    const path = window.location.href.replace('index.html', '');
    this.worker.postMessage({
      data: data,
      path: path + cpuTsnePath,
    });
  }

  onMessage(e) {
    if (!e.data.value) return;
    return e.data;
  }

  getString(type) {
    if (type != 'cpu') return;
    return `
      self.onmessage = function(event) {
        // load karpathy tsne (karpathy exports to window scope)
        window = this;
        importScripts(event.data.path);

        // initialize tsne
        const tsne = new tsnejs.tSNE({});
        tsne.initDataRaw(event.data.data);

        // stream results back to parent
        const process = function* () {
          for (let i=0; i<500; i++) {
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