export const getData = state => {
  const fake = true;
  let d = [];
  let t = [];
  let c = [];

  for (let i=0; i<state.n; i++) {
    var color = [Math.random(), Math.random(), Math.random()];
    c = c.concat(color);
    d[i] = color;
  }
  c = new Float32Array(c);
  t = new Float32Array(state.n * 3);

  return {
    data: d,
    translations: t,
    color: c,
    n: state.n,
  }
}