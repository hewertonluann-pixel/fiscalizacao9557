export function inicializarFiltros(renderMeus) {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mesBtns = document.querySelector('#mesBtns');

  meses.forEach((m, i) => {
    const b = document.createElement('button');
    b.textContent = m;
    b.className = 'pill';
    b.onclick = () => {
      document.querySelectorAll('#mesBtns .pill').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      window.mesAtivo = i + 1;
      window.anoAtivo = parseInt(document.querySelector('#anoFiltro').value, 10);
      renderMeus();
    };
    mesBtns.appendChild(b);
  });
}
